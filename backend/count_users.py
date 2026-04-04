from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://b4273b6a.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USER", "b4273b6a")
NEO4J_PASS = os.getenv("NEO4J_PASS", "63uRPuu5bneW30RKdUHg4SfWMw9d-S3XO_kKwqR55dI")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

with driver.session(database="b4273b6a") as session:
    # Try User label
    result = session.run('MATCH (u:User) RETURN count(u) as count')
    user_count = [record['count'] for record in result][0]
    print(f"User nodes: {user_count}")
    
# Users, Events, Attending nodes
    result = session.run('MATCH (u:users) RETURN count(u) as count')
    users_count = [record['count'] for record in result][0]
    print(f"users nodes: {users_count}")
    
    result = session.run('MATCH (e:events) RETURN count(e) as count')
    events_count = [record['count'] for record in result][0]
    print(f"events nodes: {events_count}")
    
    result = session.run('MATCH (a:attending) RETURN count(a) as count')
    attending_count = [record['count'] for record in result][0]
    print(f"attending nodes: {attending_count}")
    
    # List all labels
    result = session.run('CALL db.labels() YIELD label RETURN label')
    labels = [record['label'] for record in result]
    print(f"Node labels: {labels}")
    
    # Event count
    result = session.run('MATCH (e:Event) RETURN count(e) as count')
    event_count = [record['count'] for record in result][0]
    print(f"Event nodes: {event_count}")

