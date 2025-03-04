import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = true
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      setIntersecting(true);
      if (freezeOnceVisible) setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        // Update state based on intersection
        setIntersecting(isElementIntersecting);
        
        // If element has intersected and we want to freeze, update hasIntersected
        if (isElementIntersecting && freezeOnceVisible) {
          setHasIntersected(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return {
    ref: targetRef,
    isIntersecting: freezeOnceVisible ? isIntersecting || hasIntersected : isIntersecting,
    hasIntersected
  };
} 