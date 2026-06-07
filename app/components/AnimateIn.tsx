'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

type Variant = 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scaleUp';

const VARIANTS: Record<Variant, Variants> = {
  fadeUp:    { hidden: { opacity: 0, y: 48 },        visible: { opacity: 1, y: 0 } },
  fadeIn:    { hidden: { opacity: 0 },               visible: { opacity: 1 } },
  slideLeft: { hidden: { opacity: 0, x: -64 },       visible: { opacity: 1, x: 0 } },
  slideRight:{ hidden: { opacity: 0, x: 64 },        visible: { opacity: 1, x: 0 } },
  scaleUp:   { hidden: { opacity: 0, scale: 0.92 },  visible: { opacity: 1, scale: 1 } },
};

interface AnimateInProps {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function AnimateIn({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.6,
  className,
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={VARIANTS[variant]}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
