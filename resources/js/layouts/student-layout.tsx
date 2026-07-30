import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { StudentNavbar } from '@/components/student/student-navbar';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppLayoutProps } from '@/types';

export default function StudentLayout({
    children,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <StudentNavbar />
            <AppContent
                variant="header"
                className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden"
            >
                <ScrollArea className="min-h-0 min-w-0 w-full max-w-full flex-1">
                    <div className="mx-auto flex min-h-full min-w-0 w-full max-w-7xl flex-col gap-4 px-4 sm:px-8 lg:px-10">
                        {children}
                    </div>
                </ScrollArea>
            </AppContent>
        </AppShell>
    );
}
