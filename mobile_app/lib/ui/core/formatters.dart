String formatCurrency(num value) {
  final sign = value < 0 ? '-' : '';
  final raw = value.abs().round().toString();
  final grouped = raw.replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => '.',
  );
  return '$sign$grouped ₫';
}

String formatCompactCurrency(num value) {
  final abs = value.abs();
  final sign = value < 0 ? '-' : '';
  if (abs >= 1000000) {
    final text = (abs / 1000000).toStringAsFixed(1).replaceAll('.0', '');
    return '$sign${text}M';
  }
  if (abs >= 1000) {
    return '$sign${(abs / 1000).round()}K';
  }
  return '$sign${abs.round()}';
}

String formatSignedAmount(int amount, Object? flow) {
  final sign = flow.toString().contains('income') ? '+' : '-';
  return '$sign${formatCurrency(amount)}';
}
