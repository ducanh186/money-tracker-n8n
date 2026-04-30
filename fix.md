# FIX — Thêm "Vay / Trả nợ" và Loại khỏi Budget Plan

> File workflow phân tích: `tracking_money.json` (đã xoá phiên bản cũ `tracking_money (1).json`).
> Mục tiêu:
> 1. Thêm category vay / trả nợ vào pipeline n8n (Telegram → Google Sheets).
> 2. Web (BE Laravel + FE React) **không** đếm các giao dịch vay/trả vào kế hoạch hũ (Budget Plan / Budget Status / Dashboard summary).

---

## 1. Phân tích workflow hiện tại

### 1.1 Luồng n8n (`tracking_money.json`)
```
Webhook (VCB SMS từ MacroDroid)
  → Edit Fields → Build dedup_source → Crypto SHA256
  → Dedup gate (TTL 7d) → IF Is Duplicate?
  → Parse VCB notification         (mặc định category = "Uncategorized")
  → Get jar mapping row (sheet SETUP_N8N, lookup theo category)
  → Jar fallback (gắn jar = cột `hu` từ SETUP_N8N)
  → Append TRANSACTIONS_LOG (Google Sheets)
  → Needs classify? (nếu category còn là Uncategorized)
       → Telegram hỏi "Bạn có muốn thêm note?" (Y/N)
            ├─ Y → Ask Note Text → Update Note in Sheet
            └─ N → Read Categories → Build Category Keyboard
                → Send Category Options → user chọn category
                → Update row in sheet (category, status=categorized)
```

### 1.2 Bảng SETUP_N8N (cột `category`, `hu`, `cat_code`)
- Jar hiện tại trong `Build Category Keyboard`:
  `INCOME` (treat khác — chỉ hiện ở flow=income), còn lại (`NEC, EDU, LTSS, PLAY, FFA, GIVE`) hiện ở flow=expense.
- HIDE list: `["Transfer", "Uncategorized"]`.
- Không có jar nào dành riêng cho **vay / trả nợ** → giao dịch vay/trả hiện đang lọt vào jar thường (vd. NEC, FFA…) và **bị tính vào kế hoạch**.

### 1.3 Web side — chỗ lọt bug
| File | Chỗ cần loại trừ |
|---|---|
| `api/app/Http/Controllers/Api/BudgetPlanController.php` (dòng 62–79) | Vòng lặp cộng `sheetIncome` và `actualByJar`. |
| `api/app/Http/Controllers/Api/DashboardController.php` `summary()` (dòng 66–90) | Tính `incomeVnd / expenseVnd / byJar`. |
| `api/app/Http/Controllers/Api/DashboardController.php` `budgetStatus()` (dòng 189–202) | Tính `sheetIncome / totalExpense / expenseByJar`. |
| `api/app/Http/Controllers/Api/TransactionsController.php` `computeTotals()` (dòng 195–222) | Tổng `income / expense / net` ở list giao dịch. |

Cả 4 chỗ trên đều dùng cùng một quy ước: nếu `flow === 'income'` thì cộng vào income, `flow === 'expense'` thì cộng vào expense theo jar. **Cần một filter chung** để bỏ qua dòng có jar = `LOAN`.

---

## 2. Đề xuất thay đổi

### 2.1 Quy ước jar mới: `LOAN` (chuyên cho vay/trả nợ)

Lý do dùng **jar** thay vì chỉ thêm category lẻ:
- Backend Laravel đã group theo cột `jar` ở sheet (`row['jar']`). Lọc theo jar = 1 chỗ duy nhất, không phải maintain danh sách category.
- Telegram keyboard cũng filter theo jar (`INCOME` vs phần còn lại) → thêm jar mới rất nhẹ.

#### Categories thuộc jar `LOAN` (đặt trong sheet SETUP_N8N):
| category (EN) | hu (jar) | cat_code | flow áp dụng | Ý nghĩa |
|---|---|---|---|---|
| `Loan In` | `LOAN` | L01 | income | Vay/mượn người khác → tiền vào |
| `Loan Repayment` | `LOAN` | L02 | expense | Trả nợ đã vay → tiền ra |
| `Loan Out` | `LOAN` | L03 | expense | Cho người khác vay → tiền ra |
| `Loan Recovery` | `LOAN` | L04 | income | Thu lại nợ đã cho vay → tiền vào |

