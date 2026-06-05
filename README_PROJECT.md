# FamilyDoc-AI — Гэрийн эмчийн AI туслах систем

## 1. Төслийн тухай

### Асуудал
Монгол улсад өрхийн эмч нар ажлын өдөр бүр олон оршин суугчийн гэрт очиж үзлэг хийдэг. Энэ "гэрийн эргэлт" гэгддэг үйл ажиллагаанд дараах бэрхшээлүүд тулгардаг:

- **Маршрут тооцоолол**: Эмч өвчтөнүүдийн байршлаар хамгийн богино замаар явах дарааллыг гараар тооцоолдог — цаг хугацаа алддаг
- **Баталгаажуулалт**: Өвчтөн гэртээ байгаа эсэхийг урьдчилан мэдэхгүйгээр очдог — дэмий явдал гардаг
- **Үзлэгийн тэмдэглэл**: Эмч үзлэгийн дараа SOAP тэмдэглэл гараар бичдэг — хугацаа их зардаг
- **Хяналт**: Өдөрт хэн, хэзээ үзэгдсэнийг хянах тохиромжтой хэрэгсэл байдаггүй

### Шийдэл
**FamilyDoc-AI** нь эдгээр асуудлыг AI технологи ашиглан шийдэх систем юм:

- Telegram-ээр өмнөх өдрийн баталгаажуулалт автоматаар явуулна
- Google Maps холбогдолтой оновчтой маршрут гаргана
- Хоолойн бичлэгийг SOAP тэмдэглэл болгон хөрвүүлнэ
- Бүх үзлэгийн түүхийг хадгалж, харуулна

### Хэнд зориулагдсан
- **Өрхийн эмч нар** — гэрийн эргэлт хийдэг эмч нарт зориулсан мобайл-оптимизированд дашбоард (`admin/`)
- **Өвчтөнүүд** — харьяа эмнэлэгт бүртгүүлэх, хуваарь харах вэб порталь (`portal/`)

---

## 2. Системийн бүтэц

```
hackathon/
├── server/          ← FastAPI backend (Python 3.13)
├── admin/           ← Эмчийн дашбоард (Next.js 16)
└── portal/          ← Өвчтөний порталь (Next.js 16)
```

### Давхрааны загвар (Layered Architecture)

```
┌─────────────────────────────────────┐
│  admin/ порт:3000    portal/ порт:3002  │  ← Хэрэглэгчийн интерфэйс
└─────────────────┬───────────────────┘
                  │ HTTP / REST API
┌─────────────────▼───────────────────┐
│         FastAPI (порт:8000)          │  ← API давхарга
│  /api/v1/patients  /api/v1/doctors   │
│  /api/v1/visit-plans  /api/v1/agent  │
└─────────────────┬───────────────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
┌────▼───┐  ┌────▼────┐  ┌───▼──────┐
│Services│  │  AI/LLM  │  │Repositories│
│Business│  │LangGraph │  │DB Access  │
│Logic   │  │+ Gemini  │  │SQLAlchemy │
└────────┘  └──────────┘  └──────────┘
                                │
                    ┌───────────▼──────────┐
                    │  PostgreSQL Database  │
                    └──────────────────────┘
```

---

## 3. Технологийн стек

### Backend
| Технологи | Хувилбар | Зориулалт |
|-----------|---------|-----------|
| **Python** | 3.13 | Үндсэн хэл |
| **FastAPI** | 0.115+ | REST API framework — асинхрон, автомат OpenAPI баримт |
| **SQLAlchemy** | 2.x async | ORM — Python объектыг SQL хүснэгттэй холбодог |
| **Alembic** | — | Датабаасын схем өөрчлөлт (migration) |
| **PostgreSQL** | — | Үндсэн датабааз — production |
| **asyncpg** | 0.30 | Async PostgreSQL драйвер |
| **aiosqlite** | 0.20 | Async SQLite — тестэд зориулсан |
| **Pydantic** | v2 | Request/Response баталгаажуулалт |
| **pydantic-settings** | — | .env файлаас тохиргоо ачаалах |
| **python-jose** | — | JWT токен үүсгэх, шалгах |
| **passlib[bcrypt]** | — | Нууц үг хаш хийх |
| **httpx** | — | Async HTTP — Telegram, What3Words API дуудлага |

