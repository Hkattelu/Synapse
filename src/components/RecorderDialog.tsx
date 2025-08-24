import React, { useEffect, useRef, useState } from 'react';
import { useMediaAssets, useTimeline } from '../state/hooks';
import { useNotifications } from '../state/notifications';
import { usePlayback } from '../state/hooks';

interface RecorderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecorderDialog({ isOpen, onClose }: RecorderDialogProps) {
  const { addMediaAsset } = useMediaAssets();
  const { addTimelineItem } = useTimeline();
  const { playback } = usePlayback();
  const { notify } = useNotifications();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [withCamera, setWithCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pending, setPending] = useState<{
    url: string;
    mime: string;
    duration: number | null;
    withCamera: boolean;
    blob: Blob;
  } | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);

  // Basic bubble config for talking head overlay
  const [bubbleEnabled, setBubbleEnabled] = useState(true);
  const [bubbleShape, setBubbleShape] = useState<'circle' | 'rounded'>('circle');
  const [bubbleCorner, setBubbleCorner] = useState<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('bottom-right');
  const [bubbleSize, setBubbleSize] = useState<'sm' | 'md'>('sm');

  useEffect(() => {
    if (!isOpen) return;
    // Environment checks
    if (!window.isSecureContext) {
      setEnvError('Recording requires a secure context (HTTPS).');
    } else if (
      !('mediaDevices' in navigator) ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setEnvError('This browser does not support media capture.');
    } else if (!('MediaRecorder' in window)) {
      setEnvError('MediaRecorder is not supported in this browser.');
    } else {
      setEnvError(null);
    }

    // Cleanup on dialog close/unmount: stop tracks, clear refs
    return () => {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      setIsPaused(false);
      const s = stream;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
      }
      setStream(null);
      if (videoRef.current) {
        try {
          (videoRef.current as any).srcObject = null;
        } catch {}
      }
    };
  }, [isOpen]);

  // Revoke any previously-created pending preview URL when it is replaced/cleared or on unmount
  useEffect(() => {
    return () => {
      if (pending?.url && pending.url.startsWith('blob:')) {
        URL.revokeObjectURL(pending.url);
      }
    };
  }, [pending?.url]);
  const requestStream = async (): Promise<MediaStream | null> => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withCamera,
      });
      setStream(media);
      if (videoRef.current && withCamera) {
        try {
          (videoRef.current as any).srcObject = media;
          await videoRef.current.play().catch(() => {});
        } catch {}
      }
      return media;
    } catch (e) {
      notify({
        type: 'error',
        title: 'Recorder',
        message: 'Permission denied or device not available.',
      });
      return null;
    }
  };

  const startRecording = async () => {
    if (envError) {
      notify({ type: 'error', title: 'Recorder', message: envError });
      return;
    }
    // If a previous pending preview exists (user recorded before and didn't save), revoke it
    if (pending?.url) {
      try { URL.revokeObjectURL(pending.url); } catch {}
      setPending(null);
    }
    const s = stream ?? (await requestStream());
    if (!s) return;
    // Ensure the live preview uses the same stream we are about to record
    if (withCamera && videoRef.current && (videoRef.current as any).srcObject !== s) {
      try {
        (videoRef.current as any).srcObject = s;
        await videoRef.current.play().catch(() => {});
      } catch {}
    }
    chunksRef.current = [];
    // Pick a supported mime type
    const pickMime = () => {
      const candidates = withCamera
        ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
        : ['audio/webm;codecs=opus', 'audio/webm'];
      for (const m of candidates) {
        // @ts-expect-error Safari types may not include isTypeSupported
        if (window.MediaRecorder?.isTypeSupported?.(m)) return m;
      }
      return '';
    };
    const mime = pickMime();
    const mr = mime ? new MediaRecorder(s, { mimeType: mime }) : new MediaRecorder(s);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      // Create a dedicated preview URL for the pending review step
      const previewUrl = URL.createObjectURL(blob);
      // Measure duration via a temporary URL that we immediately revoke inside helper
      const tempUrl = URL.createObjectURL(blob);
      const duration = await getBlobDuration(tempUrl, withCamera ? 'video' : 'audio');
      setPending({ url: previewUrl, mime, duration: duration ?? null, withCamera, blob });
      setIsRecording(false);
      setIsPaused(false);
    };
    mr.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    // Stop the recorder first (triggers onstop -> pending creation)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    setIsPaused(false);
    // Always stop and release all device tracks (audio and video)
    const s = stream;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    if (videoRef.current) {
      try {
        (videoRef.current as any).srcObject = null;
      } catch {}
    }
  };

  const togglePause = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (isPaused) {
      mr.resume();
      setIsPaused(false);
    } else {
      mr.pause();
      setIsPaused(true);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    } else {
      const s = stream;
      if (s) s.getTracks().forEach((t) => t.stop());
      setStream(null);
      if (videoRef.current) {
        try { (videoRef.current as any).srcObject = null; } catch {}
      }
    }
    // If there is a pending preview, discard it and revoke the URL
    if (pending?.url && pending.url.startsWith('blob:')) {
      try { URL.revokeObjectURL(pending.url); } catch {}
    }
    setPending(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Record Narration</h3>
          <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {envError && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
              {envError} Please open this site over HTTPS and try again.
            </div>
          )}
          {!pending && (
            <>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={withCamera} onChange={(e) => setWithCamera(e.target.checked)} />
                <span>Include camera video</span>
              </label>
              {withCamera && (
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center space-x-2">
                {!isRecording ? (
                  <button onClick={startRecording} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded" disabled={!!envError}>
                    Start
                  </button>
                ) : (
                  <>
                    <button onClick={togglePause} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded">
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Stop</button>
                  </>
                )}
                <button onClick={handleCancel} className="px-4 py-2 rounded border">Cancel</button>
              </div>
            </>
          )}
          {pending && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">Recording ready. Choose an action:</p>
              {pending.withCamera && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={bubbleEnabled}
                        onChange={(e) => setBubbleEnabled(e.target.checked)}
                      />
                      <span>Render as corner bubble</span>
                    </label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={bubbleCorner}
                      onChange={(e) =>
                        setBubbleCorner(e.target.value as typeof bubbleCorner)
                      }
                      title="Corner position"
                    >
                      <option value="top-left">Top-left</option>
                      <option value="top-right">Top-right</option>
                      <option value="bottom-left">Bottom-left</option>
                      <option value="bottom-right">Bottom-right</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-sm">
                      <label className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name="shape"
                          value="circle"
                          checked={bubbleShape === 'circle'}
                          onChange={() => setBubbleShape('circle')}
                        />
                        <span>Circle</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name="shape"
                          value="rounded"
                          checked={bubbleShape === 'rounded'}
                          onChange={() => setBubbleShape('rounded')}
                        />
                        <span>Rounded</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span>Size</span>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={bubbleSize}
                        onChange={(e) =>
                          setBubbleSize(e.target.value as typeof bubbleSize)
                        }
                        title="Bubble size"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                      </select>
                    </div>
                  </div>
                  {/* Bubble preview */}
                  <div className="relative w-full h-40 bg-neutral-100 rounded">
                    <video
                      src={pending.url}
                      muted
                      playsInline
                      autoPlay
                      loop
                      className="absolute"
                      style={{
                        width: bubbleSize === 'md' ? 128 : 96,
                        height: bubbleSize === 'md' ? 128 : 96,
                        overflow: 'hidden',
                        borderRadius: bubbleShape === 'circle' ? 9999 : 16,
                        objectFit: 'cover',
                        ...(bubbleCorner.includes('top')
                          ? { top: 12 }
                          : { bottom: 12 }),
                        ...(bubbleCorner.includes('left')
                          ? { left: 12 }
                          : { right: 12 }),
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Create a fresh URL for the saved asset; revoke the pending preview URL
                    const assetUrl = URL.createObjectURL(pending.blob);
                    const id = addMediaAsset({
                      name: pending.withCamera
                        ? `Recording ${new Date().toISOString()}.webm`
                        : `Narration ${new Date().toISOString()}.webm`,
                      type: pending.withCamera ? 'video' : 'audio',
                      url: assetUrl,
                      duration: pending.duration ?? undefined,
                      metadata: { fileSize: pending.blob.size, mimeType: pending.mime },
                    });
                    // Add to timeline at playhead
                    const start = playback.currentTime || 0;
                    addTimelineItem({
                      assetId: id,
                      startTime: start,
                      duration: Math.max(0.1, pending.duration ?? 5),
                      track: 0,
                      type: pending.withCamera ? 'video' : 'audio',
                      properties:
                        pending.withCamera && bubbleEnabled
                          ? {
                              talkingHeadEnabled: true,
                              talkingHeadCorner: bubbleCorner,
                              talkingHeadShape: bubbleShape,
                              talkingHeadSize: bubbleSize,
                            }
                          : {},
                      animations: [],
                      keyframes: [],
                    });
                    notify({ type: 'success', title: 'Recorder', message: 'Added to Media Bin and timeline.' });
                    // Revoke the temporary preview URL now that the asset owns its own URL
                    if (pending.url && pending.url.startsWith('blob:')) {
                      try { URL.revokeObjectURL(pending.url); } catch {}
                    }
                    setPending(null);
                    notify({
                      type: 'success',
                      title: 'Recorder',
                      message: 'Added to Media Bin and timeline.',
                    });
                    onClose();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                >
                  Save & Add to timeline
                </button>
                <button
                  onClick={() => {
                    // Create a fresh URL for the saved asset; revoke the pending preview URL
                    const assetUrl = URL.createObjectURL(pending.blob);
                    addMediaAsset({
                      name: pending.withCamera
                        ? `Recording ${new Date().toISOString()}.webm`
                        : `Narration ${new Date().toISOString()}.webm`,
                      type: pending.withCamera ? 'video' : 'audio',
                      url: assetUrl,
                      duration: pending.duration ?? undefined,
                      metadata: { fileSize: pending.blob.size, mimeType: pending.mime },
                    });
                    notify({ type: 'success', title: 'Recorder', message: 'Saved to Media Bin.' });
                    if (pending.url && pending.url.startsWith('blob:')) {
                      try { URL.revokeObjectURL(pending.url); } catch {}
                    }
                    setPending(null);
                    notify({
                      type: 'success',
                      title: 'Recorder',
                      message: 'Saved to Media Bin.',
                    });
                    onClose();
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded"
                >
                  Save to Media Bin
                </button>
                <button
                  onClick={() => {
                    if (pending.url && pending.url.startsWith('blob:')) {
                      try { URL.revokeObjectURL(pending.url); } catch {}
                    }
                    setPending(null);
                    onClose();
                  }}
                  className="px-4 py-2 rounded border"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function getBlobDuration(url: string, kind: 'audio' | 'video') {
  return new Promise<number | null>((resolve) => {
    const el = document.createElement(kind);
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const d = el.duration;
      URL.revokeObjectURL(url);
      resolve(isFinite(d) ? d : null);
    };
    el.onerror = () => resolve(null);
    el.src = url;
  });
}
