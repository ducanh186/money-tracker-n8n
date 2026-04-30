import 'package:flutter/material.dart';

import '../../../data/models/money_models.dart';
import '../../core/formatters.dart';

class QuickCaptureSheet extends StatefulWidget {
  const QuickCaptureSheet({super.key});

  @override
  State<QuickCaptureSheet> createState() => _QuickCaptureSheetState();
}

class _QuickCaptureSheetState extends State<QuickCaptureSheet> {
  String _amount = '50000';
  TransactionFlow _flow = TransactionFlow.expense;
  String _jarKey = 'NEC';

  int get _displayAmount => int.tryParse(_amount) ?? 0;

  void _tap(String key) {
    setState(() {
      if (key == 'back') {
        _amount = _amount.length <= 1
            ? '0'
            : _amount.substring(0, _amount.length - 1);
        return;
      }
      if (key == '000') {
        _amount = _amount == '0' ? '0' : '${_amount}000';
        return;
      }
      _amount = _amount == '0' ? key : '$_amount$key';
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final amountColor = switch (_flow) {
      TransactionFlow.income => Colors.green.shade500,
      TransactionFlow.expense => Colors.red.shade400,
      TransactionFlow.transfer => Theme.of(context).colorScheme.primary,
    };
    final sign = switch (_flow) {
      TransactionFlow.income => '+',
      TransactionFlow.expense => '-',
      TransactionFlow.transfer => '',
    };

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.65,
        maxChildSize: 0.95,
        builder: (context, controller) {
          return DecoratedBox(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
            ),
            child: ListView(
              controller: controller,
              padding: EdgeInsets.zero,
              children: [
                const SizedBox(height: 8),
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 14, 12, 8),
                  child: Row(
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Hủy'),
                      ),
                      Expanded(
                        child: Text(
                          'Thêm giao dịch',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      IconButton(
                        tooltip: 'Đóng',
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text.rich(
                      TextSpan(
                        text:
                            '$sign${formatCurrency(_displayAmount).replaceAll(' ₫', '')}',
                        children: const [
                          TextSpan(
                            text: ' VND',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: amountColor,
                        fontSize: 56,
                        fontWeight: FontWeight.w800,
                        height: 1,
                      ),
                    ),
                  ),
                ),
                _FlowToggle(
                  flow: _flow,
                  onChanged: (flow) => setState(() => _flow = flow),
                ),
                if (_flow != TransactionFlow.income)
                  _JarPicker(
                    selectedKey: _jarKey,
                    onChanged: (key) => setState(() => _jarKey = key),
                  ),
                const Padding(
                  padding: EdgeInsets.fromLTRB(20, 4, 20, 6),
                  child: TextField(
                    decoration: InputDecoration(
                      labelText: 'Mô tả',
                      hintText: 'Ví dụ: Cà phê sáng',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                _Numpad(onTap: _tap),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  child: FilledButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Lưu giao dịch'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FlowToggle extends StatelessWidget {
  const _FlowToggle({required this.flow, required this.onChanged});

  final TransactionFlow flow;
  final ValueChanged<TransactionFlow> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: SegmentedButton<TransactionFlow>(
        segments: const [
          ButtonSegment(value: TransactionFlow.expense, label: Text('Chi')),
          ButtonSegment(value: TransactionFlow.income, label: Text('Thu')),
          ButtonSegment(value: TransactionFlow.transfer, label: Text('Chuyển')),
        ],
        selected: {flow},
        onSelectionChanged: (selected) => onChanged(selected.first),
      ),
    );
  }
}

class _JarPicker extends StatelessWidget {
  const _JarPicker({required this.selectedKey, required this.onChanged});

  final String selectedKey;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Hũ',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              Text(
                'Gợi ý: NEC',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final entry in jarDefinitions.entries) ...[
                  ChoiceChip(
                    label: Text(entry.key),
                    avatar: Icon(entry.value.icon, size: 16),
                    selected: selectedKey == entry.key,
                    onSelected: (_) => onChanged(entry.key),
                  ),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Numpad extends StatelessWidget {
  const _Numpad({required this.onTap});

  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    const keys = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '000',
      '0',
      'back',
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: keys.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          mainAxisExtent: 52,
        ),
        itemBuilder: (context, index) {
          final key = keys[index];
          return OutlinedButton(
            onPressed: () => onTap(key),
            child: key == 'back'
                ? const Icon(Icons.backspace_outlined)
                : Text(
                    key,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          );
        },
      ),
    );
  }
}
