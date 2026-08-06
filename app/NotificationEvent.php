<?php

namespace App;

enum NotificationEvent: string
{
    case MentorAssigned = 'mentor_assigned';
    case RescheduleApproved = 'reschedule_approved';
    case RescheduleRejected = 'reschedule_rejected';
    case RescheduleRequested = 'reschedule_requested';
    case ScheduleAssigned = 'schedule_assigned';
    case ScheduleReassigned = 'schedule_reassigned';
    case ScheduleUpdated = 'schedule_updated';
}
