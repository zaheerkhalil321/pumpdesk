'use client';

import type { ReactNode } from 'react';
import * as m from 'motion/react-m';

/**
 * Each page fades in when you open it. Only the opacity moves: a transform or filter here would
 * pin the schedule's floating "new booking" button to the page instead of the screen.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      // Full height, as the page itself would be inside the main area.
      className="h-full"
    >
      {children}
    </m.div>
  );
}
