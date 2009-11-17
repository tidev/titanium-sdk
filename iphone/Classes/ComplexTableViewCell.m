/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ComplexTableViewCell.h"
#import "TitaniumCellWrapper.h"
#import "TitaniumBlobWrapper.h"

#ifndef __IPHONE_3_0
typedef enum {
    UITableViewCellStyleDefault,	// Simple cell with text label and optional image view (behavior of UITableViewCell in iPhoneOS 2.x)
    UITableViewCellStyleValue1,		// Left aligned label on left and right aligned label on right with blue text (Used in Settings)
    UITableViewCellStyleValue2,		// Right aligned label on left with blue text and left aligned label on right (Used in Phone/Contacts)
    UITableViewCellStyleSubtitle	// Left aligned label on top and left aligned label on bottom with gray text (Used in iPod).
} UITableViewCellStyle;                 // available in iPhone 3.0

@interface UITableViewCell(futureProofeded)
- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier;
- (BOOL) isHighlighted;
@end

#endif

@implementation ComplexTableViewCell

@synthesize dataWrapper, clickedName;

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
- (void)flushBlobWatching;
{
	for (TitaniumBlobWrapper * thisBlob in watchedBlobs) {
		[thisBlob removeObserver:self forKeyPath:@"imageBlob"];
	}
	[watchedBlobs removeAllObjects];
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
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context;
{
	if(object==dataWrapper){
		[self setNeedsLayout];
	}

	if ([keyPath isEqualToString:@"imageBlob"]) {
		[object removeObserver:self forKeyPath:keyPath];
		[watchedBlobs removeObject:object];
		for (UIView * changedView in layoutViewsArray) {
			if (changedView == context) {
				[(UIImageView *)changedView setImage:[(TitaniumBlobWrapper *)object imageBlob]];
				return;
			}
		}
		NSLog(@"[WARN] Shouldn't happen. %@ notified us, but we didn't care.",object);
	}
}

- (void)layoutSubviews;
{
	[super layoutSubviews];

	[self setUserInteractionEnabled:YES];

	NSArray * layoutArray = [dataWrapper layoutArray];

	if(layoutViewsArray == nil){
		layoutViewsArray = [[NSMutableArray alloc] initWithCapacity:[layoutArray count]];
	} else {
		for (UIView * doomedView in layoutViewsArray) {
			[doomedView removeFromSuperview];
		}
		[layoutViewsArray removeAllObjects];
	}
	
	[self flushBlobWatching];
	
	CGRect boundRect;
	boundRect = [[self contentView] frame];

	BOOL useHilightColors = [self isSelected];
	
	if([self respondsToSelector:@selector(isHighlighted)]){
		useHilightColors = useHilightColors || [self isHighlighted];
	}
	
	for (LayoutEntry * thisEntry in layoutArray) {
		UIView * thisEntryView;
		NSString * name = [thisEntry nameString];

		switch ([thisEntry type]) {
			case LayoutEntryText:{
				thisEntryView = [[[UITextView alloc] initWithFrame:CGRectZero] autorelease];
				[(UITextView *)thisEntryView setEditable:NO];
				[thisEntryView setUserInteractionEnabled:NO];
				[(UITextView *)thisEntryView setText:[dataWrapper stringForKey:name]];
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
					[(UITextView *)thisEntryView setTextColor:textColor];
				} else {
					[(UITextView *)thisEntryView setTextColor:useHilightColors?[UIColor whiteColor]:[UIColor blackColor]];
				}
				
				[(UITextView *)thisEntryView setFont:[[thisEntry labelFontPointer] font]];
				
				break;}
			case LayoutEntryImage:{
				thisEntryView = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];

				UIImage * entryImage = [dataWrapper imageForKey:name];
				[(UIImageView *)thisEntryView setImage:entryImage];
				if (entryImage==nil) {
					TitaniumBlobWrapper * ourBlob = [dataWrapper blobWrapperForKey:name];
					if (ourBlob != nil) {
						if (watchedBlobs == nil) {
							watchedBlobs = [[NSMutableSet alloc] initWithObjects:ourBlob,nil];
						} else {
							[watchedBlobs addObject:ourBlob];
						}
						[ourBlob addObserver:self forKeyPath:@"imageBlob" options:NSKeyValueObservingOptionNew context:thisEntryView];
					}
				}
				
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
		[layoutViewsArray addObject:thisEntryView];
	}
	
}

//- (void)setHighlighted:(BOOL)hilighted animated:(BOOL)animated;
//{
//	[super setHighlighted:hilighted animated:animated];
////	[self updateState:animated];
//}
//
//- (void)setSelected:(BOOL)selected animated:(BOOL)animated;
//{
//	[super setSelected:selected animated:animated];
////	[self updateState:animated];
//}


- (void)dealloc {
	[self setDataWrapper:nil];
	[layoutViewsArray release];
	[self flushBlobWatching];
	[clickedName release];
	[watchedBlobs release];
    [super dealloc];
}

- (void) touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event;
{
	UITouch * anyTouch = [touches anyObject];
	int currentViewIndex = 0;
	for (UIView * thisView in layoutViewsArray) {
		CGPoint thisPoint;
		thisPoint = [anyTouch locationInView:thisView];
		if ([thisView pointInside:thisPoint withEvent:nil]) {
			LayoutEntry * thisEntry = [[dataWrapper layoutArray] objectAtIndex:currentViewIndex];
			[self setClickedName:[thisEntry nameString]];
			[super touchesEnded:touches withEvent:event];
			return;
		}
		currentViewIndex ++;
	}
	
	[self setClickedName:nil];
	[super touchesEnded:touches withEvent:event];
}


@end
