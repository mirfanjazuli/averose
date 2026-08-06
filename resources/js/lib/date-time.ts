export type DateTimeValue = Date | string;

export type TimeFormatOptions = {
    includeTimezone?: boolean;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

export function getBrowserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatter(
    locale: string,
    timezone: string,
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
    const key = JSON.stringify([locale, timezone, options]);
    const cached = formatters.get(key);

    if (cached) {
        return cached;
    }

    const value = new Intl.DateTimeFormat(locale, {
        ...options,
        timeZone: timezone,
    });
    formatters.set(key, value);

    return value;
}

export function formatDateTime(
    value: DateTimeValue,
    timezone: string,
    options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        timeZoneName: 'short',
        year: 'numeric',
    },
    locale = 'id-ID',
): string {
    return formatter(locale, timezone, options).format(new Date(value));
}

export function formatDate(
    value: DateTimeValue,
    timezone: string,
    options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    },
): string {
    return formatDateTime(value, timezone, options);
}

export function formatTime(
    value: DateTimeValue,
    timezone: string,
    { includeTimezone = true }: TimeFormatOptions = {},
): string {
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        ...(includeTimezone ? { timeZoneName: 'short' } : {}),
    };

    return formatDateTime(value, timezone, options);
}

export function formatTimeRange(
    start: DateTimeValue,
    end: DateTimeValue,
    timezone: string,
    { includeTimezone = true }: TimeFormatOptions = {},
): string {
    const time = {
        hour: '2-digit',
        minute: '2-digit',
    } satisfies Intl.DateTimeFormatOptions;
    const endTime = formatDateTime(end, timezone, {
        ...time,
        ...(includeTimezone ? { timeZoneName: 'short' } : {}),
    });

    return `${formatDateTime(start, timezone, time)} - ${endTime}`;
}

function dateTimeParts(value: DateTimeValue, timezone: string) {
    return Object.fromEntries(
        formatter('en-CA', timezone, {
            day: '2-digit',
            hour: '2-digit',
            hourCycle: 'h23',
            minute: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
            .formatToParts(new Date(value))
            .map((part) => [part.type, part.value]),
    );
}

export function formatDateInput(
    value: DateTimeValue,
    timezone: string,
): string {
    const parts = dateTimeParts(value, timezone);

    return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatTimeInput(
    value: DateTimeValue,
    timezone: string,
): string {
    const parts = dateTimeParts(value, timezone);

    return `${parts.hour}:${parts.minute}`;
}

export function formatTimezoneName(
    value: DateTimeValue,
    timezone: string,
): string {
    return (
        formatter('id-ID', timezone, { timeZoneName: 'short' })
            .formatToParts(new Date(value))
            .find((part) => part.type === 'timeZoneName')?.value ?? timezone
    );
}

export function formatTimezoneLabel(
    timezone: string,
    value: DateTimeValue = new Date(),
): string {
    return `${formatTimezoneName(value, timezone)} (${timezone})`;
}

export function formatRelativeDateTime(
    value: DateTimeValue,
    locale = 'en',
): string {
    const differenceInSeconds = (new Date(value).getTime() - Date.now()) / 1000;
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['day', 86_400],
        ['hour', 3_600],
        ['minute', 60],
    ];
    const [unit, seconds] = units.find(
        ([, threshold]) => Math.abs(differenceInSeconds) >= threshold,
    ) ?? ['second', 1];

    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        Math.round(differenceInSeconds / seconds),
        unit,
    );
}
