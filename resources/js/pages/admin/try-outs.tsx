import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    CheckCircle2,
    Clock3,
    Download,
    Eye,
    FileUp,
    LoaderCircle,
    MoreVertical,
    Pencil,
    Search,
    SendToBack,
    Upload,
    UploadCloud,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationButton,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
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
    clearTypesetMath,
    hasMathSource,
    scheduleDocumentTypeset,
    typesetMath,
} from '@/lib/mathjax';

type TryOut = {
    duration: string;
    durationMinutes: number | null;
    id: string;
    questions: number;
    slug: string;
    status: string;
    subjects: string[];
    title: string;
};

type PreviewQuestion = {
    answer: string | null;
    number: number;
    options: Record<string, string>;
    options_html: Record<string, string>;
    question_html: string;
    question_text: string;
    subject_name: string | null;
};

type ImportPreview = {
    durationMinutes: number | null;
    questionCount: number;
    questions: PreviewQuestion[];
    status: string;
    subjects: string[];
    title: string;
    token: string;
};

type StatusAction = {
    status: 'draft' | 'published';
    tryOut: TryOut;
};

const previewQuestionFragmentCount = (questions: PreviewQuestion[]) =>
    questions.reduce(
        (count, question) => count + 1 + Object.keys(question.options).length,
        0,
    );

function RichContent({
    className,
    html,
    onReady,
    readyKey,
}: {
    className?: string;
    html: string;
    onReady?: (key: string) => void;
    readyKey?: string;
}) {
    const contentRef = useRef<HTMLSpanElement>(null);
    const containsMath = hasMathSource(html);
    const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
    const isRendered = !containsMath || renderedHtml === html;

    useEffect(() => {
        const element = contentRef.current;

        if (!element) {
            return;
        }

        let isCurrent = true;

        if (!containsMath) {
            queueMicrotask(() => {
                if (isCurrent && readyKey) {
                    onReady?.(readyKey);
                }
            });

            return () => {
                isCurrent = false;
            };
        }

        void typesetMath(element)
            .then(() => {
                if (isCurrent) {
                    setRenderedHtml(html);

                    if (readyKey) {
                        onReady?.(readyKey);
                    }
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setRenderedHtml(html);

                    if (readyKey) {
                        onReady?.(readyKey);
                    }
                }
            });

        return () => {
            isCurrent = false;
            clearTypesetMath(element);
        };
    }, [containsMath, html, onReady, readyKey]);

    return (
        <span className={className}>
            <span
                key={html}
                ref={contentRef}
                className="transition-opacity duration-150"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ opacity: isRendered ? 1 : 0 }}
            />
        </span>
    );
}

