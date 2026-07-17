import { usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

import AppLayout from '@/layouts/app-layout';
import MentorLayout from '@/layouts/mentor-layout';
import StudentLayout from '@/layouts/student-layout';
import type { Auth } from '@/types';

export default function SettingsRoleLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<{ auth: Auth }>().props;

    if (auth.user.role === 'student') {
        return <StudentLayout>{children}</StudentLayout>;
    }

    if (auth.user.role === 'mentor') {
        return <MentorLayout>{children}</MentorLayout>;
    }

    return <AppLayout>{children}</AppLayout>;
}
