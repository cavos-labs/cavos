use anyhow::{bail, Context, Result};
use serde::Serialize;

const LAUNCHER_SOCKET: &str = "/run/container_launcher/teeserver.sock";
const TOKEN_ENDPOINT: &str = "http://localhost/v1/token";

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
    // Use a real HTTP client here. In particular, the launcher is allowed to
    // return a chunked response; parsing the socket bytes as a raw HTTP message
    // leaves the transfer framing in the token and makes attestation fail.
    let client = reqwest::Client::builder()
        .unix_socket(LAUNCHER_SOCKET)
        .build()
        .context("failed to configure Confidential Space launcher client")?;
    let response = client
        .post(TOKEN_ENDPOINT)
        .json(&TokenRequest {
            audience,
            token_type: "OIDC",
            nonces,
        })
        .send()
        .await
        .context("Confidential Space launcher socket unavailable")?;
    let status = response.status();
    if !status.is_success() {
        bail!("launcher rejected attestation request with HTTP {status}");
    }

    let body = response
        .text()
        .await
        .context("failed to read launcher token response")?;
    extract_token(&body)
}

fn extract_token(body: &str) -> Result<String> {
    let trimmed = body.trim();
    if trimmed.is_empty() {
        bail!("launcher response omitted token");
    }

    // The documented launcher response is the raw JWT. Accept the JSON shape
    // too so this remains compatible with launcher versions that wrap it.
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
        return value
            .get("token")
            .and_then(|value| value.as_str())
            .or_else(|| value.as_str())
            .map(ToOwned::to_owned)
            .ok_or_else(|| anyhow::anyhow!("launcher response omitted token"));
    }

    Ok(trimmed.to_owned())
}

#[cfg(test)]
mod tests {
    use super::extract_token;

    #[test]
    fn accepts_raw_jwt_response() {
        assert_eq!(
            extract_token("  header.payload.signature\n").unwrap(),
            "header.payload.signature"
        );
    }

    #[test]
    fn accepts_wrapped_token_response() {
        assert_eq!(
            extract_token(r#"{"token":"header.payload.signature"}"#).unwrap(),
            "header.payload.signature"
        );
    }

    #[test]
    fn rejects_empty_response() {
        assert!(extract_token(" \n").is_err());
    }

    #[test]
    fn rejects_json_without_token() {
        assert!(extract_token(r#"{"status":"ok"}"#).is_err());
    }
}
