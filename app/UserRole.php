<?php

namespace App;

enum UserRole: string
{
    case Admin = 'admin';
    case Student = 'student';
    case Mentor = 'mentor';
}
