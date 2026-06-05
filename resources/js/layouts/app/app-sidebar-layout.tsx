import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { MentorSidebar } from '@/components/mentor-sidebar';
import { StudentSidebar } from '@/components/student-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage<AppLayoutProps>().props;
    const Sidebar =
        auth.user.role === 'mentor'
            ? MentorSidebar
            : auth.user.role === 'student'
              ? StudentSidebar
              : AppSidebar;

    return (
        <AppShell variant="sidebar">
            <Sidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
