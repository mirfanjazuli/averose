import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type AcademicProgramOption = {
    id: string;
    label: string;
};

export type AcademicProgramFieldOption = AcademicProgramOption & {
    subjects: AcademicProgramOption[];
};

export type AcademicProgramVariantInput = {
    duration: number | string;
    fieldId: string;
    id?: number | string;
    price: number | string;
    session: number | string;
};

export type AcademicProgramFormProgram = {
    description?: string | null;
    fieldIds: string[];
    maxReschedule: number;
    name: string;
    subjectIds: string[];
    thumbnailUrl?: string | null;
    variantRows: AcademicProgramVariantInput[];
};

type AcademicProgramFormProps = {
    action: string;
    idPrefix: string;
    method: 'post' | 'put';
    onError: () => void;
    onSuccess: () => void;
    program?: AcademicProgramFormProgram;
    resetOnSuccess?: boolean;
    submitLabel: string;
};

export function AcademicProgramForm({
    action,
    idPrefix,
    method,
    onError,
    onSuccess,
    program,
    resetOnSuccess = false,
    submitLabel,
}: AcademicProgramFormProps) {
    return (
        <Form
            action={action}
            method={method}
            resetOnSuccess={resetOnSuccess}
            disableWhileProcessing
            onSuccess={onSuccess}
            onError={onError}
            className="grid gap-5"
        >
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                        <Input
                            id={`${idPrefix}-name`}
                            name="name"
                            defaultValue={program?.name}
                            placeholder="Program name"
                            autoComplete="off"
                            aria-invalid={!!errors.name}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-thumbnail`}>
                            Thumbnail
                        </Label>
                        <Input
                            id={`${idPrefix}-thumbnail`}
                            name="thumbnail"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            aria-invalid={!!errors.thumbnail}
                        />
                        {program?.thumbnailUrl && (
                            <div className="overflow-hidden rounded-2xl border bg-muted">
                                <img
                                    src={program.thumbnailUrl}
                                    alt=""
                                    className="aspect-[5/2] w-full object-cover"
                                />
                            </div>
                        )}
                        <InputError message={errors.thumbnail} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-max-reschedule`}>
                            Max reschedule
                        </Label>
                        <Input
                            id={`${idPrefix}-max-reschedule`}
                            name="max_reschedule"
                            type="number"
                            min={0}
                            defaultValue={program?.maxReschedule}
                            placeholder="3"
                            aria-invalid={!!errors.max_reschedule}
                        />
                        <InputError message={errors.max_reschedule} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-description`}>
                            Description
                        </Label>
                        <Textarea
                            id={`${idPrefix}-description`}
                            name="description"
                            defaultValue={program?.description ?? undefined}
                            placeholder="Short program description"
                            className="min-h-28 resize-none rounded-2xl bg-background px-4 text-sm"
                            aria-invalid={!!errors.description}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <DialogFooter className="pt-2">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}
