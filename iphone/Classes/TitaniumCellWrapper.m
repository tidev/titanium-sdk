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

@implementation LayoutEntry
@synthesize type,constraint,labelFont,textColor,nameString,selectedTextColor, textAlign;

- (id) initWithDictionary: (NSDictionary *) inputDict inheriting: (LayoutEntry *) inheritance;
{
	self = [super init];
	if (self != nil) {
		NSString * typeString = [inputDict objectForKey:@"type"];
		if(typeString != nil) inheritance=nil;
		
		if(inheritance != nil){
			type = [inheritance type];
		} else if([@"text" isEqual:typeString]){
			type = LayoutEntryText;
		} else if ([@"image" isEqual:typeString]) {
			type = LayoutEntryImage;
		} else if ([@"button" isEqual:typeString]) {
			type = LayoutEntryButton;
		} else {
			[self release];
			return nil;
		}
		
		labelFont = [[TitaniumFontDescription alloc]init];
	
		NSString * alignmentString = [inputDict objectForKey:@"textAlign"];
		if([alignmentString isKindOfClass:[NSString class]]){
			alignmentString = [alignmentString lowercaseString];
			if ([alignmentString isEqualToString:@"left"])textAlign=UITextAlignmentLeft;
			else if ([alignmentString isEqualToString:@"center"])textAlign=UITextAlignmentCenter;
			else if ([alignmentString isEqualToString:@"right"])textAlign=UITextAlignmentRight;
		} else if(alignmentString == nil) textAlign=[inheritance textAlign];
	
		NSString * possibleName = [inputDict objectForKey:@"name"];
		if([possibleName isKindOfClass:[NSString class]])[self setNameString:possibleName];
		else if(inheritance!=nil) [self setNameString:[inheritance nameString]];

		ReadConstraintFromDictionary(&constraint, inputDict, [inheritance constraintPointer]);
		UpdateFontDescriptionFromDict(inputDict, labelFont, [inheritance labelFontPointer]);

		NSString * newTextColor = [inputDict objectForKey:@"color"];
		if(newTextColor == nil)[self setTextColor:[inheritance textColor]];
		else [self setTextColor:UIColorWebColorNamed(newTextColor)];

		NSString * newSelectedTextColor = [inputDict objectForKey:@"selectedColor"];
		if(newSelectedTextColor == nil)[self setSelectedTextColor:[inheritance selectedTextColor]];
		else [self setSelectedTextColor:UIColorWebColorNamed(newSelectedTextColor)];
		
	}
	return self;
}

- (void) dealloc
{
	[labelFont release];
	[textColor release];
	[nameString release];
	[super dealloc];
}

- (TitaniumFontDescription *) labelFontPointer;
{
	return labelFont;
}

- (LayoutConstraint *) constraintPointer;
{
	return &constraint;
}


@end







@implementation TitaniumCellWrapper
@synthesize jsonValues, templateCell;
@synthesize inputProxy,isButton, fontDesc, rowHeight;
@synthesize layoutArray, imageKeys;

- (id) init
{
	self = [super init];
	if (self != nil) {
		fontDesc = [[TitaniumFontDescription alloc]init];
		fontDesc.isBoldWeight=YES;
		fontDesc.size=15;
	}
	return self;
}

- (void) dealloc
{
	[fontDesc release];
	[imageKeys release];
	[layoutArray release];
	
	[templateCell release];
	[inputProxy release];

	[imagesCache release];
	[jsonValues release];
	[super dealloc];
}

- (UIColor *) colorForKey:(NSString *) key;
{
	id result = [jsonValues objectForKey:key];
	
	//Okay, if it's blank, we default to the template. If there is no template, we get nil anyways.
	if(result == nil) return [templateCell colorForKey:key];
	
	return UIColorWebColorNamed(result);
}

- (NSString *) stringForKey: (NSString *) key;
{
	id result = [jsonValues objectForKey:key];

	//Okay, if it's blank, we default to the template. If there is no template, we get nil anyways.
	if(result == nil) return [templateCell stringForKey:key];

	if([result isKindOfClass:[NSString class]])return result;
	if ([result respondsToSelector:@selector(stringValue)])return [result stringValue];

	//If it's NSNull, then we want nil.
	return nil;
}

