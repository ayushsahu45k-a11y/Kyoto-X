import React, { useState } from 'react';
import { Message, Role, User } from '../types';
import Markdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  user?: User | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, user }) => {
  const isUser = message.role === Role.USER;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-[90%] md:max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
             user?.avatar ? (
                <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full object-cover border-2 border-blue-500 dark:border-slate-700 shadow-md" />
             ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
             )
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-slate-700 dark:to-slate-900 flex items-center justify-center shadow-md shadow-cyan-500/20 dark:shadow-slate-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.001c-3.3 2.567-7.268 4.195-11.619 4.615.169-2.11.96-4.075 2.215-5.717zm-5.045 8.328a.75.75 0 10-1.06-1.06c-1.591 1.591-2.43 3.508-2.636 5.344-.197 1.763.511 3.447 1.94 4.346 1.433.901 3.208.973 4.887.27a.75.75 0 00.32-.995.75.75 0 00-1.085-.296c-1.168.49-2.222.42-2.924.062a2.388 2.388 0 01-1.38-1.745c.162-1.438.835-2.887 1.938-3.926z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col gap-1 max-w-full">
          <div
            className={`px-5 py-4 rounded-2xl shadow-sm backdrop-blur-sm transition-all duration-300 relative text-sm md:text-base leading-relaxed overflow-hidden ${
              isUser
                ? 'bg-blue-600 dark:bg-slate-900 text-white rounded-tr-none hover:shadow-blue-500/20 dark:hover:shadow-slate-900/50'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700/50'
            }`}
          >
            <div className={`prose prose-sm md:prose-base max-w-none ${isUser ? 'prose-invert text-white' : 'dark:prose-invert'}`}>
              <Markdown>{message.text}</Markdown>
            </div>
            <div className={`text-[10px] mt-2 opacity-60 text-right ${isUser ? 'text-blue-100 dark:text-slate-400' : 'text-slate-400'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          {/* Action Buttons (Copy) */}
          {!isUser && (
            <div className="flex justify-start opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1">
              <button 
                onClick={handleCopy}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                title="Copy message"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? <span className="text-green-500">Copied</span> : null}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};