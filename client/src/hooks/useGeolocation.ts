"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/geo";

export type Status =
  | "idle"
  | "prompt"
  | "locating"
  | "granted"
  | "denied"
  | "error";

interface State {
  status: Status;
  coords: LatLng | null;
  accuracy?: number;
  error?: string;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 5 * 60_000,
};

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<State>({ status: "idle", coords: null });

  const optsRef = useRef<PositionOptions | undefined>(options);
  const mountedRef = useRef(true);

  useEffect(() => {
    optsRef.current = options;
  }, [options]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const request = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState((s) => ({
        ...s,
        status: "error",
        error: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    setState((s) => ({ ...s, status: "locating", error: undefined }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mountedRef.current) return;
        setState({
          status: "granted",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        if (!mountedRef.current) return;

        const denied = err.code === err.PERMISSION_DENIED;
        const message = denied
          ? "Location permission denied."
          : err.code === err.TIMEOUT
            ? "Finding your location took too long."
            : "Your location is currently unavailable.";

        setState((s) => ({
          ...s,
          status: denied ? "denied" : "error",
          error: message,
        }));
      },
      { ...DEFAULT_OPTIONS, ...optsRef.current },
    );
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    let cancelled = false;
    let permission: PermissionStatus | null = null;

    const markPrompt = () =>
      setState((s) => (s.status === "idle" ? { ...s, status: "prompt" } : s));

    const sync = (p: PermissionStatus) => {
      if (cancelled) return;

      if (p.state === "granted") {
        request();
      } else if (p.state === "denied") {
        setState((s) => ({
          ...s,
          status: "denied",
          error: "Location permission denied.",
        }));
      } else {
        setState((s) =>
          s.status === "idle" || s.status === "denied"
            ? { ...s, status: "prompt", error: undefined }
            : s,
        );
      }
    };

    const init = async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!("permissions" in navigator)) {
        markPrompt();
        return;
      }

      try {
        const p = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        if (cancelled) return;

        permission = p;
        sync(p);
        p.onchange = () => sync(p);
      } catch {
        if (!cancelled) markPrompt();
      }
    };

    init();

    return () => {
      cancelled = true;
      if (permission) permission.onchange = null;
    };
  }, [request]);

  return { ...state, request };
}
