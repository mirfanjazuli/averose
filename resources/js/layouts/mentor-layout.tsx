import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { MentorSidebar } from '@/components/mentor/mentor-sidebar';
import { NotificationMenu } from '@/components/notifications/notification-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppLayoutProps, BreadcrumbItem, NotificationFeed } from '@/types';

export default function MentorLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { breadcrumbs: pageBreadcrumbs, notificationFeed } = usePage<{
        breadcrumbs?: BreadcrumbItem[];
        notificationFeed: NotificationFeed;
    }>().props;

    return (
        <AppShell variant="sidebar">
            <MentorSidebar />
            <AppContent
                variant="sidebar"
                className="min-h-0 min-w-0 overflow-hidden"
            >
                <AppSidebarHeader
                    breadcrumbs={pageBreadcrumbs ?? breadcrumbs}
                    actions={
                        <NotificationMenu initialFeed={notificationFeed} />
                    }
                />
                <ScrollArea className="min-h-0 w-full max-w-full min-w-0 flex-1">
                    <div className="max-w-full min-w-0">{children}</div>
                </ScrollArea>
            </AppContent>
        </AppShell>
    );
}
