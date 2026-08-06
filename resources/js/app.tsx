import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { TimezoneSynchronizer } from '@/components/timezone-synchronizer';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import MentorLayout from '@/layouts/mentor-layout';
import SettingsLayout from '@/layouts/settings/layout';
import SettingsRoleLayout from '@/layouts/settings/role-layout';
import StudentLayout from '@/layouts/student-layout';
configureEcho({
    broadcaster: 'reverb',
});

const appName = import.meta.env.VITE_APP_NAME || 'AveRose';

function TimezoneLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <TimezoneSynchronizer />
            {children}
        </>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return TimezoneLayout;
            case name.startsWith('landing/'):
                return TimezoneLayout;
            case name === 'student/try-outs/session':
                return TimezoneLayout;
            case name === 'student/try-outs/results/show':
                return TimezoneLayout;
            case name.startsWith('auth/'):
                return [TimezoneLayout, AuthLayout];
            case name.startsWith('settings/'):
                return [TimezoneLayout, SettingsRoleLayout, SettingsLayout];
            case name.startsWith('admin/'):
                return [TimezoneLayout, AppLayout];
            case name.startsWith('mentor/'):
                return [TimezoneLayout, MentorLayout];
            case name.startsWith('student/'):
                return [TimezoneLayout, StudentLayout];
            default:
                return [TimezoneLayout, AppLayout];
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
