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
      <div className="page-inner assistant-layout">
        <aside className="glass-panel assistant-rail">
          <div className="assistant-mark">
            +
          </div>
          <h1 className="section-title">First-aid assistant</h1>
          <p className="muted mt-3">
            Ask for immediate steps while professional help is on the way.
          </p>

          <div className="assistant-quick">
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

          <div className="notice mt-6">
            Call local emergency services immediately for life-threatening symptoms.
          </div>
        </aside>

        <section className="glass-panel assistant-chat">
          <div className="assistant-chat-head">
            <div>
              <h2 className="font-display font-bold text-slate-950 dark:text-white">Guidance chat</h2>
              <p className="muted text-sm">General guidance while you arrange professional care.</p>
            </div>
            <span className="status-pill">Not emergency care</span>
          </div>

          <div className="assistant-messages" role="log" aria-live="polite" aria-label="First-aid conversation">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`chat-message ${message.role === "user" ? "chat-message--user" : ""}`}>
                  <FormattedMessage text={message.text} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="chat-message" role="status">
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
            className="assistant-form"
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
