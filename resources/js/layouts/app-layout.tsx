import { usePage } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { breadcrumbs: pageBreadcrumbs } = usePage<{
        breadcrumbs?: BreadcrumbItem[];
    }>().props;

    return (
        <AppLayoutTemplate breadcrumbs={pageBreadcrumbs ?? breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}
