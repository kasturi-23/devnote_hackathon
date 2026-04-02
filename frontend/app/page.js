"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

const ROCKETRIDE_BASE = process.env.NEXT_PUBLIC_ROCKETRIDE_URI || "http://localhost:5565";

function extractTextPayload(payload) {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return payload;
  }

  const candidates = [
    payload.answer,
    payload.output,
    payload.response,
    payload.message,
    payload.content,
    payload.text,
    payload.result,
    payload.data,
    payload?.choices?.[0]?.message?.content,
  ];

  for (const item of candidates) {
    if (typeof item === "string") {
      return item;
    }
    if (item && typeof item === "object") {
      return JSON.stringify(item);
    }
  }

  return JSON.stringify(payload);
}

function parseJsonBlock(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function callRocketRide(prompt) {
  const endpoints = [
    `${ROCKETRIDE_BASE}/api/chat`,
    `${ROCKETRIDE_BASE}/chat`,
    `${ROCKETRIDE_BASE}/run`,
    `${ROCKETRIDE_BASE}/workflow/run`,
    `${ROCKETRIDE_BASE}/api/workflow/run`,
    `${ROCKETRIDE_BASE}/v1/chat/completions`,
  ];

  const payloads = [
    { message: prompt },
    { question: prompt },
    { input: prompt },
    {
      messages: [{ role: "user", content: prompt }],
    },
  ];

  let lastError = "Unable to reach Rocket Ride service";

  for (const endpoint of endpoints) {
    for (const body of payloads) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          lastError = `${response.status} ${response.statusText}`;
          continue;
        }

        const payload = await response.json();
        const text = extractTextPayload(payload);
        if (text) {
          return text;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Request failed";
      }
    }
  }

  throw new Error(lastError);
}

export default function Home() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedUser = useMemo(() => {
    return users.find((user) => user.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  const selectedEvent = useMemo(() => {
    return events.find((event) => event.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      setErrorMessage("");

      try {
        const raw = await callRocketRide(
          [
            "Query Neo4j and return only JSON.",
            "Need top 50 users for event selection.",
            "JSON shape: {\"users\":[{\"id\":\"...\",\"name\":\"...\",\"skill\":\"...\",\"interest\":\"...\",\"goal\":\"...\"}]}",
            "No markdown, no extra text.",
          ].join(" ")
        );

        const parsed = parseJsonBlock(raw);
        const userList = Array.isArray(parsed?.users) ? parsed.users : [];

        if (!userList.length) {
          throw new Error("Rocket Ride returned no users");
        }

        setUsers(userList);
        setSelectedUserId(userList[0].id);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `Live data unavailable: ${error.message}`
            : "Live data unavailable"
        );
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    const loadAttendingEvents = async () => {
      setIsLoadingEvents(true);
      setErrorMessage("");

      try {
        const raw = await callRocketRide(
          [
            "Query Neo4j and return only JSON.",
            `Find events attended by user id ${selectedUser.id} or name ${selectedUser.name}.`,
            "JSON shape: {\"events\":[{\"id\":\"...\",\"name\":\"...\",\"date\":\"...\",\"location\":\"...\",\"type\":\"...\",\"speakerTopic\":\"...\"}]}",
            "No markdown, no extra text.",
          ].join(" ")
        );

        const parsed = parseJsonBlock(raw);
        const eventList = Array.isArray(parsed?.events) ? parsed.events : [];

        setEvents(eventList);
        setSelectedEventId(eventList[0]?.id ?? "");
      } catch (error) {
        setEvents([]);
        setSelectedEventId("");
        setErrorMessage(
          error instanceof Error
            ? `Could not load events: ${error.message}`
            : "Could not load events"
        );
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadAttendingEvents();
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser || !selectedEvent) {
      setSuggestions([]);
      return;
    }

    const loadRecommendations = async () => {
      setIsLoadingSuggestions(true);
      setErrorMessage("");

      try {
        const raw = await callRocketRide(
          [
            "Query Neo4j and return only JSON.",
            `Selected user is ${selectedUser.name} (${selectedUser.id}).`,
            `Selected event is ${selectedEvent.name} (${selectedEvent.id}).`,
            "Recommend top 3 relevant events to also attend.",
            "JSON shape: {\"recommendations\":[{\"id\":\"...\",\"name\":\"...\",\"type\":\"...\",\"location\":\"...\",\"speakerTopic\":\"...\",\"score\":78,\"reasons\":[\"...\",\"...\"]}]}",
            "No markdown, no extra text.",
          ].join(" ")
        );

        const parsed = parseJsonBlock(raw);
        const recommendationList = Array.isArray(parsed?.recommendations)
          ? parsed.recommendations
          : [];

        setSuggestions(recommendationList);
      } catch (error) {
        setSuggestions([]);
        setErrorMessage(
          error instanceof Error
            ? `Could not load recommendations: ${error.message}`
            : "Could not load recommendations"
        );
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadRecommendations();
  }, [selectedUser, selectedEvent]);

  const handleUserChange = (event) => {
    const nextUserId = event.target.value;
    setSelectedUserId(nextUserId);
  };

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.kicker}>DevNote Match Explorer</p>
          <h1>Select attendee, pick event, get recommendations</h1>
          <p>
            Frontend-only mode using Rocket Ride workflow with Neo4j live data.
          </p>
          <p className={styles.helperText}>Service URL: {ROCKETRIDE_BASE}</p>
        </header>

        {errorMessage ? <p className={styles.errorBanner}>{errorMessage}</p> : null}

        <section className={styles.controlsGrid}>
          <article className={styles.panel}>
            <label htmlFor="userSelect">1) Choose User</label>
            <select
              id="userSelect"
              value={selectedUserId}
              onChange={handleUserChange}
              disabled={isLoadingUsers || users.length === 0}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            {isLoadingUsers ? <p className={styles.helperText}>Loading users from Neo4j...</p> : null}

            {selectedUser ? (
              <div className={styles.userMeta}>
                <span>Skill: {selectedUser.skill}</span>
                <span>Interest: {selectedUser.interest}</span>
                <span>Goal: {selectedUser.goal}</span>
              </div>
            ) : null}
          </article>

          <article className={styles.panel}>
            <label htmlFor="eventSelect">2) Select Attending Event</label>
            <select
              id="eventSelect"
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              disabled={isLoadingEvents || events.length === 0}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>

            {isLoadingEvents ? (
              <p className={styles.helperText}>Loading attending events from Neo4j...</p>
            ) : null}

            {selectedEvent ? (
              <div className={styles.eventCard}>
                <h3>{selectedEvent.name}</h3>
                <p>
                  {selectedEvent.type} | {selectedEvent.location}
                </p>
                <p>
                  {selectedEvent.date} | Topic: {selectedEvent.speakerTopic}
                </p>
              </div>
            ) : null}
          </article>
        </section>

        <section className={styles.results}>
          <h2>3) Recommendation Matches</h2>
          {isLoadingSuggestions ? (
            <p className={styles.helperText}>Loading recommendation matches...</p>
          ) : null}
          <div className={styles.cards}>
            {suggestions.map((event) => (
              <article key={event.id} className={styles.matchCard}>
                <div className={styles.cardTop}>
                  <h3>{event.name}</h3>
                  <span className={styles.score}>{event.score}% match</span>
                </div>
                <p>
                  {event.type} | {event.location}
                </p>
                <p>{event.speakerTopic}</p>
                <div className={styles.reasonRow}>
                  {event.reasons.map((reason) => (
                    <span key={reason} className={styles.reasonChip}>
                      {reason}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
