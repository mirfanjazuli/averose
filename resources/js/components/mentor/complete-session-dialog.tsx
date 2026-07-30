import { useForm } from '@inertiajs/react';
import { FileImage, FileText, Paperclip, X } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

import { formatFileSize } from '@/components/journal-attachment-list';
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
} from '@/components/ui/attachment';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type CompletionSession = {
    id: string;
    improvementPlan?: string;
    student: string;
};

type CompleteSessionDialogProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    session: CompletionSession;
};

const allowedAttachmentTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
];

export function CompleteSessionDialog({
    onOpenChange,
    open,
    session,
}: CompleteSessionDialogProps) {
    const attachmentInput = useRef<HTMLInputElement>(null);
    const form = useForm({
        achievement: '',
        attachments: [] as File[],
        improvement_area: '',
        next_improvement_plan: session.improvementPlan ?? '',
    });
    const attachmentError =
        form.errors.attachments ??
        Object.entries(form.errors).find(([key]) =>
            key.startsWith('attachments.'),
        )?.[1];

    const addAttachments = (files: FileList | null) => {
        if (!files) {
            return;
        }

        const selectedFiles = Array.from(files);
        const nextFiles = [...form.data.attachments, ...selectedFiles];

        if (nextFiles.length > 5) {
            form.setError('attachments', 'You can upload up to 5 files.');

            return;
        }

        if (
            selectedFiles.some(
                (file) => !allowedAttachmentTypes.includes(file.type),
            )
        ) {
            form.setError(
                'attachments',
                'Only PDF, JPG, PNG, and WebP files are supported.',
            );

            return;
        }

        if (selectedFiles.some((file) => file.size > 10 * 1024 * 1024)) {
            form.setError(
                'attachments',
                'Each attachment must not exceed 10 MB.',
            );

            return;
        }

        form.clearErrors('attachments');
        form.setData('attachments', nextFiles);

        if (attachmentInput.current) {
            attachmentInput.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        form.setData(
            'attachments',
            form.data.attachments.filter((_, fileIndex) => fileIndex !== index),
        );
        form.clearErrors('attachments');
    };

    const saveCompletion = () => {
        form.post(`/mentor/sessions/${session.id}/complete`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();

                if (attachmentInput.current) {
                    attachmentInput.current.value = '';
                }

                toast.success('Session journal completed.');
            },
            onError: () => {
                toast.error('Please complete the session journal form.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="scrollbar-stable max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Complete session</DialogTitle>
                    <DialogDescription>
                        Record the teaching journal for {session.student}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="achievement">Achievement</Label>
                        <Textarea
                            id="achievement"
                            value={form.data.achievement}
                            onChange={(event) =>
                                form.setData('achievement', event.target.value)
                            }
                            placeholder="What did the student achieve in this session?"
                            className="min-h-28"
                        />
                        {form.errors.achievement && (
                            <p className="text-sm text-destructive">
                                {form.errors.achievement}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="improvement-area">
                            Area to improve
                        </Label>
                        <Textarea
                            id="improvement-area"
                            value={form.data.improvement_area}
                            onChange={(event) =>
                                form.setData(
                                    'improvement_area',
                                    event.target.value,
                                )
                            }
                            placeholder="What should the student improve?"
                            className="min-h-28"
                        />
                        {form.errors.improvement_area && (
                            <p className="text-sm text-destructive">
                                {form.errors.improvement_area}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="next-improvement-plan">
                            Next focus
                        </Label>
                        <Textarea
                            id="next-improvement-plan"
                            value={form.data.next_improvement_plan}
                            onChange={(event) =>
                                form.setData(
                                    'next_improvement_plan',
                                    event.target.value,
                                )
                            }
                            placeholder="Plan for the next meeting."
                            className="min-h-28"
                        />
                        {form.errors.next_improvement_plan && (
                            <p className="text-sm text-destructive">
                                {form.errors.next_improvement_plan}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <Label>Attachments</Label>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    PDF or image, maximum 5 files and 10 MB
                                    each.
                                </p>
                            </div>
                            <input
                                ref={attachmentInput}
                                type="file"
                                multiple
                                accept="application/pdf,image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(event) =>
                                    addAttachments(event.target.files)
                                }
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={form.data.attachments.length >= 5}
                                onClick={() => attachmentInput.current?.click()}
                            >
                                <Paperclip className="size-4" />
                                Add files
                            </Button>
                        </div>

                        {form.data.attachments.length > 0 && (
                            <div className="grid gap-2">
                                {form.data.attachments.map((file, index) => {
                                    const Icon = file.type.startsWith('image/')
                                        ? FileImage
                                        : FileText;
                                    const fileType = file.type
                                        .split('/')
                                        .at(-1)
                                        ?.replace('jpeg', 'jpg')
                                        .toUpperCase();

                                    return (
                                        <Attachment
                                            key={`${file.name}-${file.size}-${file.lastModified}`}
                                            state="idle"
                                            size="sm"
                                            className="w-full flex-nowrap rounded-lg"
                                        >
                                            <AttachmentMedia>
                                                <Icon className="text-primary" />
                                            </AttachmentMedia>
                                            <AttachmentContent>
                                                <AttachmentTitle>
                                                    {file.name}
                                                </AttachmentTitle>
                                                <AttachmentDescription>
                                                    {fileType} ·{' '}
                                                    {formatFileSize(file.size)}{' '}
                                                    · Ready to upload
                                                </AttachmentDescription>
                                            </AttachmentContent>
                                            <AttachmentActions>
                                                <AttachmentAction
                                                    type="button"
                                                    aria-label={`Remove ${file.name}`}
                                                    onClick={() =>
                                                        removeAttachment(index)
                                                    }
                                                >
                                                    <X />
                                                </AttachmentAction>
                                            </AttachmentActions>
                                        </Attachment>
                                    );
                                })}
                            </div>
                        )}

                        {attachmentError && (
                            <p className="text-sm text-destructive">
                                {attachmentError}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={form.processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={saveCompletion}
                        disabled={form.processing}
                    >
                        Save journal
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
