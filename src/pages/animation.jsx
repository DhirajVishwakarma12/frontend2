import { useEffect } from "react";
import "../Style/animation.css";

export default function Animation({ onComplete }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return undefined;
    }

    const timer = window.setTimeout(onComplete, 2400);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="intro-screen" role="status" aria-live="polite">
      <div className="intro-content">
        <div className="intro-emblem" aria-hidden="true">
          <span>✦</span>
        </div>
        <p className="intro-brand">WHITE STAR SHIPPING</p>
        <h1>Proforma Invoice</h1>
        <p className="intro-caption">A clearer way to manage your billing.</p>
        <div className="intro-progress" aria-hidden="true">
          <span />
        </div>
      </div>
      <button className="intro-skip" type="button" onClick={onComplete}>
        Skip intro
      </button>
    </main>
  );
}