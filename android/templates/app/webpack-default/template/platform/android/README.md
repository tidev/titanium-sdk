# Android Platform Folder

This folder contains various files used für the native Android build.

## Launch Icons

The `res/drawable*` folders contain various files named `ic_launcher*` which are used as the launch icon of your app. They cover all screen densities and different icon formats like rounded and [adaptive icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive).

To replace these with your own icon we recommend generating all required files using the [Image Asset Studio](https://developer.android.com/studio/write/image-asset-studio) that comes with Android Studio or via the [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/index.html) website.

> 💡 **NOTE**
>
> The above tools generate launch icons into `mipmap*` sub-folders. This folder layout is not supported by Titanium and you need to put them in the corresponding `drawable` folders. For example, `mipmap-hdpi/ic_launcher.png` needs to moved to `drawable-hdpi/ic_launcher.png`.
