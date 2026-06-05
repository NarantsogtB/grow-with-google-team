"""
FamilyDoc-AI Mock Data Seed Script
Usage: cd server && python seed.py
Requires the backend server running at http://localhost:8000
"""

import json
import urllib.error
import urllib.request

BASE = "http://localhost:8000"
OK = "\033[92m✓\033[0m"
ERR = "\033[91m✗\033[0m"

created = {"hospitals": 0, "doctors": 0, "patients": 0, "schedules": 0}
errors = []


def post(path: str, body: dict, token: str | None = None) -> dict | None:
    data = json.dumps(body).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{BASE}{path}", data=data, headers=headers, method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = json.loads(e.read()).get("detail", e.reason)
        except Exception:
            detail = e.reason
        print(f"  {ERR}  HTTP {e.code}: {detail}")
        errors.append(f"{path}: {detail}")
        return None
    except Exception as ex:
        print(f"  {ERR}  {ex}")
        errors.append(str(ex))
        return None


# ── Step 1: Hospitals ─────────────────────────────────────────────────────────
print("\n🏥 Эмнэлэгүүд үүсгэж байна...")

hospitals_data = [
    {
        "hospital_name": "Баянгол дүүрэг 1-р өрхийн эмнэлэг",
        "hospital_phone": "70130001",
        "address": "Баянгол дүүрэг, 1-р хороо, Уул худалдааны байр",
        "level": "PRIMARY",
    },
    {
        "hospital_name": "Сүхбаатар дүүрэг 2-р өрхийн эмнэлэг",
        "hospital_phone": "70130002",
        "address": "Сүхбаатар дүүрэг, 8-р хороо, Центр байр",
        "level": "PRIMARY",
    },
]

hospital_ids = []
for h in hospitals_data:
    r = post("/api/v1/hospitals/", h)
    if r:
        hospital_ids.append(r["id"])
        print(f"  {OK}  {h['hospital_name']}")
        created["hospitals"] += 1
    else:
        hospital_ids.append(None)

h1 = hospital_ids[0] if len(hospital_ids) > 0 else None
h2 = hospital_ids[1] if len(hospital_ids) > 1 else None


# ── Step 2: Doctors ────────────────────────────────────────────────────────────
print("\n👨‍⚕️ Эмч нарыг үүсгэж байна...")

doctors_data = [
    {
        "first_name": "Мөнхбат",
        "last_name": "Дорж",
        "gender": "MALE",
        "phone": "99001101",
        "email": "munkh.dorj@family.mn",
        "role": "GENERAL",
        "assigned_sector": "14",
        "hospital_id": h1,
        "password": "doctor123",
    },
    {
        "first_name": "Болд",
        "last_name": "Гантулга",
        "gender": "MALE",
        "phone": "99001102",
        "email": "bold.gantulga@family.mn",
        "role": "GENERAL",
        "assigned_sector": "12",
        "hospital_id": h1,
        "password": "doctor123",
    },
    {
        "first_name": "Энхтуяа",
        "last_name": "Цогт",
        "gender": "FEMALE",
        "phone": "99001103",
        "email": "enkhtuyaa.tsogt@family.mn",
        "role": "PEDIATRICIAN",
        "assigned_sector": "8",
        "hospital_id": h2,
        "password": "doctor123",
    },
]

doctor_ids = []
for d in doctors_data:
    r = post("/api/v1/doctors/", d)
    if r:
        doctor_ids.append(r["id"])
        print(
            f"  {OK}  Dr. {d['first_name']} {d['last_name']} (sector: {d['assigned_sector']})"
        )
        created["doctors"] += 1
    else:
        doctor_ids.append(None)

d1 = doctor_ids[0] if len(doctor_ids) > 0 else None
d2 = doctor_ids[1] if len(doctor_ids) > 1 else None
d3 = doctor_ids[2] if len(doctor_ids) > 2 else None


# ── Step 3: Patients ───────────────────────────────────────────────────────────
print("\n🧑‍🤝‍🧑 Өвчтнүүдийг үүсгэж байна...")

