<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use App\UserRole;
use BackedEnum;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use JsonSerializable;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Response;
use UnitEnum;

class RecordActivityLog
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldRecord($request, $response)) {
            $this->record($request, $response);
        }

        return $response;
    }

    private function shouldRecord(Request $request, Response $response): bool
    {
        if (! $request->user()) {
            return false;
        }

        if ($request->is('login', 'logout')) {
            return false;
        }

        if (! $request->isMethodSafe() && $response->getStatusCode() < 500) {
            return ! $request->is('logs*');
        }

        return false;
    }

    private function record(Request $request, Response $response): void
    {
        $user = $request->user();

        ActivityLog::query()->create([
            'action' => $action = $this->action($request),
            'description' => $this->description($request, $action),
            'ip_address' => $request->ip(),
            'method' => $request->method(),
            'path' => $request->path(),
            'properties' => [
                'input' => $this->sanitize($request->except(['_token', '_method'])),
                'referer' => $request->headers->get('referer'),
            ],
            'route_name' => $request->route()?->getName(),
            'status_code' => $response->getStatusCode(),
            'user_agent' => $request->userAgent(),
            'user_email' => $user->email,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
        ]);
    }

    private function action(Request $request): string
    {
        if (str_ends_with((string) $request->route()?->getName(), '.activate') || str_ends_with($request->path(), '/activate')) {
            return 'Activate';
        }

        return match ($request->method()) {
            'POST' => 'Create',
            'PUT', 'PATCH' => 'Update',
            'DELETE' => 'Deactivate',
            default => str($request->method())->lower()->ucfirst()->toString(),
        };
    }

    private function description(Request $request, string $action): string
    {
        $userName = $request->user()?->name ?? 'User';
        $target = $this->target($request);

        return match ($action) {
            'Create' => "{$userName} menambahkan {$target}.",
            'Activate' => "{$userName} mengaktifkan {$target}.",
            'Update' => "{$userName} memperbarui {$target}.",
            'Deactivate' => "{$userName} menonaktifkan {$target}.",
            default => "{$userName} melakukan {$action}.",
        };
    }

    private function target(Request $request): string
    {
        $resource = $this->resourceLabel($request);
        $name = $this->targetName($request);

        if ($name) {
            return "{$resource} {$name}";
        }

        return $resource;
    }

    private function resourceLabel(Request $request): string
    {
        $routeName = $request->route()?->getName() ?? '';
        $path = $request->path();

        return match (true) {
            str_starts_with($routeName, 'zoom-accounts') => 'Zoom account',
            str_contains($routeName, 'public-holidays') => 'public holiday',
            str_contains($routeName, 'working-hours') => 'working hour',
            str_contains($routeName, 'reschedule-requests') => 'reschedule request',
            str_starts_with($routeName, 'schedules') => 'schedule',
            str_starts_with($routeName, 'internal') || str_starts_with($path, 'users/internal') => 'internal user',
            str_starts_with($routeName, 'students') || str_contains($path, 'users/students') => 'student',
            str_starts_with($routeName, 'mentors') || str_contains($path, 'users/mentors') => 'mentor',
            str_starts_with($routeName, 'roles') => 'role',
            str_starts_with($routeName, 'fields') => 'field',
            str_starts_with($routeName, 'programs') => 'program',
            str_starts_with($routeName, 'subjects') => 'subject',
            str_starts_with($routeName, 'admin.try-outs') => 'try out',
            str_starts_with($routeName, 'monitoring.mentor-journals') => 'mentor journal',
            str_starts_with($routeName, 'monitoring.recordings') => 'recording',
            default => str($path)->replace(['/', '-'], ' ')->headline()->lower()->toString(),
        };
    }

    private function targetName(Request $request): ?string
    {
        $name = $request->string('name')->trim()->toString();

        if ($name !== '') {
            return $name;
        }

        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            if (! $parameter instanceof Model) {
                continue;
            }

            foreach (['name', 'title', 'email'] as $attribute) {
                $value = $parameter->getAttribute($attribute);

                if (filled($value)) {
                    return (string) $value;
                }
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function sanitize(array $payload): array
    {
        $sensitiveKeys = [
            'client_secret',
            'current_password',
            'password',
            'password_confirmation',
            'secret',
            'token',
            'token_secret',
        ];

        return collect($payload)
            ->mapWithKeys(function (mixed $value, string $key) use ($sensitiveKeys): array {
                $normalizedKey = strtolower($key);

                if (collect($sensitiveKeys)->contains(fn (string $sensitiveKey): bool => str_contains($normalizedKey, $sensitiveKey))) {
                    return [$key => '[filtered]'];
                }

                if (is_array($value)) {
                    return [$key => $this->sanitize($value)];
                }

                if ($value instanceof UploadedFile) {
                    return [
                        $key => [
                            'name' => $value->getClientOriginalName(),
                            'mime_type' => $value->getClientMimeType(),
                            'size' => $value->getSize(),
                        ],
                    ];
                }

                if ($value instanceof BackedEnum) {
                    return [$key => $value->value];
                }

                if ($value instanceof UnitEnum) {
                    return [$key => $value->name];
                }

                if ($value instanceof JsonSerializable) {
                    return [$key => $value->jsonSerialize()];
                }

                if (is_scalar($value) || is_null($value)) {
                    return [$key => $value];
                }

                return [$key => is_object($value) ? $value::class : (string) $value];
            })
            ->all();
    }
}
