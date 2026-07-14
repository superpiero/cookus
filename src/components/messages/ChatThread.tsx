"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { sendMessageAction } from "@/actions/messages";
import { QUICK_EMOJI } from "@/lib/const";

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string; // ISO
};

export function ChatThread({
  conversationId,
  meId,
  initialMessages,
}: {
  conversationId: string;
  meId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lastRealCreatedAt = () => {
    const real = messages.filter((m) => !m.id.startsWith("tmp-"));
    return real.length ? real[real.length - 1]!.createdAt : new Date(0).toISOString();
  };

  const mergeNew = (incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      if (fresh.length === 0) return prev;
      // reálné zprávy ode mě nahrazují optimistické
      const withoutTmp = prev.filter(
        (m) => !(m.id.startsWith("tmp-") && fresh.some((f) => f.senderId === meId && f.body === m.body))
      );
      return [...withoutTmp, ...fresh];
    });
  };

  const poll = async () => {
    try {
      const visible = document.visibilityState === "visible" ? "1" : "0";
      const res = await fetch(
        `/api/poll/messages?conversationId=${conversationId}&after=${encodeURIComponent(lastRealCreatedAt())}&visible=${visible}`
      );
      if (res.ok) {
        const data = await res.json();
        mergeNew(
          (data.messages ?? []).map((m: ChatMessage & { createdAt: string | Date }) => ({
            ...m,
            createdAt: new Date(m.createdAt).toISOString(),
          }))
        );
      }
    } catch {
      /* offline — ticho */
    }
  };

  useEffect(() => {
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, senderId: meId, body, createdAt: new Date().toISOString() },
    ]);
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("body", body);
    const result = await sendMessageAction(null, formData);
    if (result?.error) {
      setError(result.error);
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("tmp-")));
      setDraft(body);
    } else {
      await poll();
    }
    setSending(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-[65dvh] flex-col rounded-card border-2 border-vinyl bg-porcelain shadow-diner">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-smoke">Zatím žádné zprávy — napiš první. 👋</p>
        )}
        {messages.map((message) => {
          const mine = message.senderId === meId;
          return (
            <div
              key={message.id}
              className={`max-w-[75%] whitespace-pre-wrap break-words rounded-card border-2 border-vinyl px-3.5 py-2 text-sm ${
                mine ? "ml-auto bg-cherry text-white" : "bg-vanilla"
              } ${message.id.startsWith("tmp-") ? "opacity-70" : ""}`}
            >
              {message.body}
              <span className={`mt-0.5 block text-right text-[10px] ${mine ? "text-white/70" : "text-smoke"}`}>
                {new Date(message.createdAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-vinyl p-3">
        <div className="mb-2 flex gap-1" aria-label="Rychlé emoji">
          {QUICK_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded-full px-1.5 py-0.5 text-lg hover:bg-chrome-light"
              onClick={() => {
                setDraft((d) => d + emoji);
                inputRef.current?.focus();
              }}
              aria-label={`Vložit ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {error && <p className="mb-1 text-xs font-bold text-ketchup">{error}</p>}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={4000}
            placeholder="Napiš zprávu…"
            aria-label="Zpráva"
            className="w-full rounded-full border-2 border-vinyl bg-vanilla px-4 py-2.5 text-sm placeholder:text-smoke/70"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Odeslat zprávu"
            className="rounded-full border-2 border-vinyl bg-cherry p-2.5 text-white shadow-diner-sm diner-press disabled:opacity-50"
          >
            <SendHorizonal className="size-5" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
