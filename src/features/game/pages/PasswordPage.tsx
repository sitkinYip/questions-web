import { AuthLayout } from "../components/AuthLayout";
import { PasswordEditor } from "../components/PasswordEditor";
import { usePasswordEditor } from "../hooks/usePasswordEditor";

export function PasswordPage({ forced = false }: { forced?: boolean }) {
  const editor = usePasswordEditor();
  const content = <PasswordEditor editor={editor} forced={forced} />;
  return forced ? <AuthLayout>{content}</AuthLayout> : content;
}
