import { useEffect, useRef, useState } from 'react';

interface MemoryPressureInfo {
  heapUsed: number;
  heapTotal: number;
  rss: number;
}

const BYTES_TO_MB = 1024 * 1024;

// GC trigger thresholds
const GC_TRIGGER_HEAP_MB = 256; // Trigger GC when heap exceeds 256MB
const GC_TRIGGER_RSS_MB = 512; // Trigger GC when RSS exceeds 512MB
const MEMORY_CHECK_INTERVAL_MS = 15000; // Check every 15 seconds
const GC_COOLDOWN_MS = 60000; // Don't trigger GC more often than once per minute

let lastGCTime = 0;

function formatMB(bytes: number): string {
  return (bytes / BYTES_TO_MB).toFixed(1);
}

export function MemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryPressureInfo | null>(null);
  const memoryUnsubscribeRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const api = window.markmate?.app;
    if (!api) return;

    // Listen for memory pressure events from main process
    const unsub = api.onMemoryPressure?.((info) => {
      setMemoryInfo(info);
      const now = Date.now();

      // If we're under pressure and cooldown has passed, trigger GC
      const heapMB = info.heapUsed / BYTES_TO_MB;
      const rssMB = info.rss / BYTES_TO_MB;

      if ((heapMB > GC_TRIGGER_HEAP_MB || rssMB > GC_TRIGGER_RSS_MB) &&
          now - lastGCTime > GC_COOLDOWN_MS) {
        lastGCTime = now;
        api.triggerGC?.().catch(() => {});
      }
    });
    memoryUnsubscribeRef.current = unsub ?? null;

    // Periodic check even without pressure events
    intervalRef.current = setInterval(async () => {
      try {
        const info = await api.getMemoryInfo();
        setMemoryInfo(info);

        const heapMB = info.heapUsed / BYTES_TO_MB;
        const rssMB = info.rss / BYTES_TO_MB;
        const now = Date.now();

        if ((heapMB > GC_TRIGGER_HEAP_MB || rssMB > GC_TRIGGER_RSS_MB) &&
            now - lastGCTime > GC_COOLDOWN_MS) {
          lastGCTime = now;
          api.triggerGC?.().catch(() => {});
        }
      } catch {
        // Ignore errors in memory monitoring
      }
    }, MEMORY_CHECK_INTERVAL_MS);

    // Initial check
    api.getMemoryInfo().then(setMemoryInfo).catch(() => {});

    return () => {
      memoryUnsubscribeRef.current?.();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // No UI rendered - this is a background component
  return null;
}
