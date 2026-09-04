import { useEffect, useState } from "react";
import { getWorkspaceLayout, type WorkspaceLayout } from "./animationWorkspaceModel";

function readLayout(): WorkspaceLayout {
  if (typeof window === "undefined") return "desktop";
  return getWorkspaceLayout(window.innerWidth);
}

export function useWorkspaceLayout(): WorkspaceLayout {
  const [layout, setLayout] = useState<WorkspaceLayout>(readLayout);

  useEffect(() => {
    const updateLayout = () => setLayout(readLayout());
    window.addEventListener("resize", updateLayout);
    updateLayout();
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  return layout;
}
