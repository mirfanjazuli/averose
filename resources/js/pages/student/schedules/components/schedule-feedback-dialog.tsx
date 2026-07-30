import { router } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type ScheduleFeedbackSession = {
    id: string;
    mentor: string;
    mentorRating: number | null;
};

const feedbackQuestions = [
    {
        field: 'interactivity_rating',
        label: 'Interaktivitas',
    },
    {
        field: 'material_clarity_rating',
        label: 'Penyampaian materi',
    },
    {
        field: 'audio_quality_rating',
        label: 'Kualitas audio',
    },
    {
        field: 'visual_quality_rating',
        label: 'Kualitas visual',
    },
] as const;

type FeedbackField = (typeof feedbackQuestions)[number]['field'];

type FeedbackRatings = Record<FeedbackField, number>;

const emptyFeedbackRatings: FeedbackRatings = {
    audio_quality_rating: 0,
    interactivity_rating: 0,
    material_clarity_rating: 0,
    visual_quality_rating: 0,
};

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function StarRating({
    label,
    onChange,
    value,
}: {
    label: string;
    onChange: (value: number) => void;
    value: number;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <Label className="text-sm text-foreground">{label}</Label>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        aria-label={`${label} ${rating} bintang`}
                        onClick={() => onChange(rating)}
                        className="rounded-full p-1 text-muted-foreground transition-colors hover:text-amber-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <Star
                            className={
                                rating <= value
                                    ? 'size-5 fill-amber-400 text-amber-400'
                                    : 'size-5'
                            }
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

function ScheduleFeedbackForm({
    onOpenChange,
    session,
}: {
    onOpenChange: (open: boolean) => void;
    session: ScheduleFeedbackSession;
}) {
    const [ratings, setRatings] =
        useState<FeedbackRatings>(emptyFeedbackRatings);
    const [comment, setComment] = useState('');
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        if (processing) {
            return;
        }

        setProcessing(true);

        router.post(
            `/schedules/${session.id}/feedback`,
            {
                ...ratings,
                comment,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    toast.success(
                        'Terima kasih! Feedback kamu membantu kami meningkatkan kualitas kelas.',
                    );
                },
                onError: () => {
                    toast.error('Lengkapi rating feedback terlebih dahulu.');
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Avatar size="lg">
                    <AvatarFallback>
                        {initials(session.mentor) || 'M'}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                        {session.mentor}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>
                            {session.mentorRating
                                ? `${session.mentorRating}/5`
                                : 'Belum ada rating'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
                {feedbackQuestions.map((question) => (
                    <StarRating
                        key={question.field}
                        label={question.label}
                        value={ratings[question.field]}
                        onChange={(value) =>
                            setRatings((current) => ({
                                ...current,
                                [question.field]: value,
                            }))
                        }
                    />
                ))}
            </div>

            <Textarea
                id="feedback_comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder="Ceritakan pengalamanmu selama mengikuti sesi ini ..."
                className="bg-transparent"
            />

            <Button
                type="button"
                className="w-full"
                disabled={
                    processing ||
                    Object.values(ratings).some((rating) => rating === 0)
                }
                onClick={submit}
            >
                {processing ? 'Mengirim...' : 'Kirim feedback'}
            </Button>
        </div>
    );
}

export function ScheduleFeedbackDialog({
    onOpenChange,
    open,
    session,
}: {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    session: ScheduleFeedbackSession | null;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {session ? (
                    <ScheduleFeedbackForm
                        key={session.id}
                        session={session}
                        onOpenChange={onOpenChange}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
