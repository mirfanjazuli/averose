export type AppNotification = {
    createdAt: string | null;
    event: string;
    id: string;
    isRead: boolean;
    message: string;
    scheduleCode: string | null;
    title: string;
    url: string;
};

export type NotificationFeed = {
    items: AppNotification[];
    unreadCount: number;
};

export type PaginatedNotifications = {
    current_page: number;
    data: AppNotification[];
    from: number | null;
    last_page: number;
    next_page_url: string | null;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
};
