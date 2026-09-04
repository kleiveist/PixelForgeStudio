import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import {
  studioRoutesEqual,
  type StudioRoute
} from "../../domain/navigation";
import { useNavigation } from "../../store/navigation";

export interface StudioLinkProps
  extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  readonly indicateCurrent?: boolean;
  readonly onNavigate?: () => void;
  readonly route: StudioRoute;
}

function shouldHandleInternally(event: MouseEvent<HTMLAnchorElement>): boolean {
  const anchor = event.currentTarget;
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !anchor.hasAttribute("download") &&
    (!anchor.target || anchor.target === "_self")
  );
}

export function StudioLink({
  indicateCurrent = false,
  onClick,
  onNavigate,
  route,
  ...props
}: StudioLinkProps) {
  const { activeRoute, hrefForRoute, navigateTo } = useNavigation();

  return (
    <a
      {...props}
      aria-current={
        indicateCurrent && studioRoutesEqual(activeRoute, route)
          ? "page"
          : undefined
      }
      href={hrefForRoute(route)}
      onClick={(event) => {
        onClick?.(event);
        if (!shouldHandleInternally(event)) return;
        event.preventDefault();
        onNavigate?.();
        navigateTo(route);
      }}
    />
  );
}
