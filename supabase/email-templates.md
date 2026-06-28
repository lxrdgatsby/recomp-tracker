# PeptideTracker — Supabase Email Templates

Customize verification emails in **Supabase Dashboard → Authentication → Email Templates**.

Also set **Site URL** and **Redirect URLs** under **Authentication → URL Configuration**:
- Site URL: `https://your-app.vercel.app` (or `http://localhost:5174` for dev)
- Redirect URLs: add both production and `http://localhost:5174/**`

---

## Confirm signup

**Subject:**
```
Confirm your PeptideTracker account
```

**Body (HTML):**
```html
<h2 style="color:#14b8a6;font-family:sans-serif;">PeptideTracker</h2>
<p style="font-family:sans-serif;color:#333;">Welcome! Confirm your email to start tracking your peptide protocol, workouts, and progress.</p>
<p style="font-family:sans-serif;"><a href="{{ .ConfirmationURL }}" style="background:#14b8a6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Confirm your email</a></p>
<p style="font-family:sans-serif;color:#666;font-size:13px;">If you didn't create a PeptideTracker account, you can ignore this email.</p>
<p style="font-family:sans-serif;color:#999;font-size:12px;">Not medical advice. Consult your healthcare provider.</p>
```

---

## Sender name (optional)

Under **Authentication → Settings**:
- **Sender name:** `PeptideTracker`

For a custom `from` address (e.g. `noreply@yourdomain.com`), configure **Custom SMTP** under **Authentication → SMTP Settings** (requires your own domain + Resend/SendGrid/etc.).

---

## Disable email confirmation (dev only)

To skip verification during testing:
**Authentication → Providers → Email →** disable **Confirm email**

Re-enable before production launch.