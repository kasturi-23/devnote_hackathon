from dash import MATCH
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
import os
from neo4j import GraphDatabase
from openai import OpenAI
import json
from typing import List, Dict
from fastapi import Request

load_dotenv()

app = FastAPI(title="DevNote API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).parent
CSV_PATH = BASE_DIR.parent / "events.csv"

# Neo4j
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://b4273b6a.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USER", "b4273b6a")
NEO4J_PASS = os.getenv("NEO4J_PASS", "")
neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

# OpenAI client created in endpoint to avoid startup error

@app.get("/api/events")
async def get_events():
    try:
        df = pd.read_csv(CSV_PATH)
        events = df[['event_name', 'event_date', 'event_location', 'event_type']].to_dict('records')
        return {"events": events}
    except FileNotFoundError:
        return {"error": "events.csv not found"}

@app.post("/api/recommend")
async def get_recommendations(request: Request):
    form_data = await request.form()
    event_name = form_data.get("event_name")
    user_name = form_data.get("user_name")
    user_skills = form_data.get("user_skills")
    user_interests = form_data.get("user_interests")
    user_goal = form_data.get("user_goal")
    if not all([event_name, user_name, user_skills, user_interests, user_goal]):
        raise HTTPException(400, "Missing fields")
    try:
        print(f"DEBUG: Querying Neo4j for event_name='{event_name}', skills='{user_skills}', interests='{user_interests}', goal='{user_goal}'")
        matches = []
        try:
            with neo4j_driver.session(database="b4273b6a") as session:
                print("DEBUG: Session opened")
                # Check event existence first
                event_check = session.run("MATCH (e:events {event_name: $name}) RETURN count(e) as cnt", name=event_name)
                event_cnt = [record["cnt"] for record in event_check][0]
                print(f"DEBUG: Events matching '{event_name}': {event_cnt}")
                if event_cnt > 0:
                    matches_result = session.run("""
                    MATCH (u:users)-[r:ATTENDING]->(e:events {event_name: $event_name})
                    WHERE u.skills CONTAINS $user_skills OR u.interests CONTAINS $user_interests OR u.networking_goals CONTAINS $user_goal
                    RETURN u.name AS name, u.skills AS skills, u.interests AS interests, 
                           u.networking_goals AS networking_goals
                    ORDER BY rand()
                    LIMIT 5
                    """, event_name=event_name, user_skills=user_skills, user_interests=user_interests, user_goal=user_goal)
                    print("DEBUG: Neo4j match query executed successfully")
                    matches = [{"name": record["name"], "skills": record["skills"], "interests": record["interests"], "networking_goals": record["networking_goals"], "score": 1.0} for record in matches_result]
                else:
                    print("DEBUG: No matching event found, empty matches")
            print("DEBUG: Neo4j block complete")
        except Exception as neo_err:
            print(f"NEO4J ERROR (full): {type(neo_err).__name__}: {neo_err}")
            import traceback
            traceback.print_exc()
            matches = [{"name": "Neo4j error", "error": str(neo_err)}]



        # Fallback if no matches
        if not matches:
            matches = [{"name": "No strong matches", "skills": "", "interests": "", "score": 0.0}]

        print("DEBUG: Neo4j matches found:", len(matches))
        # Step 2: LLM for icebreakers/paths (top 5)
        print("DEBUG: Calling OpenAI...")
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("WARNING: No OPENAI_API_KEY, skipping LLM")
            llm_result = {"who_to_meet": [], "icebreakers": {}, "networking_paths": []}
        else:
            prompt = f"""
        User: {user_name}, skills: {user_skills}, interests: {user_interests}, goal: {user_goal}
        Event: {event_name}
        Top 5 Matches: {json.dumps(matches[:5])}

        Generate ONLY valid JSON:
        {{
          "who_to_meet": [
            {{"name": "Match1 Name", "why": "2-3 sentence reason (shared skills/interests/goals)", "score": 0.9}}
          ],
          "icebreakers": {{"Match1 Name": ["Icebreaker 1", "Icebreaker 2"]}},
          "networking_paths": ["Path 1: step→step→step", "Path 2: ..."]
        }}
        """

            try:
                openai_client = OpenAI(api_key=api_key)
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                llm_result = json.loads(response.choices[0].message.content)
                print("DEBUG: OpenAI success")
            except Exception as llm_err:
                print(f"LLM error: {llm_err}")
                llm_result = {"who_to_meet": [], "icebreakers": {}, "networking_paths": []}

        return {
            "matches": matches,
            "llm_result": llm_result
        }
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

