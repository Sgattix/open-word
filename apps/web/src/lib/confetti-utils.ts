/**
 * Confetti utilities: extracted from confetti component.
 * Provides reusable confetti trigger functions.
 */

import confetti from "canvas-confetti";
import type { Options as ConfettiOptions } from "canvas-confetti";

/**
 * Trigger confetti from a specific element position.
 */
export async function fireConfettiFromElement(
  element: HTMLElement,
  options?: ConfettiOptions,
): Promise<void> {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  await confetti({
    ...options,
    origin: {
      x: x / window.innerWidth,
      y: y / window.innerHeight,
    },
  });
}

/**
 * Trigger confetti from center of screen.
 */
export async function fireConfettiCenter(
  options?: ConfettiOptions,
): Promise<void> {
  await confetti({
    ...options,
    origin: { x: 0.5, y: 0.5 },
  });
}

/**
 * Trigger confetti burst from click position.
 */
export async function fireConfettiFromClick(
  event: React.MouseEvent<HTMLElement>,
  options?: ConfettiOptions,
): Promise<void> {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  await confetti({
    ...options,
    origin: {
      x: x / window.innerWidth,
      y: y / window.innerHeight,
    },
  });
}
