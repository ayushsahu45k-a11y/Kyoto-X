import React, { useState } from 'react';
import { User, ChatSession } from '../types';
import { DatasetVisualizer } from './DatasetVisualizer';
import { Search } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  history: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, onClose, user, history, currentSessionId, onLoadSession, onNewChat, onOpenSettings 
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'data'>('history');
  const [searchQuery, setSearchQuery] = useState('');

  const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const filteredHistory = history.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside 
      className={`fixed lg:static inset-y-0 left-0 z-30 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-none'
      } lg:flex lg:flex-col lg:w-80 shadow-2xl lg:shadow-none`}
    >
      <div className="h-full flex flex-col relative">
        
        {/* Mobile Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-slate-300 lg:hidden z-50"
        >
          <XIcon />
        </button>

        {/* Tab Switcher */}
        <div className="flex p-4 gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
           <button 
             onClick={() => setActiveTab('history')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
               activeTab === 'history' 
                 ? 'bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-slate-200' 
                 : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
             }`}
           >
             Chat History
           </button>
           <button 
             onClick={() => setActiveTab('data')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
               activeTab === 'data' 
                 ? 'bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-slate-200' 
                 : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
             }`}
           >
             Knowledge Base
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* History Tab */}
          <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <div className="p-4 pb-0">
                <button 
                  onClick={onNewChat}
                  className="w-full mb-4 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-slate-500 dark:hover:text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New Conversation
                </button>
                
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search history..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/30 dark:focus:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-slate-700 transition-all"
                  />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Sessions</h3>
                  {history.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-8 italic">No history yet. Start chatting!</div>
                  )}
                  {history.length > 0 && filteredHistory.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-8 italic">No matches found.</div>
                  )}
                  {filteredHistory.slice().reverse().map((session) => (
                    <button
                      key={session.id}
                      onClick={() => onLoadSession(session)}
                      className={`w-full text-left p-3 rounded-lg transition-all border ${
                        currentSessionId === session.id
                          ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700'
                          : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`font-medium text-sm truncate ${currentSessionId === session.id ? 'text-blue-700 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>
                        {session.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                         <span>{session.date.toLocaleDateString()}</span>
                         <span>{session.messages.length} msgs</span>
                      </div>
                    </button>
                  ))}
                </div>
             </div>
          </div>

          {/* Dataset Tab */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'data' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <DatasetVisualizer />
          </div>

        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
           <button 
             onClick={onOpenSettings}
             className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group"
           >
              <div className="relative">
                {user.avatar ? (
                  <img src={user.avatar} alt="Me" className="w-10 h-10 rounded-full object-cover border-2 border-slate-300 dark:border-slate-600 group-hover:border-blue-500 dark:group-hover:border-slate-400 transition-colors" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-slate-800 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-bold text-slate-800 dark:text-white truncate text-sm">{user.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-slate-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.348 2.995a1.5 1.5 0 011.08 1.995l-.65 1.55a1.5 1.5 0 001.077 2.01l1.54.385a1.5 1.5 0 011.08 2.007l-.65 1.55a1.5 1.5 0 001.077 2.01l1.54.385a1.5 1.5 0 011.08 2.007l-.65 1.55a1.5 1.5 0 001.077 2.01l1.54.385a1.5 1.5 0 01.328 2.627l-1.397 1.12a1.5 1.5 0 00-.547 1.706l.39 1.62a1.5 1.5 0 01-1.313 1.838l-1.68.21a1.5 1.5 0 00-1.334 1.144l-.39 1.62a1.5 1.5 0 01-1.838 1.313l-1.68-.21a1.5 1.5 0 00-1.334 1.144l-.39 1.62a1.5 1.5 0 01-2.627.328l-1.12-1.397a1.5 1.5 0 00-1.706-.547l-1.62.39a1.5 1.5 0 01-1.838-1.313l-.21-1.68a1.5 1.5 0 00-1.144-1.334l-1.62-.39a1.5 1.5 0 01-1.313-1.838l.21-1.68a1.5 1.5 0 00-1.144-1.334l-1.62-.39a1.5 1.5 0 01-.328-2.627l1.397-1.12a1.5 1.5 0 00.547-1.706l-.39-1.62a1.5 1.5 0 011.313-1.838l1.68-.21a1.5 1.5 0 001.334-1.144l.39-1.62a1.5 1.5 0 011.838-1.313l1.68.21a1.5 1.5 0 001.334-1.144l.39-1.62h.001zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
              </svg>
           </button>
        </div>
      </div>
    </aside>
  );
};