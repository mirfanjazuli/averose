<?php

namespace App;

enum TryOutQuestionType: string
{
    case SingleChoice = 'single_choice';
    case MultipleAnswer = 'multiple_answer';
    case NumericAnswer = 'numeric_answer';
}
