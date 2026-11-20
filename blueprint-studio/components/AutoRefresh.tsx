"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-render the server page periodically while something is processing. */
export function AutoRefresh({ every = 3000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
