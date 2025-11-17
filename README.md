# TAIM

## Group Members

- Guilherme Cruz
- Rodrigo Castro

## Overview

This repository contains a small interactive prototype for a gestural instrument simulator (Leap Motion + mouse-based prototype). The main demo is an HTML/WebAudio-based prototype that maps hand/mouse position to pitch, rhythm and volume.
l_prototype/prototype2.html` in your browser.

## 🎮 Controls

### Mouse Controls

* **Mouse X (Horizontal)** - Select musical note within the current scale
* **Mouse Y (Vertical)** - Control rhythm subdivision (1/16, 1/12, 1/8, 1/6, 1/4, 1/3, 1/2, 1/1)
* **Mouse Wheel 🖱️** - Adjust volume/depth (0-100%)

### Keyboard Controls

#### Musical Scales (Keys 1-5)

* **1** - C Major
* **2** - C Minor
* **3** - Pentatonic
* **4** - Blues
* **5** - Chromatic

#### Octave Range (Keys + / -)

* **+** - Shift octave range up (C3-C5 → C5-C7)
* **-** - Shift octave range down (C5-C7 → C3-C5)

#### Instruments (Arrow Keys ← →)

* **Arrow Left ←** - Previous instrument
* **Arrow Right →** - Next instrument
* Cycles through: Synth → Guitar → Saxophone → Piano

### Tempo/BPM (Arrow Keys ↑ ↓)

* **Arrow Up ↑** - Increase BPM by 10 (max 300)
* **Arrow Down ↓** - Decrease BPM by 10 (min 40)

### UI Controls

* **Start Audio Button** - Initialize and start/stop the audio engine (browser requires user interaction)
* **Info Button (i)** - Toggle on-screen instructions overlay
* **Octave Buttons (+/-)** - Alternative to keyboard for octave control

## Interface

### Visual Feedback

* **Horizontal grid lines** - Show rhythm subdivision zones (8 zones with gradient shading)
* **Vertical grid lines** - Show available notes in the current scale
* **Note labels** - Display note names (Dó, Ré, Mi, etc.) at bottom of each vertical line
* **Beat indicator dots** - Show current beat position in 4/4 time signature
* **Active note circle** - Size and opacity change based on volume

### Real-Time Display

* **X Axis** - Horizontal position percentage and current note name
* **Y Axis** - Vertical position percentage and rhythm subdivision (1/4, 1/8, etc.)
* **Z Axis (Depth)** - Volume level (0-100%)
* **Scale** - Currently selected musical scale
* **BPM** - Current tempo (40-300 beats per minute)
