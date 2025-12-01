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
        
        // Rhythm and timing
        this.currentBPM = 120;
        this.currentSubdivision = 4; // Default 1/4 notes
        this.lastNoteTime = 0;
        this.noteInterval = 500; // milliseconds
        
        // Musical scales (frequencies in Hz)
        this.scales = {
            major: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
            minor: [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08, 261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
            pentatonic: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
            blues: [130.81, 155.56, 174.61, 185.00, 196.00, 233.08, 261.63, 311.13, 349.23, 369.99, 392.00, 466.16, 523.25],
            chromatic: [130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25]
        };
        
        this.noteNames = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
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
    
    /**
     * Set BPM (beats per minute)
     */
    setBPM(bpm) {
        this.currentBPM = bpm;
        this.updateNoteInterval();
    }
    
    /**
     * Set rhythm subdivision (4, 8, 16, etc.)
     */
    setSubdivision(subdivision) {
        this.currentSubdivision = subdivision;
        this.updateNoteInterval();
    }
    
    /**
     * Update note interval based on BPM and subdivision
     */
    updateNoteInterval() {
        // Calculate notes per minute based on subdivision
        const notesPerMinute = this.currentBPM * (this.currentSubdivision / 4);
        this.noteInterval = (60 / notesPerMinute) * 1000; // convert to milliseconds
    }
    
    /**
     * Check if it's time to trigger a new note
     */
    shouldTriggerNote(currentTime) {
        if (currentTime - this.lastNoteTime >= this.noteInterval) {
            this.lastNoteTime = currentTime;
            return true;
        }
        return false;
    }
    
    /**
     * Play a note with ADSR envelope (for rhythm-based notes)
     */
    playRhythmNote(hand, frequency, volume = 0.5, duration = null) {
        if (!this.isPlaying || !this.audioContext) return;
        
        // Use note interval as duration if not specified
        const noteDuration = duration || (this.noteInterval / 1000);
        const now = this.audioContext.currentTime;
        
        // Different configurations per instrument
        if (this.currentWaveform === 'sine') {
            // Synth - Pure and smooth sound (synthesizer)
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = frequency;
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            const attackTime = 0.02;
            const releaseTime = 0.1;
            const sustainTime = Math.max(0.05, noteDuration - attackTime - releaseTime);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + attackTime);
            gainNode.gain.setValueAtTime(volume * 0.4, now + attackTime + sustainTime);
            gainNode.gain.linearRampToValueAtTime(0, now + attackTime + sustainTime + releaseTime);
            
            osc.start(now);
            osc.stop(now + attackTime + sustainTime + releaseTime);
        }
        else if (this.currentWaveform === 'guitar') {
            // Guitar - Realistic sound with pluck and harmonics
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const osc3 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const gain2 = this.audioContext.createGain();
            const gain3 = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // Fundamental + harmonics to simulate string
            osc1.type = 'triangle';
            osc1.frequency.value = frequency;
            
            osc2.type = 'triangle';
            osc2.frequency.value = frequency * 2.01; // Slightly detuned for realism
            
            osc3.type = 'sawtooth';
            osc3.frequency.value = frequency * 0.5; // Sub-harmonic
            
            // Low-pass filter to simulate guitar body
            filter.type = 'lowpass';
            filter.frequency.value = 3000;
            filter.Q.value = 1;
            
            gain2.gain.value = 0.4;
            gain3.gain.value = 0.2;
            
            osc1.connect(gainNode);
            osc2.connect(gain2);
            osc3.connect(gain3);
            gain2.connect(gainNode);
            gain3.connect(gainNode);
            gainNode.connect(filter);
            filter.connect(this.masterGain);
            
            // Pluck-type envelope - fast attack, fast decay, long release
            const attackTime = 0.003;
            const decayTime = 0.05;
            const releaseTime = 0.8;
            const sustainTime = Math.max(0.05, noteDuration - attackTime - decayTime - releaseTime);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + attackTime);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.2, now + attackTime + decayTime);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.15, now + attackTime + decayTime + sustainTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime + sustainTime + releaseTime);
            
            // Filter modulation to simulate "twang"
            filter.frequency.setValueAtTime(5000, now);
            filter.frequency.exponentialRampToValueAtTime(2500, now + 0.05);
            filter.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
            
            osc1.start(now);
            osc2.start(now);
            osc3.start(now);
            osc1.stop(now + attackTime + decayTime + sustainTime + releaseTime);
            osc2.stop(now + attackTime + decayTime + sustainTime + releaseTime);
            osc3.stop(now + attackTime + decayTime + sustainTime + releaseTime);
        }
        else if (this.currentWaveform === 'saxophone') {
            // Saxophone - Realistic sound with more harmonics and vibrato
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const osc3 = this.audioContext.createOscillator();
            const vibrato = this.audioContext.createOscillator();
            const vibratoGain = this.audioContext.createGain();
            const gainNode = this.audioContext.createGain();
            const gain2 = this.audioContext.createGain();
            const gain3 = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // Fundamental + odd harmonics (characteristic of reed instruments)
            osc1.type = 'sawtooth';
            osc1.frequency.value = frequency;
            
            osc2.type = 'square';
            osc2.frequency.value = frequency * 3; // 3rd harmonic
            
            osc3.type = 'sine';
            osc3.frequency.value = frequency * 5; // 5th harmonic
            
            // Softer and more natural vibrato
            vibrato.frequency.value = 4.5;
            vibratoGain.gain.value = 8;
            
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc1.frequency);
            
            // Filter to simulate saxophone timbre
            filter.type = 'bandpass';
            filter.frequency.value = 800 + (frequency * 0.8);
            filter.Q.value = 3;
            
            gain2.gain.value = 0.15;
            gain3.gain.value = 0.08;
            
            osc1.connect(filter);
            osc2.connect(gain2);
            osc3.connect(gain3);
            gain2.connect(filter);
            gain3.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Typical wind envelope - gradual attack, constant sustain
            const attackTime = 0.12;
            const releaseTime = 0.2;
            const sustainTime = Math.max(0.15, noteDuration - attackTime - releaseTime);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * 0.15, now + attackTime * 0.3);
            gainNode.gain.linearRampToValueAtTime(volume * 0.45, now + attackTime);
            gainNode.gain.setValueAtTime(volume * 0.45, now + attackTime + sustainTime);
            gainNode.gain.linearRampToValueAtTime(0, now + attackTime + sustainTime + releaseTime);
            
            // Vibrato grows gradually (more natural)
            vibratoGain.gain.setValueAtTime(0, now);
            vibratoGain.gain.linearRampToValueAtTime(8, now + attackTime + sustainTime * 0.3);
            
            osc1.start(now);
            osc2.start(now);
            osc3.start(now);
            vibrato.start(now);
            osc1.stop(now + attackTime + sustainTime + releaseTime);
            osc2.stop(now + attackTime + sustainTime + releaseTime);
            osc3.stop(now + attackTime + sustainTime + releaseTime);
            vibrato.stop(now + attackTime + sustainTime + releaseTime);
        }
        else if (this.currentWaveform === 'piano') {
            // Piano - Multiple waves (fundamental + harmonics)
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const osc3 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const gain2 = this.audioContext.createGain();
            const gain3 = this.audioContext.createGain();
            
            osc1.type = 'sine';
            osc1.frequency.value = frequency;
            
            osc2.type = 'sine';
            osc2.frequency.value = frequency * 2;
            
            osc3.type = 'sine';
            osc3.frequency.value = frequency * 3;
            
            gain2.gain.value = 0.3;
            gain3.gain.value = 0.15;
            
            osc1.connect(gainNode);
            osc2.connect(gain2);
            osc3.connect(gain3);
            gain2.connect(gainNode);
            gain3.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            const attackTime = 0.005;
            const decayTime = 0.1;
            const releaseTime = 0.4;
            const sustainTime = Math.max(0.05, noteDuration - attackTime - decayTime - releaseTime);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + attackTime);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, now + attackTime + decayTime);
            gainNode.gain.setValueAtTime(volume * 0.3, now + attackTime + decayTime + sustainTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime + sustainTime + releaseTime);
            
            osc1.start(now);
            osc2.start(now);
            osc3.start(now);
            osc1.stop(now + attackTime + decayTime + sustainTime + releaseTime);
            osc2.stop(now + attackTime + decayTime + sustainTime + releaseTime);
            osc3.stop(now + attackTime + decayTime + sustainTime + releaseTime);
        }
    }
}

// Export for use in other files
window.AudioEngine = AudioEngine;
