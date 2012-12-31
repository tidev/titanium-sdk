//
//  NSURL+DTPrefLinks.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 11/28/11.
//  Copyright (c) 2011 Cocoanetics. All rights reserved.
//

#import <Foundation/Foundation.h>

/** A collection of category extensions for `NSURL` that provide direct access to preferences. 
 
 For example: Open the settings app on the About page
 
	NSURL *appURL = [NSURL preferencesURLForPage:DTPrefLinkAbout];
	[[UIApplication sharedApplication] openURL:appURL];
 
 */


// settings pages constants

typedef enum
{
	DTPrefLinkSettings = 0,
	DTPrefLinkAbout,
	DTPrefLinkAccessibility,
	DTPrefLinkAirplaneModeOn,
	DTPrefLinkAutoLock,
	DTPrefLinkBrightness,
	DTPrefLinkBluetooth,
	DTPrefLinkDateAndTime,
	DTPrefLinkFaceTime,
	DTPrefLinkKeyboard,
	DTPrefLinkGeneral,
	DTPrefLinkiCloud,
	DTPrefLinkiCloudStorageAndBackup,
	DTPrefLinkInternational,
	DTPrefLinkLocationServices,
	DTPrefLinkMusic,
	DTPrefLinkMusicEqualizer,
	DTPrefLinkMusicVolumeLimit,
	DTPrefLinkNetwork,
	DTPrefLinkNikePlusiPod,
	DTPrefLinkNotes,
	DTPrefLinkNotification,
	DTPrefLinkPhone,
	DTPrefLinkPhotos,
	DTPrefLinkProfile,
	DTPrefLinkReset,
	DTPrefLinkSafari,
	DTPrefLinkSiri,
	DTPrefLinkSounds,
	DTPrefLinkSoftwareUpdate,
	DTPrefLinkStore,
	DTPrefLinkTwitter,
	DTPrefLinkUsage,
	DTPrefLinkVPN,
	DTPrefLinkWallpaper,
	DTPrefLinkWiFi
}	DTPrefLinkPageType;


@interface NSURL (DTPrefLinks)

/**---------------------------------------------------------------------------------------
* @name Settings Pages 
*  ---------------------------------------------------------------------------------------
*/

/** Returns the URL to open the settings app to a specific page.
 
 The pageType parameter can have these values:
 
 - DTPrefLinkSettings
 - DTPrefLinkAbout
 - DTPrefLinkAccessibility
 - DTPrefLinkAirplaneModeOn
 - DTPrefLinkAutoLock
 - DTPrefLinkBrightness
 - DTPrefLinkBluetooth
 - DTPrefLinkDateAndTime
 - DTPrefLinkFaceTime
 - DTPrefLinkKeyboard
 - DTPrefLinkGeneral
 - DTPrefLinkiCloud
 - DTPrefLinkiCloudStorageAndBackup
 - DTPrefLinkInternational
 - DTPrefLinkLocationServices
 - DTPrefLinkMusic
 - DTPrefLinkMusicEqualizer
 - DTPrefLinkMusicVolumeLimit
 - DTPrefLinkNetwork
 - DTPrefLinkNikePlusiPod
 - DTPrefLinkNotes
 - DTPrefLinkNotification
 - DTPrefLinkPhone
 - DTPrefLinkPhotos
 - DTPrefLinkProfile
 - DTPrefLinkReset
 - DTPrefLinkSafari
 - DTPrefLinkSiri
 - DTPrefLinkSounds
 - DTPrefLinkSoftwareUpdate
 - DTPrefLinkStore
 - DTPrefLinkTwitter
 - DTPrefLinkUsage
 - DTPrefLinkVPN
 - DTPrefLinkWallpaper
 - DTPrefLinkWiFi

 The list of available settings pages was found [online](http://cydiahelp.com/how-to-make-custom-shortcuts-for-favorite-settings-without-jailbreak/).
 
 
 @bug *Warning*: The prefs URL scheme has not been made public by Apple and thus might be cause for rejection. Use at your own risk.
 @param pageType The settings page to jump to.
 @return Returns the URL that opens the settings app to the specified page.
 
 
 */
+ (NSURL *)preferencesURLForPage:(DTPrefLinkPageType)pageType;

@end
