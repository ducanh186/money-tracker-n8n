import 'dart:convert';

import 'package:http/http.dart' as http;

const defaultApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://almoneytracker.live/api',
);

class ApiClient {
  ApiClient({
    http.Client? httpClient,
    this.baseUrl = defaultApiBaseUrl,
  }) : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;
  final String baseUrl;

  Future<Map<String, Object?>> getJson(
    String path, {
    Map<String, String>? queryParameters,
  }) async {
    final normalizedBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final uri = Uri.parse(
      '$normalizedBaseUrl$path',
    ).replace(queryParameters: queryParameters);
    final response = await _httpClient.get(
      uri,
      headers: const {'Accept': 'application/json'},
    );
    final contentType = response.headers['content-type'] ?? 'unknown';

    if (response.statusCode != 200) {
      throw ApiException(
        'GET $uri failed with status ${response.statusCode} ($contentType)',
      );
    }

    if (!contentType.contains('json')) {
      throw ApiException(
        'GET $uri returned $contentType: ${_responseSnippet(response.body)}',
      );
    }

    try {
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, Object?>) {
        throw ApiException('GET $uri returned an unsupported JSON shape');
      }
      return decoded;
    } on FormatException {
      throw ApiException(
        'GET $uri returned invalid JSON: ${_responseSnippet(response.body)}',
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
