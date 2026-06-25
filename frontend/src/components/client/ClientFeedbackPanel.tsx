import { ExternalLink, Loader2 } from "lucide-react";
import type { TicketRecord } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getClientFeedbackUrl, isClientFeedbackConfigured } from "@/lib/feedback-config";

type ClientFeedbackPanelProps = {
  ticket: TicketRecord;
  comment: string;
  onCommentChange: (value: string) => void;
  onConfirm: () => void;
  isPending?: boolean;
  compact?: boolean;
};

export function ClientFeedbackPanel({
  ticket,
  comment,
  onCommentChange,
  onConfirm,
  isPending = false,
  compact = false,
}: ClientFeedbackPanelProps) {
  const feedbackUrl = getClientFeedbackUrl(ticket);

  if (!isClientFeedbackConfigured() || !feedbackUrl) {
    return (
      <p className="text-sm text-destructive">
        Feedback link is not configured. Ask your administrator to set{" "}
        <code className="text-xs">VITE_CLIENT_FEEDBACK_URL</code> in the frontend environment.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Open the official NMP feedback form, complete the survey, then confirm here so you can close
        this request.
      </p>
      <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Official feedback link
        </p>
        <a
          href={feedbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block break-all text-sm font-medium text-maroon hover:underline"
        >
          {feedbackUrl}
        </a>
      </div>
      <Button asChild size="sm" className="w-full shadow-sm sm:w-auto">
        <a href={feedbackUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open feedback form
        </a>
      </Button>
      <div className="space-y-2 border-t border-border/70 pt-4">
        <Label htmlFor={`feedback-comment-${ticket._id}`}>
          Notes for admin <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={`feedback-comment-${ticket._id}`}
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Optional summary or reference from your feedback submission"
          rows={compact ? 2 : 3}
          className="rounded-lg bg-background"
        />
      </div>
      <Button size="sm" onClick={onConfirm} disabled={isPending} className="shadow-sm">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "I've submitted feedback"}
      </Button>
    </div>
  );
}
