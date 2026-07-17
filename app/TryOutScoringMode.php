<?php

namespace App;

enum TryOutScoringMode: string
{
    case RawScore = 'raw_score';
    case NegativeMarking = 'negative_marking';
}
