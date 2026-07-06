# Growtez ExamOS Monorepo

Welcome to the Growtez ExamOS monorepo. This repository contains the codebase for a highly secure, multi-tenant examination system.

## Architecture

- `apps/web-panel`: Next.js web application for Super Admins and School Admins. Handles subdomain routing (`admin.localhost:3000` and `school.localhost:3000`).
- `apps/desktop-app`: Tauri desktop application for students. Features Windows Kiosk mode stubs and a JEE-like exam interface.
- `packages/ui`: Shared UI components (Tailwind CSS).
- `packages/database`: Supabase client and types.
- `packages/config`: Shared `eslint`, `tsconfig`, and `prettier` configurations.
- `supabase/migrations`: SQL scripts for initial schema and Row Level Security (RLS) policies.

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v9 or higher recommended)
- Rust (for Tauri development)
- Supabase CLI (optional, for local database testing)

## Setup Instructions

1. **Install Dependencies**
   Run the following command at the root of the monorepo to install all dependencies across apps and packages:
   ```bash
   pnpm install
   ```

2. **Run Development Servers**
   To start both the Next.js web panel and the Tauri desktop application in parallel:
   ```bash
   pnpm dev
   ```

3. **Subdomain Routing Testing**
   The Next.js web panel uses middleware for subdomain routing. To test locally, you may need to add entries to your system's `hosts` file (e.g., `C:\Windows\System32\drivers\etc\hosts` on Windows):
   ```
   127.0.0.1 admin.localhost
   127.0.0.1 school.localhost
   ```
   Then navigate to:
   - `http://admin.localhost:3000` (Super Admin Panel)
   - `http://school.localhost:3000` (School Admin Panel)

4. **Tauri Windows Kiosk Stubs**
   The Tauri application includes Rust stubs in `apps/desktop-app/src-tauri/src/main.rs` for Windows-specific features (`WH_KEYBOARD_LL` interception and process enumeration). To compile these features, ensure you are on a Windows environment with the necessary MSVC build tools installed.

5. **Supabase Database Setup**
   The SQL migrations in `supabase/migrations/` define the multi-tenant architecture. 
   - `001_schema.sql` creates tables for schools, users, exams, questions, and results.
   - `002_rls.sql` enforces strict Row Level Security to isolate data by `school_id`.
   You can apply these migrations to your local or remote Supabase project using the Supabase Dashboard or CLI.

## Building for Production

To build all apps and packages:
```bash
pnpm build
```