### AI / Machine Learning
| Технологи | Зориулалт |
|-----------|-----------|
| **Google Gemini** (`gemini-3.1-flash-lite`) | SOAP тэмдэглэл үүсгэх, санаа ангилах |
| **google-genai SDK** (шинэ) | Gemini API клиент |
| **LangGraph** | AI workflow граф — олон алхамт логик удирдах |
| **Web Speech API** (browser) | Дуу → текст (Speech-to-Text), Монгол хэл (`mn-MN`) |

### Frontend
| Технологи | Зориулалт |
|-----------|-----------|
| **Next.js 16** + **React 19** | UI framework, SSR/SSG |
| **TypeScript** | Статик типийн шалгалт |
| **Tailwind CSS 4** | Utility-first CSS |
| **Bun** | Package manager, build tool (npm-с хурдан) |
| **Lucide React** | Icon library |
| **Sonner** | Toast мэдэгдэл |
| **React Hook Form** + **Zod** | Маягт баталгаажуулалт (portal) |

### Дэд бүтэц
| Технологи | Зориулалт |
|-----------|-----------|
| **Telegram Bot API** | Өвчтөнтэй харилцах мессеж |
| **What3Words API** | 3×3м нарийвчлалтай байршил (ирээдүйн хэрэгжилт) |
| **Google Maps deep link** | Маршрут навигаци |
| **GitHub Actions** | CI/CD pipeline |
| **Docker** | Контейнер |
| **GCP VM** | Production серверт байршуулалт |

---

## 4. Хавтасны бүтэц

### Backend (`server/`)
```
server/
├── app/
│   ├── core/
│   │   ├── config.py        ← .env тохиргоо (Pydantic Settings)
│   │   ├── database.py      ← AsyncSession factory
│   │   └── security.py      ← JWT үүсгэх/шалгах, bcrypt
│   ├── models/              ← SQLAlchemy ORM загварууд
│   │   ├── patient.py
│   │   ├── doctor.py
│   │   ├── hospital.py
│   │   ├── schedule.py
│   │   ├── daily_visit_plan.py
│   │   └── consultation.py
│   ├── repositories/        ← Датабаасын хандалт (SQL-г нэг дор)
│   │   ├── base.py          ← BaseRepository[T] — нийтлэг CRUD
│   │   ├── patient_repo.py
│   │   ├── doctor_repo.py
│   │   ├── daily_visit_plan_repo.py
│   │   └── consultation_repo.py
│   ├── services/            ← Бизнесийн логик
│   │   ├── patient_service.py
│   │   ├── notification_service.py
│   │   └── visit_service.py
│   ├── api/
│   │   ├── deps.py          ← get_db, CurrentPatient, CurrentDoctor dependency
│   │   └── v1/
│   │       ├── router.py    ← Бүх router нэгтгэх
│   │       └── endpoints/
│   │           ├── patients.py
│   │           ├── doctors.py
│   │           ├── hospitals.py
│   │           ├── schedules.py
│   │           ├── visit_plans.py
│   │           ├── consultations.py
│   │           ├── notifications.py
│   │           ├── telegram_webhook.py
│   │           └── agent.py
│   ├── agents/
│   │   ├── orchestrator.py  ← LangGraph workflow
│   │   ├── soap_agent.py    ← SOAP тэмдэглэл үүсгэгч
│   │   └── schedule_agent.py
│   ├── tools/
│   │   ├── route_tools.py   ← Haversine TSP, What3Words
│   │   └── schedule_tools.py
│   └── utils/
│       └── telegram.py      ← Telegram мессеж явуулах
├── alembic/                 ← Датабаасын migration файлууд
└── main.py                  ← FastAPI app, CORS, lifespan cron
```

