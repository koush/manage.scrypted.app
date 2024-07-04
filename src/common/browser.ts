export const isChrome = navigator.userAgent.includes("Chrome");
export const isSafari = !isChrome && navigator.userAgent.includes("Safari");
export const isAppleMobile = navigator.userAgent.includes('iPod') || navigator.userAgent.includes('iPad') || navigator.userAgent.includes('iPhone');
export const isInstalledApp = navigator.userAgent.includes('InstalledApp');
export const supportsOOBLogin = navigator.userAgent.includes('OOBLogin');
export const isWindows = navigator.userAgent.includes('Windows');
