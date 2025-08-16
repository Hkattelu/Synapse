import React, { useEffect, useRef, useState } from 'react';

interface WaveformProps {
  src: string;
  height?: number;
}

export const AudioWaveform: React.FC<WaveformProps> = ({ src, height = 54 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    async function draw() {
      try {
        const resp = await fetch(src);
        const buf = await resp.arrayBuffer();
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audio = await ctx.decodeAudioData(buf.slice(0));
        if (isCancelled) return;
        const data = audio.getChannelData(0);
        const sampleCount = 200; // bars
        const blockSize = Math.floor(data.length / sampleCount);
        const samples: number[] = [];
        for (let i = 0; i < sampleCount; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) sum += Math.abs(data[start + j] || 0);
          samples.push(sum / blockSize);
        }
        const cvs = canvasRef.current;
        if (!cvs) return;
        const dpr = window.devicePixelRatio || 1;
        const width = 250;
        cvs.width = width * dpr;
        cvs.height = height * dpr;
        cvs.style.width = width + 'px';
        cvs.style.height = height + 'px';
        const g = cvs.getContext('2d');
        if (!g) return;
        g.scale(dpr, dpr);
        g.clearRect(0, 0, width, height);
        const barWidth = width / sampleCount;
        g.fillStyle = '#64748b';
        const mid = height / 2;
        samples.forEach((v, i) => {
          const h = Math.max(2, v * height);
          const x = i * barWidth + 1;
          g.fillRect(x, mid - h / 2, Math.max(1, barWidth - 2), h);
        });
      } catch (e) {
        setError('');
      }
    }
    draw();
    return () => {
      isCancelled = true;
    };
  }, [src, height]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

