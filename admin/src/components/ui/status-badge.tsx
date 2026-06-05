import { cn } from "@/lib/utils";

type StatusVariant =
  | "confirmed"
  | "shifted"
  | "pending"
  | "active"
  | "inactive"
  | "high_priority"
  | "primary"
  | "secondary"
  | "tertiary";

const variantStyles: Record<StatusVariant, string> = {
  confirmed: "bg-green-100 text-green-700 border-green-200",
  shifted: "bg-orange-100 text-orange-700 border-orange-200",
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  active: "bg-blue-100 text-blue-700 border-blue-200",
  inactive: "bg-red-100 text-red-600 border-red-200",
  high_priority: "bg-blue-50 text-blue-700 border-blue-200",
  primary: "bg-emerald-100 text-emerald-700 border-emerald-200",
  secondary: "bg-violet-100 text-violet-700 border-violet-200",
  tertiary: "bg-amber-100 text-amber-700 border-amber-200",
};

const labels: Record<StatusVariant, string> = {
  confirmed: "Confirmed",
  shifted: "Shifted",
  pending: "Pending",
  active: "Active",
  inactive: "Inactive",
  high_priority: "High Priority",
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
};

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
        variantStyles[variant],
        className
      )}
    >
      {label ?? labels[variant]}
    </span>
  );
}
