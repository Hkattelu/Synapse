# License verification and update detection (Electron)

This app includes a desktop-only license verification flow and an update checker that reads metadata from a hosted JSON feed.

Applies to packaged and dev desktop builds (`npm run desktop:*`). The web build ignores these features.

## Configuration (env vars)

Set these in your shell/CI prior to launching/building Electron. All are optional; the UI will explain when they’re unset.

License API

- `SYNAPSE_LICENSE_API_URL` — URL to POST license validation requests. The request payload is:
  ```json
  {
    "license": "<user-entered string>",
    "appVersion": "0.0.0",
    "device": { "platform": "win32", "arch": "x64", "hostname": "…" }
  }
  ```
  Expected response (flexible mapping):
  ```json
  {
    "status": "valid|invalid|expired|unknown",
    "expiresAt": "2026-01-01",
    "user": { "email": "…" },
    "message": "…"
  }
  ```
  Alternative shapes are supported (e.g., `{ "license": { "status": "valid" } }`).
- `SYNAPSE_LICENSE_API_HEADERS_JSON` — JSON string of extra headers to send (e.g., `{ "x-api-key": "…" }`).
- `SYNAPSE_LICENSE_REFRESH_MS` — refresh cadence in ms (default 43200000 = 12h).

Update feed

- `SYNAPSE_UPDATE_FEED_URL` — URL to GET update metadata (JSON). Supported shapes:
  - `{ "latestVersion": "1.2.3", "downloads": { "win32-x64": "https://…" } }`
  - `{ "version": "1.2.3", "platforms": { "darwin-arm64": { "url": "https://…" } } }`
  - GitHub‑like: `{ "tag": "1.2.3", "assets": [{ "name": "…win32-x64…", "browser_download_url": "https://…" }] }`
- `SYNAPSE_UPDATE_FEED_HEADERS_JSON` — JSON string of extra headers to send when fetching the feed.

## Where data is stored

- License key is encrypted using Electron `safeStorage` and saved to the app’s userData directory as `license.bin`.
- Validation status is cached at `license-status.json` in the same directory. The license string itself is never written to logs or plaintext files.

## User flows

License

- On first launch without a license, a modal prompts for the license. The app is gated until a valid license is saved.
- The status can be: valid, invalid, expired, or unknown.
  - Invalid/expired: core UI is blocked until a working license is provided.
  - Unknown (e.g., offline): once a license has been validated at least once, usage is allowed; the UI shows a warning.
- Users can re‑validate or remove the saved license from the modal.

Updates

- The app checks for updates at startup and when the user selects Help → Check for Updates…
- If a newer version is available, a thin banner appears with a button to open the download URL for the current platform.
- This implementation is detect‑and‑notify only. It does not auto‑download/install.

## Telemetry & logging

- Main process logs structured JSON lines for license and update checks. No license keys or secrets are logged.

## Testing

- Unit tests cover version comparison, update payload parsing, and server‑to‑status mapping. Run with `npm test`.

## Open questions

- Exact License API schema and auth model.
- Update feed canonical shape and URL.
- Whether to add in‑app auto‑update in a future pass.
