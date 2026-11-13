/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 13/11/2026
**/

import type { ConsentConfig } from './consent.service';

// What this website tells visitors in the shared EliasDH cookie banner (served by eliasdh.com).
// Keep it in line with what the site really stores and loads.
export const CONSENT_CONFIG: ConsentConfig = {
    store: ['language', 'theme'],
    optionalKeys: ['language', 'theme'],
    stats: true,
    settingsButton: false
};
