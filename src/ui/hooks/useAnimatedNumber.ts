import { useEffect, useState } from 'react';

export function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    let frame = 0;

    const animate = () => {
      setDisplay((prev) => {
        const diff = value - prev;
        if (Math.abs(diff) < 1) return value;
        return prev + diff * 0.16;
      });
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return Math.floor(display);
}

