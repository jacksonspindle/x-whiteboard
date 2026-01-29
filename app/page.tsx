import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { createClient } from '@/lib/supabase/server';
import { Layers, Chrome, Move, Zap } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">X Whiteboard</span>
          </div>
          <AuthButton />
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">
            Organize Your X Posts
            <br />
            <span className="text-blue-600">On an Infinite Canvas</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Capture tweets with our Chrome extension, then drag and arrange them
            on a beautiful whiteboard. Perfect for research, inspiration boards,
            and organizing your favorite content.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            {user ? (
              <Link
                href="/whiteboard"
                className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
              >
                Open Whiteboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
              >
                Get Started
              </Link>
            )}
            <a
              href="#features"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-lg font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mt-32">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            How It Works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Chrome className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                1. Install Extension
              </h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Add our Chrome extension to capture tweets with a single click while browsing X.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                2. Capture Posts
              </h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Click the button on any tweet to save it to your whiteboard instantly.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Move className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                3. Organize & Arrange
              </h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Drag, zoom, and arrange your posts on an infinite canvas to organize your thoughts.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-zinc-500">
          <p>X Whiteboard - Organize your X posts visually</p>
        </div>
      </footer>
    </div>
  );
}
