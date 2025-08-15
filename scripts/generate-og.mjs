import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

// Usage (PowerShell):
//   node .\scripts\generate-og.mjs public/launch/og-image.svg public/launch/og-image.png
// Defaults to the launch OG if no args are passed

const [,, inArg, outArg] = process.argv;
const projectRoot = process.cwd();
const inputPath = path.resolve(projectRoot, inArg || 'public/launch/og-image.svg');
const outputPath = path.resolve(projectRoot, outArg || 'public/launch/og-image.png');

async function main() {
  const svg = await fs.readFile(inputPath);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    background: 'rgba(0,0,0,0)'
  });
  const pngData = resvg.render().asPng();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, pngData);
  console.log(`Wrote: ${path.relative(projectRoot, outputPath)} (${Math.round(pngData.length / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

