'use client';
import { useState, useEffect } from 'react';
import API from '@/lib/api';

export default function ChatBox({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch messages and poll every 3 seconds for new messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await API.get(`/messages/?room=${roomId}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await API.post('/messages/', {
        room: roomId,
        content: newMessage,
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  if (loading) {
    return <div className="text-slate-400 p-4">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-[450px] bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-xl">
      <div className="text-sm font-semibold text-slate-400 pb-2 border-b border-slate-800 mb-3">
        Booking Chat
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 text-sm mt-20">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <span className="text-xs text-slate-400">{msg.sender_name}</span>
              <div className="bg-slate-800 p-3 rounded-lg max-w-[80%] mt-1 text-sm text-slate-200">
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message to your provider/client..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}