"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { AiNotConfigured } from "@/components/ai/ai-not-configured";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApiData } from "@/hooks/use-api-data";
import { aiApi } from "@/lib/ai-api";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTED_QUESTIONS = ["Summarize this week", "Any recurring blockers?", "Who looks overloaded?"];

/** Floating chat bubble for managers. The conversation lives only in this component's state. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const status = useApiData(() => aiApi.status(), []);
  const bottomRef = useRef<HTMLDivElement>(null);

  const enabled = status.data?.enabled === true;

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending, open]);

  async function send(conversation: ChatMessage[]) {
    setMessages(conversation);
    setSending(true);
    setError(null);
    try {
      const reply = await aiApi.chat(conversation);
      setMessages([...conversation, { role: "assistant", content: reply.text }]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setSending(false);
    }
  }

  function ask(question: string) {
    const text = question.trim();
    if (!text || sending) return;
    setInput("");
    void send([...messages, { role: "user", content: text }]);
  }

  function startNewChat() {
    setMessages([]);
    setError(null);
  }

  if (!open) {
    return (
      <Button
        size="icon"
        className="fixed right-4 bottom-4 z-50 size-12 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Open team assistant"
      >
        <MessageCircle className="size-5" />
      </Button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex h-[32rem] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex-col rounded-xl border bg-background shadow-xl sm:w-96">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Sparkles className="size-4" />
        <p className="flex-1 text-sm font-medium">Team assistant</p>
        <Button variant="ghost" size="icon" onClick={startNewChat} disabled={sending} aria-label="Start a new chat">
          <RotateCcw />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close team assistant">
          <X />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {status.data && !enabled ? (
          <AiNotConfigured />
        ) : (
          messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask about your team&apos;s last few weeks of reports. Answers are based only on submitted reports.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Button key={question} variant="outline" size="sm" onClick={() => ask(question)} disabled={!enabled}>
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )
        )}

        {messages.map((message, index) => (
          <p
            key={index}
            className={cn(
              "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
              message.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted",
            )}
          >
            {message.content}
          </p>
        ))}

        {sending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Thinking...
          </p>
        )}

        {error && (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            <p>{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => send(messages)}>
              Try again
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter adds a new line
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              ask(input);
            }
          }}
          placeholder="Ask about the team..."
          aria-label="Your question"
          maxLength={2000}
          rows={2}
          className="max-h-32 min-h-0 resize-none"
          disabled={!enabled}
        />
        <Button type="submit" size="icon" disabled={!enabled || sending || !input.trim()} aria-label="Send">
          <Send />
        </Button>
      </form>
    </div>
  );
}
