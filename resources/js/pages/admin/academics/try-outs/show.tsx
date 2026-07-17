import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Copy, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import InputError from '@/components/input-error';
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

type TryOutDetail = {
    correctPoints: number | null;
    duration: string;
    groups: TryOutGroup[];
    id: string;
    leaderboard: {
        averageScore: number | null;
        highestScore: number | null;
        participantsCount: number;
        preview: LeaderboardPreview[];
        totalAttempts: number;
    };
    questionsCount: number;
    readiness: TryOutReadiness;
    recentAttempts: RecentAttempt[];
    scoringMode: 'raw_score' | 'negative_marking';
    slug: string;
    status: string;
    subjects: string[];
    title: string;
    unansweredPoints: number | null;
    wrongPoints: number | null;
};

type TryOutGroup = {
    attemptQuota: number;
    availableFrom: string;
    availableUntil: string;
    id: string;
    maxParticipants: number | null;
    name: string;
    redeemedCount: number;
    status: string;
    statusValue: 'active' | 'inactive';
    token: string;
};

type TryOutReadiness = {
    items: {
        key: string;
        label: string;
        ready: boolean;
    }[];
    readyCount: number;
    totalCount: number;
};

type RecentAttempt = {
    correctCount: number;
    id: string;
    maxScore: number;
    percentageScore: number;
    questionCount: number;
    score: number;
    student: {
        email: string;
        name: string;
    };
    submittedAt: string | null;
};

type LeaderboardPreview = {
    correctCount: number;
    id: string;
    questionCount: number;
    rank: number;
    score: number;
    maxScore: number;
    percentageScore: number;
    student: {
        email: string;
        name: string;
    };
    submittedAt: string | null;
};

