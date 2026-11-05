/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 25/09/2026
**/

import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({ name: 'localize', standalone: true, pure: false })
export class LocalizePipe implements PipeTransform {
    private readonly language = inject(LanguageService);

    transform(path: string): string {
        return this.language.localize(path);
    }
}