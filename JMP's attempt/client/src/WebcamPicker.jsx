import { useState, useEffect, useRef } from 'react';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// MediaPipe hand landmark indices
const INDEX_TIP = 8, INDEX_PIP = 6;
const MIDDLE_TIP = 12, MIDDLE_PIP = 10;
const RING_TIP = 16, RING_PIP = 14;
const PINKY_TIP = 20, PINKY_PIP = 18;

function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const extended = (tip, pip) => landmarks[tip].y < landmarks[pip].y;
  const indexUp = extended(INDEX_TIP, INDEX_PIP);
  const middleUp = extended(MIDDLE_TIP, MIDDLE_PIP);
  const ringUp = extended(RING_TIP, RING_PIP);
  const pinkyUp = extended(PINKY_TIP, PINKY_PIP);
  const count = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;
  if (count >= 4) return 'paper';
  if (indexUp && middleUp && !ringUp && !pinkyUp) return 'scissors';
  if (count <= 1) return 'rock';
  return null;
}

export default function WebcamPicker({ socket, onFallback }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [detected, setDetected] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  const countRef = useRef({ rock: 0, paper: 0, scissors: 0 });
  const sentRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const { HandLandmarker, FilesetResolver } = vision;
        const wasm = await FilesetResolver.forVisionTasks(WASM_BASE);
        const detector = await HandLandmarker.createFromOptions(wasm, {
          baseOptions: { modelAssetPath: MODEL_URL },
          numHands: 1,
          runningMode: 'VIDEO',
        });
        if (cancelled) return;
        detectorRef.current = detector;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e?.message || 'Camera or model failed');
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !videoRef.current || !detectorRef.current || !socket) return;
    let lastTs = 0;
    function tick(ts) {
      rafRef.current = requestAnimationFrame(tick);
      if (!videoRef.current || !detectorRef.current || ts - lastTs < 80) return;
      lastTs = ts;
      const result = detectorRef.current.detectForVideo(videoRef.current, performance.now());
      const landmarks = result?.landmarks?.[0];
      const gesture = classifyGesture(landmarks);
      setDetected(gesture);
      if (gesture) {
        countRef.current[gesture] = (countRef.current[gesture] || 0) + 1;
        const others = Object.keys(countRef.current).filter((k) => k !== gesture);
        others.forEach((k) => (countRef.current[k] = 0));
        if (countRef.current[gesture] >= 12 && !sentRef.current) {
          sentRef.current = true;
          socket.emit('choice', gesture);
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, socket]);

  // Attach stream to video once the element is mounted (after status becomes 'ready')
  useEffect(() => {
    if (status !== 'ready' || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="webcam-picker">
        <p className="webcam-status">Starting camera & gesture model…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="webcam-picker webcam-error">
        <p className="webcam-status">Webcam unavailable: {errorMsg}</p>
        <button type="button" onClick={onFallback}>Use buttons instead</button>
      </div>
    );
  }

  return (
    <div className="webcam-picker">
      <p className="webcam-prompt">Show your hand: Rock, Paper, or Scissors</p>
      <div className="webcam-video-wrap">
        <video ref={videoRef} className="webcam-video" muted playsInline />
        {detected && <span className="webcam-detected">{detected}</span>}
      </div>
      <p className="webcam-hint">Hold your gesture steady for about 1 second to lock in.</p>
    </div>
  );
}
