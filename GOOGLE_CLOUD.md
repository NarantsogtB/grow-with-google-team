# GCP VM Deployment Guide — FamilyDoc-AI (2026)

## Architecture Overview

```
Internet
   │
   ▼
Nginx (port 80/443)
   ├── /api/*        → uvicorn :8000  (FastAPI backend)
   ├── /admin/*      → Next.js  :3000 (Doctor dashboard)
   └── /*            → Next.js  :3002 (Patient portal)
```

All three processes are managed by **PM2**. PostgreSQL runs on **Cloud SQL** (recommended) or as a service on the same VM.

---

## 1. Provision the VM

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **Compute Engine** → **VM instances** → **Create instance**
2. Recommended settings:
   - **Machine type**: `e2-medium` (2 vCPU, 4 GB RAM)
   - **OS**: Ubuntu 24.04 LTS (Noble Numbat), 20 GB SSD
   - **Region**: `asia-east1` (Taiwan) or closest to Mongolia
   - **Allow HTTP/HTTPS traffic**: ✅ checked
3. Under **Networking** → add firewall tag `family-doc`
4. Create a **Firewall rule** for the tag:
   - Source: `0.0.0.0/0`, TCP ports `80,443,8000`

---

## 2. Initial Server Setup

SSH into the VM:

```bash
gcloud compute ssh YOUR_VM_NAME --zone=YOUR_ZONE
```

### Install system packages

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install -y git nginx certbot python3-certbot-nginx \
    python3.13 python3.13-venv python3.13-dev python3-pip build-essential libpq-dev
```

### Install Bun (for Next.js frontend)

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### Install PM2 (process manager)

```bash
bun install -g pm2
pm2 startup systemd   # follow the printed instructions to enable autostart
```

---

## 3. Clone the Repository

```bash
cd ~
git clone https://github.com/NarantsogtB/grow-with-google-team.git
cd grow-with-google-team
```

---

## 4. Backend Setup

```bash
cd ~/grow-with-google-team/server

# Create virtual environment
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Create `.env`

```bash
cat > .env <<EOF
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DB_NAME
JWT_SECRET=your_strong_random_secret_here
ENV=production
GOOGLE_API_KEY=your_gemini_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WHAT3WORDS_API_KEY=your_w3w_api_key
EOF
```

> **Cloud SQL connection string** (if using Cloud SQL):
>
> ```
> DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE
> ```
>
> You also need the Cloud SQL Auth Proxy running. See [cloud.google.com/sql/docs/postgres/connect-compute-engine](https://cloud.google.com/sql/docs/postgres/connect-compute-engine).

### Run migrations

```bash
source .venv/bin/activate
alembic upgrade head
```

### Start with PM2

```bash
mkdir -p logs
pm2 start "source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000" \
    --name health-api \
    --error ./logs/server.log \
    --output ./logs/uvicorn.log
pm2 save
```

---

## 5. Admin Frontend Setup

```bash
cd ~/grow-with-google-team/admin
bun install

# Create environment file
echo "NEXT_PUBLIC_API_URL=https://your-domain.com" > .env.local

bun run build
pm2 start "bun run start -- --port 3000" --name admin
pm2 save
```

---

## 6. Patient Portal Setup

```bash
cd ~/grow-with-google-team/portal
bun install

echo "NEXT_PUBLIC_API_URL=https://your-domain.com" > .env.local

bun run build
pm2 start "bun run start -- --port 3002" --name portal
pm2 save
```

---

## 7. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/familydoc
```

Paste the following (replace `your-domain.com` with your domain or VM public IP):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;
    }

    # Admin dashboard
    location /admin/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Patient portal (default)
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/familydoc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 8. SSL with Let's Encrypt

Requires a domain name pointing to your VM's public IP.

```bash
sudo certbot --nginx -d your-domain.com
# Follow prompts — certbot will edit nginx config and install certs automatically
sudo systemctl reload nginx
```

Auto-renewal is already set up by certbot. Verify with:

```bash
sudo certbot renew --dry-run
```

---

## 9. Telegram Webhook

After SSL is set up, register the Telegram webhook:

```bash
curl -X POST "https://your-domain.com/api/v1/telegram/set-webhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/api/v1/telegram/webhook"}'
```

---

## 10. GitHub Actions Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name          | Value                                             |
| -------------------- | ------------------------------------------------- |
| `VM_IP`              | Your VM's external IP address                     |
| `VM_USERNAME`        | SSH username (usually `your-google-account`)      |
| `VM_SSH_KEY`         | Contents of your SSH private key                  |
| `DATABASE_URL`       | Full `postgresql+asyncpg://...` connection string |
| `JWT_SECRET`         | Same strong random secret as on the VM            |
| `ENV`                | `production`                                      |
| `GOOGLE_API_KEY`     | Google Gemini API key                             |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token                                |
| `WHAT3WORDS_API_KEY` | What3Words API key                                |

The deploy workflow (`.github/workflows/deploy.yml`) runs automatically on every push to `main`.

---

## 11. Updating the Deployment (manual)

```bash
cd ~/grow-with-google-team
git pull origin main

# Backend
cd server
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
pm2 restart health-api

# Admin
cd ../admin
bun install
bun run build
pm2 restart admin

# Portal
cd ../portal
bun install
bun run build
pm2 restart portal
```

---

## 12. Health Checks & Logs

```bash
# Check all running processes
pm2 list

# Live logs
pm2 logs health-api
pm2 logs admin
pm2 logs portal

# Backend health
curl http://localhost:8000/health

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 13. CORS Configuration

The backend (`server/app/main.py`) allows these origins by default:

- `http://localhost:3000`, `http://localhost:3002`
- `http://127.0.0.1:3000`, `http://127.0.0.1:3002`
- `http://136.114.215.236` (current VM IP)

After setting up a domain, add it to `allow_origins` in `server/app/main.py`:

```python
"https://your-domain.com",
```

Then redeploy.

---

## 14. PostgreSQL on the VM (alternative to Cloud SQL)

If not using Cloud SQL, install PostgreSQL directly on the VM:

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo -u postgres psql <<SQL
CREATE USER familydoc WITH PASSWORD 'strong_password';
CREATE DATABASE family_medical_db OWNER familydoc;
\q
SQL
```

Update `.env`:

```
DATABASE_URL=postgresql+asyncpg://familydoc:strong_password@localhost/family_medical_db
```

---

## Quick Reference

| Service          | Port   | PM2 name     | Start command                                     |
| ---------------- | ------ | ------------ | ------------------------------------------------- |
| FastAPI backend  | 8000   | `health-api` | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| Admin (Next.js)  | 3000   | `admin`      | `bun run start -- --port 3000`                    |
| Portal (Next.js) | 3002   | `portal`     | `bun run start -- --port 3002`                    |
| Nginx            | 80/443 | systemd      | `sudo systemctl start nginx`                      |
