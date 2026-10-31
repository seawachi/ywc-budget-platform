import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default:
        "bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25",
      destructive:
        "bg-red-600 text-white shadow-md shadow-red-500/20 hover:bg-red-700",
      outline:
        "bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md transition-all",
      secondary:
        "bg-slate-100/80 text-slate-800 hover:bg-slate-200/80",
      ghost: "hover:bg-slate-100 text-slate-700",
      link: "text-blue-600 underline-offset-4 hover:underline",
      success:
        "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25",
    };

    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-7 text-sm font-semibold",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
