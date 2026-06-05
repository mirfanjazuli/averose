import { Head } from '@inertiajs/react';
import { CalendarDays, Clock3, MapPin, Plus, Users, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const days = [
    { day: 'Mon', date: '12', active: false },
    { day: 'Tue', date: '13', active: true },
    { day: 'Wed', date: '14', active: false },
    { day: 'Thu', date: '15', active: false },
    { day: 'Fri', date: '16', active: false },
];

const schedules = [
    {
        title: 'Product planning',
        time: '09:00 - 10:30',
        location: 'Meeting room A',
        type: 'Team',
        accent: 'bg-primary',
        icon: Users,
    },
    {
        title: 'Design review',
        time: '11:00 - 12:00',
        location: 'Google Meet',
        type: 'Online',
        accent: 'bg-[#64b6e6]',
        icon: Video,
    },
    {
        title: 'Client sync',
        time: '14:00 - 15:00',
        location: 'Conference room',
        type: 'External',
        accent: 'bg-[#f2aa35]',
        icon: CalendarDays,
    },
];

export default function Schedules() {
    return (
        <>
            <Head title="Schedules" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Schedules
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage meetings, tasks, and upcoming team events.
                        </p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="size-4" />
                        New schedule
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    {days.map((item) => (
                        <Card
                            key={item.day}
                            className={
                                item.active
                                    ? 'border-primary/30 bg-primary/10 py-4 ring-primary/20'
                                    : 'py-4'
                            }
                        >
                            <CardContent className="px-4 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {item.day}
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {item.date}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>Today</CardTitle>
                        <Badge variant="secondary">
                            {schedules.length} events
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {schedules.map((schedule) => (
                            <div
                                key={schedule.title}
                                className="grid gap-4 rounded-2xl border p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                            >
                                <div
                                    className={`flex size-11 items-center justify-center rounded-2xl text-white ${schedule.accent}`}
                                >
                                    <schedule.icon className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold">
                                            {schedule.title}
                                        </h2>
                                        <Badge variant="outline">
                                            {schedule.type}
                                        </Badge>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Clock3 className="size-4" />
                                            {schedule.time}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="size-4" />
                                            {schedule.location}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    Details
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Schedules.layout = {
    breadcrumbs: [
        {
            title: 'Scheduling',
            href: '/scheduling/schedules',
        },
        {
            title: 'Schedules',
            href: '/scheduling/schedules',
        },
    ],
};
