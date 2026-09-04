import type { ComponentPropsWithoutRef } from "react";
import { createPromptStudioRoute, type AppView } from "../../domain/navigation";
import { StudioLink } from "./StudioLink";

export interface ViewLinkProps
  extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  readonly indicateCurrent?: boolean;
  readonly onNavigate?: () => void;
  readonly view: AppView;
}

export function ViewLink({
  indicateCurrent = false,
  onClick,
  onNavigate,
  view,
  ...props
}: ViewLinkProps) {
  return (
    <StudioLink
      {...props}
      indicateCurrent={indicateCurrent}
      route={createPromptStudioRoute(view)}
      {...(onClick ? { onClick } : {})}
      {...(onNavigate ? { onNavigate } : {})}
    />
  );
}
