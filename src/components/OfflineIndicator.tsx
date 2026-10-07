import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur-md border border-amber-400/40 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
      <span>وضع عدم الاتصال — التطبيق يعمل محلياً من الذاكرة المؤقتة (Offline Ready)</span>
    </div>
  );
};
