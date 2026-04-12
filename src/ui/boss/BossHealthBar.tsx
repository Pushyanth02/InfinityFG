import { motion } from 'framer-motion';

interface BossHealthBarProps {
  hpPercent: number;
  height?: number;
  shakeKey?: number;
}

export function BossHealthBar({ hpPercent, height = 18, shakeKey = 0 }: BossHealthBarProps) {
  const clamped = Math.max(0, Math.min(100, hpPercent));
  return (
    <motion.div
      key={shakeKey}
      animate={{ x: shakeKey > 0 ? [-2, 2, -2, 0] : 0 }}
      transition={{ duration: 0.2 }}
      style={{
        height,
        borderRadius: 'var(--radius-xl)',
        background: '#1a0a05',
        border: '2px solid #5c3d1e',
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, #8b0000, #c0392b, #e74c3c)',
          borderRadius: 'var(--radius-xl)',
        }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </motion.div>
  );
}

