'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Sun, Moon, PenSquare, Search, Menu, X, BookOpen } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const isAuthor = user && ['author', 'admin', 'master_admin'].includes(user.role);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="w-6 h-6 text-primary" />
          <span>BlogSpace</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link
            href="/search"
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          {isAuthenticated && user ? (
            <>
              {/* Write Button — desktop only */}
              {isAuthor && (
                <Link
                  href="/dashboard/posts/new"
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <PenSquare className="w-4 h-4" />
                  Write
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDropdownOpen(!dropdownOpen);
                    }
                    if (e.key === 'Escape') setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted transition-colors"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  <UserAvatar user={user} size="sm" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-2xl shadow-lg py-1 animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-primary mt-0.5 capitalize">{user.role.replace('_', ' ')}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {isAuthor && (
                      <Link
                        href="/dashboard/posts/new"
                        className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Write new post
                      </Link>
                    )}
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile settings
                    </Link>
                    {(user.role === 'admin' || user.role === 'master_admin') && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin panel
                      </Link>
                    )}
                    <div className="border-t border-border mt-1">
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Get started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'block py-2.5 px-3 rounded-xl text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground'
              )}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {isAuthenticated && user ? (
            <>
              {/* Show write button in mobile menu for authors */}
              {isAuthor && (
                <Link
                  href="/dashboard/posts/new"
                  className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <PenSquare className="w-4 h-4" />
                  Write new post
                </Link>
              )}
              <Link
                href="/dashboard"
                className="block py-2.5 px-3 rounded-xl text-sm hover:bg-muted transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                className="block py-2.5 px-3 rounded-xl text-sm hover:bg-muted transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Profile settings
              </Link>
              {(user.role === 'admin' || user.role === 'master_admin') && (
                <Link
                  href="/admin"
                  className="block py-2.5 px-3 rounded-xl text-sm hover:bg-muted transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin panel
                </Link>
              )}
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full text-left py-2.5 px-3 rounded-xl text-sm text-destructive hover:bg-muted transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link
                href="/auth/login"
                className="flex-1 text-center py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="flex-1 text-center py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                onClick={() => setMenuOpen(false)}
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
