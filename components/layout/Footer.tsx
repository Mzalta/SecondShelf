import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[rgb(35,47,62)] text-gray-300 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Get to Know Us</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-orange-400 transition-colors">About SecondShelf</Link></li>
              <li><Link href="/add" className="hover:text-orange-400 transition-colors">Sell Your Books</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Make Money</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/add" className="hover:text-orange-400 transition-colors">Sell Books</Link></li>
              <li><Link href="/my-shelf" className="hover:text-orange-400 transition-colors">Manage Listings</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/my-shelf" className="hover:text-orange-400 transition-colors">My Shelf</Link></li>
              <li><Link href="/favorites" className="hover:text-orange-400 transition-colors">Favorites</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Help</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-orange-400 transition-colors">Contact Support</Link></li>
              <li><Link href="/" className="hover:text-orange-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} SecondShelf. All rights reserved. Helping students get the textbooks they need quickly and easily.
          </p>
        </div>
      </div>
    </footer>
  )
}
