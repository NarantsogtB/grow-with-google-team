# FamilyDoc-AI — Хакатоны Demo заавар

> 5–7 минутын live demo. Энэ файл нь танилцуулагчдад зориулсан step-by-step script — алхам, URL, товчны нэр, ярих үгийг бүгдийг агуулна. Asuudal гарвал [Backup plan](#5-backup-plan-асуудал-гарвал) хэсгийг үз.

---

## 0. Demo-ийн өмнө: 5 минутын Pre-flight checklist

Бүх зүйлийг demo эхлэхээс **30 минут өмнө** шалга.

### 0.1 Production бэлэн эсэх
```bash
curl http://35.189.181.145/api/v1/system/status | jq
```

Хүлээгдэж буй хариу:
```json
{
  "db": "ok",
  "counts": {"doctors": 3, "patients": 15, "hospitals": 2},
  "config": {
    "gemini": true,
    "telegram": true,
    "env": "production",
    "version": "0.2.0"
  }
}
```

| Талбар | Тийм байх ёстой | Үгүй бол |
|---|---|---|
| `db` | `"ok"` | VM дээр postgres ажиллаж байгаа эсэхийг шалга |
| `counts.doctors > 0` | ✓ | VM-д `cd server && source .venv/bin/activate && python seed.py` |
| `counts.patients > 0` | ✓ | Мөн адил seed.py ажиллуулах |
| `config.gemini` | `true` | GitHub Secret `GOOGLE_API_KEY` дахин шалга |
| `config.telegram` | `true` | GitHub Secret `TELEGRAM_BOT_TOKEN` шалга |

### 0.2 VM ажиллаж байгаа эсэх
```bash
ssh sunny_tuulai0317@35.189.181.145
pm2 ls
```

4 ширхэг процесс **online** статустай байх ёстой:
- `familydoc-backend` (порт 8000)
- `admin` (порт 3000)
- `portal` (порт 3002)
- `familydoc-ngrok` (HTTPS tunnel)

Хэрэв аль нэг нь `errored`/`stopped` бол:
```bash
pm2 restart <name>
pm2 logs <name> --lines 50    # алдааг шалгах
```

### 0.3 Demo data бэлэн эсэх

VM дээр postgres-руу залгаад өвчтнүүдийг шалгана:
```bash
sudo -u postgres psql family_medical_db -c \
  "SELECT full_name, telegram_chat_id FROM patients WHERE telegram_chat_id IS NOT NULL LIMIT 3;"
```

**Хамгийн багадаа 1 өвчтөн telegram_chat_id-тэй байх ёстой** — энэ нь Telegram live demo-ийн гол. Хэрэв байхгүй бол:
1. Гар утсан дээр @familydoc_bot руу `/start` явуулна
2. Дараа `/link <бэлдсэн өвчтөний утас>` (жишээ: `/link 99112201`)
3. "✅ Холбогдлоо!" хариу ирнэ

### 0.4 Tomorrow's visit plan үүсгэх (Сцен 3-д хэрэгтэй)
```bash
# Эмчээр login → token авах
TOKEN=$(curl -s -X POST http://35.189.181.145/api/v1/doctors/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"munkh.dorj@family.mn","password":"doctor123"}' \
  | jq -r .access_token)

# Маргаашийн огноогоор visit plan үүсгэх (telegram-тэй өвчтнөөр)
TOMORROW=$(date -u -v+1d '+%Y-%m-%d')
PATIENT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://35.189.181.145/api/v1/patients/?size=1" | jq -r '.items[0].id')
DOCTOR_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://35.189.181.145/api/v1/doctors/ | jq -r '.items[0].id')

curl -X POST http://35.189.181.145/api/v1/visit-plans/ \
  -H 'Content-Type: application/json' \
  -d "{\"date\": \"$TOMORROW\", \"doctor_id\": \"$DOCTOR_ID\", \"patient_id\": \"$PATIENT_ID\", \"visit_order\": 1, \"estimated_time\": \"10:00:00\"}"
```

### 0.5 Browser tab-уудыг урьдчилан бэлдэх

Зүүн дэлгэц (laptop):
1. **Tab 1**: `http://35.189.181.145/admin/login` — эмчээр login хийсэн state
2. **Tab 2**: `http://35.189.181.145/admin/dashboard/consultation` — micrphone access баталгаажуулсан
3. **Tab 3**: `http://35.189.181.145/admin/dashboard/assistant`
4. **Tab 4**: `http://35.189.181.145/admin/dashboard/route`

Утас (mobile):
- **Tab**: Telegram @familydoc_bot руу chat нээсэн, мессеж хүлээх бэлэн

### 0.6 Final connectivity check
- **WiFi #1** + **Phone hotspot #2** хоёулаа бэлэн (WiFi алдагдвал шилжих)
- Микрофоны зөвшөөрөл олгосон (Chrome → Settings → microphone)
- Зуны цагт батарей 80%+

---

## 1. Storyline — 5–7 минут

| # | Сцен | Цаг | Гол санаа |
|---|---|---|---|
| 1 | Асуудал | 30 сек | Монгол өрхийн эмч өдөрт 50%-ийн цагаа админ ажилд алддаг |
| 2 | Эмчийн өдөр | 45 сек | Dashboard widget-уудыг тойруулах |
| 3 | Telegram live ⭐ | 90 сек | Цагаар тохируулсан сануулга + бодит хариу |
| 4 | Voice → SOAP ⭐ | 90 сек | Микрофоноор үг бичих → JSON SOAP |
| 5 | Route optimization | 45 сек | Haversine TSP + Google Maps multi-stop |
| 6 | LangGraph AI чат ⭐ | 60 сек | 4 intent, route + schedule бодит ажилладаг |
| 7 | Тех stack | 60 сек | Кода/тех highlight |

⭐ = "wow" моментүүд

---

## 2. Step-by-step script

### Сцен 1 — Асуудал тавих (30 сек)

🎤 *"Монголын өрхийн эмч өдөрт дунджаар 8-10 өвчтөний гэрт очдог. Гараар маршрут гаргана, өвчтөн гэртээ байгаа эсэхийг мэдэхгүйгээр зам туулна, үзлэг хийгээд гараар SOAP тэмдэглэл бичнэ. Энэ нь эмчийн ажиллах цагийн ойролцоогоор 50%-ийг админ ажилд зарцуулдаг. FamilyDoc-AI энэ цагийг буцааж эмчийн жинхэнэ ажилд өгөх зорилготой."*

### Сцен 2 — Эмчийн өдөр (45 сек)

🎤 *"Эмч өглөө дашбоардаа нээж байна."*

**Tab 1 → `/admin/dashboard`**

Заавал заагаад тайлбарла:
- "Өнөөдрийн эргэлт" widget — N өвчтөн, статус badge-тэй жагсаалт
- "Google Maps-д нээх" товч → multi-stop URL автоматаар
- Баруун талд **"Цагаар тохируулсан сануулга"** card

### Сцен 3 — Telegram live demo ⭐ (90 сек)

🎤 *"Бид одоо live demo хийе — би 1 минутын дотор Telegram-руу мессеж явуулъя."*

**Алхам 3.1**: "Цагаар тохируулсан сануулга" card-аас:
- Type: **"Маргаашийн баталгаажуулалт"** сонгох
- Огноо: маргааш (default)
- **"+1 мин"** товч дарах

Toast: `✅ HH:MM UB цагт явна`

Хүлээгдэж буй жагсаалтад харагдана.

🎤 *"60 секундын дотор мессеж явна — энэ хооронд би яаж ажилладгийг тайлбарлая. LangGraph-ийг ашиглан бид intent-ийг classify хийдэг, гэхдээ route, schedule зэрэг deterministic үйлдэлд Gemini-г огт дуудахгүй — pure Python TSP. Энэ нь нэг хэрэглэгчийн нэг өдрийн API зардлыг 10x хямдруулдаг."*

**Алхам 3.2**: 60 сек өнгөрсний дараа утсыг танилцуулагчид харуул — Telegram мессеж ирсэн байна.

🎤 *"Өвчтөн `Байна` гэж хариулна гэе."*

→ **Алхам 3.3**: Утсан дээр `✅ Байна` бичээд явуулна. Bot 1-2 секундын дотор хариу ирнэ:
> "Баярлалаа! Баталгаажлаа. ✅"

🎤 *"Backend-ийн webhook автоматаар `daily_visit_plans` хүснэгтийн `status` талбарыг `confirmed` болгож тэмдэглэв. Дашбоард руу буцаж харъя."*

**Алхам 3.4**: Dashboard-ийг refresh хийх → status badge "Хүлээгдэж байна" → **"Баталгаажсан"** (ногоон) болсон байна.

### Сцен 4 — Voice → SOAP ⭐ (90 сек)

🎤 *"Эмч одоо өвчтөний гэрт ирлээ. Үзлэг хийгээд тэмдэглэл бичих ёстой."*

**Tab 2 → `/admin/dashboard/consultation`**

**Алхам 4.1**: Хайх талбарт жишээ өвчтөний нэр оруулна (Дорж эсвэл seed-аас гарсан хэн нэг)
**Алхам 4.2**: Микрофон товч дарж дараах үгийг **тод дуудах**:

> "Цусны даралт зуун жаран дээр зуу, толгой өвдөнө, дотор муухайрна, Эналаприл арван миллиграммаар өдөрт хоёр удаа бичье"

🎤 *"Энэ бол реал амьдрал дээрх эмчийн ярианы хэв маяг — Монгол + Англи + латин нэр томьёо холимог. Rule-based систем энийг шийдэх боломжгүй."*

**Алхам 4.3**: Recording зогсоох → Live transcription дэлгэц дээр харагдана.

**Алхам 4.4**: **"SOAP үүсгэх"** товч дарах → 2-3 секундын дараа 4 өнгийн карт харагдана:
- 🟢 **S (Субъектив)**: "Толгой өвдөх, дотор муухайрах"
- 🔵 **O (Объектив)**: "BP 160/100"
- 🟡 **A (Үнэлгээ)**: "Arterial hypertension"
- 🟣 **P (Төлөвлөгөө)**: "Enalapril 10mg, өдөрт 2 удаа"

🎤 *"Gemini 2.5 Flash-ийн multimodal capability — анхны WebRTC аудиог шууд хүлээж аваад structured JSON ялгаж буцаадаг. Дунджаар 3 секунд, 800 токен."*

**Алхам 4.5**: **"Хадгалах"** → "Үзлэгийн түүх" хуудаст шилжих

🎤 *"DB-д автоматаар хадгалагдсан байна — олон жилийн дараа ч энэ өвчтөний түүхийг хайх боломжтой."*

### Сцен 5 — Route optimization (45 сек)

**Tab 4 → `/admin/dashboard/route`**

🎤 *"Эмч өдрийн бүх эргэлтийн дарааллаа харж байна. Haversine TSP алгоритм нь хамгийн ойрхон цэгээр явах оновчтой дарааллыг гаргадаг."*

Үзүүл:
- 1, 2, 3... дугаарласан өвчтөнүүд + per-leg км
- "Google Maps-д нээх" товч → бодит multi-stop URL

🎤 *"Алгоритм нь O(n²) — 10 өвчтнөөс milliseconds дотор оновчилно. Hypothetical global optimal-аас ~15% л зайтай гарна. Хакатоны хүрээнд хангалттай."*

### Сцен 6 — LangGraph AI Туслах ⭐ (60 сек)

**Tab 3 → `/admin/dashboard/assistant`**

🎤 *"Энэ нь LangGraph-аар бүтсэн multi-intent agent — natural language-ээр тушаал өгч болно."*

**Алхам 6.1**: Жишээ prompt 1 дарах: **"Өнөөдрийн оптимал маршрутыг харуул"**

→ 4 секундын дараа hard text:
```
📍 14-р хэсгийн оновчтой эргэлт:
1. Дорж Мөнхбаяр — эхлэх цэг
2. Цэнд Оюунцэцэг — 0.21 км
3. Батжаргал Нандин — 0.34 км
...
Нийт: 2.85 км · 8 өвчтөн
```

🎤 *"Intent classifier 100 токен зарцуулсан, route_node Gemini огт дуудахгүй pure math-аар тооцоолов. Шууд DB-аас real time data."*

**Алхам 6.2**: Хоёр дахь prompt: **"[Тухайн өвчтөний нэр] маргааш ирж чадахгүй гэлээ"**

→ Хариу:
```
✅ Цэнд Оюунцэцэгийн [маргаашийн огноо]-ны зорчилтыг цуцалсан болгож тэмдэглэв.
```

🎤 *"Schedule node Gemini-аар өвчтөний нэр, огноог ялгаж аваад DB-д declined гэж шууд бичлээ."*

### Сцен 7 — Тех stack (60 сек)

🎤 *"Хурдан тех stack-ийн талаар:"*

| Давхарга | Тех |
|---|---|
| Backend | **FastAPI async + SQLAlchemy 2 + PostgreSQL** |
| AI | **Gemini 2.5 Flash** (intent + SOAP), **LangGraph** orchestrator |
| Frontend | **Next.js 16 + React 19 + Tailwind v4 + bun** (хурдан build) |
| Deploy | **GitHub Actions → GCP VM → nginx + PM2** |
| Tests | **65 pytest** (aiosqlite in-memory) + admin/portal build check |

🎤 *"Гол утга нь: AI-г зөвхөн жинхэнэ хэлний ойлголт шаардлагатай газар ашигладаг — route, schedule, math бүгдийг zero-token deterministic tool-аар хийдэг. Энэ нь production scale-руу гарахад чухал."*

---

## 3. Speaker key phrases

Janners асууж болохуйц моментүүдэд ашиглах нөөц өгүүлбэрүүд:

### Архитектур
> "Pure math бөгөөд predictable байх ёстой логикуудыг LLM-ээр шийдэхгүй — route TSP, schedule reorder, intent dict lookup. Энэ нь зардал хямдруулах + reproducibility + latency сайжруулах хэрэгсэл."

### AI integration
> "Бид Gemini-г 2 байршилд ашигладаг: (1) intent classification — 100 токен богино prompt, (2) SOAP structuring — 600 токен audio-to-JSON. Бусад нь pure Python."

### Telegram bot design
> "Bot-ийн чат_id-г капчилахын тулд `/link <утас>` командыг ашигласан. Telegram username нь chat_id биш — энэ нь production-д их алдаа гаргадаг. Манай pattern нь bot өөрөө real chat_id-г барьдаг."

### Real-time architecture
> "FastAPI lifespan дотор asyncio.create_task-аар 2 cron явдаг — 08:00 UB-д bulk reminder, 18:00 UB-д day-before confirmation. Бид мөн one-shot scheduler нэмсэн — admin UI-аас тодорхой цагт мессеж явуулж болно."

---

## 4. Q&A бэлдэлт (judges-ийн жишээ асуултууд)

| Асуулт | Хариу |
|---|---|
| Хэдэн өвчтөн дэмжих чадвартай? | SQLAlchemy async pool + PostgreSQL — 10K+ өвчтөн дэмжинэ. Demo дээр 15 seed. |
| Аюулгүй байдал? | JWT auth (HS256), bcrypt-ээр нууц үг hash, HTTPS (Cloudflare Tunnel-ээр), CORS lockdown, sector-based row-level access control (PR #39). |
| Маршрутын алгоритм global optimal уу? | Үгүй — nearest-neighbor heuristic, O(n²), 5-10 өвчтөн дээр 15-25% optimal-аас зайтай. Production-д Google Routes API / OR-Tools-руу шилжих ёстой. |
| Telegram bot scalability? | Webhook push модель, FastAPI async — цагт ~100K мессеж дэмжинэ. Bot Telegram-ийн "30 messages per second to different users" rate limit-д барьцагтай. |
| Token cost? | Эмч өдөрт ~10 SOAP тэмдэглэл хийнэ гэж бодоход 8K tokens × $0.0001 = **$0.0008/өдөр/эмч**. 1000 эмч = $24/сар. |
| HIPAA / GDPR compliance? | Дата нь Mongolia VM-д хадгалагдана. PostgreSQL-д at-rest encryption нэмэх ёстой (production). Gemini API руу зөвхөн transcription явна — өвчтөний нэр, ID явахгүй. |
| Offline mode? | Шаардлагагүй — Mongolia-д 4G coverage 95%+. Гэхдээ admin app-ийн PWA болгож offline visit list харуулах боломжтой. |
| Бусад хэл дэмжих үү? | Gemini multilingual — Англи, Орос, Хятадтай тестлэсэн. UI string бол `next-i18next` нэмбэл хангалттай. |

---

## 5. Backup plan (асуудал гарвал)

| Асуудал | Хариулт |
|---|---|
| **WiFi алдагдсан** | Phone hotspot #2-руу шилжих (бэлэн). Admin/portal static prerendered тул UI бараг ажиллах боломжтой. |
| **Production backend унасан** | `ssh user@35.189.181.145 'pm2 restart familydoc-backend'`. Эсвэл local backend асаагаад `NEXT_PUBLIC_API_URL=http://localhost:8000` сольж laptop-ыг WiFi-р judges-руу харуулах. |
| **Telegram bot offline** | `curl "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"` шалга. `last_error_date` сүүлийн алдаа. Webhook-аа re-register: `./scripts/setup-telegram-webhook.sh https://...` |
| **/system/status counts=0** | VM дээр шууд `cd ~/grow-with-google-team/server && source .venv/bin/activate && python seed.py` — 15 секундэд бүрэн зэрэгцүүлнэ. |
| **Микрофон ажиллахгүй** | Browser permission шалгах. Backup: бэлдсэн audio clip-ийг утасны spaker-аас laptop-ийн микрофон руу тоглуулах ("virtual mic" pattern). |
| **AI Туслах 401 буцаалаа** | Re-login → frontend автоматаар admin/login-руу redirect (401 interceptor). seed.py-аас гарсан credentials ашиглах: `munkh.dorj@family.mn / doctor123` |
| **Цагаар тохируулсан сануулга 404** | Production backend deploy-гээгүй гэсэн үг. `curl /api/v1/notifications/scheduled` 404 буцаавал — VM-д SSH-лээд `git pull origin main && pm2 restart familydoc-backend` |
| **Stress / нервүүсэх** | Анхдугаар breath. Audience нь танаас илүү мэддэггүй — алдааг сонирхолтой моментоор болгож хэрэглэх. |

---

## 6. Demo-ийн дараа

- Judges-руу **README_PROJECT.md** link тавих — full feature deep-dive
- GitHub repo нийтлэг харуулах
- Question round-д "Х минутын дотор push" гэж бэлэн байх (live coding моментүүд impressive)

---

*FamilyDoc-AI · Хакатоны бэлэн заавар · Зохиогч: Demo team*
