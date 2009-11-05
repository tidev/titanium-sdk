/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumCellWrapper.h"
#import "TitaniumHost.h"
#import	"TitaniumBlobWrapper.h"
#import "UiModule.h"

@implementation TitaniumCellWrapper
@synthesize jsonUrl, jsonValues;
@synthesize imageURL,imageWrapper,accessoryType,inputProxy,isButton, fontDesc, rowHeight;

- (id) init
{
	self = [super init];
	if (self != nil) {
		fontDesc.isBold=YES;
		fontDesc.size=15;
	}
	return self;
}

- (void) dealloc
{
	[imageURL release];
	[imageWrapper release]; [inputProxy release];

	[jsonUrl release];
	[jsonValues release];
	[super dealloc];
}

- (NSString *) stringForKey: (NSString *) key;
{
	id result = [jsonValues objectForKey:key];
	
	if([result isKindOfClass:[NSString class]]){
		return result;
	}
	
	if ([result respondsToSelector:@selector(stringValue)]) {
		return [result stringValue];
	}
	
	return nil;
}

- (NSString *) title;
{
	return [self stringForKey:@"title"];
}

- (NSString *) html;
{
	return [self stringForKey:@"html"];
}

- (NSString *) name;
{
	return [self stringForKey:@"name"];
}

- (NSString *) value;
{
	return [self stringForKey:@"value"];
}



- (UIImage *) image;
{
	if (imageWrapper != nil){
		return [imageWrapper imageBlob];
	}
	if (imageURL == nil) return nil;
	return [[TitaniumHost sharedHost] imageForResource:imageURL];
}

- (UIFont *) font;
{
	return FontFromDescription(&fontDesc);
}

- (NSString *) stringValue;
{
	return [SBJSON stringify:jsonValues];

//	NSString * accessoryString;
//	switch (accessoryType) {
//		case UITableViewCellAccessoryDetailDisclosureButton:
//			accessoryString = @"hasDetail:true,hasChild:false,selected:false";
//			break;
//		case UITableViewCellAccessoryDisclosureIndicator:
//			accessoryString = @"hasDetail:false,hasChild:true,selected:false";
//			break;
//		case UITableViewCellAccessoryCheckmark:
//			accessoryString = @"hasDetail:false,hasChild:false,selected:true";
//			break;
//		default:
//			accessoryString = @"hasDetail:false,hasChild:false,selected:false";
//			break;
//	}
//	
//	SBJSON * packer = [[SBJSON alloc] init];
//	NSString * titleString;
//	if (title != nil){
//		titleString = [packer stringWithFragment:title error:nil];
//	} else { titleString = @"null"; }
//	
//	NSString * valueString;
//	if (value != nil){
//		valueString = [packer stringWithFragment:value error:nil];
//	} else { valueString = @"null"; }
//	
//	NSString * htmlString;
//	if (html != nil){
//		htmlString = [packer stringWithFragment:html error:nil];
//	} else { htmlString = @"null"; }
//	
//	NSString * imageURLString;
//	if (imageURL != nil){
//		imageURLString = [packer stringWithFragment:[imageURL absoluteString] error:nil];
//	} else { imageURLString = @"null"; }
//	
//	NSString * inputProxyString;
//	if (inputProxy != nil){
//		inputProxyString = [@"Ti.UI._BTN." stringByAppendingString:[inputProxy token]];
//	} else { inputProxyString = @"null"; }
//	
//	NSString * nameString;
//	if (name != nil){
//		nameString = [packer stringWithFragment:name error:nil];
//	} else { nameString = @"null"; }
//	
//	NSString * result = [NSString stringWithFormat:@"{%@,title:%@,html:%@,image:%@,input:%@,value:%@,name:%@,rowHeight:%f}",
//						 accessoryString,titleString,htmlString,imageURLString,inputProxyString,valueString,nameString,rowHeight];
//	[packer release];
//	return result;
}


- (void) useProperties: (NSDictionary *) propDict withUrl: (NSURL *) baseUrl;
{
	[self setJsonValues:propDict];
	[self setJsonUrl:baseUrl];

	SEL boolSel = @selector(boolValue);
	Class stringClass = [NSString class];
	
	NSNumber * hasDetail = [propDict objectForKey:@"hasDetail"];
	if ([hasDetail respondsToSelector:boolSel] && [hasDetail boolValue]){
		accessoryType = UITableViewCellAccessoryDetailDisclosureButton;
	} else {
		NSNumber * hasChild = [propDict objectForKey:@"hasChild"];
		if ([hasChild respondsToSelector:boolSel] && [hasChild boolValue]){
			[self setAccessoryType:UITableViewCellAccessoryDisclosureIndicator];
		} else {
			NSNumber * isSelected = [propDict objectForKey:@"selected"];
			if ([isSelected respondsToSelector:boolSel] && [isSelected boolValue]){
				[self setAccessoryType:UITableViewCellAccessoryCheckmark];
			} else {
				[self setAccessoryType:UITableViewCellAccessoryNone];
			}
		}
	}
	
	NSString * rowType = [propDict objectForKey:@"type"];
	if ([rowType isKindOfClass:stringClass]){
		isButton = [rowType isEqualToString:@"button"];
	} else isButton = NO;
	
	
	id rowHeightObject = [propDict objectForKey:@"rowHeight"];
	if ([rowHeightObject respondsToSelector:@selector(floatValue)]) rowHeight = [rowHeightObject floatValue];
	else rowHeight = 0;
		
	id imageString = [propDict objectForKey:@"image"];
	if ([imageString isKindOfClass:stringClass]){
		[self setImageURL:[NSURL URLWithString:imageString relativeToURL:baseUrl]];
	} else [self setImageURL:nil];
	
	NSDictionary * inputProxyDict = [propDict objectForKey:@"input"];
	if ([inputProxyDict isKindOfClass:[NSDictionary class]]){
		UiModule * theUiModule = (UiModule *)[[TitaniumHost sharedHost] moduleNamed:@"UiModule"];
		NativeControlProxy * thisInputProxy = [theUiModule proxyForObject:inputProxyDict scan:YES recurse:YES];
		if (thisInputProxy != nil) [self setInputProxy:thisInputProxy];
	} else [self setInputProxy:nil];
	
	UpdateFontDescriptionFromDict(propDict, &fontDesc);
}


@end
