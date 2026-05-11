PYTHON=.venv/bin/python3
UVICORN=.venv/bin/uvicorn
APP=app.main:app
PIP=.venv/bin/pip
ALEMBIC=.venv/bin/alembic


.PHONY: help install dev start test migrate clean

help:
	@echo "  Ашиглах боломжтой командууд:"
	@echo "  ========================================================================== "
	@echo "  make install  - requirements.txt ажиллуулах"
	@echo "  make freeze   - Суугдсан сангуудыг requirements.txt-д оруулах"
	@echo "  make add      - Package бүрийг нэг нэгээр нь суулгах (pkg='package names') "
	@echo "  make dev      - Development горимд асаах (reload-той)"
	@echo "  make start    - Production горимд асаах"
	@echo "  make test     - Проджект дээрх тестүүдийг ажиллуулах"
	@echo "  make migrate  - DB шилжилт (Alembic) хийх"
	@echo "  make clean    - Түр зуурын файлуудыг цэвэрлэх"

install:
	$(PIP) install -r requirements.txt

add:
	$(PIP) install $(pkg)
	$(PIP) freeze > requirements.txt

freeze:
	$(PIP) freeze > requirements.txt

dev:
	$(UVICORN) $(APP) --reload --port 8000

start:
	$(UVICORN) $(APP) --host 0.0.0.0 --port 8000

test:
	python3 -m pytest

migrate:
	$(ALEMBIC) revision --autogenerate -m $(msg)
	$(ALEMBIC) upgrade head

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 
	find . -type f -name "*.pyc" -delete