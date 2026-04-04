# MeetMesh (DevNote Hackathon)

## Overview

DevNote is an AI-powered networking recommendation platform designed for hackathons and events. It helps users discover relevant attendees based on skills, interests, and goals, and generates personalized icebreakers and networking strategies using Neo4j graph database and OpenAI.

Built for the Devnovate Devnote Hackathon.

## Features

- **Event Attendee Discovery**: Query events and find matching users via graph relationships.
- **AI-Powered Recommendations**: Uses GPT-4o-mini to suggest who to meet, icebreakers, and step-by-step networking paths.
- **Full-Stack**: Next.js React frontend + FastAPI backend with Neo4j integration.
- **Data-Driven**: Loads events from CSV; Neo4j stores user-event connections.

## Tech Stack

- **Backend**: FastAPI, Neo4j (Aura DB), OpenAI API, Pandas
- **Frontend**: Next.js 16, React 19, Axios
- **Database**: Neo4j Graph Database
- **Deployment**: Uvicorn (dev server)

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 20+
- Neo4j Aura account (free tier OK) or local Neo4j
- OpenAI API key

### Setup Environment Variables

Copy `.env.example` to `.env` (create if missing) and fill:

```
NEO4J_URI=neo4j+s://your-aura-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASS=your_password
OPENAI_API_KEY=sk-...
```

**Populate Neo4j** (run once):

1. Load `people.csv` and `events.csv` into Neo4j as per backend logic (users with skills/interests/goals attending events).
2. Cypher example:
   ```
   LOAD CSV WITH HEADERS FROM 'file:///events.csv' AS row
   MERGE (e:events {event_name: row.event_name})
   ...
   ```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

API Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## API Endpoints

- `GET /api/events`: List events from CSV
- `POST /api/recommend`: Submit user details → get matches + AI suggestions

## Data Flow

1. User inputs profile/goals for an event.
2. Backend queries Neo4j: `(users)-[:ATTENDING]->(events)` matching skills/interests/goals.
3. OpenAI refines top matches into actionable advice.
4. Frontend displays recommendations.

## Development

- Backend: `cd backend && uvicorn main:app --reload`
- Frontend: `cd frontend && npm run dev`
- CORS enabled for localhost:3000

## Troubleshooting

- Neo4j connection: Check `.env` creds; ensure DB name matches (default: `neo4j` or Aura instance ID).
- OpenAI: Add `OPENAI_API_KEY`; falls back gracefully.
- CSVs: Place `events.csv` and `users.csv` in root.

