import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ClipboardList,
    GraduationCap,
    Plus,
    PowerOff,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/admin/empty-state';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatDate, formatDateTime } from '@/lib/date-time';
import { CreateDialogProgramEnrollment } from '@/pages/admin/users/students/components/create-dialog-program-enrollment';
import { CreateDialogTryOutAccess } from '@/pages/admin/users/students/components/create-dialog-try-out-access';
import type { ProgramEnrollmentOption } from '@/pages/admin/users/students/components/program-enrollment-form';
import type { TryOutAccessOption } from '@/pages/admin/users/students/components/try-out-access-form';
type User = {
    createdAt: string | null;
    email: string;
    id: number;
    name: string;
    nickname: string | null;
    slug: string;
    status: string;
    updatedAt: string | null;
};

type Enrollment = {
    field: string | null;
    id: number;
    isMaxRescheduleOverwritten: boolean;
    lastSessionDate: string | null;
    maxReschedule: number | null;
    program: string | null;
    sessionsRemaining: number;
    startDate: string | null;
    status: string;
    variant: string | null;
};

type TryOutAccess = {
    attemptQuota: number;
    attemptsUsed: number;
    availableFrom: string;
    availableUntil: string;
    id: number;
    remainingAttempts: number;
    status: string;
    statusValue: string;
    tryOut: {
        slug: string;
        title: string;
    };
};

