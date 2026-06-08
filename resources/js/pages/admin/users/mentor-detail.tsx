import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { UserDetailPage } from '@/components/user-detail-page';

type User = ComponentProps<typeof UserDetailPage>['user'];

type TeachingJournal = {
    date: string;
    duration: string;
    id: string;
    program: string;
    status: string;
    student: string;
    subject: string;
    time: string;
};

export default function MentorDetail({
    teachingJournals,
    user,
}: {
    teachingJournals: TeachingJournal[];
    user: User;
}) {
    return (
        <UserDetailPage
            backHref="/users/mentors"
            description="Mentor account detail and access status."
            title="Mentor"
            user={user}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Teaching journal</CardTitle>
                </CardHeader>
                <CardContent>
                    {teachingJournals.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No teaching journal yet.
                        </div>
                    ) : (
                        <div className="rounded-2xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Session</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teachingJournals.map((journal) => (
                                        <TableRow key={journal.id}>
                                            <TableCell>
                                                <p className="font-medium">
                                                    {journal.subject}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {journal.program}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {journal.student}
                                            </TableCell>
                                            <TableCell>{journal.date}</TableCell>
                                            <TableCell>{journal.time}</TableCell>
                                            <TableCell>
                                                {journal.duration}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {journal.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </UserDetailPage>
    );
}
