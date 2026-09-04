import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useObjectUrl, type ObjectUrlFactory } from "./useObjectUrl";

describe("useObjectUrl", () => {
  it("revokes object URLs on replacement, cancellation and unmount", () => {
    const factory: ObjectUrlFactory = {
      createObjectURL: vi
        .fn()
        .mockReturnValueOnce("blob:first")
        .mockReturnValueOnce("blob:second")
        .mockReturnValueOnce("blob:third"),
      revokeObjectURL: vi.fn()
    };
    const first = new Blob(["first"], { type: "image/png" });
    const second = new Blob(["second"], { type: "image/png" });
    const { rerender, result, unmount } = renderHook(
      ({ blob }: { blob: Blob | null }) => useObjectUrl(blob, factory),
      { initialProps: { blob: first as Blob | null } }
    );

    expect(result.current).toBe("blob:first");
    rerender({ blob: second });
    expect(factory.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(result.current).toBe("blob:second");
    rerender({ blob: null });
    expect(factory.revokeObjectURL).toHaveBeenCalledWith("blob:second");
    expect(result.current).toBeNull();
    rerender({ blob: first });
    unmount();
    expect(factory.revokeObjectURL).toHaveBeenLastCalledWith("blob:third");
  });
});
