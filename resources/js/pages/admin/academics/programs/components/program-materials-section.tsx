import { router, useForm, usePage } from '@inertiajs/react';
import {
    ExternalLink,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileType,
    Pencil,
    Plus,
    Power,
    PowerOff,
    UploadCloud,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import { EmptyState } from '@/components/admin/empty-state';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/date-time';
import { cn } from '@/lib/utils';

export type ProgramMaterial = {
    description: string | null;
    mimeType: string;
    name: string;
    size: number;
    status: string;
    title: string;
    uploadedAt: string;
    url: string;
    uuid: string;
};

const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
];

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileType(mimeType: string): string {
    const types: Record<string, string> = {
        'application/pdf': 'PDF',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            'PPTX',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            'XLSX',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            'DOCX',
        'image/jpeg': 'JPG',
        'image/png': 'PNG',
        'image/webp': 'WEBP',
    };

    return types[mimeType] ?? 'FILE';
}

function isPreviewable(mimeType: string): boolean {
    return mimeType === 'application/pdf' || mimeType.startsWith('image/');
}

function FileIcon({ mimeType }: { mimeType: string }) {
    if (mimeType.startsWith('image/')) {
        return <FileImage className="text-primary" />;
    }

    if (mimeType.includes('spreadsheet')) {
        return <FileSpreadsheet className="text-primary" />;
    }

    if (mimeType.includes('presentation')) {
        return <FileType className="text-primary" />;
    }

    return <FileText className="text-primary" />;
}