export default function StudentDetail({
    enrollments,
    programOptions,
    tryOutAccesses,
    tryOutOptions,
    user,
}: {
    enrollments: Enrollment[];
    programOptions: ProgramEnrollmentOption[];
    tryOutAccesses: TryOutAccess[];
    tryOutOptions: TryOutAccessOption[];
    user: User;
}) {
    const timezone = useUserTimezone();
    const page = usePage<{
        flash?: {
            success?: string;
        };
    }>();
    const shownSuccessToast = useRef<string | null>(null);
    const [programEnrollmentOpen, setProgramEnrollmentOpen] = useState(
        () =>
            new URLSearchParams(page.url.split('?')[1] ?? '').get('action') ===
            'enroll',
    );
    const [tryOutAccessOpen, setTryOutAccessOpen] = useState(false);

    useEffect(() => {
        if (page.props.flash?.success !== 'Student added.') {
            return;
        }

        if (shownSuccessToast.current === page.props.flash.success) {
            return;
        }

        shownSuccessToast.current = page.props.flash.success;
        toast.success(page.props.flash.success);
    }, [page.props.flash?.success]);

    return (
        <>
            <Head title={user.name} />
            <div className="flex h-full max-w-full min-w-0 flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {user.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Student account detail and access status.
                        </p>
                    </div>
                </div>

                <section className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Nickname
                            </p>
                            <p className="text-sm">{user.nickname ?? '-'}</p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Email
                            </p>
                            <p className="text-sm">{user.email}</p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <div>
                                <StatusBadge status={user.status} />
                            </div>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Created
                            </p>
                            <p className="text-sm">
                                {user.createdAt
                                    ? formatDateTime(user.createdAt, timezone)
                                    : '-'}
                            </p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Last updated
                            </p>
                            <p className="text-sm">
                                {user.updatedAt
                                    ? formatDateTime(user.updatedAt, timezone)
                                    : '-'}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-2">
                    <h2 className="text-md font-heading font-semibold">
                        Enrollments
                    </h2>
                    <Tabs defaultValue="programs" className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <TabsList className="grid h-10 w-full max-w-sm grid-cols-2">
                                <TabsTrigger value="programs">
                                    Programs
                                </TabsTrigger>
                                <TabsTrigger value="try-outs">
                                    Try Outs
                                </TabsTrigger>
                            </TabsList>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="ml-auto gap-2">
                                        <Plus className="size-4" />
                                        Add enrollment
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                >
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            setProgramEnrollmentOpen(true)
                                        }
                                    >
                                        <GraduationCap className="size-4" />
                                        Program
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            setTryOutAccessOpen(true)
                                        }
                                    >
                                        <ClipboardList className="size-4" />
                                        Try out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <CreateDialogProgramEnrollment
                                open={programEnrollmentOpen}
                                onOpenChange={setProgramEnrollmentOpen}
                                programOptions={programOptions}
                                studentSlug={user.slug}
                            />
                            <CreateDialogTryOutAccess
                                open={tryOutAccessOpen}
                                onOpenChange={setTryOutAccessOpen}
                                studentSlug={user.slug}
                                tryOutOptions={tryOutOptions}
                            />
                        </div>
                        <TabsContent value="programs">
                            {enrollments.length === 0 ? (
                                <EmptyState>
                                    No program enrollments yet.
                                </EmptyState>
                            ) : (
                                <TableScrollArea>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Program</TableHead>
                                                <TableHead>
                                                    Field / Variant
                                                </TableHead>
                                                <TableHead>Sessions</TableHead>
                                                <TableHead>
                                                    Start Date
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {enrollments.map((enrollment) => (
                                                <TableRow key={enrollment.id}>
                                                    <TableCell className="font-medium">
                                                        {enrollment.program ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p>
                                                                {enrollment.field ??
                                                                    '-'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {enrollment.variant ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p className="font-medium">
                                                                {
                                                                    enrollment.sessionsRemaining
                                                                }{' '}
                                                                left
                                                            </p>
                                                            {enrollment.sessionsRemaining ===
                                                                0 &&
                                                                enrollment.lastSessionDate && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Last
                                                                        session:{' '}
                                                                        {formatDate(
                                                                            enrollment.lastSessionDate,
                                                                            timezone,
                                                                        )}
                                                                    </p>
                                                                )}
                                                            {enrollment.maxReschedule !==
                                                                null && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Max
                                                                    reschedule:{' '}
                                                                    {
                                                                        enrollment.maxReschedule
                                                                    }
                                                                    {enrollment.isMaxRescheduleOverwritten
                                                                        ? ' overwrite'
                                                                        : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {enrollment.startDate ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            status={
                                                                enrollment.status
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableScrollArea>
                            )}
                        </TabsContent>
                        <TabsContent value="try-outs" className="mt-4">
                            {tryOutAccesses.length === 0 ? (
                                <EmptyState>
                                    No private try out access yet.
                                </EmptyState>
                            ) : (
                                <TableScrollArea>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Try out</TableHead>
                                                <TableHead>
                                                    Access Period
                                                </TableHead>
                                                <TableHead>Attempts</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tryOutAccesses.map((access) => (
                                                <TableRow key={access.id}>
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={`/academics/try-outs/${access.tryOut.slug}`}
                                                            className="hover:text-primary"
                                                        >
                                                            {
                                                                access.tryOut
                                                                    .title
                                                            }
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        {access.availableFrom} -{' '}
                                                        {access.availableUntil}
                                                    </TableCell>
                                                    <TableCell>
                                                        {access.attemptsUsed}/
                                                        {access.attemptQuota}
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            {
                                                                access.remainingAttempts
                                                            }{' '}
                                                            left
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            status={
                                                                access.status
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Form
                                                            action={`/users/students/${user.slug}/try-out-access/${access.id}`}
                                                            method="delete"
                                                            onSuccess={() =>
                                                                toast.success(
                                                                    'Try out access deactivated.',
                                                                )
                                                            }
                                                            onError={() =>
                                                                toast.error(
                                                                    'Unable to deactivate try out access.',
                                                                )
                                                            }
                                                        >
                                                            {({
                                                                processing,
                                                            }) => (
                                                                <Button
                                                                    type="submit"
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    disabled={
                                                                        processing
                                                                    }
                                                                    className="rounded-full text-muted-foreground hover:text-destructive"
                                                                >
                                                                    <PowerOff className="size-4" />
                                                                    <span className="sr-only">
                                                                        Deactivate
                                                                        access
                                                                    </span>
                                                                </Button>
                                                            )}
                                                        </Form>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableScrollArea>
                            )}
                        </TabsContent>
                    </Tabs>
                </section>
            </div>
        </>
    );
}
