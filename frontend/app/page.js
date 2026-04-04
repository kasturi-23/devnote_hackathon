"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [userName, setUserName] = useState("");
  const [userSkills, setUserSkills] = useState("");
  const [userInterests, setUserInterests] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setError("Failed to load events. Start backend?");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          event_name: selectedEvent,
          user_name: userName,
          user_skills: userSkills,
          user_interests: userInterests,
          user_goal: userGoal,
        }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError("API error. Backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.kicker}>DevNote Event Networking</div>
          <h1>Find Who to Meet, Icebreakers & Paths</h1>
          <p>Enter details, get AI-powered networking recs from Neo4j + GPT.</p>
        </header>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.controlsGrid}>
          <section className={styles.panel}>
            <label>Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              required
            >
              <option value="">Select...</option>
              {events.map((ev, i) => (
                <option key={i}>{ev.event_name}</option>
              ))}
            </select>
          </section>

          <section className={styles.panel}>
            <label>Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className={styles.input}
            />
          </section>

          <section className={styles.panel}>
            <label>Skills (comma sep)</label>
            <input
              type="text"
              value={userSkills}
              onChange={(e) => setUserSkills(e.target.value)}
              placeholder="JS, React, AI"
              required
              className={styles.input}
            />
          </section>

          <section className={styles.panel}>
            <label>Interests (comma sep)</label>
            <input
              type="text"
              value={userInterests}
              onChange={(e) => setUserInterests(e.target.value)}
              placeholder="Web dev, Hackathons"
              required
              className={styles.input}
            />
          </section>

          <section className={styles.panel}>
            <label>Networking Goal</label>
            <input
              type="text"
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              placeholder="Find co-founders"
              required
              className={styles.input}
            />
          </section>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Generating..." : "Get Recommendations"}
          </button>
        </form>

        {results && (
          <section className={styles.results}>
            <h2>🎯 Your Networking Recommendations</h2>
            <div className={styles.recommendationsGrid}>
              {/* Top Matches List */}
              <div className={styles.matchSection}>
                <h3>
                  Top 5 Who to Meet{" "}
                  <span>({results.matches?.length || 0})</span>
                </h3>
                <div className={styles.matchesList}>
                  {(
                    results.llm_result?.who_to_meet ||
                    results.matches?.slice(0, 5) ||
                    []
                  ).map((person, i) => (
                    <div key={i} className={styles.personCard}>
                      <div className={styles.personHeader}>
                        <h4>{person.name || "Match"}</h4>
                        <div className={styles.score}>
                          {person.score
                            ? `Score: ${person.score.toFixed(1)}`
                            : "New"}
                        </div>
                      </div>
                      <p className={styles.why}>
                        {person.why || "Great potential match for your goals!"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Icebreakers */}
              <div className={styles.icebreakersSection}>
                <h3>💬 Icebreaker Lines</h3>
                {Object.entries(results.llm_result?.icebreakers || {}).map(
                  ([name, breakers]) => (
                    <div key={name} className={styles.icebreakerGroup}>
                      <strong>{name}:</strong>
                      <ul>
                        {Array.isArray(breakers) ? (
                          breakers.map((line, j) => <li key={j}>{line}</li>)
                        ) : (
                          <li>No lines</li>
                        )}
                      </ul>
                    </div>
                  ),
                )}
              </div>

              {/* Networking Paths */}
              <div className={styles.pathsSection}>
                <h3>🛤️ Networking Paths</h3>
                <ol className={styles.pathsList}>
                  {(
                    results.llm_result?.networking_paths || [
                      "Approach at event registration, chat shared interests, exchange contacts",
                    ]
                  ).map((path, i) => (
                    <li key={i}>{path}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
