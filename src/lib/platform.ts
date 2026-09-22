/** True when running on macOS, used to pick "mod" key semantics and display glyphs. */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platform = uaData?.platform ?? navigator.platform ?? navigator.userAgent ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}
