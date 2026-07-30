import { Head, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
    AppNotification,
    NotificationFeed,
    PaginatedNotifications,
} from '@/types';

const notificationTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const copy = {
    en: {
        all: 'All',
        empty: 'No notifications yet.',
        emptyUnread: 'No unread notifications.',
        markAll: 'Mark all as read',
        next: 'Next',
        notificationCount: 'notifications',
        previous: 'Previous',
        showing: 'Showing',
        title: 'Notifications',
        unread: 'Unread',
    },
    id: {
        all: 'Semua',
        empty: 'Belum ada notifikasi.',
        emptyUnread: 'Tidak ada notifikasi yang belum dibaca.',
        markAll: 'Tandai semua dibaca',
        next: 'Berikutnya',
        notificationCount: 'notifikasi',
        previous: 'Sebelumnya',
        showing: 'Menampilkan',
        title: 'Notifikasi',
        unread: 'Belum dibaca',
    },
};

function formatNotificationTime(value: string | null) {
    return value
        ? `${notificationTimeFormatter.format(new Date(value))} WIB`
        : '';
}

export function NotificationPage({
    className,
    filter,
    locale = 'en',
    notifications,
}: {
    className?: string;
    filter: 'all' | 'unread';
    locale?: keyof typeof copy;
    notifications: PaginatedNotifications;
}) {
    const { notificationFeed } = usePage<{
        notificationFeed: NotificationFeed;
    }>().props;
    const labels = copy[locale];

    const openNotification = (notification: AppNotification) => {
        router.post(`/notifications/${notification.id}/read`);
    };

    return (
        <>
            <Head title={labels.title} />
            <div
                className={cn(
                    'flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 py-4',
                    className,
                )}
            >
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="font-heading text-2xl font-semibold">
                        {labels.title}
                    </h1>
                    {notificationFeed.unreadCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.post('/notifications/read-all')
                            }
                        >
                            <CheckCheck className="size-4" />
                            {labels.markAll}
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() =>
                            router.get(
                                '/notifications',
                                { filter: 'all' },
                                { preserveState: true },
                            )
                        }
                    >
                        {labels.all}
                    </Button>
                    <Button
                        variant={filter === 'unread' ? 'default' : 'outline'}
                        onClick={() =>
                            router.get(
                                '/notifications',
                                { filter: 'unread' },
                                { preserveState: true },
                            )
                        }
                    >
                        {labels.unread}
                    </Button>
                </div>

                {notifications.data.length > 0 ? (
                    <div className="divide-y border-y">
                        {notifications.data.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                className="flex w-full items-start gap-4 px-1 py-4 text-left transition-colors hover:bg-muted/40 sm:px-3"
                                onClick={() => openNotification(notification)}
                            >
                                <span
                                    className={cn(
                                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                                        notification.event ===
                                            'reschedule_rejected'
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-primary/10 text-primary',
                                    )}
                                >
                                    <Bell className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={cn(
                                                'font-medium',
                                                !notification.isRead &&
                                                    'font-semibold',
                                                notification.event ===
                                                    'reschedule_rejected' &&
                                                    'text-destructive',
                                            )}
                                        >
                                            {notification.title}
                                        </span>
                                        {!notification.isRead && (
                                            <span className="size-2 rounded-full bg-primary" />
                                        )}
                                    </span>
                                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                                        {notification.message}
                                    </span>
                                    <span className="mt-1.5 block text-xs text-muted-foreground">
                                        {formatNotificationTime(
                                            notification.createdAt,
                                        )}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <EmptyState>
                        {filter === 'unread'
                            ? labels.emptyUnread
                            : labels.empty}
                    </EmptyState>
                )}

                {notifications.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            {labels.showing} {notifications.from}-
                            {notifications.to} of {notifications.total}{' '}
                            {labels.notificationCount}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!notifications.prev_page_url}
                                onClick={() =>
                                    notifications.prev_page_url &&
                                    router.get(
                                        notifications.prev_page_url,
                                        {},
                                        { preserveState: true },
                                    )
                                }
                            >
                                <ChevronLeft className="size-4" />
                                {labels.previous}
                            </Button>
                            <span className="px-2 text-sm text-muted-foreground">
                                {notifications.current_page} /{' '}
                                {notifications.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!notifications.next_page_url}
                                onClick={() =>
                                    notifications.next_page_url &&
                                    router.get(
                                        notifications.next_page_url,
                                        {},
                                        { preserveState: true },
                                    )
                                }
                            >
                                {labels.next}
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
