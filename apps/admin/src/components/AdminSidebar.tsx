'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navigation: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/products', label: 'Products', icon: '📦' },
  { href: '/categories', label: 'Categories', icon: '🏷️' },
  { href: '/orders', label: 'Orders', icon: '🛒' },
  { href: '/customers', label: 'Customers', icon: '👥' },
  { href: '/custom-requests', label: 'Custom Requests', icon: '✨' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <Link href="/dashboard" className="block">
          <h1 className="text-2xl font-serif text-[var(--color-primary)]">
            LuxeCraft
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-1 uppercase tracking-wider">
            Admin Panel
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)]">
        <p>© 2024 LuxeCraft</p>
        <p className="mt-1">v1.0.0</p>
      </div>
    </aside>
  );
}
