/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { HttpClient } from "@angular/common/http";
import { MissingTranslationHandler, MissingTranslationHandlerParams } from "@ngx-translate/core";

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export class DefaultValueMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams): string {
        const fallback = (params.interpolateParams as Record<string, unknown> | undefined)?.['default'];
        return typeof fallback === 'string' ? fallback : params.key;
    }
}