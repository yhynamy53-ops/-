
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import { Conversation, Message } from './types';
import { generateResponseStream, generateImage } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('chat_conversations_v2', []);
  const [activeConvoId, setActiveConvoId] = useLocalStorage<string | null>('chat_active_id_v2', null);
  const [modelType, setModelType] = useState<string>('assistant-default');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('chat_theme_v2', 'light');

  const nowTime = () => new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const handleNewConversation = useCallback(() => {
    const newId = `conv-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: 'محادثة جديدة',
      messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConvoId(newId);
  }, [setConversations, setActiveConvoId]);
  
  useEffect(() => {
    if (conversations.length === 0 || !conversations.find(c => c.id === activeConvoId)) {
        const welcomeId = `conv-${Date.now()}`;
        const welcomeConversation: Conversation = {
          id: welcomeId,
          title: 'محادثة جديدة',
          messages: [{ role: 'assistant', text: 'أهلًا! أنا مساعد ذكاء اصطناعي. كيف يمكنني مساعدتك اليوم؟', time: nowTime() }],
        };
        setConversations([welcomeConversation]);
        setActiveConvoId(welcomeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConvoId);
  }, [conversations, activeConvoId]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeConvoId) {
      handleNewConversation();
      setTimeout(() => handleSendMessage(text), 100);
      return;
    }
    if (isLoading) return;

    const userMessage: Message = { role: 'user', text, time: nowTime() };
    const updatedHistory = [...(activeConversation?.messages || []), userMessage];

    setConversations(prev =>
      prev.map(c => c.id === activeConvoId ? { ...c, messages: updatedHistory } : c)
    );
    
    setIsLoading(true);

    const updateTitle = () => {
        setConversations(prev => prev.map(c => {
            if(c.id === activeConvoId && c.messages.length === 2 && c.title === 'محادثة جديدة') {
              const newTitle = text.substring(0, 30) + (text.length > 30 ? '...' : '');
              return {...c, title: newTitle};
            }
            return c;
        }));
    };

    if (modelType === 'image-generator') {
        const assistantMessage: Message = { role: 'assistant', text: 'جاري إنشاء الصورة...', time: nowTime() };
        setConversations(prev =>
            prev.map(c => c.id === activeConvoId ? { ...c, messages: [...updatedHistory, assistantMessage] } : c)
        );

        try {
            const result = await generateImage(text);
            setConversations(prev =>
              prev.map(c => {
                if (c.id === activeConvoId) {
                  const newMessages = [...c.messages];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (result.imageUrl) {
                    newMessages[newMessages.length - 1] = { ...lastMessage, text: '', imageUrl: result.imageUrl };
                  } else {
                    newMessages[newMessages.length - 1] = { ...lastMessage, text: result.error || 'حدث خطأ غير معروف' };
                  }
                  return { ...c, messages: newMessages };
                }
                return c;
              })
            );
            updateTitle();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    } else {
        const assistantMessage: Message = { role: 'assistant', text: '', time: nowTime() };
        setConversations(prev =>
          prev.map(c => c.id === activeConvoId ? { ...c, messages: [...updatedHistory, assistantMessage] } : c)
        );
        
        try {
          const stream = generateResponseStream(updatedHistory, modelType);
          let fullResponse = '';
          for await (const chunk of stream) {
            fullResponse += chunk;
            setConversations(prev =>
              prev.map(c => {
                if (c.id === activeConvoId) {
                  const newMessages = [...c.messages];
                  newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: fullResponse };
                  return { ...c, messages: newMessages };
                }
                return c;
              })
            );
          }
          updateTitle();
        } catch (error) {
          console.error(error);
          setConversations(prev =>
            prev.map(c => {
              if (c.id === activeConvoId) {
                const newMessages = [...c.messages];
                newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: "حدث خطأ ما." };
                return { ...c, messages: newMessages };
              }
              return c;
            })
          );
        } finally {
          setIsLoading(false);
        }
    }
  }, [activeConvoId, isLoading, activeConversation, modelType, setConversations, handleNewConversation]);

  const handleSelectConversation = (id: string) => {
    setActiveConvoId(id);
  };
  
  const handleClearAll = () => {
    if (window.confirm('هل تريد مسح كل المحادثات؟ هذا الإجراء نهائي.')) {
      setConversations([]);
      setActiveConvoId(null);
      handleNewConversation();
    }
  };

  const handleClearMessages = () => {
    if(!activeConversation) return;
    if (window.confirm('مسح المحادثة الحالية؟')) {
      setConversations(prev => prev.map(c => c.id === activeConvoId ? {...c, messages: []} : c));
    }
  };

  const handleExport = () => {
    if (!activeConversation) {
      alert('اختر محادثة أولاً');
      return;
    }
    const blob = new Blob([JSON.stringify(activeConversation, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (activeConversation.title.replace(/\s/g, '_') || 'conversation') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className={`app min-h-screen text-muted flex items-stretch gap-4 p-5 bg-gradient-to-b from-bg to-transparent`}>
      <div className="mx-auto w-full max-w-6xl h-[85vh] grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Sidebar
          conversations={conversations}
          activeId={activeConvoId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onClearAll={handleClearAll}
          onExport={handleExport}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
        <ChatPanel
          conversation={activeConversation}
          onSendMessage={handleSendMessage}
          modelType={modelType}
          onSetModelType={setModelType}
          isLoading={isLoading}
          onClearMessages={handleClearMessages}
        />
      </div>
    </div>
  );
};

export default App;
