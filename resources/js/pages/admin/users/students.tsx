import { Head } from '@inertiajs/react';
import {
    BookOpenCheck,
    GraduationCap,
    Mail,
    MoreHorizontal,
    Plus,
    Search,
    UserCheck,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
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
    Pagination,
    PaginationButton,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const stats = [
    { label: 'Total students', value: '184', icon: UsersRound },
    { label: 'Active students', value: '162', icon: UserCheck },
    { label: 'Enrolled classes', value: '28', icon: BookOpenCheck },
];

const students = [
    {
        name: 'Alya Prameswari',
        email: 'alya@example.com',
        program: 'Frontend Basics',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=5',
    },
    {
        name: 'Rafi Hidayat',
        email: 'rafi@example.com',
        program: 'Laravel Starter',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=14',
    },
    {
        name: 'Nadia Putri',
        email: 'nadia@example.com',
        program: 'React Advanced',
        status: 'Pending',
        avatar: 'https://i.pravatar.cc/96?img=20',
    },
    {
        name: 'Bagas Wibowo',
        email: 'bagas@example.com',
        program: 'UI Design',
        status: 'Inactive',
        avatar: 'https://i.pravatar.cc/96?img=31',
    },
    {
        name: 'Citra Lestari',
        email: 'citra@example.com',
        program: 'Frontend Basics',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=32',
    },
    {
        name: 'Dimas Santoso',
        email: 'dimas@example.com',
        program: 'Laravel Starter',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=33',
    },
    {
        name: 'Eka Maharani',
        email: 'eka@example.com',
        program: 'React Advanced',
        status: 'Pending',
        avatar: 'https://i.pravatar.cc/96?img=34',
    },
    {
        name: 'Fajar Nugroho',
        email: 'fajar@example.com',
        program: 'UI Design',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=35',
    },
    {
        name: 'Gita Anindya',
        email: 'gita@example.com',
        program: 'Frontend Basics',
        status: 'Inactive',
        avatar: 'https://i.pravatar.cc/96?img=36',
    },
    {
        name: 'Hana Syakira',
        email: 'hana@example.com',
        program: 'Laravel Starter',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=37',
    },
    {
        name: 'Iqbal Ramadhan',
        email: 'iqbal@example.com',
        program: 'React Advanced',
        status: 'Pending',
        avatar: 'https://i.pravatar.cc/96?img=38',
    },
    {
        name: 'Jasmine Kirana',
        email: 'jasmine@example.com',
        program: 'UI Design',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=39',
    },
];

const studentsPerPage = 4;

export default function Students() {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(students.length / studentsPerPage);
    const firstStudentIndex = (currentPage - 1) * studentsPerPage;
    const visibleStudents = useMemo(
        () =>
            students.slice(
                firstStudentIndex,
                firstStudentIndex + studentsPerPage,
            ),
        [firstStudentIndex],
    );

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    return (
        <>
            <Head title="Students" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Students
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage student enrollment, status, and learning
                            programs.
                        </p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add student
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add student</DialogTitle>
                                <DialogDescription>
                                    Create a student profile with temporary
                                    access details.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                className="grid gap-4"
                                onSubmit={(event) => event.preventDefault()}
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="student-name">Name</Label>
                                    <Input
                                        id="student-name"
                                        name="name"
                                        placeholder="Student name"
                                        autoComplete="name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="student-email">Email</Label>
                                    <Input
                                        id="student-email"
                                        name="email"
                                        type="email"
                                        placeholder="student@example.com"
                                        autoComplete="email"
                                    />
                                </div>
                                <input
                                    type="hidden"
                                    name="password"
                                    value="averose123"
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor="student-status">
                                        Status
                                    </Label>
                                    <Select defaultValue="active">
                                        <SelectTrigger
                                            id="student-status"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="pending">
                                                Pending
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter className="pt-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit">Save student</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((item) => (
                        <Card key={item.label}>
                            <CardContent className="flex items-center gap-4 px-6 py-5">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="text-2xl font-semibold">
                                        {item.value}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Student list</CardTitle>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <span>Search students...</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y rounded-2xl border">
                            {visibleStudents.map((student) => (
                                <div
                                    key={student.email}
                                    className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_10rem_7rem_auto]"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar>
                                            <AvatarImage
                                                src={student.avatar}
                                                alt={student.name}
                                            />
                                            <AvatarFallback>
                                                {student.name
                                                    .split(' ')
                                                    .map((part) => part[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {student.name}
                                            </p>
                                            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                                                <Mail className="size-3.5" />
                                                {student.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge variant="outline">
                                            <GraduationCap className="size-3" />
                                            {student.program}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge
                                            variant={
                                                student.status === 'Active'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {student.status}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="rounded-full"
                                    >
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {firstStudentIndex + 1}-
                                {Math.min(
                                    firstStudentIndex + studentsPerPage,
                                    students.length,
                                )}{' '}
                                of {students.length} students
                            </p>
                            <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            className={
                                                currentPage === 1
                                                    ? 'pointer-events-none opacity-50'
                                                    : undefined
                                            }
                                            onClick={(event) => {
                                                event.preventDefault();
                                                goToPage(currentPage - 1);
                                            }}
                                        />
                                    </PaginationItem>
                                    {Array.from(
                                        { length: totalPages },
                                        (_, index) => index + 1,
                                    ).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationButton
                                                type="button"
                                                isActive={
                                                    currentPage === page
                                                }
                                                onClick={() => goToPage(page)}
                                            >
                                                {page}
                                            </PaginationButton>
                                        </PaginationItem>
                                    ))}
                                    {totalPages > 5 && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            className={
                                                currentPage === totalPages
                                                    ? 'pointer-events-none opacity-50'
                                                    : undefined
                                            }
                                            onClick={(event) => {
                                                event.preventDefault();
                                                goToPage(currentPage + 1);
                                            }}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Students.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: '/users/students',
        },
        {
            title: 'Students',
            href: '/users/students',
        },
    ],
};
