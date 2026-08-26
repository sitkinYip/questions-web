const knownDeploymentBases = ["/questions-next", "/questions"] as const;

function normalizeBase(base: string): string {
  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

function pathnameUsesBase(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function resolveAppBasename(
  configuredBase: string,
  pathname: string,
): string {
  const normalizedConfiguredBase = normalizeBase(configuredBase);
  if (
    normalizedConfiguredBase !== "/" &&
    pathnameUsesBase(pathname, normalizedConfiguredBase)
  )
    return normalizedConfiguredBase;

  const detectedBase = knownDeploymentBases.find((base) =>
    pathnameUsesBase(pathname, base),
  );
  return detectedBase ?? normalizedConfiguredBase;
}

export function withAppBasename(href: string, basename: string): string {
  const normalizedBase = normalizeBase(basename);
  if (
    normalizedBase === "/" ||
    href === normalizedBase ||
    href.startsWith(`${normalizedBase}/`)
  )
    return href;
  return `${normalizedBase}${href.startsWith("/") ? href : `/${href}`}`;
}
