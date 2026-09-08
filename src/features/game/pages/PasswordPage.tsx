import { AuthLayout } from "@/features/game/components/AuthLayout";
import { PasswordEditor } from "@/features/game/components/PasswordEditor";
import { usePasswordEditor } from "@/features/game/hooks/usePasswordEditor";

export function PasswordPage({ forced = false }: { forced?: boolean }) {
  const editor = usePasswordEditor();
  const content = <PasswordEditor editor={editor} forced={forced} />;
  return forced ? <AuthLayout>{content}</AuthLayout> : content;
}
