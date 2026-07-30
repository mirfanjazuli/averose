import { Head } from '@inertiajs/react';
import { Eye, EyeOff, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import { UpdateDialogZoomAccount } from '@/pages/admin/zoom-accounts/components/update-dialog-zoom-account';

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

function SecretValue({ value }: { value: string }) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="flex h-10 max-w-2xl items-center gap-2">
            <p className="min-w-0 truncate font-mono text-sm">
                {revealed ? value : '••••••••••••••••'}
            </p>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() => setRevealed((current) => !current)}
                aria-label={revealed ? 'Hide secret' : 'Show secret'}
            >
                {revealed ? (
                    <EyeOff className="size-4" />
                ) : (
                    <Eye className="size-4" />
                )}
            </Button>
        </div>
    );
}

export default function ZoomAccountDetail({
    account,
    meetings,
}: {
    account: ZoomAccount;
    meetings: ScheduledMeeting[];
}) {
    const [editAccountDialogOpen, setEditAccountDialogOpen] = useState(false);
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
        () => meetings.filter((meeting) => meeting.timingGroup === activeTab),
        [activeTab, meetings],
    );

    return (
        <>
            <Head title={account.name} />
            <div className="flex h-full min-w-0 max-w-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {account.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Zoom account detail and credential status.
                        </p>
                    </div>
                    <UpdateDialogZoomAccount
                        open={editAccountDialogOpen}
                        onOpenChange={setEditAccountDialogOpen}
                        account={account}
                        action={`/zoom-accounts/${account.slug}?redirect=detail`}
                        trigger={
                            <Button className="gap-2">
                                <Pencil className="size-4" />
                                Edit account
                            </Button>
                        }
                        onSuccess={() => {
                            setEditAccountDialogOpen(false);
                            toast.success('Zoom account updated.');
                        }}
                        onError={() => {
                            toast.error('Please check the Zoom account form.');
                        }}
                    />
                </div>

                <section className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Account ID
                            </p>
                            <p className="text-sm">{account.accountId}</p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Client ID
                            </p>
                            <p className="text-sm">{account.clientId}</p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Client Secret
                            </p>
                            <SecretValue value={account.clientSecret} />
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Token Secret
                            </p>
                            <SecretValue value={account.tokenSecret} />
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Created
                            </p>
                            <p className="text-sm">
                                {account.createdAt ?? '-'}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-end">
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
                    <TableScrollArea>
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
                                                <Badge
                                                    {...getBadgeProps(
                                                        'outline',
                                                    )}
                                                >
                                                    {formatBadgeLabel(
                                                        meeting.status,
                                                    )}
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
                    </TableScrollArea>
                </section>
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
