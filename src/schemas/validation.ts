import { z } from "zod";

// Configure before any application schema is constructed. Zod's optional JIT
// probes Function(), which strict CSP reports even when the exception is caught.
// Interpret schemas instead; never require unsafe-eval in a hosted studio.
z.config({ jitless: true });

export { z };
