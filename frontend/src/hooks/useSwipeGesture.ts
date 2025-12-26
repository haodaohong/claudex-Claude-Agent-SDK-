import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  swipeThreshold?: number; // Minimum distance to count as a swipe (px)
  enabled?: boolean;
}

/**
 * Check if an element or any of its ancestors is horizontally scrollable
 */
function isInHorizontallyScrollableElement(element: Element | null): boolean {
  while (element && element !== document.body) {
    const style = window.getComputedStyle(element);
    const overflowX = style.overflowX;

    // Check if element has horizontal scroll enabled and content overflows
    if (overflowX === 'auto' || overflowX === 'scroll') {
      // Check if content actually overflows (scrollable)
      if (element.scrollWidth > element.clientWidth) {
        return true;
      }
    }

    element = element.parentElement;
  }
  return false;
}

/**
 * Hook for detecting swipe gestures on mobile.
 * - Swipe right: triggers onSwipeRight (open sidebar)
 * - Swipe left: triggers onSwipeLeft (close sidebar)
 */
export function useSwipeGesture({
  onSwipeRight,
  onSwipeLeft,
  swipeThreshold = 50,
  enabled = true,
}: SwipeGestureOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isInScrollable = useRef<boolean>(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;

      // Check if touch started inside a horizontally scrollable element
      isInScrollable.current = isInHorizontallyScrollableElement(e.target as Element);
    },
    [enabled],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Reset refs before any early returns
      const wasInScrollable = isInScrollable.current;
      touchStartX.current = null;
      touchStartY.current = null;
      isInScrollable.current = false;

      // Ignore if touch started in a horizontally scrollable element (e.g., code blocks)
      if (wasInScrollable) {
        return;
      }

      // Ignore if vertical movement is greater than horizontal (scrolling)
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      // Swipe right → open
      if (deltaX > swipeThreshold && onSwipeRight) {
        onSwipeRight();
      }
      // Swipe left → close
      else if (deltaX < -swipeThreshold && onSwipeLeft) {
        onSwipeLeft();
      }
    },
    [enabled, swipeThreshold, onSwipeRight, onSwipeLeft],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}
