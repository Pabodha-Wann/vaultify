import { API_URL } from "../../lib/api";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-paper">
      <div className="flex flex-col items-center gap-5 max-w-md text-center">
        {/* Wordmark */}
        <h1 className="font-serif text-6xl text-ink tracking-tight select-none">
          Vaultify
        </h1>

        {/* Tagline */}
        <p className="text-slate text-lg leading-relaxed">
          Your files, kept safe. Upload, organize, and share — all in one place.
        </p>

        {/* CTA — plain anchor, backend-initiated login */}
        <a
          href={`${API_URL}/login`}
          className="mt-2 inline-block bg-ink text-paper px-8 py-3 rounded-sm text-sm font-medium
            hover:bg-brass hover:text-ink transition-colors duration-150
            focus-visible:outline-brass"
        >
          Log in to continue
        </a>
      </div>
    </main>
  );
}