- (TitaniumBlobWrapper *) blobWrapperForKey: (NSString *) key;
{
	id result = [imagesCache objectForKey:key];
	
	//Okay, if it's blank, we default to the template. If there is no template, we get nil anyways.
	if(result == nil) return [templateCell blobWrapperForKey:key];
	
	if([result isKindOfClass:[TitaniumBlobWrapper class]]){
		return result;
	}
	
	//If it's NSNull, then we want nil.
	return nil;	
}

- (UIImage *) imageForKey: (NSString *) key;
{
	id result = [imagesCache objectForKey:key];

	//Okay, if it's blank, we default to the template. If there is no template, we get nil anyways.
	if(result == nil) return [templateCell imageForKey:key];

	if([result isKindOfClass:[NSURL class]]){
		TitaniumHost * theHost = [TitaniumHost sharedHost];
		UIImage * resultImage = [theHost imageForResource:result];
		if(resultImage!=nil)return resultImage;
		
		//Not a built-in or resource image. Consult the blobs.
		result = [theHost blobForUrl:result];
		if(result == nil)return nil; //Failed!
		[imagesCache setObject:result forKey:key];
		
		//This flows into the next if.
	}
	
	if([result isKindOfClass:[TitaniumBlobWrapper class]]){
		UIImage * resultImage = [(TitaniumBlobWrapper *)result imageBlob];
		if(resultImage!=nil)return resultImage;
	}

	//If it's NSNull, then we want nil.
	return nil;
}

- (UIImage *) stretchableImageForKey: (NSString *) key;
{
	id result = [imagesCache objectForKey:key];

	//Okay, if it's blank, we default to the template. If there is no template, we get nil anyways.
	if(result == nil) return [templateCell stretchableImageForKey:key];

	if([result isKindOfClass:[NSURL class]]){
		TitaniumHost * theHost = [TitaniumHost sharedHost];
		UIImage * resultImage = [theHost stretchableImageForResource:result];
		if(resultImage!=nil)return resultImage;
	}

	//If it's NSNull, then we want nil.
	return nil;
}

- (NSMutableArray *) layoutArray;
{
	if(layoutArray == nil)return [templateCell layoutArray];
	if(![layoutArray isKindOfClass:[NSArray class]])return nil;
	return layoutArray;
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
	return [self imageForKey:@"image"];
}

- (UIFont *) font;
{
	return [fontDesc font];
}

- (NSString *) stringValue;
{
	NSMutableString * result = [NSMutableString stringWithString:@"{"];
	SBJSON * packer = [[SBJSON alloc] init];
	
	Class blobClass = [TitaniumBlobWrapper class];
	Class urlClass = [NSURL class];
	
	BOOL needsComma=NO;
	
	for (NSString * thisKey in jsonValues) {
		id thisValue = [imagesCache objectForKey:thisKey];
		if (thisValue == nil) {
			thisValue = [jsonValues objectForKey:thisKey];
		}
		
		if([thisValue isKindOfClass:blobClass]){
			thisValue = [thisValue virtualUrl];
		}else if ([thisValue isKindOfClass:urlClass]) {
			thisValue = [thisValue absoluteURL];
		}
		
		if (needsComma) {
			[result appendString:@","];
		}
		
		[result appendFormat:@"%@:%@",[packer stringWithFragment:thisKey error:nil],
				[packer stringWithFragment:thisValue error:nil]];
		needsComma = YES;
	}
	[packer release];
	[result appendString:@"}"];

	return result;
}

