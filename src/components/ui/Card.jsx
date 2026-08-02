import { motion } from 'framer-motion';

/** Card container with optional hover animation. */
export function Card({ children, className = '', hover = false, onClick, ...props }) {
  const Component = hover || onClick ? motion.div : 'div';
  const motionProps = hover || onClick
    ? { whileHover: { y: -2 }, transition: { duration: 0.2 } }
    : {};

  return (
    <Component
      onClick={onClick}
      className={`rounded-2xl bg-surface border border-border p-6 shadow-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Card section title. */
export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-sm font-medium text-muted uppercase tracking-wide ${className}`}>{children}</h3>;
}

/** Large stat value inside a card. */
export function StatValue({ children, className = '' }) {
  return <p className={`text-3xl font-semibold tracking-tight ${className}`}>{children}</p>;
}
