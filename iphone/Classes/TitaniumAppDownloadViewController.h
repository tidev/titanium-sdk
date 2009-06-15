/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

#ifdef ALLOW_EXTERNAL_APP

@interface TitaniumAppDownloadViewController : UIViewController {
	NSURL * titaniumUrl;
	NSString * appName;
	NSURL * appZipUrl;

	IBOutlet UILabel * mainLabel;
	IBOutlet UILabel * progressLabel;
	IBOutlet UIProgressView * progressBar;

	NSURLConnection * appZipConnection;
	NSMutableData * appZipData;
	NSString * appZipFileName;

	float downloadTotalSize;
}

+ (TitaniumAppDownloadViewController *) viewController;
- (void)startDownload;

@property(nonatomic,copy)	NSURL * titaniumUrl;
@property(nonatomic,copy)	NSString * appName;


@end

#endif