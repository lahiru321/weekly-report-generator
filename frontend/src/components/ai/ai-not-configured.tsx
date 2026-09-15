import { Info } from "lucide-react";

/** Shown instead of the AI features when the backend has no Anthropic API key. */
export function AiNotConfigured() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>
        The AI assistant is not configured. Set <code className="font-mono">ANTHROPIC_API_KEY</code> on the backend
        and restart it to turn it on.
      </p>
    </div>
  );
}
