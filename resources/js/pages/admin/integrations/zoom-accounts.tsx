import { Head } from '@inertiajs/react';
import { CalendarClock, Plus, ShieldCheck, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const accounts = [
    {
        name: 'AveRose Main Room',
        email: 'zoom.main@averose.test',
        capacity: '100 participants',
        meetings: '12 scheduled',
        status: 'Active',
    },
    {
        name: 'Mentor Room A',
        email: 'mentor.a@averose.test',
        capacity: '50 participants',
        meetings: '6 scheduled',
        status: 'Active',
    },
    {
        name: 'Workshop Room',
        email: 'workshop@averose.test',
        capacity: '100 participants',
        meetings: '2 scheduled',
        status: 'Standby',
    },
];

export default function ZoomAccounts() {
    return (
        <>
            <Head title="Zoom Accounts" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Zoom Accounts
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage Zoom accounts used for classes, mentoring,
                            and workshops.
                        </p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="size-4" />
                        Add account
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Video className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total accounts
                                </p>
                                <p className="text-2xl font-semibold">
                                    {accounts.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Active accounts
                                </p>
                                <p className="text-2xl font-semibold">2</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CalendarClock className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Scheduled meetings
                                </p>
                                <p className="text-2xl font-semibold">20</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Account list</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {accounts.map((account) => (
                            <div
                                key={account.email}
                                className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_11rem_9rem_auto]"
                            >
                                <div className="min-w-0">
                                    <h2 className="truncate font-semibold">
                                        {account.name}
                                    </h2>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {account.email}
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {account.capacity}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {account.meetings}
                                </p>
                                <Badge
                                    variant={
                                        account.status === 'Active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {account.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ZoomAccounts.layout = {
    breadcrumbs: [
        {
            title: 'Zoom Accounts',
            href: '/zoom-accounts',
        },
    ],
};
