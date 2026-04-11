import { AnimatePresence, motion } from 'framer-motion';

interface CinematicOverlayProps {
  text: string | null;
}

export function CinematicOverlay({ text }: CinematicOverlayProps) {
  return (
    <AnimatePresence>
      {text ? (
        <motion.div
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 1200,
            background: 'rgba(0, 0, 0, 0.72)',
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.02, y: -8 }}
            transition={{ duration: 0.22 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.4rem, 4vw, 2.4rem)',
              color: '#fdf6e8',
              textAlign: 'center',
              letterSpacing: '0.04em',
              textShadow: '0 6px 20px rgba(0,0,0,0.4)',
              padding: '0 24px',
            }}
          >
            {text}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

