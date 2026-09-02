import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App foundation", () => {
  it("zeigt die minimale V2-Shell und macht die technischen Details bedienbar", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /das neue produktionsstudio hat ein solides fundament/i })
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Grundgerüst bereit");

    const summary = screen.getByText("Technische Grundlage anzeigen");
    const details = summary.closest("details");
    expect(details).not.toHaveAttribute("open");

    await user.click(summary);

    expect(details).toHaveAttribute("open");
    expect(screen.getByText("TypeScript im strikten Modus")).toBeVisible();
    expect(screen.queryByRole("button", { name: /neues asset/i })).not.toBeInTheDocument();
  });
});