- (UITableViewCellAccessoryType) accessoryType;
{
	SEL boolSel = @selector(boolValue);

	NSNumber * hasDetail = [jsonValues objectForKey:@"hasDetail"];
	if ([hasDetail respondsToSelector:boolSel] && [hasDetail boolValue]){
		return UITableViewCellAccessoryDetailDisclosureButton;
	}

	NSNumber * hasChild = [jsonValues objectForKey:@"hasChild"];
	if ([hasChild respondsToSelector:boolSel] && [hasChild boolValue]){
		return UITableViewCellAccessoryDisclosureIndicator;
	}
	
	NSNumber * isSelected = [jsonValues objectForKey:@"selected"];
	if ([isSelected respondsToSelector:boolSel] && [isSelected boolValue]){
		return UITableViewCellAccessoryCheckmark;
	}

	return UITableViewCellAccessoryNone;
}

- (void) setAccessoryType:(UITableViewCellAccessoryType) newType;
{
	NSNumber * falseNum = [NSNumber numberWithBool:NO];

	[jsonValues setObject:((newType==UITableViewCellAccessoryDetailDisclosureButton)?
						   [NSNumber numberWithBool:YES]:falseNum) forKey:@"hasDetail"];

	[jsonValues setObject:((newType==UITableViewCellAccessoryDisclosureIndicator)?
						   [NSNumber numberWithBool:YES]:falseNum) forKey:@"hasChild"];

	[jsonValues setObject:((newType==UITableViewCellAccessoryCheckmark)?
						   [NSNumber numberWithBool:YES]:falseNum) forKey:@"selected"];

}



- (void) noteImage: (NSString *)key relativeToUrl: (NSURL *) baseUrl;
{
	id oldImageEntry = [imagesCache objectForKey:key];
	id jsonEntry = [jsonValues objectForKey:key];

//Okay, first make sure we don't already have this.

//First check to see if they're both null, or both the same datablob.
	if(oldImageEntry==jsonEntry)return;

//Okay, try it being a relative string.
	if ([jsonEntry isKindOfClass:[NSString class]]) {
		NSURL * newImageUrl = [[NSURL URLWithString:jsonEntry relativeToURL:baseUrl] absoluteURL];
		if([newImageUrl isEqual:oldImageEntry])return;
		
		if ([oldImageEntry isKindOfClass:[TitaniumBlobWrapper class]] && 
				([newImageUrl isEqual:[oldImageEntry url]] ||
				[[newImageUrl absoluteString] isEqual:[oldImageEntry virtualUrl]])){
			return; //The old entry contains the url already.
		}
		//Okay, this is a new url. Update it.
		[imagesCache setObject:newImageUrl forKey:key];
		return;

	}
	
	if ([jsonEntry isKindOfClass:[TitaniumBlobWrapper class]]){
		[imagesCache setObject:jsonEntry forKey:key];
		return;
	}
	
	if(jsonEntry == [NSNull null]){
		[imagesCache setObject:[NSNull null] forKey:key];
		return;
	}
	
	//No image!
	[imagesCache removeObjectForKey:key];
}



