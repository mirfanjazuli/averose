import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    ExternalLink,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileType,
} from 'lucide-react';
import {
    Attachment,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
    AttachmentTrigger,
} from '@/components/ui/attachment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';

type Enrollment = {
    duration: number | null;
    field: string | null;
    hasMaterialAccess: boolean;
    id: number;
    maxReschedule: number | null;
    program: string | null;
    programDescription: string | null;
    sessions: number | null;
    sessionsRemaining: number;
    sessionsUsed: number;
    startDate: string | null;
    status: string;
    thumbnailUrl: string | null;
    variant: string | null;
};

type Material = {
    description: string | null;
    mimeType: string;
    name: string;
    size: number;
    title: string;
    uploadedAt: string;
    url: string;
    uuid: string;
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatStartDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00Z`));
}

function fileType(mimeType: string): string {
    if (mimeType === 'application/pdf') {
        return 'PDF';
    }

    if (mimeType.includes('wordprocessing')) {
        return 'DOCX';
    }

    if (mimeType.includes('presentation')) {
        return 'PPTX';
    }

    if (mimeType.includes('spreadsheet')) {
        return 'XLSX';
    }

    if (mimeType === 'image/jpeg') {
        return 'JPG';
    }

    if (mimeType === 'image/png') {
        return 'PNG';
    }

    if (mimeType === 'image/webp') {
        return 'WEBP';
    }

    return 'FILE';
}

function MaterialIcon({ mimeType }: { mimeType: string }) {
    if (mimeType.startsWith('image/')) {
        return <FileImage className="text-[#0f8f7a]" />;
    }

    if (mimeType.includes('spreadsheet')) {
        return <FileSpreadsheet className="text-[#0f8f7a]" />;
    }

    if (mimeType.includes('presentation')) {
        return <FileType className="text-[#0f8f7a]" />;
    }

    return <FileText className="text-[#0f8f7a]" />;
}

export default function StudentEnrollmentDetail({
    enrollment,
    materials,
}: {
    enrollment: Enrollment;
    materials: Material[];
}) {
    return (
        <>
            <Head title={enrollment.program ?? 'Program'} />
            <div className="flex h-full max-w-full min-w-0 flex-1 flex-col gap-8 py-4 text-[#102a3a] md:gap-10 md:py-6">
                <Link
                    href="/enrollments"
                    className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#0f8f7a] hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    Program
                </Link>

                <section className="grid overflow-hidden rounded-md bg-[#f4fbf8] lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="flex flex-col justify-center p-6 sm:p-8">
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm font-semibold text-[#0f8f7a]">
                                {enrollment.field ?? 'Program belajar'}
                            </p>
                            <Badge
                                {...getBadgeProps(
                                    getStatusBadgeTone(enrollment.status),
                                )}
                            >
                                {formatBadgeLabel(enrollment.status)}
                            </Badge>
                        </div>
                        <h1 className="mt-3 font-heading text-3xl font-semibold text-[#102a3a] md:text-4xl">
                            {enrollment.program ?? '-'}
                        </h1>
                        {enrollment.programDescription && (
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526b7b]">
                                {enrollment.programDescription}
                            </p>
                        )}
                    </div>
                    {enrollment.thumbnailUrl && (
                        <img
                            src={enrollment.thumbnailUrl}
                            alt=""
                            className="aspect-video h-full w-full object-cover lg:aspect-auto"
                        />
                    )}
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="space-y-4">
                        <div>
                            <h2 className="font-heading text-xl font-semibold">
                                Materi pendukung
                            </h2>
                            <p className="mt-1 text-sm text-[#526b7b]">
                                Dokumen dan materi belajar untuk programmu.
                            </p>
                        </div>

                        {!enrollment.hasMaterialAccess ? (
                            <Empty className="border-[#dcece7] bg-[#f8fbfa]">
                                <EmptyHeader>
                                    <EmptyTitle>
                                        Akses materi tidak aktif
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        Materi dapat dibuka selama enrollment
                                        program masih aktif.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : materials.length === 0 ? (
                            <Empty className="border-[#dcece7] bg-[#f8fbfa]">
                                <EmptyHeader>
                                    <EmptyTitle>Belum ada materi</EmptyTitle>
                                    <EmptyDescription>
                                        Materi pendukung akan tampil di sini
                                        saat tersedia.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <div className="grid gap-2">
                                {materials.map((material) => (
                                    <Attachment
                                        key={material.uuid}
                                        state="idle"
                                        className="w-full flex-nowrap rounded-md border-[#dcece7] bg-white"
                                    >
                                        <AttachmentMedia>
                                            <MaterialIcon
                                                mimeType={material.mimeType}
                                            />
                                        </AttachmentMedia>
                                        <AttachmentContent>
                                            <AttachmentTitle>
                                                {material.title}
                                            </AttachmentTitle>
                                            <AttachmentDescription>
                                                {material.description ||
                                                    `${fileType(material.mimeType)} · ${formatFileSize(material.size)}`}
                                            </AttachmentDescription>
                                        </AttachmentContent>
                                        <AttachmentActions className="pointer-events-none">
                                            <ExternalLink className="size-4 text-[#0f8f7a]" />
                                        </AttachmentActions>
                                        <AttachmentTrigger asChild>
                                            <a
                                                href={material.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                aria-label={`Buka ${material.title}`}
                                            />
                                        </AttachmentTrigger>
                                    </Attachment>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="space-y-5 border-t border-[#dcece7] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                Sesi tersisa
                            </p>
                            <p className="mt-1 font-heading text-3xl font-semibold text-[#0f8f7a]">
                                {enrollment.sessionsRemaining}
                            </p>
                            <p className="mt-1 text-sm text-[#526b7b]">
                                {enrollment.sessionsUsed}/
                                {enrollment.sessions ?? 0} sesi digunakan
                            </p>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <Clock3 className="size-4 text-[#0f8f7a]" />
                                <span>
                                    {enrollment.duration ?? '-'} menit per sesi
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CalendarDays className="size-4 text-[#0f8f7a]" />
                                <span>
                                    Mulai{' '}
                                    {formatStartDate(enrollment.startDate)}
                                </span>
                            </div>
                        </div>
                        <Button
                            asChild
                            className="w-full bg-[#d9a441] text-[#102a3a] hover:bg-[#c89532]"
                        >
                            <Link href="/schedules">Jadwalkan sesi</Link>
                        </Button>
                    </aside>
                </section>
            </div>
        </>
    );
}

StudentEnrollmentDetail.layout = {
    breadcrumbs: [{ title: 'Program', href: '/enrollments' }],
};
