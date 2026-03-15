import Link from 'next/link';
import { Wrench } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
          <Wrench className="h-5 w-5" />
          <span className="text-lg">AutoParts Finder</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-gray-600 sm:flex">
          <Link href="/search" className="hover:text-blue-600">Search</Link>
          <Link href="/alerts" className="hover:text-blue-600">Alerts</Link>
          <Link href="/garage" className="hover:text-blue-600">Garage</Link>
          <Link href="/favorites" className="hover:text-blue-600">Favorites</Link>
          <Link href="/pricing" className="font-semibold text-blue-600 hover:text-blue-700">Upgrade</Link>
        </nav>
      </div>
    </header>
  );
}
