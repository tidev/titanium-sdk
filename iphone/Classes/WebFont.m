/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBase.h"
#import "WebFont.h"

@implementation WebFont

@synthesize family, size, isBoldWeight, isNormalWeight, isItalicStyle, isNormalStyle;

-(void)dealloc
{
	RELEASE_TO_NIL(font);
	RELEASE_TO_NIL(family);
	[super dealloc];
}

-(CGFloat) size
{
	if (size < 4) 
	{
		size=14;
	}
	return size;
}

-(BOOL) isSizeNotSet
{
	return size < 4;
}

-(UIFont *) font
{
	if (font == nil)
	{
		UIFont * result;
		if (family!=nil)
		{
			if (isBoldWeight || isItalicStyle)
			{
				// cache key must include size or .... yeah, you know what
				NSString *cacheKey = [NSString stringWithFormat:@"%@-%f",family,self.size];
				// optimize font caching for bold lookup
				static NSMutableDictionary *cache;
				if (cache == nil)
				{
					cache = [[NSMutableDictionary alloc] init];
				}
				id cn = [cache objectForKey:cacheKey];
				if (cn!=nil)
				{
					return cn;
				}
				// bold weight for non system fonts are based on the name of the 
				// font family, not actually settable - so we need to attempt to 
				// resolve it in a terribly inconsistently named font way
                NSString* primaryStyle;
                BOOL hasSecondaryStyle = NO;
                NSString* secondaryStyle;
                if (isBoldWeight) { // 'Italic' is considered a secondary style when bolded; see the font check loop
                    primaryStyle = @"Bold";
                    secondaryStyle = @"Italic";
                    if (isItalicStyle) {
                        hasSecondaryStyle = YES;
                    }
                }
                else { // Must be italic (for now) and secondary styling is handled by the 'bold' conditions
                    primaryStyle = @"Italic";
                    secondaryStyle = @"Bold";
                }
				if ([family rangeOfString:primaryStyle].location==NSNotFound)
				{
					// this means we aren't asking for the bold font name, so but 
					// we've set a property for bold, now we need to see if we can find it
					for (NSString *name in [UIFont fontNamesForFamilyName:family])
					{
						// see if the font name has Bold in it (since the names aren't based on any pattern)
						// but filter out italic-style fonts
						if ([name rangeOfString:primaryStyle].location!=NSNotFound &&
							((!hasSecondaryStyle &&[name rangeOfString:secondaryStyle].location==NSNotFound) ||
                         (hasSecondaryStyle && [name rangeOfString:secondaryStyle].location!=NSNotFound))&&
							[name rangeOfString:@"Oblique"].location==NSNotFound)
						{
							result = [UIFont fontWithName:name size:self.size];
							[cache setObject:result forKey:cacheKey];
							RELEASE_TO_NIL(family);
							family = [name retain];
							return result;
						}
					}
					// if we don't find it, oh well, just let it fall through to the non bold
				}
			}
			
			result = [UIFont fontWithName:self.family size:self.size];
		}
		else
		{
			if (self.isBoldWeight){ //normalWeight is the default.
				result = [UIFont boldSystemFontOfSize:self.size];
                if (self.isItalicStyle) {
                    NSString* localFamily = [result familyName];
                    NSString* fontName = [result fontName];
                    
                    // Don't cache; we set 'font'
                    for (NSString* name in [UIFont fontNamesForFamilyName:localFamily]) {
                        if ([name rangeOfString:fontName].location != NSNotFound &&
                            [name rangeOfString:@"Italic"].location != NSNotFound &&
                            [name rangeOfString:@"Oblique"].location == NSNotFound) {
                            result = [UIFont fontWithName:name size:self.size];
                        }
                    }
                }
			} else if (self.isItalicStyle) {
                result =[UIFont italicSystemFontOfSize:self.size];
            } else {
				result = [UIFont systemFontOfSize:self.size];
			}
		}
		font = [result retain];
	}
	return font;
}

