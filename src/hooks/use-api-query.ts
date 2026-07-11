"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_STALE_TIME_MS = 10_000;

interface ApiErrorPayload {
  detail?: string;
  success?: boolean;
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

interface InFlightEntry {
  controller: AbortController;
  promise: Promise<unknown>;
  subscribers: number;
}

interface QueryState<T> {
  data: T | null;
  error: string | null;
  url: string;
}

export interface ApiQueryResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

const responseCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, InFlightEntry>();

function cachedResponse<T>(url: string): T | null {
  const entry = responseCache.get(url);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(url);
    return null;
  }
  return entry.data as T;
}

async function fetchApi<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  const data = (await response.json()) as T & ApiErrorPayload;
  if (!response.ok || data.success === false) {
    throw new Error(data.detail ?? `Request gagal (${response.status})`);
  }
  return data;
}

function sharedRequest<T>(url: string, staleTimeMs: number): InFlightEntry {
  const existing = inFlightRequests.get(url);
  if (existing && !existing.controller.signal.aborted) return existing;
  if (existing) inFlightRequests.delete(url);

  const controller = new AbortController();
  const entry: InFlightEntry = {
    controller,
    subscribers: 0,
    promise: Promise.resolve(),
  };
  entry.promise = fetchApi<T>(url, controller.signal)
    .then((data) => {
      responseCache.set(url, { data, expiresAt: Date.now() + staleTimeMs });
      return data;
    })
    .finally(() => {
      if (inFlightRequests.get(url) === entry) {
        inFlightRequests.delete(url);
      }
    });
  inFlightRequests.set(url, entry);
  return entry;
}

function subscribe<T>(
  url: string,
  signal: AbortSignal,
  staleTimeMs: number,
): Promise<T> {
  const cached = cachedResponse<T>(url);
  if (cached) return Promise.resolve(cached);

  const entry = sharedRequest<T>(url, staleTimeMs);
  entry.subscribers += 1;

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const release = () => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      entry.subscribers -= 1;
      if (entry.subscribers === 0 && inFlightRequests.get(url) === entry) {
        entry.controller.abort();
      }
    };
    const abort = () => {
      release();
      reject(new DOMException("Request dibatalkan", "AbortError"));
    };

    signal.addEventListener("abort", abort, { once: true });
    entry.promise.then(
      (data) => {
        if (signal.aborted) return;
        release();
        resolve(data as T);
      },
      (error: unknown) => {
        if (signal.aborted) return;
        release();
        reject(error);
      },
    );
  });
}

export function useApiQuery<T>(
  url: string,
  staleTimeMs = DEFAULT_STALE_TIME_MS,
): ApiQueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    url: "",
  });
  const [revision, setRevision] = useState(0);
  const cached = cachedResponse<T>(url);
  const refetch = useCallback(() => {
    responseCache.delete(url);
    setRevision((current) => current + 1);
  }, [url]);

  useEffect(() => {
    const controller = new AbortController();
    subscribe<T>(url, controller.signal, staleTimeMs).then(
      (data) => setState({ data, error: null, url }),
      (error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          data: null,
          error: error instanceof Error ? error.message : "Gagal memuat data",
          url,
        });
      },
    );
    return () => controller.abort();
  }, [revision, staleTimeMs, url]);

  return {
    data: state.url === url ? state.data : cached,
    error: state.url === url ? state.error : null,
    loading: state.url !== url && cached === null,
    refetch,
  };
}
