"use client";

import React from "react";
import { Eye, Edit, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useAppRouter } from "@/hooks/useAppRouter";
import { cn } from "@/lib/utils/cn";

export interface ViewButtonProps {
  href: string;
  target?: string;
  title?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  loadingLabel?: string;
}

export function ViewButton({
  href,
  target,
  title = "View",
  variant = "ghost",
  size = "sm",
  className,
  disabled = false,
  children,
  loadingLabel,
}: ViewButtonProps) {
  const router = useAppRouter();
  const navTarget = target ?? `view-${href}`;
  const isLoading = router.isNavigatingTarget(navTarget);

  const handleClick = () => {
    if (disabled || isLoading) return;
    router.push(href, { target: navTarget });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={title}
      className={cn("flex items-center", className)}
      data-navigation-target={navTarget}
    >
      {isLoading ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", children ? "mr-2" : "")} />
      ) : children ? null : (
        <Eye className="h-4 w-4 text-gray-600" />
      )}
      {isLoading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}

export interface EditButtonProps {
  href: string;
  target?: string;
  title?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  loadingLabel?: string;
}

export function EditButton({
  href,
  target,
  title = "Edit",
  variant = "ghost",
  size = "sm",
  className,
  disabled = false,
  children,
  loadingLabel,
}: EditButtonProps) {
  const router = useAppRouter();
  const navTarget = target ?? `edit-${href}`;
  const isLoading = router.isNavigatingTarget(navTarget);

  const handleClick = () => {
    if (disabled || isLoading) return;
    router.push(href, { target: navTarget });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={title}
      className={cn("flex items-center", className)}
      data-navigation-target={navTarget}
    >
      {isLoading ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", children ? "mr-2" : "")} />
      ) : children ? null : (
        <Edit className="h-4 w-4 text-gray-600" />
      )}
      {isLoading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}
