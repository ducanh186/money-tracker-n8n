# Money Tracker API

Read-only REST API built with Laravel that reads transaction data from Google Sheets (`TRANSACTIONS_LOG`) and returns JSON for a web dashboard. No database required.

---

## Features

- **Google Sheets as data source** — reads live data via Google Sheets API v4
- **Filtering** — by `flow`, `jar`, `status`, keyword search (`q`)
- **Pagination** — configurable `page` and `pageSize` (max 200)
- **Sorting** — `datetime_asc` or `datetime_desc` (default)
- **Summary totals** — income, expense, net, ending balance per month
- **Caching** — 60-second server-side cache per unique request
- **Defensive parsing** — missing fields → `null`, invalid amounts → `0`

---

## Prerequisites

- PHP 8.2+
- Composer 2.x
- A Google Cloud Platform project with Sheets API enabled
- A Google Service Account with viewer access to the spreadsheet

---

## Setup

### 1. Clone & install dependencies

```bash
cd api
composer install
cp .env.example .env   # or edit .env directly
php artisan key:generate
```

### 2. Google Cloud setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a project** (or use an existing one)
3. **Enable the Google Sheets API**:
   - APIs & Services → Library → search "Google Sheets API" → Enable
4. **Create a Service Account**:
   - APIs & Services → Credentials → Create Credentials → Service Account
   - Give it a name (e.g., `money-tracker-reader`)
   - No special roles needed
5. **Download the JSON key**:
   - Click the service account → Keys → Add Key → Create new key → JSON
   - Save the downloaded file as `storage/app/google-credentials.json` in the Laravel project
6. **Share the Google Sheet** with the service account email:
   - Open your Google Sheet → Share → paste the service account email (looks like `name@project.iam.gserviceaccount.com`) → grant **Viewer** access

### 3. Configure environment variables

Edit `.env`:

```dotenv
GOOGLE_SHEETS_CREDENTIALS_JSON=storage/app/google-credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_SHEET_NAME=TRANSACTIONS_LOG
```

- `GOOGLE_SHEETS_CREDENTIALS_JSON` — path to the JSON key file (relative to project root), or a raw JSON string
- `GOOGLE_SHEETS_SPREADSHEET_ID` — from the Sheet URL: `https://docs.google.com/spreadsheets/d/{THIS_PART}/edit`
- `GOOGLE_SHEETS_SHEET_NAME` — tab name (default: `TRANSACTIONS_LOG`)

Optional:
```dotenv
GOOGLE_SHEETS_CACHE_TTL=60   # cache duration in seconds
```

### 4. Run the server

```bash
php artisan serve
```

The API will be available at `http://localhost:8000/api/`.

---

## API Endpoints

### `GET /api/transactions`

List transactions for a given month with optional filters.

| Param      | Required | Default          | Description                                |
|------------|----------|------------------|--------------------------------------------|
| `month`    | Yes      | —                | Month filter, e.g. `Feb-2026`             |
| `flow`     | No       | —                | `income`, `expense`, or `transfer`         |
| `jar`      | No       | —                | Jar name (case-insensitive)                |
| `status`   | No       | —                | Status string (case-insensitive)           |
| `q`        | No       | —                | Search keyword in description, note, account |
| `page`     | No       | `1`              | Page number                                |
| `pageSize` | No       | `50`             | Items per page (max 200)                   |
| `sort`     | No       | `datetime_desc`  | `datetime_asc` or `datetime_desc`          |

**Response:**

```json
{
  "data": [
    {
      "date": "2026-02-19",
      "flow": "income",
      "amount_k": 5000,
      "amount_vnd": 5000000,
      "signed_amount_vnd": 5000000,
      "currency": "VND",
      "category": "Salary",
      "description": "Monthly salary",
      "account": "Bank A",
      "jar": "Necessities",
      "balance": 15000000,
      "balance_vnd": 15000000,
      "month": "Feb-2026",
      "status": "confirmed",
      "idempotency_key": "txn_001",
      "note": "Feb salary",
      "datetime": "2026-02-19 10:00:00",
      "datetime_iso": "2026-02-19T10:00:00+00:00",
      "time": "10:00"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 1,
    "totals": {
      "income_vnd": 5000000,
      "expense_vnd": 0,
      "net_vnd": 5000000,
      "ending_balance_vnd": 15000000
    }
  }
}
```

### `GET /api/transactions/{idempotency_key}`

Get a single transaction by its idempotency key.

**Response:**

```json
{
  "data": {
    "date": "2026-02-19",
    "flow": "income",
    "amount_k": 5000,
    "amount_vnd": 5000000,
    "signed_amount_vnd": 5000000,
    "currency": "VND",
    "category": "Salary",
    "description": "Monthly salary",
    "account": "Bank A",
    "jar": "Necessities",
    "balance": 15000000,
    "balance_vnd": 15000000,
    "month": "Feb-2026",
    "status": "confirmed",
    "idempotency_key": "txn_001",
    "note": "Feb salary",
    "datetime": "2026-02-19 10:00:00",
    "datetime_iso": "2026-02-19T10:00:00+00:00",
    "time": "10:00"
  }
}
```

**Error responses:**

| Status | When                       |
|--------|----------------------------|
| `400`  | Missing `month` parameter  |
| `404`  | Idempotency key not found  |
| `500`  | Google Sheets API failure  |

---

## Amount conventions

| Field              | Description                                           |
|--------------------|-------------------------------------------------------|
| `amount_k`         | Raw amount from sheet (in "k", e.g., 2000 = 2,000k)  |
| `amount_vnd`       | `amount_k × 1000`                                     |
| `signed_amount_vnd`| `+amount_vnd` for income, `-amount_vnd` for expense, `0` for transfer |
| `balance_vnd`      | Balance from sheet (already in VND)                   |

---

## Project structure

```
app/
├── Contracts/
│   └── TransactionsRepositoryInterface.php   # Repository contract
├── Http/
│   ├── Controllers/Api/
│   │   └── TransactionsController.php        # API controller
│   └── Resources/
│       └── TransactionResource.php           # JSON transformer
├── Providers/
│   └── GoogleSheetsServiceProvider.php       # DI binding
└── Services/
    └── GoogleSheetsTransactionsRepository.php # Google Sheets reader
config/
└── google_sheets.php                         # Config file
routes/
└── api.php                                   # API routes
tests/Feature/
└── TransactionsApiTest.php                   # 22 feature tests
```

---

## Running tests

```bash
php artisan test
```

Tests use a mocked repository — no Google Sheets credentials needed.

---

## Caching

- Sheet data is cached for 60 seconds (configurable via `GOOGLE_SHEETS_CACHE_TTL`)
- Full API responses are also cached for the same duration per unique filter combination
- Cache driver defaults to `file`; switch to Redis in production for better performance

---

## Future considerations

- Add authentication (Sanctum tokens) for Android app reuse
- Add Redis caching for production workloads
- Consider a webhook-driven cache invalidation from n8n when new transactions are logged
- Rate limiting on API endpoints
