import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarClock, Mail, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type UserDetail = {
    createdAt: string | null;
    email: string;
    id: number;
    name: string;
    nickname: string | null;
    slug: string;
    status: string;
    updatedAt: string | null;
};

type UserDetailPageProps = {
    backHref: string;
    description: string;
    children?: ReactNode;
    title: string;
    user: UserDetail;
};

export function UserDetailPage({
    backHref,
    children,
    description,
    title,
    user,
}: UserDetailPageProps) {
    return (
        <>
            <Head title={user.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Button asChild variant="ghost" className="-ml-3 mb-2 gap-2">
                            <Link href={backHref}>
                                <ArrowLeft className="size-4" />
                                Back
                            </Link>
                        </Button>
                        <h1 className="font-heading text-2xl font-semibold">
                            {user.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <UserRound className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Nickname
                                </p>
                                <p className="font-medium">
                                    {user.nickname ?? '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Mail className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Email
                                </p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CalendarClock className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Joined
                                </p>
                                <p className="font-medium">
                                    {user.createdAt ?? '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{title} information</CardTitle>
                        <CardDescription>
                            Account identity and access status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Name
                            </p>
                            <p className="font-medium">{user.name}</p>
                        </div>
                        <Separator />
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Nickname
                            </p>
                            <p className="font-medium">
                                {user.nickname ?? '-'}
                            </p>
                        </div>
                        <Separator />
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Email
                            </p>
                            <p className="font-medium">{user.email}</p>
                        </div>
                        <Separator />
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <div>
                                <Badge>{user.status}</Badge>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Last updated
                            </p>
                            <p className="font-medium">
                                {user.updatedAt ?? '-'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                {children}
            </div>
        </>
    );
}
