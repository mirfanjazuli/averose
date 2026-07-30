import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { MentorSidebar } from '@/components/mentor/mentor-sidebar';
import { StudentSidebar } from '@/components/student/student-sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
            <AppContent
                variant="sidebar"
                className="min-h-0 min-w-0 overflow-hidden"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <ScrollArea className="min-h-0 min-w-0 w-full max-w-full flex-1">
                    <div className="min-w-0 max-w-full">{children}</div>
                </ScrollArea>
            </AppContent>
        </AppShell>
    );
}
