# Family Medical Core API

Full-stack web application: **Next.js** frontend + **FastAPI** backend with CI/CD pipeline deployed to GCP.

---

## Project Structure / Төслийн бүтэц

```
hackathon/
├── client/                 # Next.js frontend
│   ├── app/                # App Router pages & layouts
│   │   ├── layout.tsx      # Root layout (fonts, global styles)
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Tailwind CSS + CSS variables
│   ├── public/             # Static assets
│   ├── next.config.ts      # Next.js configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── postcss.config.mjs  # PostCSS (Tailwind) config
│   ├── eslint.config.mjs   # ESLint configuration
│   └── package.json        # Dependencies & scripts
│
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── config.py       # Settings (env vars via pydantic-settings)
│   │   ├── database.py     # SQLAlchemy engine, session, Base
│   │   └── utils/
│   │       └── logger.py   # Custom logger (console + file)
│   ├── alembic/            # Database migrations
│   ├── tests/
│   │   └── test_main.py    # API tests
│   ├── requirements.txt    # Python dependencies
│   ├── Makefile            # Dev commands
│   └── .env.example        # Environment variable template
│
└── .github/workflows/
    ├── ci.yml              # Lint, test, build
    └── deploy.yml          # Deploy to GCP VM
```

---

## Prerequisites / Шаардлагатай зүйлс

| Tool | Version | Install |
|------|---------|---------|
| **Python** | 3.13+ | https://www.python.org/downloads/ |
| **Bun** | latest | https://bun.sh |
| **PostgreSQL** | 14+ | https://www.postgresql.org/download/ |
| **Git** | latest | https://git-scm.com |

---

## Getting Started / Эхлэх

### 1. Clone the repo / Репо татах

```bash
git clone https://github.com/NarantsogtB/grow-with-google-team.git
cd grow-with-google-team
```

### 2. Server Setup / Сервер тохируулах

```bash
cd server

# Create virtual environment / Виртуал орчин үүсгэх
python3 -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows

# Install dependencies / Сангууд суулгах
make install
# эсвэл: pip install -r requirements.txt

# Create .env file / .env файл үүсгэх
cp .env.example .env
# Then edit .env with your actual values
# Дараа нь .env файлыг өөрийн утгуудаар засна
```

**.env file format / .env файлын загвар:**

```env
DATABASE_URL=postgresql://user:password@localhost/family_medical_db
JWT_SECRET=your-jwt-secret
ENV=development
GOOGLE_API_KEY=your-google-api-key
```

```bash
# Run database migrations / Мэдээллийн сангийн шилжилт хийх
make migrate msg="initial"

# Start dev server / Dev сервер асаах
make dev
# Server runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3. Client Setup / Клиент тохируулах

```bash
cd client

# Install dependencies / Сангууд суулгах
bun install

