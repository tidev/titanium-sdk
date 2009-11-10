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

//- (void) applyDictionary: (NSDictionary *) layoutDict toText: (UILabel *) 


- (void)setDataWrapper:(TitaniumCellWrapper *)newWrapper;
{
	if(newWrapper == dataWrapper)return;

	[dataWrapper removeObserver:self forKeyPath:@"jsonValues"];
	[newWrapper retain];
	[dataWrapper release];
	dataWrapper=newWrapper;
	[dataWrapper addObserver:self forKeyPath:@"jsonValues" options:NSKeyValueObservingOptionNew context:nil];
	[self setNeedsLayout];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context;
{
	[self setNeedsLayout];
}

- (void)layoutSubviews;
{
	NSArray * layoutArray = [dataWrapper layoutArray];

	if(layoutViewsArray == nil){
		layoutViewsArray = [[NSMutableArray alloc] initWithCapacity:[layoutArray count]];
	} else {
		for (UIView * doomedView in layoutViewsArray) {
			[doomedView removeFromSuperview];
		}
		[layoutViewsArray removeAllObjects];
	}
	
	CGRect boundRect;
	boundRect = [[self contentView] frame];

	BOOL useHilightColors = [self isSelected] || [self isHighlighted];

	
	for (LayoutEntry * thisEntry in layoutArray) {
		UIView * thisEntryView;
		NSString * name = [thisEntry nameString];

		switch ([thisEntry type]) {
			case LayoutEntryText:{
				thisEntryView = [[[UILabel alloc] initWithFrame:CGRectZero] autorelease];
				[(UILabel *)thisEntryView setText:[dataWrapper stringForKey:name]];
				UIColor * textColor = nil;
				if (useHilightColors) {
					textColor = [thisEntry selectedTextColor];
				}
				if (textColor == nil) {
					textColor = [thisEntry textColor];
				}
				if (useHilightColors && (textColor == nil)) {
					textColor = [dataWrapper colorForKey:@"selectedColor"];
				}
				if (textColor == nil) {
					textColor = [dataWrapper colorForKey:@"color"];
				}
				if (textColor != nil) {
					[(UILabel *)thisEntryView setTextColor:textColor];
				} else {
					[(UILabel *)thisEntryView setTextColor:useHilightColors?[UIColor whiteColor]:[UIColor blackColor]];
				}
				
				break;}
			case LayoutEntryImage:{
				thisEntryView = [[[TitaniumImageView alloc] initWithFrame:CGRectZero] autorelease];
				[(TitaniumImageView *)thisEntryView setDelegate:self];
				UIImage * entryImage = [dataWrapper imageForKey:name];
				[(TitaniumImageView *)thisEntryView setImage:entryImage];
				
				break;}
			case LayoutEntryButton:{
				thisEntryView = nil;
				break;}
			default:
				continue;
		}
		
		[thisEntryView setBackgroundColor:[UIColor clearColor]];
		LayoutConstraint thisConstraint = [thisEntry constraint];
		
		ApplyConstraintToViewWithinViewWithBounds(&thisConstraint, thisEntryView, self, boundRect);
	}
	
	

	NSLog(@"Laying out...");
	[super layoutSubviews];
}

//- (void)drawRect:(CGRect)rect;
//{
//	NSLog(@"Drawing rect...(%f,%f),(%f,%f)",rect.origin.x,rect.origin.y,rect.size.width,rect.size.height);
//
//	UIColor * blueColor = [UIColor blueColor];
//	[blueColor set];
//	UIRectFill(rect);
//
//
//	[super drawRect:rect];
//}

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


- (void) imageView: (TitaniumImageView *)touchedImage touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event;
{
//	[self 
}


@end
