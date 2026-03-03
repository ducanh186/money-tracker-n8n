<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Always return JSON for API routes (never HTML error pages)
        $exceptions->shouldRenderJsonWhen(function (\Illuminate\Http\Request $request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // Render all exceptions as structured JSON on API routes
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                $response = [
                    'error'   => class_basename($e),
                    'message' => $e->getMessage() ?: 'Internal Server Error',
                ];

                // Include trace in debug mode
                if (config('app.debug')) {
                    $response['trace'] = array_slice($e->getTrace(), 0, 5);
                    $response['file']  = $e->getFile();
                    $response['line']  = $e->getLine();
                }

                return response()->json($response, $status);
            }
        });
    })->create();
