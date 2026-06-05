import { Head } from '@inertiajs/react';
import {
    CalendarCheck,
    Mail,
    MoreHorizontal,
    Plus,
    Search,
    ShieldCheck,
    Star,
    UserCheck,
} from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const stats = [
    { label: 'Total mentors', value: '32', icon: UserCheck },
    { label: 'Active sessions', value: '76', icon: CalendarCheck },
    { label: 'Verified mentors', value: '29', icon: ShieldCheck },
];

const mentors = [
    {
        name: 'Megan Norton',
        email: 'megan@example.com',
        expertise: 'Product Design',
        rating: '4.9',
        status: 'Available',
        avatar: 'https://i.pravatar.cc/96?img=32',
    },
    {
        name: 'Floyd Miles',
        email: 'floyd@example.com',
        expertise: 'Frontend',
        rating: '4.8',
        status: 'Available',
        avatar: 'https://i.pravatar.cc/96?img=12',
    },
    {
        name: 'Guy Hawkins',
        email: 'guy@example.com',
        expertise: 'Backend',
        rating: '4.7',
        status: 'Busy',
        avatar: 'https://i.pravatar.cc/96?img=33',
    },
    {
        name: 'Kristin Watson',
        email: 'kristin@example.com',
        expertise: 'Career Coaching',
        rating: '4.9',
        status: 'Offline',
        avatar: 'https://i.pravatar.cc/96?img=47',
    },
];

export default function Mentors() {
    return (
        <>
            <Head title="Mentors" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Mentors
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage mentor profiles, expertise, and availability.
                        </p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add mentor
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add mentor</DialogTitle>
                                <DialogDescription>
                                    Create a mentor profile with temporary
                                    access details.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                className="grid gap-4"
                                onSubmit={(event) => event.preventDefault()}
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="mentor-name">Name</Label>
                                    <Input
                                        id="mentor-name"
                                        name="name"
                                        placeholder="Mentor name"
                                        autoComplete="name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mentor-email">Email</Label>
                                    <Input
                                        id="mentor-email"
                                        name="email"
                                        type="email"
                                        placeholder="mentor@example.com"
                                        autoComplete="email"
                                    />
                                </div>
                                <input
                                    type="hidden"
                                    name="password"
                                    value="averose123"
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor="mentor-status">
                                        Status
                                    </Label>
                                    <Select defaultValue="available">
                                        <SelectTrigger
                                            id="mentor-status"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">
                                                Available
                                            </SelectItem>
                                            <SelectItem value="busy">
                                                Busy
                                            </SelectItem>
                                            <SelectItem value="offline">
                                                Offline
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mentor-expertise">
                                        Expertise
                                    </Label>
                                    <Input
                                        id="mentor-expertise"
                                        name="expertise"
                                        placeholder="Frontend, Backend, Product Design"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mentor-level">Level</Label>
                                    <Select defaultValue="senior">
                                        <SelectTrigger
                                            id="mentor-level"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="junior">
                                                Junior
                                            </SelectItem>
                                            <SelectItem value="mid">
                                                Mid
                                            </SelectItem>
                                            <SelectItem value="senior">
                                                Senior
                                            </SelectItem>
                                            <SelectItem value="lead">
                                                Lead
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
                                    <Button type="submit">Save mentor</Button>
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
                        <CardTitle>Mentor directory</CardTitle>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <span>Search mentors...</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y rounded-2xl border">
                            {mentors.map((mentor) => (
                                <div
                                    key={mentor.email}
                                    className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_9rem_5rem_7rem_auto]"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar>
                                            <AvatarImage
                                                src={mentor.avatar}
                                                alt={mentor.name}
                                            />
                                            <AvatarFallback>
                                                {mentor.name
                                                    .split(' ')
                                                    .map((part) => part[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {mentor.name}
                                            </p>
                                            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                                                <Mail className="size-3.5" />
                                                {mentor.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge variant="outline">
                                            {mentor.expertise}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm font-medium">
                                        <Star className="size-4 fill-[#f2aa35] text-[#f2aa35]" />
                                        {mentor.rating}
                                    </div>
                                    <div className="flex items-center">
                                        <Badge
                                            variant={
                                                mentor.status === 'Available'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {mentor.status}
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
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Mentors.layout = {
    breadcrumbs: [
        {
            title: 'Mentors',
            href: '/mentors',
        },
    ],
};
