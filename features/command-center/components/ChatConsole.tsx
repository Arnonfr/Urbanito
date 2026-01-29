import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { useCommandCenter } from '../context/CommandCenterContext';

export const ChatConsole = () => {
    const [input, setInput] = useState('');
    const { messages, sendMessage, isProcessing } = useCommandCenter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;

        const text = input;
        setInput('');
        await sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>

                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
              ${msg.sender === 'user' ? 'bg-indigo-600 text-white' :
                                msg.sender === 'agent' ? 'bg-amber-100 text-amber-600 border border-amber-200'
                                    : 'bg-white border border-gray-200 text-indigo-600'}`}>
                            {msg.sender === 'user' ? <User size={18} /> :
                                msg.sender === 'agent' ? <Bot size={18} /> : <Sparkles size={18} />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[70%] rounded-2xl p-5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap
              ${msg.sender === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                            }`}>
                            {msg.agentName && <div className="text-xs font-bold mb-1 text-amber-600">{msg.agentName}</div>}
                            {msg.text}
                            <div className={`mt-2 text-[10px] uppercase tracking-widest ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {msg.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-indigo-600 flex items-center justify-center shadow-sm">
                            <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <div className="bg-white border border-gray-100 text-gray-500 rounded-2xl p-4 rounded-tl-none shadow-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200 bg-white">
                <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                    <div className="absolute left-4 text-indigo-500">
                        <Sparkles size={16} />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isProcessing ? "Alpha is processing..." : "Type a command for Alpha..."}
                        disabled={isProcessing}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-14 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isProcessing}
                        className="absolute right-2 p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="text-center mt-3 text-[10px] text-gray-400 font-sans">
                    Press Enter to send • Secure Connection
                </div>
            </div>
        </div>
    );
};
