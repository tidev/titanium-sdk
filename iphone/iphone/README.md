# Building and Debugging the Tiatnium iOS Source
> ###### Tested with Titanium SDK 6.x 

## Titanium Core

In order to build and debug the Titanium iOS project, the following steps should be
done before the initial run:
1. Make sure that the titanium_prep library is downloaded. To do so, run the following in `titanium_mobile/build`: 
```bash
npm install
node scons.js cleanbuild ios
```
2. Change the `titanium_mobile/iphone/Resources/app.js` to the contents you want to test. Additionally, 
you can place all other resources in this directory as well, the will be copied over to the .app using 
the Xcode Script Build Phase.
3. Open the `titanium_mobile/iphone/iphone/Titanium.xcodeproj` in Xcode and press CMD+R to run the app.
4. That's it! You can now set breakpoints and analyse the Kroll-Core / Core Modules in Xcode

## Native Modules

In order to debug native modules, do the following:
1. Ensure you can build and run the Titanium Xcode-project as described above
2. Navigate to your native iOS module project, e.g. `ti.facebook/ios/FacebookIOS.xcodeproj` and drag it
into Xcode, so it is linked to the Titanium project
<img src="https://abload.de/img/bildschirmfoto2017-05zsuvd.png" height="336" />
3. Select your `Titanium` target in Xcode again, navigate to *Build Phases* > *Target Dependencies*
and click *+* to add the `FacebookIOS` target dependency. This will ensure that anytime you build the 
Titanium source, the Facebook Module source is built as well.
<img src="https://abload.de/img/bildschirmfoto2017-05q0kr7.png" height="400" />
4. That's it! You can now set breakpoints in your native module, `require` the module in the `app.js`
and change the module source without recompiling it everytime you change it.
