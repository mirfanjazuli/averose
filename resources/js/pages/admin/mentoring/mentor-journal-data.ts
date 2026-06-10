export type JournalNote =
    | 'completed'
    | 'postponed'
    | 'student late'
    | 'mentor late'
    | 'mentor waiting';

export type MentorJournal = {
    achievement: string;
    date: string;
    duration: string;
    id: number;
    improvementArea: string;
    mentor: string;
    nextImprovementPlan: string;
    note: JournalNote;
    sessionName: string;
    slug: string;
    student: string;
    subject: string;
};

export const noteVariants: Record<
    JournalNote,
    'default' | 'secondary' | 'outline' | 'destructive'
> = {
    completed: 'default',
    postponed: 'secondary',
    'student late': 'outline',
    'mentor late': 'outline',
    'mentor waiting': 'secondary',
};
