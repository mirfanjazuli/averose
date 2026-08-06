import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type ProgramEnrollmentOption = {
    fields: {
        id: string;
        label: string;
    }[];
    id: string;
    label: string;
    maxReschedule: number;
    variants: {
        duration: number;
        fieldId: string;
        id: string;
        label: string;
        price: string;
        session: number;
        status: string;
    }[];
};

export function ProgramEnrollmentForm({
    onSuccess,
    programOptions,
    studentSlug,
}: {
    onSuccess: () => void;
    programOptions: ProgramEnrollmentOption[];
    studentSlug: string;
}) {
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [selectedFieldId, setSelectedFieldId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const selectedProgram = useMemo(
        () =>
            programOptions.find((program) => program.id === selectedProgramId),
        [programOptions, selectedProgramId],
    );
    const fieldOptions = selectedProgram?.fields ?? [];
    const variantOptions = useMemo(
        () =>
            (selectedProgram?.variants ?? []).filter(
                (variant) => variant.fieldId === selectedFieldId,
            ),
        [selectedFieldId, selectedProgram],
    );

    return (
        <Form
            action={`/users/students/${studentSlug}/enrollments`}
            method="post"
            resetOnSuccess
            disableWhileProcessing
            onSuccess={() => {
                setSelectedProgramId('');
                setSelectedFieldId('');
                setSelectedVariantId('');
                toast.success('Enrollment added.');
                onSuccess();
            }}
            onError={() => toast.error('Please check the enrollment form.')}
            className="grid gap-5 pt-3"
        >
            {({ processing, errors }) => (
                <>
                    <input
                        type="hidden"
                        name="program_id"
                        value={selectedProgramId}
                    />
                    <input
                        type="hidden"
                        name="field_id"
                        value={selectedFieldId}
                    />
                    <input
                        type="hidden"
                        name="program_variant_id"
                        value={selectedVariantId}
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="enrollment-program">Program</Label>
                        <Select
                            value={selectedProgramId}
                            onValueChange={(value) => {
                                setSelectedProgramId(value);
                                setSelectedFieldId('');
                                setSelectedVariantId('');
                            }}
                        >
                            <SelectTrigger
                                id="enrollment-program"
                                className="w-full"
                                aria-invalid={!!errors.program_id}
                            >
                                <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                                {programOptions.map((program) => (
                                    <SelectItem
                                        key={program.id}
                                        value={program.id}
                                    >
                                        {program.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.program_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="enrollment-field">Field</Label>
                        <Select
                            value={selectedFieldId}
                            onValueChange={(value) => {
                                setSelectedFieldId(value);
                                setSelectedVariantId('');
                            }}
                            disabled={!selectedProgram}
                        >
                            <SelectTrigger
                                id="enrollment-field"
                                className="w-full"
                                aria-invalid={!!errors.field_id}
                            >
                                <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions.map((field) => (
                                    <SelectItem key={field.id} value={field.id}>
                                        {field.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.field_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="enrollment-variant">Variant</Label>
                        <Select
                            value={selectedVariantId}
                            onValueChange={setSelectedVariantId}
                            disabled={!selectedFieldId}
                        >
                            <SelectTrigger
                                id="enrollment-variant"
                                className="w-full"
                                aria-invalid={!!errors.program_variant_id}
                            >
                                <SelectValue placeholder="Select variant" />
                            </SelectTrigger>
                            <SelectContent>
                                {variantOptions.map((variant) => (
                                    <SelectItem
                                        key={variant.id}
                                        value={variant.id}
                                    >
                                        {variant.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.program_variant_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="enrollment-start-date">Start date</Label>
                        <Input
                            id="enrollment-start-date"
                            name="start_date"
                            type="date"
                            aria-invalid={!!errors.start_date}
                        />
                        <InputError message={errors.start_date} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="enrollment-max-reschedule">
                            Max reschedule
                        </Label>
                        <Input
                            id="enrollment-max-reschedule"
                            name="max_reschedule"
                            type="number"
                            min="0"
                            placeholder={
                                selectedProgram
                                    ? `Default ${selectedProgram.maxReschedule}`
                                    : 'Optional overwrite'
                            }
                            aria-invalid={!!errors.max_reschedule}
                        />
                        <InputError message={errors.max_reschedule} />
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
                            Save enrollment
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}
