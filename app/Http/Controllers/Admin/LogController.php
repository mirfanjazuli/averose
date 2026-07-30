<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Carbon\CarbonInterface;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    public function index(): Response
    {
        $logs = ActivityLog::query()
            ->latest()
            ->limit(500)
            ->get();

        return Inertia::render('admin/logs/index', [
            'logs' => $logs->map(fn (ActivityLog $log): array => [
                'action' => $log->action,
                'createdAt' => $log->created_at ? $this->formatTimestamp($log->created_at) : null,
                'description' => $log->description,
                'id' => $log->id,
                'ipAddress' => $log->ip_address,
                'method' => $log->method,
                'path' => $log->path,
                'properties' => $log->properties,
                'routeName' => $log->route_name,
                'statusCode' => $log->status_code,
                'userAgent' => $log->user_agent,
                'userEmail' => $log->user_email,
                'userName' => $log->user_name,
                'userRole' => $log->user_role,
            ]),
            'summary' => [
                'created' => $logs->where('action', 'Create')->count(),
                'deactivated' => $logs->where('action', 'Deactivate')->count(),
                'login' => $logs->where('action', 'Login')->count(),
                'logout' => $logs->where('action', 'Logout')->count(),
                'updated' => $logs->where('action', 'Update')->count(),
            ],
        ]);
    }

    private function formatTimestamp(CarbonInterface $timestamp): string
    {
        return $timestamp->format('d M Y, H:i:s');
    }
}
