
import React from 'react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClearAll: () => void;
  onExport: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onClearAll,
  onExport,
  onToggleTheme,
  theme
}) => {
  return (
    <aside className="sidebar bg-panel rounded-xl p-3.5 flex flex-col shadow-lg lg:order-1 order-2">
      <div className="logo flex items-center gap-2.5 mb-3">
        <div className="dot w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-purple-500" aria-hidden="true"></div>
        <div>
          <div className="font-bold text-muted">شبيه ChatGPT</div>
          <div className="text-xs text-muted">نسخة تجريبية</div>
        </div>
      </div>

      <div className="convos flex-1 overflow-y-auto pr-1 custom-scrollbar" aria-live="polite">
        {conversations.map(c => (
          <div
            key={c.id}
            className={`convo p-2.5 rounded-lg cursor-pointer text-muted flex gap-2 items-center text-sm truncate ${c.id === activeId ? 'bg-gradient-to-l from-blue-500/10 to-purple-500/5 text-accent' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
            onClick={() => onSelect(c.id)}
          >
            {c.title || 'محادثة'}
          </div>
        ))}
      </div>

      <div 
        className="new-btn mt-2 p-2.5 rounded-lg bg-accent text-white text-center cursor-pointer text-sm"
        onClick={onNew}
      >
        + محادثة جديدة
      </div>

      <div className="mt-2.5 text-xs text-muted flex gap-1.5 items-center">
        <button onClick={onToggleTheme} className="copy-btn p-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5" title="تبديل الوضع">
           {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button onClick={onExport} className="copy-btn p-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5" title="تنزيل المحادثة">
          ↓
        </button>
        <button onClick={onClearAll} className="copy-btn p-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5" title="مسح كل المحادثات">
          🗑️
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
