import './polyfills';
import { enableProdMode } from '@angular/core';
import { platformTitaniumDynamic } from 'titanium-angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformTitaniumDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
