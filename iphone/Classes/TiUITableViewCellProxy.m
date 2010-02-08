/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewCellProxy.h"
#import "TiUITableViewCell.h"




#import "Webcolor.h"
#import "WebFont.h"
#import "ImageLoader.h"
#import "TiUtils.h"
#import "LayoutEntry.h"	

@implementation TiUITableViewCellProxy

-(TiUITableViewCell *)cellForTableView:(UITableView *)tableView
{
	NSString * indentifier = [TiUtils stringValue:[self valueForKey:@"style"]];
	if (indentifier==nil)
	{
		indentifier = @"NOSTYLE";
	}

	TiUITableViewCell *result = (TiUITableViewCell *)[tableView dequeueReusableCellWithIdentifier:indentifier];
	if (result == nil)
	{
		result = [[[TiUITableViewCell alloc] initWithStyle:[tableView style] reuseIdentifier:indentifier] autorelease];
		//TODO: copy over the properties relevant.
	}
	else
	{
		//TODO: copy over only the changed properties.
	}

	[result setProxy:self];	
	[result readProxyValuesWithKeys:[NSSet setWithObjects:@"title",nil]];

#pragma mark BUG BARRIER for cellForTableView

	
//	NSString * selectionStyleString = [self stringForKey:@"selectionStyle"];
//	if([selectionStyleString isEqualToString:@"none"])
//	{
//		[result setSelectionStyle:UITableViewCellSelectionStyleNone];
//	} 
//	else if ([selectionStyleString isEqualToString:@"gray"])
//	{
//		[result setSelectionStyle:UITableViewCellSelectionStyleGray];
//	} 
//	else 
//	{
//		[result setSelectionStyle:UITableViewCellSelectionStyleBlue];
//	}
//	
//	
//	UIColor * backgroundColor = [self colorForKey:@"backgroundColor"];
//	UIColor * selectedBgColor = [self colorForKey:@"selectedBackgroundColor"];
//	
//	UIImage * bgImage = [self stretchableImageForKey:@"backgroundImage"];
//	UIImage	* selectedBgImage = [self stretchableImageForKey:@"selectedBackgroundImage"];
//	
//	
//	if (([tableView style] == UITableViewStyleGrouped) && (bgImage == nil))
//	{
//		if (backgroundColor != nil)
//		{
//			[result setBackgroundColor:backgroundColor];
//		}
//		else 
//		{
//			[result setBackgroundColor:[UIColor whiteColor]];
//		}
//	} 
//	else 
//	{
//		UIImageView * bgView = (UIImageView *)[result backgroundView];
//		if (![bgView isKindOfClass:[UIImageView class]])
//		{
//			bgView = [[[UIImageView alloc] initWithFrame:[result bounds]] autorelease];
//			[bgView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
//			[result setBackgroundView:bgView];
//		}
//		[bgView setImage:bgImage];
//		[bgView setBackgroundColor:(backgroundColor==nil)?[UIColor clearColor]:backgroundColor];
//	}
//	
//	if ((selectedBgColor == nil) && (selectedBgImage == nil))
//	{
//		[result setSelectedBackgroundView:nil];
//	} 
//	else 
//	{
//		UIImageView * selectedBgView = (UIImageView *)[result selectedBackgroundView];
//		if (![selectedBgView isKindOfClass:[UIImageView class]])
//		{
//			selectedBgView = [[[UIImageView alloc] initWithFrame:[result bounds]] autorelease];
//			[selectedBgView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
//			[result setSelectedBackgroundView:selectedBgView];
//		}
//		
//		[selectedBgView setImage:selectedBgImage];
//		[selectedBgView setBackgroundColor:(selectedBgColor==nil)?[UIColor clearColor]:selectedBgColor];
//	}

	
	return result;
}

#pragma mark BUG BARRIER

@end
