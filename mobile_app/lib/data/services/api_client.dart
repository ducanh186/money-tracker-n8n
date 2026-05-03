import 'dart:convert';

import 'package:http/http.dart' as http;

const defaultApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://almoneytracker.live/api',
);

class ApiClient {
  ApiClient({http.Client? httpClient, this.baseUrl = defaultApiBaseUrl})
    : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;
  final String baseUrl;

  Future<Map<String, Object?>> getJson(
    String path, {
    Map<String, String>? queryParameters,
  }) async {
    final uri = _buildUri(path, queryParameters: queryParameters);
    final response = await _httpClient.get(
      uri,
      headers: const {'Accept': 'application/json'},
    );
    return _readJsonResponse(response, uri, expectedMethod: 'GET');
  }

  Future<Map<String, Object?>> postJson(String path, {Object? body}) {
    return _sendJson('POST', path, body: body);
  }

  Future<Map<String, Object?>> putJson(String path, {Object? body}) {
    return _sendJson('PUT', path, body: body);
  }

  Uri _buildUri(String path, {Map<String, String>? queryParameters}) {
    final normalizedBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    return Uri.parse(
      '$normalizedBaseUrl$path',
    ).replace(queryParameters: queryParameters);
  }

  Future<Map<String, Object?>> _sendJson(
    String method,
    String path, {
    Object? body,
    Map<String, String>? queryParameters,
  }) async {
    final uri = _buildUri(path, queryParameters: queryParameters);
    final response = switch (method) {
      'POST' => await _httpClient.post(
        uri,
        headers: const {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body ?? const <String, Object?>{}),
      ),
      'PUT' => await _httpClient.put(
        uri,
        headers: const {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body ?? const <String, Object?>{}),
      ),
      _ => throw ApiException('Unsupported method $method for $uri'),
    };

    return _readJsonResponse(response, uri, expectedMethod: method);
  }

  Map<String, Object?> _readJsonResponse(
    http.Response response,
    Uri uri, {
    required String expectedMethod,
  }) {
    final contentType = response.headers['content-type'] ?? 'unknown';

    if (response.statusCode < 200 || response.statusCode >= 300) {
      if (contentType.contains('json')) {
        try {
          final decoded = jsonDecode(response.body);
          if (decoded is Map<String, Object?>) {
            final message = decoded['message'] as String?;
            throw ApiException(
              message ??
                  '$expectedMethod $uri failed with status ${response.statusCode}',
            );
          }
        } on FormatException {
          // Fall through to the generic error below.
        }
      }

      throw ApiException(
        '$expectedMethod $uri failed with status ${response.statusCode} ($contentType)',
      );
    }

    if (!contentType.contains('json')) {
      throw ApiException(
        '$expectedMethod $uri returned $contentType: ${_responseSnippet(response.body)}',
      );
    }

    try {
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, Object?>) {
        throw ApiException(
          '$expectedMethod $uri returned an unsupported JSON shape',
        );
      }
      return decoded;
    } on FormatException {
      throw ApiException(
        '$expectedMethod $uri returned invalid JSON: ${_responseSnippet(response.body)}',
      );
    }
  }
}

String _responseSnippet(String body) {
  final singleLine = body.replaceAll(RegExp(r'\s+'), ' ').trim();
  if (singleLine.length <= 120) return singleLine;
  return '${singleLine.substring(0, 120)}...';
}

class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
