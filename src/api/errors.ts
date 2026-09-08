import { uiCopy } from "@/config/ui-copy";
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
      eyebrow: uiCopy.errors.unexpectedEyebrow,
      title: uiCopy.errors.unexpectedTitle,
      detail: error instanceof Error ? error.message : uiCopy.errors.retryHint,
      retryable: true,
    };
  }
  if (error.kind === "timeout")
    return {
      eyebrow: uiCopy.errors.timeoutEyebrow,
      title: uiCopy.errors.timeoutTitle,
      detail: uiCopy.errors.timeoutDetail,
      retryable: true,
    };
  if (error.kind === "network")
    return {
      eyebrow: uiCopy.errors.networkEyebrow,
      title: uiCopy.errors.networkTitle,
      detail: uiCopy.errors.networkDetail,
      retryable: true,
    };
  if (error.kind === "contract")
    return {
      eyebrow: uiCopy.errors.contractEyebrow,
      title: uiCopy.errors.contractTitle,
      detail: uiCopy.errors.contractDetail(error.message),
      retryable: false,
    };
  if (error.kind === "http") {
    const permissionDenied = error.status === 401 || error.status === 403;
    return {
      eyebrow: uiCopy.errors.serviceEyebrow(error.status),
      title: permissionDenied
        ? uiCopy.errors.deniedTitle
        : uiCopy.errors.unavailableTitle,
      detail: permissionDenied
        ? uiCopy.errors.deniedDetail
        : uiCopy.errors.serviceDetail(error.message, error.status),
      retryable: !permissionDenied,
    };
  }
  if (error.kind === "cancelled")
    return {
      eyebrow: uiCopy.errors.cancelledEyebrow,
      title: uiCopy.errors.cancelledTitle,
      detail: uiCopy.errors.cancelledDetail,
      retryable: true,
    };
  return {
    eyebrow: uiCopy.errors.unexpectedEyebrow,
    title: uiCopy.errors.unexpectedTitle,
    detail: error.message,
    retryable: true,
  };
}
