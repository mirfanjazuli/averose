import { Head } from '@inertiajs/react';
import {
    CalendarClock,
    KeyRound,
    Pencil,
    ShieldCheck,
    Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ZoomAccountForm } from '@/components/zoom-account-form';

type ZoomAccount = {
    id: number;
    name: string;
    slug: string;
    accountId: string;
    clientId: string;
    clientSecret: string;
    tokenSecret: string;
    createdAt: string | null;
    updatedAt: string | null;
};

type ScheduledMeeting = {
    id: string;
    meetingId: string | null;
    mentor: string;
    program: string;
    status: string;
    student: string;
    timingGroup: 'active' | 'today' | 'upcoming';
    time: string;
    title: string;
    zoomLink: string | null;
};

const meetingTabs = [
    { label: 'Active', value: 'active' },
    { label: 'Today', value: 'today' },
    { label: 'Upcoming', value: 'upcoming' },
] as const;

type MeetingTab = (typeof meetingTabs)[number]['value'];

export default function ZoomAccountDetail({
    account,
    meetings,
}: {
    account: ZoomAccount;
    meetings: ScheduledMeeting[];
}) {
    const [editAccountDialogOpen, setEditAccountDialogOpen] = useState(false);
    const [credentialsOpen, setCredentialsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<MeetingTab>('active');
    const meetingCounts = useMemo(
        () => ({
            active: meetings.filter(
                (meeting) => meeting.timingGroup === 'active',
            ).length,
            today: meetings.filter((meeting) => meeting.timingGroup === 'today')
                .length,
            upcoming: meetings.filter(
                (meeting) => meeting.timingGroup === 'upcoming',
            ).length,
        }),
        [meetings],
    );
    const visibleMeetings = useMemo(
        () =>
            meetings.filter((meeting) => meeting.timingGroup === activeTab),
        [activeTab, meetings],
    );

    return (
        <>
            <Head title={account.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {account.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Zoom account detail and credential status.
                        </p>
                    </div>
                    <Dialog
                        open={editAccountDialogOpen}
                        onOpenChange={setEditAccountDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Pencil className="size-4" />
                                Edit account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Zoom account</DialogTitle>
                                <DialogDescription>
                                    Update account details or rotate
                                    credentials.
                                </DialogDescription>
                            </DialogHeader>
                            <ZoomAccountForm
                                account={account}
                                key={account.slug}
                                action={`/zoom-accounts/${account.slug}?redirect=detail`}
                                idPrefix="detail-zoom"
                                method="put"
                                onSuccess={() => {
                                    setEditAccountDialogOpen(false);
                                    toast.success('Zoom account updated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the Zoom account form.',
                                    );
                                }}
                                submitLabel="Save changes"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Video className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Account
                                </p>
                                <p className="font-medium">
                                    {account.accountId}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <KeyRound className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Client
                                </p>
                                <p className="font-medium">
                                    {account.clientId}
                                </p>
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
                                <p className="font-medium">
                                    {meetings.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Account information</CardTitle>
                            <CardDescription>
                                Core credentials and update history.
                            </CardDescription>
                        </div>
                        <Dialog
                            open={credentialsOpen}
                            onOpenChange={setCredentialsOpen}
                        >
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <ShieldCheck className="size-4" />
                                    View secrets
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Zoom credentials</DialogTitle>
                                    <DialogDescription>
                                        Secrets are encrypted at rest. Rotate
                                        them from Zoom Marketplace if exposed.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <p className="text-sm text-muted-foreground">
                                            Client Secret
                                        </p>
                                        <PasswordInput
                                            value={account.clientSecret}
                                            readOnly
                                            className="font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <p className="text-sm text-muted-foreground">
                                            Token Secret
                                        </p>
                                        <PasswordInput
                                            value={account.tokenSecret}
                                            readOnly
                                            className="font-mono"
                                        />
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Name
                                </p>
                                <p className="mt-1 font-medium">
                                    {account.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Account ID
                                </p>
                                <p className="mt-1 font-medium">
                                    {account.accountId}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Created
                                </p>
                                <p className="mt-1 font-medium">
                                    {account.createdAt ?? '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Updated
                                </p>
                                <p className="mt-1 font-medium">
                                    {account.updatedAt ?? '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <CardTitle>Scheduled meetings</CardTitle>
                                <CardDescription>
                                    Active, remaining today, and upcoming
                                    meetings assigned to this account.
                                </CardDescription>
                            </div>
                            <div className="flex rounded-2xl border bg-background p-1">
                                {meetingTabs.map((tab) => (
                                    <Button
                                        key={tab.value}
                                        type="button"
                                        variant={
                                            activeTab === tab.value
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        className="gap-2 rounded-xl"
                                        onClick={() => setActiveTab(tab.value)}
                                    >
                                        {tab.label}
                                        <Badge
                                            variant={
                                                activeTab === tab.value
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {meetingCounts[tab.value]}
                                        </Badge>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-2xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Session</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Mentor</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Meeting ID</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleMeetings.length > 0 ? (
                                        visibleMeetings.map((meeting) => (
                                            <TableRow key={meeting.id}>
                                                <TableCell>
                                                    <p className="font-medium">
                                                        {meeting.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {meeting.program}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    {meeting.student}
                                                </TableCell>
                                                <TableCell>
                                                    {meeting.mentor}
                                                </TableCell>
                                                <TableCell>
                                                    {meeting.time}
                                                </TableCell>
                                                <TableCell>
                                                    {meeting.meetingId ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {meeting.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-24 text-center text-sm text-muted-foreground"
                                            >
                                                No {activeTab} meetings.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ZoomAccountDetail.layout = {
    breadcrumbs: [
        {
            title: 'Zoom Accounts',
            href: '/zoom-accounts',
        },
    ],
};
