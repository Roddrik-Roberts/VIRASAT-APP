import React, { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

export default function AIChatbot() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste! Ask me anything about Indian monuments, culture, or historical sites.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText }
    ]);

    setInput('');
    setLoading(true);
    setServerError('');

    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: userText
        })
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const detail =
          data.detail ||
          data.message ||
          `Backend returned HTTP ${response.status}`;

        throw new Error(detail);
      }

      const aiReply =
        data.reply ||
        data.response ||
        data.message;

      if (!aiReply) {
        throw new Error('Backend returned no AI response.');
      }

      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: aiReply }
      ]);

    } catch (err) {
      console.error('Virasat AI error:', err);

      const message = err?.message || 'Unknown connection error';

      setServerError(message);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ ${message}`
        }
      ]);

    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-80 h-96 bg-slate-900 border border-slate-700 rounded-xl flex flex-col p-4 shadow-2xl text-white">

      {/* Header */}
      <div className="font-bold text-amber-400 border-b border-slate-800 pb-2 mb-2 flex justify-between items-center shrink-0">
        <span className="flex items-center gap-1.5">
          🏛️ Virasat AI Guide
        </span>

        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
          Groq LLM
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[85%] break-words ${
              msg.sender === 'user'
                ? 'bg-amber-600 ml-auto text-white'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="text-xs text-amber-400 animate-pulse bg-slate-800/50 p-2 rounded-lg max-w-[85%]">
            Virasat AI is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Connection error */}
      {serverError && (
        <div className="text-[10px] text-red-400 mt-2 break-words">
          Server: {serverError}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a monument..."
          disabled={loading}
          className="flex-1 bg-slate-800 text-xs px-3 py-2 rounded border border-slate-700 focus:outline-none focus:border-amber-400 disabled:opacity-50"
        />

        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs px-3 py-2 rounded transition disabled:opacity-50"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
