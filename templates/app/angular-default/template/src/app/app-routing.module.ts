import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { TitaniumRouterModule } from 'titanium-angular';

import { HomeComponent } from './home.component';
import { IntroGuard } from './intro-guard.service';
import { IntroComponent } from './intro.component';

const appRoutes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent, canActivate: [IntroGuard] },
    { path: 'intro', component: IntroComponent }
];

@NgModule({
    imports: [TitaniumRouterModule.forRoot(appRoutes, { enableTracing: false })],
    exports: [TitaniumRouterModule],
    providers: [IntroGuard]
})
export class AppRoutingModule {
}