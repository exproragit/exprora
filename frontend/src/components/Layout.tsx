'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { LayoutDashboard, FlaskConical, User, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function Layout({ children, isAdmin = false }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900">Exprora</h1>
          {user && <p className="text-sm text-gray-600 mt-1">{user.company_name || user.email}</p>}
        </div>
        <nav className="mt-8">
          {isAdmin ? (
            <>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/admin/clients"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                <User className="w-5 h-5" />
                Clients
              </Link>
              <Link
                href="/admin/analytics"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                <LayoutDashboard className="w-5 h-5" />
                Analytics
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/experiments"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                <FlaskConical className="w-5 h-5" />
                Experiments
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                <User className="w-5 h-5" />
                Profile
              </Link>
            </>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 text-left"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