> Có thể rút gọn còn 2 category (`Vay` / `Trả nợ`) nếu chỉ track 1 chiều. 4 dòng trên là phương án đầy đủ.

### 2.2 Sửa workflow n8n

#### a) Sheet `SETUP_N8N`
Thêm 4 hàng mới với `hu = LOAN` như bảng trên.

#### b) Node `Build Category Keyboard` (file workflow, jsCode)
Hiện code chỉ tách 2 nhóm:
```js
const isIncomeJar = (j) => String(j || "").trim().toUpperCase() === "INCOME";
if (flow === "income")  rows = rows.filter(r => isIncomeJar(r.jar));
else if (flow === "expense") rows = rows.filter(r => !isIncomeJar(r.jar));
```
**Sửa thành** (LOAN xuất hiện ở cả 2 flow):
```js
const isIncomeJar = (j) => String(j || "").trim().toUpperCase() === "INCOME";
const isLoanJar   = (j) => String(j || "").trim().toUpperCase() === "LOAN";

// Loan categories chỉ hiện ở flow đúng nghĩa (Loan In/Recovery → income; Repayment/Out → expense)
const LOAN_INCOME_CATS = new Set(["Loan In", "Loan Recovery"]);
const LOAN_EXPENSE_CATS = new Set(["Loan Repayment", "Loan Out"]);

if (flow === "income") {
  rows = rows.filter(r => isIncomeJar(r.jar) || (isLoanJar(r.jar) && LOAN_INCOME_CATS.has(r.category)));
} else if (flow === "expense") {
  rows = rows.filter(r => (!isIncomeJar(r.jar) && !isLoanJar(r.jar)) || (isLoanJar(r.jar) && LOAN_EXPENSE_CATS.has(r.category)));
}
```

#### c) Bổ sung icon trong `ICON` map (cùng node)
```js
"Loan In":         "🤝",
"Loan Repayment":  "💳",
"Loan Out":        "📤",
"Loan Recovery":   "📥",
```

#### d) Node `Get jar mapping row`
Không phải sửa — đã `lookupColumn: category`, sẽ tự lookup ra `hu = LOAN` khi khớp.

#### e) **Không** chỉnh các node Append/Update sheet
Sheet TRANSACTIONS_LOG vẫn ghi cột `jar = LOAN`. Web sẽ căn cứ vào đây.

---

### 2.3 Sửa Web (Backend Laravel)

Tạo 1 helper duy nhất + dùng lại ở 4 chỗ.

#### a) Tạo `api/app/Support/TransactionFilters.php`
```php
<?php
namespace App\Support;

class TransactionFilters
{
    /** Jar key dành cho vay/trả nợ — không tính vào budget plan. */
    public const LOAN_JAR = 'LOAN';

    /** Trả về true nếu dòng giao dịch là vay/trả nợ và phải bỏ qua khi tính budget. */
    public static function isLoan(array $row): bool
    {
        return mb_strtoupper(trim($row['jar'] ?? '')) === self::LOAN_JAR;
    }
}
```

#### b) `BudgetPlanController.php` (sửa vòng `foreach ($rows as $row)`, dòng ~64)
```php
foreach ($rows as $row) {
    if (\App\Support\TransactionFilters::isLoan($row)) continue;   // ← thêm dòng này
    $flow = mb_strtolower(trim($row['flow'] ?? ''));
    // ... giữ nguyên phần còn lại
}
```

#### c) `DashboardController.php` `summary()` (vòng dòng ~66) và `budgetStatus()` (vòng dòng ~189)
Thêm dòng `continue` tương tự ở đầu vòng for.

#### d) `TransactionsController.php` `computeTotals()` (vòng dòng ~200)
Thêm `continue` tương tự — để totals (income/expense/net) trên màn Transactions cũng không cộng dồn vay/trả.

> ⚠️ Lưu ý: ở `TransactionsController::index()` **không lọc** ra khỏi list — user vẫn thấy giao dịch vay/trả trong bảng, chỉ là không cộng vào tổng. Có thể thêm filter `?exclude_loan=1` riêng nếu cần.

