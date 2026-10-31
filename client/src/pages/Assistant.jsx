import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

const QUICK_PROMPTS = [
  "Someone is choking",
  "How do I do CPR?",
  "Severe bleeding from a cut",
  "Suspected snake bite",
];

function FormattedMessage({ text }) {
  return text.split("\n").map((line, lineIndex) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={lineIndex} className="block">
        {parts.map((part, partIndex) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={partIndex}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={partIndex}>{part}</span>
          )
        )}
      </span>
    );
  });
}

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Describe what is happening for general first-aid steps. For anything life-threatening, call your local emergency number now.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat", { message: text });
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        "Guidance is unavailable right now. If this is an emergency, call your local emergency number immediately.";

      setMessages((prev) => [...prev, { role: "assistant", text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-inner grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="glass-panel rounded-lg p-6">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-lg bg-red-50 font-mono text-sm font-bold tracking-[0.08em] text-red-700 dark:bg-red-500/10 dark:text-red-200">
            01
          </div>
          <h1 className="section-title">First-aid assistant</h1>
          <p className="muted mt-3">
            Ask for immediate steps while professional help is on the way.
          </p>

          <div className="mt-8 space-y-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="btn-ghost w-full justify-start"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            Call local emergency services immediately for life-threatening symptoms.
          </div>
        </aside>

        <section className="glass-panel flex min-h-[660px] flex-col rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
            <div>
              <h2 className="font-display font-bold text-slate-950 dark:text-white">Guidance chat</h2>
              <p className="muted text-sm">General guidance while you arrange professional care.</p>
            </div>
            <span className="rounded-lg bg-amber-50 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">Not emergency care</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-7 shadow-sm sm:max-w-[78%] ${
                    message.role === "user"
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-950/70 dark:text-slate-100"
                  }`}
                >
                  <FormattedMessage text={message.text} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-950/70 dark:text-slate-300">
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="mt-4 flex gap-2 border-t border-slate-200 pt-4 dark:border-white/10"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the emergency..."
              disabled={loading}
              maxLength={2000}
              aria-label="Describe what is happening"
              className="field mt-0"
            />
            <button type="submit" disabled={loading} className="btn-primary shrink-0">
              {loading ? "Sending…" : "Send"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
