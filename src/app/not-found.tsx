import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="type-2">Page not found</h1>
      <Link href="/" className="text-sm underline underline-offset-4">
        Go home
      </Link>
    </main>
  );
}
