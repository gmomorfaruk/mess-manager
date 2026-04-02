# 🍽️ MessManager

A modern, clean hostel/student mess management web app built with **Next.js 14**, **Tailwind CSS**, and **Supabase**.

## Features

- ✅ Google Sign-In via Supabase Auth
- ✅ Three roles: **Admin**, **Manager**, **Member**
- ✅ Fixed meal system (admin sets morning/lunch/dinner values once)
- ✅ Daily meal entry with checkbox UI (no typing numbers)
- ✅ Daily bazar/cost entry
- ✅ Member deposit management
- ✅ Automatic monthly calculations:
  - Total cost, total meals, meal rate
  - Per-member cost and balance
- ✅ Personal member dashboard
- ✅ Monthly summary with print support
- ✅ Responsive design — works on mobile & desktop
- ✅ Row Level Security on all Supabase tables

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 14 App Router | Frontend framework |
| Tailwind CSS | Styling |
| Supabase | Database + Auth |
| Lucide React | Icons |
| React Hot Toast | Notifications |
| date-fns | Date utilities |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd mess-manager
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the Supabase dashboard, go to **SQL Editor**
3. Copy the contents of `supabase-schema.sql` and run it
4. Go to **Authentication → Providers** and enable **Google**
   - Set the redirect URL to: `https://your-domain.com/auth/callback`
   - For local dev: `http://localhost:3000/auth/callback`

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Supabase Dashboard → Settings → API

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Push your code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add the two environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

Make sure to add your Vercel URL to Supabase's allowed redirect URLs:
- Supabase Dashboard → Authentication → URL Configuration
- Add: `https://your-app.vercel.app/auth/callback`

---

## How It Works

### Mess Setup Flow

1. First user signs in with Google → lands on `/setup`
2. Creates a new mess → becomes **Admin**
3. Admin goes to **Members** and adds members (with emails)
4. Other members sign in with Google → their accounts are auto-linked by email

### Meal Calculation

Admin sets meal values once (e.g. Morning=0.5, Lunch=1, Dinner=1).

Manager marks daily checkboxes. The system calculates:

```
Member meals = Σ (morning × 0.5 + lunch × 1 + dinner × 1) per day
Meal rate    = Total monthly cost ÷ Total monthly meals
Member cost  = Member total meals × Meal rate
Balance      = Member deposits − Member cost
```

### User Roles

| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| Create/edit mess settings | ✅ | ❌ | ❌ |
| Manage members | ✅ | ❌ | ❌ |
| Enter daily meals | ✅ | ✅ | ❌ |
| Enter bazar costs | ✅ | ✅ | ❌ |
| Add deposits | ✅ | ✅ | ❌ |
| View full dashboard | ✅ | ✅ | ❌ |
| View own dashboard | ✅ | ✅ | ✅ |

---

## Project Structure

```
src/
├── app/
│   ├── login/           # Google sign-in page
│   ├── setup/           # New user onboarding
│   ├── dashboard/       # Admin/Manager dashboard
│   ├── summary/         # Monthly summary table
│   ├── member/          # Personal member dashboard
│   ├── admin/
│   │   ├── members/     # Member management
│   │   └── settings/    # Mess & meal settings
│   ├── manager/
│   │   ├── daily-entry/ # Meal + bazar entry
│   │   └── deposits/    # Deposit management
│   └── auth/callback/   # Supabase auth callback
├── components/
│   ├── layout/          # Sidebar, MobileHeader, AppShell
│   └── ui/              # StatCard, MonthPicker, Modal, etc.
├── hooks/
│   └── useAuth.tsx      # Auth context
├── lib/
│   ├── supabase/        # Client, server, middleware
│   └── utils.ts         # Calculations & helpers
└── types/
    └── index.ts         # TypeScript types
```

---

## Auto Account Linking

When admin adds a member with an email, and that member signs in with Google using the same email, the app automatically links their Google account to the member record.

This is handled in the middleware/layout — it checks if the logged-in user's email matches any `mess_members.email` record without a `user_id`, and links them.

> **To implement full auto-linking**, add this to your Supabase `handle_new_user` trigger or call it from the `/auth/callback` route.

---

## Currency

The app uses **৳ (Bangladeshi Taka)** by default. To change currency symbol, search and replace `৳` in the codebase.

---

## License

MIT — free to use and modify.
# mess-manager
# mess-manager
# mess-manager
