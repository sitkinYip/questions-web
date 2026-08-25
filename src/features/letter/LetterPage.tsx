import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchLetters } from "../../api/client";
import { LetterExperience } from "./LetterExperience";
import { resolveLetterReturnTo } from "./navigation";
import { ApiErrorState } from "../errors/ApiErrorState";

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
    return <LetterLostState detail="缺少来信凭证 from 参数。" />;
  }
  if (lettersQuery.isPending) {
    return (
      <main className="letter-state" aria-busy="true">
        <p className="eyebrow">Letter archive</p>
        <h1>正在准备信件</h1>
        <p>信纸、图像与声音正在抵达……</p>
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
  if (!letter)
    return <LetterLostState detail="请检查来信凭证 from 是否正确。" />;
  return <LetterExperience letter={letter} returnTo={returnTo} />;
}

function LetterLostState({ detail }: { detail: string }) {
  return (
    <main className="letter-state letter-lost">
      <div className="letter-lost-mark" aria-hidden="true">
        ⌁
      </div>
      <p className="eyebrow">Letter not found</p>
      <h1>信件已遗失</h1>
      <p>{detail}</p>
    </main>
  );
}
