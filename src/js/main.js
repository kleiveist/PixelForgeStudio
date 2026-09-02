import { DEFAULT_STATE } from "./config/default-state.js";
import { FORM_SECTIONS } from "./config/form-schema.js";
import {
  buildProjectOutputs,
  getResolvedMetrics,
  mergeState,
  validateState
} from "./core/prompt-builder.js";
import {
  copyText,
  createJsonExport,
  createTextExport,
  downloadText,
  sanitizeFilename
} from "./core/exporter.js";
import {
  clearAutosave,
  deletePreset,
  getPreset,
  listPresets,
  loadAutosave,
  saveAutosave,
  savePreset
} from "./core/storage.js";
import {
  readControlValue,
  renderForm,
  updateConditionalControls
} from "./ui/form-renderer.js";
import {
  renderMetrics,
  renderOutputs,
  renderValidation
} from "./ui/output-renderer.js";

const elements = {
  form: document.querySelector("#generator-form"),
  formSections: document.querySelector("#form-sections"),
  outputs: document.querySelector("#outputs"),
  validation: document.querySelector("#validation-panel"),
  metrics: document.querySelector("#metrics"),
  autosaveStatus: document.querySelector("#autosave-status"),
  presetName: document.querySelector("#preset-name"),
  presetSelect: document.querySelector("#preset-select"),
  savePreset: document.querySelector("#save-preset"),
  loadPreset: document.querySelector("#load-preset"),
  deletePreset: document.querySelector("#delete-preset"),
  importButton: document.querySelector("#import-config"),
  importFile: document.querySelector("#import-file"),
  exportJson: document.querySelector("#export-json"),
  exportText: document.querySelector("#export-text"),
  copyAll: document.querySelector("#copy-all"),
  reset: document.querySelector("#reset-defaults"),
  regenerate: document.querySelector("#regenerate"),
  toast: document.querySelector("#toast"),
  outputCount: document.querySelector("#output-count")
};

const autosave = loadAutosave();
let state = mergeState(autosave?.state ?? DEFAULT_STATE);
let outputs = [];
let renderTimer = null;
let toastTimer = null;

function showToast(message, kind = "success") {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.dataset.kind = kind;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2600);
}

