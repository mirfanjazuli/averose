import { Head } from '@inertiajs/react';
import { StatusBadge } from '@/components/admin/status-badge';

type Field = {
    description?: string | null;
    id: number;
    name: string;
    programsCount: number;
    slug: string;
    status: string;
    subjectsCount: number;
};

export default function FieldDetail({ field }: { field: Field }) {
    return (
        <>
            <Head title={field.name} />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {field.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Academic field detail and current mapping.
                        </p>
                    </div>
                </div>

                <section className="space-y-1.5">
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">
                            Description
                        </p>
                        <p className="text-sm">
                            {field.description || 'No description.'}
                        </p>
                    </div>
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">
                            Programs
                        </p>
                        <p className="text-sm">{field.programsCount}</p>
                    </div>
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">
                            Subjects
                        </p>
                        <p className="text-sm">{field.subjectsCount}</p>
                    </div>
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div>
                            <StatusBadge status={field.status} />
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