### Admin дашбоард (`admin/src/`)
```
admin/src/
├── app/
│   ├── login/page.tsx
│   └── dashboard/
│       ├── page.tsx          ← Өнөөдрийн эргэлтийн ерөнхий харагдалт
│       ├── visits/page.tsx   ← Өдөрт зориулсан эргэлтийн жагсаалт
│       ├── consultation/page.tsx ← SOAP үзлэгийн урсгал
│       ├── history/page.tsx  ← Үзлэгийн түүх
│       ├── patients/page.tsx ← Өвчтөний жагсаалт
│       ├── schedules/page.tsx← Долоо хоногийн хуваарь
│       └── route/page.tsx    ← Маршрут тооцоолол
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx       ← Десктопын навигаци
│   │   └── mobile-nav.tsx    ← Гар утасны навигаци
│   └── ui/                   ← Дахин ашиглах компонентууд
├── lib/
│   └── api-client.ts         ← fetch wrapper, auth header
└── types/index.ts            ← Бүх TypeScript интерфэйс
```

---

## 5. Логик урсгалын дэлгэрэнгүй тайлбар

### 5.1 Гэрийн эргэлтийн төлөвлөлт

**Зорилго**: Эмч маргааш очих өвчтөнүүдийн жагсаалтыг урьдчилан тогтоох.

**Урсгал**:
```
Эмч admin → /dashboard/visits хуудас нээнэ
    │
    ▼ Огноо сонгоно (default: маргааш)
    │
    ▼ Өвчтөний нэр/утсаар хайна → GET /api/v1/patients/?q=...
    │
    ▼ Өвчтөнийг жагсаалтад нэмнэ → POST /api/v1/visit-plans/
    │   (patient_id, doctor_id, visit_order, estimated_time)
    │
    ▼ Дашбоард дээр маршрутын дараалал харагдана
```

**Датабаасын хүснэгт**: `daily_visit_plans`
- `date` — аль өдрийн эргэлт
- `doctor_id` — аль эмч
- `patient_id` — аль өвчтөн
- `visit_order` — дарааллын дугаар (1, 2, 3…)
- `estimated_time` — ойролцоо цаг (09:00, 09:40…)
- `status` — `pending` / `confirmed` / `declined`

---

### 5.2 Telegram баталгаажуулалтын урсгал

**Зорилго**: Эргэлтийн өмнөх орой өвчтөн гэртээ байх эсэхийг автоматаар асуух.

**Урсгал**:
```
18:00 cron (Улаанбаатарын цаг)
    │
    ▼ Маргаашийн "pending" статустай планууд авна
    │
    ▼ Telegram chat_id-тэй өвчтөн бүрт мессеж явуулна:
    │   "Маргааш 10:30-д эмч таны гэрт очих болно.
    │    Та гэртээ байх боломжтой юу?
    │    ✅ Байна  ❌ Байхгүй гэж хариулна уу."
    │
Өвчтөн хариулна (Telegram)
    │
    ▼ POST /api/v1/telegram/webhook дуудагдана
    │
    ├─ "байна" / "тийм" / "ok" → status = "confirmed"
    │
    └─ "байхгүй" / "үгүй" → status = "declined"
                              │
                              ▼ Маршрут дахин тооцооллогдоно
                                (Haversine TSP, 30 мин завсар)
```

**Санаа ангилал — токен 0**: Хариулт ангилахад LLM ашигладаггүй. Монгол/Англи түлхүүр үгийн тохирол ашигладаг:
- Тийм: `{"байна", "тийм", "ok", "болно", "ок", "yes", "за"}`
- Үгүй: `{"байхгүй", "үгүй", "болохгүй", "no", "болдоггүй"}`

---

### 5.3 Маршрут тооцоолол (Haversine TSP)

**Зорилго**: Өвчтөнүүдийн GPS байршлаас хамгийн богино замыг тооцооловч.

**Алгоритм**: Nearest-Neighbor TSP (Хамгийн ойрын хөрш TSP хэвийн)

```python
def _nearest_neighbor(pairs):
    # 1. Эхний байршлаас эхэлнэ
    result = [pairs[0]]
    remaining = list(pairs[1:])
    current = pairs[0][1]  # Patient object

    # 2. Бүх өвчтөнийг дуустал:
    while remaining:
        # 3. Одоогийн байршлаас хамгийн ойр өвчтөнийг хайна
        nearest = min(remaining,
            key=lambda pair: haversine_km(
                current.latitude, current.longitude,
                pair[1].latitude, pair[1].longitude
            )
        )
        result.append(nearest)
        current = nearest[1]

    return result
```

