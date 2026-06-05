import { Link } from '@inertiajs/react';
import {
    BookOpenText,
    CalendarOff,
    CalendarClock,
    CalendarDays,
    ChevronRight,
    Clock3,
    ClipboardList,
    GraduationCap,
    LayoutGrid,
    Layers3,
    LibraryBig,
    Repeat2,
    Shapes,
    UserRoundCheck,
    UsersRound,
    Users,
    Video,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const { isCurrentUrl } = useCurrentUrl();
    const isSchedulesOpen = isCurrentUrl('/scheduling', undefined, true);
    const isUsersOpen =
        isCurrentUrl('/users/students') || isCurrentUrl('/users/mentors');
    const isAcademicsOpen =
        isCurrentUrl('/academics/fields') ||
        isCurrentUrl('/academics/programs') ||
        isCurrentUrl('/academics/subjects') ||
        isCurrentUrl('/academics/try-outs');

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="px-2">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(dashboard())}
                            tooltip={{ children: 'Dashboard' }}
                        >
                            <Link href={dashboard()} prefetch>
                                <LayoutGrid />
                                <span>Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <Collapsible
                        asChild
                        defaultOpen={isSchedulesOpen}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                    isActive={isSchedulesOpen}
                                    tooltip={{ children: 'Scheduling' }}
                                >
                                    <CalendarDays />
                                    <span>Scheduling</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/scheduling/schedules',
                                            )}
                                        >
                                            <Link
                                                href="/scheduling/schedules"
                                                prefetch
                                            >
                                                <CalendarClock />
                                                <span>Schedules</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/scheduling/mentor-assignments',
                                            )}
                                        >
                                            <Link
                                                href="/scheduling/mentor-assignments"
                                                prefetch
                                            >
                                                <UsersRound />
                                                <span>Mentor Assignment</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/scheduling/reschedule-requests',
                                            )}
                                        >
                                            <Link
                                                href="/scheduling/reschedule-requests"
                                                prefetch
                                            >
                                                <Repeat2 />
                                                <span>Reschedule Requests</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/scheduling/working-hours',
                                            )}
                                        >
                                            <Link
                                                href="/scheduling/working-hours"
                                                prefetch
                                            >
                                                <Clock3 />
                                                <span>Working Hours</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/scheduling/public-holidays',
                                            )}
                                        >
                                            <Link
                                                href="/scheduling/public-holidays"
                                                prefetch
                                            >
                                                <CalendarOff />
                                                <span>Public Holidays</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>

                    <Collapsible
                        asChild
                        defaultOpen={isUsersOpen}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                    isActive={isUsersOpen}
                                    tooltip={{ children: 'Users' }}
                                >
                                    <Users />
                                    <span>Users</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/users/students',
                                            )}
                                        >
                                            <Link
                                                href="/users/students"
                                                prefetch
                                            >
                                                <GraduationCap />
                                                <span>Students</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/users/mentors',
                                            )}
                                        >
                                            <Link
                                                href="/users/mentors"
                                                prefetch
                                            >
                                                <UserRoundCheck />
                                                <span>Mentors</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>

                    <Collapsible
                        asChild
                        defaultOpen={isAcademicsOpen}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                    isActive={isAcademicsOpen}
                                    tooltip={{ children: 'Academics' }}
                                >
                                    <BookOpenText />
                                    <span>Academics</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/academics/fields',
                                            )}
                                        >
                                            <Link
                                                href="/academics/fields"
                                                prefetch
                                            >
                                                <Shapes />
                                                <span>Fields</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/academics/programs',
                                            )}
                                        >
                                            <Link
                                                href="/academics/programs"
                                                prefetch
                                            >
                                                <Layers3 />
                                                <span>Programs</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/academics/subjects',
                                            )}
                                        >
                                            <Link
                                                href="/academics/subjects"
                                                prefetch
                                            >
                                                <LibraryBig />
                                                <span>Subjects</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/academics/try-outs',
                                            )}
                                        >
                                            <Link
                                                href="/academics/try-outs"
                                                prefetch
                                            >
                                                <ClipboardList />
                                                <span>Try Out</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(
                                '/zoom-accounts',
                                undefined,
                                true,
                            )}
                            tooltip={{ children: 'Zoom Accounts' }}
                        >
                            <Link href="/zoom-accounts" prefetch>
                                <Video />
                                <span>Zoom Accounts</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
