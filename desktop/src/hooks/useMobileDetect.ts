/**
 * Hook для определения мобильного устройства
 * Проверяет viewport и userAgent
 */

import { useState, useEffect } from 'react';

interface MobileDetectResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

export const useMobileDetect = (): MobileDetectResult => {
  const [result, setResult] = useState<MobileDetectResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Проверка userAgent на мобильные устройства
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry',
        'windows phone', 'opera mini', 'mobile', 'tablet'
      ];
      
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
      
      // Проверка viewport
      const isMobileViewport = width <= 768;
      const isTabletViewport = width > 768 && width <= 1024;
      
      // Комбинированная проверка
      const isMobile = isMobileUA || isMobileViewport;
      const isTablet = isTabletViewport && !isMobileViewport;
      const isDesktop = !isMobile && !isTablet;

      setResult({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
      });
    };

    // Первоначальная проверка
    checkDevice();

    // Слушатель изменения размера окна
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return result;
};

export default useMobileDetect;
