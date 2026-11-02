import React from "react";
import { PageHeader, type BreadcrumbItem } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export type { BreadcrumbItem };

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      <div>{children}</div>
    </div>
  );
}
