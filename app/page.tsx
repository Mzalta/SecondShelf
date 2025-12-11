export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          📚 SecondShelf
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Trade & Sell Your Textbooks - Next.js Migration in Progress
        </p>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
          <p className="text-gray-700 mb-4">
            This is the new Next.js version of SecondShelf. The migration is in progress.
          </p>
          <p className="text-sm text-gray-500">
            Phase 1: Project setup complete. Components and pages migration coming next.
          </p>
        </div>
      </div>
    </main>
  )
}
