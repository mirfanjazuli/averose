import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useBrowserTimezone } from '@/hooks/use-user-timezone';
import type { User } from '@/types';

let pendingSync: string | null = null;

export function TimezoneSynchronizer() {
    const { auth } = usePage<{ auth?: { user: User | null } }>().props;
    const browserTimezone = useBrowserTimezone();
    const user = auth?.user;

    useEffect(() => {
        const syncKey = user ? `${user.id}:${browserTimezone}` : null;

        if (
            !user ||
            user.timezoneMode !== 'auto' ||
            !browserTimezone ||
            browserTimezone === user.timezone ||
            pendingSync === syncKey
        ) {
            return;
        }

        pendingSync = syncKey;
        router.post(
            '/settings/timezone/sync',
            { timezone: browserTimezone },
            {
                onError: () => {
                    pendingSync = null;
                },
                onFinish: () => {
                    pendingSync = null;
                },
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
            },
        );
    }, [browserTimezone, user]);

    return null;
}
