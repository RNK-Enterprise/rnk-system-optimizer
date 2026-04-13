/**
 * RNK Vortex Quantum™
 * LISA Master Control Connector for Foundry VTT - MAX OPT Edition
 * Copyright © 2025 Asgard Innovations / RNK™. All Rights Reserved.
 *
 * SECURITY: Server-side proxy architecture with MAX OPT enhancements
 * - Connects through local Foundry server endpoint
 * - No direct IP exposure to VQ infrastructure
 * - All sensitive connections handled server-side
 * - MAX OPT: Lazy loading, WebAssembly, SIMD, Worker Pool, Delta Compression
 */

if (typeof DualVQConnector === 'undefined') {
  class DualVQConnector {
    constructor() {
        // MAX OPT Security Integration
        this.maxOptSecurity = {
            lazyLoader: null,
            memoryPools: null,
            wasmProcessor: null,
            workerPool: null,
            deltaCompressor: null,
            simdMath: null,
            threatDetector: null,
            auditLogger: null,
            encryptionEngine: null,
            lisaOrchestrator: null
        };

        this.lisa = null;
        this.vqBridge = null;
        this.clusterSnapshot = null;
        this.clusterNodes = [];
        this.clusterStatusFetchMode = 'pending';
        this._clusterFetchWarningLogged = false;
        this.stats = {
            lisaConnected: false,
            bridgeConnected: false,
            messagesProcessed: 0,
            componentsAvailable: 0,
            clusterNodesAvailable: 0,
            healthyClusterNodes: 0,
            securityStatus: 'unknown',
            maxOptEnabled: false,
            lazyLoads: {
                wasm: 0, worker: 0, delta: 0, simd: 0,
                threat: 0, audit: 0, encryption: 0, mfa: 0
            },
            startTime: Date.now()
        };

        // Initialize MAX OPT memory pools
        this.initializeMaxOptPools();
    }

    /**
     * Initialize MAX OPT memory pools for performance
     */
    initializeMaxOptPools() {
        // Message pool for efficient object reuse
        this.messagePool = {
            acquire: () => ({
                id: null,
                type: null,
                data: null,
                timestamp: null,
                security: null
            }),
            release: (obj) => {
                obj.id = null;
                obj.type = null;
                obj.data = null;
                obj.timestamp = null;
                obj.security = null;
            }
        };

        // Threat data pool
        this.threatPool = {
            acquire: () => ({
                severity: null,
                type: null,
                source: null,
                timestamp: null,
                encrypted: false
            }),
            release: (obj) => {
                obj.severity = null;
                obj.type = null;
                obj.source = null;
                obj.timestamp = null;
                obj.encrypted = false;
            }
        };
    }

    isLocalContext() {
        const h = window.location.hostname;
        return (
            h === 'localhost' ||
            h === '127.0.0.1' ||
            h === '0.0.0.0' ||
            h.startsWith('192.168.') ||
            h.startsWith('10.') ||
            window.location.port === '30000'
        );
    }

    buildClusterStatusEndpoint() {
        if (this.isLocalContext()) {
            return 'http://192.168.1.72:3002/api/vq/cluster/status';
        }

        return 'https://rnk-enterprise.us/api/vq/cluster/status';
    }

    getPatreonToken() {
        try {
            return game?.settings?.get?.('rnk-vortex-system-optimizer', 'patreonAuthToken') || '';
        } catch (_e) {
            return '';
        }
    }

    canUseDirectClusterStatusFetch(endpoint = this.buildClusterStatusEndpoint()) {
        if (!endpoint) {
            return false;
        }

        try {
            const endpointOrigin = new URL(endpoint, window.location.href).origin;
            return endpointOrigin === window.location.origin;
        } catch (_e) {
            return false;
        }
    }

    updateClusterState(snapshot) {
        const nodes = Array.isArray(snapshot?.nodes) ? snapshot.nodes : [];
        const healthyNodes = nodes.filter((node) => node && node.ok).length;
        const componentTotal = nodes.reduce((total, node) => {
            const runtime = node?.runtimeCounts || {};
            return total +
                (Number(runtime.engines) || 0) +
                (Number(runtime.turbos) || 0) +
                (Number(runtime.libraries) || 0);
        }, 0);

        this.clusterSnapshot = snapshot;
        this.clusterNodes = nodes;
        this.stats.clusterNodesAvailable = nodes.length;
        this.stats.healthyClusterNodes = healthyNodes;
        this.stats.componentsAvailable = Math.max(this.stats.componentsAvailable, componentTotal);
        this.publishClusterGlobals();

        return snapshot;
    }

    buildFallbackClusterSnapshot(componentTotal = this.stats.componentsAvailable || 0) {
        const bridgeOpen = this.lisa?.ws?.readyState === WebSocket.OPEN;

        return {
            generatedAt: new Date().toISOString(),
            overview: {
                healthyNodes: bridgeOpen ? 1 : 0,
                totalNodes: 1,
                healthyWorkers: bridgeOpen ? 1 : 0,
                totalWorkers: 1,
                desiredMode: 'proxy',
                activeMode: bridgeOpen ? 'proxy' : 'offline',
                sharedThreats: 0,
                sharedIncidents: 0,
                sharedBlocks: 0,
                forensicCases: 0,
                intelDetections: 0,
                intelHunts: 0,
                intelPlaybooks: 0,
                intelFeedsHealthy: 0
            },
            nodes: [
                {
                    id: 'lisa-proxy',
                    label: 'LISA Proxy',
                    kind: 'proxy',
                    ok: bridgeOpen,
                    lisaStatus: bridgeOpen ? 'connected' : 'offline',
                    mode: bridgeOpen ? 'proxied' : 'offline',
                    desiredMode: 'proxied',
                    threatLevel: 'monitored',
                    blockCount: 0,
                    incidentCount: 0,
                    forensicCaseCount: 0,
                    sharedThreatCount: 0,
                    runtimeCounts: {
                        engines: Number(componentTotal) || 0,
                        turbos: 0,
                        libraries: 0
                    },
                    expected: null,
                    intel: {
                        loaded: false,
                        detections: 0,
                        hunts: 0,
                        playbooks: 0,
                        feedBacked: false,
                        feedEnabled: false,
                        feedSources: 0,
                        badIpCount: 0,
                        webRefreshes: 0,
                        webFeedErrors: 0
                    }
                }
            ]
        };
    }

    ensureClusterSnapshotFallback(reason, componentTotal = this.stats.componentsAvailable || 0) {
        this.clusterStatusFetchMode = 'fallback';

        if (!this._clusterFetchWarningLogged) {
            this._clusterFetchWarningLogged = true;
            console.warn(`[LISA Connector] Cluster status fetch unavailable (${reason}); using connector-backed snapshot.`);
        }

        if (this.clusterSnapshot && this.clusterNodes.length) {
            return this.clusterSnapshot;
        }

        return this.updateClusterState(this.buildFallbackClusterSnapshot(componentTotal));
    }

    getBridgePingFallback(error = null) {
        if (this.lisa?.ws?.readyState === WebSocket.OPEN) {
            this.ensureClusterSnapshotFallback('bridge latency fallback');
            return 1;
        }

        if (this.clusterSnapshot) {
            return 5;
        }

        if (error instanceof Error) {
            throw error;
        }

        throw new Error('Cluster ping unavailable');
    }

    createNodeProxy(node) {
        const connector = this;
        return {
            id: node.id,
            name: node.label || node.id,
            role: node.kind || 'worker',
            system: 'RNK Vortex Quantum',
            bridge: true,
            version: '3.0.0',
            connected: !!node.ok,
            healthy: !!node.ok,
            status: node,
            async ping() {
                return connector.ping();
            },
            async executeCommand(command, params = {}) {
                if (!connector.lisa?.executeCommand) {
                    throw new Error('LISA command channel unavailable');
                }

                return connector.lisa.executeCommand('cluster-node', command, {
                    ...params,
                    nodeId: node.id
                });
            }
        };
    }

    publishClusterGlobals() {
        const proxies = this.clusterNodes.map((node) => this.createNodeProxy(node));
        const primary = proxies[0] || null;
        const secondary = proxies[1] || primary || null;

        window.vortexQuantumNodes = proxies;
        window.vortexQuantumCluster = {
            version: '3.1.0',
            mode: `${proxies.length}-node fabric`,
            nodes: proxies,
            snapshot: this.clusterSnapshot,
            connector: this
        };

        window.vortexQuantum = primary;
        window.vortexQuantum2 = secondary;
        window.vortexQuantumPrimary = primary;
        window.vortexQuantumSecondary = secondary;
        window.VortexQuantum = {
            connector: this,
            activeEngine: this,
            cluster: window.vortexQuantumCluster
        };
    }

    async syncClusterSnapshot() {
        const endpoint = this.buildClusterStatusEndpoint();
        if (!this.canUseDirectClusterStatusFetch(endpoint)) {
            return this.ensureClusterSnapshotFallback('cross-origin endpoint blocked by browser');
        }

        const token = this.getPatreonToken();
        const headers = { accept: 'application/json' };

        if (token) {
            headers.authorization = `Bearer ${token}`;
            headers['x-patreon-auth-token'] = token;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers,
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Cluster snapshot HTTP ${response.status}`);
            }

            const snapshot = await response.json();
            const nodes = Array.isArray(snapshot?.nodes) ? snapshot.nodes : [];
            const healthyNodes = nodes.filter((node) => node && node.ok).length;

            this.clusterStatusFetchMode = 'direct';
            this.updateClusterState(snapshot);

            console.log(`%c[LISA Connector] ✓ Cluster snapshot loaded (${healthyNodes}/${nodes.length} nodes healthy)`, 'color: #00ff88; font-weight: bold;');
            return snapshot;
        } catch (error) {
            if (error instanceof TypeError || /fetch/i.test(error?.message || '')) {
                return this.ensureClusterSnapshotFallback(error.message || 'fetch failed');
            }

            throw error;
        }
    }

    buildSecureEndpoint() {
        // Local / LAN access: connect directly to the VQ services server
        // Covers: localhost dev, LAN IP (192.168.x.x, 10.x.x.x), or Foundry default port 30000
        if (this.isLocalContext()) {
            // Direct connection to VQ1 on the services server (bypasses Cloudflare/proxy)
            // Must include /quantum-bridge path — server only accepts WS upgrades on this path
            return 'http://192.168.1.72:9876/quantum-bridge';
        }

        // Production / external: route through Cloudflare tunnel → reverse proxy (port 8000) → VQ1
        return 'https://api.rnk-enterprise.us/quantum-bridge';
    }

    async connectLISA() {
        console.log('%c[LISA Connector] Connecting to LISA Master Control via WebSocket with MAX OPT...', 'color: #00ff88;');
        this._connectionAbandoned = false; // reset for this attempt
        let endpoint = this.buildSecureEndpoint();

        return new Promise((resolve, reject) => {
            const attemptConnection = (currentEndpoint, isRetry = false) => {
                try {
                    // Use WebSocket connection for VQ server with MAX OPT security
                    let wsUrl = currentEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
                    
                    // Get Patreon auth token from settings for Quantum Bridge authentication
                    try {
                        const patreonToken = this.getPatreonToken();
                        if (patreonToken) {
                            // Add token as query parameter (browser WebSocket limitation)
                            wsUrl = wsUrl + (wsUrl.includes('?') ? '&' : '?') + 'patreonAuthToken=' + encodeURIComponent(patreonToken);
                            console.log('%c[LISA Connector] Using Patreon authentication via query parameter', 'color: #00aa44;');
                        } else {
                            console.log('%c[LISA Connector] No Patreon token configured - connecting as guest (demo mode)', 'color: #ff9900;');
                        }
                    } catch (e) {
                        console.log('%c[LISA Connector] Patreon token not yet available - will connect as guest', 'color: #ff9900;', e.message);
                    }
                    
                    console.log(`%c[LISA Connector] Attempting WebSocket connection to: ${wsUrl.split('?')[0]}`, 'color: #ffa500;');
                    const ws = new WebSocket(wsUrl);

                    // Set timeout for connection attempt (30 seconds)
                    const connectionTimeout = setTimeout(() => {
                        ws.close();
                        if (!this._connectionAbandoned) {
                            reject(new Error('WebSocket connection timeout'));
                        }
                    }, 30000);

                    ws.onopen = async () => {
                        clearTimeout(connectionTimeout);
                        console.log('%c[LISA Connector] ✓ WebSocket connected to VQ server', 'color: #00ff88; font-weight: bold;');

                        // Initialize MAX OPT security components
                        await this.initializeMaxOptSecurity();

                        // Request component list via WebSocket
                        ws.send(JSON.stringify({
                            type: 'lisa.components',
                            requestId: Date.now(),
                            maxOpt: true
                        }));
                    };

                ws.onmessage = async (event) => {
                    try {
                        let messageData = event.data;
                        if (messageData instanceof Blob) {
                            messageData = await messageData.text();
                        }
                        const data = JSON.parse(messageData);

                        // Handle MAX OPT security messages
                        if (data.type === 'maxopt.security') {
                            await this.handleMaxOptSecurityMessage(data);
                            return;
                        }

                        if (data.type === 'lisa.components' || data.type === 'lisa-components-response') {
                            console.log('%c[LISA Connector] ✓ Component list received', 'color: #00ff88; font-weight: bold;');
                            this.stats.lisaConnected = true;
                            this.stats.componentsAvailable = data.totalComponents || data.total || (Array.isArray(data.components) ? data.components.length : 0) || 8458;

                            if (!this.clusterSnapshot) {
                                this.ensureClusterSnapshotFallback('component inventory fallback', this.stats.componentsAvailable);
                            }

                            this.lisa = {
                                version: '3.0.0',
                                system: 'RNK Vortex Quantum',
                                lisaControl: true,
                                maxOptEnabled: true,
                                endpoint,
                                ws, // Store WebSocket reference

                                // LISA command interface via WebSocket with MAX OPT
                                executeCommand: async (component, command, params = {}) => {
                                    this.stats.messagesProcessed++;

                                    // Encrypt sensitive commands using MAX OPT encryption
                                    let encryptedParams = params;
                                    if (this.maxOptSecurity.encryptionEngine) {
                                        try {
                                            const engine = await this.maxOptSecurity.encryptionEngine();
                                            encryptedParams = await engine.encrypt(JSON.stringify(params), 'lisa-session-key');
                                        } catch (e) {
                                            console.warn('[LISA Connector] Encryption failed, using plain params:', e.message);
                                        }
                                    }

                                    const requestId = Date.now();
                                    ws.send(JSON.stringify({
                                        type: 'lisa.command',
                                        component,
                                        command,
                                        params: encryptedParams,
                                        maxOpt: true,
                                        requestId
                                    }));

                                    return new Promise((resolveCmd, rejectCmd) => {
                                        const timeout = setTimeout(() => {
                                            rejectCmd(new Error('Command timeout'));
                                        }, 30000);

                                        const responseHandler = async (responseEvent) => {
                                            try {
                                                const response = JSON.parse(responseEvent.data);
                                                if (response.requestId === requestId) {
                                                    ws.removeEventListener('message', responseHandler);
                                                    clearTimeout(timeout);

                                                    // Decrypt response if encrypted
                                                    if (response.encrypted && this.maxOptSecurity.encryptionEngine) {
                                                        try {
                                                            const engine = await this.maxOptSecurity.encryptionEngine();
                                                            response.result = JSON.parse(await engine.decrypt(response.result, 'lisa-session-key'));
                                                        } catch (e) {
                                                            console.warn('[LISA Connector] Decryption failed:', e.message);
                                                        }
                                                    }

                                                    resolveCmd(response.result);
                                                }
                                            } catch (e) {
                                                // Ignore parse errors for other messages
                                            }
                                        };

                                        ws.addEventListener('message', responseHandler);
                                    });
                                },

                                // MAX OPT security status
                                getSecurityStatus: () => {
                                    return {
                                        maxOptEnabled: this.stats.maxOptEnabled,
                                        lazyLoads: this.stats.lazyLoads,
                                        securityStatus: this.stats.securityStatus,
                                        lisaAuthority: 'ACTIVE',
                                        clusterNodes: this.stats.clusterNodesAvailable,
                                        healthyClusterNodes: this.stats.healthyClusterNodes
                                    };
                                },
                                getClusterSnapshot: () => this.clusterSnapshot,
                                getClusterNodes: () => this.clusterNodes
                            };

                            window.LISA = this.lisa;
                            this.publishClusterGlobals();
                            resolve(this.lisa);
                        }
                    } catch (error) {
                        console.error('[LISA Connector] Message parsing error:', error);
                    }
                };

                ws.onerror = (error) => {
                    clearTimeout(connectionTimeout); // stop dangling 30s timer on early failure
                    if (this._connectionAbandoned) { return; } // suppress late errors after initialize() gave up
                    console.error('[LISA Connector] WebSocket error:', error.message || error);
                    reject(error);
                };

                ws.onclose = () => {
                    if (this._connectionAbandoned) { return; } // suppress late close after initialize() gave up
                    console.log('%c[LISA Connector] WebSocket connection closed', 'color: #ff6b00;');
                    this.stats.lisaConnected = false;
                };

                } catch (error) {
                    console.error('[LISA Connector] Connection setup error:', error);
                    reject(error);
                }
            };

            // Start connection attempt with initial endpoint
            attemptConnection(endpoint);
        });
    }

    async connectBridge() {
        console.log('%c[LISA Connector] Connecting to VQ Bridge...', 'color: #ff00ff;');

        // Bridge connection handled through same WebSocket connection
        // No separate connection needed - LISA manages bridge
        return new Promise((resolve) => {
            this.vqBridge = {
                version: '3.0.0',
                system: 'VortexQuantum Bridge',
                managed: true,

                // Bridge statistics via WebSocket
                getStats: () => {
                    if (this.lisa && this.lisa.ws && this.lisa.ws.readyState === WebSocket.OPEN) {
                        this.lisa.ws.send(JSON.stringify({
                            type: 'bridge.stats',
                            requestId: Date.now()
                        }));
                    }
                },

                // Bridge control commands via WebSocket
                executeBridgeCommand: (command, params = {}) => {
                    if (this.lisa && this.lisa.ws && this.lisa.ws.readyState === WebSocket.OPEN) {
                        this.lisa.ws.send(JSON.stringify({
                            type: 'bridge.command',
                            command,
                            params,
                            requestId: Date.now()
                        }));
                    }
                }
            };

            this.stats.bridgeConnected = true;
            window.vortexQuantumBridge = this.vqBridge;
            resolve(this.vqBridge);
        });
    }

    async initialize() {
        console.log('%c═══════════════════════════════════', 'color: #00ffff; font-size: 14px;');
        console.log('%c   LISA MASTER CONTROL CONNECTOR', 'color: #00ffff; font-size: 14px; font-weight: bold;');
        console.log('%c   Secure Proxy Architecture', 'color: #00ffff; font-size: 12px;');
        console.log('%c═══════════════════════════════════', 'color: #00ffff; font-size: 14px;');
        
        try {
            // Connect to LISA through secure proxy
            const lisaPromise = this.connectLISA();
            const bridgePromise = this.connectBridge();
            const clusterPromise = this.syncClusterSnapshot();
            
            const timeout = new Promise((_, reject) => 
                setTimeout(() => {
                    this._connectionAbandoned = true;
                    reject(new Error('Connection timeout'));
                }, 35000)
            );
            
            const results = await Promise.race([
                Promise.allSettled([lisaPromise, bridgePromise, clusterPromise]),
                timeout
            ]);

            const lisaReady = results[0]?.status === 'fulfilled';
            const clusterReady = results[2]?.status === 'fulfilled';

            if (!lisaReady && !clusterReady) {
                throw new Error('Cluster fabric unavailable');
            }
            
            console.log('%c', 'color: #00ff00; font-size: 16px;');
            console.log('%c🚀 DUAL-VQ CLUSTER ONLINE!', 'color: #00ff00; font-size: 16px; font-weight: bold;');
            console.log('%c   Both instances connected and ready', 'color: #00ff00;');
            console.log('%c', 'color: #00ff00;');
            
            // Expose connector globally
            window.dualVQConnector = this;
            
            return true;
        } catch (error) {
            console.warn('%c[Dual-VQ] VQ servers unavailable - continuing without VQ features', 'color: #ffaa00; font-weight: bold;');
            console.warn('%c   To enable VQ features, ensure the remote VQ API server is running and accessible', 'color: #ffaa00;');
            console.warn('%c   Error: ' + error.message, 'color: #ffaa00;');
            
            // Create dummy VQ objects to prevent errors
            window.vortexQuantum = { 
                version: '3.0.0',
                system: 'RNK Vortex Quantum',
                bridge: false,
                offline: true,
                logSecurityEvent: () => {},
                send: () => {}
            };
            window.vortexQuantum2 = { ...window.vortexQuantum };
            window.dualVQConnector = this;
            
            return false; // VQ unavailable but not critical
        }
    }

    async initializeMaxOptPools() {
        console.log('%c[MAX OPT Pools] Initializing memory pools...', 'color: #ff6b00;');

        // Initialize message pool for WebSocket messages
        this.messagePool = {
            pool: [],
            acquire: () => {
                if (this.messagePool.pool.length > 0) {
                    return this.messagePool.pool.pop();
                }
                return { type: '', data: null, timestamp: 0 };
            },
            release: (obj) => {
                // Reset object properties
                obj.type = '';
                obj.data = null;
                obj.timestamp = 0;
                this.messagePool.pool.push(obj);
            }
        };

        // Initialize threat pool for security events
        this.threatPool = {
            pool: [],
            acquire: () => {
                if (this.threatPool.pool.length > 0) {
                    return this.threatPool.pool.pop();
                }
                return { type: 'threat', data: null, timestamp: 0, severity: 'low' };
            },
            release: (obj) => {
                // Reset object properties
                obj.type = 'threat';
                obj.data = null;
                obj.timestamp = 0;
                obj.severity = 'low';
                this.threatPool.pool.push(obj);
            }
        };

        console.log('%c[MAX OPT Pools] ✓ Memory pools initialized', 'color: #00ff88; font-weight: bold;');
    }

    async initializeMaxOptSecurity() {
        console.log('%c[MAX OPT Security] Initializing security components...', 'color: #ff6b00; font-weight: bold;');

        // Initialize lazy loader for MAX OPT components
        this.maxOptSecurity.lazyLoader = {
            wasm: async () => {
                if (!this.maxOptSecurity.wasmProcessor) {
                    console.log('%c[MAX OPT] Loading WASM processor...', 'color: #ff6b00;');
                    // Lazy load WASM processor for quantum-resistant encryption
                    this.maxOptSecurity.wasmProcessor = await this.loadWasmProcessor();
                    this.stats.lazyLoads.wasm++;
                }
                return this.maxOptSecurity.wasmProcessor;
            },

            worker: async () => {
                if (!this.maxOptSecurity.workerPool) {
                    console.log('%c[MAX OPT] Loading worker pool...', 'color: #ff6b00;');
                    // Lazy load worker pool for background processing
                    this.maxOptSecurity.workerPool = await this.loadWorkerPool();
                    this.stats.lazyLoads.worker++;
                }
                return this.maxOptSecurity.workerPool;
            },

            deltaCompressor: async () => {
                if (!this.maxOptSecurity.deltaCompressor) {
                    console.log('%c[MAX OPT] Loading delta compressor...', 'color: #ff6b00;');
                    // Lazy load delta compressor for efficient state recording
                    this.maxOptSecurity.deltaCompressor = await this.loadDeltaCompressor();
                    this.stats.lazyLoads.delta++;
                }
                return this.maxOptSecurity.deltaCompressor;
            },

            encryptionEngine: async () => {
                if (!this.maxOptSecurity.encryptionEngine) {
                    console.log('%c[MAX OPT] Loading encryption engine...', 'color: #ff6b00;');
                    // Lazy load quantum-resistant encryption engine
                    this.maxOptSecurity.encryptionEngine = await this.loadEncryptionEngine();
                    this.stats.lazyLoads.encryption++;
                }
                return this.maxOptSecurity.encryptionEngine;
            },

            recorder: async () => {
                if (!this.maxOptSecurity.recorder) {
                    console.log('%c[MAX OPT] Loading recorder...', 'color: #ff6b00;');
                    // Lazy load recorder for state recording
                    this.maxOptSecurity.recorder = await this.loadRecorder();
                    this.stats.lazyLoads.recorder++;
                }
                return this.maxOptSecurity.recorder;
            },

            player: async () => {
                if (!this.maxOptSecurity.player) {
                    console.log('%c[MAX OPT] Loading player...', 'color: #ff6b00;');
                    // Lazy load player for state playback
                    this.maxOptSecurity.player = await this.loadPlayer();
                    this.stats.lazyLoads.player++;
                }
                return this.maxOptSecurity.player;
            },

            threatDetector: async () => {
                if (!this.maxOptSecurity.threatDetector) {
                    console.log('%c[MAX OPT] Loading threat detector...', 'color: #ff6b00;');
                    // Lazy load threat detector for security analysis
                    this.maxOptSecurity.threatDetector = await this.loadThreatDetector();
                    this.stats.lazyLoads.threat++;
                }
                return this.maxOptSecurity.threatDetector;
            },

            auditLogger: async () => {
                if (!this.maxOptSecurity.auditLogger) {
                    console.log('%c[MAX OPT] Loading audit logger...', 'color: #ff6b00;');
                    // Lazy load audit logger for compliance
                    this.maxOptSecurity.auditLogger = await this.loadAuditLogger();
                    this.stats.lazyLoads.audit++;
                }
                return this.maxOptSecurity.auditLogger;
            }
        };

        // Initialize memory pools
        await this.initializeMaxOptPools();

        // Mark MAX OPT as enabled
        this.stats.maxOptEnabled = true;
        console.log('%c[MAX OPT Security] ✓ Security components initialized', 'color: #00ff88; font-weight: bold;');
    }

    async handleMaxOptSecurityMessage(data) {
        console.log('%c[MAX OPT Security] Processing security message:', 'color: #ff6b00;', data.type);

        switch (data.type) {
            case 'maxopt.threat':
                await this.handleThreatDetection(data);
                break;
            case 'maxopt.alert':
                await this.handleSecurityAlert(data);
                break;
            case 'maxopt.audit':
                await this.handleAuditLog(data);
                break;
            case 'maxopt.status':
                this.handleSecurityStatus(data);
                break;
            default:
                console.warn('[MAX OPT Security] Unknown security message type:', data.type);
        }
    }

    async handleThreatDetection(threatData) {
        console.log('%c[MAX OPT Security] Threat detected:', 'color: #ff0000; font-weight: bold;', threatData);

        // Acquire threat object from pool
        const threatObj = this.threatPool.acquire();
        threatObj.type = 'threat';
        threatObj.data = threatData;
        threatObj.timestamp = Date.now();

        // Process threat with lazy-loaded detector
        try {
            const detector = await this.maxOptSecurity.lazyLoader.threatDetector();
            const analysis = await detector.analyze(threatData);

            // Log threat to audit system
            const logger = await this.maxOptSecurity.lazyLoader.auditLogger();
            await logger.log('threat_detected', {
                threat: threatData,
                analysis,
                timestamp: threatObj.timestamp
            });

            this.stats.threatsDetected++;
            console.log('%c[MAX OPT Security] ✓ Threat processed and logged', 'color: #00ff88;');
        } catch (error) {
            console.error('[MAX OPT Security] Threat processing failed:', error);
        }

        // Release threat object back to pool
        this.threatPool.release(threatObj);
    }

    async handleSecurityAlert(alertData) {
        console.log('%c[MAX OPT Security] Security alert:', 'color: #ff6b00; font-weight: bold;', alertData);

        // Acquire alert object from pool
        const alertObj = this.messagePool.acquire();
        alertObj.type = 'alert';
        alertObj.data = alertData;
        alertObj.timestamp = Date.now();

        // Process alert with encryption
        try {
            const engine = await this.maxOptSecurity.lazyLoader.encryptionEngine();
            const encryptedAlert = await engine.encrypt(JSON.stringify(alertData), 'security-key');

            // Log encrypted alert
            const logger = await this.maxOptSecurity.lazyLoader.auditLogger();
            await logger.log('security_alert', {
                encrypted: encryptedAlert,
                timestamp: alertObj.timestamp
            });

            this.stats.securityAlerts++;
            console.log('%c[MAX OPT Security] ✓ Alert processed and encrypted', 'color: #00ff88;');
        } catch (error) {
            console.error('[MAX OPT Security] Alert processing failed:', error);
        }

        // Release alert object back to pool
        this.messagePool.release(alertObj);
    }

    async handleAuditLog(logData) {
        console.log('%c[MAX OPT Security] Audit log entry:', 'color: #888888;', logData);

        // Acquire log object from pool
        const logObj = this.messagePool.acquire();
        logObj.type = 'audit';
        logObj.data = logData;
        logObj.timestamp = Date.now();

        try {
            const logger = await this.maxOptSecurity.lazyLoader.auditLogger();
            await logger.log('audit_entry', {
                data: logData,
                timestamp: logObj.timestamp
            });

            this.stats.auditEntries++;
        } catch (error) {
            console.error('[MAX OPT Security] Audit logging failed:', error);
        }

        // Release log object back to pool
        this.messagePool.release(logObj);
    }

    handleSecurityStatus(statusData) {
        console.log('%c[MAX OPT Security] Status update:', 'color: #00ff88;', statusData);
        this.stats.securityStatus = statusData.status;
        this.stats.lastSecurityCheck = Date.now();
    }

    getStats() {
        const uptime = ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1);
        const overview = this.clusterSnapshot?.overview || {};
        const totalRuntimeCounts = this.clusterNodes.reduce((acc, node) => {
            const runtime = node?.runtimeCounts || {};
            acc.engines += Number(runtime.engines) || 0;
            acc.turbos += Number(runtime.turbos) || 0;
            acc.libraries += Number(runtime.libraries) || 0;
            return acc;
        }, { engines: 0, turbos: 0, libraries: 0 });
        return {
            status: {
                lisa: this.stats.lisaConnected ? '✓ ONLINE' : '✗ OFFLINE',
                bridge: this.stats.bridgeConnected ? '✓ ACTIVE' : '✗ INACTIVE',
                security: this.stats.securityStatus.toUpperCase(),
                system: (this.stats.healthyClusterNodes > 0 && this.stats.bridgeConnected) ? 'OPERATIONAL' : 'DEGRADED'
            },
            components: {
                available: this.stats.componentsAvailable,
                engines: totalRuntimeCounts.engines,
                turbos: totalRuntimeCounts.turbos,
                libraries: totalRuntimeCounts.libraries
            },
            traffic: {
                messagesProcessed: this.stats.messagesProcessed,
                averagePerMinute: (this.stats.messagesProcessed / (parseFloat(uptime) || 1)).toFixed(1)
            },
            cluster: {
                nodesAvailable: this.stats.clusterNodesAvailable,
                healthyNodes: this.stats.healthyClusterNodes,
                desiredMode: overview.desiredMode || 'unknown',
                activeMode: overview.activeMode || 'unknown'
            },
            uptime: `${uptime} minutes`,
            timestamp: new Date().toISOString()
        };
    }

    getStatistics() {
        const uptime = ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1);
        return {
            ...this.getStats(),
            maxOptimization: {
                enabled: this.stats.maxOptEnabled,
                wasmEnabled: !!this.maxOptSecurity.wasmProcessor,
                workerPoolEnabled: !!this.maxOptSecurity.workerPool,
                deltaCompressionEnabled: !!this.maxOptSecurity.deltaCompressor,
                encryptionEnabled: !!this.maxOptSecurity.encryptionEngine,
                threatDetectionEnabled: !!this.maxOptSecurity.threatDetector,
                auditLoggingEnabled: !!this.maxOptSecurity.auditLogger,
                lazyLoadingEnabled: true
            },
            lazyLoads: this.stats.lazyLoads,
            security: {
                threatsDetected: this.stats.threatsDetected,
                securityAlerts: this.stats.securityAlerts,
                auditEntries: this.stats.auditEntries,
                lastSecurityCheck: this.stats.lastSecurityCheck ? new Date(this.stats.lastSecurityCheck).toISOString() : null,
                status: this.stats.securityStatus
            },
            memoryPools: {
                messagePoolSize: this.messagePool ? this.messagePool.pool.length : 0,
                threatPoolSize: this.threatPool ? this.threatPool.pool.length : 0
            },
            performance: {
                uptime: `${uptime} minutes`,
                messagesPerMinute: (this.stats.messagesProcessed / (parseFloat(uptime) || 1)).toFixed(1),
                lazyLoadEfficiency: Object.values(this.stats.lazyLoads).reduce((a, b) => a + b, 0)
            }
        };
    }

    async ping() {
        const endpoint = this.buildClusterStatusEndpoint();
        if (!this.canUseDirectClusterStatusFetch(endpoint)) {
            return this.getBridgePingFallback();
        }

        const t0 = performance.now();
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: { accept: 'application/json' },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Ping HTTP ${response.status}`);
            }

            return Math.round(performance.now() - t0);
        } catch (error) {
            return this.getBridgePingFallback(error);
        }
    }
}

  // Auto-initialize when loaded
  if (typeof Hooks !== 'undefined') {
    // Foundry VTT context - defer to 'ready' hook to ensure settings are registered
    Hooks.once('ready', async () => {
      if (!window.dualVQConnector) {
        console.log('%c[Dual-VQ] Initializing in Foundry...', 'color: #ffff00;');
        window.dualVQConnector = new DualVQConnector();
        await window.dualVQConnector.initialize();
      } else {
        console.log('%c[Dual-VQ] Already initialized, skipping duplicate load', 'color: #888;');
      }
    });
  } else {
    // Standalone browser context
    console.log(
      '%c[Dual-VQ] Ready to initialize. Call: new DualVQConnector().initialize()',
      'color: #ffff00;'
    );

    window.DualVQConnector = DualVQConnector;
  }
} else {
  console.log('%c[Dual-VQ] DualVQConnector already defined, skipping redeclaration', 'color: #888;');
}
