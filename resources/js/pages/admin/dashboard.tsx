import { Head, Link, router } from '@inertiajs/react';
import {
    format,
} from 'date-fns';
import {
    ArrowUpRight,
    ArrowDown,
    ArrowUp,
    Download,
    Minus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from 'recharts';
import {
    DateRangeFilter,
    formatDateForRangeQuery,
    parseDateForRange,
} from '@/components/date-range-filter';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type DashboardStat = {
    href: string;
    label:
        | 'Total program'
        | 'Total sesi'
        | 'Rata-rata sesi/hari'
        | 'Mentor aktif';
    trend: {
        direction: 'down' | 'neutral' | 'up';
        label: string;
    };
    value: string;
};

type ChartItem = {
    label: string;
    value: number;
};

type DashboardChart = {
    description: string;
    items: ChartItem[];
    title: string;
};

type DashboardCharts = {
    popularPrograms: DashboardChart;
    popularSubjects: DashboardChart;
    programRegistrants: DashboardChart;
    sessionTotals: DashboardChart;
};

type DashboardFilters = {
    from: string;
    to: string;
};

type ChartColor = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4';

const statTrendStyles = {
    down: 'text-red-600 dark:text-red-400',
    neutral: '',
    up: 'text-emerald-600 dark:text-emerald-400',
} satisfies Record<DashboardStat['trend']['direction'], string>;

const statTrendIcons = {
    down: ArrowDown,
    neutral: Minus,
    up: ArrowUp,
} satisfies Record<DashboardStat['trend']['direction'], LucideIcon>;

function chartConfig(color: ChartColor) {
    return {
        value: {
            color: `var(--${color})`,
            label: 'Total',
        },
    } satisfies ChartConfig;
}

function maxValue(items: ChartItem[]) {
    return Math.max(...items.map((item) => item.value), 0);
}

function currentChartLabelIndex(items: ChartItem[]) {
    const today = new Date();
    const todayLabel = format(today, 'd MMM');
    const monthLabel = format(today, 'MMM');
    const todayIndex = items.findIndex((item) => item.label === todayLabel);

    if (todayIndex >= 0) {
        return todayIndex;
    }

    return items.findIndex((item) => item.label === monthLabel);
}

function EmptyChart() {
    return (
        <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed px-6 text-center text-sm text-muted-foreground">
            Belum ada data untuk ditampilkan.
        </div>
    );
}

function DailyLineChart({
    color,
    items,
}: {
    color: ChartColor;
    items: ChartItem[];
}) {
    const highestValue = maxValue(items);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const chartWidth = useMemo(
        () => Math.max(640, items.length * 48),
        [items.length],
    );

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        const focusedIndex = currentChartLabelIndex(items);

        if (!scrollArea || focusedIndex < 0 || items.length <= 1) {
            return;
        }

        const itemWidth = scrollArea.scrollWidth / items.length;
        scrollArea.scrollLeft =
            itemWidth * focusedIndex -
            scrollArea.clientWidth / 2 +
            itemWidth / 2;
    }, [items]);

    if (highestValue === 0) {
        return <EmptyChart />;
    }

    return (
        <div className="relative rounded-md border bg-muted/20">
            <div
                ref={scrollAreaRef}
                className="scrollbar-hide overflow-x-auto overflow-y-hidden"
            >
                <ChartContainer
                    config={chartConfig(color)}
                    className="h-56 px-3 py-4"
                    style={{ width: chartWidth }}
                >
                    <LineChart
                        accessibilityLayer
                        data={items}
                        margin={{ left: 12, right: 12 }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            interval={0}
                            minTickGap={12}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Line
                            dataKey="value"
                            type="monotone"
                            stroke="var(--color-value)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{
                                r: 5,
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-md bg-gradient-to-r from-background/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-md bg-gradient-to-l from-background/80 to-transparent" />
        </div>
    );
}

