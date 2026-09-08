import type { Notification } from "@/domain/notification/types";
import type { NotificationRecord } from "@/api/notification.schema";

export function adaptNotificationRecord(
  record: NotificationRecord,
): Notification {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    ...(record.popupTitle?.trim()
      ? { popupTitle: record.popupTitle.trim() }
      : {}),
    ...(record.buttonText?.trim()
      ? { buttonText: record.buttonText.trim() }
      : {}),
    ...(record.user?.trim() ? { userId: record.user.trim() } : {}),
    createdAt: record.created,
    revision: record.updated,
  };
}
