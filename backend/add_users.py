from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://b4273b6a.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USER", "b4273b6a")
NEO4J_PASS = os.getenv("NEO4J_PASS", "63uRPuu5bneW30RKdUHg4SfWMw9d-S3XO_kKwqR55dI")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

users = [
    {"name": "Alice Johnson", "skills": "Python,FastAPI,Neo4j", "interests": "AI,Hackathons", "networking_goals": "Find co-founders"},
    {"name": "Bob Smith", "skills": "JavaScript,React,Next.js", "interests": "Web Dev,Open Source", "networking_goals": "Mentor juniors"},
    {"name": "Carol Davis", "skills": "ML,TensorFlow,Pytorch", "interests": "Data Science,AI Ethics", "networking_goals": "Job opportunities"},
    {"name": "David Wilson", "skills": "DevOps,Docker,Kubernetes", "interests": "Cloud,CI/CD", "networking_goals": "Collaborate on projects"},
    {"name": "Eve Brown", "skills": "Node.js,Express,MongoDB", "interests": "Fullstack,Hackathons", "networking_goals": "Co-founders"},
    {"name": "Frank Miller", "skills": "Rust,Go,Systems", "interests": "Blockchain,Security", "networking_goals": "Tech leads"},
    {"name": "Grace Lee", "skills": "TypeScript,Vue,NestJS", "interests": "Frontend,Performance", "networking_goals": "Mentors"},
    {"name": "Henry Garcia", "skills": "AWS,Serverless,Terraform", "interests": "Cloud Native", "networking_goals": "DevOps roles"},
    {"name": "Ivy Chen", "skills": "GraphQL,Apollo,Prisma", "interests": "APIs,Real-time", "networking_goals": "Fullstack teams"},
    {"name": "Jack Taylor", "skills": "Android,Kotlin,Jetpack", "interests": "Mobile,UX", "networking_goals": "App devs"},
    {"name": "Kara Patel", "skills": "iOS,Swift,SwiftUI", "interests": "Mobile,iOS", "networking_goals": "Mentors"},
    {"name": "Leo Nguyen", "skills": "PostgreSQL,Redis,Elasticsearch", "interests": "Databases,Search", "networking_goals": "Backend roles"},
    {"name": "Mia Rodriguez", "skills": "Cybersecurity,Penetration Testing", "interests": "Security,Hacking", "networking_goals": "Ethical hackers"},
    {"name": "Noah Kim", "skills": "Flutter,Dart,Cross-platform", "interests": "Mobile Dev", "networking_goals": "Teams"},
    {"name": "Olivia Marti", "skills": "Gatsby,Strapi,Headless CMS", "interests": "JAMstack", "networking_goals": "Frontend devs"},
    {"name": "Paul Khan", "skills": "Solidity,Ethereum,Web3", "interests": "Blockchain,DeFi", "networking_goals": "Web3 builders"},
    {"name": "Quinn Lopez", "skills": "Svelte,SvelteKit,Tailwind", "interests": "Modern Frontend", "networking_goals": "UI/UX"},
    {"name": "Riley Scott", "skills": "Django,DRF,Celery", "interests": "Python Web", "networking_goals": "Python devs"},
    {"name": "Sophia Wang", "skills": "LangChain,LlamaIndex,RAG", "interests": "LLM Apps", "networking_goals": "AI engineers"},
    {"name": "Tom Baker", "skills": "Unity,Unreal,C# Games", "interests": "Game Dev,VR", "networking_goals": "Game studios"}
]

def add_users(tx):
    event_name = "Otcom"  # Sample event from events.csv
    for user in users:
        tx.run("""
MERGE (u:users {name: $name, user_id: 'user-' + $name.replace(' ', '_').lower()})
            SET u.skills = $skills, u.interests = $interests, u.networking_goals = $networking_goals
MERGE (e:events {event_name: $event_name, event_id: 'otcom-1'})
            MERGE (u)-[:ATTENDING]->(e)
        """, name=user['name'], skills=user['skills'], interests=user['interests'], 
              networking_goals=user['networking_goals'], event_name=event_name)
    print(f"Added {len(users)} tech-focused users to :users, linked to '{event_name}' event.")

with driver.session(database="b4273b6a") as session:
    session.execute_write(add_users)
    print("Users added successfully!")

driver.close()

