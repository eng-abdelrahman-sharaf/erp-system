"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNavigationLoading } from "./useNavigationLoading";

export interface NavigateOptions {
  target?: string;
  scroll?: boolean;
}

export function useAppRouter() {
  const router = useRouter();
  const {
    isNavigating,
    navigatingTarget,
    startNavigation,
    stopNavigation,
    isNavigatingTarget,
  } = useNavigationLoading();

  const push = useCallback(
    (href: string, options?: NavigateOptions) => {
      startNavigation(options?.target ?? href, () => {
        router.push(href, { scroll: options?.scroll });
      });
    },
    [router, startNavigation]
  );

  const replace = useCallback(
    (href: string, options?: NavigateOptions) => {
      startNavigation(options?.target ?? href, () => {
        router.replace(href, { scroll: options?.scroll });
      });
    },
    [router, startNavigation]
  );

  const back = useCallback(
    (options?: { target?: string }) => {
      startNavigation(options?.target ?? "back", () => {
        router.back();
      });
    },
    [router, startNavigation]
  );

  return {
    ...router,
    push,
    replace,
    back,
    isNavigating,
    navigatingTarget,
    isNavigatingTarget,
    startNavigation,
    stopNavigation,
  };
}
