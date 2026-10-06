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

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<State>({
    status: "idle",
    coords: null,
  });

  const optsRef = useRef<PositionOptions | undefined>(options);

  useEffect(() => {
    optsRef.current = options;
  }, [options]);

  const request = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({
        status: "error",
        coords: null,
        error: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setState((s) => ({ ...s, status: "locating", error: undefined }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "granted",
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setState({
          status: denied ? "denied" : "error",
          coords: null,
          error: denied
            ? "Location permission denied."
            : err.message || "Failed to get your location.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
        ...optsRef.current,
      },
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("permissions" in navigator)) return;

    let cancelled = false;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((p) => {
        if (cancelled) return;
        if (p.state === "granted") {
          request();
        } else if (p.state === "prompt" || p.state === "denied") {
          setState((s) => ({ ...s, status: p.state as Status }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [request]);

  return { ...state, request };
}
