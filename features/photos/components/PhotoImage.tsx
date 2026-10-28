"use client";

import { useEffect, useMemo } from "react";

/** Shows a stored image Blob; the object URL is revoked when the blob changes or on unmount. */
export function PhotoImage({ blob, alt, className = "" }: {
  blob: Blob;
  alt: string;
  className?: string;
}) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  // eslint-disable-next-line @next/next/no-img-element -- local blob URL; next/image cannot optimize it
  return <img src={url} alt={alt} className={`object-cover ${className}`} />;
}
