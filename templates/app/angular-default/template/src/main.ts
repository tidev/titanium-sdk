import './polyfills';
import { platformTitaniumDynamic } from 'titanium-angular';
import { AppModule } from './app/app.module';

platformTitaniumDynamic()
  .bootstrapModule(AppModule);
