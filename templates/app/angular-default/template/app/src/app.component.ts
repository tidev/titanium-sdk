import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AlertDialog, DeviceEnvironment } from 'titanium-angular';

@Component({
	selector: "ti-app",
	templateUrl: "./app.component.html"
})
export class AppComponent implements AfterViewInit, OnInit {

	@ViewChild('window') windowElement: ElementRef;

	@ViewChild('gradient') gradientElement: ElementRef;

	@ViewChild('imageView') imageViewElement: ElementRef;

	@ViewChild('demoButton') buttonElement: ElementRef;

	skyGradient: Gradient;

	cardTitle = 'Titanium Angular';

	cardText = 'Welcome to the Titanium Angular Preview!\n\nThis is a very simple app for the purpose of showing you the basics of Titanium and Angular.';

	tapCount = 0;

	constructor(private device: DeviceEnvironment) {

	}

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
		gradientView.transform = Titanium.UI.create2DMatrix({rotate: 8});

		const window = <Titanium.UI.Window>this.windowElement.nativeElement.titaniumView;
		if (this.device.runs('android')) {
			window.activity.onStart = () => {
				window.activity.actionBar.hide();
			}

			// Note: This is a bug of the preview version and should not be necessary
			const imageView = <Titanium.UI.ImageView>this.imageViewElement.nativeElement.titaniumView;
			const angularImageFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'images/angular.png');
			imageView.image = angularImageFile;
		}

		window.open();
	}

	increaseTapCount() {
		if (this.tapCount >= 13) {
			const alertDialog = new AlertDialog({
				title: 'Phew, you tapped this button a lot!',
				message: 'It\'s time to start over!'
			});
			alertDialog.show().then(() => {
				this.tapCount = 0;
				this.updateButtonText();
			});
		} else {
			this.tapCount++;
			this.updateButtonText();
		}
	}

	updateButtonText() {
		this.buttonElement.nativeElement.titaniumView.title = `Taps: ${this.tapCount}`;
	}

}
