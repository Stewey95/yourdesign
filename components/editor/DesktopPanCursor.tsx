"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

export type DesktopPanCursorMode = "open" | "grabbing";

export type DesktopPanCursorHandle = {
  hide: () => void;
  move: (x: number, y: number) => void;
  show: (mode: DesktopPanCursorMode, x: number, y: number) => void;
};

const subscribeToClient = () => () => undefined;

const DesktopPanCursor = forwardRef<DesktopPanCursorHandle>(
  function DesktopPanCursor(_, forwardedRef) {
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const openHandRef = useRef<SVGSVGElement | null>(null);
    const grabbingHandRef = useRef<SVGSVGElement | null>(null);
    const isClient = useSyncExternalStore(
      subscribeToClient,
      () => true,
      () => false
    );

    useImperativeHandle(forwardedRef, () => ({
      hide: () => {
        if (cursorRef.current) cursorRef.current.hidden = true;
      },
      move: (x, y) => {
        if (!cursorRef.current) return;

        cursorRef.current.style.transform = `translate3d(${x - 12}px, ${
          y - 12
        }px, 0)`;
      },
      show: (mode, x, y) => {
        const cursor = cursorRef.current;

        if (!cursor) return;

        cursor.style.transform = `translate3d(${x - 12}px, ${
          y - 12
        }px, 0)`;
        cursor.hidden = false;

        if (openHandRef.current) {
          openHandRef.current.style.display =
            mode === "open" ? "block" : "none";
        }

        if (grabbingHandRef.current) {
          grabbingHandRef.current.style.display =
            mode === "grabbing" ? "block" : "none";
        }
      },
    }));

    if (!isClient) return null;

    return createPortal(
      <div
        ref={cursorRef}
        hidden
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[2147483647] h-8 w-8"
      >
        <svg
          ref={openHandRef}
          aria-hidden="true"
          viewBox="0 0 32 32"
          className="block h-8 w-8 drop-shadow-sm"
        >
          <path
            d="M10 17V9a2 2 0 0 1 4 0v6V7a2 2 0 0 1 4 0v8V9a2 2 0 0 1 4 0v7l1.3-2a2 2 0 0 1 3.5 1.8l-3.1 8.1A7 7 0 0 1 17.2 28h-2.4a7 7 0 0 1-6.1-3.6l-3.5-6.2a2 2 0 0 1 3.2-2.3L10 17Z"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          ref={grabbingHandRef}
          aria-hidden="true"
          viewBox="0 0 32 32"
          className="block h-8 w-8 drop-shadow-sm"
          style={{ display: "none" }}
        >
          <path
            d="M8 13.5a2.5 2.5 0 0 1 4-2v-1a2.5 2.5 0 0 1 4-2 2.5 2.5 0 0 1 4 1.5 2.5 2.5 0 0 1 4 2v5l2-1.5a2 2 0 0 1 3 2.4l-3.8 7.2A7 7 0 0 1 19 29h-3a7 7 0 0 1-6.3-4L6 17.5a2 2 0 0 1 2-4Z"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 11.5V17m4-6.5V17m4-7v7m4-5v5"
            fill="none"
            stroke="black"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      </div>,
      document.body
    );
  }
);

export default DesktopPanCursor;
