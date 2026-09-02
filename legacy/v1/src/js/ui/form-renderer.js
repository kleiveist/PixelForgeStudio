function createHelp(text, id) {
  const help = document.createElement("p");
  help.className = "field-help";
  help.id = id;
  help.textContent = text;
  return help;
}

function createSelect(field, value) {
  const select = document.createElement("select");
  for (const item of field.options ?? []) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    option.selected = String(item.value) === String(value);
    select.append(option);
  }
  return select;
}

function createInput(field, value) {
  if (field.type === "select") {
    return createSelect(field, value);
  }

  if (field.type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.rows = field.rows ?? 3;
    textarea.value = value ?? "";
    if (field.placeholder) textarea.placeholder = field.placeholder;
    return textarea;
  }

  const input = document.createElement("input");
  input.type = field.type === "checkbox" ? "checkbox" : field.type;

  if (field.type === "checkbox") {
    input.checked = Boolean(value);
  } else {
    input.value = value ?? "";
  }

  if (field.placeholder) input.placeholder = field.placeholder;
  if (field.min !== undefined) input.min = String(field.min);
  if (field.max !== undefined) input.max = String(field.max);
  if (field.step !== undefined) input.step = String(field.step);
  return input;
}

function createField(field, state) {
  const wrapper = document.createElement("div");
  wrapper.className = `field field--${field.width ?? "full"}`;
  wrapper.dataset.fieldWrapper = field.key;

  const controlId = `field-${field.key}`;
  const helpId = `${controlId}-help`;
  const control = createInput(field, state[field.key]);
  control.id = controlId;
  control.name = field.key;
  control.dataset.field = field.key;
  control.dataset.fieldType = field.type;

  if (field.help) control.setAttribute("aria-describedby", helpId);

  if (field.type === "checkbox") {
    const checkboxLabel = document.createElement("label");
    checkboxLabel.className = "checkbox-control";
    checkboxLabel.htmlFor = controlId;

    const visual = document.createElement("span");
    visual.className = "checkbox-control__box";
    visual.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.className = "checkbox-control__label";
    text.textContent = field.label;

    checkboxLabel.append(control, visual, text);
    wrapper.append(checkboxLabel);
  } else {
    const label = document.createElement("label");
    label.className = "field-label";
    label.htmlFor = controlId;
    label.textContent = field.label;
    wrapper.append(label, control);
  }

  if (field.help) wrapper.append(createHelp(field.help, helpId));
  return wrapper;
}

export function renderForm(container, sections, state) {
  container.replaceChildren();

  for (const section of sections) {
    const details = document.createElement("details");
    details.className = "form-section";
    details.open = Boolean(section.open);

    const summary = document.createElement("summary");
    const summaryText = document.createElement("span");
    summaryText.className = "form-section__title";
    summaryText.textContent = section.title;
    summary.append(summaryText);

    const body = document.createElement("div");
    body.className = "form-section__body";

    if (section.description) {
      const description = document.createElement("p");
      description.className = "form-section__description";
      description.textContent = section.description;
      body.append(description);
    }

    const grid = document.createElement("div");
    grid.className = "field-grid";
    for (const field of section.fields) {
      grid.append(createField(field, state));
    }
    body.append(grid);
    details.append(summary, body);
    container.append(details);
  }
}

export function updateConditionalControls(form, state) {
  const selectedProfile = form.querySelector('[data-field="selectedProfile"]');
  if (selectedProfile) {
    selectedProfile.disabled = state.profileOutputMode === "both";
    selectedProfile.closest(".field")?.classList.toggle("field--disabled", selectedProfile.disabled);
  }

  const assetFacing = form.querySelector('[data-field="assetFacing"]');
  if (assetFacing) {
    assetFacing.disabled = state.outputMode !== "single";
    assetFacing.closest(".field")?.classList.toggle("field--disabled", assetFacing.disabled);
  }

  const sheetLayout = form.querySelector('[data-field="sheetLayout"]');
  if (sheetLayout) {
    const sheetLike = ["directional4", "directional8", "spriteSheet", "tileset"].includes(state.outputMode);
    sheetLayout.disabled = !sheetLike;
    sheetLayout.closest(".field")?.classList.toggle("field--disabled", sheetLayout.disabled);
  }
}

export function readControlValue(control) {
  const type = control.dataset.fieldType;
  if (type === "checkbox") return control.checked;
  if (type === "number") {
    const parsed = Number(control.value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return control.value;
}
