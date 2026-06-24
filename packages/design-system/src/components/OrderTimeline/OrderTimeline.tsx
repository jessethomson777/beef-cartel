import './OrderTimeline.css';
import { cx } from '../../lib/cx';
import type { OlHTMLAttributes } from 'react';

export type OrderStepStatus = 'done' | 'current' | 'upcoming';

export interface OrderStep {
  label: string;
  caption?: string;
  /** Explicit status wins; otherwise it's derived from `current`. */
  status?: OrderStepStatus;
}

/** The deposit→dispatch lifecycle, in order. */
export const DEFAULT_ORDER_STEPS: OrderStep[] = [
  { label: 'Ordered' },
  { label: 'Sent to supplier' },
  { label: 'Dispatched' },
  { label: 'Balance charged' },
];

export interface OrderTimelineProps extends OlHTMLAttributes<HTMLOListElement> {
  /** The lifecycle steps. Defaults to DEFAULT_ORDER_STEPS. */
  steps?: OrderStep[];
  /** Active step index. Derives status for any step lacking an explicit one. */
  current?: number;
}

function resolveStatus(step: OrderStep, index: number, current: number): OrderStepStatus {
  if (step.status) return step.status;
  if (index < current) return 'done';
  if (index === current) return 'current';
  return 'upcoming';
}

export function OrderTimeline({
  steps = DEFAULT_ORDER_STEPS,
  current = 0,
  className,
  ...rest
}: OrderTimelineProps) {
  return (
    <ol className={cx('bc-order-timeline', className)} {...rest}>
      {steps.map((step, index) => {
        const status = resolveStatus(step, index, current);
        const isLast = index === steps.length - 1;
        return (
          <li
            key={index}
            className={cx('bc-order-timeline__step', `is-${status}`, isLast && 'is-last')}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className="bc-order-timeline__rail" aria-hidden="true">
              <span className="bc-order-timeline__node">
                {/* Check only renders for completed steps; decorative. */}
                {status === 'done' && <span className="bc-order-timeline__check">✓</span>}
              </span>
              {!isLast && <span className="bc-order-timeline__connector" />}
            </span>
            <span className="bc-order-timeline__content">
              <span className="bc-order-timeline__label">{step.label}</span>
              {step.caption && (
                <span className="bc-order-timeline__caption bc-caption">{step.caption}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
