'use client';

import type { ReactNode } from 'react';
import { MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import * as m from 'motion/react-m';
import { cn } from '@/lib/utils';

/**
 * Mouse: the drag starts after a small move, so a click still opens the job.
 * Touch: hold the card for a moment, then drag; a quick swipe keeps scrolling the board.
 */
export function useTimelineSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );
}

interface DroppableLaneProps {
  pumpId: string;
  className?: string;
  children: ReactNode;
}

/** The timeline part of one pump's row. A card dropped anywhere on it goes to this pump. */
export function DroppableLane({ pumpId, className, children }: DroppableLaneProps) {
  const { setNodeRef } = useDroppable({ id: pumpId });
  return (
    <div ref={setNodeRef} data-lane-id={pumpId} className={className}>
      {children}
    </div>
  );
}

interface DraggableCardProps {
  bookingId: string;
  /** True while this card is being dragged: it stays in place, faded. */
  isDragging: boolean;
  className?: string;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}

/**
 * A job card that can be picked up. It stays in place, faded; a copy follows the pointer.
 * It grows in when it appears, so a dropped card visibly lands in its new spot.
 */
export function DraggableCard({ bookingId, isDragging, className, title, onClick, children }: DraggableCardProps) {
  const { setNodeRef, listeners, attributes } = useDraggable({ id: bookingId });
  return (
    <m.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
      animate={
        isDragging
          ? { opacity: 0.4, scale: 0.98 }
          : { opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }
      }
      // A little more bounce than elsewhere, so a dropped card visibly settles.
      transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
      data-booking-id={bookingId}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      // touch-manipulation lets a hold start the drag; the callout is the iPad's long-press menu.
      className={cn('touch-manipulation [-webkit-touch-callout:none]', className)}
    >
      {children}
    </m.div>
  );
}
