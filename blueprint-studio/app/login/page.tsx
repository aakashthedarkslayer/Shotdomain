import { LoginForm } from "./LoginForm";

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card w-full max-w-sm p-7">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 font-bold text-white">B</span>
          <div>
            <h1 className="text-base font-semibold">Blueprint Studio</h1>
            <p className="text-xs text-slate-500">Admin sign-in</p>
          </div>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
