"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labels: Record<string, string> = {
    dashboard: "Dashboard",
    customers: "Customers",
    jobs: "Jobs",
    schedule: "Schedule",
    employees: "Employees",
    pumps: "Pumps",
    settings: "Settings",
};

export function AppBreadcrumbs() {
    const pathname = usePathname();

    const segments = pathname.split("/").filter(Boolean);

    const items = ["dashboard", ...segments];

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {items.map((segment, index) => {
                    const isDashboard = index === 0;

                    const href = isDashboard
                        ? "/dashboard"
                        : "/" + segments.slice(0, index).join("/");

                    const isLast = index === items.length - 1;

                    const label = labels[segment] ?? segment;

                    return (
                        <Fragment key={href}>
                            {index > 0 && <BreadcrumbSeparator />}

                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink
                                        render={<Link href={href} />}
                                    >
                                        {label}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}