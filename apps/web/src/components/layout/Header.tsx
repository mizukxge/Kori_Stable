import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ThemeToggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
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
          
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
            AU
          </div>
        </div>
      </div>
    </header>
  );
}