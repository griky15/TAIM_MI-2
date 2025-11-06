/**
 * Main Application - Integrates Audio Engine and Leap Controller
 */

// Initialize components
const audioEngine = new AudioEngine();
let leapController = null;

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// State
let currentHands = { left: null, right: null };
let currentBPM = 120;

// Rhythm timing
let noteInterval = 500; // milliseconds
let lastNoteTime = 0;
let currentBeat = 0;
const beatsInBar = 4;

// UI Elements
const startButton = document.getElementById('startButton');
const scaleSelect = document.getElementById('scaleSelect');
const waveformSelect = document.getElementById('waveformSelect');
const bpmSlider = document.getElementById('bpmSlider');
const bpmDisplay = document.getElementById('bpmDisplay');
const infoButton = document.getElementById('infoButton');
const instructions = document.getElementById('instructions');
const recordButton = document.getElementById('recordButton');

/**
 * Start/Stop Audio and Leap Motion
 */
startButton.addEventListener('click', function() {
    if (!audioEngine.isPlaying) {
        // Start
        audioEngine.start();
        
        // Initialize Leap Motion if not already done
        if (!leapController) {
            leapController = new LeapController(onLeapFrame);
            leapController.connect();
        }
        
        this.textContent = '⏸ Parar';
        this.style.background = '#f44336';
        recordButton.disabled = false;
    } else {
        // Stop
        audioEngine.stop();
        this.textContent = '▶ Iniciar Áudio';
        this.style.background = '#4CAF50';
        recordButton.disabled = true;
    }
});

/**
 * Scale selection
 */
scaleSelect.addEventListener('change', function(e) {
    audioEngine.setScale(e.target.value);
    document.getElementById('scaleValue').textContent = e.target.options[e.target.selectedIndex].text;
});

/**
 * Waveform selection
 */
waveformSelect.addEventListener('change', function(e) {
    audioEngine.setWaveform(e.target.value);
});

/**
 * BPM control
 */
bpmSlider.addEventListener('input', function(e) {
    currentBPM = parseInt(e.target.value);
    bpmDisplay.textContent = currentBPM;
    
    // Update note interval based on BPM
    const beatDuration = (60 / currentBPM) * 1000;
    noteInterval = beatDuration / 4;
});

/**
 * Info button toggle
 */
infoButton.addEventListener('click', function() {
    instructions.classList.toggle('show');
});

/**
 * Record button (placeholder for future implementation)
 */
recordButton.addEventListener('click', function() {
    this.classList.toggle('recording');
    if (this.classList.contains('recording')) {
        this.textContent = '⏹ Parar Gravação';
        // TODO: Implement recording
    } else {
        this.textContent = '⏺ Gravar';
        // TODO: Stop recording
    }
});

/**
 * Process Leap Motion frame data
 */
function onLeapFrame(hands) {
    currentHands = hands;
    
    // Update UI with hand data
    if (hands.left) {
        const leftX = (hands.left.position.x * 100).toFixed(0);
        const leftFreq = audioEngine.getClosestNoteInScale(hands.left.position.x);
        const leftNote = audioEngine.getNoteName(leftFreq);
        
        document.getElementById('leftHandX').textContent = leftX + '%';
        document.getElementById('leftNote').textContent = leftNote;
        
        // Play note for left hand
        const volume = hands.left.position.z;
        audioEngine.playHandNote('left', leftFreq, volume);
    } else {
        document.getElementById('leftHandX').textContent = '-';
        document.getElementById('leftNote').textContent = '-';
        audioEngine.stopHand('left');
    }
    
    if (hands.right) {
        const rightX = (hands.right.position.x * 100).toFixed(0);
        const rightFreq = audioEngine.getClosestNoteInScale(hands.right.position.x);
        const rightNote = audioEngine.getNoteName(rightFreq);
        
        document.getElementById('rightHandX').textContent = rightX + '%';
        document.getElementById('rightNote').textContent = rightNote;
        
        // Play note for right hand
        const volume = hands.right.position.z;
        audioEngine.playHandNote('right', rightFreq, volume);
    } else {
        document.getElementById('rightHandX').textContent = '-';
        document.getElementById('rightNote').textContent = '-';
        audioEngine.stopHand('right');
    }
    
    // Use average Y position for rhythm control
    const activeHands = [hands.left, hands.right].filter(h => h !== null);
    if (activeHands.length > 0) {
        const avgY = activeHands.reduce((sum, h) => sum + h.position.y, 0) / activeHands.length;
        
        // Map Y to rhythm subdivision
        const subdivisions = [16, 12, 8, 6, 4, 3, 2, 1];
        const subdivIndex = Math.floor(avgY * subdivisions.length);
        const currentSubdiv = subdivisions[Math.min(subdivIndex, subdivisions.length - 1)];
        
        document.getElementById('handY').textContent = (avgY * 100).toFixed(0) + '%';
        document.getElementById('rhythmValue').textContent = '1/' + currentSubdiv;
        document.getElementById('rhythmText').textContent = '1/' + currentSubdiv;
        
        // Use average Z for volume display
        const avgZ = activeHands.reduce((sum, h) => sum + h.position.z, 0) / activeHands.length;
        document.getElementById('handZ').textContent = (avgZ * 100).toFixed(0) + '%';
        document.getElementById('volumeValue').textContent = (avgZ * 100).toFixed(0) + '%';
    } else {
        document.getElementById('handY').textContent = '-';
        document.getElementById('handZ').textContent = '-';
        document.getElementById('rhythmValue').textContent = '-';
        document.getElementById('volumeValue').textContent = '-';
    }
}

/**
 * Update beat indicators
 */
function updateBeatIndicators() {
    const dots = document.querySelectorAll('.beat-dot');
    dots.forEach((dot, i) => {
        if (i === currentBeat) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

/**
 * Animation loop
 */
function animate(timestamp) {
    // Clear canvas
    ctx.fillStyle = 'rgba(168, 230, 207, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw hand indicators
    if (currentHands.left && canvas.width > 0) {
        const x = currentHands.left.position.x * canvas.width;
        const y = (1 - currentHands.left.position.y) * canvas.height;
        const size = 30 + (currentHands.left.position.z * 70);
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(33, 150, 243, 0.5)';
        ctx.fill();
        
        // Label
        const leftFreq = audioEngine.getClosestNoteInScale(currentHands.left.position.x);
        const leftNote = audioEngine.getNoteName(leftFreq);
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(leftNote, x, y + 6);
    }
    
    if (currentHands.right && canvas.width > 0) {
        const x = currentHands.right.position.x * canvas.width;
        const y = (1 - currentHands.right.position.y) * canvas.height;
        const size = 30 + (currentHands.right.position.z * 70);
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
        ctx.fill();
        
        // Label
        const rightFreq = audioEngine.getClosestNoteInScale(currentHands.right.position.x);
        const rightNote = audioEngine.getNoteName(rightFreq);
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(rightNote, x, y + 6);
    }
    
    // Beat indicator
    if (timestamp - lastNoteTime >= noteInterval) {
        currentBeat = (currentBeat + 1) % beatsInBar;
        updateBeatIndicators();
        lastNoteTime = timestamp;
    }
    
    requestAnimationFrame(animate);
}

// Start animation loop
animate(0);

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (leapController) {
        leapController.disconnect();
    }
    audioEngine.stop();
});
