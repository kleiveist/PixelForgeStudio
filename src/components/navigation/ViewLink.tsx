import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import type { AppView } from "../../domain/navigation";
import { useNavigation } from "../../store/navigation";

export interface ViewLinkProps
  extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  readonly indicateCurrent?: boolean;
  readonly onNavigate?: () => void;
  readonly view: AppView;
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

export function ViewLink({
  indicateCurrent = false,
  onClick,
  onNavigate,
  view,
  ...props
}: ViewLinkProps) {
  const { activeView, hrefFor, navigate } = useNavigation();

  return (
    <a
      {...props}
      aria-current={indicateCurrent && activeView === view ? "page" : undefined}
      href={hrefFor(view)}
      onClick={(event) => {
        onClick?.(event);
        if (!shouldHandleInternally(event)) return;
        event.preventDefault();
        onNavigate?.();
        navigate(view);
      }}
    />
  );
}
