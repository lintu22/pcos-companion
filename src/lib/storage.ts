"use client";

import { useSyncExternalStore } from "react";
import { ProfileAnalysis, IntakeAnswers } from "./scoring";

export interface StoredProfile {
  analysis: ProfileAnalysis;
  answers: IntakeAnswers;
  source: "ai" | "fallback";
  createdAt: string;
}

export interface CheckIn {
  id: string;
  date: string;
  helpful: boolean;
  moodOrSymptomChange: "better" | "same" | "worse";
  note: string;
}

const PROFILE_KEY = "pcos-companion:profile";
const CHECKINS_KEY = "pcos-companion:checkins";

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// useSyncExternalStore requires getSnapshot to return a stable reference when the
// underlying data hasn't changed, so we cache the parsed value keyed on the raw string.
let profileCache: { raw: string | null; value: StoredProfile | null } = { raw: undefined as never, value: null };
let checkInsCache: { raw: string | null; value: CheckIn[] } = { raw: undefined as never, value: [] };

export function useStoredProfile(): StoredProfile | null {
  return useSyncExternalStore(subscribe, () => loadProfile(), () => null);
}

export function useStoredCheckIns(): CheckIn[] {
  return useSyncExternalStore(subscribe, () => loadCheckIns(), () => []);
}

export function saveProfile(profile: StoredProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  notify();
}

export function loadProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (raw === profileCache.raw) return profileCache.value;
  let value: StoredProfile | null = null;
  try {
    value = raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch {
    value = null;
  }
  profileCache = { raw, value };
  return value;
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
  notify();
}

export function loadCheckIns(): CheckIn[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHECKINS_KEY);
  if (raw === checkInsCache.raw) return checkInsCache.value;
  let value: CheckIn[] = [];
  try {
    value = raw ? (JSON.parse(raw) as CheckIn[]) : [];
  } catch {
    value = [];
  }
  checkInsCache = { raw, value };
  return value;
}

export function addCheckIn(entry: Omit<CheckIn, "id" | "date">) {
  const existing = loadCheckIns();
  const newEntry: CheckIn = {
    ...entry,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  const updated = [newEntry, ...existing];
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(updated));
  notify();
  return updated;
}
