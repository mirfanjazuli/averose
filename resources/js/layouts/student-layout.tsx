import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { StudentNavbar } from '@/components/student/student-navbar';
import type { AppLayoutProps } from '@/types';

export default function StudentLayout({
    children,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <StudentNavbar />
            <AppContent
                variant="header"
                className="scrollbar-stable min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto"
            >
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 md:px-8">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
