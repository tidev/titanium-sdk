//
//  ComplexTableViewCell.m
//  Titanium
//
//  Created by Blain Hamon on 11/4/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "ComplexTableViewCell.h"
#import "TitaniumCellWrapper.h"

@implementation ComplexTableViewCell

@synthesize dataWrapper;

- (id)initWithFrame:(CGRect)frame reuseIdentifier:(NSString *)reuseIdentifier;
{
	self = [super initWithFrame:frame reuseIdentifier:reuseIdentifier];
	if (self != nil){

	}
	return self;
}

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier {
    if (self = [super initWithStyle:style reuseIdentifier:reuseIdentifier]) {
        // Initialization code
    }
    return self;
}

- (void)setDataWrapper:(TitaniumCellWrapper *)newWrapper;
{
	if(newWrapper == dataWrapper)return;

	[dataWrapper removeObserver:self forKeyPath:@"jsonValues"];
	[newWrapper retain];
	[dataWrapper release];
	dataWrapper=newWrapper;
	[dataWrapper addObserver:self forKeyPath:@"jsonValues" options:NSKeyValueObservingOptionNew context:nil];
	[self setNeedsLayout];
	[self setNeedsDisplay];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context;
{
	[self setNeedsLayout];
	[self setNeedsDisplay];
}

- (void)layoutSubviews;
{
	NSLog(@"Laying out...");
	[super layoutSubviews];
}

- (void)drawRect:(CGRect)rect;
{
	NSLog(@"Drawing rect...(%f,%f),(%f,%f)",rect.origin.x,rect.origin.y,rect.size.width,rect.size.height);
	[super drawRect:rect];
}

- (void)setHighlighted:(BOOL)hilighted animated:(BOOL)animated;
{
	[super setHighlighted:hilighted animated:animated];
//	[self updateState:animated];
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated;
{
	[super setSelected:selected animated:animated];
//	[self updateState:animated];
}


- (void)dealloc {
	[self setDataWrapper:nil];
    [super dealloc];
}


@end
