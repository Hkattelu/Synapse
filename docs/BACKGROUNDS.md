# Backgrounds: Themes, Wallpapers, and Subtle Motion

This app now supports a richer set of code themes and non-distracting animated backgrounds inspired by hackreels-style visuals.

## What’s included

- More built-in code themes: Tokyo Night, Nord, Gruvbox Dark, Catppuccin Mocha (alongside the existing set).
- Background options under “Backgrounds” in the Inspector:
  - Color
  - Gradient (with presets)
  - Image (Wallpapers), including subtle animated GIFs
- Gentle, built-in motion:
  - Gradients rotate a few degrees over time
  - Image wallpapers apply a very subtle Ken Burns pan/zoom

Motion is intentionally minimal to avoid distracting from content.

## Selecting themes and backgrounds

- Open the Inspector → Visual → Backgrounds tab.
- Choose from Color, Gradient, or Image.
- For Image backgrounds, the picker now shows an “Animated” badge for subtle motion options. GIFs are supported.
- Opacity and (for images) blend mode are available beneath the picker.

## Accessibility: Reduce Motion

We honor “prefers-reduced-motion” and provide an explicit app toggle:

- Open Inspector → Settings → Accessibility → “Reduce motion”.
- When enabled (or when the OS preference requests it):
  - Animated GIF wallpapers display their static fallback (when provided) or a thumbnail.
  - Gradient rotation and image pan/zoom are disabled.

## Performance notes

- Animated backgrounds are designed to be light. Keep GIFs small (< 10 MB recommended).
- For exports using Remotion, the built-in gradient/image motion is driven by the timeline and remains subtle.

## Adding your own wallpapers

Use the “+ Upload” button in the Image picker. Supported formats:

- JPEG, PNG, SVG, WebP, and GIF (animated).

If you upload a GIF, consider providing a static fallback via code or using a small file. Custom uploads are validated for format, size, and dimensions.

## Known behavior

- Animated GIFs are supported; when Reduce Motion is enabled, we use a static fallback (if configured) or the generated thumbnail.
