"use client";

import React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useAppRouter } from "@/hooks/useAppRouter";
import { cn } from "@/lib/utils/cn";

export interface BackButtonProps {
  href?: string;
  label?: string;
  loadingLabel?: string;
  target?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}

export function BackButton({
  href,
  label,
  loadingLabel,
  target = "back",
  variant = "ghost",
  size = "sm",
  className,
  disabled = false,
  onClick,
  title = "Go Back",
}: BackButtonProps) {
  const router = useAppRouter();
  const isLoading = router.isNavigatingTarget(target);

  const handleClick = () => {
    if (disabled || isLoading) return;
    if (onClick) {
      onClick();
      return;
    }
    if (href) {
      router.push(href, { target });
    } else {
      router.back({ target });
    }
  };

  const displayText = isLoading
    ? loadingLabel ?? label
    : label;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={title}
      className={cn("flex items-center", className)}
      data-navigation-target={target}
    >
      {isLoading ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", label ? "mr-2" : "")} />
      ) : (
        <ArrowLeft className={cn("h-4 w-4", label ? "mr-2" : "")} />
      )}
      {displayText}
    </Button>
  );
}
