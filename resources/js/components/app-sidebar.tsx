import { Link } from '@inertiajs/react';
import {
    BookOpenText,
    CalendarOff,
    CalendarClock,
    CalendarDays,
    ChevronRight,
    Clock3,
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
    const isSchedulesOpen = isCurrentUrl('/schedules', undefined, true);
    const isUsersOpen = isCurrentUrl('/students') || isCurrentUrl('/mentors');
    const isAcademicsOpen =
        isCurrentUrl('/fields') ||
        isCurrentUrl('/programs') ||
        isCurrentUrl('/subjects');

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
                                    tooltip={{ children: 'Schedules' }}
                                >
                                    <CalendarDays />
                                    <span>Schedules</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/schedules',
                                            )}
                                        >
                                            <Link href="/schedules" prefetch>
                                                <CalendarClock />
                                                <span>Schedule</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/schedules/mentor-assignments',
                                            )}
                                        >
                                            <Link
                                                href="/schedules/mentor-assignments"
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
                                                '/schedules/reschedule-requests',
                                            )}
                                        >
                                            <Link
                                                href="/schedules/reschedule-requests"
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
                                                '/schedules/working-hours',
                                            )}
                                        >
                                            <Link
                                                href="/schedules/working-hours"
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
                                                '/schedules/public-holidays',
                                            )}
                                        >
                                            <Link
                                                href="/schedules/public-holidays"
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
                                            isActive={isCurrentUrl('/students')}
                                        >
                                            <Link href="/students" prefetch>
                                                <GraduationCap />
                                                <span>Students</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/mentors')}
                                        >
                                            <Link href="/mentors" prefetch>
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
                                            isActive={isCurrentUrl('/fields')}
                                        >
                                            <Link href="/fields" prefetch>
                                                <Shapes />
                                                <span>Fields</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/programs')}
                                        >
                                            <Link href="/programs" prefetch>
                                                <Layers3 />
                                                <span>Programs</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl('/subjects')}
                                        >
                                            <Link href="/subjects" prefetch>
                                                <LibraryBig />
                                                <span>Subjects</span>
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
                            isActive={isCurrentUrl('/zoom-accounts')}
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
