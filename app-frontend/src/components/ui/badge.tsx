import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/10 text-primary",
        success: "border-success/30 bg-success/10 text-success",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        warning: "border-warning/30 bg-warning/10 text-warning",
        muted: "border-border/60 bg-surface text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge }
