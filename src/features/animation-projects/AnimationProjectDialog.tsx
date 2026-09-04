import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject
} from "react";
import styles from "./AnimationProjectsView.module.css";

export interface AnimationProjectDialogProps {
  readonly children: ReactNode;
  readonly description: string;
  readonly initialFocusRef: RefObject<HTMLElement | null>;
  readonly onCancel: () => void;
  readonly title: string;
  readonly tone?: "default" | "danger";
}

function isolateFallbackDialog(dialog: HTMLDialogElement): () => void {
  const isolatedElements: HTMLElement[] = [];
  let activeBranch: HTMLElement = dialog;
  let parent = activeBranch.parentElement;

  while (parent && parent !== document.documentElement) {
    for (const sibling of parent.children) {
      if (
        sibling !== activeBranch &&
        sibling instanceof HTMLElement &&
        !sibling.hasAttribute("inert")
      ) {
        sibling.setAttribute("inert", "");
        isolatedElements.push(sibling);
      }
    }
    activeBranch = parent;
    parent = activeBranch.parentElement;
  }

  return () => {
    for (const element of isolatedElements) element.removeAttribute("inert");
  };
}

function trapFocus(event: KeyboardEvent<HTMLDialogElement>): void {
  if (event.key !== "Tab") return;
  const controls = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ].filter((control) => !control.hasAttribute("hidden"));
  const first = controls[0];
  const last = controls.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function AnimationProjectDialog({
  children,
  description,
  initialFocusRef,
  onCancel,
  title,
  tone = "default"
}: AnimationProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [usesFallbackModal, setUsesFallbackModal] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    let fallbackModal = false;
    if (!dialog.open) {
      try {
        if (typeof dialog.showModal === "function") dialog.showModal();
        else fallbackModal = true;
      } catch {
        fallbackModal = true;
      }
    }
    if (fallbackModal) {
      dialog.setAttribute("open", "");
      setUsesFallbackModal(true);
    }

    const releaseIsolation = fallbackModal
      ? isolateFallbackDialog(dialog)
      : () => undefined;
    const keepFocusInFallback = (event: FocusEvent) => {
      if (
        fallbackModal &&
        event.target instanceof Node &&
        !dialog.contains(event.target)
      ) {
        initialFocusRef.current?.focus();
      }
    };
    document.addEventListener("focusin", keepFocusInFallback);
    initialFocusRef.current?.focus();

    return () => {
      document.removeEventListener("focusin", keepFocusInFallback);
      releaseIsolation();
      if (!dialog.open) return;
      try {
        if (typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
      } catch {
        dialog.removeAttribute("open");
      }
    };
  }, [initialFocusRef]);

  return (
    <>
      {usesFallbackModal ? (
        <span className={styles.dialogBackdrop} aria-hidden="true" />
      ) : null}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        data-tone={tone}
        role={tone === "danger" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          event.preventDefault();
          onCancel();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
            return;
          }
          trapFocus(event);
        }}
      >
        <header className={styles.dialogHeader}>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </header>
        {children}
      </dialog>
    </>
  );
}
