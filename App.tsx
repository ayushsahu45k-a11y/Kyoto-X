import React, { useState, useEffect, useRef } from 'react';
import { APP_DATASET } from './constants';
import { initializeChat, sendMessageToGemini } from './services/geminiService';
import { Message, Role, User, Theme, ChatSession } from './types';
import { ChatMessage } from './components/ChatMessage';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { v4 as uuidv4 } from 'uuid';
import * as Storage from './services/storageService';
import EmojiPicker from 'emoji-picker-react';
import { Smile, Bold, Italic, Code, Trash2, RefreshCw, Send, Download, ArrowDown } from 'lucide-react';

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

function App() {
  // State: Auth & User
  const [user, setUser] = useState<User | null>(null);
  
  // State: Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // State: UI & History
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [theme, setTheme] = useState<Theme>('default');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---

  useEffect(() => {
    // Load persisted data
    const savedUser = Storage.getUser();
    if (savedUser) setUser(savedUser);

    const savedHistory = Storage.getHistory();
    setChatHistory(savedHistory);

    const savedTheme = Storage.getTheme();
    setTheme(savedTheme);

    initializeChat();
  }, []);

  // --- Effects ---

  // Handle Theme Logic
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.add('light'); 
    } else {
      root.classList.add('dark'); 
    }
  }, [theme]);

  // Persist History when messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      setChatHistory(prev => {
        const existingIndex = prev.findIndex(s => s.id === currentSessionId);
        const title = messages.find(m => m.role === Role.USER)?.text.slice(0, 30) + "..." || "New Conversation";
        
        let newHistory;
        if (existingIndex >= 0) {
          newHistory = [...prev];
          newHistory[existingIndex] = { ...newHistory[existingIndex], messages, title };
        } else {
          newHistory = [...prev, { id: currentSessionId, title, messages, date: new Date() }];
        }
        
        Storage.saveHistory(newHistory);
        return newHistory;
      });
    }
  }, [messages, currentSessionId]);

  // Auto-scroll and auto-focus
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    let content = `# Chat Export - ${new Date().toLocaleString()}\n\n`;
    messages.forEach(msg => {
      const role = msg.role === Role.USER ? (user?.name || 'User') : APP_DATASET.productName;
      content += `### ${role} (${new Date(msg.timestamp).toLocaleTimeString()})\n${msg.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Handlers ---

  const handleLogin = (userData: User) => {
    setUser(userData);
    Storage.saveUser(userData);
    startNewChat(userData.name);
  };

  const handleLogout = () => {
    Storage.clearSession();
    setUser(null);
    setMessages([]);
    setChatHistory([]);
    setCurrentSessionId(null);
    setIsSettingsOpen(false);
  };

  const startNewChat = (userName?: string) => {
    const newId = uuidv4();
    setCurrentSessionId(newId);
    const greeting = `Hello ${userName || user?.name || 'Explorer'}! How are you today? I am ready to assist with ${APP_DATASET.productName} or any other topic.`;
    
    setMessages([
      {
        id: uuidv4(),
        role: Role.MODEL,
        text: greeting,
        timestamp: new Date(),
      },
    ]);
    
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    Storage.saveUser(updatedUser);
  };

  const handleUpdateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    Storage.saveTheme(newTheme);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setShowEmojiPicker(false);
    
    const newUserMsg: Message = {
      id: uuidv4(),
      role: Role.USER,
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(userText);
      const newBotMsg: Message = {
        id: uuidv4(),
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      console.error("Failed to get response", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (messages.length < 2 || isLoading) return;
    
    // Find last user message
    const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === Role.USER);
    if (lastUserMsgIndex === -1) return;
    
    const actualIndex = messages.length - 1 - lastUserMsgIndex;
    const lastUserMsg = messages[actualIndex];
    
    // Remove all messages after the last user message
    setMessages(prev => prev.slice(0, actualIndex + 1));
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(lastUserMsg.text);
      const newBotMsg: Message = {
        id: uuidv4(),
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      console.error("Failed to regenerate response", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the current chat?")) {
      startNewChat();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setInput(prev => prev + emojiObject.emoji);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const selectedText = input.substring(start, end);
    const newText = input.substring(0, start) + prefix + selectedText + suffix + input.substring(end);
    setInput(newText);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  // --- Render ---

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        currentTheme={theme}
        onUpdateUser={handleUpdateUser}
        onUpdateTheme={handleUpdateTheme}
        onLogout={handleLogout}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        history={chatHistory}
        currentSessionId={currentSessionId}
        onLoadSession={loadSession}
        onNewChat={() => startNewChat()}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative bg-white/50 dark:bg-slate-900/50">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <MenuIcon />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{APP_DATASET.productName}</h1>
              <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-slate-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-slate-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 dark:bg-slate-400"></span>
                </span>
                Connected
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-xs text-slate-400 dark:text-slate-500">
               Experience-Ai-with-Ayush
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
              <button 
                onClick={handleExportChat}
                disabled={messages.length === 0}
                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                title="Export chat as Markdown"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={handleRegenerate}
                disabled={isLoading || messages.length < 2}
                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                title="Regenerate last response"
              >
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={handleClearChat}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Clear chat"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 md:px-12 py-6 custom-scrollbar scroll-smooth relative"
        >
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} user={user} />
            ))}
            
            {isLoading && (
              <div className="flex w-full justify-start mb-6 animate-pulse">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                   <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center gap-1.5 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-28 right-8 p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all z-10 animate-fade-in"
            title="Scroll to bottom"
          >
            <ArrowDown size={20} />
          </button>
        )}

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors relative">
          <div className="max-w-4xl mx-auto">
            {/* Markdown Toolbar */}
            <div className="flex items-center gap-2 mb-2 px-2">
              <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Bold">
                <Bold size={16} />
              </button>
              <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Italic">
                <Italic size={16} />
              </button>
              <button onClick={() => insertMarkdown('`', '`')} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Code">
                <Code size={16} />
              </button>
              <div className="flex-1"></div>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                className={`p-1.5 rounded transition-colors ${showEmojiPicker ? 'text-blue-600 dark:text-slate-300 bg-blue-50 dark:bg-slate-800' : 'text-slate-400 hover:text-blue-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Emoji"
              >
                <Smile size={18} />
              </button>
            </div>

            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-full right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 mb-2 z-50 shadow-2xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick} 
                  theme={theme === 'dark' ? 'dark' : 'light'}
                  lazyLoadEmojis={true}
                />
              </div>
            )}

            <div className="relative flex items-end gap-3">
              <div className="flex-1 relative group">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${APP_DATASET.productName}...`}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-slate-700 border border-transparent focus:border-blue-500/30 dark:focus:border-slate-600 transition-all shadow-inner"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`p-4 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg ${
                  isLoading || !input.trim()
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-slate-900 hover:bg-blue-500 dark:hover:bg-slate-800 text-white hover:scale-105 active:scale-95 shadow-blue-500/30 dark:shadow-slate-900/50'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;