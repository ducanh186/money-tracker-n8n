<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ETag / Conditional GET middleware.
 *
 * For GET responses, computes an ETag from the response body.
 * If client sends If-None-Match header matching the ETag,
 * returns 304 Not Modified — saving bandwidth and CPU (no JSON re-serialization on client).
 *
 * Apply to read-heavy endpoints: dashboard, budget-plan, jars, transactions.
 */
class ETagMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only apply to successful GET responses with content
        if ($request->method() !== 'GET' || $response->getStatusCode() !== 200) {
            return $response;
        }

        $content = $response->getContent();
        if (empty($content)) {
            return $response;
        }

        // Generate ETag from content hash
        $etag = '"' . md5($content) . '"';
        $response->headers->set('ETag', $etag);

        // Also set Cache-Control for browser caching
        if (!$response->headers->has('Cache-Control') || $response->headers->get('Cache-Control') === 'no-cache, private') {
            // Allow private caching for 30 seconds, must revalidate after
            $response->headers->set('Cache-Control', 'private, must-revalidate, max-age=30');
        }

        // Check If-None-Match from client
        $ifNoneMatch = $request->header('If-None-Match');
        if ($ifNoneMatch && $ifNoneMatch === $etag) {
            // Data hasn't changed — return 304 with no body
            return response('', 304)
                ->withHeaders([
                    'ETag' => $etag,
                    'Cache-Control' => $response->headers->get('Cache-Control'),
                ]);
        }

        return $response;
    }
}
