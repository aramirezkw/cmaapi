# Hosting the KWIQ CMA prototype

The prototype is one small Node server (`server.js`) plus static files. It packages as a container (`Dockerfile`) and runs on any container host: Cloud Run, Render, Fly.io, an internal Kubernetes cluster, etc.

## Before you deploy: get sign-off

The hosted copy shows production MLS data to other people through App 5201's credentials. Confirm with the API team (and whoever owns MLS data compliance) that:

- [ ] This app may be used for an internal prototype that other KW staff can open.
- [ ] Showing sold data, photos, and listing courtesy text this way follows the MLS display rules that apply. The report already shows "Listing courtesy of …", respects `displayListing` / `displayPhoto`, and says it isn't an appraisal.
- [ ] You get **separate credentials for the hosted copy.** Each app can hold only one token at a time, so a hosted server and your laptop sharing App 5201 will keep cancelling each other's tokens.

## Configuration

Set these as the host's secret environment variables. Never bake them into the image; `.env` is excluded from it.

| Variable | Value |
|---|---|
| `ULS_ENV` | `prod` (QA rejects App 5201) |
| `ULS_CLIENT_ID` | the hosted app's client ID |
| `ULS_CLIENT_SECRET` | the hosted app's client secret |
| `ACCESS_PASSWORD` | optional shared password; see Access below |
| `PORT` | set by most hosts automatically; defaults to 8080 in the container |

`HOST=0.0.0.0` is already set in the image. Locally the server binds to `127.0.0.1`, so it's only reachable from your own machine.

## Access

Pick one, in order of preference:

1. **KW sign-in in front of it.** For example Google Cloud IAP on Cloud Run, or an Okta-protected reverse proxy. Only signed-in KW staff reach the app. This needs IT.
2. **Shared password.** Set `ACCESS_PASSWORD` and the browser asks for it, with any username. Only use this over HTTPS (all the hosts above provide it). It's a stopgap, not real access control.

Don't host it with neither.

## Built-in protections

- The proxy only relays the searches the CMA makes: address, ZIP code, or a point with a radius up to 3 miles, a fixed set of filters, and at most 100 results per page. Anything else gets a 400.
- 240 API requests per minute per visitor, which is about 10 CMAs.
- `/healthz` returns `ok` for the host's health checks, without needing the password.
- One token is cached per server. **Run a single instance** (e.g. Cloud Run `--max-instances=1`), or instances will cancel each other's tokens.

## Example: Google Cloud Run

```bash
gcloud run deploy kwiq-cma \
  --source . \
  --region us-central1 \
  --max-instances 1 \
  --no-allow-unauthenticated \
  --set-env-vars ULS_ENV=prod \
  --set-secrets ULS_CLIENT_ID=uls-client-id:latest,ULS_CLIENT_SECRET=uls-client-secret:latest
```

`--no-allow-unauthenticated` keeps it private. Then grant access to a KW Google group, or put IAP in front, so people can open it in a browser.

## Run the container locally

```bash
docker build -t kwiq-cma .
docker run --rm -p 8080:8080 --env-file .env kwiq-cma
```

Then open http://localhost:8080. Stop your `node server.js` first; both would use the same credentials.
