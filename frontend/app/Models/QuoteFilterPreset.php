<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuoteFilterPreset extends Model
{
    protected $fillable = [
        'user_id', 'company_id', 'name', 'filters', 'shared', 'is_default'
    ];

    protected $casts = [
        'filters' => 'array',
        'shared' => 'boolean',
        'is_default' => 'boolean',
    ];
}


