//
//  NSURL+DTPrefLinks.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 11/28/11.
//  Copyright (c) 2011 Cocoanetics. All rights reserved.
//

#import "NSURL+DTPrefLinks.h"
#import "DTFoundation.h"

// force this category to be loaded by linker
MAKE_CATEGORIES_LOADABLE(NSURL_DTPrefLinks);

@implementation NSURL (DTPrefLinks)

+ (NSURL *)preferencesURLForPage:(DTPrefLinkPageType)pageType
{
	NSString *urlString; 
	switch (pageType) 
	{
		case DTPrefLinkSettings:
		default:
			urlString = @"prefs:";
			break;
		case DTPrefLinkAbout:
			urlString = @"prefs:root=General&path=About";
			break;
		case DTPrefLinkAccessibility:
			urlString = @"prefs:root=General&path=ACCESSIBILITY";
			break;
		case DTPrefLinkAirplaneModeOn:
			urlString = @"prefs:root=AIRPLANE_MODE";
			break;
		case DTPrefLinkAutoLock:
			urlString = @"prefs:root=General&path=AUTOLOCK";
			break;
		case DTPrefLinkBrightness:
			urlString = @"prefs:root=Brightness";
			break;
		case DTPrefLinkBluetooth:
			urlString = @"prefs:root=General&path=Bluetooth";
			break;
		case DTPrefLinkDateAndTime:
			urlString = @"prefs:root=General&path=DATE_AND_TIME";
			break;
		case DTPrefLinkFaceTime:
			urlString = @"prefs:root=FACETIME";
			break;
		case DTPrefLinkKeyboard:
			urlString = @"prefs:root=General&path=Keyboard";
			break;
		case DTPrefLinkGeneral:
			urlString = @"prefs:root=General";
			break;
		case DTPrefLinkiCloud:
			urlString = @"prefs:root=CASTLE";
			break;
		case DTPrefLinkiCloudStorageAndBackup:
			urlString = @"prefs:root=CASTLE&path=STORAGE_AND_BACKUP";
			break;
		case DTPrefLinkInternational:
			urlString = @" prefs:root=General&path=INTERNATIONAL";
			break;
		case DTPrefLinkLocationServices:
			urlString = @"prefs:root=LOCATION_SERVICESY";
			break;
		case DTPrefLinkMusic:
			urlString = @" prefs:root=MUSIC";
			break;
		case DTPrefLinkMusicEqualizer:
			urlString = @"prefs:root=MUSIC&path=EQ";
			break;
		case DTPrefLinkMusicVolumeLimit:
			urlString = @"prefs:root=MUSIC&path=VolumeLimit";
			break;
		case DTPrefLinkNetwork:
			urlString = @"prefs:root=General&path=Network";
			break;
		case DTPrefLinkNikePlusiPod:
			urlString = @"prefs:root=NIKE_PLUS_IPOD";
			break;
		case DTPrefLinkNotes:
			urlString = @"prefs:root=NOTES";
			break;
		case DTPrefLinkNotification:
			urlString = @"prefs:root=NOTIFICATIONS_ID";
			break;
		case DTPrefLinkPhone:
			urlString = @"prefs:root=Phone";
			break;
		case DTPrefLinkPhotos:
			urlString = @"prefs:root=Photos";
			break;
		case DTPrefLinkProfile:
			urlString = @"prefs:root=General&path=ManagedConfigurationList";
			break;
		case DTPrefLinkReset:
			urlString = @"prefs:root=General&path=Reset";
			break;
		case DTPrefLinkSafari:
			urlString = @"prefs:root=Safari";
			break;
		case DTPrefLinkSiri:
			urlString = @"prefs:root=General&path=Assistant";
			break;
		case DTPrefLinkSounds:
			urlString = @"prefs:root=Sounds";
			break;
		case DTPrefLinkSoftwareUpdate:
			urlString = @"prefs:root=General&path=SOFTWARE_UPDATE_LINK";
			break;
		case DTPrefLinkStore:
			urlString = @"prefs:root=STORE";
			break;
		case DTPrefLinkTwitter:
			urlString = @"prefs:root=TWITTER";
			break;
		case DTPrefLinkUsage:
			urlString = @"prefs:root=General&path=USAGE";
			break;
		case DTPrefLinkVPN:
			urlString = @"prefs:root=General&path=Network/VPN";
			break;
		case DTPrefLinkWallpaper:
			urlString = @"prefs:root=Wallpaper";
			break;
		case DTPrefLinkWiFi:
			urlString = @"prefs:root=WIFI";
			break;
	}
	
	return [NSURL URLWithString:urlString];
}

@end
