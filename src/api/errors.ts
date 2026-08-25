export type ApiErrorKind =
  "http" | "timeout" | "network" | "contract" | "cancelled" | "unknown";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options?: ErrorOptions & { status?: number },
  ) {
    super(message, options);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options?.status;
  }
}

export interface ApiErrorPresentation {
  eyebrow: string;
  title: string;
  detail: string;
  retryable: boolean;
}

export function getApiErrorPresentation(error: unknown): ApiErrorPresentation {
  if (!(error instanceof ApiError)) {
    return {
      eyebrow: "Unexpected failure",
      title: "发生了未预期的错误",
      detail: error instanceof Error ? error.message : "请稍后重新尝试。",
      retryable: true,
    };
  }
  if (error.kind === "timeout")
    return {
      eyebrow: "Request timed out",
      title: "连接等待超时",
      detail: "PocketBase 在限定时间内没有响应，请检查网络后重试。",
      retryable: true,
    };
  if (error.kind === "network")
    return {
      eyebrow: "Network unavailable",
      title: "网络连接中断",
      detail: "浏览器无法连接到数据服务，请检查网络或域名访问策略。",
      retryable: true,
    };
  if (error.kind === "contract")
    return {
      eyebrow: "Data contract changed",
      title: "数据格式发生变化",
      detail: `${error.message}。请联系维护者检查 PocketBase 字段配置。`,
      retryable: false,
    };
  if (error.kind === "http") {
    const permissionDenied = error.status === 401 || error.status === 403;
    return {
      eyebrow: `Service response ${error.status ?? "error"}`,
      title: permissionDenied ? "数据服务拒绝访问" : "数据服务暂时不可用",
      detail: permissionDenied
        ? "当前域名或访问规则没有获得 PocketBase 授权。"
        : `${error.message}${error.status ? `（HTTP ${error.status}）` : ""}`,
      retryable: !permissionDenied,
    };
  }
  if (error.kind === "cancelled")
    return {
      eyebrow: "Request cancelled",
      title: "请求已取消",
      detail: "页面导航取消了本次读取。",
      retryable: true,
    };
  return {
    eyebrow: "Unexpected failure",
    title: "发生了未预期的错误",
    detail: error.message,
    retryable: true,
  };
}
