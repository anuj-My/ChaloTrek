"use client";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="type-2">Something went wrong</h1>
      <button onClick={() => retry()} className="text-sm underline underline-offset-4">
        Try again
      </button>
    </main>
  );
}
