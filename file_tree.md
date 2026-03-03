# File Tree: money-tracker-n8n

**Root Path:** `d:\CODE\money-tracker-n8n`

```
├── 📁 api
│   ├── 📁 app
│   │   ├── 📁 Contracts
│   │   │   └── 🐘 TransactionsRepositoryInterface.php
│   │   ├── 📁 Http
│   │   │   ├── 📁 Controllers
│   │   │   │   ├── 📁 Api
│   │   │   │   │   └── 🐘 TransactionsController.php
│   │   │   │   └── 🐘 Controller.php
│   │   │   └── 📁 Resources
│   │   │       └── 🐘 TransactionResource.php
│   │   ├── 📁 Models
│   │   │   └── 🐘 User.php
│   │   ├── 📁 Providers
│   │   │   ├── 🐘 AppServiceProvider.php
│   │   │   └── 🐘 GoogleSheetsServiceProvider.php
│   │   └── 📁 Services
│   │       └── 🐘 GoogleSheetsTransactionsRepository.php
│   ├── 📁 bootstrap
│   │   ├── 🐘 app.php
│   │   └── 🐘 providers.php
│   ├── 📁 config
│   │   ├── 🐘 app.php
│   │   ├── 🐘 auth.php
│   │   ├── 🐘 cache.php
│   │   ├── 🐘 cors.php
│   │   ├── 🐘 database.php
│   │   ├── 🐘 filesystems.php
│   │   ├── 🐘 google_sheets.php
│   │   ├── 🐘 logging.php
│   │   ├── 🐘 mail.php
│   │   ├── 🐘 queue.php
│   │   ├── 🐘 services.php
│   │   └── 🐘 session.php
│   ├── 📁 database
│   │   ├── 📁 factories
│   │   │   └── 🐘 UserFactory.php
│   │   ├── 📁 migrations
│   │   │   ├── 🐘 0001_01_01_000000_create_users_table.php
│   │   │   ├── 🐘 0001_01_01_000001_create_cache_table.php
│   │   │   └── 🐘 0001_01_01_000002_create_jobs_table.php
│   │   ├── 📁 seeders
│   │   │   └── 🐘 DatabaseSeeder.php
│   │   └── ⚙️ .gitignore
│   ├── 📁 public
│   │   ├── ⚙️ .htaccess
│   │   ├── 📄 favicon.ico
│   │   ├── 🐘 index.php
│   │   └── 📄 robots.txt
│   ├── 📁 resources
│   │   ├── 📁 css
│   │   │   └── 🎨 app.css
│   │   ├── 📁 js
│   │   │   ├── 📄 app.js
│   │   │   └── 📄 bootstrap.js
│   │   └── 📁 views
│   │       └── 🐘 welcome.blade.php
│   ├── 📁 routes
│   │   ├── 🐘 api.php
│   │   ├── 🐘 console.php
│   │   └── 🐘 web.php
│   ├── 📁 storage
│   │   ├── 📁 app
│   │   │   ├── 📁 private
│   │   │   │   └── ⚙️ .gitignore
│   │   │   ├── 📁 public
│   │   │   │   └── ⚙️ .gitignore
│   │   │   └── ⚙️ .gitignore
│   │   └── 📁 framework
│   │       ├── 📁 sessions
│   │       │   └── ⚙️ .gitignore
│   │       ├── 📁 testing
│   │       │   └── ⚙️ .gitignore
│   │       ├── 📁 views
│   │       │   └── ⚙️ .gitignore
│   │       └── ⚙️ .gitignore
│   ├── 📁 tests
│   │   ├── 📁 Feature
│   │   │   ├── 🐘 ExampleTest.php
│   │   │   └── 🐘 TransactionsApiTest.php
│   │   ├── 📁 Unit
│   │   │   └── 🐘 ExampleTest.php
│   │   └── 🐘 TestCase.php
│   ├── ⚙️ .editorconfig
│   ├── ⚙️ .gitattributes
│   ├── ⚙️ .gitignore
│   ├── 🐳 Dockerfile
│   ├── 📝 README.md
│   ├── 📄 artisan
│   ├── ⚙️ composer.json
│   ├── ⚙️ package.json
│   ├── ⚙️ phpunit.xml
│   └── 📄 vite.config.js
├── 📁 deploy
│   ├── 📁 nginx
│   │   └── ⚙️ default.conf
│   ├── 📝 README.md
│   ├── 📄 deploy.sh
│   └── ⚙️ docker-compose.yml
├── 📁 n8n
│   └── ⚙️ docker-compose.yml
├── 📁 src
│   ├── 📁 components
│   │   ├── 📄 Header.tsx
│   │   ├── 📄 Sidebar.tsx
│   │   └── 📄 TransactionDetails.tsx
│   ├── 📁 lib
│   │   ├── 📄 api.ts
│   │   ├── 📄 hooks.ts
│   │   ├── 📄 types.ts
│   │   └── 📄 utils.ts
│   ├── 📁 views
│   │   ├── 📄 JarStats.tsx
│   │   ├── 📄 Jars.tsx
│   │   ├── 📄 Overview.tsx
│   │   └── 📄 Transactions.tsx
│   ├── 📄 App.tsx
│   ├── 🎨 index.css
│   └── 📄 main.tsx
├── ⚙️ .gitignore
├── 📝 README.md
├── ⚙️ almoneytracker-n8n-1c0d48d7ab8e.json
├── ⚙️ client_secret_2_884044595094-pho7msuvc2s2t0rlamv3ivvnsq18atfc.apps.googleusercontent.com.json
├── 🌐 index.html
├── ⚙️ metadata.json
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── ⚙️ tsconfig.json
└── 📄 vite.config.ts
```

---
