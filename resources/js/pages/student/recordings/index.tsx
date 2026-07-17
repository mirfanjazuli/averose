import { Head } from '@inertiajs/react';
import { ExternalLink, PlayCircle, Search, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Card className="border-primary/15 bg-primary/5">
                    <CardContent className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_18rem] md:p-6">
                        <div>
                            <h1 className="font-heading text-2xl font-semibold md:text-3xl">
                                Tonton ulang sesi belajarmu
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Akses rekaman sesi belajar dan ulangi pembahasan
                                sesuai kebutuhanmu.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold">Daftar rekaman</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {filteredRecordings.length} video ditemukan
                        </p>
                    </div>
                    <div className="flex h-10 min-w-64 items-center gap-2 rounded-xl border bg-background px-3 text-sm text-muted-foreground">
                        <Search className="size-4" />
                        <Input
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Cari judul, mentor, atau mapel..."
                            className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                        />
                    </div>
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
                                <CardContent className="space-y-4 p-4">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">
                                                {recording.subject}
                                            </Badge>
                                            <Badge variant="outline">
                                                {recording.recordedDate}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h2 className="line-clamp-2 font-semibold">
                                                {recording.title}
                                            </h2>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {recording.mentor} ·{' '}
                                                {recording.program}
                                            </p>
                                        </div>
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
                                            Tonton rekaman
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
                                <p className="font-medium">Belum ada rekaman</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Video sesi mentor akan tampil di sini.
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
