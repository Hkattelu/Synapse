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

  useEffect(() => {
    if (!isOpen) return;
    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      setStream(null);
    };
  }, [isOpen, stream]);

  const requestStream = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withCamera,
      });
      setStream(media);
      if (videoRef.current && withCamera) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
    } catch (e) {
      notify({ type: 'error', title: 'Recorder', message: 'Permission denied or device not available.' });
    }
  };

  const startRecording = async () => {
    if (!stream) {
      await requestStream();
    }
    const s = stream ?? (await navigator.mediaDevices.getUserMedia({ audio: true, video: withCamera }));
    chunksRef.current = [];
    const mime = withCamera
      ? 'video/webm;codecs=vp9,opus'
      : 'audio/webm;codecs=opus';
    const mr = new MediaRecorder(s, { mimeType: mime });
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
    };
    mr.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (!withCamera && stream) {
      // Keep audio stream minimal
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
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
                    const id = addMediaAsset({
                      name: pending.withCamera ? `Recording ${new Date().toISOString()}.webm` : `Narration ${new Date().toISOString()}.webm`,
                      type: pending.withCamera ? 'video' : 'audio',
                      url: pending.url,
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
                      properties: {},
                      animations: [],
                      keyframes: [],
                    });
                    notify({ type: 'success', title: 'Recorder', message: 'Added to Media Bin and timeline.' });
                    setPending(null);
                    onClose();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                >
                  Save & Add to timeline
                </button>
                <button
                  onClick={() => {
                    addMediaAsset({
                      name: pending.withCamera ? `Recording ${new Date().toISOString()}.webm` : `Narration ${new Date().toISOString()}.webm`,
                      type: pending.withCamera ? 'video' : 'audio',
                      url: pending.url,
                      duration: pending.duration ?? undefined,
                      metadata: { fileSize: 0, mimeType: pending.mime },
                    });
                    notify({ type: 'success', title: 'Recorder', message: 'Saved to Media Bin.' });
                    setPending(null);
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

