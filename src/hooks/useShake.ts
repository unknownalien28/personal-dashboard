import { useState } from "react";

/** Triggers a brief shake animation (via the `.field-shake` CSS class) on validation failure. */
export function useShake() {
  const [shaking, setShaking] = useState(false);

  function trigger() {
    setShaking(true);
  }

  function onAnimationEnd() {
    setShaking(false);
  }

  return { shaking, trigger, onAnimationEnd };
}
