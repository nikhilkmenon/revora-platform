# REVORA: Production Railway Deployment Guide

I have successfully engineered and tested the complete, production-ready NestJS backend for REVORA based entirely on the hardened `antigravity_railway_architecture_FIXED.md` specification. 

The source code is fully compiled, validated, and ready to be pushed to Railway. It features:
- **NestJS + Prisma + PostgreSQL** architecture.
- **Argon2id** password hashing and secure JWT HTTP-Only refresh token rotation.
- **Razorpay Integration** with strict HMAC-SHA256 webhook signature verification.
- **RBAC** (Role-Based Access Control) for Buyers, Designers, Suppliers, and Admins.
- **Dockerized** using a secure, non-root `appuser` multi-stage build.

Here is the step-by-step process to deploy this manually on Railway.

---

## Phase 1: Provision Third-Party Services
Before deploying, you must create accounts and gather API keys for the external services REVORA depends on.

### 1. Razorpay (Payments)
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) > **Settings** > **API Keys**.
2. Generate a new key pair (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`).
3. Go to **Webhooks**, create a new webhook pointing to `https://<YOUR_RAILWAY_URL>/api/v1/payments/webhook`.
4. Select the events: `payment.captured` and `payment.failed`.
5. Enter a strong secret of your choice (`RAZORPAY_WEBHOOK_SECRET`).

### 2. Cloudinary (Media Storage)
1. Create an account at [Cloudinary](https://cloudinary.com/).
2. From the dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.

### 3. Google Cloud Console (OAuth)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a Project > **APIs & Services** > **Credentials**.
3. Create OAuth Client ID (Web Application).
4. Set Authorized redirect URIs to: `https://<YOUR_RAILWAY_URL>/api/v1/auth/google/callback`.
5. Copy the **Client ID** and **Client Secret**.

### 4. Optional but Recommended (for later)
- **Meilisearch Cloud**: For fast product searching.
- **OpenAI**: For AI-powered auto-tagging.
- **Resend & Twilio**: For email and SMS notifications.
- **Sentry**: For production error tracking.

---

## Phase 2: Setup Railway Infrastructure

1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** → **Empty Project**.
3. **Provision Database**:
   - Inside your project, click **Create** → **Database** → **PostgreSQL**.
   - Railway will automatically provision it.
4. **Provision Redis**:
   - Click **Create** → **Database** → **Redis**.

---

## Phase 3: Push the API Code

1. In your terminal, navigate to the newly created backend folder:
   ```bash
   cd "/Users/nikhilkmenon/Desktop/REVORA WEBSITE/revora-api"
   ```
2. Initialize a Git repository and push it to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial production backend commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/revora-api.git
   git push -u origin main
   ```
3. In your Railway Project, click **Create** → **GitHub Repo** and select your `revora-api` repository.
4. Railway will detect the `Dockerfile` and start building automatically. *It will fail initially because the environment variables are missing.*

---

## Phase 4: Configure Environment Variables

1. In Railway, click on your **revora-api** service.
2. Go to the **Variables** tab.
3. Add the following variables (copy values from your `.env.example` file and third-party dashboards):

**App & DB Config**
- `NODE_ENV` = `production`
- `PORT` = `3000`
- `DATABASE_URL` = *(Click "Reference Variable" in Railway and select the PostgreSQL `DATABASE_URL`)*
- `DIRECT_URL` = *(Same as DATABASE_URL for now, unless using Prisma Accelerate)*
- `REDIS_URL` = *(Click "Reference Variable" and select the Redis `REDIS_URL`)*

**Security Secrets**
- `JWT_ACCESS_SECRET` = *(Generate a random string: e.g., `openssl rand -hex 32`)*
- `JWT_REFRESH_SECRET` = *(Generate a DIFFERENT random string)*
- `JWT_ACCESS_EXPIRY` = `15m`
- `JWT_REFRESH_EXPIRY` = `7d`

**External Integrations**
- `RAZORPAY_KEY_ID` = *Your Razorpay ID*
- `RAZORPAY_KEY_SECRET` = *Your Razorpay Secret*
- `RAZORPAY_WEBHOOK_SECRET` = *Your webhook secret*
- `GOOGLE_CLIENT_ID` = *Your Google OAuth ID*
- `GOOGLE_CLIENT_SECRET` = *Your Google OAuth Secret*
- `GOOGLE_CALLBACK_URL` = `https://<YOUR_RAILWAY_APP_DOMAIN>/api/v1/auth/google/callback`

*(Add Cloudinary, Meilisearch, Sentry, etc., as you configure them).*

---

## Phase 5: Database Migration & Deployment

1. Once the variables are set, Railway will automatically trigger a redeploy.
2. **Apply the Schema**: We need to tell the Railway database what tables to create. 
   - Wait for the deployment to succeed.
   - Go to your Railway **revora-api** service → **Settings** → **Deploy** → **Custom Build Command**.
   - Change it to: `npm run prisma:generate && npm run build`
   - Change the **Start Command** to: `npm run prisma:migrate && npm run start:prod`
   *(This ensures migrations run automatically on startup).*

3. **Expose to the Web**:
   - Go to the **Settings** tab of your `revora-api` service.
   - Scroll down to **Networking** → **Public Networking**.
   - Click **Generate Domain**. Railway will give you a URL like `revora-api-production.up.railway.app`.
   - *Update your Razorpay Webhook URL and Google Callback URL with this new domain.*

---

## Phase 6: Final Verification

To verify that your deployment is perfectly healthy, visit your newly generated Railway domain at the health check endpoint:

**`https://<YOUR_RAILWAY_DOMAIN>/api/v1/health/deep`**

You should see:
```json
{
  "status": "ok",
  "db": "ok",
  "timestamp": "2026-05-15T12:00:00.000Z"
}
```

Congratulations! Your secure, microservice-ready backend is now live on Railway.
