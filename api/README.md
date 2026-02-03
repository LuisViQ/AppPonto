# API setup

## 1) Install deps

cd api
npm install

## 2) Configure env

Copy api/.env.example to api/.env and set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.

## 3) Create database + tables

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS appponto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p appponto < api/sql/schema.sql

If the DB already exists, run the migration for idempotency:

mysql -u root -p appponto < api/sql/migrations/001_add_client_event_id.sql

For the weekly schedule model (weekday instead of work_date):

mysql -u root -p appponto < api/sql/migrations/002_weekday_schedule.sql

## 4) Run

npm run dev

API will listen on http://localhost:3000

## 5) App config

Set EXPO_PUBLIC_API_BASE_URL in the app environment.
Android emulator: http://10.0.2.2:3000
Device: http://YOUR_LAN_IP:3000
