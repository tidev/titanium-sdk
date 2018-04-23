import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { TitaniumModule } from 'titanium-angular';
import { AppComponent } from './app.component';

@NgModule({
	declarations: [AppComponent],
	bootstrap: [AppComponent],
	imports: [TitaniumModule],
	schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {

}
