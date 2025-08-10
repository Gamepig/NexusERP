<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\QuoteFilterPreset;

class QuoteFilterPresetController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $presets = QuoteFilterPreset::where('company_id', $user->current_company_id)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get(['id','name','filters','is_default','shared']);
        return response()->json(['data' => $presets]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'filters' => 'required|array',
        ]);
        $user = Auth::user();
        // 公司層級共用，user_id 僅記錄建立者
        $preset = QuoteFilterPreset::create([
            'user_id' => $user->id,
            'company_id' => $user->current_company_id,
            'name' => $validated['name'],
            'filters' => $validated['filters'],
            'shared' => true,
            'is_default' => (bool)$request->boolean('is_default'),
        ]);
        if ($preset->is_default) {
            QuoteFilterPreset::where('company_id', $user->current_company_id)
                ->where('id','!=',$preset->id)
                ->update(['is_default' => false]);
        }
        return response()->json(['data' => $preset], 201);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        QuoteFilterPreset::where('company_id', $user->current_company_id)->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}


