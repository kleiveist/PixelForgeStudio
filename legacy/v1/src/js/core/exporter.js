export function sanitizeFilename(value, fallback = "pixelart-prompt") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || fallback;
}

export function downloadText(filename, text, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text) {
  const value = String(text ?? "");
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const successful = document.execCommand("copy");
  textarea.remove();
  if (!successful) {
    throw new Error("Kopieren wurde vom Browser blockiert.");
  }
}

export function createTextExport(state, outputs) {
  const timestamp = new Date().toISOString();
  const header = [
    "PIXELART PROMPT STUDIO",
    `Projekt: ${state.projectName || "Ohne Namen"}`,
    `Erzeugt: ${timestamp}`,
    "=".repeat(72)
  ].join("\n");

  const body = outputs
    .map((output) => {
      const title = `${output.profileLabel} · ${output.languageLabel}`;
      return `${title}\n${"-".repeat(title.length)}\n${output.combined}`;
    })
    .join("\n\n" + "=".repeat(72) + "\n\n");

  return `${header}\n\n${body}\n`;
}

export function createJsonExport(state, outputs = []) {
  return {
    application: "Pixelart Prompt Studio",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    state,
    generatedOutputs: outputs.map((output) => ({
      id: output.id,
      profile: output.profile,
      language: output.language,
      main: output.main,
      negative: output.negative,
      technical: output.technical,
      combined: output.combined
    }))
  };
}