function RankingChart({
    color,
    items,
}: {
    color: ChartColor;
    items: ChartItem[];
}) {
    const highestValue = maxValue(items);

    if (highestValue === 0) {
        return <EmptyChart />;
    }

    return (
        <ChartContainer
            config={chartConfig(color)}
            className="h-80 w-full rounded-md border bg-muted/20 px-2 py-4"
        >
            <BarChart
                accessibilityLayer
                data={items}
                layout="vertical"
                margin={{ left: 12, right: 16 }}
            >
                <CartesianGrid horizontal={false} />
                <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={128}
                />
                <XAxis type="number" hide domain={[0, highestValue]} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[0, 4, 4, 0]}
                />
            </BarChart>
        </ChartContainer>
    );
}

function ChartCard({
    chart,
    color,
    variant,
}: {
    chart: DashboardChart;
    color: ChartColor;
    variant: 'line' | 'ranking';
}) {
    return (
        <Card>
            <CardHeader className="space-y-2">
                <CardTitle>{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
                {variant === 'line' ? (
                    <DailyLineChart color={color} items={chart.items} />
                ) : (
                    <RankingChart color={color} items={chart.items} />
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    charts,
    filters,
    stats,
}: {
    charts: DashboardCharts;
    filters: DashboardFilters;
    stats: DashboardStat[];
}) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: parseDateForRange(filters.from),
        to: parseDateForRange(filters.to),
    });
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const downloadPdfUrl = `/dashboard/download-pdf?from=${filters.from}&to=${filters.to}`;

    const downloadPdf = async () => {
        if (isExportingPdf) {
            return;
        }

        setIsExportingPdf(true);

        try {
            const response = await fetch(downloadPdfUrl, {
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Failed to download dashboard PDF.');
            }

            const disposition =
                response.headers.get('content-disposition') ?? '';
            const filename =
                disposition.match(/filename="([^"]+)"/)?.[1] ??
                'admin-dashboard.pdf';
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        } finally {
            setIsExportingPdf(false);
        }
    };

    const updateDateRange = (range: DateRange | undefined) => {
        setDateRange(range);

        if (!range?.from || !range.to) {
            return;
        }

        router.get(
            '/dashboard',
            {
                from: formatDateForRangeQuery(range.from),
                to: formatDateForRangeQuery(range.to),
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ringkasan operasional program, sesi, dan mentor.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <DateRangeFilter
                            value={dateRange}
                            onChange={updateDateRange}
                        />
                        <Button
                            type="button"
                            className="gap-2"
                            disabled={isExportingPdf}
                            onClick={() => void downloadPdf()}
                        >
                            {isExportingPdf ? (
                                <Spinner />
                            ) : (
                                <Download className="size-4" />
                            )}
                            Export PDF
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => {
                        const TrendIcon = statTrendIcons[item.trend.direction];

                        return (
                            <Card key={item.label}>
                                <CardContent className="relative flex min-h-36 flex-col justify-between px-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="min-w-0 truncate text-sm text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <Button
                                            asChild
                                            variant="secondary"
                                            size="icon"
                                            className="-mt-1 size-8 shrink-0 rounded-full"
                                        >
                                            <Link href={item.href}>
                                                <ArrowUpRight className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </div>

                                    <div>
                                        <div className="flex items-end gap-2">
                                            <p className="text-5xl font-semibold tracking-normal">
                                                {item.value}
                                            </p>
                                            {item.trend.direction !==
                                            'neutral' ? (
                                                <p
                                                    className={cn(
                                                        'mb-1.5 flex max-w-full items-center gap-1 text-xs text-muted-foreground',
                                                        statTrendStyles[
                                                            item.trend
                                                                .direction
                                                        ],
                                                    )}
                                                >
                                                    <TrendIcon className="size-3.5 shrink-0" />
                                                    <span className="truncate">
                                                        {item.trend.label}
                                                    </span>
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <ChartCard
                        chart={charts.sessionTotals}
                        color="chart-1"
                        variant="line"
                    />
                    <ChartCard
                        chart={charts.programRegistrants}
                        color="chart-2"
                        variant="line"
                    />
                    <ChartCard
                        chart={charts.popularPrograms}
                        color="chart-3"
                        variant="ranking"
                    />
                    <ChartCard
                        chart={charts.popularSubjects}
                        color="chart-4"
                        variant="ranking"
                    />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
