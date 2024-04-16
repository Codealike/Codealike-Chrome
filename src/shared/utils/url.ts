export const getHostNameFromUrl = (url: string) => {
  const { hostname } = new URL(url);

  return hostname || url;
};

export const isInvalidUrl = (url: string | undefined): url is undefined => {
  return (
    !url ||
    ['chrome', 'about', 'opera', 'edge', 'coccoc', 'yabro'].some((broName) =>
      url.startsWith(broName),
    )
  );
};

export const isDomainAllowedByUser = (
  currentHost: string | undefined,
  allowedHosts: string[] | undefined,
  ignoreHosts: string[] | undefined,
) => {
  if (!currentHost) {
    return false;
  }

  let isAllowed = true;
  if (allowedHosts && allowedHosts?.length > 0) {
    isAllowed = allowedHosts.includes(currentHost);
  }
  
  let isBlocked = false;
  if (ignoreHosts && ignoreHosts?.length > 0) {
    isBlocked = ignoreHosts.includes(currentHost);
  }
  return isAllowed && !isBlocked;
};
