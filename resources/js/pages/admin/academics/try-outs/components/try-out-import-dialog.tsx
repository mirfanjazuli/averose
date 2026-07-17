import { Form } from '@inertiajs/react';
import { FileUp, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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

type TryOutImportDialogProps = {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
};

type ScoringMode = 'raw_score' | 'negative_marking';

export function TryOutImportDialog({
    open,
    onOpenChange,
    trigger,
}: TryOutImportDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('draft');
    const [scoringMode, setScoringMode] = useState<ScoringMode>('raw_score');
    const dialogOpen = open ?? internalOpen;

    const setDialogOpen = (nextOpen: boolean) => {
        onOpenChange?.(nextOpen);

        if (open === undefined) {
            setInternalOpen(nextOpen);
        }

        if (!nextOpen) {
            setIsGeneratingPreview(false);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button className="gap-2">
                        <FileUp className="size-4" />
                        Import DOCX
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import DOCX</DialogTitle>
                    <DialogDescription>
                        Upload a Word document to generate a try out preview.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action="/academics/try-outs/import/preview"
                    method="post"
                    encType="multipart/form-data"
                    resetOnSuccess
                    onStart={() => {
                        setIsGeneratingPreview(true);
                    }}
                    onError={() => {
                        setIsGeneratingPreview(false);
                        toast.error('Failed to generate try out preview.');
                    }}
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="import-title">Title</Label>
                                <Input
                                    id="import-title"
                                    name="title"
                                    placeholder="Leave empty to use file name"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="import-duration">
                                        Duration
                                    </Label>
                                    <Input
                                        id="import-duration"
                                        name="duration_minutes"
                                        type="number"
                                        min="1"
                                        max="1000"
                                        placeholder="120"
                                    />
                                    <InputError
                                        message={errors.duration_minutes}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="import-status">
                                        Status
                                    </Label>
                                    <Select
                                        name="status"
                                        value={selectedStatus}
                                        onValueChange={setSelectedStatus}
                                    >
                                        <SelectTrigger
                                            id="import-status"
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
                                    <InputError message={errors.status} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="import-scoring-mode">
                                    Scoring
                                </Label>
                                <Select
                                    name="scoring_mode"
                                    value={scoringMode}
                                    onValueChange={(value) =>
                                        setScoringMode(value as ScoringMode)
                                    }
                                >
                                    <SelectTrigger
                                        id="import-scoring-mode"
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
                                <InputError message={errors.scoring_mode} />
                            </div>

                            {scoringMode === 'negative_marking' && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="import-correct-points">
                                            Correct
                                        </Label>
                                        <Input
                                            id="import-correct-points"
                                            name="correct_points"
                                            type="number"
                                            step="0.01"
                                            defaultValue="4"
                                        />
                                        <InputError
                                            message={errors.correct_points}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="import-wrong-points">
                                            Wrong
                                        </Label>
                                        <Input
                                            id="import-wrong-points"
                                            name="wrong_points"
                                            type="number"
                                            step="0.01"
                                            defaultValue="-1"
                                        />
                                        <InputError
                                            message={errors.wrong_points}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="import-unanswered-points">
                                            No answer
                                        </Label>
                                        <Input
                                            id="import-unanswered-points"
                                            name="unanswered_points"
                                            type="number"
                                            step="0.01"
                                            defaultValue="0"
                                        />
                                        <InputError
                                            message={errors.unanswered_points}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="import-document">
                                    Document
                                </Label>
                                <Input
                                    id="import-document"
                                    name="document"
                                    type="file"
                                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                />
                                <InputError message={errors.document} />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing || isGeneratingPreview}
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || isGeneratingPreview}
                                    className="gap-2"
                                >
                                    {processing || isGeneratingPreview ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    ) : null}
                                    {processing || isGeneratingPreview
                                        ? 'Generating...'
                                        : 'Generate preview'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
