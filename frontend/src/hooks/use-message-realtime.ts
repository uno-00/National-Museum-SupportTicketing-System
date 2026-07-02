import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import type { ConversationMessageRecord, ConversationRecord, MentionRecord, PokeRecord } from "@/lib/api/types";
import { messageRoleLabel } from "@/lib/messages";
import {
  getMessageSocket,
  onRealtimeConversationUpdate,
  onRealtimeMessage,
  onRealtimeMention,
  onRealtimePoke,
  type RealtimeConversationEvent,
  type RealtimeMessageEvent,
} from "@/lib/message-socket";
import { isViewingConversation } from "@/lib/active-conversation";
import { addMessageNotification } from "@/lib/message-notifications";
import { playMessageSound } from "@/lib/notification-sound";
import { addPokeNotification } from "@/lib/poke-notifications";
import {
  ADMIN_MESSAGES,
  CLIENT_MESSAGES,
  RECORDS_MESSAGES,
  isAdminRole,
  isClientRole,
  isRecordsRole,
} from "@/lib/navigation";
import type { PortalSlot } from "@/lib/sessions";
import { useAuth } from "@/lib/auth";

function messagesPathForSlot(slot: PortalSlot) {
  if (slot === "admin") return ADMIN_MESSAGES;
  if (slot === "records") return RECORDS_MESSAGES;
  return CLIENT_MESSAGES;
}

function appendMessage(
  items: ConversationMessageRecord[] | undefined,
  message: ConversationMessageRecord,
) {
  if (!items) return [message];
  if (items.some((m) => m._id === message._id)) return items;
  return [...items, message];
}

function patchConversations(
  items: ConversationRecord[] | undefined,
  update: RealtimeConversationEvent,
) {
  if (!items) return items;
  return items
    .map((conv) =>
      conv._id === update.conversationId
        ? {
            ...conv,
            lastMessageAt: update.lastMessageAt,
            lastMessagePreview: update.lastMessagePreview,
            lastSenderName: update.lastSenderName,
          }
        : conv,
    )
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

export function useMessageRealtime(slot: PortalSlot) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const roleOk =
      (slot === "admin" && isAdminRole(user.role)) ||
      (slot === "records" && isRecordsRole(user.role)) ||
      (slot === "client" && isClientRole(user.role));
    if (!roleOk) return;

    getMessageSocket(slot);

    const unsubMessage = onRealtimeMessage(slot, (event: RealtimeMessageEvent) => {
      qc.setQueryData(
        ["conversation-messages", event.conversationId, slot],
        (old: { items: ConversationMessageRecord[] } | undefined) => ({
          items: appendMessage(old?.items, event.message),
        }),
      );
      qc.setQueryData(
        ["conversations", slot],
        (old: { items: ConversationRecord[] } | undefined) =>
          old ? { items: old.items } : old,
      );

      if (
        event.message.senderId === user.id ||
        event.message.isSystem ||
        isViewingConversation(slot, event.conversationId)
      ) {
        return;
      }

      const conversationTitle = qc
        .getQueryData<{ items: ConversationRecord[] }>(["conversations", slot])
        ?.items?.find((conv) => conv._id === event.conversationId)?.title;

      const isMentioned = event.message.mentions?.some((mention) => mention.userId === user.id);

      playMessageSound();
      addMessageNotification(slot, {
        conversationId: event.conversationId,
        message: event.message,
        conversationTitle,
      });

      if (!isMentioned) {
        const preview =
          event.message.body.length > 100
            ? `${event.message.body.slice(0, 97)}…`
            : event.message.body;
        toast(event.message.senderName, {
          description: preview,
          action: {
            label: "Open chat",
            onClick: () =>
              navigate({
                to: messagesPathForSlot(slot),
                search: { conversation: event.conversationId },
              }),
          },
        });
      }
    });

    const unsubConv = onRealtimeConversationUpdate(slot, (update) => {
      qc.setQueryData(
        ["conversations", slot],
        (old: { items: ConversationRecord[] } | undefined) =>
          old ? { items: patchConversations(old.items, update) ?? old.items } : old,
      );
    });

    const unsubPoke = onRealtimePoke(slot, (poke: PokeRecord) => {
      addPokeNotification(slot, poke);
      toast(`${poke.fromUserName} poked you!`, {
        description: `${messageRoleLabel(poke.fromUserRole)} is waiting for your attention.`,
        action: poke.conversationId
          ? {
              label: "Open chat",
              onClick: () => navigate({ to: messagesPathForSlot(slot) }),
            }
          : undefined,
      });
    });

    const unsubMention = onRealtimeMention(slot, (mention: MentionRecord) => {
      if (isViewingConversation(slot, mention.conversationId)) return;
      toast(`${mention.fromUserName} mentioned you`, {
        description: mention.preview,
        action: {
          label: "Open chat",
          onClick: () =>
            navigate({
              to: messagesPathForSlot(slot),
              search: { conversation: mention.conversationId },
            }),
        },
      });
    });

    return () => {
      unsubMessage();
      unsubConv();
      unsubPoke();
      unsubMention();
    };
  }, [user, slot, qc, navigate]);
}
