/**
 * Tiny classnames joiner. Keeps component JSX readable without a runtime dep.
 *   cx('bc-button', isLarge && 'bc-button--large', className)
 */
export type ClassValue = string | false | null | undefined;

export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}
