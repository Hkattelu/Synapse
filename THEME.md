# Synapse Studio - Theme System

## Overview

Synapse Studio uses a comprehensive theme system based on the beautiful [Catppuccin Macchiato](https://catppuccin.com/palette/) color palette. This system is designed for easy theme switching and future light mode support.

## Color System

### 🎨 Catppuccin Macchiato Palette

Our theme is built on the Catppuccin Macchiato flavor, which provides a medium contrast dark theme with gentle, soothing colors perfect for long coding and video editing sessions.

#### Accent Colors
- **Rosewater** `#f4dbd6` - Warm highlights
- **Flamingo** `#f0c6c6` - Soft emphasis  
- **Pink** `#f5bde6` - Creative accents
- **Mauve** `#c6a0f6` - Video clip color
- **Red** `#ed8796` - Error states
- **Maroon** `#ee99a0` - Secondary alerts
- **Peach** `#f5a97f` - Playhead indicator
- **Yellow** `#eed49f` - Text clip color
- **Green** `#a6da95` - Audio clip color / Success states
- **Teal** `#8bd5ca` - Interactive highlights
- **Sky** `#91d7e3` - Active states
- **Sapphire** `#7dc4e4` - Hover states
- **Blue** `#8aadf4` - Primary brand color
- **Lavender** `#b7bdf8` - Code clip color

#### Neutral Colors
- **Text** `#cad3f5` - Primary text
- **Subtext1** `#b8c0e0` - Secondary text
- **Subtext0** `#a5adcb` - Muted text
- **Overlay2** `#939ab7` - Subtle overlays
- **Overlay1** `#8087a2` - Medium overlays
- **Overlay0** `#6e738d` - Strong overlays
- **Surface2** `#5b6078` - Elevated surfaces
- **Surface1** `#494d64` - Secondary surfaces
- **Surface0** `#363a4f` - Primary surfaces
- **Base** `#24273a` - Main background
- **Mantle** `#1e2030` - Alternative background
- **Crust** `#181926` - Deepest background

## CSS Variables

The theme system uses CSS variables for easy customization and future theme switching:

### Semantic Color Tokens
```css
/* Brand Colors */
--synapse-primary: var(--synapse-blue);
--synapse-primary-hover: var(--synapse-sapphire);
--synapse-primary-active: var(--synapse-sky);

/* Interface Colors */
--synapse-background: var(--synapse-base);
--synapse-surface: var(--synapse-surface0);
--synapse-border: var(--synapse-surface2);

/* Text Colors */
--synapse-text-primary: var(--synapse-text);
--synapse-text-secondary: var(--synapse-subtext1);
--synapse-text-muted: var(--synapse-subtext0);

/* Creative Tool Colors */
--synapse-clip-video: var(--synapse-mauve);
--synapse-clip-audio: var(--synapse-green);
--synapse-clip-text: var(--synapse-yellow);
--synapse-clip-code: var(--synapse-lavender);
--synapse-playhead: var(--synapse-peach);
```

## Tailwind Integration

All colors are integrated into Tailwind CSS with the `synapse-` prefix:

```html
<!-- Using theme colors in components -->
<div class="bg-synapse-background text-synapse-text-primary">
  <button class="bg-synapse-primary hover:bg-synapse-primary-hover">
    Click me
  </button>
</div>
```

## Utility Classes

### Glass Effect
```css
.synapse-glass {
  background: rgba(54, 58, 79, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(202, 211, 245, 0.1);
}
```

### Brand Gradient
```css
.synapse-brand-gradient {
  background: linear-gradient(135deg, var(--synapse-blue), var(--synapse-mauve));
}
```

### Text Gradient
```css
.synapse-text-gradient {
  background: linear-gradient(135deg, var(--synapse-text), var(--synapse-subtext1));
  background-clip: text;
  color: transparent;
}
```

### Glow Effect
```css
.synapse-glow {
  box-shadow: 0 0 20px rgba(138, 173, 244, 0.3);
}
```

## Design Philosophy

### 🎬 Video Creator Focus
The color system is specifically designed for video creators with:
- **High contrast** for text readability during long editing sessions
- **Distinct clip colors** for easy timeline organization
- **Gentle on the eyes** to reduce strain during extended use
- **Professional appearance** suitable for content creation workflows

### 🎮 Game Developer Friendly
- **Code syntax highlighting** optimized colors
- **Dark theme** preferred by developers
- **Consistent visual hierarchy** for complex interfaces
- **Accessible color contrasts** for all users

## Future Light Mode Support

The theme system is structured to support light mode themes in the future:

```css
[data-theme="light"] {
  /* Light mode variables would override dark mode here */
  --synapse-background: #eff1f5; /* Catppuccin Latte Base */
  --synapse-text-primary: #4c4f69; /* Catppuccin Latte Text */
  /* ... additional light mode colors */
}
```

## Animation System

Consistent animation timing for smooth interactions:

```css
--synapse-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--synapse-transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--synapse-transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

## Brand Identity

### Logo & Typography
- **Brand symbol:** ✦ (representing creative synthesis)
- **Typography:** Clean, modern sans-serif
- **Voice:** Professional yet approachable

### Color Psychology
- **Blue (Primary):** Trust, reliability, creativity
- **Mauve (Video):** Creativity, imagination
- **Green (Audio):** Growth, harmony, balance  
- **Yellow (Text):** Clarity, communication
- **Peach (Playhead):** Energy, enthusiasm

## Contributing

When adding new components or features:

1. Use semantic color tokens instead of raw color values
2. Follow the established naming conventions
3. Ensure proper contrast ratios for accessibility
4. Test with both current and future theme variations
5. Document any new color tokens or utility classes

## Credits

- **Color Palette:** [Catppuccin](https://catppuccin.com/) - An amazing community-driven pastel theme
- **Design Inspiration:** Modern video editing tools optimized for creator workflows
- **Implementation:** Custom CSS variables system with Tailwind CSS integration