- (void) useProperties: (NSDictionary *) propDict withUrl: (NSURL *) baseUrl;
{
	Class dictClass = [NSDictionary class];

	[self willChangeValueForKey:@"jsonValues"];
	if (jsonValues != nil) {
		[jsonValues removeAllObjects];
		[jsonValues addEntriesFromDictionary:propDict];
	} else {
		jsonValues = [propDict mutableCopy];
	}
	[self didChangeValueForKey:@"jsonValues"];

	if(templateCell == nil){
		UpdateFontDescriptionFromDict(propDict, fontDesc,NULL);
	} else {
		TitaniumFontDescription* templateFontDesc = [templateCell fontDesc];
		UpdateFontDescriptionFromDict(propDict, fontDesc, templateFontDesc);
	}	

	NSArray * newlayoutArray = [propDict objectForKey:@"layout"];
	if ([newlayoutArray isKindOfClass:[NSArray class]]) {

		//Because Complex TableViewCell caches the layout based on the actual int value, we need to flush the old one.
		[layoutArray release];
		layoutArray = [[NSMutableArray alloc] initWithCapacity:[newlayoutArray count]];
		
		if (imageKeys == nil) {
			imageKeys = [[NSMutableSet alloc] init];
		} else {
			[imageKeys removeAllObjects];
		}		
		
		NSEnumerator * templateEntryEnumerator = [[templateCell layoutArray] objectEnumerator];
		
		for (NSDictionary * thisLayoutDict in newlayoutArray) {
			LayoutEntry * templateEntry = [templateEntryEnumerator nextObject];
			if(![thisLayoutDict isKindOfClass:dictClass])continue;
			LayoutEntry * thisLayout = [[LayoutEntry alloc] initWithDictionary:thisLayoutDict
					inheriting:templateEntry];
			if(thisLayout==nil)continue;
			[layoutArray addObject:thisLayout];
			
			LayoutEntryType	thisType = [thisLayout type];
			switch (thisType) {
				case LayoutEntryImage:
					[imageKeys addObject:[thisLayout nameString]];
					break;
				case LayoutEntryText:{
					TitaniumFontDescription * entryFont = [thisLayout labelFontPointer];
					if(entryFont.isBoldWeight == entryFont.isNormalWeight){
						entryFont.isBoldWeight = fontDesc.isBoldWeight;
						entryFont.isNormalWeight = fontDesc.isNormalWeight;
					}
					if(entryFont.size < 1.0){
						entryFont.size = fontDesc.size;
					}
					
					break;}
			}
			[thisLayout release];
		}
		
	} else {
		[layoutArray release];
		
		NSMutableSet * templateKeys;
		if (newlayoutArray==(id)[NSNull null]) {
			layoutArray = (id)[NSNull null];
			templateKeys = nil;
		} else {
			layoutArray = nil;
			templateKeys = [templateCell imageKeys];
		}

		if(templateKeys == nil){
			if (imageKeys == nil) {
				imageKeys = [[NSMutableSet alloc] initWithObjects:@"image",nil];
			} else {
				[imageKeys removeAllObjects];
				[imageKeys addObject:@"image"];
			}
		} else {
			[imageKeys release];
			imageKeys = [templateKeys mutableCopy];
		}
	}
	[imageKeys addObject:@"backgroundImage"];
	[imageKeys addObject:@"selectedBackgroundImage"];

	NSArray * oldKeys = [imagesCache allKeys];
	for (NSString * thisKey in oldKeys) {
		if([imageKeys containsObject:thisKey])continue;
		
		[imagesCache removeObjectForKey:thisKey];
	}

	if (imagesCache==nil) {
		[self willChangeValueForKey:@"imagesCache"];
		imagesCache = [[NSMutableDictionary alloc] init];
		[self didChangeValueForKey:@"imagesCache"];
	}
	
	
	for (NSString * thisKey in imageKeys) {
		[self noteImage:thisKey relativeToUrl:baseUrl];
	}


	Class stringClass = [NSString class];

	NSString * rowType = [propDict objectForKey:@"type"];
	if ([rowType isKindOfClass:stringClass]){
		isButton = [rowType isEqualToString:@"button"];
	} else isButton = NO;
	
	
	id rowHeightObject = [propDict objectForKey:@"rowHeight"];
	if ([rowHeightObject respondsToSelector:@selector(floatValue)]) rowHeight = [rowHeightObject floatValue];
	else rowHeight = 0;
	
	NSDictionary * inputProxyDict = [propDict objectForKey:@"input"];
	if ([inputProxyDict isKindOfClass:dictClass]){
		UiModule * theUiModule = (UiModule *)[[TitaniumHost sharedHost] moduleNamed:@"UiModule"];
		NativeControlProxy * thisInputProxy = [theUiModule proxyForObject:inputProxyDict scan:YES recurse:YES];
		if (thisInputProxy != nil) [self setInputProxy:thisInputProxy];
	} else [self setInputProxy:nil];
}

- (BOOL) stringForKey:(NSString *)key containsString: (NSString *)matchString;
{
	NSString * valueString = [self stringForKey:key];
	if(valueString == nil) return NO;
	NSRange matchLocation = [valueString rangeOfString:matchString options:
			NSCaseInsensitiveSearch|NSDiacriticInsensitiveSearch|NSWidthInsensitiveSearch];
	return matchLocation.location != NSNotFound;
}


@end
