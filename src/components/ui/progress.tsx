"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorColor?: string;
  autoColor?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorColor, autoColor = false, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));

    // Dynamic color logic: Green < 75%, Yellow 75-90%, Red > 90%
    let colorClass = "bg-blue-600";
    if (autoColor) {
      if (clamped < 75) {
        colorClass = "bg-emerald-500";
      } else if (clamped <= 90) {
        colorClass = "bg-amber-500";
      } else {
        colorClass = "bg-red-500";
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-slate-100",
          className
        )}
        {...props}
      >
        <div
          className={cn("h-full w-full flex-1 transition-all duration-500", colorClass)}
          style={{
            transform: `translateX(-${100 - clamped}%)`,
            backgroundColor: indicatorColor,
          }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
