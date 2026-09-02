function button(label, action, className = "button button--small") {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  element.addEventListener("click", action);
  return element;
}

function outputSection(title, value, copyLabel, onCopy, open = false) {
  const details = document.createElement("details");
  details.className = "output-section";
  details.open = open;

  const summary = document.createElement("summary");
  const titleElement = document.createElement("span");
  titleElement.textContent = title;
  const count = document.createElement("span");
  count.className = "output-section__count";
  count.textContent = `${value.length.toLocaleString("de-DE")} Zeichen`;
  summary.append(titleElement, count);

  const content = document.createElement("div");
  content.className = "output-section__content";

  const actions = document.createElement("div");
  actions.className = "output-section__actions";
  actions.append(button(copyLabel, () => onCopy(value)));

  const textarea = document.createElement("textarea");
  textarea.className = "output-text";
  textarea.readOnly = true;
  textarea.spellcheck = false;
  textarea.value = value;
  textarea.setAttribute("aria-label", title);

  content.append(actions, textarea);
  details.append(summary, content);
  return details;
}

export function renderOutputs(container, outputs, onCopy) {
  container.replaceChildren();

  if (!outputs.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Noch keine Ausgabe vorhanden.";
    container.append(empty);
    return;
  }

  for (const output of outputs) {
    const card = document.createElement("article");
    card.className = `output-card output-card--${output.profile}`;

    const header = document.createElement("header");
    header.className = "output-card__header";

    const titleGroup = document.createElement("div");
    const eyebrow = document.createElement("div");
    eyebrow.className = "output-card__eyebrow";
    eyebrow.textContent = output.languageLabel;
    const title = document.createElement("h2");
    title.textContent = output.profileLabel;
    titleGroup.append(eyebrow, title);

    const copyAll = button("Gesamten Block kopieren", () => onCopy(output.combined), "button button--primary button--small");
    header.append(titleGroup, copyAll);

    const sections = document.createElement("div");
    sections.className = "output-card__sections";
    const german = output.language === "de";
    sections.append(
      outputSection(german ? "Hauptprompt" : "Main Prompt", output.main, "Kopieren", onCopy, true),
      outputSection(german ? "Negativprompt" : "Negative Prompt", output.negative, "Kopieren", onCopy),
      outputSection(german ? "Technische Spezifikation" : "Technical Specification", output.technical, "Kopieren", onCopy),
      outputSection(german ? "Kombinierte Ausgabe" : "Combined Output", output.combined, "Kopieren", onCopy)
    );

    card.append(header, sections);
    container.append(card);
  }
}

export function renderValidation(container, result) {
  container.replaceChildren();
  const entries = [
    ...result.errors.map((text) => ({ kind: "error", text })),
    ...result.warnings.map((text) => ({ kind: "warning", text }))
  ];

  if (!entries.length) {
    const ok = document.createElement("div");
    ok.className = "validation validation--ok";
    ok.textContent = "✓ Konfiguration technisch schlüssig";
    container.append(ok);
    return;
  }

  for (const entry of entries) {
    const item = document.createElement("div");
    item.className = `validation validation--${entry.kind}`;
    item.textContent = `${entry.kind === "error" ? "Fehler" : "Hinweis"}: ${entry.text}`;
    container.append(item);
  }
}

export function renderMetrics(container, state, metrics) {
  const items = [
    `${state.tileSize}×${state.tileSize} Tile`,
    `${state.characterHeight}px Figur`,
    `${metrics.frame}×${metrics.frame}px Frame`,
    `${metrics.columns}×${metrics.rows} Layout`,
    `${metrics.canvasWidth}×${metrics.canvasHeight}px Canvas`,
    `${metrics.directionCount} Ansicht${metrics.directionCount === 1 ? "" : "en"}`
  ];

  container.replaceChildren();
  for (const text of items) {
    const badge = document.createElement("span");
    badge.className = "metric-badge";
    badge.textContent = text;
    container.append(badge);
  }
}