export default function AdminTryOutDetail({
    tryOut,
}: {
    tryOut: TryOutDetail;
}) {
    const page = usePage<{
        flash?: {
            success?: string;
        };
    }>();
    const [groupDialogOpen, setGroupDialogOpen] = useState(false);

    useEffect(() => {
        if (!page.props.flash?.success) {
            return;
        }

        toast.success(page.props.flash.success);
    }, [page.props.flash?.success]);

    return (
        <>
            <Head title={tryOut.title} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-2xl font-semibold">
                                {tryOut.title}
                            </h1>
                            <Badge
                                {...getBadgeProps(
                                    getStatusBadgeTone(tryOut.status),
                                )}
                            >
                                {formatBadgeLabel(tryOut.status)}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try out detail, subjects, questions, and answers.
                        </p>
                    </div>
                    {tryOut.status === 'Private' && (
                        <Dialog
                            open={groupDialogOpen}
                            onOpenChange={setGroupDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="size-4" />
                                    Add group
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add try out group</DialogTitle>
                                    <DialogDescription>
                                        Create a redeem token for this private
                                        try out.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    action={`/academics/try-outs/${tryOut.slug}/groups`}
                                    method="post"
                                    resetOnSuccess
                                    onSuccess={() => {
                                        setGroupDialogOpen(false);
                                    }}
                                    onError={() => {
                                        toast.error(
                                            'Please check the group form.',
                                        );
                                    }}
                                    className="space-y-4"
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="group-name">
                                                    Group name
                                                </Label>
                                                <Input
                                                    id="group-name"
                                                    name="name"
                                                    placeholder="Try Out Batch Juli"
                                                    aria-invalid={!!errors.name}
                                                />
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="group-available-from">
                                                        Start date
                                                    </Label>
                                                    <Input
                                                        id="group-available-from"
                                                        name="available_from"
                                                        type="date"
                                                        aria-invalid={
                                                            !!errors.available_from
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.available_from
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="group-available-until">
                                                        End date
                                                    </Label>
                                                    <Input
                                                        id="group-available-until"
                                                        name="available_until"
                                                        type="date"
                                                        aria-invalid={
                                                            !!errors.available_until
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.available_until
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="group-attempt-quota">
                                                        Attempt quota
                                                    </Label>
                                                    <Input
                                                        id="group-attempt-quota"
                                                        name="attempt_quota"
                                                        type="number"
                                                        min="1"
                                                        defaultValue="1"
                                                        aria-invalid={
                                                            !!errors.attempt_quota
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.attempt_quota
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="group-max-participants">
                                                        Max participants
                                                    </Label>
                                                    <Input
                                                        id="group-max-participants"
                                                        name="max_participants"
                                                        type="number"
                                                        min="1"
                                                        placeholder="Unlimited"
                                                        aria-invalid={
                                                            !!errors.max_participants
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.max_participants
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="group-status">
                                                        Status
                                                    </Label>
                                                    <Select
                                                        name="status"
                                                        defaultValue="active"
                                                    >
                                                        <SelectTrigger
                                                            id="group-status"
                                                            className="w-full"
                                                            aria-invalid={
                                                                !!errors.status
                                                            }
                                                        >
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">
                                                                Active
                                                            </SelectItem>
                                                            <SelectItem value="inactive">
                                                                Inactive
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={errors.status}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={processing}
                                                    onClick={() =>
                                                        setGroupDialogOpen(
                                                            false,
                                                        )
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Save group
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="relative flex min-h-36 flex-col justify-between px-6">
                            <div className="flex items-start justify-between gap-4">
                                <p className="min-w-0 truncate text-sm text-muted-foreground">
                                    Duration
                                </p>
                            </div>

                            <div>
                                <div className="flex items-end gap-2">
                                    <p className="text-5xl font-semibold tracking-normal">
                                        {tryOut.duration}
                                    </p>
                                    <p className="mb-1.5 flex max-w-full items-center gap-1 text-xs text-muted-foreground">
                                        <span className="truncate">
                                            minutes
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Link
                        href={`/academics/try-outs/${tryOut.slug}/questions`}
                        className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <Card className="transition-colors hover:border-primary/40 hover:bg-muted/35">
                            <CardContent className="relative flex min-h-36 flex-col justify-between px-6">
                                <div className="flex items-start justify-between gap-4">
                                    <p className="min-w-0 truncate text-sm text-muted-foreground">
                                        Questions
                                    </p>
                                    <Button
                                        asChild
                                        variant="secondary"
                                        size="icon"
                                        className="-mt-1 size-8 shrink-0 rounded-full"
                                    >
                                        <span>
                                            <ArrowUpRight className="size-3.5" />
                                        </span>
                                    </Button>
                                </div>

                                <div>
                                    <div className="flex items-end gap-2">
                                        <p className="text-5xl font-semibold tracking-normal">
                                            {tryOut.questionsCount}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Card>
                        <CardContent className="relative flex min-h-36 flex-col justify-between px-6">
                            <div className="flex items-start justify-between gap-4">
                                <p className="min-w-0 truncate text-sm text-muted-foreground">
                                    Subjects
                                </p>
                            </div>

                            <div>
                                <div className="flex items-end gap-2">
                                    <p className="text-5xl font-semibold tracking-normal">
                                        {tryOut.subjects.length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Link
                        href={`/academics/try-outs/${tryOut.slug}/leaderboard`}
                        className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <Card className="transition-colors hover:border-primary/40 hover:bg-muted/35">
                            <CardContent className="relative flex min-h-36 flex-col justify-between px-6">
                                <div className="flex items-start justify-between gap-4">
                                    <p className="min-w-0 truncate text-sm text-muted-foreground">
                                        Leaderboard
                                    </p>
                                    <Button
                                        asChild
                                        variant="secondary"
                                        size="icon"
                                        className="-mt-1 size-8 shrink-0 rounded-full"
                                    >
                                        <span>
                                            <ArrowUpRight className="size-3.5" />
                                        </span>
                                    </Button>
                                </div>

                                <div>
                                    <div className="flex items-end gap-2">
                                        <p className="text-5xl font-semibold tracking-normal">
                                            {
                                                tryOut.leaderboard
                                                    .participantsCount
                                            }
                                        </p>
                                        <p className="mb-1.5 flex max-w-full items-center gap-1 text-xs text-muted-foreground">
                                            <span className="truncate">
                                                {tryOut.leaderboard
                                                    .participantsCount === 1
                                                    ? 'participant'
                                                    : 'participants'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {tryOut.status === 'Private' && (
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Groups</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {tryOut.groups.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No groups yet.
                                </div>
                            ) : (
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Group</TableHead>
                                                <TableHead>Token</TableHead>
                                                <TableHead>
                                                    Availability
                                                </TableHead>
                                                <TableHead>Attempts</TableHead>
                                                <TableHead>
                                                    Participants
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-20 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tryOut.groups.map((group) => (
                                                <TableRow key={group.id}>
                                                    <TableCell className="font-medium">
                                                        {group.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-primary"
                                                            onClick={() => {
                                                                void navigator.clipboard?.writeText(
                                                                    group.token,
                                                                );
                                                                toast.success(
                                                                    'Token copied.',
                                                                );
                                                            }}
                                                        >
                                                            {group.token}
                                                            <Copy className="size-3.5" />
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.availableFrom} -{' '}
                                                        {group.availableUntil}
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.attemptQuota}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Users className="size-4 text-muted-foreground" />
                                                            {
                                                                group.redeemedCount
                                                            }
                                                            /
                                                            {group.maxParticipants ??
                                                                '∞'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                group.statusValue ===
                                                                    'active'
                                                                    ? 'success'
                                                                    : 'outline',
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                group.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {group.statusValue ===
                                                            'active' && (
                                                            <Form
                                                                action={`/academics/try-outs/${tryOut.slug}/groups/${group.id}/deactivate`}
                                                                method="put"
                                                                onError={() => {
                                                                    toast.error(
                                                                        'Unable to deactivate group.',
                                                                    );
                                                                }}
                                                            >
                                                                {({
                                                                    processing,
                                                                }) => (
                                                                    <Button
                                                                        type="submit"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={
                                                                            processing
                                                                        }
                                                                    >
                                                                        Deactivate
                                                                    </Button>
                                                                )}
                                                            </Form>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {tryOut.status === 'Public' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Attempts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tryOut.recentAttempts.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No attempts yet.
                                </div>
                            ) : (
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Score</TableHead>
                                                <TableHead>Correct</TableHead>
                                                <TableHead>
                                                    Submitted at
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tryOut.recentAttempts.map(
                                                (attempt) => (
                                                    <TableRow key={attempt.id}>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {
                                                                    attempt
                                                                        .student
                                                                        .name
                                                                }
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {
                                                                    attempt
                                                                        .student
                                                                        .email
                                                                }
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {attempt.score} /{' '}
                                                            {attempt.maxScore}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                attempt.correctCount
                                                            }
                                                            /
                                                            {
                                                                attempt.questionCount
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {attempt.submittedAt ??
                                                                '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {tryOut.status === 'Draft' && (
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <CardTitle>Publish Checklist</CardTitle>
                                <Badge variant="outline">
                                    {tryOut.readiness.readyCount}/
                                    {tryOut.readiness.totalCount} Ready
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {tryOut.readiness.items.map((item) => (
                                    <div
                                        key={item.key}
                                        className="flex items-center justify-between gap-3 rounded-lg border p-4"
                                    >
                                        <span className="text-sm font-medium">
                                            {item.label}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={
                                                item.ready
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-200 bg-amber-50 text-amber-700'
                                            }
                                        >
                                            {item.ready
                                                ? 'Ready'
                                                : 'Needs Work'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

AdminTryOutDetail.layout = {
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
