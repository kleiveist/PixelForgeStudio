import type { FrameProfile, RigTemplateId } from "./animation.types";

export const ANCHOR_CONTRACT_VERSION = 1;
export const REQUIRED_SLOT_CONTRACT_VERSION = 1;
export const DIRECTION_CONTRACT_VERSION = 1;

export const HUMANOID_80_RIG_TEMPLATE_ID =
  "humanoid-80-v1" satisfies RigTemplateId;

export const HUMANOID_80_FRAME_PROFILE: FrameProfile = Object.freeze({
  frameSize: Object.freeze({ width: 128, height: 128 }),
  characterHeight: 80,
  footAnchor: Object.freeze({ x: 64, y: 112 })
});
