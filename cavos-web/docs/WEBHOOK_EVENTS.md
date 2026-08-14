# Cavos webhook events

Webhook payloads use schema version `2026-07-21`. Deliveries include a unique `X-Cavos-Delivery` id and `X-Cavos-Signature-256: sha256=<hex>` computed over the exact request body with the endpoint signing secret. Consumers must verify the signature and use the delivery id for idempotency.

## Envelope

```json
{
  "version": "2026-07-21",
  "delivery_id": "uuid",
  "event": {
    "id": "uuid",
    "type": "wallet.created",
    "status": "success",
    "severity": "info",
    "network": "solana-mainnet",
    "request_id": "req_...",
    "tx_reference": null,
    "created_at": "2026-07-21T12:00:00.000Z",
    "metadata": {}
  }
}
```

## Event catalog

- `wallet.creation_requested`, `wallet.created`, `wallet.updated`, `wallet.creation_failed`, `wallet.retrieved`
- `device.addition_requested`, `device.addition_approved`, `device.registered`, `device.removed`
- `transaction.recorded`, `transaction.failed`
- `relay.accepted`, `relay.rejected`, `relay.submitted`
- `sponsorship.approved`, `sponsorship.rejected`
- `gas.deposit_confirmed`, `gas.deposit_failed`, `gas.balance_low`
- `api.authentication_failed`, `api.rate_limited`

Additional event types may be introduced without changing the envelope version. Endpoints should ignore unknown fields and events they do not consume.

## Delivery behavior

- HTTPS endpoints only.
- Eight-second timeout.
- At-least-once delivery with up to five attempts.
- Delivery order is not guaranteed.
- Detailed deliveries and Cavos Events are retained for 30 days.
- Payloads exclude emails, secrets, tokens, encrypted wallet blobs, private keys, and device public-key coordinates.
