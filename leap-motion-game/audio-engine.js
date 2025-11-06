/**
 * Audio Engine - Manages Web Audio API for musical instrument
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.currentWaveform = 'sine';
        this.masterGain = null;
        
        // Active oscillators for each hand
        this.oscillators = {
            left: null,
            right: null
        };
        
        // Musical scales (frequencies in Hz)
        this.scales = {
            major: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
            minor: [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08, 261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
            pentatonic: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
            blues: [130.81, 155.56, 174.61, 185.00, 196.00, 233.08, 261.63, 311.13, 349.23, 369.99, 392.00, 466.16, 523.25],
            chromatic: [130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25]
        };
        
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.currentScale = 'major';
    }
    
    /**
     * Initialize audio context
     */
    start() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // Master volume
        }
        this.isPlaying = true;
        return true;
    }
    
    /**
     * Stop audio
     */
    stop() {
        this.isPlaying = false;
        this.stopHand('left');
        this.stopHand('right');
    }
    
    /**
     * Get closest note in current scale
     */
    getClosestNoteInScale(normalizedX) {
        const scaleNotes = this.scales[this.currentScale];
        const index = Math.floor(normalizedX * (scaleNotes.length - 1));
        return scaleNotes[Math.max(0, Math.min(index, scaleNotes.length - 1))];
    }
    
    /**
     * Get note name from frequency
     */
    getNoteName(frequency) {
        const c0 = 16.35;
        const halfSteps = 12 * Math.log2(frequency / c0);
        const octave = Math.floor(halfSteps / 12);
        const note = Math.round(halfSteps % 12);
        return this.noteNames[note] + octave;
    }
    
    /**
     * Update or start playing a note for a specific hand
     */
    playHandNote(hand, frequency, volume = 0.5) {
        if (!this.isPlaying || !this.audioContext) return;
        
        // If oscillator doesn't exist, create it
        if (!this.oscillators[hand]) {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.type = this.currentWaveform;
            osc.frequency.value = frequency;
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.05);
            
            osc.start();
            
            this.oscillators[hand] = { osc, gainNode };
        } else {
            // Update existing oscillator
            const { osc, gainNode } = this.oscillators[hand];
            const now = this.audioContext.currentTime;
            
            osc.frequency.linearRampToValueAtTime(frequency, now + 0.05);
            gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.05);
        }
    }
    
    /**
     * Stop playing note for a specific hand
     */
    stopHand(hand) {
        if (this.oscillators[hand]) {
            const { osc, gainNode } = this.oscillators[hand];
            const now = this.audioContext.currentTime;
            
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
            
            setTimeout(() => {
                try {
                    osc.stop();
                } catch (e) {
                    // Oscillator might already be stopped
                }
                this.oscillators[hand] = null;
            }, 150);
        }
    }
    
    /**
     * Change waveform type
     */
    setWaveform(waveform) {
        this.currentWaveform = waveform;
        
        // Update existing oscillators
        Object.keys(this.oscillators).forEach(hand => {
            if (this.oscillators[hand]) {
                this.oscillators[hand].osc.type = waveform;
            }
        });
    }
    
    /**
     * Change musical scale
     */
    setScale(scale) {
        this.currentScale = scale;
    }
}

// Export for use in other files
window.AudioEngine = AudioEngine;
