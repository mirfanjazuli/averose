import { Form, Head } from '@inertiajs/react';
import { ExternalLink, Plus, PowerOff, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SummaryCard } from '@/components/admin/summary-card';
import { AdminTableSection } from '@/components/admin/table-section';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';

type Recording = {
    id: string;
    mentor: string;
    program: string;
    recordedDate: string;
    source: string;
    status: string;
    student: string;
    subject: string;
    title: string;
    youtubeUrl: string;
    zoomAccount: string;
    zoomMeetingId: string;
};

type SessionOption = {
    id: string;
    label: string;
    meetingId: string | null;
    student: string;
    zoomAccount: string;
};

export default function AdminRecordings({
    recordings,
    sessionOptions,
}: {
    recordings: Recording[];
    sessionOptions: SessionOption[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [deactivatingRecording, setDeactivatingRecording] =
        useState<Recording | null>(null);
    const manualLinksCount = recordings.filter(
        (recording) => recording.source === 'Manual',
    ).length;
    const activeRecordingsCount = recordings.filter(
        (recording) => recording.status === 'Active',
    ).length;

    const filteredRecordings = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return recordings;
        }

        return recordings.filter((recording) =>
            [
                recording.title,
                recording.student,
                recording.mentor,
                recording.subject,
                recording.program,
                recording.zoomMeetingId,
                recording.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [recordings, searchQuery]);

    return (
        <>
            <Head title="Recordings" />
            <div className="flex min-h-full min-w-0 max-w-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Recordings
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage uploaded session videos and add manual
                            YouTube links.
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add recording
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Add recording</DialogTitle>
                                <DialogDescription>
                                    Attach a YouTube link to an existing
                                    session.
                                </DialogDescription>
                            </DialogHeader>
                            <Form
                                action="/monitoring/recordings"
                                method="post"
                                resetOnSuccess
                                onSuccess={() => {
                                    toast.success('Recording added.');
                                    setOpen(false);
                                }}
                                className="space-y-4"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="schedule_id">
                                                Session
                                            </Label>
                                            <Select name="schedule_id">
                                                <SelectTrigger id="schedule_id">
                                                    <SelectValue placeholder="Select session" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sessionOptions.map(
                                                        (session) => (
                                                            <SelectItem
                                                                key={session.id}
                                                                value={
                                                                    session.id
                                                                }
                                                            >
                                                                {session.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.schedule_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="youtube_url">
                                                YouTube URL
                                            </Label>
                                            <Input
                                                id="youtube_url"
                                                name="youtube_url"
                                                placeholder="https://www.youtube.com/watch?v=..."
                                            />
                                            <InputError
                                                message={errors.youtube_url}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input
                                                id="title"
                                                name="title"
                                                placeholder="Optional title"
                                            />
                                            <InputError
                                                message={errors.title}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="recorded_at">
                                                Recorded date
                                            </Label>
                                            <Input
                                                id="recorded_at"
                                                name="recorded_at"
                                                type="date"
                                            />
                                            <InputError
                                                message={errors.recorded_at}
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button disabled={processing}>
                                                Save recording
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={Video}
                        label="Total recordings"
                        value={recordings.length}
                    />
                    <SummaryCard
                        icon={Video}
                        label="Manual links"
                        value={manualLinksCount}
                    />
                    <SummaryCard
                        icon={Video}
                        label="Active recordings"
                        value={activeRecordingsCount}
                    />
                </div>

                <AlertDialog
                    open={!!deactivatingRecording}
                    onOpenChange={(open) =>
                        !open && setDeactivatingRecording(null)
                    }
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate recording?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will hide {deactivatingRecording?.title}{' '}
                                from student recording pages.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deactivatingRecording && (
                            <Form
                                action={`/monitoring/recordings/${deactivatingRecording.id}`}
                                method="delete"
                                onSuccess={() => {
                                    setDeactivatingRecording(null);
                                    toast.success('Recording deactivated.');
                                }}
                                onError={() =>
                                    toast.error(
                                        'Unable to deactivate recording.',
                                    )
                                }
                            >
                                {({ processing }) => (
                                    <AlertDialogFooter>
                                        <AlertDialogCancel
                                            type="button"
                                            disabled={processing}
                                        >
                                            Cancel
                                        </AlertDialogCancel>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            Deactivate recording
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <AdminTableSection
                    emptyMessage="No recordings found."
                    emptySearchMessage="No recordings match your search."
                    filteredItems={filteredRecordings.length}
                    search={{
                        value: searchQuery,
                        onChange: setSearchQuery,
                        placeholder: 'Search recordings...',
                    }}
                    tableMinWidth="72rem"
                    totalItems={recordings.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Recording</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Mentor</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecordings.map((recording) => (
                                <TableRow key={recording.id}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {recording.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {recording.zoomMeetingId}
                                        </div>
                                    </TableCell>
                                    <TableCell>{recording.student}</TableCell>
                                    <TableCell>{recording.mentor}</TableCell>
                                    <TableCell>{recording.subject}</TableCell>
                                    <TableCell>
                                        {recording.recordedDate}
                                    </TableCell>
                                    <TableCell>
                                        <Badge {...getBadgeProps('muted')}>
                                            {formatBadgeLabel(
                                                recording.source,
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            {...getBadgeProps(
                                                getStatusBadgeTone(
                                                    recording.status,
                                                ),
                                            )}
                                        >
                                            {formatBadgeLabel(
                                                recording.status,
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                asChild
                                                size="icon-sm"
                                                variant="ghost"
                                            >
                                                <a
                                                    href={recording.youtubeUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <ExternalLink className="size-4" />
                                                </a>
                                            </Button>
                                            {recording.status === 'Active' && (
                                                <Button
                                                    type="button"
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    className="rounded-full text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        setDeactivatingRecording(
                                                            recording,
                                                        )
                                                    }
                                                >
                                                    <PowerOff className="size-4" />
                                                    <span className="sr-only">
                                                        Deactivate recording
                                                    </span>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </AdminTableSection>
            </div>
        </>
    );
}

AdminRecordings.layout = {
    breadcrumbs: [
        {
            title: 'Monitoring',
            href: '/monitoring/mentor-journals',
        },
        {
            title: 'Recordings',
            href: '/monitoring/recordings',
        },
    ],
};
