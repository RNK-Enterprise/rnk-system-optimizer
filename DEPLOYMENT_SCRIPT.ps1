# RNK Vortex System Optimizer — Atlas + LISA Deployment Script
# Services Server Deployment (192.168.1.52)
# Date: April 13, 2026

param(
    [string]$Action = "deploy",  # deploy | status | logs | stop | restart
    [string]$Service = "all"     # all | atlas | lisa
)

$SERVICES_SERVER_IP = "192.168.1.52"
$SERVICES_SERVER_USER = "rnk"
$SERVICES_PASSWORD = "Allfather1!!"

# Paths on local machine
$LOCAL_ATLAS_PATH = "C:\Users\thugg\OneDrive\Desktop\New folder\Privacy System\deploy-ready\atlas-master-01"
$LOCAL_LISA_PATH = "C:\Users\thugg\OneDrive\Desktop\New folder\Privacy System\Project Genysys\Lisa"
$LOCAL_OPTIMIZER_PATH = "C:\Users\thugg\OneDrive\Desktop\New folder\rnk-vortex-system-optimizer"

# Paths on services server (Linux)
$REMOTE_DEPLOY_PATH = "/home/rnk/atlas-deployment"
$REMOTE_ATLAS_PATH = "/home/rnk/atlas-deployment/atlas-master-01"
$REMOTE_LISA_PATH = "/home/rnk/atlas-deployment/lisa"

# Services to manage
$SERVICES = @{
    "atlas-master" = @{
        name = "Atlas Master (API Server)"
        path = $REMOTE_ATLAS_PATH
        port = 9876
        script = "atlas-api-server.js"
    }
    "lisa" = @{
        name = "LISA (Security Authority)"
        path = $REMOTE_LISA_PATH
        port = 9877
        script = "lisa-core.js"
    }
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "» $Message" -ForegroundColor Yellow
}

# ============================================================================
# SSH Helper Functions
# ============================================================================

function SSH-Command {
    param(
        [string]$Command,
        [string]$Host = $SERVICES_SERVER_IP,
        [string]$User = $SERVICES_SERVER_USER
    )
    
    # Use SSH assuming key-based auth is set up
    # If not, you may need to use plink or set up key auth first
    
    try {
        $output = ssh -n "${User}@${Host}" $Command 2>&1
        return $output
    }
    catch {
        Write-Error "SSH command failed: $_"
        return $null
    }
}

function SSH-Copy {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [string]$Host = $SERVICES_SERVER_IP,
        [string]$User = $SERVICES_SERVER_USER
    )
    
    try {
        Write-Info "Copying $LocalPath to ${User}@${Host}:${RemotePath}"
        scp -r "$LocalPath" "${User}@${Host}:${RemotePath}"
        Write-Success "Copy completed"
        return $true
    }
    catch {
        Write-Error "SCP failed: $_"
        return $false
    }
}

# ============================================================================
# Deployment Functions
# ============================================================================

function Deploy-Services {
    Write-Header "Deploying Atlas + LISA to Services Server"
    
    # Step 1: Connect to services server and create deploy directory
    Write-Info "Connecting to services server..."
    $deployDirTest = SSH-Command "test -d $REMOTE_DEPLOY_PATH && echo 'exists' || echo 'missing'"
    
    if ($deployDirTest -notmatch "exists") {
        Write-Info "Creating deployment directory..."
        SSH-Command "mkdir -p $REMOTE_DEPLOY_PATH"
    }
    
    Write-Success "Deployment directory ready"
    
    # Step 2: Copy Atlas
    Write-Header "Deploying Atlas Master"
    if (Test-Path $LOCAL_ATLAS_PATH) {
        SSH-Copy $LOCAL_ATLAS_PATH "$REMOTE_DEPLOY_PATH/" | Out-Null
        Write-Success "Atlas copied"
        
        # Install deps
        Write-Info "Installing Atlas dependencies..."
        SSH-Command "cd $REMOTE_ATLAS_PATH && npm install 2>&1 | tail -5"
        Write-Success "Atlas ready"
    }
    else {
        Write-Error "Atlas source not found: $LOCAL_ATLAS_PATH"
    }
    
    # Step 3: Copy LISA
    Write-Header "Deploying LISA"
    if (Test-Path $LOCAL_LISA_PATH) {
        SSH-Copy $LOCAL_LISA_PATH "$REMOTE_DEPLOY_PATH/" | Out-Null
        Write-Success "LISA copied"
        
        # Install deps
        Write-Info "Installing LISA dependencies..."
        SSH-Command "cd $REMOTE_LISA_PATH && npm install 2>&1 | tail -5"
        Write-Success "LISA ready"
    }
    else {
        Write-Error "LISA source not found: $LOCAL_LISA_PATH"
    }
    
    # Step 4: Stop any running services with same name
    Write-Header "Cleaning up old services"
    SSH-Command "cd /home/rnk && pm2 delete atlas-master 2>/dev/null || true"
    SSH-Command "cd /home/rnk && pm2 delete lisa 2>/dev/null || true"
    Write-Success "Old services stopped"
    
    # Step 5: Start services with PM2
    Write-Header "Starting services with PM2"
    
    Write-Info "Starting Atlas Master..."
    SSH-Command "cd $REMOTE_ATLAS_PATH && pm2 start atlas-api-server.js --name 'atlas-master' --watch"
    Write-Success "Atlas started"
    
    Write-Info "Starting LISA..."
    SSH-Command "cd $REMOTE_LISA_PATH && pm2 start lisa-core.js --name 'lisa' --watch"
    Write-Success "LISA started"
    
    Write-Info "Saving PM2 config..."
    SSH-Command "pm2 save"
    Write-Success "PM2 config saved"
    
    # Step 6: Generate services manifest
    Generate-Services-Manifest
}

