import { Head } from '@inertiajs/react';
import { CalendarOff, CalendarPlus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const holidays = [
    {
        name: 'New Year Holiday',
        date: 'January 1, 2026',
        type: 'National',
        status: 'Active',
    },
    {
        name: 'Eid al-Fitr',
        date: 'March 20, 2026',
        type: 'National',
        status: 'Active',
    },
    {
        name: 'Company Break',
        date: 'June 15, 2026',
        type: 'Internal',
        status: 'Draft',
    },
];

export default function PublicHolidays() {
    return (
        <>
            <Head title="Public Holidays" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Public Holidays
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage blocked dates for schedules, classes, and
                            mentoring sessions.
                        </p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="size-4" />
                        Add holiday
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CalendarOff className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total holidays
                                </p>
                                <p className="text-2xl font-semibold">
                                    {holidays.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CalendarPlus className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Upcoming blocks
                                </p>
                                <p className="text-2xl font-semibold">3</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Holiday list</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {holidays.map((holiday) => (
                            <div
                                key={holiday.name}
                                className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_11rem_8rem_auto]"
                            >
                                <h2 className="font-semibold">
                                    {holiday.name}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {holiday.date}
                                </p>
                                <Badge variant="outline">{holiday.type}</Badge>
                                <Badge
                                    variant={
                                        holiday.status === 'Active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {holiday.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PublicHolidays.layout = {
    breadcrumbs: [
        {
            title: 'Public Holidays',
            href: '/schedules/public-holidays',
        },
    ],
};
