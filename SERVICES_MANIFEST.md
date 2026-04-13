# RNK System Optimizer — Services Manifest

**Generated:** 2026-04-13
**Status:** Active deployment reference

## Services Server

- **Host:** `services.local`
- **LAN IP:** `192.168.1.52`
- **Direct maintenance IP:** `192.168.1.10`
- **User:** `rnk`
- **Deployment path:** `/home/rnk/atlas-deployment`

## Running Services

- `atlas-master` on port `9876`
- `lisa` on port `9877`

## API Endpoints

### Atlas Master

- Health check: `GET http://192.168.1.52:9876/api/health`
- Dispatch: `POST http://192.168.1.52:9876/api/dispatch`
- Metrics stream: `GET http://192.168.1.52:9876/api/metrics/stream`
- Validate key: `POST http://192.168.1.52:9876/api/validate-key`

### LISA Authority

- Evaluate: `POST http://192.168.1.52:9877/api/evaluate`
- Detect circumvention: `POST http://192.168.1.52:9877/api/detect-circumvention`
- Record probe: `POST http://192.168.1.52:9877/api/record-probe`
- Audit log: `POST http://192.168.1.52:9877/api/audit-log`

## Optimizer Configuration

Use these values in the optimizer environment:

- `ATLAS_API_URL=https://192.168.1.52:9876`
- `ATLAS_API_KEY=your-patreon-key`
- `LISA_API_URL=https://192.168.1.52:9877`

## PM2 Commands

- `pm2 list`
- `pm2 logs atlas-master`
- `pm2 logs lisa`
- `pm2 restart atlas-master`
- `pm2 restart lisa`
