# RNK Vortex System Optimizer — Vortex Quantum + LISA Deployment Script
# Homelab Master Server Deployment (192.168.1.52)
# Date: April 13, 2026

param(
    [string]$Action = "deploy",  # deploy | status | logs | stop | restart
    [string]$Service = "all"     # all | vq | lisa
)

$SERVICES_SERVER_IP = "192.168.1.52"
$SERVICES_SERVER_USER = "rnk"

# Paths on local machine
$LOCAL_VQ_PATH = "C:\Users\thugg\OneDrive\Desktop\New folder\Vortex\Vortex Files\deploy-ready\vq-master-01"
$LOCAL_LISA_PATH = "C:\Users\thugg\OneDrive\Desktop\New folder\Privacy System\Project Genysys\Lisa"
$LOCAL_OPTIMIZER_PATH = "C:\Users\thugg\OneDrive\Desktop\New folder\rnk-vortex-system-optimizer"

# Paths on homelab master server (Linux)
$REMOTE_DEPLOY_PATH = "/home/rnk/vortex-quantum"
$REMOTE_VQ_PATH = "/home/rnk/vortex-quantum/vq1"
$REMOTE_LISA_PATH = "/home/rnk/vortex-quantum/lisa"

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

function Invoke-RemoteCommand {
    param(
        [string]$Command,
        [string]$RemoteMachine = $SERVICES_SERVER_IP,
        [string]$User = $SERVICES_SERVER_USER
    )
    
    # Use SSH assuming key-based auth is set up
    # If not, you may need to use plink or set up key auth first
    
    try {
        $output = ssh -n "${User}@${RemoteMachine}" $Command 2>&1
        return $output
    }
    catch {
        Write-Error "SSH command failed: $_"
        return $null
    }
}

function Copy-RemoteFolder {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [string]$RemoteMachine = $SERVICES_SERVER_IP,
        [string]$User = $SERVICES_SERVER_USER
    )
    
    try {
        Write-Info "Copying $LocalPath to ${User}@${RemoteMachine}:${RemotePath}"
        scp -r "$LocalPath" "${User}@${RemoteMachine}:${RemotePath}"
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

function Start-VortexDeployment {
    Write-Header "Deploying Vortex Quantum + LISA to Homelab Master Server"
    
    # Step 1: Connect to homelab master server and create deploy directory
    Write-Info "Connecting to homelab master server..."
    $deployDirTest = Invoke-RemoteCommand "test -d $REMOTE_DEPLOY_PATH && echo 'exists' || echo 'missing'"
    
    if ($deployDirTest -notmatch "exists") {
        Write-Info "Creating deployment directory..."
        Invoke-RemoteCommand "mkdir -p $REMOTE_DEPLOY_PATH"
    }
    
    Write-Success "Deployment directory ready"
    
    # Step 2: Copy Vortex Quantum
    Write-Header "Deploying Vortex Quantum Master"
    if (Test-Path $LOCAL_VQ_PATH) {
        Copy-RemoteFolder $LOCAL_VQ_PATH "$REMOTE_DEPLOY_PATH/" | Out-Null
        Write-Success "Vortex Quantum copied"
        
        # Install deps
        Write-Info "Installing Vortex Quantum dependencies..."
        Invoke-RemoteCommand "cd $REMOTE_VQ_PATH && npm install 2>&1 | tail -5"
        Write-Success "Vortex Quantum ready"
    }
    else {
        Write-Error "Vortex Quantum source not found: $LOCAL_VQ_PATH"
    }
    
    # Step 3: Copy LISA
    Write-Header "Deploying LISA"
    if (Test-Path $LOCAL_LISA_PATH) {
        Copy-RemoteFolder $LOCAL_LISA_PATH "$REMOTE_DEPLOY_PATH/" | Out-Null
        Write-Success "LISA copied"
        
        # Install deps
        Write-Info "Installing LISA dependencies..."
        Invoke-RemoteCommand "cd $REMOTE_LISA_PATH && npm install 2>&1 | tail -5"
        Write-Success "LISA ready"
    }
    else {
        Write-Error "LISA source not found: $LOCAL_LISA_PATH"
    }
    
    # Step 4: Stop any running services with same name
    Write-Header "Cleaning up old services"
    Invoke-RemoteCommand "cd /home/rnk && pm2 delete vq-master 2>/dev/null || true"
    Invoke-RemoteCommand "cd /home/rnk && pm2 delete lisa 2>/dev/null || true"
    Write-Success "Old services stopped"
    
    # Step 5: Start services with PM2
    Write-Header "Starting services with PM2"
    
    Write-Info "Starting Vortex Quantum Master..."
    Invoke-RemoteCommand "cd $REMOTE_VQ_PATH && pm2 start vq-api-server.js --name 'vq-master' --watch"
    Write-Success "Vortex Quantum started"
    
    Write-Info "Starting LISA..."
    Invoke-RemoteCommand "cd $REMOTE_LISA_PATH && pm2 start lisa-core.js --name 'lisa' --watch"
    Write-Success "LISA started"
    
    Write-Info "Saving PM2 config..."
    Invoke-RemoteCommand "pm2 save"
    Write-Success "PM2 config saved"
    
    # Step 6: Generate services manifest
    Write-ServicesManifest
}

# ============================================================================
# Status & Reporting Functions
# ============================================================================

function Get-Running-Services {
    Write-Header "Running Services on Homelab Master Server"
    
    $output = Invoke-RemoteCommand "pm2 list"
    Write-Host $output
    
    Write-Header "Service Port Mapping"
    
    $portInfo = Invoke-RemoteCommand @"
echo "Vortex Quantum Master API: 9876"
echo "LISA Authority: 9877"
echo ""
echo "Listening Ports:"
netstat -tlnp 2>/dev/null | grep -E ':(9876|9877)' || nc -zvu localhost 9876 9877 2>/dev/null
"@
    
    Write-Host $portInfo
}

function Write-ServicesManifest {
        Write-Header "Generating Services Manifest"

        $manifestPath = "$LOCAL_OPTIMIZER_PATH\SERVICES_MANIFEST.md"

        $manifest = @"
# RNK System Optimizer — Vortex Quantum Services Manifest
**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
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
For browser access, prefer `https://api.rnk-enterprise.us` for Vortex Quantum and keep `https://api.rnk-enterprise.us` routed to `http://127.0.0.1:9876` through Cloudflare Tunnel.

## PM2 Commands

- `pm2 list`
- `pm2 logs vq-master`
- `pm2 logs lisa`
- `pm2 restart vq-master`
- `pm2 restart lisa`
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
        Start-VortexDeployment
    }
    "status" {
        Get-Running-Services
    }
    "logs" {
        Write-Header "Vortex Quantum Logs"
        Invoke-RemoteCommand "pm2 logs vq-master --lines 20"
        Write-Header "LISA Logs"
        Invoke-RemoteCommand "pm2 logs lisa --lines 20"
    }
    "stop" {
        Write-Header "Stopping Services"
        Invoke-RemoteCommand "pm2 stop $Service"
        Write-Success "Stopped"
    }
    "restart" {
        Write-Header "Restarting Services"
        Invoke-RemoteCommand "pm2 restart $Service"
        Write-Success "Restarted"
    }
    default {
        Write-Error "Unknown action: $Action"
        Write-Info "Usage: .\DEPLOYMENT_SCRIPT.ps1 -Action (deploy|status|logs|stop|restart) -Service (all|vq|lisa)"
    }
}

Write-Header "Operation Complete"