# Start dev server / Dev сервер асаах
bun dev
# Client runs at http://localhost:3000
```

---

## Makefile Commands / Makefile командууд

Run these from `server/` directory:

| Command | Description (EN) | Тайлбар (MN) |
|---------|-------------------|---------------|
| `make help` | Show all commands | Бүх командуудыг харуулах |
| `make install` | Install dependencies | Сангууд суулгах |
| `make add pkg='package'` | Add a new package | Шинэ санг нэмэх |
| `make freeze` | Update requirements.txt | requirements.txt шинэчлэх |
| `make dev` | Start with hot-reload | Hot-reload-тай асаах |
| `make start` | Start production mode | Production горимоор асаах |
| `make test` | Run tests | Тест ажиллуулах |
| `make migrate msg="name"` | Run DB migration | DB шилжилт хийх |
| `make clean` | Clean temp files | Түр файлуудыг устгах |

---

## Client Scripts / Клиент командууд

Run these from `client/` directory:

| Command | Description (EN) | Тайлбар (MN) |
|---------|-------------------|---------------|
| `bun dev` | Start dev server | Dev сервер асаах |
| `bun run build` | Production build | Production build хийх |
| `bun run start` | Start production | Production горимоор асаах |
| `bun run lint` | Run ESLint | ESLint ажиллуулах |

---

## CI/CD Pipeline

The project uses **GitHub Actions** with two workflows:

**CI (`ci.yml`)** — Runs on push/PR to `main`:
- **Lint Client** — ESLint check via Bun
- **Build Client** — Next.js production build
- **Test Server** — pytest with SQLite test DB

**Deploy (`deploy.yml`)** — Runs on push to `main`:
1. Runs full CI pipeline
2. SSH into GCP VM
3. Pulls latest code
4. Installs dependencies, runs migrations
5. Restarts services via PM2

### Required GitHub Secrets / Шаардлагатай GitHub Secrets

| Secret | Description (EN) | Тайлбар (MN) |
|--------|-------------------|---------------|
| `VM_IP` | GCP VM IP address | GCP VM-ийн IP хаяг |
| `VM_USERNAME` | SSH username | SSH хэрэглэгчийн нэр |
| `VM_SSH_KEY` | SSH private key | SSH нууц түлхүүр |
| `DATABASE_URL` | PostgreSQL connection URL | PostgreSQL холболтын URL |
| `JWT_SECRET` | JWT signing secret | JWT нууц түлхүүр |
| `ENV` | Environment name | Орчны нэр (production) |
| `GOOGLE_API_KEY` | Google AI API key | Google AI API түлхүүр |

---

## Dependencies / Сангууд

### Server (Python)

| Package | Purpose (EN) | Зориулалт (MN) | Docs |
|---------|--------------|-----------------|------|
| **FastAPI** | Web framework | Вэб фреймворк | https://fastapi.tiangolo.com |
| **Uvicorn** | ASGI server | ASGI сервер | https://www.uvicorn.org |
| **SQLAlchemy** | ORM / Database toolkit | ORM / Мэдээллийн сангийн хэрэгсэл | https://docs.sqlalchemy.org |
| **SQLModel** | SQLAlchemy + Pydantic models | SQLAlchemy + Pydantic загварууд | https://sqlmodel.tiangolo.com |
| **Alembic** | Database migrations | Мэдээллийн сангийн шилжилт | https://alembic.sqlalchemy.org |
| **Pydantic** | Data validation | Өгөгдөл шалгах | https://docs.pydantic.dev |
| **pydantic-settings** | Settings from env vars | Тохиргоо (.env файлаас) | https://docs.pydantic.dev/latest/concepts/pydantic_settings/ |
| **psycopg2-binary** | PostgreSQL driver | PostgreSQL драйвер | https://www.psycopg.org/docs/ |
| **python-jose** | JWT tokens | JWT токен | https://python-jose.readthedocs.io |
| **passlib** + **bcrypt** | Password hashing | Нууц үг хэшлэх | https://passlib.readthedocs.io |
| **LangGraph** | AI agent workflows | AI агентын ажлын урсгал | https://langchain-ai.github.io/langgraph/ |
| **LangChain** | LLM framework | LLM фреймворк | https://python.langchain.com |
| **langchain-google-genai** | Google Gemini integration | Google Gemini холболт | https://python.langchain.com/docs/integrations/chat/google_generative_ai/ |
| **pytest** | Testing framework | Тест фреймворк | https://docs.pytest.org |
| **Faker** | Fake test data | Хуурамч тест дата | https://faker.readthedocs.io |
| **httpx** | Async HTTP client | Async HTTP клиент | https://www.python-httpx.org |

### Client (TypeScript)

| Package | Purpose (EN) | Зориулалт (MN) | Docs |
|---------|--------------|-----------------|------|
| **Next.js** 16 | React framework (App Router) | React фреймворк | https://nextjs.org/docs |
| **React** 19 | UI library | UI сан | https://react.dev |
| **Tailwind CSS** 4 | Utility-first CSS | CSS фреймворк | https://tailwindcss.com/docs |
| **TypeScript** 5 | Type-safe JavaScript | Төрөлтэй JavaScript | https://www.typescriptlang.org/docs/ |
| **ESLint** 9 | Code linting | Код шалгагч | https://eslint.org/docs/latest/ |

### DevOps / CI/CD

| Tool | Purpose (EN) | Зориулалт (MN) | Docs |
|------|--------------|-----------------|------|
| **GitHub Actions** | CI/CD pipeline | CI/CD шугам | https://docs.github.com/en/actions |
| **PM2** | Process manager (on VM) | Процесс менежер | https://pm2.keymetrics.io/docs/ |
| **Bun** | JS runtime & package manager | JS runtime & package manager | https://bun.sh/docs |

---

## API Endpoints / API цэгүүд

| Method | Path | Description (EN) | Тайлбар (MN) |
|--------|------|-------------------|---------------|
| GET | `/api` | Health check | Сервер ажиллаж байгааг шалгах |

Full interactive docs available at `/docs` (Swagger UI) when the server is running.

Сервер ажиллаж байх үед `/docs` хаягаар Swagger UI-ээр бүх API-г харах боломжтой.

---

## Git Workflow / Git ажлын урсгал

```bash
# Create a new feature branch / Шинэ feature branch үүсгэх
git checkout -b feature/your-feature

# Make changes, then commit / Өөрчлөлт хийгээд commit хийх
git add .
git commit -m "feat: describe your change"

# Push and create PR / Push хийгээд PR үүсгэх
git push origin feature/your-feature
# Then create a Pull Request on GitHub
# Дараа нь GitHub дээр Pull Request үүсгэнэ
```

CI runs automatically on every PR. Deploy runs when merged to `main`.

PR бүр дээр CI автоматаар ажилна. `main` руу merge хийхэд deploy ажиллана.
