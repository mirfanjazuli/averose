import { Head } from '@inertiajs/react';
import { ExternalLink, PlayCircle, Search, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Recording = {
    id: string;
    mentor: string;
    program: string;
    recordedDate: string;
    source: string;
    subject: string;
    title: string;
    youtubeEmbedUrl: string;
    youtubeUrl: string;
};

export default function StudentRecordings({
    recordings,
}: {
    recordings: Recording[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredRecordings = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return recordings;
        }

        return recordings.filter((recording) =>
            [
                recording.title,
                recording.mentor,
                recording.subject,
                recording.program,
                recording.recordedDate,
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
                            Watch uploaded videos from your completed sessions.
                        </p>
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
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Video className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Available videos
                                </p>
                                <p className="text-2xl font-semibold">
                                    {recordings.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardContent className="flex items-center justify-between gap-4 px-6 py-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Filtered results
                                </p>
                                <p className="text-2xl font-semibold">
                                    {filteredRecordings.length}
                                </p>
                            </div>
                            <Badge variant="secondary">YouTube</Badge>
                        </CardContent>
                    </Card>
                </div>

                {filteredRecordings.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredRecordings.map((recording) => (
                            <Card
                                key={recording.id}
                                className="overflow-hidden p-0"
                            >
                                <div className="aspect-video bg-muted">
                                    <iframe
                                        className="h-full w-full"
                                        src={recording.youtubeEmbedUrl}
                                        title={recording.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                </div>
                                <CardHeader>
                                    <CardTitle className="line-clamp-2 text-base">
                                        {recording.title}
                                    </CardTitle>
                                    <CardDescription>
                                        {recording.subject} - {recording.mentor}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-5">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">
                                            {recording.recordedDate}
                                        </Badge>
                                        <Badge variant="outline">
                                            {recording.program}
                                        </Badge>
                                    </div>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <a
                                            href={recording.youtubeUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <PlayCircle className="size-4" />
                                            Watch video
                                            <ExternalLink className="ml-auto size-4" />
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                            <Video className="size-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">
                                    No recordings found
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Uploaded session videos will appear here.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

StudentRecordings.layout = {
    breadcrumbs: [
        {
            title: 'Recordings',
            href: '/recordings',
        },
    ],
};
