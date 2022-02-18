import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { DeviceEnvironment } from 'titanium-angular';

@Component({
  templateUrl: 'intro.component.html'
})
export class IntroComponent implements AfterViewInit, OnInit {
  @ViewChild('window') windowElement: ElementRef;

  @ViewChild('gradient') gradientElement: ElementRef;

  skyGradient: Gradient;

  cardTitle = 'Titanium Angular';

  cardText = 'Welcome to the Titanium Angular Preview!\n\n' +
    'This is a very simple app demonstrating a few basics of Titanium and Angular.';

  tapCount = 0;

  btnText = 'Tap Me!';

  constructor(private device: DeviceEnvironment) {}

  ngOnInit() {
    this.skyGradient = {
      type: 'linear',
      startPoint: { x: '0%', y: '50%' },
      endPoint: { x: '100%', y: '50%' },
      colors: [
        { color: '#0d47a1', offset: 0.0 },
        { color: '#42a5f5', offset: 1.0 }
      ]
    };
  }

  ngAfterViewInit() {
    const gradientView: Titanium.UI.View = this.gradientElement.nativeElement.titaniumView;
    gradientView.transform = Titanium.UI.createMatrix2D({rotate: 8});

    const window = <Titanium.UI.Window>this.windowElement.nativeElement.titaniumView;
    if (this.device.runs('android')) {
      window.activity.onStart = () => {
        window.activity.actionBar.hide();
      }
    }

    window.open();
  }
}