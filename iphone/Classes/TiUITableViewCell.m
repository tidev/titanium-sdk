/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiUITableViewCell.h"
#import "TiUITableViewCellProxy.h"
#import "TiTextLabel.h"
#import "LayoutEntry.h"
#import "Webcolor.h"
#import "TiUtils.h"

@implementation TiUITableViewCell

@synthesize proxy;

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier 
{
    if (self = [super initWithStyle:style reuseIdentifier:reuseIdentifier]) 
	{
		[self setUserInteractionEnabled:YES];
    }
    return self;
}

-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys
{
	DoProxyDelegateReadValuesWithKeysFromProxy(self, keys, proxy);
}

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy
{
	DoProxyDelegateChangedValuesWithProxy(self, key, oldValue, newValue, proxy);
}

-(BOOL)isRepositionProperty:(NSString*)key
{
	return NO;
}










#pragma mark BUG BARRIER


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
