import { uiCopy } from "@/config/ui-copy";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchLetters } from "@/api/client";
import { LetterExperience } from "@/features/letter/LetterExperience";
import { resolveLetterReturnTo } from "@/features/letter/navigation";
import { ApiErrorState } from "@/features/errors/ApiErrorState";

export function LetterPage() {
  const location = useLocation();
  const from = new URLSearchParams(location.search).get("from") ?? "";
  const lettersQuery = useQuery({
    queryKey: ["letters"],
    queryFn: ({ signal }) => fetchLetters(signal),
    enabled: Boolean(from),
  });
  const returnTo = resolveLetterReturnTo(
    location.search,
    window.history.state?.back,
  );

  if (!from) {
    return <LetterLostState detail={uiCopy.letterPage.missingToken} />;
  }
  if (lettersQuery.isPending) {
    return (
      <main className="letter-state" aria-busy="true">
        <p className="eyebrow">{uiCopy.letterPage.eyebrow}</p>
        <h1>{uiCopy.letterPage.loadingTitle}</h1>
        <p>{uiCopy.letterPage.loadingDescription}</p>
      </main>
    );
  }
  if (lettersQuery.isError) {
    return (
      <ApiErrorState
        variant="letter"
        error={lettersQuery.error}
        onRetry={() => void lettersQuery.refetch()}
      />
    );
  }

  const letter = lettersQuery.data.find((item) => item.from === from);
  if (!letter) return <LetterLostState detail={uiCopy.letterPage.notFound} />;
  return <LetterExperience letter={letter} returnTo={returnTo} />;
}

function LetterLostState({ detail }: { detail: string }) {
  return (
    <main className="letter-state letter-lost">
      <div className="letter-lost-mark" aria-hidden="true">
        ⌁
      </div>
      <p className="eyebrow">{uiCopy.letterPage.notFoundEyebrow}</p>
      <h1>{uiCopy.letterPage.notFoundTitle}</h1>
      <p>{detail}</p>
    </main>
  );
}
