import { usePage } from '@inertiajs/react';
import { useSyncExternalStore } from 'react';
import { getBrowserTimezone } from '@/lib/date-time';
import type { Auth } from '@/types';

const subscribeToBrowserTimezone = () => () => undefined;

export function useBrowserTimezone(): string {
    return useSyncExternalStore(
        subscribeToBrowserTimezone,
        getBrowserTimezone,
        () => '',
    );
}

export function useUserTimezone(): string {
    const { auth } = usePage<{ auth: Auth }>().props;
    const browserTimezone = useBrowserTimezone();

    if (auth.user.timezoneMode === 'auto' && browserTimezone) {
        return browserTimezone;
    }

    return auth.user.timezone;
}
