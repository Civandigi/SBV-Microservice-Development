// WebSocket Manager for Real-time Service Updates
// SBV Professional V2 - Phase 3 Implementation

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.isConnecting = false;
        
        this.connect();
    }
    
    connect() {
        if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
            return;
        }
        
        this.isConnecting = true;
        
        try {
            // Use Socket.IO if available, fallback to WebSocket
            if (typeof io !== 'undefined') {
                this.socket = io();
                this.setupSocketIOEvents();
            } else {
                // Fallback to native WebSocket
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}`;
                this.socket = new WebSocket(wsUrl);
                this.setupWebSocketEvents();
            }
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleReconnect();
        }
        
        this.isConnecting = false;
    }
    
    setupSocketIOEvents() {
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.reconnectAttempts = 0;
            this.emit('connected');
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            this.emit('disconnected');
            this.handleReconnect();
        });
        
        // Service-specific events
        this.socket.on('gesuch-processed', (data) => {
            console.log('📄 Gesuch processed:', data);
            this.emit('gesuch-processed', data);
        });
        
        this.socket.on('rapporte-ready', (data) => {
            console.log('📋 Rapporte ready:', data);
            this.emit('rapporte-ready', data);
        });
        
        this.socket.on('export-ready', (data) => {
            console.log('📤 Export ready:', data);
            this.emit('export-ready', data);
        });
        
        this.socket.on('service-status', (data) => {
            console.log('🔧 Service status:', data);
            this.emit('service-status', data);
        });
        
        this.socket.on('job-progress', (data) => {
            console.log('⏳ Job progress:', data);
            this.emit('job-progress', data);
        });
    }
    
    setupWebSocketEvents() {
        this.socket.addEventListener('open', () => {
            console.log('✅ WebSocket connected');
            this.reconnectAttempts = 0;
            this.emit('connected');
        });
        
        this.socket.addEventListener('close', () => {
            console.log('❌ WebSocket disconnected');
            this.emit('disconnected');
            this.handleReconnect();
        });
        
        this.socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit(data.event, data.payload);
            } catch (error) {
                console.error('WebSocket message parse error:', error);
            }
        });
        
        this.socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        });
    }
    
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.emit('max-reconnect-attempts');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectInterval * this.reconnectAttempts);
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`WebSocket event handler error for ${event}:`, error);
            }
        });
    }
    
    send(event, data) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, cannot send:', event);
            return false;
        }
        
        try {
            if (typeof this.socket.emit === 'function') {
                // Socket.IO
                this.socket.emit(event, data);
            } else {
                // Native WebSocket
                this.socket.send(JSON.stringify({ event, data }));
            }
            return true;
        } catch (error) {
            console.error('WebSocket send error:', error);
            return false;
        }
    }
    
    disconnect() {
        if (this.socket) {
            if (typeof this.socket.disconnect === 'function') {
                this.socket.disconnect();
            } else {
                this.socket.close();
            }
            this.socket = null;
        }
        this.listeners.clear();
    }
    
    isConnected() {
        return this.socket && (
            (this.socket.readyState === WebSocket.OPEN) || 
            (this.socket.connected === true)
        );
    }
}

// Global WebSocket instance
window.wsManager = new WebSocketManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
}