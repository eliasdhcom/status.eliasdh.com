/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { Title, Meta } from '@angular/platform-browser';
import { ApplicationConfig } from "@angular/core";
import { HttpClient, provideHttpClient, withFetch } from "@angular/common/http";
import { MissingTranslationHandler, TranslateLoader, provideTranslateService } from "@ngx-translate/core";
import { DefaultValueMissingTranslationHandler, HttpLoaderFactory } from "../translate-loader";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
        provideHttpClient(withFetch()),
        provideTranslateService({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            },
            missingTranslationHandler: {
                provide: MissingTranslationHandler,
                useClass: DefaultValueMissingTranslationHandler
            }
        }),
        Title,
        Meta
    ]
};