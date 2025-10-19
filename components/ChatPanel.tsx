
import React, { useRef, useEffect, useState } from 'react';
import { Conversation, Message } from '../types';

interface ChatPanelProps {
  conversation: Conversation | undefined;
  onSendMessage: (text: string) => void;
  modelType: string;
  onSetModelType: (model: string) => void;
  isLoading: boolean;
  onClearMessages: () => void;
}

const MessageBubble: React.FC<{ message: Message }> = React.memo(({ message }) => {
    const handleCopy = () => {
        if (message.text) {
            navigator.clipboard.writeText(message.text).catch(err => console.error('Failed to copy text: ', err));
        }
    };

    const formattedText = message.text.replace(/\n/g, '<br />');

    return (
        <div className={`msg max-w-[78%] flex flex-col ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
            <div className={`p-3 rounded-xl break-words ${message.role === 'user' ? 'bg-bubble-user text-gray-800 dark:text-gray-200' : 'bg-bubble-assistant text-muted'}`}>
                {message.imageUrl ? (
                    <img src={message.imageUrl} alt="محتوى تم إنشاؤه" className="rounded-lg max-w-full h-auto" />
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: formattedText }} />
                )}
            </div>
            {message.sources && message.sources.length > 0 && (
                <div className={`sources mt-2 text-xs ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <h4 className="font-bold text-muted mb-1">المصادر:</h4>
                    <ul className="space-y-1">
                        {message.sources.map((source, index) => (
                            <li key={index}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className={`meta text-xs text-muted flex gap-2 items-center mt-1.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span>{message.role === 'user' ? 'أنت' : 'المساعد'}</span>
                <span>·</span>
                <span>{message.time}</span>
                {message.text && (
                    <button className="copy-btn p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10" onClick={handleCopy}>نسخ</button>
                )}
            </div>
        </div>
    );
});

const Composer: React.FC<{ onSend: (text: string) => void, isLoading: boolean }> = ({ onSend, isLoading }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (text.trim() && !isLoading) {
            onSend(text.trim());
            setText('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const insertSample = () => {
        const sample = 'اعطني ملخصًا عن أسباب تغير المناخ بطريقة بسيطة مع أمثلة.';
        setText(sample);
        textareaRef.current?.focus();
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [text]);

    return (
        <div className="composer flex gap-2 pt-2 border-t border-dashed border-black/5 dark:border-white/10">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالة..."
                className="flex-1 min-h-[48px] max-h-48 p-2.5 rounded-lg border border-black/10 dark:border-white/10 resize-none bg-transparent text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                rows={1}
                disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
                <button onClick={handleSend} disabled={isLoading} className="send-btn px-4 py-2 rounded-lg bg-accent text-white border-none cursor-pointer disabled:opacity-50">
                    {isLoading ? '...' : 'إرسال'}
                </button>
                <button onClick={insertSample} className="copy-btn p-2 rounded-lg border border-black/10 dark:border-white/10" title="أدرج مثال">مثال</button>
            </div>
        </div>
    );
};


const ChatPanel: React.FC<ChatPanelProps> = ({ conversation, onSendMessage, modelType, onSetModelType, isLoading, onClearMessages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  return (
    <main className="panel bg-panel rounded-xl p-3.5 flex flex-col h-full shadow-lg lg:order-2 order-1" role="main">
      <div className="header flex items-center justify-between pb-2">
        <div className="title font-bold text-muted truncate pr-4">{conversation?.title || 'محادثة جديدة'}</div>
        <div className="controls flex gap-2 items-center">
          <select 
            id="modelSel" 
            title="اختر نموذج محاكاة"
            value={modelType}
            onChange={(e) => onSetModelType(e.target.value)}
            className="p-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-muted cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="assistant-default">Assistant — افتراضي</option>
            <option value="assistant-helpful">مساعد ودود</option>
            <option value="assistant-socratic">طريقة سوكراتية</option>
            <option value="assistant-short">ردود قصيرة</option>
            <option value="software-finder">باحث البرامج</option>
            <option value="image-generator">مولد الصور</option>
          </select>
          <button onClick={onClearMessages} className="copy-btn p-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5" title="مسح المحادثة">مسح</button>
        </div>
      </div>

      <div className="chat-area flex-1 overflow-y-auto px-1.5 custom-scrollbar" aria-live="polite">
        <div className="messages flex flex-col gap-4 py-3">
            {conversation?.messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
            <div ref={messagesEndRef} />
        </div>
      </div>

      <Composer onSend={onSendMessage} isLoading={isLoading} />

      <footer className="text-xs text-muted text-center pt-2">
        هذه نسخة تجريبية تتصل بـ Gemini API.
      </footer>
    </main>
  );
};

export default ChatPanel;
