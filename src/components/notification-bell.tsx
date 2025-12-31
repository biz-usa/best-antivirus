

'use client';

import { useState, useEffect } from 'react';
import { Bell, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/context/auth-context';
import { getNotifications, markNotificationsAsRead } from '@/lib/data';
import type { Notification } from '@/lib/types';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const userNotifications = await getNotifications(user.uid);
        setNotifications(userNotifications);
      } catch (error) {
        // Since getNotifications now throws on permission error, we can catch it.
        // But for a read operation, it's often better to just show an empty state.
        console.error("Could not fetch notifications, possibly due to permissions.", error);
        setNotifications([]); // Clear notifications on error
      }
    };

    fetchNotifications();
    // Simple polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000); 

    return () => clearInterval(interval);
  }, [user]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0 && user) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id!);
      if (unreadIds.length > 0) {
        try {
          await markNotificationsAsRead(user.uid, unreadIds);
          // Refresh notifications locally immediately for better UX
          setNotifications(currentNotifications => 
              currentNotifications.map(n => ({ ...n, read: true }))
          );
        } catch (serverError: any) {
            const permissionError = new FirestorePermissionError({
                path: `/users/${user.uid}/notifications`,
                operation: 'update',
                message: 'Failed to mark notifications as read.',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
      }
    }
  };

  if (!user) {
    return null;
  }
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
          <Bell className="h-5 w-5" />
          <span className="sr-only">Thông báo</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 font-medium border-b">Thông báo</div>
        <ScrollArea className="h-96">
            {notifications.length > 0 ? (
                 <div className="flex flex-col">
                    {notifications.map((notification) => (
                        <Link
                            key={notification.id}
                            href={notification.link}
                            className="p-4 border-b hover:bg-accent last:border-b-0"
                            onClick={() => setIsOpen(false)}
                        >
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: vi }) : ''}
                            </p>
                        </Link>
                    ))}
                 </div>
            ): (
                 <div className="text-center text-muted-foreground p-8">
                    <ShoppingBag className="mx-auto h-12 w-12" />
                    <p className="mt-4 text-sm">Bạn chưa có thông báo nào.</p>
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
