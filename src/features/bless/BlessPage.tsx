import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchBlessings } from "../../api/client";
import { getApiErrorPresentation } from "../../api/errors";
import { BlessExperience } from "./BlessExperience";
import { resolveBlessReturnTo } from "./navigation";

export function BlessPage() {
  const location = useLocation();
  const from = new URLSearchParams(location.search).get("from") ?? "";
  const blessingsQuery = useQuery({
    queryKey: ["blessings"],
    queryFn: ({ signal }) => fetchBlessings(signal),
    enabled: Boolean(from),
  });
  const returnTo = resolveBlessReturnTo(
    location.search,
    window.history.state?.back,
  );

  if (!from)
    return <BlessState title="星空沉寂" detail="缺少星空凭证 from 参数。" />;
  if (blessingsQuery.isPending)
    return <BlessState loading title="正在汇聚星光…" detail="" />;
  if (blessingsQuery.isError) {
    const presentation = getApiErrorPresentation(blessingsQuery.error);
    return (
      <BlessState
        title={presentation.title}
        detail={presentation.detail}
        onRetry={
          presentation.retryable
            ? () => void blessingsQuery.refetch()
            : undefined
        }
      />
    );
  }
  const blessing = blessingsQuery.data.find((item) => item.from === from);
  if (!blessing)
    return (
      <BlessState
        title="星空沉寂"
        detail="这片星域尚未被点亮，请检查星空凭证 from 是否正确。"
      />
    );
  return <BlessExperience blessing={blessing} returnTo={returnTo} />;
}

function BlessState({
  title,
  detail,
  loading = false,
  onRetry,
}: {
  title: string;
  detail: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <main className="bless-page bless-state" aria-busy={loading}>
      <div
        className={loading ? "bless-loader" : "bless-void-star"}
        aria-hidden="true"
      >
        {loading ? "" : "✦"}
      </div>
      <h1>{title}</h1>
      {detail && <p>{detail}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry}>
          重新尝试
        </button>
      )}
    </main>
  );
}
