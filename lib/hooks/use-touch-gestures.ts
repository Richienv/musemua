import { useRef, useEffect, useCallback } from 'react';

interface TouchGestureOptions {
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useTouchGestures({
  onSwipe,
  onTap,
  onLongPress,
  swipeThreshold = 50,
  longPressDelay = 500,
}: TouchGestureOptions = {}) {
  const touchRef = useRef<HTMLElement | null>(null);
  const touchState = useRef<TouchState | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchState.current) return;

    // Clear long press timer on move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;

    // Prevent scrolling if we detect a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchState.current) return;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;

    // Detect swipe
    if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      if (onSwipe) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        } else {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    }
    // Detect tap
    else if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (onTap) onTap();
    }

    touchState.current = null;
  }, [onSwipe, onTap, swipeThreshold]);

  useEffect(() => {
    const element = touchRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return touchRef;
} 