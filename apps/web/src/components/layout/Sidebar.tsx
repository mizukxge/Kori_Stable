import { Home, Users, Image, FileText, Settings, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', icon: Home, href: '/' },
  { name: 'Clients', icon: Users, href: '/clients' },
  { name: 'Assets', icon: Image, href: '/assets' },
  { name: 'Documents', icon: FileText, href: '/documents' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar({ open = true, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-modal-backdrop bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-modal flex w-64 flex-col border-r bg-card transition-transform duration-normal lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6 lg:hidden">
          <span className="font-semibold">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.name} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                <Icon className="h-5 w-5" />
                {item.name}
              </a>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">Kori Photography</div>
            <div>Design System v1.0</div>
          </div>
        </div>
      </aside>
    </>
  );
}
