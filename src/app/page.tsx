import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            NextJS Starter
          </h1>
          <p className="text-gray-600">
            A full-stack Next.js app with Prisma, NeonDB, and secure
            email/password authentication.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Create account
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-sm text-gray-500">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🔐</span>
            <span>Auth.js v5</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🐘</span>
            <span>NeonDB</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🔷</span>
            <span>Prisma ORM</span>
          </div>
        </div>
      </div>
    </main>
  )
}
