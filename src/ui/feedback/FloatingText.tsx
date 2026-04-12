import { motion } from 'framer-motion';

interface FloatingTextProps {
  value: string;
  x: number;
  y: number;
  color?: string;
  onComplete?: () => void;
}

export function FloatingText({ value, x, y, color = '#fcc940', onComplete }: FloatingTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: -24, scale: 1 }}
      exit={{ opacity: 0, y: -44, scale: 0.9 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1rem',
        textShadow: '0 2px 8px rgba(0,0,0,0.35)',
        color,
        zIndex: 1100,
      }}
    >
      {value}
    </motion.div>
  );
}

