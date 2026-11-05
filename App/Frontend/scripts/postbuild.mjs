/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://status.eliasdh.com';
const DEFAULT_LANGUAGE = 'nl';
const LANGUAGES = ['nl', 'fr', 'en', 'de', 'es'];
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const index = join(dist, 'index.html');

if (!existsSync(index)) {
    console.error(`postbuild: ${index} not found, run "ng build" first.`);
    process.exit(1);
}

copyFileSync(index, join(dist, '404.html'));

for (const lang of LANGUAGES.filter(l => l !== DEFAULT_LANGUAGE)) {
    mkdirSync(join(dist, lang), { recursive: true });
    copyFileSync(index, join(dist, lang, 'index.html'));
}

const pageUrl = lang => (lang === DEFAULT_LANGUAGE ? `${SITE_URL}/` : `${SITE_URL}/${lang}`);
const alternates = [
    ...LANGUAGES.map(l => `        <xhtml:link rel="alternate" hreflang="${l}" href="${pageUrl(l)}"/>`),
    `        <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(DEFAULT_LANGUAGE)}"/>`
].join('\n');

writeFileSync(join(dist, 'sitemap.xml'), [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...LANGUAGES.map(l => `    <url>\n        <loc>${pageUrl(l)}</loc>\n${alternates}\n    </url>`),
    '</urlset>',
    ''
].join('\n'));

writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`postbuild: wrote 404.html, ${LANGUAGES.length - 1} language pages, sitemap.xml and robots.txt`);