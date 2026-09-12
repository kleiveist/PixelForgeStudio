import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import { createV2StorageAdapter, V2_STORAGE_KEYS } from "../services";
import { MemoryStorage } from "../test/memoryStorage";
import { MemoryNavigation } from "../test/memoryNavigation";
import { LocaleProvider } from "./LocaleProvider";
import { GuidedTextChoice } from "../features/wizard/GuidedTextChoice";

describe("interface language", () => {
  it("switches immediately, persists through the adapter and restores on reload", async () => {
    const storage = new MemoryStorage();
    const adapter = createV2StorageAdapter(storage);
    const props = {
      storageAdapter: adapter,
      navigationAdapter: new MemoryNavigation({
        status: "valid" as const,
        view: "settings" as const
      })
    };
    const user = userEvent.setup();
    const mounted = render(<App {...props} />);
    expect(storage.mutations).toHaveLength(0);
    await user.selectOptions(screen.getByLabelText("Oberflächensprache"), "en");
    expect(
      screen.getByRole("heading", { level: 1, name: "Configure your studio." })
    ).toBeVisible();
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toContain("Settings");
    expect(screen.getByText("Language saved locally.")).toBeVisible();
    expect(adapter.readSettings()).toMatchObject({
      status: "valid",
      value: { locale: "en", schemaVersion: 2 }
    });
    expect(storage.mutations).toEqual([
      { operation: "set", key: V2_STORAGE_KEYS.settings }
    ]);
    mounted.unmount();
    render(<App {...props} />);
    expect(screen.getByLabelText("Interface language")).toHaveValue("en");
    expect(storage.mutations).toHaveLength(1);
    await user.selectOptions(screen.getByLabelText("Interface language"), "de");
    expect(
      screen.getByRole("heading", { name: "Das Studio passend konfigurieren." })
    ).toBeVisible();
  });

  it("keeps a session language when storage fails and explains the failure", async () => {
    const storage = new MemoryStorage();
    storage.failSetFor = V2_STORAGE_KEYS.settings;
    render(
      <App
        storageAdapter={createV2StorageAdapter(storage)}
        navigationAdapter={
          new MemoryNavigation({ status: "valid", view: "settings" })
        }
      />
    );
    await userEvent
      .setup()
      .selectOptions(screen.getByLabelText("Oberflächensprache"), "en");
    expect(document.documentElement.lang).toBe("en");
    expect(
      screen.getByText(
        "The language applies to this session; local storage is unavailable."
      )
    ).toBeVisible();
    expect(storage.mutations).toHaveLength(0);
  });

  it("localizes preset choices without writing on hydration or translating custom text", async () => {
    const choose = vi.fn();
    const props = {
      describedBy: "test-help",
      error: null,
      errorClassName: undefined,
      fieldClassName: undefined,
      help: "Rinde, Verzweigung und Hohlräume",
      helpClassName: undefined,
      id: "test",
      label: "Motivbeschreibung",
      maxLength: 4000,
      onChoose: choose,
      presets: ["Knorrige alte Eiche"],
      registration: {
        name: "subject",
        ref: vi.fn(),
        onChange: vi.fn(),
        onBlur: vi.fn()
      },
      value: "Knorrige alte Eiche"
    };
    const mounted = render(
      <LocaleProvider locale="en">
        <GuidedTextChoice {...props} />
      </LocaleProvider>
    );
    expect(
      screen.getByRole("option", { name: "Gnarled old oak" })
    ).toBeVisible();
    expect(choose).not.toHaveBeenCalled();
    await userEvent
      .setup()
      .selectOptions(
        screen.getByLabelText("Subject description"),
        "Knorrige alte Eiche"
      );
    expect(choose).toHaveBeenCalledWith("Gnarled old oak");
    mounted.rerender(
      <LocaleProvider locale="de">
        <GuidedTextChoice {...props} value="Gnarled old oak" />
      </LocaleProvider>
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    mounted.rerender(
      <LocaleProvider locale="en">
        <GuidedTextChoice {...props} value="Holz" />
      </LocaleProvider>
    );
    expect(screen.getByRole("textbox")).toBeVisible();
    expect(choose).toHaveBeenCalledTimes(1);
  });
});
