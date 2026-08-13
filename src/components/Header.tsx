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
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-20 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 z-30 border-b border-nova-sand/10">
      {/* Search Input Section */}
      <div className="flex items-center gap-6 flex-grow max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-nova-choco/50 stroke-[2.2px]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-2.5 rounded-full border border-nova-sand/30 bg-white text-nova-choco placeholder-nova-choco/40 text-sm font-sans focus:outline-none focus:border-nova-choco focus:ring-2 focus:ring-nova-sand/20 transition-all duration-200"
            placeholder={getSearchPlaceholder()}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-nova-choco/40 hover:text-nova-choco text-xs font-semibold font-sans bg-nova-beige/40 px-2 py-0.5 rounded-full"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Navigation & Toolbar */}
      <div className="flex items-center gap-8">
        {/* Real-time Kuala Lumpur Clock (GMT+8) */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-nova-beige/40 border border-nova-sand/15 text-nova-choco/80 font-mono text-xs select-none">
          <Clock className="w-3.5 h-3.5 text-nova-sand stroke-[2.2px] animate-pulse" />
          <span className="font-bold tracking-wide">Kuala Lumpur: {klTime}</span>
        </div>

        <nav className="flex gap-7">
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

        <div className="flex items-center gap-5 border-l border-nova-sand/25 pl-7 relative">
          {/* Notifications Log Toggle */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-nova-choco hover:text-nova-sand transition-colors p-1.5 hover:bg-nova-beige/30 rounded-full relative"
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
            <div className="absolute right-36 top-12 w-80 bg-white rounded-2xl shadow-xl border border-nova-sand/20 p-4 z-50">
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
          <button className="text-nova-choco hover:text-nova-sand transition-colors p-1.5 hover:bg-nova-beige/30 rounded-full">
            <User className="w-5 h-5 stroke-[2.2px]" />
          </button>

          {/* Checkout CTA Button */}
          <button
            onClick={onCheckoutClick}
            className="bg-nova-choco text-white px-5 py-2.5 rounded-full text-xs font-bold font-sans tracking-wider uppercase hover:bg-nova-choco/90 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5px]" />
            <span>Checkout</span>
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
