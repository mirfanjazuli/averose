import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    CheckCircle2,
    Clock3,
    Download,
    Eye,
    Pencil,
    Plus,
    SendToBack,
    UploadCloud,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import { EmptyState } from '@/components/admin/empty-state';
import { SummaryCard } from '@/components/admin/summary-card';
import { TablePagination } from '@/components/admin/table-pagination';
import { TableSearch } from '@/components/admin/table-search';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { useClientPagination } from '@/hooks/use-client-pagination';
import { TryOutImportDialog } from '@/pages/admin/academics/try-outs/components/try-out-import-dialog';

type TryOut = {
    correctPoints: number | null;
    duration: string;
    durationMinutes: number | null;
    id: string;
    questions: number;
    scoringMode: 'raw_score' | 'negative_marking';
    slug: string;
    status: string;
    statusValue: 'draft' | 'public' | 'private';
    subjects: string[];
    title: string;
    unansweredPoints: number | null;
    wrongPoints: number | null;
};

type StatusAction = {
    status: 'draft' | 'public';
    tryOut: TryOut;
};

export default function AdminTryOuts({ tryOuts }: { tryOuts: TryOut[] }) {
    const page = usePage<{
        flash?: {
            success?: string;
        };
    }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
    const [editingTryOut, setEditingTryOut] = useState<TryOut | null>(null);
    const [editStatus, setEditStatus] =
        useState<TryOut['statusValue']>('draft');
    const [editScoringMode, setEditScoringMode] =
        useState<TryOut['scoringMode']>('raw_score');
    const [importOpen, setImportOpen] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('import') === '1',
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
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleTryOuts,
    } = useClientPagination({ items: filteredTryOuts });

    const publicCount = tryOuts.filter(
        (tryOut) => tryOut.statusValue === 'public',
    ).length;

    useEffect(() => {
        if (!page.props.flash?.success) {
            return;
        }

        toast.success(page.props.flash.success);
    }, [page.props.flash?.success]);

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
                        <TryOutImportDialog
                            open={importOpen}
                            onOpenChange={setImportOpen}
                            trigger={
                                <Button className="gap-2">
                                    <Plus className="size-4" />
                                    Add try out
                                </Button>
                            }
                        />
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
                                Update try out information and access status.
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
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-status">
                                                Status
                                            </Label>
                                            <Select
                                                name="status"
                                                value={editStatus}
                                                onValueChange={(value) =>
                                                    setEditStatus(
                                                        value as TryOut['statusValue'],
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id="edit-status"
                                                    className="w-full"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="p-1">
                                                    <SelectItem
                                                        value="draft"
                                                        className="my-1"
                                                    >
                                                        Draft
                                                    </SelectItem>
                                                    <SelectItem
                                                        value="public"
                                                        className="my-1"
                                                    >
                                                        Public
                                                    </SelectItem>
                                                    <SelectItem
                                                        value="private"
                                                        className="my-1"
                                                    >
                                                        Private
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.status}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-scoring-mode">
                                                Scoring
                                            </Label>
                                            <Select
                                                name="scoring_mode"
                                                value={editScoringMode}
                                                onValueChange={(value) =>
                                                    setEditScoringMode(
                                                        value as TryOut['scoringMode'],
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id="edit-scoring-mode"
                                                    className="w-full"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="p-1">
                                                    <SelectItem
                                                        value="raw_score"
                                                        className="my-1"
                                                    >
                                                        Raw score
                                                    </SelectItem>
                                                    <SelectItem
                                                        value="negative_marking"
                                                        className="my-1"
                                                    >
                                                        Negative marking
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.scoring_mode}
                                            />
                                        </div>
                                        {editScoringMode ===
                                            'negative_marking' && (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-correct-points">
                                                        Correct
                                                    </Label>
                                                    <Input
                                                        id="edit-correct-points"
                                                        name="correct_points"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={
                                                            editingTryOut.correctPoints ??
                                                            4
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.correct_points
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-wrong-points">
                                                        Wrong
                                                    </Label>
                                                    <Input
                                                        id="edit-wrong-points"
                                                        name="wrong_points"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={
                                                            editingTryOut.wrongPoints ??
                                                            -1
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.wrong_points
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-unanswered-points">
                                                        No answer
                                                    </Label>
                                                    <Input
                                                        id="edit-unanswered-points"
                                                        name="unanswered_points"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={
                                                            editingTryOut.unansweredPoints ??
                                                            0
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.unanswered_points
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
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
                                {statusAction?.status === 'public'
                                    ? 'Publish try out?'
                                    : 'Unpublish try out?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {statusAction?.status === 'public'
                                    ? `${statusAction.tryOut.title} will be visible and available for students.`
                                    : `${statusAction?.tryOut.title} will be moved back to draft and hidden from students.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {statusAction && (
                            <Form
                                action={`/academics/try-outs/${statusAction.tryOut.slug}/${statusAction.status === 'public' ? 'publish' : 'unpublish'}`}
                                method="put"
                                onSuccess={() => {
                                    setStatusAction(null);
                                }}
                                onError={() => {
                                    toast.error(
                                        statusAction.status === 'public'
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
                                            {statusAction.status === 'public'
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
                    <SummaryCard
                        icon={BookOpenCheck}
                        label="Total try outs"
                        value={tryOuts.length}
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        label="Public"
                        value={publicCount}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Try out list</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search try outs..."
                        />
                    </CardHeader>
                    <CardContent>
                        {tryOuts.length === 0 ? (
                            <EmptyState>No try outs imported yet.</EmptyState>
                        ) : filteredTryOuts.length === 0 ? (
                            <EmptyState>
                                No try outs match your search.
                            </EmptyState>
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
                                                            {...getBadgeProps(
                                                                getStatusBadgeTone(
                                                                    tryOut.status,
                                                                ),
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                tryOut.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu label="Open try out actions">
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
                                                                onClick={() => {
                                                                    setEditStatus(
                                                                        tryOut.statusValue,
                                                                    );
                                                                    setEditScoringMode(
                                                                        tryOut.scoringMode,
                                                                    );
                                                                    setEditingTryOut(
                                                                        tryOut,
                                                                    );
                                                                }}
                                                            >
                                                                <Pencil className="size-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {tryOut.statusValue !==
                                                            'draft' ? (
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
                                                                                status: 'public',
                                                                                tryOut,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <UploadCloud className="size-4" />
                                                                    Publish
                                                                </DropdownMenuItem>
                                                            )}
                                                        </ActionMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <TablePagination
                                    entity="try outs"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredTryOuts.length}
                                    totalPages={totalPages}
                                />
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
