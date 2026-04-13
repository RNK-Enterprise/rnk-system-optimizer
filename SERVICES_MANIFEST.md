# RNK Vortex System Optimizer v3.1.0 — Services Manifest

**Generated:** 2025-04-13 09:52 UTC  
**Services Server:** 192.168.1.52 (services.local)  
**Deployment Status:** ACTIVE DEPLOYMENT IN PROGRESS

---

## Executive Summary

The RNK Vortex System Optimizer v3.1.0 has been redirected to use the **Atlas Master API** (replacing Vortex Quantum v3.0.x). Both the **Atlas Dispatch Engine** and **LISA Authority** are now deployed on the services infrastructure server (homelab, isolated from production).

### Key Changes from v3.0.8.6
- **VQ Integration:** Removed round-robin cluster discovery, multi-connector bridge patterns
- **Atlas Integration:** Thin HTTPS REST client to single endpoint (eventually HTTPS)
- **LISA Integration:** Monitored but non-blocking (selective mode: LISA checks run but don't block optimizer dispatch)
- **Architecture:** HTTP/REST only — no embedded orchestration library, no code execution
- **UI/UX:** Unchanged (same toggles, metrics tabs, recommendations flow)

---

## Deployment Infrastructure

### Services Server Hardware
| Property | Value |
|----------|-------|
| **Hostname** | services.local |
| **IP (LAN)** | 192.168.1.52 |
| **IP (Direct Maintenance)** | 192.168.1.10 |
| **OS** | Ubuntu 6.8.0-107-generic (x86_64) |
| **SSH User** | rnk |
| **Auth** | SSH key-based |
| **Storage** | 112GB Expanded LVM (active) |
| **Process Manager** | PM2 (v5.3.x+) |

### Deployment Directory
```
/home/rnk/atlas-deployment/
├── atlas-master-01/          ← Atlas API Server (running)
│   ├── atlas-api-server.js
│   ├── atlas-auth-middleware.js
│   ├── atlas-ai-service.js
│   ├── .env
│   ├── ecosystem.config.cjs
│   └── package.json
├── Lisa/                      ← LISA Authority (deployment in progress)
│   ├── lisa-authority/        ← Core LISA instance
│   ├── lisa-intel-core/
│   ├── lisa-intel-service/
│   ├── lisa-knowledge/
│   ├── lisa-saas/
│   ├── lisa-ui/
│   ├── lisa-detections/
│   ├── lisa-feed-connectors/
│   ├── lisa-friend-setup/
│   ├── lisa-knowledge-ingest/
│   ├── lisa-playbooks/
│   └── CONTROL_CENTER_BUILD_PLAN.md
```

---

## Active Services on Services Server

### Primary Optimizer Services (New)

| ID | Name | Port | Status | Memory | Version | Entry Point |
|----|------|------|--------|--------|---------|-------------|
| 18 | **atlas-master** | `9876` | ✅ ONLINE | 46.5MB | 4.0.0 | `atlas-api-server.js` |
| ⏳ | **lisa-authority** | `9877` | *Initializing* | *TBD* | 1.0.0 | `lisa-authority/index.js` |

**✅ Atlas Master API Health (verified 2025-04-13 09:52):**
```json
{
  "status": "online",
  "engine": "atlas",
  "libraries": 20662,
  "version": "4.0.0",
  "nodeRole": "analysis-node",
  "nodeName": "atlas-analysis-02",
  "uptime": 272383.34,
  "timestamp": 1776074348935,
  "lisa": {
    "healthy": true,
    "mode": "monitor",
    "url": "http://localhost:9000"
  }
}
```

### Legacy Services (Pre-Deployment)

| ID | Name | Port | Status | Memory | Version | Notes |
|----|------|------|--------|--------|---------|-------|
| — | halo-server | — | online | — | — | Foundry VTT instance |
| — | vq2-api | — | online | — | 3.0.0 | ⚠️ **DEPRECATED** — Being replaced by atlas-master |
| — | autonomous-lisa | — | online | — | 1.0.0 | Existing LISA variant (separate) |
| — | atlas-analysis-02 | — | online | — | 4.0.0 | Pre-deployed Atlas node |
| — | ghost-comms | — | online | — | — | — |
| — | mail-dispatcher | — | online | — | — | — |
| — | reporting-api | — | online | — | — | — |
| — | raven-crm | — | online | — | — | — |
| — | rnk-auth | — | online | — | — | — |
| — | rnk-proxy | — | online | — | — | — |
| — | rnk-website | — | online | — | 16.2.1 | — |
| — | ollama | — | online | — | — | — |
| — | lisa-worker-01/02/03/04-tunnel | — | online | — | — | 4 LISA worker tunnels |
| — | adaptive-sender | — | online | — | — | — |
| — | mail-ui | — | stopped | — | — | — |
| — | *11 additional services* | — | various | — | — | *Post-deployment inventory* |

*Full PM2 inventory deferred to post-deployment network check*

---

## Atlas API Specification

### Base URL
```
http://192.168.1.52:9876
```

### Core Endpoints

#### 1. Health Check
```http
GET /health

Response (200 OK):
{
  "status": "online",
  "engine": "atlas",
  "libraries": 20662,
  "version": "4.0.0",
  "nodeRole": "analysis-node",
  "nodeName": "atlas-analysis-02",
  "uptime": 272383.340984055,
  "timestamp": 1776074348935,
  "lisa": { "healthy": true, "mode": "monitor", "url": "http://localhost:9000" }
}
```

#### 2. Dispatch Query (Legacy VQ Compatibility)
```http
POST /process

Request:
{
  "query": "set-turbo-mode:power-efficiency",
  "context": {
    "engine": "atlas-system-monitor-engine",
    "turboMode": "power-efficiency",
    "userId": "user-123"
  }
}

Response (200 OK):
{
  "response": "Query processed via atlas-system-monitor-engine.",
  "data": {
    "type": "atlas-dispatch",
    "libraryName": "atlas-system-monitor-engine",
    "turboName": "atlas-system-monitor-engine"
  },
  "enginesUsed": ["atlas-system-monitor-engine"]
}
```

#### 3. Library Registry
```http
GET /registry/count

Response (200 OK):
{
  "total": 20662,
  "certified": 20662,
  "pending": 0
}
```

#### 4. Dispatcher Status (New Recommended Types Support)
```http
POST /dispatch

Request:
{
  "recommendationType": "set-turbo-mode",
  "parameters": {
    "mode": "power-efficiency",
    "duration": 3600
  },
  "auditContext": {
    "userId": "user-123",
    "sessionId": "sess-abc123",
    "timestamp": 1776074348935
  }
}

Response (200 OK):
{
  "success": true,
  "dispatchId": "disp-xyz789",
  "recommendation": {
    "type": "set-turbo-mode",
    "appliedMode": "power-efficiency",
    "estimatedImpact": {
      "cpuReduction": "35%",
      "powerUsage": "28% lower"
    }
  },
  "auditTrail": {
    "dispatchId": "disp-xyz789",
    "userId": "user-123",
    "recommendationType": "set-turbo-mode",
    "result": "accepted",
    "timestamp": 1776074348935
  },
  "lisa": {
    "checked": true,
    "authorized": true
  }
}
```

#### 5. Audit Trail Export
```http
GET /audit/export?userId=user-123&startTime=1776000000000&endTime=1776074348935

Response (200 OK):
[
  {
    "dispatchId": "disp-xyz789",
    "userId": "user-123",
    "recommendationType": "set-turbo-mode",
    "parameters": { "mode": "power-efficiency" },
    "result": "accepted",
    "timestamp": 1776074348935
  }
]
```

### Authentication

| Method | Header | Required |
|--------|--------|----------|
| API Key | `X-API-Key: <key>` | Optional (if enabled) |
| Admin Key | `X-Admin-Key: <key>` | For /admin routes only |
| JWT | `Authorization: Bearer <token>` | For session-based auth |

---

## LISA Authority Configuration

### Connection Details
- **Host:** 192.168.1.52
- **Port:** 9877 (expected, configurable)
- **Protocol:** HTTP (upgradeable to HTTPS)
- **Health Endpoint:** `http://192.168.1.52:9877/health`

### Integration Mode (Atlas-LISA Bridge)
```
Atlas operates in "selective" mode:
├─ LISA Health Check: Runs on startup + periodic (5-minute intervals)
├─ Request Blocking: DISABLED (requests proceed even if LISA unavailable)
├─ Authorization: ENABLED (LISA validates user/request before dispatch)
├─ Audit Tracking: ENABLED (all dispatch actions logged to LISA state)
└─ Fallback Behavior: Atlas responds with 200 + audit trail even if LISA unreachable
```

### LISA Shared State Path
```
/home/rnk/atlas-deployment/Lisa/shared-state/
├── atlas-master-01.json        (Atlas node state)
├── lisa-authority.json         (LISA node state)
└── [other node states]
```

---

## Optimizer Module Configuration

### Environment Variables
The optimizer module (v3.1.0) expects the following `.env`:

```env
# Atlas Configuration
ATLAS_API_URL=http://192.168.1.52:9876
ATLAS_API_KEY=<optional-key>

# LISA Configuration
LISA_URL=http://192.168.1.52:9877
LISA_ENABLED=true
LISA_MODE=selective

# Module Behavior
ENABLE_DIAGNOSTICS=true
ENABLE_AUDIT_TRAIL=true
AUDIT_RETENTION_DAYS=90
EXPORT_FORMAT=json
CONSENT_MODAL_ENABLED=true

# Security
WHITELISTED_RECOMMENDATIONS=set-turbo-mode,shadow-dispatch,dynamic-frequency-scaling,power-limits,profile-override,latency-reduction
```

### Recommended Types (Atlas-Enabled)

1. **set-turbo-mode**
   - Parameters: `mode` (power-efficiency | throughput | balanced)
   - API Route: `POST /dispatch`
   - LISA Check: Required (user authorization)
   - Auditability: Full trail captured

2. **shadow-dispatch**
   - Parameters: `dispatchId`, `userId`, `recommendation`
   - API Route: `POST /dispatch`
   - LISA Check: Required
   - Auditability: Full trail + consent log

3. **dynamic-frequency-scaling**
   - Parameters: `cpuCores` (array), `targetFrequency` (MHz)
   - API Route: `POST /dispatch`
   - LISA Check: Required
   - Auditability: Full trail

4. **power-limits**
   - Parameters: `tdp` (Watts), `duration` (seconds)
   - API Route: `POST /dispatch`
   - LISA Check: Required
   - Auditability: Full trail

5. **profile-override**
   - Parameters: `profileName` (string), `durationMinutes` (int)
   - API Route: `POST /dispatch`
   - LISA Check: Required
   - Auditability: Full trail

6. **latency-reduction**
   - Parameters: `targetLatency` (ms), `priority` (high | medium | low)
   - API Route: `POST /dispatch`
   - LISA Check: Required
   - Auditability: Full trail

---

## Deployment Status & Next Steps

### ✅ Completed
- [x] Atlas Master API Server deployed to /home/rnk/atlas-deployment/atlas-master-01/
- [x] Atlas Master started with PM2 (ID 18, PID 116930, status online)
- [x] Atlas health endpoint verified (20,662 libraries certified)
- [x] LISA Authority code copied to /home/rnk/atlas-deployment/Lisa/lisa-authority/
- [x] npm install initiated for LISA Authority
- [x] PM2 start command queued for LISA Authority

### ⏳ In Progress
- [ ] LISA Authority npm install completion (large module tree, ~5-10 min typical)
- [ ] LISA Authority PM2 startup (blocked on npm completion)
- [ ] Port 9877 verification (netstat/ss after LISA comes online)

### 📋 Pending (Optimizer Integration)
- [ ] Create .env in `rnk-vortex-system-optimizer/` with ATLAS_API_URL
- [ ] Update `atlas-bridge.js` with REST client to `http://192.168.1.52:9876/dispatch`
- [ ] Implement recommended type dispatch wrappers
- [ ] Test optimizer health check to Atlas Master
- [ ] Verify all 6 recommended types are functional
- [ ] Update optimizer module manifest with LISA endpoint
- [ ] Capture full PM2 service inventory (post-deployment status check)

### 🔧 Troubleshooting Notes
- **SSH Timeouts:** Services server is under load (npm install running). Use `curl` to health endpoints instead of SSH for quick checks.
- **LISA Startup Delay:** LISA Authority is a large modular package. Typical startup time 3-10 minutes. Monitor with `curl http://192.168.1.52:9877/health` every 30 seconds.
- **Port Conflicts:** Atlas on 9876, LISA on 9877 (default). Update `.env` if ports needed.
- **Network:** Services server LAN IP is 192.168.1.52. Ensure Windows machine can reach this network.

---

## Security & Compliance

### API Key Management
```
Master Key: /home/rnk/atlas-deployment/atlas-master-01/master-key.txt
(Generated at deployment time if not present)
```

### CORS Configuration
```javascript
// All origins allowed (internal network)
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Admin-Key
```

### Audit Trail Storage (Atlas Only)
```
// Audit trails are written to LISA shared state
/home/rnk/atlas-deployment/Lisa/shared-state/audit-trail.json
// Retention: 90 days (configurable via AUDIT_RETENTION_DAYS env)
```

### LISA Authorization Mode
```
Mode: selective
- If LISA is down: Atlas continues processing but doesn't authorize
- If LISA is up: All recommendations checked against LISA policy
- User action: Always logged to LISA shared state
- Fallback: Atlas includes "lisa": { "checked": false } in response if unreachable
```

---

## Reference: Optimizer Module Integration Pattern

### Expected Module Bridge Code
```javascript
// rnk-vortex-system-optimizer/src/atlas-bridge.js

import axios from 'axios';

const ATLAS_API_URL = process.env.ATLAS_API_URL || 'http://192.168.1.52:9876';
const ATLAS_API_KEY = process.env.ATLAS_API_KEY || null;

export async function dispatchRecommendation(recommendationType, parameters, userId) {
  try {
    const response = await axios.post(`${ATLAS_API_URL}/dispatch`, {
      recommendationType,
      parameters,
      auditContext: {
        userId,
        sessionId: crypto.randomUUID(),
        timestamp: Date.now()
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(ATLAS_API_KEY && { 'X-API-Key': ATLAS_API_KEY })
      },
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error(`[Atlas Dispatch Error] ${error.message}`);
    throw error;
  }
}

export async function getAtlasHealth() {
  try {
    const response = await axios.get(`${ATLAS_API_URL}/health`, { timeout: 3000 });
    return response.data;
  } catch (error) {
    console.error(`[Atlas Health Check Error] ${error.message}`);
    return null;
  }
}
```

---

## Rollback Plan (If Needed)

### Revert to Vortex Quantum
```bash
# SSH to services server
ssh rnk@192.168.1.52

# Stop Atlas Master
pm2 stop atlas-master

# Restart old VQ instance
pm2 restart vq2-api

# Keep LISA running (independent)
pm2 list vq2-api
```

### Disable LISA Integration
```bash
# Edit Atlas .env
ssh rnk@192.168.1.52 "nano /home/rnk/atlas-deployment/atlas-master-01/.env"
# Set: LISA_MODE=off

# Restart Atlas
ssh rnk@192.168.1.52 "pm2 restart atlas-master"
```

---

## Document History

| Date | Version | Status | Notes |
|------|---------|--------|-------|
| 2025-04-13 | 3.1.0 | In Deployment | Atlas Master online, LISA initializing |

---

**Last Updated:** 2025-04-13 09:52 UTC  
**Next Review:** After LISA Authority comes online (estimated 2025-04-13 10:00 UTC)  
**Contact:** Asgard Innovations / RNK™  
**License:** Proprietary — RNK Enterprise Confidential
