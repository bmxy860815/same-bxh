import { useCallback, useEffect, useRef, useState } from 'react';

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function useSwitchBoxAnimation(enabled: boolean) {
  const [unfoldProgress, setUnfoldProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<1 | -1>(1);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (enabled) return;
    setIsPlaying(false);
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isPlaying) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setUnfoldProgress(prev => {
        const step = (deltaTime / 2000) * animationDirection;
        const next = prev + step;
        if (animationDirection === 1 && next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        if (animationDirection === -1 && next <= 0) {
          setIsPlaying(false);
          return 0;
        }
        return clamp01(next);
      });

      frameIdRef.current = requestAnimationFrame(animate);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [enabled, isPlaying, animationDirection]);

  const togglePlayback = useCallback(() => {
    if (!enabled) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    const targetDirection: 1 | -1 = unfoldProgress >= 0.5 ? -1 : 1;
    setAnimationDirection(targetDirection);
    setIsPlaying(true);
  }, [enabled, isPlaying, unfoldProgress]);

  const resetPlayback = useCallback(() => {
    if (!enabled) return;
    setIsPlaying(false);
    setUnfoldProgress(0);
  }, [enabled]);

  const changeProgress = useCallback((value: number) => {
    if (!enabled) return;
    setIsPlaying(false);
    setUnfoldProgress(clamp01(value));
  }, [enabled]);

  return {
    unfoldProgress,
    isPlaying,
    animationDirection,
    setAnimationDirection,
    setIsPlaying,
    togglePlayback,
    resetPlayback,
    changeProgress
  };
}
