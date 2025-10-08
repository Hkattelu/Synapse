import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { useMediaAssets, useTimeline, useProject, usePlayback } from '../state/hooks';
import { useNotifications } from '../state/notifications';
import { generateId } from '../lib/utils';

interface RecorderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AudioLevelMeter = lazy(() =>
  import('./AudioLevelMeter').then((m) => ({ default: m.AudioLevelMeter }))
);

export function RecorderDialog({ isOpen, onClose }: RecorderDialogProps) {
  const { addMediaAsset, updateMediaAsset } = useMediaAssets();
  const { addTimelineItem } = useTimeline();
  const { playback } = usePlayback();
  const { project, updateProject } = useProject();
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

  // Mic toggle and audio analysis refs
  const [withMic, setWithMic] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

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
      // Clean up audio analysis
      try {
        audioSourceRef.current?.disconnect();
      } catch {}
      try {
        audioCtxRef.current?.close();
      } catch {}
      audioSourceRef.current = null;
      audioCtxRef.current = null;
    };
  }, [isOpen]);

  // When opening the dialog or toggling capture settings, prepare stream
  useEffect(() => {
    if (!isOpen || isRecording) return;
    const setup = async () => {
      const needMedia = withCamera || withMic;
      if (needMedia) {
        const s = await requestStream();
        if (!s) return;
      } else {
        // Neither camera nor mic requested: tear down
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
        // Clean up audio analysis
        try {
          audioSourceRef.current?.disconnect();
        } catch {}
        try {
          audioCtxRef.current?.close();
        } catch {}
        audioSourceRef.current = null;
        audioCtxRef.current = null;
      }
    };
    void setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withCamera, withMic, isOpen, isRecording]);

  // Set up audio analysis source when stream or mic setting changes
  useEffect(() => {
    if (!stream || !withMic) {
      return;
    }
    try {
      const hasAudio = stream.getAudioTracks().length > 0;
      if (!hasAudio) return;
      const Ctor: typeof AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      audioSourceRef.current = src;
      // Try to resume immediately so level meter works before recording
      try {
        if (ctx.state === 'suspended') void ctx.resume();
      } catch {}
    } catch {}
    return () => {
      try {
        audioSourceRef.current?.disconnect();
      } catch {}
      try {
        audioCtxRef.current?.close();
      } catch {}
      audioSourceRef.current = null;
      audioCtxRef.current = null;
    };
  }, [stream, withMic]);

  // Note: URL revocation is handled explicitly in start/save/discard/cancel paths.
  const requestStream = async (): Promise<MediaStream | null> => {
    try {
      // Stop previous stream (if any) before requesting new constraints
      if (stream) {
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {}
        setStream(null);
      }
      if (videoRef.current) {
        try {
          (videoRef.current as any).srcObject = null;
        } catch {}
      }
      try {
        audioSourceRef.current?.disconnect();
      } catch {}
      try {
        audioCtxRef.current?.close();
      } catch {}
      audioSourceRef.current = null;
      audioCtxRef.current = null;

      const media = await navigator.mediaDevices.getUserMedia({
        audio: withMic
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: withCamera
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            }
          : false,
      });
      setStream(media);
      if (videoRef.current && withCamera) {
        try {
          (videoRef.current as any).srcObject = media;
          // Ensure attributes are set before play for autoplay policies
          videoRef.current.muted = true;
          videoRef.current.playsInline = true as any;
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
    const s = stream ?? (await requestStream());
    if (!s) return;
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
      const duration = await getBlobDuration(
        url,
        withCamera ? 'video' : 'audio'
      );
      setPending({ url, mime, duration: duration ?? null, withCamera, blob });
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
    // Clean up audio analysis
    try {
      audioSourceRef.current?.disconnect();
    } catch {}
    try {
      audioCtxRef.current?.close();
    } catch {}
    audioSourceRef.current = null;
    audioCtxRef.current = null;
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
      // Clean up audio analysis
      try {
        audioSourceRef.current?.disconnect();
      } catch {}
      try {
        audioCtxRef.current?.close();
      } catch {}
      audioSourceRef.current = null;
      audioCtxRef.current = null;
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
          <button
            onClick={onClose}
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
                <input
                  type="checkbox"
                  checked={withCamera}
                  onChange={(e) => setWithCamera(e.target.checked)}
                  disabled={isRecording}
                  title={isRecording ? 'Stop recording to change camera option' : ''}
                />
                <span>Include camera video</span>
              </label>
              {withCamera && (
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Mic Toggle */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={withMic}
                  onChange={(e) => setWithMic(e.target.checked)}
                  disabled={isRecording}
                />
                <span>Record microphone narration</span>
              </label>
              {withMic && (
                <div className="pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-md border bg-gray-50">
                    <div className="w-5 h-5 flex items-center justify-center text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
                        <path d="M19 11a1 1 0 10-2 0 5 5 0 11-10 0 1 1 0 10-2 0 7 7 0 0011 5.197V20h-3a1 1 0 100 2h6a1 1 0 100-2h-1v-3a7 7 0 001-6z" />
                      </svg>
                    </div>
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-ignore - component accepts AudioNode */}
                    <Suspense
                      fallback={<div className="h-3 bg-gray-200 rounded w-[240px]" />}
                    >
                      <AudioLevelMeter
                        audioContext={audioCtxRef.current || undefined}
                        audioSource={audioSourceRef.current || undefined}
                        style="linear"
                        width={240}
                        height={10}
                        color="#22c55e"
                        backgroundColor="#111827"
                      />
                    </Suspense>
                    {!stream && (
                      <button
                        onClick={async () => {
                          // Explicitly request mic and resume context on user gesture
                          const s = await requestStream();
                          try {
                            const ctx = audioCtxRef.current;
                            if (ctx && ctx.state === 'suspended') await ctx.resume();
                          } catch {}
                        }}
                        className="ml-2 text-xs px-2 py-1 rounded border text-gray-700 hover:bg-gray-100"
                        title="Enable mic monitoring"
                      >
                        Test mic
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  >
                    Start
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Stop
                  </button>
                )}
                <button onClick={onClose} className="px-4 py-2 rounded border">
                  Cancel
                </button>
              </div>
            </>
          )}
          {pending && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Recording ready. Choose an action:
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    // Create a fresh URL for the saved asset; revoke the pending preview URL
                    const assetUrl = URL.createObjectURL(pending.blob);
                    const name = pending.withCamera
                      ? `Recording ${new Date().toISOString()}.webm`
                      : `Narration ${new Date().toISOString()}.webm`;
                    const id = addMediaAsset({
                      name,
                      type: pending.withCamera ? 'video' : 'audio',
                      url: assetUrl,
                      duration: pending.duration ?? undefined,
                      metadata: {
                        fileSize: pending.blob.size,
                        mimeType: pending.mime,
                      },
                    });

                    // Fire-and-forget: persist the blob to server and swap URL to absolute HTTP so export can proceed
                    (async () => {
                      try {
                        const resp = await fetch('/api/uploads', {
                          method: 'POST',
                          headers: {
                            'x-filename': name,
                            'content-type': pending.mime || 'application/octet-stream',
                          },
                          body: pending.blob,
                        });
                        if (resp.ok) {
                          const body = (await resp.json()) as { url?: string };
                          if (body?.url) {
                            updateMediaAsset(id, { url: body.url });
                            // Revoke the temporary blob URL
                            try { if (assetUrl.startsWith('blob:')) URL.revokeObjectURL(assetUrl); } catch {}
                          }
                        }
                      } catch (e) {
                        console.warn('Recorder upload failed:', e);
                      }
                    })();

                    // Add to timeline at playhead
                    const start = playback.currentTime || 0;
                    addTimelineItem({
                      assetId: id,
                      startTime: start,
                      duration: Math.max(0.1, pending.duration ?? 5),
                      // Smart placement: camera video -> You track (3), narration audio -> Narration track (2)
                      track: pending.withCamera ? 3 : 2,
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

                    // Ensure the 'You' track group exists so the track is displayed
                    try {
                      if (pending.withCamera) {
                        const groups = project?.trackGroups || [];
                        const hasYou = groups.some(
                          (g) =>
                            g.tracks.includes(3) ||
                            g.name.trim().toLowerCase() === 'you'
                        );
                        if (!hasYou) {
                          const newGroup = {
                            id: generateId(),
                            name: 'You',
                            tracks: [3],
                            color: '#EF4444',
                            visible: true,
                            locked: false,
                            solo: false,
                          };
                          updateProject?.({ trackGroups: [...groups, newGroup] });
                        }
                      }
                    } catch {}

                    notify({
                      type: 'success',
                      title: 'Recorder',
                      message: 'Added to Media Bin and timeline.',
                    });
                    setPending(null);
                    onClose();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                >
                  Save & Add to timeline
                </button>
                <button
                  onClick={async () => {
                    // Create a fresh URL for the saved asset; revoke the pending preview URL
                    const assetUrl = URL.createObjectURL(pending.blob);
                    const name = pending.withCamera
                      ? `Recording ${new Date().toISOString()}.webm`
                      : `Narration ${new Date().toISOString()}.webm`;
                    const id = addMediaAsset({
                      name,
                      type: pending.withCamera ? 'video' : 'audio',
                      url: assetUrl,
                      duration: pending.duration ?? undefined,
                      metadata: {
                        fileSize: pending.blob.size,
                        mimeType: pending.mime,
                      },
                    });

                    // Persist blob to server in background and swap URL
                    (async () => {
                      try {
                        const resp = await fetch('/api/uploads', {
                          method: 'POST',
                          headers: {
                            'x-filename': name,
                            'content-type': pending.mime || 'application/octet-stream',
                          },
                          body: pending.blob,
                        });
                        if (resp.ok) {
                          const body = (await resp.json()) as { url?: string };
                          if (body?.url) {
                            updateMediaAsset(id, { url: body.url });
                            try { if (assetUrl.startsWith('blob:')) URL.revokeObjectURL(assetUrl); } catch {}
                          }
                        }
                      } catch (e) {
                        console.warn('Recorder upload failed:', e);
                      }
                    })();

                    notify({
                      type: 'success',
                      title: 'Recorder',
                      message: 'Saved to Media Bin.',
                    });
                    setPending(null);
                    onClose();
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded"
                >
                  Save to Media Bin
                </button>
                <button
                  onClick={() => {
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
