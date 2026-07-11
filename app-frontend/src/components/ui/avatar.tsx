import * as React from "react"

import { cn } from "@/lib/utils"

function avatarFallbackUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`
}

function Avatar({
  src,
  seed,
  alt,
  className,
  ...props
}: React.ComponentProps<"img"> & { seed: string }) {
  return (
    <img
      data-slot="avatar"
      src={src ?? avatarFallbackUrl(seed)}
      alt={alt ?? seed}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = avatarFallbackUrl(seed)
      }}
      className={cn(
        "h-11 w-11 shrink-0 rounded-xl bg-gradient-brand object-cover shadow-glow",
        className
      )}
      {...props}
    />
  )
}

export { Avatar }
