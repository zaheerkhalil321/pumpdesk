import * as React from "react"

const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  window.addEventListener("resize", callback)
  return () => {
    mql.removeEventListener("change", callback)
    window.removeEventListener("resize", callback)
  }
}

function getSnapshot() {
  return typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

const TABLET_MAX = 1023

function subscribeTablet(callback: () => void) {
  const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_MAX}px)`)
  mql.addEventListener("change", callback)
  window.addEventListener("resize", callback)
  return () => {
    mql.removeEventListener("change", callback)
    window.removeEventListener("resize", callback)
  }
}

function getSnapshotTablet() {
  return typeof window !== "undefined"
    ? window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth <= TABLET_MAX
    : false
}

export function useIsTablet() {
  return React.useSyncExternalStore(subscribeTablet, getSnapshotTablet, getServerSnapshot)
}
