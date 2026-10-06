import * as React from "react";
import { cn } from "@/lib/utils";
import { Heading, Paragraph } from "./typography";

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
  borderBottom?: boolean;
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  breadcrumbs,
  className,
  borderBottom = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start sm:items-center justify-between gap-3 sm:gap-4 pb-1",
        borderBottom && "pb-4 border-b border-border",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {breadcrumbs && <div className="mb-1.5">{breadcrumbs}</div>}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Heading level={2} className="tracking-tight">
            {title}
          </Heading>
          {badge}
        </div>
        {description && (
          typeof description === "string" ? (
            <Paragraph size="sm" variant="muted" className="mt-0.5">
              {description}
            </Paragraph>
          ) : (
            <div className="mt-0.5">{description}</div>
          )
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-end self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
