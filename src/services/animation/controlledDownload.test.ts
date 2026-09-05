import { describe, expect, it, vi } from "vitest";
import { downloadBlob } from "./controlledDownload";

describe("downloadBlob", () => {
  it("clicks with the requested file name and revokes even when clicking fails", () => {
    const revoke = vi.fn();
    const click = vi.fn(() => {
      throw new Error("blocked");
    });
    const anchor = {
      href: "",
      download: "",
      rel: "",
      click
    } as unknown as HTMLAnchorElement;
    expect(() =>
      downloadBlob(new Blob(["x"]), "export.png", {
        createObjectURL: () => "blob:controlled",
        revokeObjectURL: revoke,
        createAnchor: () => anchor
      })
    ).toThrow("blocked");
    expect(anchor.download).toBe("export.png");
    expect(revoke).toHaveBeenCalledWith("blob:controlled");
  });
});
