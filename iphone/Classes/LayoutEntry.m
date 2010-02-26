/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "LayoutEntry.h"
#import "Webcolor.h"
#import "WebFont.h"


@implementation LayoutEntry

@synthesize type,constraint,labelFont,textColor,nameString,selectedTextColor,textAlign;

- (id) initWithDictionary: (NSDictionary *) inputDict inheriting: (LayoutEntry *) inheritance;
{
	if (self = [super init]) 
	{
		NSString * typeString = [inputDict objectForKey:@"type"];
		if(typeString != nil) 
		{
			inheritance=nil;
		}
		
		if(inheritance != nil)
		{
			type = [inheritance type];
		} 
		else if([@"text" isEqual:typeString])
		{
			type = LayoutEntryText;
		} 
		else if ([@"image" isEqual:typeString]) 
		{
			type = LayoutEntryImage;
		} 
		else if ([@"button" isEqual:typeString]) 
		{
			type = LayoutEntryButton;
		} 
		else 
		{
			[self release];
			return nil;
		}
		
		labelFont = [[WebFont alloc]init];
		
		NSString * alignmentString = [inputDict objectForKey:@"textAlign"];
		if([alignmentString isKindOfClass:[NSString class]])
		{
			alignmentString = [alignmentString lowercaseString];
			if ([alignmentString isEqualToString:@"left"])
			{
				textAlign=UITextAlignmentLeft;
			}
			else if ([alignmentString isEqualToString:@"center"])
			{
				textAlign=UITextAlignmentCenter;
			}
			else if ([alignmentString isEqualToString:@"right"])
			{
				textAlign=UITextAlignmentRight;
			}
		} 
		else if(alignmentString == nil)
		{
			textAlign=[inheritance textAlign];
		}
		
		NSString * possibleName = [inputDict objectForKey:@"name"];
		if([possibleName isKindOfClass:[NSString class]])
		{
			[self setNameString:possibleName];
		}
		else if(inheritance!=nil)
		{
			[self setNameString:[inheritance nameString]];
		}
		
		ReadConstraintFromDictionary(&constraint, inputDict);
		[labelFont updateWithDict:inputDict inherits:[inheritance labelFont]];
		
		NSString * newTextColor = [inputDict objectForKey:@"color"];
		if(newTextColor == nil)
		{
			[self setTextColor:[inheritance textColor]];
		}
		else 
		{
			[self setTextColor:UIColorWebColorNamed(newTextColor)];
		}
		
		NSString * newSelectedTextColor = [inputDict objectForKey:@"selectedColor"];
		if(newSelectedTextColor == nil)
		{
			[self setSelectedTextColor:[inheritance selectedTextColor]];
		}
		else 
		{
			[self setSelectedTextColor:UIColorWebColorNamed(newSelectedTextColor)];
		}
	}
	return self;
}

- (void) dealloc
{
	RELEASE_TO_NIL(labelFont);
	RELEASE_TO_NIL(textColor);
	RELEASE_TO_NIL(nameString);
	RELEASE_TO_NIL(selectedTextColor);
	[super dealloc];
}

- (LayoutConstraint *) constraintPointer;
{
	return &constraint;
}


@end
