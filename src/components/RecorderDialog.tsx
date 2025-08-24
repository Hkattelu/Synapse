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
  const [bubbleShape, setBubbleShape] = useState<'circle' | 'rounded'>(
    'circle'
  );
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

  // Note: URL revocation is handled explicitly in start/save/discard/cancel paths.
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
      try {
        URL.revokeObjectURL(pending.url);
      } catch {}
      setPending(null);
    }
    const s = stream ?? (await navigator.mediaDevices.getUserMedia({ audio: true, video: withCamera }));
    chunksRef.current = [];
    // Pick a supported mime type
    const pickMime = () => {
      const candidates = withCamera
        ? [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
          ]
        : ['audio/webm;codecs=opus', 'audio/webm'];
      for (const m of candidates) {
        // @ts-expect-error Safari types may not include isTypeSupported
        if (window.MediaRecorder?.isTypeSupported?.(m)) return m;
      }
      return '';
    };
    const mime = pickMime();
    const mr = mime
      ? new MediaRecorder(s, { mimeType: mime })
      : new MediaRecorder(s);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      // Get duration
      const duration = await getBlobDuration(url, withCamera ? 'video' : 'audio');
      setPending({ url, mime, duration: duration ?? null, withCamera });
      setIsRecording(false);
      setIsPaused(false);
    };
    mr.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    // Stop the recorder first (triggers onstop -> pending creation)
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
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
        try {
          (videoRef.current as any).srcObject = null;
        } catch {}
      }
    }
    // If there is a pending preview, discard it and revoke the URL
    if (pending?.url && pending.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(pending.url);
      } catch {}
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
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
                <input
                  type="checkbox"
                  checked={withCamera}
                  onChange={(e) => setWithCamera(e.target.checked)}
                />
                <span>Include camera video</span>
              </label>
              {withCamera && (
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                {!isRecording ? (
                  <button onClick={startRecording} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Start</button>
                ) : (
                  <button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Stop</button>
                )}
                <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
              </div>
            </>
          )}
          {pending && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">Recording ready. Choose an action:</p>
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
                      metadata: {
                        fileSize: pending.blob.size,
                        mimeType: pending.mime,
                      },
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
                      metadata: {
                        fileSize: pending.blob.size,
                        mimeType: pending.mime,
                      },
                    });
                    notify({ type: 'success', title: 'Recorder', message: 'Saved to Media Bin.' });
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
                <button onClick={() => { setPending(null); onClose(); }} className="px-4 py-2 rounded border">Discard</button>
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
