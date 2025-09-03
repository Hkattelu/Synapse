# Educational Features Overview

This document summarizes the educational features integrated into Synapse Studio, and how to use them efficiently.

## Educational Tracks

The simplified UI organizes the timeline into four fixed educational tracks:
- Code (Track 1): for code clips with syntax highlighting and educational animations
- Visual (Track 2): for videos/images/visual assets (screen recordings, diagrams, overlays)
- Narration (Track 3): for voiceover and audio content with waveform and basic audio controls
- You (Track 4): for talking-head/personal video overlays with PiP controls

Each track has specialized defaults and visual styling. Items display track-specific previews (e.g., code syntax preview, audio waveform, visual thumbnails).

## Smart Content Placement

When you drag from the Media Bin to the timeline, the system suggests the best target track based on asset type and filename patterns (e.g., detecting screen recordings or talking-head videos). If placement may be suboptimal, a non-blocking suggestion appears with an option to move the clip to the recommended track.

The Media Bin also shows a small badge per asset indicating its suggested educational track.

## Simplified vs. Advanced Mode

Use the UI Mode Toggle (top-right of the Studio header) to switch between:
- Simplified: shows the Educational Timeline and focuses on core educational workflows
- Advanced: shows the enhanced timeline with full controls

Your choice is persisted in localStorage and restored on next launch.

## Inspector: Educational Context

The Inspector displays the selected clip’s type and, when available, the current educational track badge in the header. Code clips expose educational properties like:
- Animation Mode (typing, line-by-line, diff)
- Typing speed and line reveal intervals
- Language detection and defaults
- Theme and font controls

## Preview: Track-Aware Overlay

During playback, a compact overlay lists the currently active educational tracks and the names of the items playing. This helps correlate what you hear/see with track semantics.

## Tips
- Use drag-and-drop from the Media Bin or double-click to quickly add assets with sensible defaults.
- For code, paste snippets in the Inspector and use the Auto-Detect button to set language defaults and educational animation presets.
- Keep narration on the Narration track for optimal audio mixing.

