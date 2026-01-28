/**
 * Oddiy kamera skaneri
 */

import { BrowserMultiFormatReader } from '@zxing/library';

let reader: BrowserMultiFormatReader | null = null;
let stream: MediaStream | null = null;
let active = false;

export async function startCameraScanner(
  video: HTMLVideoElement,
  callback: (code: string) => void
) {
  stopCameraScanner();
  active = true;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    reader = new BrowserMultiFormatReader();
    reader.decodeFromVideoDevice(null, video, (result) => {
      if (result && active) {
        callback(result.getText());
      }
    });
  } catch (error) {
    active = false;
    throw error;
  }

  return { stop: stopCameraScanner };
}

export function stopCameraScanner() {
  active = false;
  
  if (reader) {
    reader.reset();
    reader = null;
  }
  
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

export async function getAvailableCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(d => d.kind === 'videoinput');
}
