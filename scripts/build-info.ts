export interface BuildInfo {
  version: string;
  channel: string;
  commit: string;
  builtAt: string;
}

export function createBuildInfo(
  mode: string,
  env: Record<string, string | undefined>,
  commit: string,
  builtAt = new Date().toISOString(),
): BuildInfo {
  const release = env.QUESTIONS_RELEASE_NUMBER;
  const attempt = env.QUESTIONS_RELEASE_ATTEMPT;
  if (
    release &&
    (!/^[1-9]\d*$/.test(release) || !/^[1-9]\d*$/.test(attempt ?? ""))
  ) {
    throw new Error("Release number and attempt must be positive integers");
  }
  return {
    version: release ? `1.${release}.${attempt}` : "0.0.0-local",
    channel: release ? mode : "local",
    commit,
    builtAt,
  };
}
