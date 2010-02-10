/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiUITableViewCell.h"
#import "TiUITableViewRowProxy.h"
#import "TiTextLabel.h"
#import "LayoutEntry.h"
#import "Webcolor.h"
#import "TiUtils.h"

@implementation TiUITableViewCell

@synthesize proxy, tableStyle;

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier 
{
    if (self = [super initWithStyle:style reuseIdentifier:reuseIdentifier]) 
	{
		[self setUserInteractionEnabled:YES];
    }
    return self;
}

-(void)setProxy:(TiUITableViewRowProxy *)newProxy
{
	if (newProxy == proxy)
	{
		return;
	}
	
	[self retain];
	[proxy setModelDelegate:nil];

	NSMutableSet * oldKeys = nil;
	NSMutableSet * unchangedKeys = nil;
	NSDictionary * oldProperties = [proxy allProperties];
	NSDictionary * newProperties = [newProxy allProperties];

	for (NSString * thisKey in oldProperties)
	{
		id oldValue = [oldProperties objectForKey:thisKey];
		id newValue = [oldProperties objectForKey:thisKey];
		if (newValue == nil)
		{
			if (oldKeys == nil)
			{
				oldKeys = [[NSMutableSet alloc] initWithObjects:thisKey,nil];
			}
			else
			{
				[oldKeys addObject:thisKey];
			}
			continue;
		}

		if ([oldValue isEqual:newValue])
		{
			if (unchangedKeys == nil)
			{
				unchangedKeys = [[NSMutableSet alloc] initWithObjects:thisKey,nil];
			}
			else
			{
				[unchangedKeys addObject:thisKey];
			}
		}
	}
	
	for (NSString * thisKey in oldKeys)
	{
		SEL thisSelector = SetterForKrollProperty(thisKey);
		if ([self respondsToSelector:thisSelector])
		{
			[self performSelector:thisSelector withObject:nil];
		}
	}

	for (NSString * thisKey in newProperties)
	{
		if ([unchangedKeys containsObject:thisKey])
		{
			continue;
		}

		SEL thisSelector = SetterForKrollProperty(thisKey);
		if ([self respondsToSelector:thisSelector])
		{
			[self performSelector:thisSelector withObject:[newProperties objectForKey:thisKey]];
		}
	}

	[newProxy setModelDelegate:self];
	[self release];
	
	[proxy release];
	proxy = [newProxy retain];
}


-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)thisProxy
{
	if (thisProxy != proxy)
	{
		return;
	}
	DoProxyDelegateChangedValuesWithProxy(self, key, oldValue, newValue, proxy);
}

-(BOOL)isRepositionProperty:(NSString*)key
{
	return NO;
}

#pragma mark JS inpoints

-(void)setTitle_:(id)value
{
	NSString * newTitle = [TiUtils stringValue:value];
	UILabel * ourTextLabel = [self textLabel];
	[ourTextLabel setText:newTitle];
	[ourTextLabel setBackgroundColor:[UIColor clearColor]];
}

-(void)setImage_:(id)value
{
	UIImage * newImage = [TiUtils image:value proxy:[self proxy]];
	[[self imageView] setImage:newImage];
}


#pragma mark BUG BARRIER
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


#pragma mark TableCellView obligations

- (void)prepareForReuse;
{
	[super prepareForReuse];
	[self setUserInteractionEnabled:YES];
}

- (void)setHighlighted:(BOOL)hilighted animated:(BOOL)animated;
{
	[super setHighlighted:hilighted animated:animated];
//	[self updateState:hilighted animated:animated];
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated;
{
	[super setSelected:selected animated:animated];
//	[self updateState:selected animated:animated];
}



@end
