# IDMS Hello AI — AI-Powered Language Assessment

An AI-driven language assessment platform for **English** and **German**, built with Next.js 14, powered by Google Gemini AI.

## Features

- 🎤 **Speaking Assessment** — Record voice, get CEFR score for pronunciation, fluency, grammar
- ✍️ **Writing Assessment** — Write to prompts, get scored on grammar, vocabulary, coherence
- 👂 **Listening Assessment** — Comprehension questions with AI scoring
- 📖 **Reading Assessment** — Passage + questions with AI evaluation
- 🔐 **User Accounts** — Register, login, save assessment history
- 📊 **Dashboard** — View past assessments, score history, skill charts
- 🌍 **Bilingual** — English 🇬🇧 and German 🇩🇪

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (local) / Vercel Postgres (production)
- **ORM**: Prisma
- **Auth**: NextAuth.js (Credentials)
- **AI**: Google Gemini 1.5 Flash
- **Charts**: Recharts
- **Animations**: Framer Motion

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
GEMINI_API_KEY="your-gemini-api-key"
```

**Getting a Gemini API key:**
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy the key to your `.env.local`

### 3. Database Setup

```bash
npx prisma db push
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

For production database, use Vercel Postgres and update `DATABASE_URL`.

## Assessment Skills

| Skill | Languages | CEFR Levels | Time |
|-------|-----------|-------------|------|
| Speaking | EN, DE | A2–C1 | 5–10 min |
| Writing | EN, DE | A2–C1 | 10–15 min |
| Listening | EN, DE | B1 | 5–10 min |
| Reading | EN, DE | B1 | 10–15 min |