export function ProgramMaterialsSection({
    canManage,
    materials,
    programSlug,
}: {
    canManage: boolean;
    materials: ProgramMaterial[];
    programSlug: string;
}) {
    const timezone = usePage<{ auth: { user: { timezone: string } } }>().props
        .auth.user.timezone;
    const inputRef = useRef<HTMLInputElement>(null);
    const previewUrls = useRef<Map<File, string>>(new Map());
    const [uploadOpen, setUploadOpen] = useState(false);
    const [isDraggingFiles, setIsDraggingFiles] = useState(false);
    const [editing, setEditing] = useState<ProgramMaterial | null>(null);
    const [changingStatus, setChangingStatus] =
        useState<ProgramMaterial | null>(null);
    const uploadForm = useForm<{ materials: File[] }>({ materials: [] });
    const editForm = useForm({ description: '', title: '' });
    const hasReachedFileLimit = uploadForm.data.materials.length >= 10;

    useEffect(() => {
        const urls = previewUrls.current;

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);

    function addFiles(files: FileList | File[] | null) {
        const selected = Array.from(files ?? []);
        const next = [...uploadForm.data.materials, ...selected];

        if (next.length > 10) {
            uploadForm.setError('materials', 'Maximum 10 files per upload.');

            return;
        }

        if (next.some((file) => !allowedTypes.includes(file.type))) {
            uploadForm.setError(
                'materials',
                'One or more file formats are not supported.',
            );

            return;
        }

        if (next.some((file) => file.size > 25 * 1024 * 1024)) {
            uploadForm.setError(
                'materials',
                'Each file must not exceed 25 MB.',
            );

            return;
        }

        uploadForm.clearErrors();
        uploadForm.setData('materials', next);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }

    function closeUpload() {
        setUploadOpen(false);
        setIsDraggingFiles(false);
        uploadForm.reset();
        uploadForm.clearErrors();
    }

    function previewFile(file: File) {
        if (!isPreviewable(file.type)) {
            return;
        }

        let url = previewUrls.current.get(file);

        if (!url) {
            url = URL.createObjectURL(file);
            previewUrls.current.set(file, url);
        }

        window.open(url, '_blank', 'noopener,noreferrer');
    }

    function submitUpload() {
        uploadForm.post(`/academics/programs/${programSlug}/materials`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                closeUpload();
                toast.success('Program materials added.');
            },
            onError: () => toast.error('Unable to upload program materials.'),
        });
    }

    function openEdit(material: ProgramMaterial) {
        editForm.setData({
            description: material.description ?? '',
            title: material.title,
        });
        editForm.clearErrors();
        setEditing(material);
    }

    function submitEdit() {
        if (!editing) {
            return;
        }

        editForm.put(
            `/academics/programs/${programSlug}/materials/${editing.uuid}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditing(null);
                    toast.success('Material updated.');
                },
                onError: () => toast.error('Unable to update material.'),
            },
        );
    }

    function updateStatus() {
        if (!changingStatus) {
            return;
        }

        const nextStatus =
            changingStatus.status === 'active' ? 'inactive' : 'active';

        router.put(
            `/academics/programs/${programSlug}/materials/${changingStatus.uuid}/status`,
            { status: nextStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setChangingStatus(null);
                    toast.success(
                        nextStatus === 'active'
                            ? 'Material activated.'
                            : 'Material deactivated.',
                    );
                },
                onError: () => toast.error('Unable to update material status.'),
            },
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold">
                    Materials
                </h2>
                {canManage && (
                    <Button
                        type="button"
                        className="gap-2"
                        onClick={() => setUploadOpen(true)}
                    >
                        <Plus className="size-4" />
                        Add materials
                    </Button>
                )}
            </div>

            {materials.length === 0 ? (
                <EmptyState>No program materials yet.</EmptyState>
            ) : (
                <TableScrollArea minWidth="760px">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Uploaded at</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12">
                                    <span className="sr-only">Action</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((material) => (
                                <TableRow key={material.uuid}>
                                    <TableCell>
                                        <p className="font-medium">
                                            {material.title}
                                        </p>
                                        <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                                            {material.name}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        {fileType(material.mimeType)}
                                    </TableCell>
                                    <TableCell>
                                        {formatFileSize(material.size)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(
                                            material.uploadedAt,
                                            timezone,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={material.status} />
                                    </TableCell>
                                    <TableCell>
                                        <ActionMenu
                                            label={`Actions for ${material.title}`}
                                        >
                                            <DropdownMenuItem asChild>
                                                <a
                                                    href={material.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <ExternalLink /> Open
                                                </a>
                                            </DropdownMenuItem>
                                            {canManage && (
                                                <>
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            openEdit(material)
                                                        }
                                                    >
                                                        <Pencil /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className={
                                                            material.status ===
                                                            'active'
                                                                ? 'text-destructive focus:text-destructive'
                                                                : undefined
                                                        }
                                                        onSelect={() =>
                                                            setChangingStatus(
                                                                material,
                                                            )
                                                        }
                                                    >
                                                        {material.status ===
                                                        'active' ? (
                                                            <PowerOff />
                                                        ) : (
                                                            <Power />
                                                        )}
                                                        {material.status ===
                                                        'active'
                                                            ? 'Deactivate'
                                                            : 'Activate'}
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </ActionMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableScrollArea>
            )}

            <Dialog
                open={uploadOpen}
                onOpenChange={(open) => !open && closeUpload()}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add materials</DialogTitle>
                        <DialogDescription>
                            Upload up to 10 learning files for this program.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            className="hidden"
                            accept=".pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.webp"
                            onChange={(event) => addFiles(event.target.files)}
                        />
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Upload program materials"
                            aria-disabled={hasReachedFileLimit}
                            className={cn(
                                'flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                isDraggingFiles
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-muted/20 hover:border-primary/60 hover:bg-muted/40',
                                hasReachedFileLimit &&
                                    'cursor-not-allowed opacity-60',
                            )}
                            onClick={() => {
                                if (!hasReachedFileLimit) {
                                    inputRef.current?.click();
                                }
                            }}
                            onKeyDown={(event) => {
                                if (
                                    !hasReachedFileLimit &&
                                    (event.key === 'Enter' ||
                                        event.key === ' ')
                                ) {
                                    event.preventDefault();
                                    inputRef.current?.click();
                                }
                            }}
                            onDragEnter={(event) => {
                                event.preventDefault();

                                if (!hasReachedFileLimit) {
                                    setIsDraggingFiles(true);
                                }
                            }}
                            onDragOver={(event) => {
                                event.preventDefault();
                                event.dataTransfer.dropEffect = 'copy';
                            }}
                            onDragLeave={(event) => {
                                if (
                                    !event.currentTarget.contains(
                                        event.relatedTarget as Node | null,
                                    )
                                ) {
                                    setIsDraggingFiles(false);
                                }
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                setIsDraggingFiles(false);

                                if (!hasReachedFileLimit) {
                                    addFiles(event.dataTransfer.files);
                                }
                            }}
                        >
                            <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UploadCloud className="size-5" />
                            </span>
                            <p className="text-sm font-medium">
                                Drop files here or click to browse
                            </p>
                            <p className="mt-1.5 max-w-md text-xs leading-5 text-muted-foreground">
                                PDF, DOCX, PPTX, XLSX, JPG, PNG, or WebP. Up to
                                10 files, 25 MB each.
                            </p>
                        </div>
                        {uploadForm.data.materials.map((file, index) => (
                            <Attachment
                                key={`${file.name}-${file.size}-${file.lastModified}`}
                                state="idle"
                                size="sm"
                                role={
                                    isPreviewable(file.type)
                                        ? 'button'
                                        : undefined
                                }
                                tabIndex={
                                    isPreviewable(file.type) ? 0 : undefined
                                }
                                aria-label={
                                    isPreviewable(file.type)
                                        ? `Preview ${file.name}`
                                        : undefined
                                }
                                className={cn(
                                    'w-full flex-nowrap rounded-lg border-border outline-none active:border-border focus:border-border focus:outline-none focus-within:border-border focus-within:ring-0 focus-visible:border-border focus-visible:outline-none',
                                    isPreviewable(file.type) &&
                                        'cursor-pointer hover:border-border hover:bg-muted/50',
                                )}
                                onClick={() => previewFile(file)}
                                onKeyDown={(event) => {
                                    if (
                                        event.target === event.currentTarget &&
                                        isPreviewable(file.type) &&
                                        (event.key === 'Enter' ||
                                            event.key === ' ')
                                    ) {
                                        event.preventDefault();
                                        previewFile(file);
                                    }
                                }}
                            >
                                <AttachmentMedia>
                                    <FileIcon mimeType={file.type} />
                                </AttachmentMedia>
                                <AttachmentContent>
                                    <AttachmentTitle>
                                        {file.name}
                                    </AttachmentTitle>
                                    <AttachmentDescription>
                                        {fileType(file.type)} ·{' '}
                                        {formatFileSize(file.size)}
                                    </AttachmentDescription>
                                </AttachmentContent>
                                <AttachmentActions>
                                    <AttachmentAction
                                        type="button"
                                        aria-label={`Remove ${file.name}`}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            uploadForm.setData(
                                                'materials',
                                                uploadForm.data.materials.filter(
                                                    (_, fileIndex) =>
                                                        fileIndex !== index,
                                                ),
                                            );
                                        }}
                                    >
                                        <X />
                                    </AttachmentAction>
                                </AttachmentActions>
                            </Attachment>
                        ))}
                        {uploadForm.errors.materials && (
                            <p className="text-sm text-destructive">
                                {uploadForm.errors.materials}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeUpload}
                            disabled={uploadForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitUpload}
                            disabled={
                                uploadForm.processing ||
                                uploadForm.data.materials.length === 0
                            }
                        >
                            Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit material</DialogTitle>
                        <DialogDescription>
                            Update the title and optional description.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="material-title">Title</Label>
                            <Input
                                id="material-title"
                                value={editForm.data.title}
                                onChange={(event) =>
                                    editForm.setData(
                                        'title',
                                        event.target.value,
                                    )
                                }
                            />
                            {editForm.errors.title && (
                                <p className="text-sm text-destructive">
                                    {editForm.errors.title}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="material-description">
                                Description
                            </Label>
                            <Textarea
                                id="material-description"
                                value={editForm.data.description}
                                onChange={(event) =>
                                    editForm.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                            {editForm.errors.description && (
                                <p className="text-sm text-destructive">
                                    {editForm.errors.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditing(null)}
                            disabled={editForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitEdit}
                            disabled={editForm.processing}
                        >
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!changingStatus}
                onOpenChange={(open) => !open && setChangingStatus(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {changingStatus?.status === 'active'
                                ? 'Deactivate material?'
                                : 'Activate material?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {changingStatus?.status === 'active'
                                ? 'Students will no longer see this material. The stored file will be preserved.'
                                : 'Students with an active enrollment will be able to open this material.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            type="button"
                            variant={
                                changingStatus?.status === 'active'
                                    ? 'destructive'
                                    : 'default'
                            }
                            onClick={updateStatus}
                        >
                            {changingStatus?.status === 'active'
                                ? 'Deactivate'
                                : 'Activate'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
