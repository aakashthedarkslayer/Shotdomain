import { redirect } from 'next/navigation';

/** The tool now lives on the homepage; old /app and /app?url=… links land there. */
export default async function AppRedirect({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  redirect(url ? `/?url=${encodeURIComponent(url)}` : '/');
}
