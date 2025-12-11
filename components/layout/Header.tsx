import Navbar from './Navbar'

export default function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <nav className="max-w-1200 mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
        <div className="logo">
          <h1 className="text-2xl font-semibold">📚 SecondShelf</h1>
        </div>
        <Navbar />
      </nav>
    </header>
  )
}
