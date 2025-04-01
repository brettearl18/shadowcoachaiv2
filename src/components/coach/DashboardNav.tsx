import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications'; // We'll create this hook

const navItems = [
  {
    name: 'Overview',
    href: '/coach/dashboard',
    icon: ChartBarIcon
  },
  {
    name: 'Check-in Reviews',
    href: '/coach/dashboard/check-ins',
    icon: ClipboardDocumentListIcon
  },
  {
    name: 'Client Progress',
    href: '/coach/dashboard/clients',
    icon: UserGroupIcon
  },
  {
    name: 'Communication',
    href: '/coach/dashboard/communication',
    icon: ChatBubbleLeftRightIcon,
    showNotification: true // This tab can show notifications
  },
  {
    name: 'Templates',
    href: '/coach/dashboard/templates',
    icon: DocumentIcon
  }
];

export function DashboardNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications(); // This will get the unread notifications count

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center px-4 py-2 text-sm font-medium rounded-md
              ${isActive
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <div className="relative">
              <item.icon
                className={`
                  mr-3 h-6 w-6
                  ${isActive ? 'text-white' : 'text-gray-400'}
                `}
              />
              {item.showNotification && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
              )}
            </div>
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
} 