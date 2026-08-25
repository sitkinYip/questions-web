import { adaptNotificationRecord } from "../src/api/notification.adapter.ts";
import { notificationsResponseSchema } from "../src/api/notification.schema.ts";
import { parseLegacyContent } from "../src/domain/content/parser.ts";

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) input += chunk;

const result = notificationsResponseSchema.safeParse(JSON.parse(input));
if (!result.success) {
  console.error(result.error.issues);
  throw new Error(
    "PocketBase notifications response does not match the local Zod contract",
  );
}

const notifications = result.data.items.map(adaptNotificationRecord);
const segmentTypes = [
  ...new Set(
    notifications.flatMap((notification) =>
      parseLegacyContent(notification.content).map((segment) => segment.type),
    ),
  ),
].sort();

console.log(
  JSON.stringify(
    {
      parsedItems: notifications.length,
      enabled: result.data.items.filter((item) => item.enabled).length,
      targeted: notifications.filter((item) => item.userId).length,
      users: [...new Set(notifications.flatMap((item) => item.userId ?? []))],
      segmentTypes,
    },
    null,
    2,
  ),
);
