from neo4j import GraphDatabase
import os
import pandas as pd
from dotenv import load_dotenv
import random

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://b4273b6a.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USER", "b4273b6a")
NEO4J_PASS = os.getenv("NEO4J_PASS", "63uRPuu5bneW30RKdUHg4SfWMw9d-S3XO_kKwqR55dI")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

# Load events.csv
df_events = pd.read_csv("../events.csv")
event_names = df_events['event_name'].unique().tolist()
print(f"Found {len(event_names)} unique events: {event_names[:5]}...")

def connect_random_users(tx, event_name, num_users=10):
    # Get random users (limit to avoid too many rels)
    users_result = tx.run("MATCH (u:users) RETURN u.name, u.user_id LIMIT 50")
    users = list(users_result)
    selected_users = random.sample(users, min(num_users, len(users)))
    
    for user in selected_users:
        tx.run("""
            MATCH (u:users {user_id: $user_id})
            MATCH (e:events {event_name: $event_name})
            MERGE (u)-[:ATTENDING]->(e)
        """, user_id=user['u.user_id'], event_name=event_name)
    print(f"Connected {len(selected_users)} random users to '{event_name}'")

with driver.session(database="b4273b6a") as session:
    for event_name in event_names:
        session.execute_write(connect_random_users, event_name, random.randint(5, 20))
        print(f"Processed {event_name}")

driver.close()
print("ALL users connected to events.csv events!")
print("Run count_users.py to verify increased attending rels.")