function updateAutosaveLabel(saved) {
  if (!elements.autosaveStatus) return;
  elements.autosaveStatus.textContent = saved
    ? `Automatisch gespeichert · ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
    : "Lokale Speicherung nicht verfügbar";
}

function refreshPresetSelect(selectedName = "") {
  const presets = listPresets();
  elements.presetSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = presets.length ? "Gespeichertes Preset wählen …" : "Noch keine Presets gespeichert";
  elements.presetSelect.append(placeholder);

  for (const preset of presets) {
    const option = document.createElement("option");
    option.value = preset.name;
    option.textContent = preset.name;
    option.selected = preset.name === selectedName;
    elements.presetSelect.append(option);
  }

  elements.loadPreset.disabled = !presets.length;
  elements.deletePreset.disabled = !presets.length;
}

async function handleCopy(text) {
  try {
    await copyText(text);
    showToast("Prompt wurde kopiert.");
  } catch (error) {
    showToast(error.message || "Kopieren fehlgeschlagen.", "error");
  }
}

function renderProject({ persist = true } = {}) {
  outputs = buildProjectOutputs(state);
  const validation = validateState(state);
  const metrics = getResolvedMetrics(state);

  updateConditionalControls(elements.form, state);
  renderOutputs(elements.outputs, outputs, handleCopy);
  renderValidation(elements.validation, validation);
  renderMetrics(elements.metrics, state, metrics);
  elements.outputCount.textContent = `${outputs.length} Prompt-Paket${outputs.length === 1 ? "" : "e"}`;

  if (persist) {
    const saved = saveAutosave(state);
    updateAutosaveLabel(saved);
  }
}

function scheduleRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(() => renderProject(), 120);
}

function replaceState(nextState, { toastMessage = "Konfiguration geladen." } = {}) {
  state = mergeState(nextState);
  renderForm(elements.formSections, FORM_SECTIONS, state);
  updateConditionalControls(elements.form, state);
  renderProject();
  showToast(toastMessage);
}

function defaultPresetName() {
  const project = String(state.projectName || "Pixelart").trim();
  const asset = state.assetType || "asset";
  const mode = state.outputMode || "prompt";
  return `${project} · ${asset} · ${mode}`;
}

elements.form.addEventListener("input", (event) => {
  const control = event.target.closest("[data-field]");
  if (!control) return;
  const key = control.dataset.field;
  state = { ...state, [key]: readControlValue(control) };
  updateConditionalControls(elements.form, state);
  scheduleRender();
});

elements.form.addEventListener("change", (event) => {
  const control = event.target.closest("[data-field]");
  if (!control) return;
  const key = control.dataset.field;
  state = { ...state, [key]: readControlValue(control) };
  updateConditionalControls(elements.form, state);
  renderProject();
});

elements.regenerate.addEventListener("click", () => {
  renderProject();
  showToast("Prompts wurden neu erzeugt.");
});

elements.copyAll.addEventListener("click", () => {
  handleCopy(createTextExport(state, outputs));
});

elements.exportText.addEventListener("click", () => {
  const base = sanitizeFilename(state.projectName, "pixelart-prompt");
  downloadText(`${base}-prompts.txt`, createTextExport(state, outputs));
  showToast("Textdatei wurde erstellt.");
});

elements.exportJson.addEventListener("click", () => {
  const base = sanitizeFilename(state.projectName, "pixelart-prompt");
  const payload = createJsonExport(state, outputs);
  downloadText(`${base}-konfiguration.json`, `${JSON.stringify(payload, null, 2)}\n`, "application/json;charset=utf-8");
  showToast("Konfiguration wurde exportiert.");
});

elements.importButton.addEventListener("click", () => elements.importFile.click());

elements.importFile.addEventListener("change", async () => {
  const [file] = elements.importFile.files;
  elements.importFile.value = "";
  if (!file) return;

  try {
    const parsed = JSON.parse(await file.text());
    const importedState = parsed.state ?? parsed;
    replaceState(importedState, { toastMessage: "Konfiguration wurde importiert." });
  } catch {
    showToast("Die JSON-Datei konnte nicht gelesen werden.", "error");
  }
});

elements.savePreset.addEventListener("click", () => {
  const name = elements.presetName.value.trim() || defaultPresetName();
  try {
    const preset = savePreset(name, state);
    elements.presetName.value = preset.name;
    refreshPresetSelect(preset.name);
    showToast(`Preset „${preset.name}“ gespeichert.`);
  } catch (error) {
    showToast(error.message || "Preset konnte nicht gespeichert werden.", "error");
  }
});

elements.loadPreset.addEventListener("click", () => {
  const name = elements.presetSelect.value;
  const preset = getPreset(name);
  if (!preset) {
    showToast("Bitte zuerst ein Preset wählen.", "error");
    return;
  }
  elements.presetName.value = preset.name;
  replaceState(preset.state, { toastMessage: `Preset „${preset.name}“ geladen.` });
});

elements.deletePreset.addEventListener("click", () => {
  const name = elements.presetSelect.value;
  if (!name) {
    showToast("Bitte zuerst ein Preset wählen.", "error");
    return;
  }
  if (deletePreset(name)) {
    if (elements.presetName.value === name) elements.presetName.value = "";
    refreshPresetSelect();
    showToast(`Preset „${name}“ gelöscht.`);
  }
});

elements.reset.addEventListener("click", () => {
  clearAutosave();
  elements.presetName.value = "";
  replaceState(DEFAULT_STATE, { toastMessage: "Standardwerte wurden wiederhergestellt." });
});

window.addEventListener("beforeunload", () => {
  saveAutosave(state);
});

renderForm(elements.formSections, FORM_SECTIONS, state);
updateConditionalControls(elements.form, state);
refreshPresetSelect();
renderProject({ persist: false });
updateAutosaveLabel(Boolean(autosave));
