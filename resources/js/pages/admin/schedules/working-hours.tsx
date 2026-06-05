import { Head } from '@inertiajs/react';
import { Clock3, Plus, TimerReset } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const workingHours = [
    {
        day: 'Monday',
        hours: '09:00 - 17:00',
        breakTime: '12:00 - 13:00',
        status: 'Active',
    },
    {
        day: 'Tuesday',
        hours: '09:00 - 17:00',
        breakTime: '12:00 - 13:00',
        status: 'Active',
    },
    {
        day: 'Wednesday',
        hours: '10:00 - 18:00',
        breakTime: '12:30 - 13:30',
        status: 'Active',
    },
    {
        day: 'Saturday',
        hours: '09:00 - 13:00',
        breakTime: '-',
        status: 'Limited',
    },
];

export default function WorkingHours() {
    return (
        <>
            <Head title="Working Hours" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Working Hours
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage available hours for classes, mentoring, and
                            reschedule slots.
                        </p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="size-4" />
                        Add hours
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Clock3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Active days
                                </p>
                                <p className="text-2xl font-semibold">4</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <TimerReset className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Weekly capacity
                                </p>
                                <p className="text-2xl font-semibold">
                                    31 hours
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Weekly schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {workingHours.map((item) => (
                            <div
                                key={item.day}
                                className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem_auto]"
                            >
                                <h2 className="font-semibold">{item.day}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {item.hours}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Break {item.breakTime}
                                </p>
                                <Badge
                                    variant={
                                        item.status === 'Active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {item.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

WorkingHours.layout = {
    breadcrumbs: [
        {
            title: 'Working Hours',
            href: '/schedules/working-hours',
        },
    ],
};
