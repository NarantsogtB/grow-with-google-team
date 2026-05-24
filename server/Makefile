PYTHON=.venv/bin/python3
UVICORN=.venv/bin/uvicorn
APP=app.main:app
PIP=.venv/bin/pip
ALEMBIC=.venv/bin/alembic


.PHONY: help install dev start test test-html migrate clean

help:
	@echo "  Ашиглах боломжтой командууд:"
	@echo "  ========================================================================== "
	@echo "  make install    - requirements.txt ажиллуулах"
	@echo "  make freeze     - Суугдсан сангуудыг requirements.txt-д оруулах"
	@echo "  make add        - Package бүрийг нэг нэгээр нь суулгах (pkg='package names') "
	@echo "  make active     - Python environment-г идэвхжүүлэх"
	@echo "  make dev        - Development горимд асаах (reload-той)"
	@echo "  make start      - Production горимд асаах"
	@echo "  make test       - Тестүүдийг ажиллуулж, дутуу функцуудыг терминал дээр харах"
	@echo "  make test-html  - Тестийн тайланг улаан, ногооноор HTML вэб хуудсаар харах"
	@echo "  make migrate    - DB шилжилт (Alembic) хийх"
	@echo "  make clean      - Түр зуурын файлуудыг цэвэрлэх"

install:
	$(PIP) install -r requirements.txt

add:
	$(PIP) install $(pkg)
	$(PIP) freeze > requirements.txt

active:
	source .venv/bin/activate

freeze:
	$(PIP) freeze > requirements.txt

dev:
	$(UVICORN) $(APP) --reload --port 8000

start:
	$(UVICORN) $(APP) --host 0.0.0.0 --port 8000

test:
	PYTHONPATH=. pytest --cov=app --cov-report=term-missing

test-html:
	PYTHONPATH=. pytest --cov=app --cov-report=html
	open htmlcov/index.html

migrate:
	$(ALEMBIC) revision --autogenerate -m '$(msg)'
	$(ALEMBIC) upgrade head

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov # Тестийн үлдээсэн түр зуурын файлуудыг цэвэрлэнэ