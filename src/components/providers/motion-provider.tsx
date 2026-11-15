'use client';

import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';

import { FADE } from '@/lib/motion';

/**
 * Loads Motion's animation features once for the whole app, so components use the small `m`
 * elements. A quick, plain fade by default, and off for people who turned on "Reduce motion".
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={FADE}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
