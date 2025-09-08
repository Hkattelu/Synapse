#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Simple SVG logo generator for Synapse Studio
// Usage: node ./scripts/generate-logo.mjs [outSvgPath]
// Defaults to public/branding/logo.svg

const outArg = process.argv[2] || 'public/branding/logo.svg';
const outPath = resolve(process.cwd(), outArg);
mkdirSync(dirname(outPath), { recursive: true });

// Brand colors
const primary = '#7C3AED'; // purple-600
const accent = '#06B6D4'; // cyan-500
const text = '#0F172A'; // slate-900

// Create a simple connected-nodes mark + wordmark
const svg = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="64" viewBox="0 0 256 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Synapse Studio logo</title>
  <desc id="desc">Connected nodes forming a synapse with a wordmark</desc>
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.6"/>
    </filter>
  </defs>

  <!-- Mark: three connected nodes -->
  <g transform="translate(8,8)">
    <circle cx="16" cy="24" r="8" fill="url(#g1)" />
    <circle cx="40" cy="12" r="6" fill="url(#g1)" />
    <circle cx="44" cy="34" r="6" fill="url(#g1)" />
    <path d="M21 22 L35 14" stroke="${primary}" stroke-width="2.5" stroke-linecap="round" />
    <path d="M22 26 L39 32" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" />
    <path d="M40 12 Q32 24 44 34" stroke="${text}" stroke-opacity="0.15" stroke-width="2" fill="none" />
    <circle cx="16" cy="24" r="10" fill="none" stroke="${primary}" stroke-opacity="0.18" filter="url(#soft)" />
  </g>

  <!-- Wordmark -->
  <g transform="translate(72,36)">
    <text x="0" y="0" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="22" font-weight="700" fill="${text}">Synapse</text>
    <text x="115" y="0" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="22" font-weight="500" fill="${primary}">Studio</text>
  </g>
</svg>
`;

writeFileSync(outPath, svg, 'utf8');
console.log(`Generated logo: ${outPath}`);
