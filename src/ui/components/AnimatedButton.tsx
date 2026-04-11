import type { CSSProperties, MouseEventHandler, PropsWithChildren } from 'react';
import { motion } from 'framer-motion';

type AnimatedButtonProps = PropsWithChildren<{
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}>;

export function AnimatedButton({
  children,
  className,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  disabled,
  type = 'button',
  'aria-label': ariaLabel,
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      type={type}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}
