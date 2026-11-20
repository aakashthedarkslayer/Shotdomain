import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionValue } from "./session";

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionValue(jar.get(SESSION_COOKIE)?.value);
}

/** For pages and server actions: bounce to the login page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/login");
}

/** For route handlers: return a 401 response, or null when signed in. */
export async function adminOr401(): Promise<Response | null> {
  return (await isAdmin()) ? null : Response.json({ error: "Not signed in" }, { status: 401 });
}
