import { useState, useRef, useCallback, useEffect } from 'react';

export interface SwipeGesturesOptions {
  threshold?: number;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enablePullDown?: boolean;
  pullResistance?: number;
}

export function useSwipeGestures(options: SwipeGesturesOptions = {}) {
  const {
    threshold = 75,
    onSwipeDown,
    onSwipeUp,
    onSwipeLeft,
    onSwipeRight,
    enablePullDown = true,
    pullResistance = 0.55
  } = options;

  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaX = touch.clientX - touchStartRef.current.x;

      // If user is predominantly pulling downward and pull down is enabled
      if (enablePullDown && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Apply springy resistance
        const dampened = deltaY * pullResistance;
        setDragOffset(dampened);
      }
    },
    [enablePullDown, pullResistance]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsedTime = Date.now() - touchStartRef.current.time;
      const velocityY = Math.abs(deltaY) / (elapsedTime || 1);
      const velocityX = Math.abs(deltaX) / (elapsedTime || 1);

      setIsDragging(false);

      // Check vertical swipe down
      if (deltaY > threshold || (deltaY > 35 && velocityY > 0.45)) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(15); } catch {}
          }
          onSwipeDown?.();
        }
      } else if (deltaY < -threshold || (deltaY < -35 && velocityY > 0.45)) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          onSwipeUp?.();
        }
      }

      // Check horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > threshold || (deltaX > 35 && velocityX > 0.45)) {
          onSwipeRight?.();
        } else if (deltaX < -threshold || (deltaX < -35 && velocityX > 0.45)) {
          onSwipeLeft?.();
        }
      }

      setDragOffset(0);
      touchStartRef.current = null;
    },
    [threshold, onSwipeDown, onSwipeUp, onSwipeLeft, onSwipeRight]
  );

  const onTouchCancel = useCallback(() => {
    setIsDragging(false);
    setDragOffset(0);
    touchStartRef.current = null;
  }, []);

  return {
    dragOffset,
    isDragging,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel
    }
  };
}
