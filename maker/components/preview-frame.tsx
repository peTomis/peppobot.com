"use client";

import { useEffect, useRef, useState } from "react";
import { READY, type PreviewMessage } from "../lib/preview";

/** Viewport widths the preview simulates; the site switches layout at 760px (`desk:`). */
export const VIEWPORTS = { desktop: 1280, mobile: 390 } as const;

export type Viewport = keyof typeof VIEWPORTS;

/**
 * The /preview page in an iframe as wide as the chosen viewport, scaled down to fit the pane,
 * so the site's media queries respond to the simulated width rather than the maker window.
 */
export function PreviewFrame({ message, viewport }: { message: PreviewMessage; viewport: Viewport }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(message);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Keep the pane's size, to fit the frame in it.
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Send every change; a frame that (re)loads asks for the current game itself.
  useEffect(() => {
    latest.current = message;
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, [message]);

  useEffect(() => {
    const onReady = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data === READY) frame.current?.contentWindow?.postMessage(latest.current, window.location.origin);
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, []);

  const width = VIEWPORTS[viewport];
  const scale = size.width ? Math.min(1, size.width / width) : 1;

  return (
    <div ref={box} className="relative flex-1 min-h-0 overflow-hidden">
      <iframe
        ref={frame}
        src="/preview"
        title="Report preview"
        style={{ width, height: size.height / scale, transform: `scale(${scale})`, left: Math.max(0, (size.width - width * scale) / 2) }}
        className="absolute top-0 origin-top-left border-0 bg-bg"
      />
    </div>
  );
}
