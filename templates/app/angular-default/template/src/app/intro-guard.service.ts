import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    RouterStateSnapshot
} from '@angular/router';
import { TitaniumRouter } from 'titanium-angular';

@Injectable()
export class IntroGuard implements CanActivate {
  get introShown(): boolean {
    return Ti.App.Properties.getBool('introShown');
  }

  set introShown(value: boolean) {
    Ti.App.Properties.setBool('introShown', value);
  }

  constructor(private router: TitaniumRouter) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.introShown) {
      return true;
    }

    this.introShown = true;
    this.router.navigate(['/intro']);

    return false;
  }
}