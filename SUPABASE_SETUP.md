# Supabase + AI Assistant Setup

Follow these steps to enable authentication, cloud profiles, and the built-in AI assistant.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose a name (e.g. `peptide-tracker`), set a database password, pick a region
4. Wait for the project to finish provisioning

## 2. Run the database schema

1. In Supabase Dashboard → **SQL Editor** → **New query**
2. Copy the entire contents of `supabase/schema.sql` from this repo
3. Click **Run**

This creates `profiles` and `chat_messages` tables, RLS policies, and an auto-profile trigger on signup.

## 3. Enable email auth

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. **Disable "Confirm email"** under **Authentication** → **Providers** → **Email** → turn off **Confirm email** (signup goes straight to onboarding)

## 4. Get your API keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL` (base URL only, e.g. `https://abc123.supabase.co` — **do not** include `/rest/v1/`)
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 5. Local development

```bash
cd recomp-tracker
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Restart the dev server:

```bash
npm run dev
```

> **Note:** The AI assistant `/api/chat` endpoint works on Vercel production. For local AI testing, run `npx vercel dev` with `OPENAI_API_KEY` set.

## 6. OpenAI API key (AI Assistant)

1. Create an API key at [platform.openai.com](https://platform.openai.com/api-keys)
2. Add to **Vercel** → your project → **Settings** → **Environment Variables**:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-...`
   - Apply to Production (and Preview if desired)

**Do not** prefix with `VITE_` — this key must stay server-side only.

## 7. Deploy to Vercel

Add the Supabase env vars in Vercel too:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `OPENAI_API_KEY` | Your OpenAI API key |

Redeploy after adding variables.

## 8. Test the flow

1. Visit your deployed URL
2. **Sign up** with email + password
3. Complete the **5-question onboarding** + username
4. Land on the **Assistant** tab (Grok-style chat)
5. Ask: *"I'm on 4mg Retatrutide weekly — update my stack"*
6. Check **Profile** to confirm auto-updates

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redirects to `/setup` | Add `VITE_SUPABASE_*` env vars and redeploy |
| "AI assistant not configured" | Add `OPENAI_API_KEY` in Vercel env vars |
| Username taken | Pick a different username during onboarding |
| Profile not saving | Check Supabase **Logs** and confirm RLS policies ran |
| 404 on page refresh | Vercel rewrites in `vercel.json` should handle this — redeploy |

## Medical disclaimer

This app provides educational information only. It is not medical advice. Users must consult a licensed healthcare provider before using peptides or changing their training protocol.