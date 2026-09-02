const AUTOSAVE_KEY = "pixelart-prompt-studio:autosave:v1";
const PRESETS_KEY = "pixelart-prompt-studio:presets:v1";

function storageAvailable() {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function readJson(key, fallback) {
  if (!storageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadAutosave() {
  return readJson(AUTOSAVE_KEY, null);
}

export function saveAutosave(state) {
  return writeJson(AUTOSAVE_KEY, {
    savedAt: new Date().toISOString(),
    state
  });
}

export function clearAutosave() {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.removeItem(AUTOSAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function listPresets() {
  const raw = readJson(PRESETS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((preset) => preset && typeof preset.name === "string" && preset.state)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export function savePreset(name, state) {
  const cleanName = String(name || "").trim();
  if (!cleanName) {
    throw new Error("Der Preset-Name darf nicht leer sein.");
  }

  const presets = listPresets();
  const existingIndex = presets.findIndex((preset) => preset.name.toLowerCase() === cleanName.toLowerCase());
  const record = {
    name: cleanName,
    updatedAt: new Date().toISOString(),
    state
  };

  if (existingIndex >= 0) {
    presets[existingIndex] = record;
  } else {
    presets.push(record);
  }

  writeJson(PRESETS_KEY, presets);
  return record;
}

export function deletePreset(name) {
  const cleanName = String(name || "").trim();
  const presets = listPresets();
  const next = presets.filter((preset) => preset.name !== cleanName);
  writeJson(PRESETS_KEY, next);
  return next.length !== presets.length;
}

export function getPreset(name) {
  return listPresets().find((preset) => preset.name === name) ?? null;
}
