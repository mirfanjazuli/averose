import { NotificationPage } from '@/components/notifications/notification-page';
import type { PaginatedNotifications } from '@/types';

export default function MentorNotifications({
    filter,
    notifications,
}: {
    filter: 'all' | 'unread';
    notifications: PaginatedNotifications;
}) {
    return (
        <NotificationPage
            className="p-4"
            filter={filter}
            notifications={notifications}
        />
    );
}

MentorNotifications.layout = {
    breadcrumbs: [
        {
            title: 'Notifications',
            href: '/notifications',
        },
    ],
};
