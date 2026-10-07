import { useState, useEffect, useCallback } from 'react';

export interface BatteryInfo {
  level: number;
  charging: boolean;
}

export function useEcoMode() {
  const [isEcoMode, setIsEcoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sultan_eco_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    // Auto-detect mobile devices or prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return prefersReduced;
    }
    return false;
  });

  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  const [batteryPromptShown, setBatteryPromptShown] = useState<boolean>(false);

  // Sync class on root document
  useEffect(() => {
    if (isEcoMode) {
      document.documentElement.classList.add('eco-mode');
    } else {
      document.documentElement.classList.remove('eco-mode');
    }
    localStorage.setItem('sultan_eco_mode', isEcoMode ? 'true' : 'false');
  }, [isEcoMode]);

  // Battery Status API listener
  useEffect(() => {
    let batteryObj: any = null;

    const setupBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          batteryObj = await (navigator as any).getBattery();
          const update = () => {
            const level = Math.round((batteryObj.level || 1) * 100);
            const charging = !!batteryObj.charging;
            setBattery({ level, charging });

            // Auto-recommend eco mode when battery is low (< 20%) and discharging
            if (level <= 20 && !charging && !batteryPromptShown) {
              setIsEcoMode(true);
              setBatteryPromptShown(true);
            }
          };

          update();
          batteryObj.addEventListener('levelchange', update);
          batteryObj.addEventListener('chargingchange', update);
        }
      } catch (e) {
        // Battery API not supported or restricted, fail silently
      }
    };

    setupBattery();

    return () => {
      if (batteryObj) {
        try {
          batteryObj.removeEventListener('levelchange', () => {});
          batteryObj.removeEventListener('chargingchange', () => {});
        } catch (e) {}
      }
    };
  }, [batteryPromptShown]);

  const toggleEcoMode = useCallback(() => {
    setIsEcoMode((prev) => !prev);
  }, []);

  return {
    isEcoMode,
    setIsEcoMode,
    toggleEcoMode,
    battery
  };
}
