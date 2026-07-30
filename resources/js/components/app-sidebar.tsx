import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    BadgeDollarSign,
    BookOpenText,
    BriefcaseBusiness,
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
    KeyRound,
    Play,
    Repeat2,
    NotebookPen,
    ScrollText,
    Shapes,
    UserRoundCheck,
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
    const page = usePage<{
        auth?: {
            user?: {
                permissions?: string[];
            } | null;
        };
        navigation?: {
            pendingSchedules?: number;
            pendingRescheduleRequests?: number;
        };
    }>();
    const { isCurrentUrl } = useCurrentUrl();
    const permissions = page.props.auth?.user?.permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);
    const canAny = (items: string[]) => items.some((item) => can(item));
    const pendingRescheduleRequests =
        page.props.navigation?.pendingRescheduleRequests ?? 0;
    const pendingSchedules = page.props.navigation?.pendingSchedules ?? 0;
    const isSchedulesOpen = isCurrentUrl('/scheduling', undefined, true);
    const isUsersOpen =
        isCurrentUrl('/users/internal', undefined, true) ||
        isCurrentUrl('/users/students', undefined, true) ||
        isCurrentUrl('/users/mentors', undefined, true) ||
        isCurrentUrl('/users/mentor-levels', undefined, true) ||
        isCurrentUrl('/users/roles', undefined, true);
    const isAcademicsOpen =
        isCurrentUrl('/academics/fields', undefined, true) ||
        isCurrentUrl('/academics/programs', undefined, true) ||
        isCurrentUrl('/academics/subjects', undefined, true) ||
        isCurrentUrl('/academics/try-outs', undefined, true);
    const isMentoringOpen = isCurrentUrl('/monitoring', undefined, true);
    const showDashboard = can('dashboard.view');
    const showScheduling = can('schedules.view');
    const showUsers = canAny([
        'internal.view',
        'students.view',
        'mentors.view',
        'mentor_levels.view',
        'roles.view',
    ]);
    const showAcademics = canAny([
        'fields.view',
        'programs.view',
        'subjects.view',
        'try_outs.view',
    ]);
    const showMonitoring = canAny([
        'mentor_journals.view',
        'recordings.view',
    ]);

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
                    {showDashboard && (
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
                    )}

                    {showScheduling && (
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
                                                <span className="min-w-0 flex-1 truncate whitespace-nowrap">
                                                    Schedules
                                                </span>
                                                {pendingSchedules > 0 && (
                                                    <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] leading-none font-semibold text-white">
                                                        {pendingSchedules}
                                                    </span>
                                                )}
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
                                                <span className="min-w-0 flex-1 truncate whitespace-nowrap">
                                                    Reschedule Requests
                                                </span>
                                                {pendingRescheduleRequests >
                                                    0 && (
                                                    <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] leading-none font-semibold text-white">
                                                        {
                                                            pendingRescheduleRequests
                                                        }
                                                    </span>
                                                )}
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
                    )}

                    {showUsers && (
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
                                    {can('internal.view') && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/users/internal',
                                                    undefined,
                                                    true,
                                                )}
                                            >
                                                <Link href="/users/internal" prefetch>
                                                    <BriefcaseBusiness />
                                                    <span>Internal</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                    {can('students.view') && (
                                        <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/users/students',
                                                undefined,
                                                true,
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
                                    )}
                                    {can('mentors.view') && (
                                        <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/users/mentors',
                                                undefined,
                                                true,
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
                                    )}
                                    {can('mentor_levels.view') && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/users/mentor-levels',
                                                    undefined,
                                                    true,
                                                )}
                                            >
                                                <Link
                                                    href="/users/mentor-levels"
                                                    prefetch
                                                >
                                                    <BadgeDollarSign />
                                                    <span>Mentor Levels</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                    {can('roles.view') && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/users/roles',
                                                    undefined,
                                                    true,
                                            )}
                                        >
                                            <Link href="/users/roles" prefetch>
                                                    <KeyRound />
                                                    <span>Roles & Permissions</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    )}
                    {showAcademics && (
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
                                    {can('fields.view') && (
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
                                    )}
                                    {can('programs.view') && (
                                        <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/academics/programs',
                                                undefined,
                                                true,
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
                                    )}
                                    {can('subjects.view') && (
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
                                    )}
                                    {can('try_outs.view') && (
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
                                    )}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    )}

                    {showMonitoring && (
                        <Collapsible
                        asChild
                        defaultOpen={isMentoringOpen}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                    isActive={isMentoringOpen}
                                    tooltip={{ children: 'Monitoring' }}
                                >
                                    <Activity />
                                    <span>Monitoring</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {can('mentor_journals.view') && (
                                        <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/monitoring/mentor-journals',
                                                undefined,
                                                true,
                                            )}
                                        >
                                            <Link
                                                href="/monitoring/mentor-journals"
                                                prefetch
                                            >
                                                <NotebookPen />
                                                <span>Mentor Journals</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    )}
                                    {can('recordings.view') && (
                                        <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/monitoring/recordings',
                                                undefined,
                                                true,
                                            )}
                                        >
                                            <Link
                                                href="/monitoring/recordings"
                                                prefetch
                                            >
                                                <Play />
                                                <span>Recordings</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    )}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    )}

                    {can('zoom_accounts.view') && (
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
                    )}

                    {can('logs.view') && (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(
                                    '/logs',
                                    undefined,
                                    true,
                                )}
                                tooltip={{ children: 'Activity Logs' }}
                            >
                                <Link href="/logs" prefetch>
                                    <ScrollText />
                                    <span>Activity Logs</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
