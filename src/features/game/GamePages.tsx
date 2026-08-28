import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { gameApi } from "../../api/game.client";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/FormControls";
import { RichContent } from "../content/RichContent";
import { GameFailure, GameHeader } from "./GameContext";
import { useGame } from "./useGame";

export function GameLoginPage() {
  const [account, setAccount] = useState(""),
    [password, setPassword] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  const mutation = useMutation({
    mutationFn: () => gameApi.login(account, password),
    onSuccess: () => {
      const from = location.state?.from;
      navigate(
        typeof from === "string" && /^\/(?!\/)/.test(from) ? from : "/",
        { replace: true },
      );
    },
  });
  return (
    <main className="game-login">
      <p className="eyebrow">Questions · 冒险者入口</p>
      <h1>
        你的下一场冒险
        <br />
        正在这里等待。
      </h1>
      <p>使用工作人员为你创建的账号登录。</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label>
          登录账号
          <Input
            autoComplete="username"
            required
            value={account}
            onChange={(event) => setAccount(event.target.value)}
          />
        </label>
        <label>
          密码
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {mutation.isError && <GameFailure error={mutation.error} />}
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? "正在登录…" : "进入冒险"}
        </Button>
      </form>
      <p className="game-muted">
        暂不开放注册。忘记密码时，请联系工作人员重置。
      </p>
    </main>
  );
}
export function GameDashboard() {
  const { player } = useGame();
  const [history, setHistory] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ["game", player.id, "assignments"],
    queryFn: ({ signal }) => gameApi.assignments(signal),
    refetchInterval: 5000,
  });
  const progress = player.nextLevel
    ? ((player.totalXp - player.level.minTotalXp) /
        (player.nextLevel.minTotalXp - player.level.minTotalXp)) *
      100
    : 100;
  const items =
    query.data?.items.filter((item) =>
      history
        ? ["completed", "cancelled"].includes(item.status)
        : ["assigned", "active"].includes(item.status),
    ) || [];
  return (
    <main className="game-shell">
      <GameHeader />
      <section className="game-intro">
        <p className="eyebrow">Your journey</p>
        <h1>准备好继续探索了吗？</h1>
        <p>这里是工作人员为你安排的场次。每一次出发，都留下新的记录。</p>
        <div className="game-xp">
          <span>{player.totalXp} EXP</span>
          <span>
            {player.nextLevel
              ? `距离 ${player.nextLevel.name} 还需 ${Math.max(0, player.nextLevel.minTotalXp - player.totalXp)} 经验`
              : "已达到当前最高等级"}
          </span>
          <progress value={progress} max="100" aria-label="等级经验进度" />
        </div>
      </section>
      <div className="game-section-heading">
        <h2>{history ? "冒险记录" : "我的场次"}</h2>
        <Button onClick={() => setHistory(!history)}>
          {history ? "返回待玩场次" : "查看历史"}
        </Button>
      </div>
      {query.isPending && <p aria-busy="true">正在读取场次…</p>}
      {query.isError && (
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      )}
      {!query.isPending && !query.isError && !items.length && (
        <section className="game-empty">
          <h3>{history ? "还没有历史记录" : "暂时没有待玩场次"}</h3>
          <p>
            {history
              ? "完成冒险后，会在这里留下记录。"
              : "请联系现场工作人员安排，页面会自动更新。"}
          </p>
        </section>
      )}
      <div className="game-assignment-list">
        {items.map((item) => {
          const notStarted = item.startsAt && Date.parse(item.startsAt) > now,
            expired = item.endsAt && Date.parse(item.endsAt) <= now,
            eligible =
              player.level.order >= item.minLevel &&
              (item.maxLevel === null || player.level.order <= item.maxLevel);
          return (
            <article key={item.id} className="game-assignment">
              <div>
                <p className="eyebrow">
                  {item.status === "completed"
                    ? "已完成"
                    : item.status === "cancelled"
                      ? "已撤回"
                      : expired
                        ? "已过期"
                        : notStarted
                          ? "待开放"
                          : item.status === "active"
                            ? "进行中"
                            : "等待出发"}
                </p>
                <h3>{item.title}</h3>
                <p>
                  {item.description ||
                    `${item.totalLevels} 道谜题，等待你揭开。`}
                </p>
                <p className="game-muted">
                  等级 {item.minLevel}
                  {item.maxLevel ? `～${item.maxLevel}` : " 及以上"} · 已完成{" "}
                  {item.completedLevels}/{item.totalLevels}
                </p>
                {item.startsAt && (
                  <p className="game-muted">
                    开放：{new Date(item.startsAt).toLocaleString()}
                  </p>
                )}
                {item.endsAt && (
                  <p className="game-muted">
                    截止：{new Date(item.endsAt).toLocaleString()}
                  </p>
                )}
                {!eligible && item.status === "assigned" && (
                  <p className="game-muted">当前等级尚不符合入场要求</p>
                )}
              </div>
              <Link className="game-action-link" to={`/play/${item.id}`}>
                {item.status === "completed" ? "回顾场次" : "查看场次"} →
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
export function PasswordPage({ forced = false }: { forced?: boolean }) {
  const { setPlayer, logout } = useGame();
  const [old, setOld] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");
  const mutation = useMutation({
    mutationFn: () => gameApi.changePassword(old, password, confirmation),
    onSuccess: (player) => {
      setPlayer(player);
      setOld("");
      setPassword("");
      setConfirmation("");
    },
  });
  return (
    <section className={forced ? "game-login" : "game-profile-section"}>
      {forced && <p className="eyebrow">保护你的冒险记录</p>}
      <h2>{forced ? "首次登录，请先修改密码" : "修改密码"}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label>
          当前密码
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={old}
            onChange={(e) => setOld(e.target.value)}
          />
        </label>
        <label>
          新密码
          <Input
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={71}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          确认新密码
          <Input
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={71}
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </label>
        {mutation.isError && <GameFailure error={mutation.error} />}
        {mutation.isSuccess && !forced && <p role="status">密码已更新。</p>}
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? "正在保存…" : "保存新密码"}
        </Button>
        {forced && <Button onClick={logout}>退出登录</Button>}
      </form>
    </section>
  );
}
export function GameProfilePage() {
  const { player, avatarUrl, setPlayer } = useGame();
  const [name, setName] = useState(player.displayName);
  const fileInput = useRef<HTMLInputElement>(null);
  const mutation = useMutation({
    mutationFn: (form: FormData) => gameApi.profile(form),
    onSuccess: (value) => {
      setPlayer(value);
      if (fileInput.current) fileInput.current.value = "";
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    const form = new FormData();
    form.set("displayName", name);
    const file = fileInput.current?.files?.[0];
    if (file) form.set("avatar", file);
    mutation.mutate(form);
  }
  return (
    <main className="game-shell">
      <GameHeader />
      <h1>个人资料</h1>
      <div className="game-profile-grid">
        <section className="game-profile-section">
          <h2>冒险者名片</h2>
          {avatarUrl && (
            <img
              className="game-profile-avatar"
              src={avatarUrl}
              alt={player.displayName}
            />
          )}
          <p className="game-muted">登录账号：{player.account}（不可修改）</p>
          <form onSubmit={submit}>
            <label>
              显示昵称
              <Input
                value={name}
                maxLength={40}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              上传头像
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
            </label>
            <p className="game-muted">支持 JPG、PNG、WebP，最大 2 MB。</p>
            {mutation.isError && <GameFailure error={mutation.error} />}
            {mutation.isSuccess && <p role="status">资料已保存。</p>}
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
            >
              保存资料
            </Button>
          </form>
        </section>
        <PasswordPage />
      </div>
    </main>
  );
}
export function GameRewardsPage() {
  const { player } = useGame();
  const query = useQuery({
    queryKey: ["game", player.id, "rewards"],
    queryFn: ({ signal }) => gameApi.rewards(signal),
    refetchInterval: 5000,
  });
  return (
    <main className="game-shell">
      <GameHeader />
      <section className="game-intro">
        <p className="eyebrow">Rewards</p>
        <h1>冒险的收获</h1>
        <p>按照领取说明找到奖品，领取后请工作人员核销。</p>
      </section>
      {query.isPending && <p>正在读取奖品…</p>}
      {query.isError && (
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      )}
      <div className="game-assignment-list">
        {query.data?.items.map((item) => (
          <article className="game-assignment" key={item.id}>
            {item.snapshot.image && (
              <img
                className="game-reward-image"
                src={item.snapshot.image}
                alt={item.snapshot.name}
              />
            )}
            <div>
              <p className="eyebrow">
                {
                  {
                    available: "待领取 / 待核销",
                    redeemed: "已核销",
                    voided: "已作废",
                  }[item.status]
                }
              </p>
              <h2>
                {item.snapshot.name} × {item.quantity}
              </h2>
              <p>{item.snapshot.description}</p>
              <RichContent source={item.snapshot.publicInstructions} />
              {item.status === "available" && item.claimDetails && (
                <div className="game-claim-details">
                  <h3>本次领取信息</h3>
                  <RichContent source={item.claimDetails} />
                </div>
              )}
              {item.redeemedAt && (
                <p className="game-muted">
                  核销时间：{new Date(item.redeemedAt).toLocaleString()}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
      {query.data?.items.length === 0 && (
        <p className="game-empty">还没有获得奖品。完成场次后，再来看看吧。</p>
      )}
    </main>
  );
}
export function GameNotificationsPage() {
  const { player } = useGame(),
    client = useQueryClient();
  const query = useQuery({
    queryKey: ["game", player.id, "notifications"],
    queryFn: ({ signal }) => gameApi.notifications(signal),
    refetchInterval: 5000,
  });
  const mutation = useMutation({
    mutationFn: gameApi.readNotification,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["game", player.id, "notifications"],
      }),
  });
  return (
    <main className="game-shell">
      <GameHeader />
      <h1>工作人员的消息</h1>
      {query.isError && (
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      )}
      {mutation.isError && <GameFailure error={mutation.error} />}
      <div className="game-assignment-list">
        {query.data?.items.map((note) => (
          <article key={note.id} className="game-assignment">
            <div>
              <p className="eyebrow">
                {note.readAt ? "已读" : "新消息"} ·{" "}
                {new Date(note.sentAt).toLocaleString()}
              </p>
              <h2>{note.title}</h2>
              <RichContent source={note.content} />
            </div>
            {!note.readAt && (
              <Button
                onClick={() => mutation.mutate(note.id)}
                disabled={mutation.isPending}
              >
                {note.buttonText || "知道了"}
              </Button>
            )}
          </article>
        ))}
      </div>
      {query.data?.items.length === 0 && (
        <p className="game-empty">暂时没有消息。</p>
      )}
    </main>
  );
}
