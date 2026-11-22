import { describe, expect, it } from 'vitest';
import { detectInAppBrowser, isKnownInAppBrowser } from '../../shared/in-app-browser';
import { api } from './helpers';

// Real user agents of apps' built-in browsers (where Google refuses to sign in) and of ordinary browsers
const IN_APP: [string, string, string][] = [
    ['instagram', 'ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 357.0.0.25.101 (iPhone15,3; iOS 18_1; he_IL; he; scale=3.00; 1290x2796; 646217263)'],
    ['instagram', 'android', 'Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36 Instagram 356.0.0.41.101 Android (34/14; 480dpi; 1080x2340; samsung; SM-S918B; dm3q; qcom; iw_IL; 655426316)'],
    ['facebook', 'ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/483.0.0.53.105;FBBV/655012030;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/18.0;FBSS/3;FBID/phone;FBLC/he_IL;FBOP/5;FBRV/657426315]'],
    ['facebook', 'android', 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/482.0.0.40.109;]'],
    ['messenger', 'ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/481.0.0.33.110;FBBV/652093221;FBDV/iPhone13,2;FBMD/iPhone;FBSN/iOS;FBSV/17.6;FBSS/3]'],
    ['messenger', 'android', 'Mozilla/5.0 (Linux; Android 12; SM-A525F Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/478.0.0.43.109;]'],
    ['tiktok', 'ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_37.2.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/he Region/IL'],
    ['tiktok', 'android', 'Mozilla/5.0 (Linux; Android 14; 2312DRA50G Build/UKQ1.231003.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.86 Mobile Safari/537.36 trill_370103 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/37.1.3 ByteLocale/he'],
    ['linkedin', 'ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30.1850'],
    ['snapchat', 'ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/13.10.0.40 (like Safari/8618.2.12.10.4, panda)'],
    ['line', 'ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.3.0'],
    ['webview', 'android', 'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/127.0.6533.103 Mobile Safari/537.36'],
    ['webview', 'ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'],
];
const BROWSERS: [string, string][] = [
    ['Chrome Android', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'],
    ['Safari iOS', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'],
    ['Chrome iOS', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1'],
    ['Firefox iOS', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/132.0 Mobile/15E148'],
    ['Google app iOS', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/341.0.698361862 Mobile/15E148'],
    ['Samsung Internet', 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36'],
    ['Firefox Android', 'Mozilla/5.0 (Android 14; Mobile; rv:132.0) Gecko/132.0 Firefox/132.0'],
    ['Chrome desktop', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'],
    ['Safari Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'],
];

describe('in-app browsers', () => {
    it.each(IN_APP)('recognizes %s on %s', (app, os, ua) => {
        expect(detectInAppBrowser(ua)).toEqual({ app, os });
    });

    it.each(BROWSERS)('leaves %s alone', (_name, ua) => {
        expect(detectInAppBrowser(ua)).toBeNull();
    });

    it('sends known apps to the help on the sign-in page instead of to Google, unless asked to try anyway', async () => {
        const start = (ua: string, query = '') => api(`/api/auth/google?next=${encodeURIComponent('/billing?plan=pro')}${query}`, { headers: { 'User-Agent': ua }, redirect: 'manual' });
        // The test Worker has no Google client, so a request that gets past the check lands on the config error
        const instagram = await start(IN_APP[0][2]);
        expect(instagram.headers.get('location')).toBe(`http://localhost:3000/login?error=inapp&next=${encodeURIComponent('/billing?plan=pro')}`);
        expect((await start(IN_APP[0][2], '&force=1')).headers.get('location')).toContain('error=config');
        expect((await start(BROWSERS[1][1])).headers.get('location')).toContain('error=config');
        // The generic signs alone are not certain enough to stop someone
        expect(isKnownInAppBrowser(detectInAppBrowser(IN_APP[IN_APP.length - 1][2]))).toBe(false);
    });
});
