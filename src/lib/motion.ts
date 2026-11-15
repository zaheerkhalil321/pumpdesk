/** Quick and plain, for things that appear often, like list rows. */
export const FADE = { duration: 0.2, ease: 'easeOut' } as const;

/**
 * A list row or tile: it fades in with a small lift when it appears, for example after a search
 * or a filter, and the rows already there glide to their new place. `opacity` is below 1 for
 * the faded look of an inactive record.
 */
export function listItemMotion(opacity = 1) {
  return {
    layout: 'position' as const,
    initial: { opacity: 0, y: 4 },
    animate: { opacity, y: 0 },
    transition: FADE,
  };
}
