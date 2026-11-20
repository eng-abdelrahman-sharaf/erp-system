"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useTransition,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface NavigationContextValue {
  isNavigating: boolean;
  navigatingTarget: string | null;
  startNavigation: (target?: string, callback?: () => void) => void;
  stopNavigation: () => void;
  isNavigatingTarget: (target: string) => boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function NavigationWatcher({
  onNavigated,
}: {
  onNavigated: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsStr = searchParams?.toString();

  const isFirstRender = useRef(true);
  const prevRoute = useRef({ pathname, searchParamsStr });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (
      prevRoute.current.pathname !== pathname ||
      prevRoute.current.searchParamsStr !== searchParamsStr
    ) {
      prevRoute.current = { pathname, searchParamsStr };
      onNavigated();
    }
  }, [pathname, searchParamsStr, onNavigated]);

  return null;
}

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTarget, setNavigatingTarget] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopNavigation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsNavigating(false);
    setNavigatingTarget(null);
  }, []);

  const startNavigation = useCallback(
    (target?: string, callback?: () => void) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsNavigating(true);
      setNavigatingTarget(target ?? null);

      if (callback) {
        startTransition(() => {
          callback();
        });
      }

      // Safety timeout: automatically reset after 8 seconds if navigation fails or aborts
      timeoutRef.current = setTimeout(() => {
        stopNavigation();
      }, 8000);
    },
    [startTransition, stopNavigation]
  );

  const isNavigatingTarget = useCallback(
    (target: string) => {
      return isNavigating && navigatingTarget === target;
    },
    [isNavigating, navigatingTarget]
  );

  // Clear loading state on history back/forward (bfcache or standard popstate)
  useEffect(() => {
    const handlePageShow = () => {
      stopNavigation();
    };

    const handlePopState = () => {
      stopNavigation();
    };

    const handlePageHide = () => {
      stopNavigation();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pagehide", handlePageHide);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stopNavigation]);

  // Global click interception on internal links
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      // Ignore modified clicks or non-primary clicks
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external or non-http links or page anchors
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") {
        return;
      }

      if (anchor.hasAttribute("download")) {
        return;
      }

      try {
        const url = new URL(anchor.href, window.location.href);
        // Only internal links on same origin
        if (url.origin !== window.location.origin) {
          return;
        }

        // If clicking same path and query with just hash change, ignore
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash !== window.location.hash
        ) {
          return;
        }

        // Check if there is an explicit target set on anchor or clicked child
        const navTarget =
          anchor.getAttribute("data-navigation-target") ||
          target.getAttribute("data-navigation-target") ||
          target.closest("[data-navigation-target]")?.getAttribute("data-navigation-target") ||
          href;

        startNavigation(navTarget);
      } catch {
        // Ignore invalid URLs
      }
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, [startNavigation]);

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        navigatingTarget,
        startNavigation,
        stopNavigation,
        isNavigatingTarget,
      }}
    >
      <Suspense fallback={null}>
        <NavigationWatcher onNavigated={stopNavigation} />
      </Suspense>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationLoading(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    // Graceful fallback if used outside NavigationProvider
    return {
      isNavigating: false,
      navigatingTarget: null,
      startNavigation: (_target, callback) => callback?.(),
      stopNavigation: () => {},
      isNavigatingTarget: () => false,
    };
  }
  return context;
}