**Haversine томъёо**: Дэлхийн муруй гадаргуу дээр хоёр GPS цэгийн хоорондын зайг тооцооловч. Стандарт Pythagoras теорем нь дэлхийн тойм хэлбэрт алдаа гаргадаг тул Haversine ашигладаг.

```
a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
c = 2·arcsin(√a)
d = R·c  (R = 6371 km)
```

**Frontend дээр**: Admin-ийн `/dashboard/route` хуудас мөн адил TypeScript дээр TSP-г тооцооловч. Backend-аас тусдаа, клиент-side зөвхөн өдрийн маршрутыг харуулдаг.

**Google Maps холбоос**: Бүх байршлыг нэгтгэж Google Maps multi-stop URL үүсгэнэ:
```
https://www.google.com/maps/dir/47.894,106.832/47.901,106.848/47.887,106.821
```
Утсан дээр нээхэд автоматаар навигаци эхэлнэ.

---

### 5.4 SOAP тэмдэглэл үүсгэх

**Зорилго**: Эмч дуугаараа тайлбарласан үзлэгийг стандарт SOAP форматад автоматаар хөрвүүлэх.

**SOAP гэж юу вэ?**
Эмнэлэгийн олон улсын стандарт бичиглэлийн формат:
- **S (Subjective — Субьектив)**: Өвчтөн өөрөө юу хэлсэн: "Толгой өвдөнө"
- **O (Objective — Обьектив)**: Эмч юу хэмжсэн/харсан: "BP 160/100, Temp 37.2°C"
- **A (Assessment — Үнэлгээ)**: Оношилгоо: "Arterial hypertension"
- **P (Plan — Төлөвлөгөө)**: Эмчилгээ: "Enalapril 10mg, 2 долоо хоногийн дараа дахин үзүүлэх"

**Урсгал**:
```
Эмч Chrome хөтөч дээр бичлэгийн товч дарна
    │
    ▼ Web Speech API дуу авна (lang="mn-MN")
    │   Монгол/Англи/Латин холимог текст гарна
    │   Жишээ: "BP 160/100, толгой өвдөнө, Enalapril 10mg бичье"
    │
    ▼ "SOAP үүсгэх" дарна → POST /api/v1/agent/soap
    │   { transcription: "BP 160/100, толгой өвдөнө..." }
    │
    ▼ Gemini gemini-3.1-flash-lite загвар дуудагдана
    │   System prompt: Монгол/Англи/Латин холимог медицин текстийг
    │   SOAP форматад задлах заавар + жишээ
    │
    ▼ JSON хариу:
    │   { "S": "Толгой өвдөх", "O": "BP 160/100",
    │     "A": "Arterial hypertension", "P": "Enalapril 10mg..." }
    │
    ▼ Дашбоард дээр 4 хэсэг харагдана (засварлах боломжтой)
    │
    ▼ Автоматаар DB-д хадгалагдана → POST /api/v1/consultations/
```

**Яагаад Gemini ашиглав?**
Монгол эмч нарын тэмдэглэл Монгол + Англи + Латин хэлийг холимогоор ашигладаг. Rule-based систем энэ олон янзын бичиглэлийг зөв задлах чадваргүй. Зөвхөн LLM л медицин нэр томьёог контекстоор ойлгох чадвартай.

**Токен оновчлол**: ~500–800 токен нэг SOAP тэмдэглэлд. 15 минутын гараар бичих ажлыг 3 секундэд хийнэ.

---

### 5.5 Үзлэгийн түүх

**Зорилго**: Эмч хэн, хэзээ, ямар оношоор үзсэнийг харж болох.

**Хадгалалт**: SOAP үүсгэсний дараа автоматаар `consultations` хүснэгтэд хадгалагдана. Энэ нь "fire-and-forget" — алдаа гарвал UI-г саатуулдаггүй.

