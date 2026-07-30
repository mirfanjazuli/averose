export type MentorJournal = {
    achievement: string;
    attachments: {
        mimeType: string;
        name: string;
        size: number;
        url: string;
        uuid: string;
    }[];
    completedAt: string;
    id: number;
    improvementArea: string;
    mentor: string;
    mentorId: string;
    nextImprovementPlan: string;
    program: string;
    scheduleCode: string;
    scheduleId: string | null;
    sessionEndAt: string | null;
    sessionStartAt: string;
    slug: string;
    student: string;
    studentId: string;
    subject: string;
};
