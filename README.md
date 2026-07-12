# ParikshaOS Monorepo

Welcome to the ParikshaOS monorepo (formerly Growtez ExamOS). This repository contains the codebase for a highly secure, multi-tenant examination system designed for schools, teachers, and students.

## Architecture & Features

- `apps/web-panel`: Next.js web application for Super Admins, School Admins, and Teachers. Handles subdomain routing (`admin.localhost:3000` and `school.localhost:3000`). Features include:
  - **Super Admin Dashboard**: Manage schools, billing (Razorpay), exam templates, and global analytics.
  - **School Admin Dashboard**: Manage teachers, students, exam scheduling, subject limits, and question paper/result PDF generation.
  - **Teacher Dashboard**: A restricted view allowing teachers to strictly manage and upload questions only for their assigned subjects.
- `apps/desktop-app`: Tauri desktop application for students. Features Windows Kiosk mode stubs and a JEE-like exam interface that supports MCQ and NAT type questions, with features for strict offline handling and progress syncing.
- `packages/ui`: Shared UI components (Tailwind CSS).
- `packages/database`: Supabase client and types.
- `packages/config`: Shared `eslint`, `tsconfig`, and `prettier` configurations.
- `supabase/migrations`: SQL scripts for initial schema and Row Level Security (RLS) policies.

## Technologies Used

- **Frontend**: Next.js (App Router), React, Tailwind CSS, Lucide React
- **Desktop**: Tauri (Rust + React)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Razorpay Integration
- **PDF Generation**: html2pdf.js & @react-pdf/renderer

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
   - `http://school.localhost:3000` (School Admin Panel / Teacher Panel)

4. **Tauri Windows Kiosk Stubs**
   The Tauri application includes Rust stubs in `apps/desktop-app/src-tauri/src/main.rs` for Windows-specific features (`WH_KEYBOARD_LL` interception and process enumeration). To compile these features, ensure you are on a Windows environment with the necessary MSVC build tools installed.

5. **Supabase Database Setup**
   The SQL migrations in `supabase/migrations/` define the multi-tenant architecture. 
   - Apply these migrations to your local or remote Supabase project using the Supabase Dashboard or CLI.
   - Configure `.env.local` in `apps/web-panel` with your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and Razorpay keys.

## Building for Production

To build all apps and packages:
```bash
pnpm build
```
