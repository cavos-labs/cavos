use anyhow::{bail, Context, Result};
use serde::Serialize;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::UnixStream,
};

const LAUNCHER_SOCKET: &str = "/run/container_launcher/teeserver.sock";

#[derive(Serialize)]
struct TokenRequest<'a> {
    audience: &'a str,
    token_type: &'static str,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    nonces: Vec<&'a str>,
}

/// Request an OIDC attestation token from the production Confidential Space
/// launcher. The Unix socket is the only supported path; there is intentionally
/// no development fallback that could silently bypass attestation.
pub async fn attestation_token(audience: &str, nonces: Vec<&str>) -> Result<String> {
    let body = serde_json::to_vec(&TokenRequest {
        audience,
        token_type: "OIDC",
        nonces,
    })?;
    let mut stream = UnixStream::connect(LAUNCHER_SOCKET)
        .await
        .context("Confidential Space launcher socket unavailable")?;
    let request = format!(
        "POST /v1/token HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    stream.write_all(request.as_bytes()).await?;
    stream.write_all(&body).await?;
    stream.shutdown().await?;

    let mut response = Vec::new();
    stream.read_to_end(&mut response).await?;
    let split = response
        .windows(4)
        .position(|w| w == b"\r\n\r\n")
        .ok_or_else(|| anyhow::anyhow!("malformed launcher HTTP response"))?;
    let headers = std::str::from_utf8(&response[..split])?;
    if !headers.starts_with("HTTP/1.1 200") && !headers.starts_with("HTTP/1.0 200") {
        bail!("launcher rejected attestation request: {headers}");
    }
    let body = &response[split + 4..];
    let value: serde_json::Value = match serde_json::from_slice(body) {
        Ok(value) => value,
        Err(_) => serde_json::Value::String(
            std::str::from_utf8(body)
                .context("invalid launcher token response")?
                .trim()
                .to_owned(),
        ),
    };
    value
        .get("token")
        .and_then(|v| v.as_str())
        .or_else(|| value.as_str())
        .map(ToOwned::to_owned)
        .ok_or_else(|| anyhow::anyhow!("launcher response omitted token"))
}