# ============================================================================
# Status & Reporting Functions
# ============================================================================

function Get-Running-Services {
    Write-Header "Running Services on Services Server"
    
    $output = SSH-Command "pm2 list"
    Write-Host $output
    
    Write-Header "Service Port Mapping"
    
    $portInfo = SSH-Command @"
echo "Atlas Master API: 9876"
echo "LISA Authority: 9877"
echo ""
echo "Listening Ports:"
netstat -tlnp 2>/dev/null | grep -E ':(9876|9877)' || nc -zvu localhost 9876 9877 2>/dev/null
"@
    
    Write-Host $portInfo
}

function Generate-Services-Manifest {
    Write-Header "Generating Services Manifest"
    
    $manifestPath = "$LOCAL_OPTIMIZER_PATH\SERVICES_MANIFEST.md"
    
    $manifest = @"
# RNK Services Deployment Manifest
**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Status:** Active Deployment

## Services Server Details
- **IP Address (LAN):** 192.168.1.52
- **IP Address (Direct Maintenance):** 192.168.1.10
- **Username:** rnk
- **Storage:** 112GB Expanded LVM (Active)
- **Deployment Path:** /home/rnk/atlas-deployment

## Running Services (PM2)

| Service | Name | Port | Path | Status |
|---------|------|------|------|--------|
| Atlas Master | atlas-master | 9876 | /home/rnk/atlas-deployment/atlas-master-01 | Running |
| LISA Authority | lisa | 9877 | /home/rnk/atlas-deployment/lisa | Running |

## API Endpoints

### Atlas Master (Port 9876)
- **Health Check:** GET http://192.168.1.52:9876/api/health
- **Dispatch:** POST http://192.168.1.52:9876/api/dispatch
- **Metrics Stream:** GET http://192.168.1.52:9876/api/metrics/stream (SSE)
- **Validate Key:** POST http://192.168.1.52:9876/api/validate-key

### LISA Authority (Port 9877)
- **Evaluate:** POST http://192.168.1.52:9877/api/evaluate
- **Detect Circumvention:** POST http://192.168.1.52:9877/api/detect-circumvention
- **Record Probe:** POST http://192.168.1.52:9877/api/record-probe
- **Audit Log:** POST http://192.168.1.52:9877/api/audit-log

## Optimizer Configuration

Add to ``package.json`` scripts or .env:
\`\`\`env
ATLAS_API_URL=https://192.168.1.52:9876
ATLAS_API_KEY=your-patreon-key
LISA_API_URL=https://192.168.1.52:9877
\`\`\`

## PM2 Management

**View running services:**
\`\`\`bash
ssh rnk@192.168.1.52
pm2 list
pm2 logs atlas-master
pm2 logs lisa
\`\`\`

**Restart services:**
\`\`\`bash
pm2 restart atlas-master
pm2 restart lisa
pm2 restart all
\`\`\`

**Stop services:**
\`\`\`bash
pm2 stop atlas-master
pm2 stop lisa
\`\`\`

## Network Ports Summary

| Port | Service | Protocol | Purpose |
|------|---------|----------|---------|
| 9876 | Atlas-Master | HTTPS/REST | API dispatch, metrics, health |
| 9877 | LISA | HTTPS/REST | Security evaluation, audit logging |
| 22 | SSH | SSH | Remote administration |

## Deployment History

- **2026-04-13:** Initial Atlas + LISA deployment to services server
    - Replaced legacy connector integration
  - Configured PM2 service management
  - Services operational on LAN (192.168.1.52)

## Module Integration

The RNK Vortex System Optimizer module will connect to:

**atlas-bridge.js:**
\`\`\`javascript
const ATLAS_URL = "https://192.168.1.52:9876";
const API_KEY = settings.get("atlas.apiKey");  // From Patreon
\`\`\`

**atlas-system-profile.js:**
- Collects full system telemetry on first connection
- Sends deltas every 10-30 seconds
- Baselined against system profile at optimization time

**Sample Dispatch Call:**
\`\`\`bash
curl -X POST https://192.168.1.52:9876/api/dispatch \\
  -H "Authorization: Bearer \$API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "libraryName": "atlas-quantum-core-engine",
    "payload": { "systemProfile": {...} },
    "flags": { "turboMode": "compute" }
  }'
\`\`\`

## Support

**Curator Contact:** Asgardinnovations@protonmail.com
**Patreon:** https://www.patreon.com/RagNaroks
**Discord:** Odinn1982

---
**Last Updated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

    $manifest | Out-File -FilePath $manifestPath -Encoding UTF8
    Write-Success "Manifest written to: $manifestPath"
    Write-Host $manifest
}

# ============================================================================
# Main Execution
# ============================================================================

Write-Header "RNK Vortex System Optimizer — Services Deployment"
Write-Info "Action: $Action | Service: $Service"

switch ($Action) {
    "deploy" {
        Deploy-Services
    }
    "status" {
        Get-Running-Services
    }
    "logs" {
        Write-Header "Atlas Logs"
        SSH-Command "pm2 logs atlas-master --lines 20"
        Write-Header "LISA Logs"
        SSH-Command "pm2 logs lisa --lines 20"
    }
    "stop" {
        Write-Header "Stopping Services"
        SSH-Command "pm2 stop $Service"
        Write-Success "Stopped"
    }
    "restart" {
        Write-Header "Restarting Services"
        SSH-Command "pm2 restart $Service"
        Write-Success "Restarted"
    }
    default {
        Write-Error "Unknown action: $Action"
        Write-Info "Usage: .\DEPLOYMENT_SCRIPT.ps1 -Action (deploy|status|logs|stop|restart) -Service (all|atlas|lisa)"
    }
}

Write-Header "Operation Complete"
