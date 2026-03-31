# Voice-to-Text SaaS

A powerful audio processing and transcription platform built with Next.js 15.

## 🚀 Features

- **Transcription**: High-accuracy audio text conversion.
- **Authentication**: Secure user management via [Clerk](https://clerk.com/).
- **Subscription Management**: Recurring billing and usage limits powered by [Stripe](https://stripe.com/).
- **AI-Powered**: Leverages Groq and OpenAI for advanced processing.
- **Database**: PostgreSQL with Prisma ORM (Supabase compatible).

## 🛠 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- Accounts for **Stripe**, **Clerk**, and **Groq** (API keys required)

## 📦 Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

3. **Database Migration**:
   ```bash
   npx prisma db push
   ```

## 🏃 Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## 📜 Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run start`: Start production server.
- `npm run lint`: Run ESLint.
