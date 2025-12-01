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
let currentSubdivision = 4; // Default 1/4 notes

// Rhythm timing
let lastNoteTime = 0;
let currentBeat = 0;
const beatsInBar = 4;

// Subdivision levels based on Y position
const subdivisions = [16, 12, 8, 6, 4, 3, 2, 1];

// UI Elements
const startButton = document.getElementById('startButton');
const scaleSelect = document.getElementById('scaleSelect');
const waveformSelect = document.getElementById('waveformSelect');
const bpmSlider = document.getElementById('bpmSlider');
const bpmDisplay = document.getElementById('bpmDisplay');
const infoButton = document.getElementById('infoButton');
const instructions = document.getElementById('instructions');

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
        this.textContent = '⏸ Stop';
        this.style.background = '#f44336';
    } else {
        // Stop
        audioEngine.stop();
        this.textContent = '▶ Start Audio';
        this.style.background = '#4CAF50';
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
    
    // Update BPM in audio engine
    audioEngine.setBPM(currentBPM);
});

/**
 * Info button toggle
/**
 * Info button toggle
 */
infoButton.addEventListener('click', function() {
    instructions.classList.toggle('show');
});

/**
 * Keyboard shortcuts for scales (1-5)
 */
const scaleMapping = {
    '1': { value: 'major', text: 'C Major' },
    '2': { value: 'minor', text: 'C Minor' },
    '3': { value: 'pentatonic', text: 'Pentatonic' },
    '4': { value: 'blues', text: 'Blues' },
    '5': { value: 'chromatic', text: 'Chromatic' }
};

// Instrument options for cycling
const waveforms = [
    { value: 'sine', text: 'Synth' },
    { value: 'guitar', text: 'Guitar' },
    { value: 'saxophone', text: 'Saxophone' },
    { value: 'piano', text: 'Piano' }
];
let currentWaveformIndex = 0;

document.addEventListener('keydown', function(e) {
    // Check if key 1-5 is pressed
    if (scaleMapping[e.key]) {
        const scale = scaleMapping[e.key];
        
        // Update audio engine
        audioEngine.setScale(scale.value);
        
        // Update select dropdown
        scaleSelect.value = scale.value;
        
        // Update UI display
        document.getElementById('scaleValue').textContent = scale.text;
        
        // Visual feedback (flash the scale selector)
        scaleSelect.style.background = '#4CAF50';
        scaleSelect.style.color = 'white';
        setTimeout(() => {
            scaleSelect.style.background = 'rgba(255,255,255,0.9)';
            scaleSelect.style.color = '#222';
        }, 200);
    }
    
    // Arrow keys horizontal (← →) for waveform/instrument control
    if (e.key === 'ArrowLeft') {
        // Previous waveform
        currentWaveformIndex = (currentWaveformIndex - 1 + waveforms.length) % waveforms.length;
        const waveform = waveforms[currentWaveformIndex];
        audioEngine.setWaveform(waveform.value);
        waveformSelect.value = waveform.value;
        
        // Visual feedback
        waveformSelect.style.background = '#4CAF50';
        waveformSelect.style.color = 'white';
        setTimeout(() => {
            waveformSelect.style.background = 'rgba(255,255,255,0.9)';
            waveformSelect.style.color = '#222';
        }, 200);
        e.preventDefault();
    } else if (e.key === 'ArrowRight') {
        // Next waveform
        currentWaveformIndex = (currentWaveformIndex + 1) % waveforms.length;
        const waveform = waveforms[currentWaveformIndex];
        audioEngine.setWaveform(waveform.value);
        waveformSelect.value = waveform.value;
        
        // Visual feedback
        waveformSelect.style.background = '#4CAF50';
        waveformSelect.style.color = 'white';
        setTimeout(() => {
            waveformSelect.style.background = 'rgba(255,255,255,0.9)';
            waveformSelect.style.color = '#222';
        }, 200);
        e.preventDefault();
    }
    // Arrow keys vertical (↑ ↓) for BPM control
    else if (e.key === 'ArrowUp') {
        // Increase BPM by 5
        currentBPM = Math.min(180, currentBPM + 5);
        updateBPM(currentBPM);
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        // Decrease BPM by 5
        currentBPM = Math.max(60, currentBPM - 5);
        updateBPM(currentBPM);
        e.preventDefault();
    }
});

/**
 * Update BPM value and UI
 */
