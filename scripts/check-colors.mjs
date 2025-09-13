#!/usr/bin/env node
// Simple color hygiene check: flag raw hex colors and disallowed Tailwind color classes.
// Allows anything with the `synapse-` prefix and CSS variable usage.

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const ALLOWED_PREFIX = 'synapse-';

const forbiddenRegexes = [
  // Raw hex colors (excluding URLs or SVG path data heuristically kept simple)
  /#[0-9a-fA-F]{3,8}\b/g,
  // Tailwind classic color classes (bg-*, text-*, border-*) except synapse-
  /(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900)\b/g,
  // Common focus ring colors
  /focus:(ring|border)-(blue|purple|green|red|yellow)-(300|400|500|600|700)\b/g,
];

const allowList = [
  // Allow transparent and currentColor in inline styles
  'transparent',
  'currentColor',
];

/** Recursively walk */
function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else if (/\.(tsx?|jsx?|css|mdx?)$/.test(e.name)) files.push(full);
  }
  return files;
}

const files = walk(SRC);
let hasError = false;
const problems = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const rx of forbiddenRegexes) {
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(content))) {
      const match = m[0];
      // Skip matches that use our allowed prefix (e.g., bg-synapse-*)
      if (match.includes(ALLOWED_PREFIX)) continue;
      // Skip allowed literals
      if (allowList.includes(match)) continue;
      problems.push({ file, index: m.index, match });
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\nColor hygiene check failed. Found disallowed color usage:');
  for (const p of problems) {
    console.error(` - ${p.file}: ${p.match} @ ${p.index}`);
  }
  console.error(
    '\nUse synapse tokens (bg-synapse-*, text-synapse-*, border-synapse-*) or CSS variables.'
  );
  process.exit(1);
} else {
  console.log('Color hygiene check passed.');
}
