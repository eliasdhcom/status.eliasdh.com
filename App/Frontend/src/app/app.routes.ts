/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { StatusComponent } from './status/status.component';
import { LanguageService } from './services/language.service';
import { DEFAULT_LANGUAGE, Language, PREFIXED_LANGUAGES } from './seo/site.config';

const NO_INDEX = 'noindex, nofollow';

const languageResolver: ResolveFn<Language> = (route) => inject(LanguageService).use(route.data['lang']);

function pageRoutes(): Routes {
    return [
        { path: '', component: StatusComponent, data: { title: 'EliasDH - Status', seo: 'STATUS' } },
        { path: '**', loadComponent: () => import('./notfound/notfound.component').then(m => m.NotFoundComponent), data: { title: 'EliasDH - Not Found', seo: 'NOTFOUND', robots: NO_INDEX } }
    ];
}

export const routes: Routes = [
    ...PREFIXED_LANGUAGES.map(lang => ({
        path: lang,
        data: { lang },
        resolve: { lang: languageResolver },
        children: pageRoutes()
    })),
    {
        path: '',
        data: { lang: DEFAULT_LANGUAGE },
        resolve: { lang: languageResolver },
        children: pageRoutes()
    }
];