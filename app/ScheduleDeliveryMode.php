<?php

namespace App;

enum ScheduleDeliveryMode: string
{
    case Online = 'online';
    case Offline = 'offline';
}
