import { Link, router } from '@inertiajs/react';
import { useConnectionStatus, useEchoNotification } from '@laravel/echo-react';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatDateTime } from '@/lib/date-time';
import { cn } from '@/lib/utils';
import type { AppNotification, NotificationFeed } from '@/types';

type RealtimeNotificationPayload = {
    event: AppNotification['event'];
    message: string;
    occurred_at: string;
    schedule_code: string | null;
    title: string;
    url: string;
    version: number;
};

const copy = {
    en: {
        ariaLabel: 'Open notifications',
        empty: 'No notifications yet',
        emptyDescription: 'Schedule updates will appear here.',
        markAll: 'Mark all as read',
        title: 'Notifications',
        viewAll: 'View all notifications',
    },
    id: {
        ariaLabel: 'Buka notifikasi',
        empty: 'Belum ada notifikasi',
        emptyDescription: 'Perubahan jadwal akan tampil di sini.',
        markAll: 'Tandai semua dibaca',
        title: 'Notifikasi',
        viewAll: 'Lihat semua notifikasi',
    },
};

export function NotificationMenu({
    buttonClassName,
    initialFeed,
    locale = 'en',
    userId,
}: {
    buttonClassName?: string;
    initialFeed: NotificationFeed;
    locale?: keyof typeof copy;
    userId: number;
}) {
    const timezone = useUserTimezone();
    const [feed, setFeed] = useState(initialFeed);
    const connectionStatus = useConnectionStatus();
    const previousConnectionStatus = useRef(connectionStatus);
    const refreshPromise = useRef<Promise<void> | null>(null);
    const seenNotificationIds = useRef(
        new Set(initialFeed.items.map((notification) => notification.id)),
    );
    const labels = copy[locale];

    const refreshFeed = useCallback((): Promise<void> => {
        if (refreshPromise.current) {
            return refreshPromise.current;
        }

        const request = (async () => {
            try {
                const response = await fetch('/notifications/feed', {
                    headers: { Accept: 'application/json' },
                });

                if (response.ok) {
                    const refreshedFeed =
                        (await response.json()) as NotificationFeed;

                    refreshedFeed.items.forEach((notification) => {
                        seenNotificationIds.current.add(notification.id);
                    });
                    setFeed(refreshedFeed);
                }
            } catch {
                // Keep the last successful feed when the network is unavailable.
            } finally {
                refreshPromise.current = null;
            }
        })();

        refreshPromise.current = request;

        return request;
    }, []);

    const receiveNotification = useCallback(
        (
            notification: RealtimeNotificationPayload & {
                id: string;
                type: string;
            },
        ) => {
            const isNewNotification = !seenNotificationIds.current.has(
                notification.id,
            );

            seenNotificationIds.current.add(notification.id);
            setFeed((currentFeed) => {
                const existingNotification = currentFeed.items.find(
                    (item) => item.id === notification.id,
                );
                const item: AppNotification = {
                    createdAt: notification.occurred_at,
                    event: notification.event,
                    id: notification.id,
                    isRead: existingNotification?.isRead ?? false,
                    message: notification.message,
                    scheduleCode: notification.schedule_code,
                    title: notification.title,
                    url: notification.url,
                };

                return {
                    items: [
                        item,
                        ...currentFeed.items.filter(
                            (currentItem) => currentItem.id !== item.id,
                        ),
                    ].slice(0, 5),
                    unreadCount: isNewNotification
                        ? currentFeed.unreadCount + 1
                        : currentFeed.unreadCount,
                };
            });
        },
        [],
    );

    useEchoNotification<RealtimeNotificationPayload>(
        `App.Models.User.${userId}`,
        receiveNotification,
        [],
        [receiveNotification],
    );

    useEffect(() => {
        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible') {
                void refreshFeed();
            }
        };
        document.addEventListener('visibilitychange', refreshWhenVisible);

        return () => {
            document.removeEventListener(
                'visibilitychange',
                refreshWhenVisible,
            );
        };
    }, [refreshFeed]);

    useEffect(() => {
        const previousStatus = previousConnectionStatus.current;

        previousConnectionStatus.current = connectionStatus;

        if (
            connectionStatus === 'connected' &&
            previousStatus !== 'connected'
        ) {
            void refreshFeed();
        }
    }, [connectionStatus, refreshFeed]);

    const openNotification = (notification: AppNotification) => {
        if (!notification.isRead) {
            setFeed((currentFeed) => ({
                items: currentFeed.items.map((item) =>
                    item.id === notification.id
                        ? { ...item, isRead: true }
                        : item,
                ),
                unreadCount: Math.max(0, currentFeed.unreadCount - 1),
            }));
        }

        router.post(`/notifications/${notification.id}/read`);
    };

    const markAllAsRead = () => {
        setFeed((currentFeed) => ({
            items: currentFeed.items.map((notification) => ({
                ...notification,
                isRead: true,
            })),
            unreadCount: 0,
        }));
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && refreshFeed()}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn('relative rounded-full', buttonClassName)}
                    aria-label={labels.ariaLabel}
                >
                    <Bell className="size-5" />
                    {feed.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white">
                            {feed.unreadCount > 99 ? '99+' : feed.unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-88 p-0">
                <div className="flex min-h-12 items-center justify-between gap-3 px-4">
                    <p className="font-semibold">{labels.title}</p>
                    {feed.unreadCount > 0 && (
                        <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={markAllAsRead}
                        >
                            {labels.markAll}
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />

                {feed.items.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto p-1">
                        {feed.items.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="items-start py-3"
                                onSelect={() => openNotification(notification)}
                            >
                                <span
                                    className={cn(
                                        'mt-1.5 size-2 shrink-0 rounded-full',
                                        notification.isRead
                                            ? 'bg-transparent'
                                            : notification.event ===
                                                'reschedule_rejected'
                                              ? 'bg-destructive'
                                              : 'bg-primary',
                                    )}
                                />
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={cn(
                                            'block font-medium',
                                            notification.event ===
                                                'reschedule_rejected' &&
                                                'text-destructive',
                                        )}
                                    >
                                        {notification.title}
                                    </span>
                                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                                        {notification.message}
                                    </span>
                                    <span className="mt-1 block text-[11px] text-muted-foreground">
                                        {notification.createdAt
                                            ? formatDateTime(
                                                  notification.createdAt,
                                                  timezone,
                                              )
                                            : ''}
                                    </span>
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                ) : (
                    <div className="px-5 py-10 text-center">
                        <Bell className="mx-auto size-5 text-muted-foreground" />
                        <p className="mt-3 text-sm font-medium">
                            {labels.empty}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {labels.emptyDescription}
                        </p>
                    </div>
                )}

                <DropdownMenuSeparator className="m-0" />
                <div className="p-2">
                    <Button variant="ghost" className="w-full" asChild>
                        <Link href="/notifications">{labels.viewAll}</Link>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
