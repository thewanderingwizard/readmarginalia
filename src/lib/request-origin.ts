type RequestHeaders = Pick<Headers, "get">;

const LOCAL_ORIGIN = "http://localhost:3000";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function validOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function resolveRequestOrigin(
  requestHeaders: RequestHeaders,
  configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL,
) {
  const declaredOrigin = validOrigin(firstHeaderValue(requestHeaders.get("origin")));
  if (declaredOrigin) return declaredOrigin;

  const host = firstHeaderValue(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );
  if (host) {
    const forwardedProtocol = firstHeaderValue(requestHeaders.get("x-forwarded-proto"));
    const protocol =
      forwardedProtocol === "http" || forwardedProtocol === "https"
        ? forwardedProtocol
        : host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https";
    const requestOrigin = validOrigin(`${protocol}://${host}`);
    if (requestOrigin) return requestOrigin;
  }

  return validOrigin(configuredOrigin) ?? LOCAL_ORIGIN;
}
