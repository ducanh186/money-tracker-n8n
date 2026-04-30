const _monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

String getCurrentMonth() {
  final now = DateTime.now();
  return '${_monthNames[now.month - 1]}-${now.year}';
}

List<String> getRecentMonths([int count = 12]) {
  final now = DateTime.now();
  return List.generate(count, (index) {
    final date = DateTime(now.year, now.month - index, 1);
    return '${_monthNames[date.month - 1]}-${date.year}';
  });
}

String formatMonthLabel(String month) {
  final parts = month.split('-');
  if (parts.length != 2) return month;
  final index = _monthNames.indexOf(parts[0]);
  if (index == -1) return month;
  return 'Tháng ${(index + 1).toString().padLeft(2, '0')}, ${parts[1]}';
}

String compactMonthLabel(String month) {
  final parts = month.split('-');
  if (parts.length != 2) return month;
  final index = _monthNames.indexOf(parts[0]);
  if (index == -1) return month;
  return 'Th ${index + 1}/${parts[1]}';
}
