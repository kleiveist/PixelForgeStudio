import type { z } from "zod";
import {
  AnimationProjectSchema,
  StableIdSchema,
  type AnimationProject,
  type StableId
} from "../../schemas";
import {
  DuplicateAnimationProjectInputSchema,
  type AnimationRepositoryConflictResult,
  type AnimationRepositoryEntity,
  type AnimationRepositoryFailedResult,
  type AnimationRepositoryInvalidResult,
  type AnimationRepositoryNotFoundResult,
  type AnimationRepositoryUnavailableResult,
  type DuplicateAnimationProjectInput
} from "./animationRepository";

export type RepositoryParseResult<Value> =
  | Readonly<{ success: true; value: Value }>
  | Readonly<{ success: false; result: AnimationRepositoryInvalidResult }>;

export function parseRepositoryValue<Value>(
  schema: z.ZodType<Value>,
  input: unknown,
  message: string
): RepositoryParseResult<Value> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { success: true, value: parsed.data };

  return {
    success: false,
    result: {
      status: "invalid",
      reason: "schemaValidation",
      message,
      issues: Object.freeze(
        parsed.error.issues.map((issue) =>
          Object.freeze({
            path: issue.path.map(String).join("."),
            message: issue.message
          })
        )
      )
    }
  };
}

export function parseRepositoryId(
  input: unknown,
  label: string
): RepositoryParseResult<StableId> {
  const parsed = parseRepositoryValue(
    StableIdSchema,
    input,
    `${label} is not a valid stable ID.`
  );
  return parsed.success
    ? { success: true, value: parsed.value as StableId }
    : parsed;
}

export function parseDuplicateProjectInput(
  input: unknown
): RepositoryParseResult<DuplicateAnimationProjectInput> {
  return parseRepositoryValue(
    DuplicateAnimationProjectInputSchema,
    input,
    "The project duplication command is invalid."
  );
}

export function createDuplicatedProject(
  source: AnimationProject,
  command: DuplicateAnimationProjectInput
): RepositoryParseResult<AnimationProject> {
  return parseRepositoryValue(
    AnimationProjectSchema,
    {
      ...source,
      projectId: command.newProjectId,
      name: command.name,
      createdAt: command.timestamp,
      updatedAt: command.timestamp,
      parts: source.parts.map((part) => ({ ...part })),
      clips: source.clips.map((clip) => ({ ...clip })),
      overrides: source.overrides.map((override) => ({ ...override }))
    },
    "The duplicated project does not match the animation project schema."
  );
}

export function repositoryNotFound(
  entity: AnimationRepositoryEntity,
  id: string
): AnimationRepositoryNotFoundResult {
  return {
    status: "notFound",
    entity,
    id,
    message: `${entity} "${id}" was not found.`
  };
}

export function repositoryConflict(
  entity: AnimationRepositoryEntity,
  id: string
): AnimationRepositoryConflictResult {
  return {
    status: "conflict",
    entity,
    id,
    message: `${entity} "${id}" already exists.`
  };
}

export function repositoryTransactionFailed(
  error: unknown
): AnimationRepositoryFailedResult {
  return {
    status: "failed",
    reason: "transaction",
    message:
      error instanceof Error ? error.message : "Animation repository transaction failed."
  };
}

export function repositoryInvalid(
  message: string,
  path: string,
  issueMessage: string
): AnimationRepositoryInvalidResult {
  return {
    status: "invalid",
    reason: "schemaValidation",
    message,
    issues: Object.freeze([{ path, message: issueMessage }])
  };
}

export function repositoryOpenUnavailable(
  error: unknown
): AnimationRepositoryUnavailableResult {
  return {
    status: "unavailable",
    reason: "databaseOpen",
    message:
      error instanceof Error ? error.message : "Animation database could not be opened."
  };
}