#### e) (Tuỳ chọn) Tóm tắt vay/trả trong response Budget Plan
Trong `BudgetPlanController` thêm aggregate riêng:
```php
$loan = ['in' => 0, 'out' => 0, 'repayment' => 0, 'recovery' => 0];
foreach ($rows as $row) {
    if (!\App\Support\TransactionFilters::isLoan($row)) continue;
    $cat = trim($row['category'] ?? '');
    $amtVnd = abs($this->parseNumeric($row['amount'] ?? null)) * 1000;
    match ($cat) {
        'Loan In'        => $loan['in']        += $amtVnd,
        'Loan Repayment' => $loan['repayment'] += $amtVnd,
        'Loan Out'       => $loan['out']       += $amtVnd,
        'Loan Recovery'  => $loan['recovery']  += $amtVnd,
        default          => null,
    };
}
$loan['net_owed'] = ($loan['in'] - $loan['repayment']) - ($loan['out'] - $loan['recovery']);
```
Trả về trong `data.loan_summary`. FE có thể hiển thị badge "Đang nợ X / Đang cho vay Y" dưới phần Budget Plan.

---

### 2.4 Sửa Web (Frontend React)

#### a) `src/lib/types.ts`
Mở rộng type `BudgetPlanResponse.data` thêm `loan_summary?: { in: number; out: number; repayment: number; recovery: number; net_owed: number }`.

#### b) `src/views/BudgetPlan.tsx`
Thêm 1 callout/banner phía trên grid hũ, ví dụ:
```tsx
{plan?.loan_summary && (plan.loan_summary.in + plan.loan_summary.out > 0) && (
  <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 px-3 py-2 text-sm">
    💳 Đã loại {formatCurrency(plan.loan_summary.in + plan.loan_summary.repayment + plan.loan_summary.out + plan.loan_summary.recovery)} giao dịch vay/trả khỏi kế hoạch.
    Số đang nợ: <b>{formatCurrency(Math.max(0, plan.loan_summary.net_owed))}</b>
  </div>
)}
```

#### c) `src/views/Transactions.tsx`
Hiển thị badge `LOAN` cho dòng có `jar === 'LOAN'` (không cần filter mặc định).

---

## 3. Cache invalidation
Sau khi deploy:
- Xoá cache budget: `php artisan cache:clear` (hoặc tự hết hạn theo TTL `google_sheets.cache_ttl`).
- n8n: kích hoạt lại workflow để pick up bản mới.

## 4. Test plan
1. **n8n**: pin 1 SMS giả → chạy đến node Telegram → thử chọn `Loan In` ở keyboard income, `Loan Repayment` ở expense → kiểm tra sheet TRANSACTIONS_LOG: cột `jar = LOAN`, `category` đúng.
2. **BudgetPlan**: gọi `GET /api/budget-plan?month=Mar-2026` trước/sau khi có 1 dòng `Loan Repayment` 500k → giá trị `actual_amount` của các hũ NEC/EDU/… **không đổi**, `sheet_income` không tăng khi thêm `Loan In`.
3. **Dashboard**: `/api/dashboard/summary` & `/api/budget-status` cũng không đổi.
4. **Transactions**: `GET /api/transactions?month=Mar-2026` vẫn trả về dòng vay/trả; `meta.totals.income_vnd / expense_vnd` **không bao gồm** chúng.
5. **FE**: render `BudgetPlan.tsx` → thấy banner loan_summary; bar hũ không bị tăng khi có giao dịch vay.

---

## 5. Tổng kết thay đổi

| Layer | File | Hành động |
|---|---|---|
| Sheet | `Monthly Budget` › `SETUP_N8N` | Thêm 4 hàng category với `hu = LOAN` |
| n8n | `tracking_money.json` › node `Build Category Keyboard` | Sửa filter theo jar + thêm icon |
| BE | `api/app/Support/TransactionFilters.php` | **Mới** |
| BE | `api/app/Http/Controllers/Api/BudgetPlanController.php` | `continue` khi `isLoan` (+ optional `loan_summary`) |
| BE | `api/app/Http/Controllers/Api/DashboardController.php` | `continue` ở `summary()` & `budgetStatus()` |
| BE | `api/app/Http/Controllers/Api/TransactionsController.php` | `continue` ở `computeTotals()` |
| FE | `src/lib/types.ts` | Thêm `loan_summary` |
| FE | `src/views/BudgetPlan.tsx` | Banner loan_summary |
| FE | `src/views/Transactions.tsx` | Badge `LOAN` (tuỳ chọn) |

Không động database — không cần migration. Tất cả thay đổi backend đều ở **runtime filter**, không cần seed lại jars (jar `LOAN` chỉ tồn tại trong Google Sheets, không cần thêm vào bảng `jars` vì không có % phân bổ).
