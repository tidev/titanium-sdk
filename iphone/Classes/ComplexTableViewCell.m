/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ComplexTableViewCell.h"
#import "TitaniumCellWrapper.h"
#import "TitaniumBlobWrapper.h"

#import "Logging.h"

@interface TitaniumTextLabel : UIView
{
	UIFont * font;
	UIColor * textColor;
	UIColor * highlightedTextColor;
	BOOL highlighted;
	NSString * text;
	UITextAlignment textAlignment;
}

@property(nonatomic,readwrite,retain)	UIFont * font;
@property(nonatomic,readwrite,retain)	UIColor * textColor;
@property(nonatomic,readwrite,retain)	NSString * text;

@property(nonatomic,retain)               UIColor *highlightedTextColor; // default is nil
@property(nonatomic,getter=isHighlighted) BOOL     highlighted;          // default is NO
@property(nonatomic)        UITextAlignment textAlignment;   // default is UITextAlignmentLeft

@end

@implementation TitaniumTextLabel
@synthesize font,textColor,text,highlightedTextColor,highlighted,textAlignment;

- (id)initWithFrame:(CGRect)frame;          // default initializer
{
	self = [super initWithFrame:frame];
	if (self != nil) {
		[self setOpaque:NO];
	}
	return self;
}

- (void)drawRect:(CGRect)rect;
{
	if(highlighted){
		[highlightedTextColor set];
	} else {
		[textColor set];
	}
	
	[text drawInRect:[self bounds] withFont:font lineBreakMode:UILineBreakModeTailTruncation alignment:textAlignment];
}

- (void) dealloc
{
	[text release];
	[textColor release];
	[highlightedTextColor release];
	[font release];
	[super dealloc];
}


@end








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
		[self setUserInteractionEnabled:YES];
	}
	return self;
}

- (void)prepareForReuse;                                                        // if the cell is reusable (has a reuse identifier), this is called just before the cell is returned from the table view method dequeueReusableCellWithIdentifier:.  If you override, you MUST call super.
{
	[super prepareForReuse];
	lastLayoutArray = nil;
	[self setUserInteractionEnabled:YES];
}

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier {
    if (self = [super initWithStyle:style reuseIdentifier:reuseIdentifier]) {
		[self setUserInteractionEnabled:YES];
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
		VERBOSE_LOG(@"[INFO] %@ is removing blob %@. %@",self,object,watchedBlobs);
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

- (void) applyImageNamed: (NSString *) name toView: (UIImageView *) view;
{
	UIImage * entryImage = [dataWrapper imageForKey:name];
	[view setImage:entryImage];
	if (entryImage==nil) {
		TitaniumBlobWrapper * ourBlob = [dataWrapper blobWrapperForKey:name];
		if (ourBlob != nil) {
			VERBOSE_LOG(@"[INFO] %@ is watching blob %@. %@",self,ourBlob,watchedBlobs);
			if (watchedBlobs == nil) {
				watchedBlobs = [[NSMutableSet alloc] initWithObjects:ourBlob,nil];
			} else {
				[watchedBlobs addObject:ourBlob];
			}
			[ourBlob addObserver:self forKeyPath:@"imageBlob" options:NSKeyValueObservingOptionNew context:view];
		}
	}
}


- (void)layoutSubviews;
{
	[super layoutSubviews];

	BOOL useHilightColors = [self isSelected];
	
	if([self respondsToSelector:@selector(isHighlighted)]){
		useHilightColors = useHilightColors || [self isHighlighted];
	}
	
	NSArray * layoutArray = [dataWrapper layoutArray];
	[self flushBlobWatching];

	if(layoutArray == lastLayoutArray){ //Okay, everyone's still in position!
		NSEnumerator * viewEnumerator = [layoutViewsArray objectEnumerator];
		
		for (LayoutEntry * thisEntry in layoutArray) {
			UIView * thisEntryView = [viewEnumerator nextObject];
			NSString * name = [thisEntry nameString];

			if([thisEntryView isKindOfClass:[UIImageView class]]){
				[self applyImageNamed:name toView:(UIImageView *)thisEntryView];
				continue;
			}
			if([thisEntryView isKindOfClass:[TitaniumTextLabel class]]){
				[(TitaniumTextLabel *)thisEntryView setText:[dataWrapper stringForKey:name]];
				[(TitaniumTextLabel *)thisEntryView setHighlighted:useHilightColors];
				[thisEntryView setNeedsDisplay];
				continue;
			}
		}
		return;
	}

	lastLayoutArray = layoutArray;

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
		
	for (LayoutEntry * thisEntry in layoutArray) {
		UIView * thisEntryView;
		NSString * name = [thisEntry nameString];

		switch ([thisEntry type]) {
			case LayoutEntryText:{
				thisEntryView = [[[TitaniumTextLabel alloc] initWithFrame:CGRectZero] autorelease];

				[(TitaniumTextLabel *)thisEntryView setText:[dataWrapper stringForKey:name]];
				[(TitaniumTextLabel *)thisEntryView setHighlighted:useHilightColors];
				[(TitaniumTextLabel *)thisEntryView setTextAlignment:[thisEntry textAlign]];

				UIColor * thisTextColor = [thisEntry textColor];
				UIColor * thisHighlightedTextColor = [thisEntry selectedTextColor];
				if(thisHighlightedTextColor == nil) thisHighlightedTextColor = thisTextColor;


				if(thisHighlightedTextColor == nil) thisHighlightedTextColor = [dataWrapper colorForKey:@"selectedColor"];

				if (thisTextColor == nil) thisTextColor = [dataWrapper colorForKey:@"color"];
				if(thisHighlightedTextColor == nil) thisHighlightedTextColor = thisTextColor;

				if (thisTextColor == nil) thisTextColor = [UIColor blackColor];
				if(thisHighlightedTextColor == nil) thisHighlightedTextColor = [UIColor whiteColor];

				[(TitaniumTextLabel *)thisEntryView setTextColor:thisTextColor];
				[(TitaniumTextLabel *)thisEntryView setHighlightedTextColor:thisHighlightedTextColor];
				
				[(TitaniumTextLabel *)thisEntryView setFont:[[thisEntry labelFontPointer] font]];
				
				break;}
			case LayoutEntryImage:{
				thisEntryView = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
				[self applyImageNamed:name toView:(UIImageView *)thisEntryView];				
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
			VERBOSE_LOG(@"[DEBUG] Touches ended for %X name %@",self,clickedName);
			[super touchesEnded:touches withEvent:event];
			return;
		}
		currentViewIndex ++;
	}
	
	[self setClickedName:nil];
	VERBOSE_LOG(@"[DEBUG] Touches ended for %X no name",self);
	[super touchesEnded:touches withEvent:event];
}


@end
