"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

let cachedNow: number | null = null;

function getSnapshot(): number {
  if (cachedNow === null) cachedNow = Date.now();
  return cachedNow;
}

function getServerSnapshot(): number | null {
  return null;
}

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