export default function AdminTryOuts({ tryOuts }: { tryOuts: TryOut[] }) {
    const page = usePage<{
        flash?: {
            success?: string;
            tryOutImportPreview?: ImportPreview;
        };
    }>();
    const flashPreview = page.props.flash?.tryOutImportPreview ?? null;
    const [open, setOpen] = useState(Boolean(flashPreview));
    const [previewOverride, setPreviewOverride] =
        useState<ImportPreview | null>(null);
    const [dismissedPreviewToken, setDismissedPreviewToken] = useState<
        string | null
    >(null);
    const [readyPreviewFragments, setReadyPreviewFragments] = useState<
        Set<string>
    >(new Set());
    const [isPreparingPreview, setIsPreparingPreview] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [tryOutsPerPage, setTryOutsPerPage] = useState(5);
    const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
    const [editingTryOut, setEditingTryOut] = useState<TryOut | null>(null);
    const preview =
        previewOverride ??
        (flashPreview?.token !== dismissedPreviewToken ? flashPreview : null);
    const readyPreviewFragmentCount = preview
        ? Array.from(readyPreviewFragments).filter((fragmentKey) =>
              fragmentKey.startsWith(`${preview.token}:`),
          ).length
        : 0;
    const isPreviewReady = Boolean(
        preview &&
        readyPreviewFragmentCount >=
            previewQuestionFragmentCount(preview.questions),
    );

    const filteredTryOuts = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return tryOuts;
        }

        return tryOuts.filter((tryOut) =>
            [tryOut.title, tryOut.status, tryOut.subjects.join(' ')].some(
                (value) => value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [searchQuery, tryOuts]);
    const totalPages = Math.max(
        1,
        Math.ceil(filteredTryOuts.length / tryOutsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstTryOutIndex = (safeCurrentPage - 1) * tryOutsPerPage;
    const visibleTryOuts = filteredTryOuts.slice(
        firstTryOutIndex,
        firstTryOutIndex + tryOutsPerPage,
    );

    const publishedCount = tryOuts.filter(
        (tryOut) => tryOut.status === 'Published',
    ).length;
    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    useEffect(() => {
        if (!page.props.flash?.success) {
            return;
        }

        toast.success(page.props.flash.success);
    }, [page.props.flash?.success]);

    useEffect(() => {
        scheduleDocumentTypeset();
    }, [preview]);

    const markPreviewFragmentReady = useCallback((fragmentKey: string) => {
        setReadyPreviewFragments((current) => {
            if (current.has(fragmentKey)) {
                return current;
            }

            const next = new Set(current);
            next.add(fragmentKey);

            return next;
        });
    }, []);

    return (
        <>
            <Head title="Try Out" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Try Out
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage assessments, question sets, and student
                            results.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" className="gap-2">
                            <a href="/academics/try-outs/import/template">
                                <Download className="size-4" />
                                Download template
                            </a>
                        </Button>
                        <Dialog
                            open={open}
                            onOpenChange={(nextOpen) => {
                                setOpen(nextOpen);

                                if (!nextOpen) {
                                    setPreviewOverride(null);
                                    setIsPreparingPreview(false);
                                    setReadyPreviewFragments(new Set());
                                    setDismissedPreviewToken(
                                        preview?.token ?? null,
                                    );
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <FileUp className="size-4" />
                                    Import DOCX
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        {preview && isPreviewReady
                                            ? 'Review generated questions'
                                            : 'Import try out questions'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {preview && isPreviewReady
                                            ? 'Review the parsed questions before saving them as a try out.'
                                            : 'Upload a Word document containing numbered questions, choices A-E, and an answer key section.'}
                                    </DialogDescription>
                                </DialogHeader>
                                {preview && (
                                    <div
                                        className={
                                            isPreviewReady
                                                ? 'space-y-4'
                                                : 'pointer-events-none fixed top-0 -left-[9999px] w-[840px] opacity-0'
                                        }
                                        aria-hidden={!isPreviewReady}
                                    >
                                        <div className="grid gap-3 rounded-lg border p-4 text-sm md:grid-cols-4">
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Title
                                                </p>
                                                <p className="font-medium">
                                                    {preview.title}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Status
                                                </p>
                                                <p className="font-medium">
                                                    {preview.status}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Duration
                                                </p>
                                                <p className="font-medium">
                                                    {preview.durationMinutes
                                                        ? `${preview.durationMinutes} min`
                                                        : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Questions
                                                </p>
                                                <p className="font-medium">
                                                    {preview.questionCount}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-2">
                                            {preview.questions.map(
                                                (question) => (
                                                    <div
                                                        key={question.number}
                                                        className="space-y-3 rounded-lg border p-4"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div>
                                                                <h3 className="font-semibold">
                                                                    Question{' '}
                                                                    {
                                                                        question.number
                                                                    }
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {question.subject_name ??
                                                                        'General'}
                                                                </p>
                                                            </div>
                                                            <Badge variant="secondary">
                                                                Answer:{' '}
                                                                {question.answer ??
                                                                    '-'}
                                                            </Badge>
                                                        </div>

                                                        <RichContent
                                                            className="block text-sm leading-6 whitespace-pre-wrap"
                                                            html={
                                                                question.question_html ||
                                                                question.question_text
                                                            }
                                                            readyKey={`${preview.token}:question-${question.number}`}
                                                            onReady={
                                                                markPreviewFragmentReady
                                                            }
                                                        />

                                                        <div className="grid gap-2">
                                                            {Object.entries(
                                                                question.options,
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    value,
                                                                ]) => (
                                                                    <div
                                                                        key={
                                                                            key
                                                                        }
                                                                        className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 rounded-lg border p-3 text-sm"
                                                                    >
                                                                        <span className="flex size-8 items-center justify-center rounded-full border font-semibold">
                                                                            {
                                                                                key
                                                                            }
                                                                        </span>
                                                                        <RichContent
                                                                            className="pt-1 leading-6"
                                                                            html={
                                                                                question
                                                                                    .options_html[
                                                                                    key
                                                                                ] ??
                                                                                value
                                                                            }
                                                                            readyKey={`${preview.token}:question-${question.number}-option-${key}`}
                                                                            onReady={
                                                                                markPreviewFragmentReady
                                                                            }
                                                                        />
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>

                                        <div className="flex flex-wrap justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setPreviewOverride(null);
                                                    setIsPreparingPreview(
                                                        false,
                                                    );
                                                    setReadyPreviewFragments(
                                                        new Set(),
                                                    );
                                                    setDismissedPreviewToken(
                                                        preview.token,
                                                    );
                                                }}
                                            >
                                                Upload another
                                            </Button>
                                            <Form
                                                action="/academics/try-outs/import"
                                                method="post"
                                                onSuccess={() => {
                                                    setPreviewOverride(null);
                                                    setDismissedPreviewToken(
                                                        preview.token,
                                                    );
                                                    setOpen(false);
                                                }}
                                                onError={() => {
                                                    toast.error(
                                                        'Failed to save try out.',
                                                    );
                                                }}
                                            >
                                                {({ errors, processing }) => (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name="token"
                                                            value={
                                                                preview.token
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.token
                                                            }
                                                            className="mb-2"
                                                        />
                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                processing
                                                            }
                                                            className="gap-2"
                                                        >
                                                            <Upload className="size-4" />
                                                            {processing
                                                                ? 'Saving...'
                                                                : 'Save try out'}
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        </div>
                                    </div>
                                )}

                                {(!preview || !isPreviewReady) && (
                                    <Form
                                        action="/academics/try-outs/import/preview"
                                        method="post"
                                        encType="multipart/form-data"
                                        resetOnSuccess
                                        onStart={() => {
                                            setIsPreparingPreview(true);
                                            setReadyPreviewFragments(new Set());
                                        }}
                                        onSuccess={() => {
                                            setOpen(true);
                                        }}
                                        onError={() => {
                                            setIsPreparingPreview(false);
                                            toast.error(
                                                'Failed to generate preview.',
                                            );
                                        }}
                                        className="space-y-4"
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="title">
                                                        Title
                                                    </Label>
                                                    <Input
                                                        id="title"
                                                        name="title"
                                                        placeholder="Leave empty to use file name"
                                                    />
                                                    <InputError
                                                        message={errors.title}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="duration_minutes">
                                                        Duration
                                                    </Label>
                                                    <Input
                                                        id="duration_minutes"
                                                        name="duration_minutes"
                                                        type="number"
                                                        min="1"
                                                        placeholder="120"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.duration_minutes
                                                        }
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="status">
                                                        Status
                                                    </Label>
                                                    <Select
                                                        name="status"
                                                        defaultValue="draft"
                                                    >
                                                        <SelectTrigger id="status">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="draft">
                                                                Draft
                                                            </SelectItem>
                                                            <SelectItem value="published">
                                                                Published
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={errors.status}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="document">
                                                        Word document
                                                    </Label>
                                                    <Input
                                                        id="document"
                                                        name="document"
                                                        type="file"
                                                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.document
                                                        }
                                                    />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        isPreparingPreview
                                                    }
                                                    className="w-full gap-2"
                                                >
                                                    {processing ||
                                                    isPreparingPreview ? (
                                                        <LoaderCircle className="size-4 animate-spin" />
                                                    ) : (
                                                        <Upload className="size-4" />
                                                    )}
                                                    {processing
                                                        ? 'Generating...'
                                                        : isPreparingPreview
                                                          ? 'Preparing preview...'
                                                          : 'Generate preview'}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Dialog
                    open={!!editingTryOut}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) {
                            setEditingTryOut(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit try out</DialogTitle>
                            <DialogDescription>
                                Update the try out name and duration.
                            </DialogDescription>
                        </DialogHeader>
                        {editingTryOut && (
                            <Form
                                action={`/academics/try-outs/${editingTryOut.slug}`}
                                method="put"
                                onSuccess={() => {
                                    setEditingTryOut(null);
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the try out form.',
                                    );
                                }}
                                className="space-y-4"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-title">
                                                Name
                                            </Label>
                                            <Input
                                                id="edit-title"
                                                name="title"
                                                defaultValue={
                                                    editingTryOut.title
                                                }
                                            />
                                            <InputError
                                                message={errors.title}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-duration">
                                                Duration
                                            </Label>
                                            <Input
                                                id="edit-duration"
                                                name="duration_minutes"
                                                type="number"
                                                min="1"
                                                max="1000"
                                                defaultValue={
                                                    editingTryOut.durationMinutes ??
                                                    ''
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.duration_minutes
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing
                                                ? 'Saving...'
                                                : 'Save changes'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={!!statusAction}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) {
                            setStatusAction(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {statusAction?.status === 'published'
                                    ? 'Publish try out?'
                                    : 'Unpublish try out?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {statusAction?.status === 'published'
                                    ? `${statusAction.tryOut.title} will be visible and available for students.`
                                    : `${statusAction?.tryOut.title} will be moved back to draft and hidden from students.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {statusAction && (
                            <Form
                                action={`/academics/try-outs/${statusAction.tryOut.slug}/${statusAction.status === 'published' ? 'publish' : 'unpublish'}`}
                                method="put"
                                onSuccess={() => {
                                    setStatusAction(null);
                                }}
                                onError={() => {
                                    toast.error(
                                        statusAction.status === 'published'
                                            ? 'Unable to publish this try out.'
                                            : 'Unable to unpublish this try out.',
                                    );
                                }}
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
                                            disabled={processing}
                                        >
                                            {statusAction.status === 'published'
                                                ? 'Publish'
                                                : 'Unpublish'}
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <BookOpenCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total try outs
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {tryOuts.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Published
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {publishedCount}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Try out list</CardTitle>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search try outs..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {tryOuts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No try outs imported yet.
                            </div>
                        ) : filteredTryOuts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No try outs match your search.
                            </div>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Subjects</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead>Questions</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleTryOuts.map((tryOut) => (
                                                <TableRow key={tryOut.id}>
                                                    <TableCell className="font-medium">
                                                        {tryOut.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        {tryOut.subjects
                                                            .length > 0
                                                            ? tryOut.subjects.join(
                                                                  ', ',
                                                              )
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Clock3 className="size-4 text-muted-foreground" />
                                                            {tryOut.duration}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {tryOut.questions}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                tryOut.status ===
                                                                'Published'
                                                                    ? 'outline'
                                                                    : 'outline'
                                                            }
                                                            className={
                                                                tryOut.status ===
                                                                'Published'
                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                    : undefined
                                                            }
                                                        >
                                                            {tryOut.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    className="rounded-full"
                                                                >
                                                                    <MoreVertical className="size-4" />
                                                                    <span className="sr-only">
                                                                        Open try
                                                                        out
                                                                        actions
                                                                    </span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-40"
                                                            >
                                                                <DropdownMenuItem
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={`/academics/try-outs/${tryOut.slug}`}
                                                                    >
                                                                        <Eye className="size-4" />
                                                                        View
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setEditingTryOut(
                                                                            tryOut,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="size-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {tryOut.status ===
                                                                'Published' ? (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setStatusAction(
                                                                                {
                                                                                    status: 'draft',
                                                                                    tryOut,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <SendToBack className="size-4" />
                                                                        Unpublish
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setStatusAction(
                                                                                {
                                                                                    status: 'published',
                                                                                    tryOut,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <UploadCloud className="size-4" />
                                                                        Publish
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {firstTryOutIndex + 1}-
                                        {Math.min(
                                            firstTryOutIndex + tryOutsPerPage,
                                            filteredTryOuts.length,
                                        )}{' '}
                                        of {filteredTryOuts.length} try outs
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                                        <span>Rows per page</span>
                                        <Select
                                            value={String(tryOutsPerPage)}
                                            onValueChange={(value) => {
                                                setTryOutsPerPage(
                                                    Number(value),
                                                );
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 w-20 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">
                                                    5
                                                </SelectItem>
                                                <SelectItem value="10">
                                                    10
                                                </SelectItem>
                                                <SelectItem value="20">
                                                    20
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Pagination className="mx-0 w-auto justify-start lg:justify-end">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    className={
                                                        safeCurrentPage === 1
                                                            ? 'pointer-events-none opacity-50'
                                                            : undefined
                                                    }
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        goToPage(
                                                            safeCurrentPage - 1,
                                                        );
                                                    }}
                                                />
                                            </PaginationItem>
                                            {Array.from(
                                                { length: totalPages },
                                                (_, index) => index + 1,
                                            ).map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationButton
                                                        type="button"
                                                        isActive={
                                                            safeCurrentPage ===
                                                            page
                                                        }
                                                        onClick={() =>
                                                            goToPage(page)
                                                        }
                                                    >
                                                        {page}
                                                    </PaginationButton>
                                                </PaginationItem>
                                            ))}
                                            {totalPages > 5 && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    className={
                                                        safeCurrentPage ===
                                                        totalPages
                                                            ? 'pointer-events-none opacity-50'
                                                            : undefined
                                                    }
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        goToPage(
                                                            safeCurrentPage + 1,
                                                        );
                                                    }}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminTryOuts.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Try Out',
            href: '/academics/try-outs',
        },
    ],
};
