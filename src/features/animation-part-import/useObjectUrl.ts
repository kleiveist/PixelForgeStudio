import { useEffect, useState } from "react";

export interface ObjectUrlFactory {
  readonly createObjectURL: (blob: Blob) => string;
  readonly revokeObjectURL: (url: string) => void;
}

const browserObjectUrlFactory: ObjectUrlFactory = Object.freeze({
  createObjectURL: (blob: Blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url: string) => URL.revokeObjectURL(url)
});

export function useObjectUrl(
  blob: Blob | null,
  factory: ObjectUrlFactory = browserObjectUrlFactory
): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return undefined;
    }
    let createdUrl: string;
    try {
      createdUrl = factory.createObjectURL(blob);
    } catch {
      setObjectUrl(null);
      return undefined;
    }
    setObjectUrl(createdUrl);
    return () => {
      factory.revokeObjectURL(createdUrl);
    };
  }, [blob, factory]);

  return objectUrl;
}
