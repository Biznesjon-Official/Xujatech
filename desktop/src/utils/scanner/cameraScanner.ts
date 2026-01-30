/**
 * Kamera skaneri - Native Browser API
 * Sodda va ishonchli
 */

import { BrowserMultiFormatReader } from '@zxing/library';

let codeReader: BrowserMultiFormatReader | null = null;
let isScanning = false;
let currentStream: MediaStream | null = null;

/**
 * Kamera skanerini ishga tushirish
 */
export async function startCameraScanner(
  videoElement: HTMLVideoElement,
  onResult: (code: string) => void
): Promise<{ stop: () => void }> {
  // Avvalgi skanerni to'xtatish
  stopCameraScanner();
  
  isScanning = true;
  
  try {
    // Kamera ruxsatini olish
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Video elementga ulash
    videoElement.srcObject = currentStream;
    videoElement.setAttribute('playsinline', 'true');
    await videoElement.play();
    
    console.log('✅ Kamera muvaffaqiyatli ishga tushdi');
    
    // ZXing reader yaratish
    codeReader = new BrowserMultiFormatReader();
    
    // Uzluksiz skanerlash
    codeReader.decodeFromVideoDevice(
      null, // Default kamera
      videoElement,
      (result, err) => {
        if (result && isScanning) {
          const code = result.getText();
          console.log('✅ Kod o\'qildi:', code);
          onResult(code);
        }
        // Xatolarni ignore qilamiz (kod topilmasa har doim xato beradi)
      }
    );
    
  } catch (err: any) {
    console.error('❌ Kamera xatosi:', err);
    isScanning = false;
    throw err;
  }
  
  return {
    stop: () => stopCameraScanner()
  };
}

/**
 * Skanerni to'xtatish
 */
export function stopCameraScanner(): void {
  isScanning = false;
  
  if (codeReader) {
    try {
      codeReader.reset();
    } catch (e) {
      // Ignore
    }
    codeReader = null;
  }
  
  if (currentStream) {
    try {
      currentStream.getTracks().forEach(track => track.stop());
    } catch (e) {
      // Ignore
    }
    currentStream = null;
  }
}

/**
 * Mavjud kameralar ro'yxatini olish
 */
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch {
    return [];
  }
}
