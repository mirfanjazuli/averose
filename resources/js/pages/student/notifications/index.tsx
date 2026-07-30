import { NotificationPage } from '@/components/notifications/notification-page';
import type { PaginatedNotifications } from '@/types';

export default function StudentNotifications({
    filter,
    notifications,
}: {
    filter: 'all' | 'unread';
    notifications: PaginatedNotifications;
}) {
    return (
        <NotificationPage
            filter={filter}
            locale="id"
            notifications={notifications}
        />
    );
}
