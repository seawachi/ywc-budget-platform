import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-blue-600 text-white shadow-sm shadow-blue-500/20",
    secondary: "bg-slate-100 text-slate-800",
    destructive: "bg-red-50 text-red-700",
    outline: "bg-white text-slate-700 shadow-sm",
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-800",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
