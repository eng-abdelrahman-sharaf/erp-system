"use client"

import * as React from "react"
import { TextArea as TextAreaPrimitive, type TextAreaProps } from "react-aria-components"
import { cn } from "@/lib/utils/cn"

function Textarea({
  className,
  ...props
}: TextAreaProps & React.RefAttributes<HTMLTextAreaElement>) {
  return (
    <TextAreaPrimitive
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
