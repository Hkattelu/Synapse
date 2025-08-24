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
  } | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);

  // Basic bubble config for talking head overlay
  const [bubbleEnabled, setBubbleEnabled] = useState(true);
  const [bubbleShape, setBubbleShape] = useState<'circle' | 'rounded'>('circle');
  const [bubbleCorner, setBubbleCorner] = useState<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('bottom-right');
  const [bubbleSize, setBubbleSize] = useState<'sm' | 'md'>('sm');

  // Revoke any previous pending preview URL when it is replaced or cleared
  useEffect(() => {
    return () => {
      if (pending?.url) {
        URL.revokeObjectURL(pending.url);
      }
    };
  }, [pending]);

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
    return () => {
      // Cleanup only when dialog closes/unmounts
      // Ensure recorder is stopped and all device tracks are released.
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      mediaRecorderRef.current = null;
      setIsPaused(false);
      setStream((s) => {
        s?.getTracks().forEach((t) => t.stop());
        return null;
      });
      if (videoRef.current) {
        // Detach preview to release camera
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (videoRef.current as any).srcObject = null;
      }
    };
  }, [isOpen]);

  const requestStream = async (): Promise<MediaStream | null> => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withCamera,
      });
      setStream(media);
      // Configure live preview to use the exact same MediaStream.
      if (videoRef.current && withCamera) {
        videoRef.current.srcObject = media;
        // Autoplay can reject; swallow to avoid noisy errors.
        await videoRef.current.play().catch(() => {});
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
    // Obtain a single MediaStream (existing or newly requested).
    const s = stream ?? (await requestStream());
    if (!s) return;

    // Ensure the preview element uses the same stream that will be recorded.
    if (withCamera && videoRef.current) {
      if (videoRef.current.srcObject !== s) {
        videoRef.current.srcObject = s;
      }
      await videoRef.current.play().catch(() => {});
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
      // Create a persistent URL for the review step
      const url = URL.createObjectURL(blob);
      // Create a temporary URL just to probe duration and revoke it inside the helper
      const tmpUrl = URL.createObjectURL(blob);
      const duration = await getBlobDuration(tmpUrl, withCamera ? 'video' : 'audio');
      setPending({ url, mime, duration: duration ?? null, withCamera });
      setIsRecording(false);
      setIsPaused(false);
    };
    mr.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    mediaRecorderRef.current = null;
    setIsPaused(false);
    // Always stop and release all tracks (audio and video)
    setStream((s) => {
      s?.getTracks().forEach((t) => t.stop());
      return null;
    });
    if (videoRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (videoRef.current as any).srcObject = null;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Record Narration</h3>
          <button
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                // Ensure any pre-acquired devices are released
                setStream((s) => {
                  s?.getTracks().forEach((t) => t.stop());
                  return null;
                });
                if (videoRef.current) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (videoRef.current as any).srcObject = null;
                }
              }
              // If a pending preview exists, revoke its URL and clear
              if (pending?.url) {
                URL.revokeObjectURL(pending.url);
              }
              setPending(null);
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
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
                <button
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      setStream((s) => {
                        s?.getTracks().forEach((t) => t.stop());
                        return null;
                      });
                      if (videoRef.current) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (videoRef.current as any).srcObject = null;
                      }
                    }
                    if (pending?.url) {
                      URL.revokeObjectURL(pending.url);
                    }
                    setPending(null);
                    onClose();
                  }}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
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
                  onClick={async () => {
                    // Move from temporary pending URL to a fresh asset URL
                    let assetUrl = pending.url;
                    try {
                      const resp = await fetch(pending.url);
                      const b = await resp.blob();
                      assetUrl = URL.createObjectURL(b);
                    } catch {}
                    const id = addMediaAsset({
                      name: pending.withCamera ? `Recording ${new Date().toISOString()}.webm` : `Narration ${new Date().toISOString()}.webm`,
                      type: pending.withCamera ? 'video' : 'audio',
                      url: assetUrl,
                      duration: pending.duration ?? undefined,
                      metadata: { fileSize: 0, mimeType: pending.mime },
                    });
                    // Add to timeline at playhead
                    const start = playback.currentTime || 0;
                    addTimelineItem({
                      assetId: id,
                      startTime: start,
                      duration: Math.max(0.1, pending.duration ?? 5),
                      track: 0,
                      type: pending.withCamera ? 'video' : 'audio',
                      properties: pending.withCamera && bubbleEnabled
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
                    if (pending.url) URL.revokeObjectURL(pending.url);
                    setPending(null);
                    onClose();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                >
                  Save & Add to timeline
                </button>
                <button
                  onClick={async () => {
                    // Create a fresh object URL for the asset and revoke the temporary pending URL
                    let assetUrl = pending.url;
                    try {
                      const resp = await fetch(pending.url);
                      const b = await resp.blob();
                      assetUrl = URL.createObjectURL(b);
                    } catch {}
                    addMediaAsset({
                      name: pending.withCamera ? `Recording ${new Date().toISOString()}.webm` : `Narration ${new Date().toISOString()}.webm`,
                      type: pending.withCamera ? 'video' : 'audio',
                      url: assetUrl,
                      duration: pending.duration ?? undefined,
                      metadata: { fileSize: 0, mimeType: pending.mime },
                    });
                    notify({ type: 'success', title: 'Recorder', message: 'Saved to Media Bin.' });
                    if (pending.url) URL.revokeObjectURL(pending.url);
                    setPending(null);
                    onClose();
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded"
                >
                  Save to Media Bin
                </button>
                <button
                  onClick={() => {
                    if (pending.url) URL.revokeObjectURL(pending.url);
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

