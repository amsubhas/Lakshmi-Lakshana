"use client";
import { useEffect, useRef } from "react";
import type { SSEMessage } from "@/lib/types";

export function useSSE(onMessage: (msg: SSEMessage) => void) {
  const cbRef  = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;
    let retryDelay = 2_000;

    const connect = () => {
      es = new EventSource(`${base}/api/events`);

      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as SSEMessage;
          if (msg.type !== "ping") cbRef.current(msg);
        } catch {
          // ignore malformed frames
        }
      };

      es.onopen = () => {
        retryDelay = 2_000; // reset backoff on successful connection
      };

      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, 30_000);
          connect();
        }, retryDelay);
      };
    };

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimer);
    };
  }, []);
}
