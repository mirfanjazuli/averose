import { Head } from '@inertiajs/react';
import { ExternalLink, Play, Search, Video } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatDate } from '@/lib/date-time';

type Recording = {
    id: string;
    mentor: string;
    program: string;
    recordedAt: string | null;
    source: string;
    subject: string;
    title: string;
    youtubeEmbedUrl: string;
    youtubeUrl: string;
};

function youtubeThumbnailUrl(embedUrl: string) {
    const videoId = embedUrl.split('/embed/')[1]?.split(/[?&]/)[0];

    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
}

export default function StudentRecordings({
    recordings,
}: {
    recordings: Recording[];
}) {
    const timezone = useUserTimezone();
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
                recording.recordedAt
                    ? formatDate(recording.recordedAt, timezone)
                    : '',
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [recordings, searchQuery, timezone]);

    return (
        <>
            <Head title="Rekaman" />
            <div className="flex h-full min-w-0 max-w-full flex-1 flex-col gap-8 py-4 text-[#102a3a] md:gap-10 md:py-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-[#102a3a] md:text-4xl">
                            Rekaman belajar
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526b7b]">
                            Tonton ulang pembahasan mentor kapan pun kamu perlu
                            mengulang materi.
                        </p>
                    </div>
                    <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#dcece7] bg-white px-3 text-sm text-[#526b7b] shadow-sm shadow-[#102a3a]/[0.03] sm:w-80">
                        <Search className="size-4" />
                        <Input
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Cari rekaman..."
                            className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                        />
                    </div>
                </div>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-heading text-md font-semibold text-[#102a3a]">
                            Daftar rekaman
                        </h2>
                        <p className="text-sm font-medium text-[#526b7b]">
                            {filteredRecordings.length} video
                        </p>
                    </div>

                    {filteredRecordings.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredRecordings.map((recording) => {
                                const thumbnailUrl = youtubeThumbnailUrl(
                                    recording.youtubeEmbedUrl,
                                );

                                return (
                                    <article
                                        key={recording.id}
                                        className="group overflow-hidden rounded-md bg-white shadow-sm shadow-[#102a3a]/[0.03] ring-1 ring-[#dcece7] transition-colors hover:ring-[#bfe4db]"
                                    >
                                        <a
                                            href={recording.youtubeUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="relative block aspect-video overflow-hidden bg-[#edf7f4]"
                                        >
                                            {thumbnailUrl ? (
                                                <img
                                                    src={thumbnailUrl}
                                                    alt=""
                                                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center text-[#0f8f7a]">
                                                    <Video className="size-10" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,42,58,0.36),transparent_55%)]" />
                                            <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-white/92 text-[#0f8f7a] shadow-lg shadow-[#102a3a]/10 transition-transform group-hover:scale-105">
                                                <Play className="ml-0.5 size-5 fill-current" />
                                            </span>
                                        </a>

                                        <div className="space-y-4 p-4">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="border-[#dcece7] bg-[#edf7f4] text-[#0f8f7a]">
                                                    {recording.subject}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="border-[#dcece7] text-[#526b7b]"
                                                >
                                                    {recording.recordedAt
                                                        ? formatDate(
                                                              recording.recordedAt,
                                                              timezone,
                                                          )
                                                        : '-'}
                                                </Badge>
                                            </div>

                                            <div>
                                                <h3 className="line-clamp-2 min-h-12 font-heading text-lg leading-6 font-semibold text-[#102a3a]">
                                                    {recording.title}
                                                </h3>
                                                <p className="mt-2 line-clamp-1 text-sm text-[#526b7b]">
                                                    {recording.mentor} ·{' '}
                                                    {recording.program}
                                                </p>
                                            </div>

                                            <Button
                                                asChild
                                                variant="outline"
                                                className="w-full rounded-xl border-[#dcece7] text-[#102a3a] hover:bg-[#edf7f4] hover:text-[#0f8f7a]"
                                            >
                                                <a
                                                    href={recording.youtubeUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Tonton rekaman
                                                    <ExternalLink className="ml-auto size-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-md bg-[#f8fbfa] px-6 py-12 text-center">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#0f8f7a] ring-1 ring-[#dcece7]">
                                <Video className="size-6" />
                            </div>
                            <h2 className="mt-5 font-heading text-xl font-semibold text-[#102a3a]">
                                Belum ada rekaman
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#526b7b]">
                                Rekaman sesi akan tampil setelah video kelas
                                selesai diproses.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

StudentRecordings.layout = {
    breadcrumbs: [
        {
            title: 'Rekaman',
            href: '/recordings',
        },
    ],
};