-(BOOL)updateWithDict:(NSDictionary *)fontDict inherits:(WebFont *)inheritedFont;
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
		if (fontSize != self.size){
			didChange = YES;
			self.size = fontSize;
		}
	} else if((inheritedFont != NULL) && (sizeObject == nil)) {
		float fontSize = inheritedFont.size;
		if(self.size != fontSize){
			didChange = YES;
			self.size = fontSize;
		}
	}
	
	id familyObject = [fontDict objectForKey:@"fontFamily"];
	if ([familyObject isKindOfClass:[NSString class]])
	{
		self.family = familyObject;
		didChange = YES;
	}
	else if (inheritedFont!=nil && inheritedFont.family!=nil)
	{
		self.family = inheritedFont.family;
		didChange = YES;
	}


	NSString * fontWeightObject = [fontDict objectForKey:@"fontWeight"];
	if([fontWeightObject isKindOfClass:[NSString class]]){
		fontWeightObject = [fontWeightObject lowercaseString];
		if([fontWeightObject isEqualToString:@"bold"]){
			didChange |= !(self.isBoldWeight)||(self.isNormalWeight);
			self.isBoldWeight = YES;
			self.isNormalWeight = NO;
		} else if([fontWeightObject isEqualToString:@"normal"]){
			didChange |= (self.isBoldWeight)||!(self.isNormalWeight);
			self.isBoldWeight = NO;
			self.isNormalWeight = YES;
		}
	} else if((inheritedFont != NULL) && (fontWeightObject == nil)) {
		BOOL isBoldBool = inheritedFont.isBoldWeight;
		if(self.isBoldWeight != isBoldBool){
			didChange = YES;
			self.isBoldWeight = isBoldBool;
		}
		BOOL isNormalBool = inheritedFont.isNormalWeight;
		if(self.isNormalWeight != isNormalBool){
			didChange = YES;
			self.isNormalWeight = isNormalBool;
		}
	}
    
    NSString* fontStyleObject = [fontDict objectForKey:@"fontStyle"];
    if ([fontStyleObject isKindOfClass:[NSString class]]) {
        fontStyleObject = [fontStyleObject lowercaseString];
        if ([fontStyleObject isEqualToString:@"italic"]) {
            didChange |= !(self.isItalicStyle)||(self.isNormalStyle);
            self.isItalicStyle = YES;
            self.isNormalStyle = NO;
        }
        else if ([fontStyleObject isEqualToString:@"normal"]) {
            didChange |= (self.isItalicStyle)||!(self.isNormalStyle);
            self.isItalicStyle = NO;
            self.isNormalStyle = YES;
        }
    }
    else if ((inheritedFont != NULL) && (fontStyleObject == nil)) {
        BOOL isItalic = inheritedFont.isItalicStyle;
        if (self.isItalicStyle != isItalic) {
            didChange = YES;
            self.isItalicStyle = isItalic;
        }
        BOOL isNormal = inheritedFont.isNormalStyle;
        if (self.isNormalStyle != isNormal) {
            didChange = YES;
            self.isNormalStyle = isNormal;
        }
    }

	return didChange;
}


+(WebFont *)defaultBoldFont
{
	WebFont * result = [[self alloc] init];
	result.size = 15;
	result.isBoldWeight = YES;
	return [result autorelease];
}

+(WebFont *)defaultItalicFont
{
    WebFont * result = [[self alloc] init];
    result.size = 15;
    result.isItalicStyle = YES;
    return [result autorelease];
}


+(WebFont *)defaultFont
{
	WebFont * result = [[self alloc] init];
	result.size = 15;
	return [result autorelease];
}

+(WebFont *)fontWithName:(NSString*)name
{
	WebFont * result = [[self alloc] init];
	result.family = [name copy];
	result.size = 15;
	return [result autorelease];
}

+(WebFont *)tableRowFont
{
	WebFont * result = [[self alloc] init];
	result.isBoldWeight = YES;
	result.size = 20;
	return [result autorelease];
}

@end
