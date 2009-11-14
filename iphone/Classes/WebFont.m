/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "WebFont.h"

@implementation TitaniumFontDescription

@synthesize family, size, isBoldWeight, isNormalWeight;

-(void)dealloc
{
	[font release];
	[family release];
	[super dealloc];
}

-(UIFont *) font
{
	if (font == nil)
	{
		UIFont * result;
		if (self.family!=nil)
		{
			result = [UIFont fontWithName:self.family size:self.size];
		}
		else
		{
			if (self.isBoldWeight){ //normalWeight is the default.
				result = [UIFont boldSystemFontOfSize:self.size];
			} else {
				result = [UIFont systemFontOfSize:self.size];
			}
		}
		font = [result retain];
	}
	return font;
}

@end

BOOL UpdateFontDescriptionFromDict(NSDictionary * fontDict,TitaniumFontDescription * result,TitaniumFontDescription * inheritance)
{
	BOOL didChange = NO;
	
	float multiplier = 1.0; //Default is px.
	
	id sizeObject = [fontDict objectForKey:@"fontSize"];
	if([sizeObject isKindOfClass:[NSString class]]){
		sizeObject = [sizeObject lowercaseString];
		if([sizeObject hasSuffix:@"px"]){
			sizeObject = [sizeObject substringToIndex:[sizeObject length]-2];
		}
		//TODO: Mod multipler with different suffixes (in, cm, etc)
	}
	
	if([sizeObject respondsToSelector:@selector(floatValue)]){
		float fontSize = multiplier * [sizeObject floatValue];
		if (fontSize != result.size){
			didChange = YES;
			result.size = fontSize;
		}
	} else if((inheritance != NULL) && (sizeObject == nil)) {
		float fontSize = inheritance.size;
		if(result.size != fontSize){
			didChange = YES;
			result.size = fontSize;
		}
	}
	
	id familyObject = [fontDict objectForKey:@"fontFamily"];
	if ([familyObject isKindOfClass:[NSString class]])
	{
		result.family = familyObject;
		didChange = YES;
	}
	else if (inheritance!=nil && inheritance.family!=nil)
	{
		result.family = inheritance.family;
		didChange = YES;
	}


	NSString * fontWeightObject = [fontDict objectForKey:@"fontWeight"];
	if([fontWeightObject isKindOfClass:[NSString class]]){
		fontWeightObject = [fontWeightObject lowercaseString];
		if([fontWeightObject isEqualToString:@"bold"]){
			didChange |= !(result.isBoldWeight)||(result.isNormalWeight);
			result.isBoldWeight = YES;
			result.isNormalWeight = NO;
		} else if([fontWeightObject isEqualToString:@"normal"]){
			didChange |= (result.isBoldWeight)||!(result.isNormalWeight);
			result.isBoldWeight = NO;
			result.isNormalWeight = YES;
		}
	} else if((inheritance != NULL) && (fontWeightObject == nil)) {
		BOOL isBoldBool = inheritance.isBoldWeight;
		if(result.isBoldWeight != isBoldBool){
			didChange = YES;
			result.isBoldWeight = isBoldBool;
		}
		BOOL isNormalBool = inheritance.isNormalWeight;
		if(result.isNormalWeight != isNormalBool){
			didChange = YES;
			result.isNormalWeight = isNormalBool;
		}
	}

	return didChange;
}

