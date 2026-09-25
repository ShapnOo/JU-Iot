import React, { useState } from 'react';
import { X, Send, Bot, MessageSquare, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { sendCustomTelegramMessage, TELEGRAM_CHAT_ID } from '../services/telegramBot';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
}

const PRESET_MESSAGES = [
  '🚨 Low Distance Warning: Obstacle detected near the entrance!',
  '📏 Distance Sensor Status: Reading current distance telemetry.',
  '🚨 Urgent: Check room environment immediately!',
  '💡 Requesting manual room light status update.',
  '📊 System check: All sensor telemetry operating normally.',
];

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose, onSuccessToast }) => {
  const [customText, setCustomText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || customText;
    if (!text.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a message to send.' });
      return;
    }

    setIsSending(true);
    setStatusMsg(null);

    const result = await sendCustomTelegramMessage(text);
    setIsSending(false);

    if (result.success) {
      setStatusMsg({ type: 'success', text: 'Message delivered to Telegram bot!' });
      onSuccessToast(`Sent to Telegram: "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`);
      setCustomText('');
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } else {
      setStatusMsg({ type: 'error', text: result.error || 'Failed to send message.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-cyan-500/30 rounded-3xl w-full max-w-lg shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Telegram Messenger
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  @tahmidsr_bot
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Send custom messages to Chat ID: <span className="font-mono text-cyan-300">{TELEGRAM_CHAT_ID}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Quick Preset Messages
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomText(preset);
                  }}
                  className="text-left px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-200 transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{preset}</span>
                  <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    Select &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Area */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              Custom Message
            </label>
            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your message here... (e.g. Warning: Room door opened)"
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm resize-none"
            />
          </div>

          {/* Feedback Status */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSend()}
            disabled={isSending || !customText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Send to Telegram
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