**`consultations` хүснэгт**:
- `id` — UUID
- `doctor_id` — аль эмч үзсэн
- `patient_id` — аль өвчтөн
- `patient_name` — өвчтөний нэрийн хуулбар (snapshot)
- `transcription` — анхны дуугийн текст
- `soap_s`, `soap_o`, `soap_a`, `soap_p` — SOAP хэсгүүд
- `created_at` — цаг

**History хуудас** (`/dashboard/history`):
- Огноо, өвчтөний нэр, S хэсгийн хэсэгчлэн харуулна
- Дарахад 4 SOAP хэсэг өнгөөр ялгаатайгаар дэлгэгдэнэ

---

### 5.6 LangGraph Orchestrator

**Зорилго**: Эмчийн бичсэн мессежийг зөв алхам руу чиглүүлэх.

**Граф бүтэц**:
```
START
  │
  ▼
classify_intent  ← Gemini: "энэ мессеж юуны тухай вэ?"
  │
  ├─ "schedule_update"  → schedule_node  (хуваарь засах)
  ├─ "route_optimize"   → route_node     (маршрут гаргах)
  ├─ "soap_note"        → soap_node      (SOAP бичих)
  └─ "general"          → general_node   (ерөнхий хариулт)
  │
END
```

**Токен оновчлол**:
- `classify_intent`: ~100–200 токен (зөвхөн ангилалт)
- `schedule_update` + `route_optimize`: **0 токен** (математик тооцоолол)
- `soap_note`: ~500–800 токен
- `general`: ~100–200 токен

---

## 6. Датабаасын загвар

```
┌──────────────┐     ┌──────────────────┐
│   hospitals  │◄────│     doctors      │
│──────────────│     │──────────────────│
│ id (UUID PK) │     │ id (UUID PK)     │
│ hospital_name│     │ first_name       │
│ hospital_phone│    │ last_name        │
│ address      │     │ email            │
│ level        │     │ phone            │
│ is_active    │     │ role             │
└──────────────┘     │ assigned_sector  │
                     │ hospital_id (FK) │
                     │ telegram_id      │
                     │ password         │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼──────┐  ┌────▼──────┐  ┌─────▼──────────────┐
    │    patients    │  │ schedules │  │  daily_visit_plans  │
    │────────────────│  │───────────│  │────────────────────│
    │ id (UUID PK)   │  │ id        │  │ id                  │
    │ full_name      │  │ doctor_id │  │ date                │
    │ phone_number   │  │ day_of_week│ │ doctor_id           │
    │ address_text   │  │ start_time│  │ patient_id          │
    │ latitude       │  │ end_time  │  │ visit_order         │
    │ longitude      │  │ max_patients│ │ estimated_time     │
    │ telegram_chat_id│ │ is_active │  │ status              │
    │ sector         │  └───────────┘  └─────────────────────┘
    │ password       │
    └────────┬───────┘
             │
    ┌────────▼────────────┐
    │    consultations    │
    │─────────────────────│
    │ id                  │
    │ doctor_id           │
    │ patient_id          │
    │ patient_name        │
    │ transcription       │
    │ soap_s              │
    │ soap_o              │
    │ soap_a              │
    │ soap_p              │
    │ created_at          │
    └─────────────────────┘
```

---

## 7. API эцсийн цэгүүдийн жагсаалт

Бүх endpoint нь `/api/v1/` угтамжтай.

### Өвчтөн
| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/patients/` | Бүртгүүлэх |
| POST | `/patients/login` | Нэвтрэх, JWT авах |
| GET | `/patients/me` | Өөрийн профайл |
| PUT | `/patients/me` | Профайл засах |
| GET | `/patients/` | Жагсаалт (хайлт: `?q=`, `?sector=`) |
| GET | `/patients/{id}` | Нэг өвчтөн авах |

### Эмч
| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/doctors/login` | Нэвтрэх, JWT авах |
| POST | `/doctors/` | Эмч нэмэх |
| GET | `/doctors/` | Жагсаалт |
| GET | `/doctors/{id}` | Нэг эмч авах |
| PUT | `/doctors/{id}` | Мэдээлэл засах |
| DELETE | `/doctors/{id}` | Устгах |