function updateBPM(bpm) {
    currentBPM = bpm;
    bpmSlider.value = bpm;
    bpmDisplay.textContent = bpm;
    
    // Update BPM in audio engine
    audioEngine.setBPM(currentBPM);
    
    // Visual feedback (flash the BPM display)
    bpmDisplay.style.color = '#4CAF50';
    bpmDisplay.style.transform = 'scale(1.2)';
    setTimeout(() => {
        bpmDisplay.style.color = '#222';
        bpmDisplay.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Process Leap Motion frame data
 */
function onLeapFrame(hands) {
    currentHands = hands;
    
    // Calculate subdivision based on Y position
    const activeHands = [hands.left, hands.right].filter(h => h !== null);
    
    if (activeHands.length > 0) {
        const avgY = activeHands.reduce((sum, h) => sum + h.position.y, 0) / activeHands.length;
        
        // Map Y to rhythm subdivision
        const subdivIndex = Math.floor(avgY * subdivisions.length);
        currentSubdivision = subdivisions[Math.min(subdivIndex, subdivisions.length - 1)];
        
        // Update subdivision in audio engine
        audioEngine.setSubdivision(currentSubdivision);
        
        // Update UI
        document.getElementById('handY').textContent = (avgY * 100).toFixed(0) + '%';
        document.getElementById('rhythmValue').textContent = '1/' + currentSubdivision;
        document.getElementById('rhythmText').textContent = '1/' + currentSubdivision;
        
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
    
    // Update UI with hand data
    if (hands.left) {
        const leftX = (hands.left.position.x * 100).toFixed(0);
        const leftFreq = audioEngine.getClosestNoteInScale(hands.left.position.x);
        const leftNote = audioEngine.getNoteName(leftFreq);
        
        document.getElementById('leftHandX').textContent = leftX + '%';
        document.getElementById('leftNote').textContent = leftNote;
        
        // Store hand frequency for rhythm-based playing
        currentHands.left.frequency = leftFreq;
        currentHands.left.volume = hands.left.position.z;
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
        
        // Store hand frequency for rhythm-based playing
        currentHands.right.frequency = rightFreq;
        currentHands.right.volume = hands.right.position.z;
    } else {
        document.getElementById('rightHandX').textContent = '-';
        document.getElementById('rightNote').textContent = '-';
        audioEngine.stopHand('right');
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
    
    // Draw subdivision guide lines (horizontal)
    const subdivisionLevels = [16, 12, 8, 6, 4, 3, 2, 1];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line
    
    for (let i = 1; i < subdivisionLevels.length; i++) {
        const y = (i / subdivisionLevels.length) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw subdivision labels on the right
    ctx.setLineDash([]); // Reset to solid line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    
    for (let i = 0; i < subdivisionLevels.length; i++) {
        const y = ((i + 0.5) / subdivisionLevels.length) * canvas.height;
        ctx.fillText('1/' + subdivisionLevels[subdivisionLevels.length - 1 - i], canvas.width - 10, y + 5);
    }
    
    // Draw note guide lines (vertical)
    const currentScaleNotes = audioEngine.scales[audioEngine.currentScale];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line
    
    for (let i = 1; i < currentScaleNotes.length; i++) {
        const x = (i / (currentScaleNotes.length - 1)) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Draw note labels at the top
    ctx.setLineDash([]); // Reset to solid line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < currentScaleNotes.length; i++) {
        const x = (i / (currentScaleNotes.length - 1)) * canvas.width;
        const freq = currentScaleNotes[i];
        const noteName = audioEngine.getNoteName(freq);
        ctx.fillText(noteName, x, 15);
    }
    
    // Draw note labels at the bottom
    ctx.setLineDash([]); // Reset to solid line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < currentScaleNotes.length; i++) {
        const x = (i / (currentScaleNotes.length - 1)) * canvas.width;
        const freq = currentScaleNotes[i];
        const noteName = audioEngine.getNoteName(freq);
        ctx.fillText(noteName, x, canvas.height - 5);
    }
    
    // Trigger notes based on rhythm subdivision
    if (audioEngine.isPlaying && audioEngine.shouldTriggerNote(timestamp)) {
        // Play notes for active hands
        if (currentHands.left && currentHands.left.frequency) {
            audioEngine.playRhythmNote('left', currentHands.left.frequency, currentHands.left.volume);
        }
        
        if (currentHands.right && currentHands.right.frequency) {
            audioEngine.playRhythmNote('right', currentHands.right.frequency, currentHands.right.volume);
        }
        
        // Update beat indicators
        currentBeat = (currentBeat + 1) % beatsInBar;
        updateBeatIndicators();
    }
    
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
