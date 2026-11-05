/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { NgModule } from '@angular/core';
import { ContextMenuComponent } from './contextmenu/contextmenu.component';
import { FooterComponent } from './footer/footer.component';
import { ContactBarComponent } from './contact-bar/contact-bar.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { ErrorBoxComponent } from './error-box/error-box.component';

@NgModule({
    imports: [
        ContextMenuComponent,
        FooterComponent,
        ContactBarComponent,
        PageHeaderComponent,
        LoadingSpinnerComponent,
        ErrorBoxComponent
    ],
    exports: [
        ContextMenuComponent,
        FooterComponent,
        ContactBarComponent,
        PageHeaderComponent,
        LoadingSpinnerComponent,
        ErrorBoxComponent
    ]
})

export class SharedModule {}