### Гэрийн эргэлт
| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/visit-plans/` | Эргэлтэд өвчтөн нэмэх |
| GET | `/visit-plans/{date}` | Тухайн өдрийн жагсаалт |
| DELETE | `/visit-plans/{id}` | Өвчтөн хасах |

### Үзлэгийн түүх
| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/consultations/` | Үзлэг хадгалах |
| GET | `/consultations/` | Жагсаалт (`?doctor_id=`) |

### Мэдэгдэл
| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/notifications/send-bulk-reminder` | Бүх өвчтөнд сануулга |
| POST | `/notifications/send-day-before-confirmations` | Маргаашийн баталгаажуулалт |

### Telegram
| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/telegram/webhook` | Telegram Bot webhook |

### AI
| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/agent/soap` | Текстийг SOAP болгох |
| POST | `/agent/chat` | LangGraph orchestrator |

---

## 8. Орчны тохиргоо (.env)

`server/.env` файлд дараах хувьсагчдыг тохируулна:

```env
# Датабааз — asyncpg драйвер шаардлагатай
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/familydoc

# JWT нууц түлхүүр — python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=your_random_secret_here

# Google Gemini API — https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=AIzaSy...

# Telegram Bot — @BotFather-аас авна
TELEGRAM_BOT_TOKEN=7823456789:AAF_xxx

# What3Words (заавал биш)
WHAT3WORDS_API_KEY=
```

---

## 9. Хөгжүүлэгчдэд — ажиллуулах заавар

### Backend ажиллуулах
```bash
cd server
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # .env-г тохируулна
uvicorn app.main:app --reload --port 8000
```

### Admin дашбоард ажиллуулах
```bash
cd admin
bun install
bun run dev                     # http://localhost:3000
```

### Өвчтөний порталь ажиллуулах
```bash
cd portal
bun install
bun run dev                     # http://localhost:3002
```

### Datábaaзийн migration
```bash
cd server
alembic upgrade head
```

### Тест ажиллуулах
```bash
cd server
pytest                          # aiosqlite in-memory, гадаад API mock
```

---

## 10. Архитектурын шийдлүүдийн тайлбар

### Яагаад Repository Pattern ашигласан вэ?
Датабаасын хандалтыг нэг дор төвлөрүүлэх. Endpoint нь HTTP-ийг мэддэг, Repository нь SQL-ийг мэддэг, Service нь бизнесийн дүрмийг мэддэг — хоорондын хамаарал тодорхой.

### Яагаад `flush()` биш `commit()` ашигладаг вэ?
`get_db()` dependency нэг хүсэлтийн бүх үйлдлийг нэг транзакцид хийж, эцэст нь автоматаар `commit()` дуудна. Repository нь `flush()` ашиглан INSERT-ийг SQL-д илгээж, UUID авдаг ч бусад хүсэлтэд харагдахгүй байлгадаг. Алдаа гарвал бүгд rollback хийгдэнэ.

### Яагаад mock map library ашиглаагүй вэ?
Leaflet (~150KB) суулгах шаардлагагүй. Гар утасны field worker-ийн хувьд Google Maps deep link нь хамгийн тохиромжтой — шууд навигаци эхэлдэг. Uber Eats, DoorDash зэрэг аппууд мөн энэ аргыг ашигладаг.

### Яагаад токен хэмнэлтэд анхаарч байна вэ?
Байнгын API дуудлага нь зардал болж хуримтлагдана. Маршрут тооцоолол, хуваарь шинэчлэл, Telegram хариулт ангилал — бүгдийг чухал логик ч **тэг токен**оор шийддэг. LLM-г зөвхөн хүний хэлийг ойлгох шаардлагатай газарт ашигладаг: SOAP буулгалт, санааны ангилал.

### Яагаад Pydantic V2 ашигласан вэ?
Pydantic V1-ийн `class Config` устсан. V2-ийн `model_config = ConfigDict(from_attributes=True)` нь SQLAlchemy ORM объектыг шууд response schema болгон хөрвүүлдэг.

---

*FamilyDoc-AI · Улаанбаатар, Монгол Улс*
