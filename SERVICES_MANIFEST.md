# RNK System Optimizer — Vortex Quantum Services Manifest

**Generated:** 2026-04-20
**Status:** Active deployment reference

## Homelab Master Server

- **Host:** `homelab.local`
- **LAN IP:** `192.168.1.52`
- **Direct maintenance IP:** `192.168.1.10`
- **User:** `rnk`
- **Deployment path:** `/home/rnk/vortex-quantum/vq1`

## Running Services

- `vq-master` on port `9876`
- `lisa` on port `9877`

## Worker Placement

- **OCI workers:** one per OCI instance, private only
- **Hetzner worker:** private only
- All workers should be reachable from the homelab master over a private path or overlay network.

## API Endpoints

### Vortex Quantum Master

- Health check: `GET https://api.rnk-enterprise.us/health`
- Dispatch: `POST https://api.rnk-enterprise.us/api/process`
- Engines: `GET https://api.rnk-enterprise.us/api/engines`
- Quantum bridge components: `GET https://api.rnk-enterprise.us/quantum-bridge/components`

> If Vortex Quantum is still deployed behind plain HTTP internally, expose it through an HTTPS reverse proxy before using it from HTTPS Foundry.

### LISA Authority

- Evaluate: `POST https://192.168.1.52:9877/api/evaluate`
- Detect circumvention: `POST https://192.168.1.52:9877/api/detect-circumvention`
- Record probe: `POST https://192.168.1.52:9877/api/record-probe`
- Audit log: `POST https://192.168.1.52:9877/api/audit-log`

## Optimizer Configuration

Use these values in the optimizer environment:

- `VORTEX_QUANTUM_API_URL=https://api.rnk-enterprise.us`
- `VORTEX_QUANTUM_API_KEY=your-patreon-key`
- `LISA_API_URL=https://192.168.1.52:9877`

Use HTTPS-capable endpoints or a TLS proxy when Foundry itself is served over HTTPS.
For browser access, prefer `https://api.rnk-enterprise.us` for Vortex Quantum and keep it routed to `http://127.0.0.1:9876` on the homelab master through Cloudflare Tunnel or an equivalent HTTPS proxy.

## PM2 Commands

- `pm2 list`
- `pm2 logs vq-master`
- `pm2 logs lisa`
- `pm2 restart vq-master`
- `pm2 restart lisa`
