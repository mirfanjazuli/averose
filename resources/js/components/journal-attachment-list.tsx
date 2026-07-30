import { ExternalLink, FileImage, FileText } from 'lucide-react';

import {
    Attachment,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
    AttachmentTrigger,
} from '@/components/ui/attachment';

export type JournalAttachment = {
    mimeType: string;
    name: string;
    size: number;
    url: string;
    uuid: string;
};

export function formatFileSize(size: number) {
    if (size < 1024 * 1024) {
        return `${Math.max(1, Math.round(size / 1024))} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function JournalAttachmentList({
    attachments,
}: {
    attachments: JournalAttachment[];
}) {
    return (
        <div className="grid gap-2">
            {attachments.map((attachment) => {
                const Icon = attachment.mimeType.startsWith('image/')
                    ? FileImage
                    : FileText;
                const fileType = attachment.mimeType
                    .split('/')
                    .at(-1)
                    ?.replace('jpeg', 'jpg')
                    .toUpperCase();

                return (
                    <Attachment
                        key={attachment.uuid}
                        size="sm"
                        className="w-full flex-nowrap rounded-lg"
                    >
                        <AttachmentMedia>
                            <Icon className="text-primary" />
                        </AttachmentMedia>
                        <AttachmentContent>
                            <AttachmentTitle>{attachment.name}</AttachmentTitle>
                            <AttachmentDescription>
                                {fileType} · {formatFileSize(attachment.size)}
                            </AttachmentDescription>
                        </AttachmentContent>
                        <AttachmentActions className="pointer-events-none">
                            <ExternalLink className="size-4 text-muted-foreground" />
                        </AttachmentActions>
                        <AttachmentTrigger asChild>
                            <a
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${attachment.name}`}
                            />
                        </AttachmentTrigger>
                    </Attachment>
                );
            })}
        </div>
    );
}
