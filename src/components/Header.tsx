import React, { useState, useEffect } from 'react';
import { Search, Bell, User, ShoppingBag, Clock } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  cartItemCount: number;
  onCheckoutClick: () => void;
  onOpenInventory: () => void;
  onOpenReports: () => void;
  notifications: string[];
  onClearNotifications: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  activeTab,
  cartItemCount,
  onCheckoutClick,
  onOpenInventory,
  onOpenReports,
  notifications,
  onClearNotifications,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [klTime, setKlTime] = useState(() => {
    return new Date().toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kuala_Lumpur',
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setKlTime(
        new Date().toLocaleTimeString('en-MY', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kuala_Lumpur',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'pos':
        return 'Search client, service, or SKU...';
      case 'appointments':
        return 'Search appointments...';
      case 'clients':
        return 'Search client name or phone...';
      case 'settings':
        return 'Search setting parameters...';
      default:
        return 'Search client or sku...';
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-nova-sand/10 bg-white/90 px-3 backdrop-blur-md sm:px-5 md:left-64 md:h-20 md:px-8">
      {/* Search Input Section */}
      <div className="flex min-w-0 flex-1 items-center gap-2 md:max-w-md md:gap-6">
        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nova-choco/50 stroke-[2.2px] md:left-4 md:h-4.5 md:w-4.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-11 w-full rounded-full border border-nova-sand/30 bg-white pl-9 pr-4 font-sans text-base text-nova-choco placeholder-nova-choco/40 transition-all duration-200 focus:border-nova-choco focus:outline-none focus:ring-2 focus:ring-nova-sand/20 md:pl-11 md:pr-5 md:text-sm"
            placeholder={getSearchPlaceholder()}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 min-h-8 -translate-y-1/2 rounded-full bg-nova-beige/40 px-2 text-xs font-semibold text-nova-choco/40 hover:text-nova-choco md:right-4"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Navigation & Toolbar */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-8">
        {/* Real-time Kuala Lumpur Clock (GMT+8) */}
        <div className="hidden select-none items-center gap-2 rounded-full border border-nova-sand/15 bg-nova-beige/40 px-3.5 py-1.5 font-mono text-xs text-nova-choco/80 lg:flex">
          <Clock className="w-3.5 h-3.5 text-nova-sand stroke-[2.2px] animate-pulse" />
          <span className="font-bold tracking-wide">Kuala Lumpur: {klTime}</span>
        </div>

        <nav className="hidden gap-7 lg:flex">
          <button
            onClick={onOpenInventory}
            className="font-sans text-sm font-semibold text-nova-choco/75 hover:text-nova-sand transition-colors cursor-pointer"
          >
            Inventory
          </button>
          <button
            onClick={onOpenReports}
            className="font-sans text-sm font-semibold text-nova-choco/75 hover:text-nova-sand transition-colors cursor-pointer"
          >
            Reports
          </button>
        </nav>

        <div className="relative flex items-center gap-1 border-l border-nova-sand/25 pl-1 sm:gap-3 sm:pl-3 md:gap-5 md:pl-7">
          {/* Notifications Log Toggle */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full p-1.5 text-nova-choco transition-colors hover:bg-nova-beige/30 hover:text-nova-sand"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5 stroke-[2.2px]" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-nova-sand text-nova-choco text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 top-14 z-50 w-[calc(100vw-1.5rem)] max-w-80 rounded-2xl border border-nova-sand/20 bg-white p-4 shadow-xl sm:right-12 md:right-36 md:top-12">
              <div className="flex justify-between items-center mb-3 border-b border-nova-sand/10 pb-2">
                <span className="font-serif font-bold text-sm text-nova-choco">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      onClearNotifications();
                      setShowNotifications(false);
                    }}
                    className="text-[11px] font-semibold text-nova-sand hover:underline font-sans"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="text-xs text-nova-choco/50 italic text-center py-4 font-sans">
                    No new alerts or bookings.
                  </p>
                ) : (
                  notifications.map((notif, index) => (
                    <div
                      key={index}
                      className="text-xs bg-nova-beige/20 hover:bg-nova-beige/40 p-2.5 rounded-lg border-l-2 border-nova-sand text-nova-choco/80 font-sans leading-relaxed"
                    >
                      {notif}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* User Profile */}
          <button className="hidden min-h-11 min-w-11 items-center justify-center rounded-full p-1.5 text-nova-choco transition-colors hover:bg-nova-beige/30 hover:text-nova-sand sm:flex" aria-label="Open user profile">
            <User className="w-5 h-5 stroke-[2.2px]" />
          </button>

          {/* Checkout CTA Button */}
          <button
            onClick={onCheckoutClick}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-nova-choco px-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:scale-[1.03] hover:bg-nova-choco/90 active:scale-[0.97] sm:gap-2 sm:px-4 md:px-5"
            aria-label="Open checkout"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5px]" />
            <span className="hidden sm:inline">Checkout</span>
            {cartItemCount > 0 && (
              <span className="bg-nova-sand text-nova-choco px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1 animate-pulse">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