patients_data = [
    # Sector 14 — Dr. Мөнхбат
    {
        "full_name": "Дорж Мөнхбаяр",
        "phone_number": "99112201",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 14-р хороо, Нарт орон сууц 4-р байр 12",
        "latitude": 47.9121,
        "longitude": 106.9012,
        "sector": "14",
        "telegram_chat_id": "@munkh_dorj",
    },
    {
        "full_name": "Цэнд Оюунцэцэг",
        "phone_number": "99112202",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 14-р хороо, Тэнгэр апарт 2-р байр 5",
        "latitude": 47.9115,
        "longitude": 106.9020,
        "sector": "14",
    },
    {
        "full_name": "Батжаргал Нандин",
        "phone_number": "99112203",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 14-р хороо, Гэр хороолол Б-14, 220 тоот",
        "latitude": 47.9130,
        "longitude": 106.9005,
        "sector": "14",
    },
    {
        "full_name": "Ганбаатар Мэнд",
        "phone_number": "99112204",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 14-р хороо, Туул цогцолбор 10-р байр 34",
        "latitude": 47.9108,
        "longitude": 106.9035,
        "sector": "14",
        "telegram_chat_id": "@ganbaatar_mend",
    },
    {
        "full_name": "Пүрэвдорж Наранцэцэг",
        "phone_number": "99112205",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 14-р хороо, Нарнай хороолол 7-р байр 21",
        "latitude": 47.9140,
        "longitude": 106.9000,
        "sector": "14",
    },
    {
        "full_name": "Лхагвасүрэн Батбаяр",
        "phone_number": "99112206",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 14-р хороо, Туул апарт 15-р байр 8",
        "latitude": 47.9095,
        "longitude": 106.9045,
        "sector": "14",
    },
    {
        "full_name": "Сүхбаатар Энхжаргал",
        "phone_number": "99112207",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 14-р хороо, Хан-Уул хашаа 22",
        "latitude": 47.9155,
        "longitude": 106.8990,
        "sector": "14",
        "telegram_chat_id": "@enkhjargal_s",
    },
    {
        "full_name": "Дамдинсүрэн Болормаа",
        "phone_number": "99112208",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 14-р хороо, Цэнгэл хороолол 3-р байр 17",
        "latitude": 47.9100,
        "longitude": 106.9055,
        "sector": "14",
    },
    # Sector 12 — Dr. Болд
    {
        "full_name": "Мягмарсүрэн Цэрэндолгор",
        "phone_number": "99112209",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 12-р хороо, Наран апарт 8-р байр 3",
        "latitude": 47.9200,
        "longitude": 106.8950,
        "sector": "12",
    },
    {
        "full_name": "Жамбалдорж Ариунаа",
        "phone_number": "99112210",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 12-р хороо, Тэнгэр хороолол 5-р байр",
        "latitude": 47.9195,
        "longitude": 106.8940,
        "sector": "12",
        "telegram_chat_id": "@ariunaa_j",
    },
    {
        "full_name": "Гантулга Мандхай",
        "phone_number": "99112211",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 12-р хороо, Гэр хороолол В-12, 315",
        "latitude": 47.9210,
        "longitude": 106.8960,
        "sector": "12",
    },
    {
        "full_name": "Отгонтуяа Энхболд",
        "phone_number": "99112212",
        "password": "patient123",
        "address_text": "Баянгол дүүрэг, 12-р хороо, Баянгол центр 17-р байр 9",
        "latitude": 47.9185,
        "longitude": 106.8935,
        "sector": "12",
    },
    # Sector 8 — Dr. Энхтуяа
    {
        "full_name": "Эрдэнэчимэг Ганхуяг",
        "phone_number": "99112213",
        "password": "patient123",
        "address_text": "Сүхбаатар дүүрэг, 8-р хороо, Их дэлгүүрийн орчим, 14",
        "latitude": 47.9050,
        "longitude": 106.9200,
        "sector": "8",
    },
    {
        "full_name": "Номинчимэг Дэлгэрцэцэг",
        "phone_number": "99112214",
        "password": "patient123",
        "address_text": "Сүхбаатар дүүрэг, 8-р хороо, Туул гудамж 14-р байр",
        "latitude": 47.9060,
        "longitude": 106.9210,
        "sector": "8",
        "telegram_chat_id": "@nomini_d",
    },
    {
        "full_name": "Хишигдэлгэр Уранцэцэг",
        "phone_number": "99112215",
        "password": "patient123",
        "address_text": "Сүхбаатар дүүрэг, 8-р хороо, Хан-Уул байшин 9-р байр 22",
        "latitude": 47.9045,
        "longitude": 106.9195,
        "sector": "8",
    },
]

for p in patients_data:
    r = post("/api/v1/patients/", p)
    if r:
        print(f"  {OK}  {p['full_name']} (sector: {p['sector']})")
        created["patients"] += 1


# ── Step 4: Weekly Schedules ──────────────────────────────────────────────────
print("\n📅 7 хоногийн хуваарь үүсгэж байна...")

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"]

schedule_assignments = [
    (d1, "Dr. Мөнхбат"),
    (d2, "Dr. Болд"),
    (d3, "Dr. Энхтуяа"),
]

for doctor_id, label in schedule_assignments:
    if not doctor_id:
        print(f"  {ERR}  {label} — doctor not created, skipping schedules")
        continue
    for day in DAYS:
        r = post(
            "/api/v1/schedules/",
            {
                "doctor_id": doctor_id,
                "day_of_week": day,
                "start_time": "09:00:00",
                "end_time": "17:00:00",
                "max_patients": 5,
                "is_active": True,
            },
        )
        if r:
            created["schedules"] += 1

    day_count = sum(1 for day in DAYS)
    print(f"  {OK}  {label} — Да-Ба 5 өдрийн хуваарь")


# ── Summary ───────────────────────────────────────────────────────────────────
print(f"""
{'─' * 50}
✅ Seed дууслаа!
   Эмнэлэг:  {created['hospitals']}
   Эмч:      {created['doctors']}    (нэвтрэх: doctor123)
   Оршин суугч:   {created['patients']}   (нэвтрэх: patient123)
   Хуваарь:  {created['schedules']}
""")

if errors:
    print(f"⚠️  {len(errors)} алдаа гарлаа:")
    for e in errors:
        print(f"   - {e}")
    print("\nЗааврууд:")
    print(
        "  1. Backend ажиллаж байгаа эсэхийг шалгана уу: cd server && uvicorn app.main:app"
    )
    print("  2. Мэдээлэл давхардаж байвал: Аль хэдийн бүртгэлтэй байж болно")
