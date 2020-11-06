import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { TitaniumModule } from 'titanium-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home.component';
import { IntroComponent } from './intro.component';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    IntroComponent,
    HomeComponent
  ],
  imports: [
    TitaniumModule,
    AppRoutingModule
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {

}
