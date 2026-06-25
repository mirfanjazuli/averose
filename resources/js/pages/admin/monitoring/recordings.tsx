import { Form, Head } from '@inertiajs/react';
import { ExternalLink, Plus, Search, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
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

type Recording = {
    id: string;
    mentor: string;
    program: string;
    recordedDate: string;
    source: string;
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
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [recordings, searchQuery]);

    return (
        <>
            <Head title="Recordings" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
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
                                    Attach a YouTube link to an existing session.
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
                                            <Label htmlFor="session_booking_id">
                                                Session
                                            </Label>
                                            <Select name="session_booking_id">
                                                <SelectTrigger id="session_booking_id">
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
                                                message={
                                                    errors.session_booking_id
                                                }
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
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Video className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total recordings
                                </p>
                                <p className="text-2xl font-semibold">
                                    {recordings.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Video className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Manual links
                                </p>
                                <p className="text-2xl font-semibold">
                                    {
                                        recordings.filter(
                                            (recording) =>
                                                recording.source === 'Manual',
                                        ).length
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Video className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Search results
                                </p>
                                <p className="text-2xl font-semibold">
                                    {filteredRecordings.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Recording list</CardTitle>
                            <CardDescription>
                                Videos linked to student session bookings.
                            </CardDescription>
                        </div>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search recordings..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-2xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Recording</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Mentor</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead className="w-24 text-right" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRecordings.length > 0 ? (
                                        filteredRecordings.map((recording) => (
                                            <TableRow key={recording.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {recording.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {
                                                            recording.zoomMeetingId
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {recording.student}
                                                </TableCell>
                                                <TableCell>
                                                    {recording.mentor}
                                                </TableCell>
                                                <TableCell>
                                                    {recording.subject}
                                                </TableCell>
                                                <TableCell>
                                                    {recording.recordedDate}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {recording.source}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        asChild
                                                        size="icon-sm"
                                                        variant="ghost"
                                                    >
                                                        <a
                                                            href={
                                                                recording.youtubeUrl
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <ExternalLink className="size-4" />
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="h-24 text-center text-sm text-muted-foreground"
                                            >
                                                No recordings found.
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
