import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
        {
          "border-transparent bg-blue-100 text-blue-700": variant === "default",
          "border-transparent bg-emerald-100 text-emerald-700":
            variant === "success",
          "border-transparent bg-amber-100 text-amber-700":
            variant === "warning",
          "border-transparent bg-red-100 text-red-700":
            variant === "destructive",
          "border-border bg-transparent text-muted-foreground":
            variant === "outline",
        },
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
