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

	
	NSString * selectionStyleString = [self stringForKey:@"selectionStyle"];
	if([selectionStyleString isEqualToString:@"none"])
	{
		[result setSelectionStyle:UITableViewCellSelectionStyleNone];
	} 
	else if ([selectionStyleString isEqualToString:@"gray"])
	{
		[result setSelectionStyle:UITableViewCellSelectionStyleGray];
	} 
	else 
	{
		[result setSelectionStyle:UITableViewCellSelectionStyleBlue];
	}
	
	
	UIColor * backgroundColor = [self colorForKey:@"backgroundColor"];
	UIColor * selectedBgColor = [self colorForKey:@"selectedBackgroundColor"];
	
	UIImage * bgImage = [self stretchableImageForKey:@"backgroundImage"];
	UIImage	* selectedBgImage = [self stretchableImageForKey:@"selectedBackgroundImage"];
	
	
	if (([tableView style] == UITableViewStyleGrouped) && (bgImage == nil))
	{
		if (backgroundColor != nil)
		{
			[result setBackgroundColor:backgroundColor];
		}
		else 
		{
			[result setBackgroundColor:[UIColor whiteColor]];
		}
	} 
	else 
	{
		UIImageView * bgView = (UIImageView *)[result backgroundView];
		if (![bgView isKindOfClass:[UIImageView class]])
		{
			bgView = [[[UIImageView alloc] initWithFrame:[result bounds]] autorelease];
			[bgView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
			[result setBackgroundView:bgView];
		}
		[bgView setImage:bgImage];
		[bgView setBackgroundColor:(backgroundColor==nil)?[UIColor clearColor]:backgroundColor];
	}
	
	if ((selectedBgColor == nil) && (selectedBgImage == nil))
	{
		[result setSelectedBackgroundView:nil];
	} 
	else 
	{
		UIImageView * selectedBgView = (UIImageView *)[result selectedBackgroundView];
		if (![selectedBgView isKindOfClass:[UIImageView class]])
		{
			selectedBgView = [[[UIImageView alloc] initWithFrame:[result bounds]] autorelease];
			[selectedBgView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
			[result setSelectedBackgroundView:selectedBgView];
		}
		
		[selectedBgView setImage:selectedBgImage];
		[selectedBgView setBackgroundColor:(selectedBgColor==nil)?[UIColor clearColor]:selectedBgColor];
	}

	
	return result;
}

#pragma mark BUG BARRIER







@synthesize jsonValues, templateCell, fontDesc;
//@synthesize inputProxy;
@synthesize isButton;
@synthesize layoutArray, imageKeys;
@synthesize rowHeight, minRowHeight, maxRowHeight;

- (id) init
{
	if (self = [super init]) 
	{
		fontDesc = [[WebFont defaultBoldFont] retain];
	}
	return self;
}

- (void) dealloc
{
	RELEASE_TO_NIL(fontDesc);
	RELEASE_TO_NIL(imageKeys);
	RELEASE_TO_NIL(layoutArray);
	RELEASE_TO_NIL(templateCell);
	RELEASE_TO_NIL(imagesCache);
	RELEASE_TO_NIL(jsonValues);
	[super dealloc];
}

- (UIColor *) colorForKey:(NSString *) key
{
	id result = [jsonValues objectForKey:key];
	
	//Okay, if it's blank, we default to the template. If there is no template, we get nil anyways.
	if(result == nil) return [templateCell colorForKey:key];
	
	return UIColorWebColorNamed(result);
}

- (NSString *) stringForKey: (NSString *) key
{
	return [TiUtils stringValue:key properties:jsonValues def:[templateCell stringForKey:key]];
}

- (UIImage *) imageForKey: (NSString *) key
{
	id result = [imagesCache objectForKey:key];
	
	//Okay, if it's blank, we default to the template. If there is no template, we get nil anyways.
	if(result == nil) 
	{
		return [templateCell imageForKey:key];
	}
	
	if([result isKindOfClass:[NSURL class]])
	{
		UIImage *resultImage = [[ImageLoader sharedLoader] loadImmediateImage:result];
		if(resultImage != nil) 
		{
			return resultImage;
		}
	}
	
	//If it's NSNull, then we want nil.
	return nil;
}

- (UIImage *) stretchableImageForKey: (NSString *) key
{
	id result = [imagesCache objectForKey:key];
	
	//Okay, if it's blank, we default to the template. If there is no template, we get nil anyways.
	if(result == nil) 
	{
		return [templateCell stretchableImageForKey:key];
	}
	
	if([result isKindOfClass:[NSURL class]])
	{
		UIImage *resultImage = [[ImageLoader sharedLoader] loadImmediateStretchableImage:result];
		if(resultImage != nil)
		{
			return resultImage;
		}
	}
	
	//If it's NSNull, then we want nil.
	return nil;
}

- (NSMutableArray *) layoutArray
{
	if(layoutArray == nil)
	{
		return [templateCell layoutArray];
	}
	if(![layoutArray isKindOfClass:[NSArray class]])
	{
		return nil;
	}
	return layoutArray;
}

- (NSString *) title
{
	return [self stringForKey:@"title"];
}

- (NSString *) html
{
	return [self stringForKey:@"html"];
}

- (NSString *) name
{
	return [self stringForKey:@"name"];
}

- (NSString *) value
{
	return [self stringForKey:@"value"];
}

- (UIImage *) image
{
	return [self imageForKey:@"image"];
}

- (UIFont *) font
{
	return [fontDesc font];
}

- (UITableViewCellAccessoryType) accessoryType
{
	if ([TiUtils boolValue:@"hasDetail" properties:jsonValues])
	{
		return UITableViewCellAccessoryDetailDisclosureButton;
	}
	if ([TiUtils boolValue:@"hasChild" properties:jsonValues])
	{
		return UITableViewCellAccessoryDisclosureIndicator;
	}
	if ([TiUtils boolValue:@"selected" properties:jsonValues])
	{
		return UITableViewCellAccessoryCheckmark;
	}
	return UITableViewCellAccessoryNone;
}

- (void) setAccessoryType:(UITableViewCellAccessoryType) newType
{
	NSNumber * falseNum = [NSNumber numberWithBool:NO];
	
	[jsonValues setObject:((newType==UITableViewCellAccessoryDetailDisclosureButton)?
						   [NSNumber numberWithBool:YES]:falseNum) forKey:@"hasDetail"];
	
	[jsonValues setObject:((newType==UITableViewCellAccessoryDisclosureIndicator)?
						   [NSNumber numberWithBool:YES]:falseNum) forKey:@"hasChild"];
	
	[jsonValues setObject:((newType==UITableViewCellAccessoryCheckmark)?
						   [NSNumber numberWithBool:YES]:falseNum) forKey:@"selected"];
	
}

- (void) noteImage: (NSString *)key fromProxy: (TiProxy *) proxy
{
	id oldImageEntry = [imagesCache objectForKey:key];
	id jsonEntry = [jsonValues objectForKey:key];
	
	//Okay, first make sure we don't already have this.
	
	//First check to see if they're both null, or both the same datablob.
	if(oldImageEntry==jsonEntry)
	{
		return;
	}
	
	//Okay, try it being a relative string.
	if ([jsonEntry isKindOfClass:[NSString class]]) 
	{
		NSURL * newImageUrl = [TiUtils toURL:jsonEntry proxy:proxy];
		if([newImageUrl isEqual:oldImageEntry])
		{
			return;
		}
		//Okay, this is a new url. Update it.
		[imagesCache setObject:newImageUrl forKey:key];
		return;
		
	}
	
	if(jsonEntry == [NSNull null])
	{
		[imagesCache setObject:[NSNull null] forKey:key];
		return;
	}
	
	//No image!
	[imagesCache removeObjectForKey:key];
}

- (void) useProperties: (NSDictionary *) propDict withProxy: (TiProxy *) proxy;
{
	Class dictClass = [NSDictionary class];
	
	if(propDict!=jsonValues)
	{
		[self willChangeValueForKey:@"jsonValues"];
		if (jsonValues != nil) 
		{
			[jsonValues removeAllObjects];
			[jsonValues addEntriesFromDictionary:propDict];
		} 
		else 
		{
			jsonValues = [propDict mutableCopy];
		}
		[self didChangeValueForKey:@"jsonValues"];
	}
	
	[fontDesc updateWithDict:propDict inherits:[templateCell fontDesc]];


	NSArray * newlayoutArray = [propDict objectForKey:@"layout"];
	if ([newlayoutArray isKindOfClass:[NSArray class]]) 
	{
		//Because Complex TableViewCell caches the layout based on the actual int value, we need to flush the old one.
		[self willChangeValueForKey:@"layoutArray"];
		[layoutArray release];
		layoutArray = [[NSMutableArray alloc] initWithCapacity:[newlayoutArray count]];
		
		if (imageKeys == nil) 
		{
			imageKeys = [[NSMutableSet alloc] init];
		} 
		else 
		{
			[imageKeys removeAllObjects];
		}		
		
		NSEnumerator * templateEntryEnumerator = [[templateCell layoutArray] objectEnumerator];

		for (NSDictionary * thisLayoutDict in newlayoutArray) 
		{
			LayoutEntry * templateEntry = [templateEntryEnumerator nextObject];
			if(![thisLayoutDict isKindOfClass:dictClass])
			{
				continue;
			}
			LayoutEntry * thisLayout = [[LayoutEntry alloc] initWithDictionary:thisLayoutDict
																	inheriting:templateEntry];
			if(thisLayout==nil)
			{
				continue;
			}
			[layoutArray addObject:thisLayout];
			
			LayoutEntryType	thisType = [thisLayout type];
			switch (thisType) 
			{
				case LayoutEntryImage:
				{
					[imageKeys addObject:[thisLayout nameString]];
					break;
				}
				case LayoutEntryText:
				{
					WebFont * entryFont = [thisLayout labelFont];
					if(entryFont.isSizeNotSet)
					{
						entryFont.size = fontDesc.size;
					}
					break;
				}
			}
			[thisLayout release];
		}
		[self didChangeValueForKey:@"layoutArray"];

	} 
	else 
	{
		[self willChangeValueForKey:@"layoutArray"];
		[layoutArray release];		
		NSMutableSet * templateKeys;
		if (newlayoutArray==(id)[NSNull null]) 
		{
			layoutArray = (id)[NSNull null];
			templateKeys = nil;
		} 
		else 
		{
			layoutArray = nil;
			templateKeys = [templateCell imageKeys];
		}
		[self didChangeValueForKey:@"layoutArray"];
		
		if(templateKeys == nil)
		{
			if (imageKeys == nil)
			{
				imageKeys = [[NSMutableSet alloc] initWithObjects:@"image",nil];
			} 
			else 
			{
				[imageKeys removeAllObjects];
				[imageKeys addObject:@"image"];
			}
		} 
		else 
		{
			[imageKeys release];
			imageKeys = [templateKeys mutableCopy];
		}
	}

	[imageKeys addObject:@"backgroundImage"];
	[imageKeys addObject:@"selectedBackgroundImage"];
	
	NSArray * oldKeys = [imagesCache allKeys];
	for (NSString * thisKey in oldKeys) 
	{
		if([imageKeys containsObject:thisKey])
		{
			continue;
		}
		[imagesCache removeObjectForKey:thisKey];
	}
	
	if (imagesCache==nil) 
	{
		[self willChangeValueForKey:@"imagesCache"];
		imagesCache = [[NSMutableDictionary alloc] init];
		[self didChangeValueForKey:@"imagesCache"];
	}
	
	
	for (NSString * thisKey in imageKeys) 
	{
		[self noteImage:thisKey fromProxy:proxy];
	}
	
	isButton = [[TiUtils stringValue:@"type" properties:propDict] isEqualToString:@"button"];
	[self setRowHeight:[TiUtils dimensionValue:@"rowHeight" properties:propDict def:TiDimensionUndefined]];
	[self setMinRowHeight:[TiUtils dimensionValue:@"rowMinHeight" properties:propDict def:TiDimensionUndefined]];
	[self setMaxRowHeight:[TiUtils dimensionValue:@"rowMaxHeight" properties:propDict def:TiDimensionUndefined]];
	
/*	TODO: Reenable this.
 
	NSDictionary * inputProxyDict = [propDict objectForKey:@"input"]; 
	if ([inputProxyDict isKindOfClass:dictClass]){
		UiModule * theUiModule = (UiModule *)[[TitaniumHost sharedHost] moduleNamed:@"UiModule"];
		NativeControlProxy * thisInputProxy = [theUiModule proxyForObject:inputProxyDict scan:YES recurse:YES];
		if (thisInputProxy != nil) [self setInputProxy:thisInputProxy];
	} else [self setInputProxy:nil];
*/
}

- (BOOL) stringForKey:(NSString *)key containsString: (NSString *)matchString
{
	NSString * valueString = [self stringForKey:key];
	if(valueString == nil) 
	{
		return NO;
	}
	NSRange matchLocation = [valueString rangeOfString:matchString options:
							 NSCaseInsensitiveSearch|NSDiacriticInsensitiveSearch|NSWidthInsensitiveSearch];
	return matchLocation.location != NSNotFound;
}

+ cellDataWithProperties:(NSDictionary *)properties proxy:(TiProxy *)proxy font:(WebFont *)defaultFont template:(TiUITableViewCellProxy *)templateCell
{
	if(properties==nil)
	{
		return nil;
	}
	
	TiUITableViewCellProxy * result = [[TiUITableViewCellProxy alloc] _initWithPageContext:[proxy pageContext]];
	[result setFontDesc:defaultFont];
	[result setTemplateCell:templateCell];
	[result useProperties:properties withProxy:self];
	return [result autorelease];
}

- (float) contentWidthForTable:(UITableView *)tableView
{
	UITableViewStyle style = [tableView style];
	CGFloat rowWidth = [tableView bounds].size.width;
	
	//Because of various elements, the usable row width will be smaller.
	if(style == UITableViewStyleGrouped)
	{
		rowWidth -= 20; //Grouped views have a margin of 10 on each side.
	}
	
	//If we have an accessory view
	// rowWidth -= view.frame.size.width-3
	//Else
	switch ([self accessoryType])
	{
		case UITableViewCellAccessoryDetailDisclosureButton:
		{
			rowWidth -= 32;
			if (style == UITableViewStylePlain) //For some reason, plain removes an extra pixel.
			{
				rowWidth--;
			}
			break;
		}
		case UITableViewCellAccessoryDisclosureIndicator:
		case UITableViewCellAccessoryCheckmark:
		{
			rowWidth -= 19;
			if (style == UITableViewStylePlain) //For some reason, plain removes an extra pixel.
			{
				rowWidth--;
			}
			break;
		}
	}
	
	//TODO: When we support editing, to handle the indentation that will occur.
	return rowWidth;
}

#define ADD_VALUE_IF_PIXELS(accumulator,dimension)	\
if (TiDimensionIsPixels(dimension)) \
{ \
	accumulator += dimension.value; \
}

- (float) computedAutoHeightForTable:(UITableView *)tableView
{
	NSArray * effectiveLayoutArray = [self layoutArray];
	if([effectiveLayoutArray count]<1)
	{
		return TI_NAVBAR_HEIGHT;
	}

	CGFloat rowWidth=[self contentWidthForTable:tableView];
	
	float result = 0;
	for (LayoutEntry * thisEntry in effectiveLayoutArray)
	{
		float thisEntryRequiredHeight = 0;
		LayoutConstraint * thisEntryLayout = [thisEntry constraintPointer];
		ADD_VALUE_IF_PIXELS(thisEntryRequiredHeight,thisEntryLayout->top);
		ADD_VALUE_IF_PIXELS(thisEntryRequiredHeight,thisEntryLayout->bottom);

		if([thisEntry type] == LayoutEntryText)
		{
			switch (thisEntryLayout->height.type) 
			{
				case TiDimensionTypePixels:
				{
					thisEntryRequiredHeight += thisEntryLayout->height.value;
					break;
				}
				case TiDimensionTypeAuto:
				{
					float thisEntryWidth = WidthFromConstraintGivenWidth(thisEntryLayout,rowWidth);
					UIFont * thisEntryFont = [[thisEntry labelFont] font];
					NSString * thisEntryString = [self stringForKey:[thisEntry nameString]];
					CGSize testSize = [thisEntryString sizeWithFont:thisEntryFont constrainedToSize:CGSizeMake(thisEntryWidth, 1e5)];
					thisEntryRequiredHeight += testSize.height;					
					break;
				}
				default:
				{
					if([[self stringForKey:[thisEntry nameString]] length]>0)
					{
						thisEntryRequiredHeight += [[thisEntry labelFont] size];
					}
					break;
				}
			}
		} 
		else 
		{
			ADD_VALUE_IF_PIXELS(thisEntryRequiredHeight,thisEntryLayout->height);
		}

		if (result < thisEntryRequiredHeight)
		{
			result = thisEntryRequiredHeight;
		}
	}
	return result;
}





@end
