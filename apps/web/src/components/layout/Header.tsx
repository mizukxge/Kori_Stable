import { Menu, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ThemeToggle';
import { logout } from '../../lib/api';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      console.log('✅ Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Force redirect anyway
      navigate('/admin/login');
    }
  };

  return (
    <header className="sticky top-0 z-sticky border-b bg-card">
      <div className="flex h-16 items-center gap-4 px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            K
          </div>
          <span className="hidden font-semibold sm:inline-block">Kori</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* User Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              AU
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />

                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-56 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-muted-foreground">admin@mizu.studio</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        // Navigate to profile or settings if needed
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
