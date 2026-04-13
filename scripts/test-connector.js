/**
 * RNK Vortex Quantum™
 * Copyright © 2025 Asgard Innovations / RNK™. All Rights Reserved.
 *
 * Test script for dual-vq-connector (WebSocket version)
 */

// Simulate browser environment
global.window = {
    location: {
        hostname: 'api.rnk-enterprise.us',
        protocol: 'https:'
    }
};

// Mock WebSocket
class MockWebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = 0; // CONNECTING
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;

        // Simulate connection
        setTimeout(() => {
            this.readyState = 1; // OPEN
            if (this.onopen) this.onopen();
        }, 10);
    }

    send(data) {
        const message = JSON.parse(data);

        // Simulate server response
        setTimeout(() => {
            if (message.type === 'lisa.components' && this.onmessage) {
                this.onmessage({
                    data: JSON.stringify({
                        type: 'lisa.components',
                        totalComponents: 8458,
                        libraries: 212,
                        engines: 118,
                        turbos: 85,
                        status: 'ready'
                    })
                });
            }
        }, 20);
    }

    close() {
        this.readyState = 3; // CLOSED
        if (this.onclose) this.onclose();
    }
}

global.WebSocket = MockWebSocket;

// Load the connector (this will set window.DualVQConnector)
require('./dual-vq-connector.js');

async function testConnection() {
    console.log('Testing DualVQConnector (WebSocket version)...');

    try {
        // Wait a bit for the script to load
        await new Promise(resolve => setTimeout(resolve, 100));

        const connector = new window.DualVQConnector();
        console.log('Connector created');

        const result = await connector.initialize();
        console.log('Initialization result:', result);

        // Check stats
        console.log('Connection stats:', connector.stats);

        // Test WebSocket connection
        if (connector.lisa && connector.lisa.ws) {
            console.log('WebSocket connection established');
            console.log('WebSocket URL:', connector.lisa.ws.url);
            console.log('WebSocket readyState:', connector.lisa.ws.readyState);
        }

        return result;
    } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
    }
}

testConnection().then(() => {
    console.log('✓ Test completed successfully');
}).catch(error => {
    console.error('✗ Test failed:', error);
    process.exit(1);
});