import { expect, test, vi } from "vitest";
import { z } from "./validation";

test("validates without dynamic code generation under a strict CSP", () => {
  expect(z.config().jitless).toBe(true);
  const dynamicCode = vi.fn(() => { throw new Error("CSP blocks dynamic code"); });
  vi.stubGlobal("Function", dynamicCode);
  try {
    const schema = z.strictObject({ name: z.string().min(1), version: z.literal(2) });
    expect(schema.parse({ name: "Synthetic profile", version: 2 })).toEqual({ name: "Synthetic profile", version: 2 });
    expect(schema.safeParse({ name: "", version: 99 }).success).toBe(false);
    expect(dynamicCode).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
