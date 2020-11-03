import { Component } from '@angular/core';
import { AlertDialog, WithTiGlobal } from 'titanium-angular';

@Component({
  templateUrl: 'home.component.html'
})
export class HomeComponent extends WithTiGlobal() {
  tapCount = 0;

  increaseTaps() {
    if (this.tapCount >= 5) {
      const alertDialog = new AlertDialog({
        title: 'Phew, you tapped this button a lot!',
        message: 'It\'s time to start over!'
      });
      alertDialog.show().then(() => {
        this.tapCount = 0;
      });
    } else {
      this.tapCount++;
    }
  }
}
