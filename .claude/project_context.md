# Project Context: Family Clinic Home Visit AI Assistant (FamilyDoc-AI)

## 1. Project Overview

An AI-powered system designed to automate and optimize the home visit workflow for family doctors in Mongolia, saving time, fuel, and reducing administrative overhead.

## 2. Core Problems & AI Solutions

1. **Patients Not at Home:** The system uses a Telegram Bot to send weekly/daily pre-visit confirmations. Based on patient replies, the AI Orchestrator updates the schedule. If a patient is unavailable, it automatically shifts the next available patient forward to fill the slot.
2. **Navigation Issues (Getting Lost):** Based on the confirmed daily schedule, the system calculates the optimal route using localized addressing. Since standard addresses in Mongolia (especially yurt/ger districts) are unreliable, the system uses **What3Words** converted into geographic coordinates to plot the most efficient path via a deterministic routing tool.
3. **Double Data Entry (Medical Notes):** During the visit, the doctor uses Speech-to-Text (STT) to dictate findings. The AI converted text is editable. Once approved, a specialized Medical Agent structures the raw text into the international **SOAP (Subjective, Objective, Assessment, Plan)** medical standard, ready for the doctor to copy/paste into the official state health registry system.

## 4. Architecture & Token Optimization Strategy

To minimize LLM token consumption and cost, all computational and algorithmic tasks are offloaded to pure Python code (Deterministic Tools). The LLM is strictly used for classification and natural language structuring.

### LangGraph State & Agent Structure

- **Orchestrator Agent:** The central router that intercepts user inputs/webhooks and routes them to the correct tool or sub-agent.
- **Schedule Sub-Agent:** Analyzes Telegram text responses to detect patient availability.
- **SOAP Medical Sub-Agent:** Converts raw STT transcriptions into a standard SOAP note using specialized clinical prompting with few-shot examples (handling mixed Mongolian, English, and Latin medical jargon).

### Core Deterministic Tools (Zero-Token Cost for Processing)

- `reorder_schedule_tool(current_schedule, unavailable_patient_id)`: Interacts with the DB via SQLAlchemy AsyncSession to shift schedules without involving LLM text generation.
- `calculate_shortest_route_tool(w3w_locations_list)`: Converts What3Words addresses into Latitude/Longitude coordinates using the What3Words API, then applies the Haversine formula or a lightweight TSP (Traveling Salesman Problem) algorithm to return the sorted, optimal route.

## 5. Current Implementation Status & Challenges

- Basic models, async migrations (Alembic), and CRUD operations for Users, Patients, Schedules, and Visits are implemented in FastAPI.
- **CHALLENGE:** The code needs a strict code review/audit. It might contain anti-patterns regarding SQLAlchemy AsyncSession handling, error routing, or Pydantic validation.
- **TESTING & CI/CD:** Pytest and Faker need to be implemented. A production-ready GitHub Actions CI/CD pipeline needs to be established for automated testing and deployment to Google Cloud VM.

## 6. Development & Quality Guidelines

- **Scalable Folder Structure:** Must follow a clean, enterprise-grade architecture (e.g., Layered/Clean Architecture separating Router, Service, Repository, Agents, and Tools).
- **Automated Testing:** Pytest unit and integration tests must cover both CRUD services and AI tool invocations.
- **CI/CD:** Automated pipelines must lint, format, and test code before pushing to Google Cloud VM via Docker/Nginx.

## 7. Important Learning Developer Note

The developer is a junior engineer still learning advanced AI orchestration, clean software design, and DevOps practices.

- **CRITICAL INSTRUCTION:** When generating code, include step-by-step educational explanations.
- Explicitly explain how to get the necessary API keys (Google Gemini API Key, What3Words API Key, Telegram Bot Token), where to store them in the `.env` file, and how to initialize them securely in FastAPI dependencies.
