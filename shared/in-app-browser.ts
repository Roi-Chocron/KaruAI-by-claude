// Browsers built into other apps (Instagram, Facebook, TikTok...), where Google refuses to sign anyone in
// ("Error 403: disallowed_useragent"). Shared by the sign-in page, which offers a way out to the real browser, and
// the API, which sends such visitors there instead of to Google's error page.

export type InAppBrowser = {
    // The app, or 'webview' when only the generic signs of an embedded browser are there
    app: 'instagram' | 'facebook' | 'messenger' | 'tiktok' | 'linkedin' | 'snapchat' | 'line' | 'webview';
    os: 'ios' | 'android' | 'other';
};

const APPS: [InAppBrowser['app'], RegExp][] = [
    ['instagram', /Instagram/i],
    ['messenger', /FBAN\/Messenger|FB_IAB\/MESSENGER|MessengerForiOS|Orca-Android/i],
    ['facebook', /FBAN|FBAV|FB_IAB|FBIOS|FB4A/],
    ['tiktok', /musical_ly|Bytedance|BytedanceWebview|TikTok/i],
    ['linkedin', /LinkedInApp/i],
    ['snapchat', /Snapchat/i],
    ['line', /\bLine\//],
];

export function detectInAppBrowser(userAgent: string | null | undefined): InAppBrowser | null {
    const ua = userAgent ?? '';
    const os: InAppBrowser['os'] = /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : 'other';
    for (const [app, pattern] of APPS) if (pattern.test(ua)) return { app, os };
    // A generic Android WebView ("; wv)"), or iOS WebKit with no Safari token that isn't Chrome, Firefox or Edge for iOS.
    // Safari View Controllers, Chrome Custom Tabs and the Google app send ordinary browser user agents and pass.
    if (os === 'android' && /; wv\)/.test(ua)) return { app: 'webview', os };
    if (os === 'ios' && /AppleWebKit/.test(ua) && !/Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|GSA\//.test(ua)) return { app: 'webview', os };
    return null;
}

// Only a named app is certain enough to keep someone away from Google; the generic signs could be a browser we don't know
export const isKnownInAppBrowser = (browser: InAppBrowser | null) => !!browser && browser.app !== 'webview';
