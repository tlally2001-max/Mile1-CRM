# Gmail Authentication + Email Templates — Implementation Plan

## Status: PENDING — Waiting on Google Workspace admin approval

---

## What We're Building
- Google Sign-In so Tom and Deneane each log in with their mile1.com accounts
- CRM automatically scopes data to the logged-in agent
- Email template dropdown (Intro, Follow-up, Break-up) that sends real emails via Gmail API from the agent's own account

## Agent Email Mapping
- Tom → `tom.lally@mile1.com` → agent = "Tom"
- Deneane → `deneane.clementi@mile1.com` → agent = "Deneane"

---

## Blocker: Google Workspace Admin
Email sent to Workspace admin requesting:
> Enable "Allow users to authorize third-party apps" in Google Admin Console → Security → Access and data control → API controls

Admin Console path: **admin.google.com → Security → Access and data control → API controls**

Once approved, proceed to Step 1 below.

---

## Step 1: Google Cloud Console Setup (do this once)
1. Go to https://console.cloud.google.com (log in with tlally2001@gmail.com)
2. Create project: "Mile1 CRM"
3. Enable Gmail API (APIs & Services → Library → Gmail API → Enable)
4. OAuth Consent Screen:
   - User type: External
   - App name: Mile1 CRM
   - Scopes: `gmail.send`, `email`, `profile`
   - Test users: `tom.lally@mile1.com`, `deneane.clementi@mile1.com`
5. Create Credentials → OAuth Client ID → Web Application
   - Authorized JavaScript origins:
     - `https://mile1-crm.vercel.app`
     - `http://localhost`
6. Copy the **Client ID** and paste it into the chat to proceed

---

## Step 2: Code Implementation (after Client ID received)
All work done on a **feature branch** (`gmail-auth`) — main site stays live and untouched.

### Files to Create
- `Login.html` — Google Sign-In page

### Files to Modify
- `Index.html` — auth guard, user widget, agent-scoped dashboard
- `Properties.html` — auth guard, agent-scoped property list, remove agent filter
- `PropertyDetail.html` — auth guard, email template dropdown, Gmail API send
- `LogCall.html` — auth guard only
- `AddProperty.html` — auth guard only

---

## Email Templates (placeholder content — update before launch)

### Intro
**Subject:** Solar Energy Partnership — {{property_name}}
**To:** {{pm_name}} at property manager's email address
**Body:** Introduces solar program, mentions {{units}} units, asks for 15-min call.

### Follow-up
**Subject:** Following Up — Solar Program for {{property_name}}
**Body:** References prior outreach, reiterates value, invites brief call.

### Break-up
**Subject:** Last Outreach — {{property_name}} Solar Program
**Body:** Politely closes outreach, leaves door open.

---

## Safety Approach
- Feature branch: `gmail-auth`
- Test URL: Vercel preview (auto-generated for each branch)
- Live site (`mile1-crm.vercel.app`) stays untouched until fully tested
- Only merge to `main` when Tom and Deneane both confirm it works

---

## Next Steps When Ready
1. Workspace admin confirms OAuth is enabled
2. Complete Google Cloud Console setup → get Client ID
3. Paste Client ID into chat
4. Build begins on feature branch
