/**
 * Kamera orqali skanerlash - @zxing/library yordamida
 */

import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

let codeReader: BrowserMultiFormatReader | null = null;
let isScanning = false;
let currentStream: MediaStream | null = null;
let scanInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Kamera skanerini ishga tushirish
 */
export async function startCameraScanner(
  videoElement: HTMLVideoElement,
  onResult: (text: string) => void
): Promise<{ stop: () => void }> {
  // Avvalgi skanerni to'xtatish
  stopCameraScanner();
  
  isScanning = true;
  
  try {
    // Kamera ruxsatini olish
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Video elementga ulash
    videoElement.srcObject = currentStream;
    videoElement.setAttribute('playsinline', 'true');
    
    await new Promise<void>((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play()
          .then(() => resolve())
          .catch(reject);
      };
      videoElement.onerror = () => reject(new Error('Video yuklashda xatolik'));
      setTimeout(() => reject(new Error('Video yuklash vaqti tugadi')), 10000);
    });
    
    // Reader yaratish - ko'proq formatlarni qo'llab-quvvatlash
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    codeReader = new BrowserMultiFormatReader(hints);
    
    // Har 200ms da skanerlash (tezroq va ishonchli)
    scanInterval = setInterval(async () => {
      if (!isScanning || !codeReader || !videoElement) return;
      
      try {
        const result = await codeReader.decodeFromVideoElement(videoElement);
        if (result && result.getText()) {
          const text = result.getText();
          console.log('✅ Skaner natijasi:', text);
          onResult(text);
        }
      } catch (e) {
        // Kod topilmadi - davom etamiz
      }
    }, 200);
    
  } catch (err: any) {
    console.error('Skaner xatoligi:', err);
    stopCameraScanner();
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
  
  // Intervalni to'xtatish
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  
  // Streamni to'xtatish
  if (currentStream) {
    try {
      currentStream.getTracks().forEach(track => track.stop());
    } catch (e) {
      // Ignore
    }
    currentStream = null;
  }
  
  if (codeReader) {
    try {
      codeReader.reset();
    } catch (e) {
      // Ignore
    }
    codeReader = null;
  }
}

/**
 * Mavjud kameralar ro'yxatini olish
 */
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  try {
    const reader = new BrowserMultiFormatReader();
    const devices = await reader.listVideoInputDevices();
    return devices;
  } catch {
    return [];
  }
}
