import { Form } from '@inertiajs/react';
import { useState } from 'react';
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

export type TryOutAccessOption = {
    id: string;
    title: string;
};

export function TryOutAccessForm({
    onSuccess,
    studentSlug,
    tryOutOptions,
}: {
    onSuccess: () => void;
    studentSlug: string;
    tryOutOptions: TryOutAccessOption[];
}) {
    const [selectedTryOutId, setSelectedTryOutId] = useState('');

    return (
        <Form
            action={`/users/students/${studentSlug}/try-out-access`}
            method="post"
            resetOnSuccess
            disableWhileProcessing
            onSuccess={() => {
                setSelectedTryOutId('');
                toast.success('Try out access added.');
                onSuccess();
            }}
            onError={() => toast.error('Please check the try out access form.')}
            className="grid gap-5 pt-3"
        >
            {({ processing, errors }) => (
                <>
                    <input
                        type="hidden"
                        name="try_out_id"
                        value={selectedTryOutId}
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="try-out-id">Try out</Label>
                        <Select
                            value={selectedTryOutId}
                            onValueChange={setSelectedTryOutId}
                        >
                            <SelectTrigger
                                id="try-out-id"
                                className="w-full"
                                aria-invalid={!!errors.try_out_id}
                            >
                                <SelectValue placeholder="Select private try out" />
                            </SelectTrigger>
                            <SelectContent>
                                {tryOutOptions.map((tryOut) => (
                                    <SelectItem
                                        key={tryOut.id}
                                        value={tryOut.id}
                                    >
                                        {tryOut.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.try_out_id} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="try-out-start-date">
                                Start date
                            </Label>
                            <Input
                                id="try-out-start-date"
                                name="available_from"
                                type="date"
                                aria-invalid={!!errors.available_from}
                            />
                            <InputError message={errors.available_from} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="try-out-end-date">End date</Label>
                            <Input
                                id="try-out-end-date"
                                name="available_until"
                                type="date"
                                aria-invalid={!!errors.available_until}
                            />
                            <InputError message={errors.available_until} />
                        </div>
                    </div>
                    <input type="hidden" name="status" value="active" />
                    <div className="grid gap-2">
                        <Label htmlFor="try-out-attempt-quota">Attempts</Label>
                        <Input
                            id="try-out-attempt-quota"
                            name="attempt_quota"
                            type="number"
                            min="1"
                            defaultValue="1"
                            aria-invalid={!!errors.attempt_quota}
                        />
                        <InputError message={errors.attempt_quota} />
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
                            Save access
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}
