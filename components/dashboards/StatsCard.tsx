"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TrendProps {
  value: number;
  label: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: TrendProps;
  color?: "blue" | "green" | "orange" | "purple" | "red";
}

const colorMap: Record<
  NonNullable<StatsCardProps["color"]>,
  { bg: string; icon: string; rule: string }
> = {
  blue:   { bg: "bg-blue-100",   icon: "text-blue-600",   rule: "bg-blue-400"   },
  green:  { bg: "bg-green-100",  icon: "text-green-600",  rule: "bg-green-400"  },
  orange: { bg: "bg-orange-100", icon: "text-orange-600", rule: "bg-orange-400" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600", rule: "bg-purple-400" },
  red:    { bg: "bg-red-100",    icon: "text-red-600",    rule: "bg-red-400"    },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: StatsCardProps) {
  const { bg, icon: iconColor, rule } = colorMap[color];

  const isPositive = trend !== undefined && trend.value > 0;
  const isNegative = trend !== undefined && trend.value < 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-gray-200/50 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_20px_45px_rgba(15,23,42,0.07)] hover:border-gray-200/80 hover:-translate-y-1 hover:scale-[1.01]">
      <CardContent className="p-5">
        {/* Header row: label + icon */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </p>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              bg
            )}
            aria-hidden="true"
          >
            <Icon className={cn("h-[18px] w-[18px]", iconColor)} />
          </span>
        </div>

        {/* Primary metric — owns the card visually */}
        <p
          className="mt-3 font-mono text-[2rem] font-bold leading-none tracking-tight text-slate-900"
          aria-label={`${title}: ${value}`}
        >
          {value}
        </p>

        {/* Subtitle + trend */}
        <div className="mt-2 flex min-h-[1.25rem] items-center gap-2">
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}

          {trend && (
            <span
              className={cn(
                "ml-auto flex items-center gap-0.5 text-xs font-medium",
                isPositive && "text-green-600",
                isNegative && "text-red-500",
                !isPositive && !isNegative && "text-slate-400"
              )}
              aria-label={`Trend: ${trend.value > 0 ? "+" : ""}${trend.value} ${trend.label}`}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {trend.value > 0 ? "+" : ""}
                {trend.value}
              </span>
              <span className="font-normal text-slate-400">{trend.label}</span>
            </span>
          )}
        </div>

        {/* Color accent: single-pixel bottom rule keyed to the card's color */}
        <div
          className={cn("absolute bottom-0 left-0 h-[2px] w-full opacity-50", rule)}
          aria-hidden="true"
        />
      </CardContent>
    </Card>
  );
}

export default StatsCard;
