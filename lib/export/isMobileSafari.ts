export const isMobileSafari = () => {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent;
  const isIosDevice =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const usesWebKit = /AppleWebKit/.test(userAgent);
  const identifiesSafari = /Safari/.test(userAgent);
  const isAlternateIosBrowser =
    /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(userAgent);

  return (
    isIosDevice &&
    usesWebKit &&
    identifiesSafari &&
    !isAlternateIosBrowser
  );
};
