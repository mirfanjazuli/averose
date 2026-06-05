import { Head } from '@inertiajs/react';
import { CalendarClock, KeyRound, Pencil, Video } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/password-input';
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
import { Separator } from '@/components/ui/separator';
import { ZoomAccountForm } from '@/components/zoom-account-form';

type ZoomAccount = {
    id: number;
    name: string;
    slug: string;
    accountId: string;
    clientId: string;
    clientSecret: string;
    tokenSecret: string;
    createdAt: string | null;
    updatedAt: string | null;
};

export default function ZoomAccountDetail({
    account,
}: {
    account: ZoomAccount;
}) {
    const [editAccountDialogOpen, setEditAccountDialogOpen] = useState(false);

    return (
        <>
            <Head title={account.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {account.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Zoom account detail and credential status.
                        </p>
                    </div>
                    <Dialog
                        open={editAccountDialogOpen}
                        onOpenChange={setEditAccountDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Pencil className="size-4" />
                                Edit account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Zoom account</DialogTitle>
                                <DialogDescription>
                                    Update account details or rotate
                                    credentials.
                                </DialogDescription>
                            </DialogHeader>
                            <ZoomAccountForm
                                account={account}
                                key={account.slug}
                                action={`/zoom-accounts/${account.slug}?redirect=detail`}
                                idPrefix="detail-zoom"
                                method="put"
                                onSuccess={() => {
                                    setEditAccountDialogOpen(false);
                                    toast.success('Zoom account updated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the Zoom account form.',
                                    );
                                }}
                                submitLabel="Save changes"
                            />
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
                                    Account ID
                                </p>
                                <p className="font-medium">
                                    {account.accountId}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <KeyRound className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Client ID
                                </p>
                                <p className="font-medium">
                                    {account.clientId}
                                </p>
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
                                    Updated
                                </p>
                                <p className="font-medium">
                                    {account.updatedAt ?? '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Account information</CardTitle>
                        <CardDescription>
                            Credentials are stored securely and hidden from this
                            screen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Name
                            </p>
                            <p className="font-medium">{account.name}</p>
                        </div>
                        <Separator />
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Account ID
                            </p>
                            <p className="font-medium">{account.accountId}</p>
                        </div>
                        <Separator />
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Client ID
                            </p>
                            <p className="font-medium">{account.clientId}</p>
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <p className="text-sm text-muted-foreground">
                                Client Secret
                            </p>
                            <PasswordInput
                                value={account.clientSecret}
                                readOnly
                                className="font-mono"
                            />
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <p className="text-sm text-muted-foreground">
                                Token Secret
                            </p>
                            <PasswordInput
                                value={account.tokenSecret}
                                readOnly
                                className="font-mono"
                            />
                        </div>
                        <Separator />
                        <div className="grid gap-1">
                            <p className="text-sm text-muted-foreground">
                                Created
                            </p>
                            <p className="font-medium">
                                {account.createdAt ?? '-'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ZoomAccountDetail.layout = {
    breadcrumbs: [
        {
            title: 'Zoom Accounts',
            href: '/zoom-accounts',
        },
    ],
};
