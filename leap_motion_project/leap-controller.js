/**
 * Leap Motion Controller - Handles Leap Motion input
 */

class LeapController {
    constructor(onFrameCallback) {
        this.controller = null;
        this.isConnected = false;
        this.onFrameCallback = onFrameCallback;
        this.hands = {
            left: null,
            right: null
        };
    }
    
    /**
     * Initialize Leap Motion controller
     */
    connect() {
        if (typeof Leap === 'undefined') {
            console.error('Leap Motion library not loaded');
            return false;
        }
        
        this.controller = new Leap.Controller({
            enableGestures: false,
            frameEventName: 'animationFrame'
        });
        
        // Connection event
        this.controller.on('connect', () => {
            console.log('Leap Motion connected');
            this.isConnected = true;
            this.updateConnectionStatus(true);
        });
        
        // Disconnect event
        this.controller.on('disconnect', () => {
            console.log('Leap Motion disconnected');
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });
        
        // Frame event - main data loop
        this.controller.on('frame', (frame) => {
            this.processFrame(frame);
        });
        
        // Start controller
        this.controller.connect();
        
        return true;
    }
    
    /**
     * Process Leap Motion frame data
     */
    processFrame(frame) {
        // Reset hands
        this.hands = { left: null, right: null };
        
        if (frame.hands.length > 0) {
            frame.hands.forEach(hand => {
                const handType = hand.type; // 'left' or 'right'
                const palmPosition = hand.palmPosition;
                const palmVelocity = hand.palmVelocity;
                
                // Normalize positions (Leap Motion coordinates to 0-1 range)
                // X: -200 to 200 -> 0 to 1
                // Y: 100 to 400 -> 0 to 1  
                // Z: -200 to 200 -> 0 to 1
                
                const normalizedX = Math.max(0, Math.min(1, (palmPosition[0] + 200) / 400));
                const normalizedY = Math.max(0, Math.min(1, (palmPosition[1] - 100) / 300));
                const normalizedZ = Math.max(0, Math.min(1, (palmPosition[2] + 200) / 400));
                
                this.hands[handType] = {
                    position: {
                        x: normalizedX,
                        y: normalizedY,
                        z: normalizedZ,
                        raw: palmPosition
                    },
                    velocity: palmVelocity,
                    confidence: hand.confidence,
                    grabStrength: hand.grabStrength,
                    pinchStrength: hand.pinchStrength
                };
            });
        }
        
        // Call callback with hand data
        if (this.onFrameCallback) {
            this.onFrameCallback(this.hands);
        }
        
        // Update UI
        this.updateHandsDetected(frame.hands.length);
    }
    
    /**
     * Update connection status in UI
     */
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = connected ? 'Connected ✓' : 'Disconnected ✗';
            statusElement.className = connected ? 'connected' : 'disconnected';
        }
    }
    
    /**
     * Update number of hands detected in UI
     */
    updateHandsDetected(count) {
        const handsElement = document.getElementById('handsDetected');
        if (handsElement) {
            handsElement.textContent = `Hands: ${count}`;
        }
    }
    
    /**
     * Disconnect controller
     */
    disconnect() {
        if (this.controller) {
            this.controller.disconnect();
            this.isConnected = false;
        }
    }
}

// Export for use in other files
window.LeapController = LeapController;
