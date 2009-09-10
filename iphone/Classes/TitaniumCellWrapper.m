//
//  TitaniumCellWrapper.m
//  Titanium
//
//  Created by Blain Hamon on 9/9/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "TitaniumCellWrapper.h"
#import "TitaniumHost.h"
#import	"TitaniumBlobWrapper.h"
#import "UiModule.h"

@implementation TitaniumCellWrapper
@synthesize title,html,imageURL,imageWrapper,accessoryType,inputProxy,isButton, value, name;

- (id) init
{
	self = [super init];
	if (self != nil) {
		fontDesc.isBold=YES;
		fontDesc.size=15;
	}
	return self;
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

- (void) dealloc
{
	[title release]; [html release]; [imageURL release];
	[imageWrapper release]; [inputProxy release];
	[super dealloc];
}

- (NSString *) stringValue;
{
	NSString * accessoryString;
	switch (accessoryType) {
		case UITableViewCellAccessoryDetailDisclosureButton:
			accessoryString = @"hasDetail:true,hasChild:false,selected:false";
			break;
		case UITableViewCellAccessoryDisclosureIndicator:
			accessoryString = @"hasDetail:false,hasChild:true,selected:false";
			break;
		case UITableViewCellAccessoryCheckmark:
			accessoryString = @"hasDetail:false,hasChild:false,selected:true";
			break;
		default:
			accessoryString = @"hasDetail:false,hasChild:false,selected:false";
			break;
	}
	
	SBJSON * packer = [[SBJSON alloc] init];
	NSString * titleString;
	if (title != nil){
		titleString = [packer stringWithFragment:title error:nil];
	} else { titleString = @"null"; }
	
	NSString * valueString;
	if (value != nil){
		valueString = [packer stringWithFragment:value error:nil];
	} else { valueString = @"null"; }
	
	NSString * htmlString;
	if (html != nil){
		htmlString = [packer stringWithFragment:html error:nil];
	} else { htmlString = @"null"; }
	
	NSString * imageURLString;
	if (imageURL != nil){
		imageURLString = [packer stringWithFragment:[imageURL absoluteString] error:nil];
	} else { imageURLString = @"null"; }
	
	NSString * inputProxyString;
	if (inputProxy != nil){
		inputProxyString = [@"Ti.UI._BTN." stringByAppendingString:[inputProxy token]];
	} else { inputProxyString = @"null"; }
	
	NSString * nameString;
	if (name != nil){
		nameString = [packer stringWithFragment:name error:nil];
	} else { nameString = @"null"; }
	
	NSString * result = [NSString stringWithFormat:@"{%@,title:%@,html:%@,image:%@,input:%@,value:%@,name:%@}",
						 accessoryString,titleString,htmlString,imageURLString,inputProxyString,valueString,nameString];
	[packer release];
	return result;
}

- (void) useProperties: (NSDictionary *) propDict withUrl: (NSURL *) baseUrl;
{
	SEL boolSel = @selector(boolValue);
	SEL stringSel = @selector(stringValue);
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
	
	
	id titleString = [propDict objectForKey:@"title"];
	if ([titleString respondsToSelector:stringSel]) titleString = [titleString stringValue];
	if ([titleString isKindOfClass:stringClass] && ([titleString length] != 0)){
		[self setTitle:titleString];
	}
	
	id nameString = [propDict objectForKey:@"name"];
	if ([nameString respondsToSelector:stringSel]) nameString = [nameString stringValue];
	if ([nameString isKindOfClass:stringClass] && ([nameString length] != 0)){
		[self setName:nameString];
	}
	
	id htmlString = [propDict objectForKey:@"html"];
	if ([htmlString respondsToSelector:stringSel]) htmlString = [htmlString stringValue];
	if ([htmlString isKindOfClass:stringClass] && ([htmlString length] != 0)){
		[self setHtml:htmlString];
	} else [self setHtml:nil];
	
	id valueString = [propDict objectForKey:@"value"];
	if ([valueString respondsToSelector:stringSel]) valueString = [valueString stringValue];
	if ([valueString isKindOfClass:stringClass] && ([valueString length] != 0)){
		[self setValue:valueString];
	} else [self setValue:nil];
	
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
