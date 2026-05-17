/**
 * Dynamic Favicon — updates browser tab icon and PWA icon to match store logo
 */

export function updateFavicon(logoDataUrl?: string) {
  const link = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
  if (!link) return;

  if (logoDataUrl) {
    link.href = logoDataUrl;
  } else {
    link.href = '/icons/icon-192.svg';
  }

  // Also update apple-touch-icon
  const appleLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
  if (appleLink) {
    appleLink.href = logoDataUrl || '/icons/icon-192.svg';
  }
}

/**
 * Update document title to match store name
 */
export function updatePageTitle(storeName: string) {
  document.title = `${storeName} POS`;
}
