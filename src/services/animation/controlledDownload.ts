export interface ControlledDownloadEnvironment {
  readonly createObjectURL: (blob: Blob) => string;
  readonly revokeObjectURL: (url: string) => void;
  readonly createAnchor: () => HTMLAnchorElement;
}

function browserDownloadEnvironment(): ControlledDownloadEnvironment {
  return {
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    createAnchor: () => document.createElement("a")
  };
}

/** Creates an object URL for one synchronous click and always revokes it. */
export function downloadBlob(
  blob: Blob,
  fileName: string,
  environment: ControlledDownloadEnvironment = browserDownloadEnvironment()
): void {
  if (!fileName || /[/\\\0]/.test(fileName)) {
    throw new RangeError("Download file name must be a safe base name.");
  }
  const url = environment.createObjectURL(blob);
  try {
    const anchor = environment.createAnchor();
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    anchor.click();
  } finally {
    environment.revokeObjectURL(url);
  }
}
