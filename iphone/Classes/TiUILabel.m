/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUILabel.h"
#import "TiUILabelProxy.h"
#import "TiUtils.h"
#import "UIImage+Resize.h"

@implementation TiUILabel

#pragma mark Internal

-(id)init
{
    if (self = [super init]) {
        padding = CGRectZero;
    }
    return self;
}

-(void)dealloc
{
    RELEASE_TO_NIL(label);
    RELEASE_TO_NIL(backgroundView);
    [super dealloc];
}

- (BOOL)interactionDefault
{
	// by default, labels don't have any interaction unless you explicitly add
	// it via addEventListener
	return NO;
}

-(CGSize)sizeForFont:(CGFloat)suggestedWidth
{
	NSString *value = [label text];
	UIFont *font = [label font];
	CGSize maxSize = CGSizeMake(suggestedWidth<=0 ? 480 : suggestedWidth, 1000);
	requiresLayout = YES;
	CGSize result = [value sizeWithFont:font constrainedToSize:maxSize lineBreakMode:UILineBreakModeTailTruncation];
	int height = ceil(result.height);
	int width = ceil(result.width);
	if (height & 0x01)
	{
		height ++;
	}
	if (width & 0x01)
	{
		width ++;
	}
	return CGSizeMake(width, height);
}

-(CGFloat)autoWidthForWidth:(CGFloat)suggestedWidth
{
	return [self sizeForFont:suggestedWidth].width;
}

-(CGFloat)autoHeightForWidth:(CGFloat)width
{
	return [self sizeForFont:width].height;
}

-(void)padLabel
{
	return;
}

//	Sadly, there was a brilliant solution for fixing the blurring here, but it turns out there's a 
//	quicker fix: Make sure the label itself has an even height and width. Everything else is irrelevant.

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	int height = floor(bounds.size.height);
	int width = floor(bounds.size.width);
	CGRect labelFrame;
	labelFrame.origin = bounds.origin;
	labelFrame.size.height = height & ~0x01;
	labelFrame.size.width = width & ~0x01;
	[label setFrame:labelFrame];
}

-(UILabel*)label
{
	if (label==nil)
	{
        label = [[UILabel alloc] initWithFrame:CGRectZero];
        label.backgroundColor = [UIColor clearColor];
        label.numberOfLines = 0;
        [self addSubview:label];
	}
	return label;
}

-(void)setHighlighted:(BOOL)newValue
{
	[[self label] setHighlighted:newValue];
}

-(BOOL)isHighlighted
{
	return [[self label] isHighlighted];
}

#pragma mark Public APIs

-(void)setText_:(id)text
{
	[[self label] setText:[TiUtils stringValue:text]];
	if (requiresLayout)
	{
		[(TiViewProxy *)[self proxy] setNeedsReposition];
	}
	else
	{
		[(TiViewProxy *)[self proxy] setNeedsRepositionIfAutoSized];
	}

}

-(void)setColor_:(id)color
{
	[[self label] setTextColor:[[TiUtils colorValue:color] _color]];
}

-(void)setHighlightedColor_:(id)color
{
	[[self label] setHighlightedTextColor:[[TiUtils colorValue:color] _color]];
}

-(void)setFont_:(id)font
{
	[[self label] setFont:[[TiUtils fontValue:font] font]];
	if (requiresLayout)
	{
		[(TiViewProxy *)[self proxy] setNeedsReposition];
	}
}

-(void)setMinimumFontSize_:(id)size
{
    CGFloat newSize = [TiUtils floatValue:size];
    if (newSize < 4) { // Beholden to 'most minimum' font size
        [[self label] setAdjustsFontSizeToFitWidth:NO];
        [[self label] setMinimumFontSize:0.0];
        [[self label] setNumberOfLines:0];
    }
    else {
        [[self label] setNumberOfLines:1];
        [[self label] setAdjustsFontSizeToFitWidth:YES];
        [[self label] setMinimumFontSize:newSize];
    }
    
}

-(void)setBackgroundImage_:(id)url
{
    if (url != nil) {
        UIImage* bgImage = [UIImageResize resizedImage:self.frame.size 
                                  interpolationQuality:kCGInterpolationDefault
                                                 image:[self loadImage:url]];
        
        // Resizing doesn't preserve stretchability.  Should we maybe fix this?
        bgImage = [self loadImage:url];
        if (backgroundView == nil) {
            backgroundView = [[UIImageView alloc] initWithImage:bgImage];
            backgroundView.userInteractionEnabled = NO;
            backgroundView.contentMode = UIViewContentModeRedraw;
            
            [label removeFromSuperview];
            [backgroundView addSubview:label];
            [self addSubview:backgroundView];
            
            repad = YES;
            [self padLabel];
        }
        else {
            backgroundView.image = bgImage;
            [backgroundView setNeedsDisplay];
            
            repad = YES;
            [self padLabel];
        }
    }
    else {
        if (backgroundView) {
            [label removeFromSuperview];
            [backgroundView removeFromSuperview];
            [self addSubview:label];
            RELEASE_TO_NIL(backgroundView);
        }
    }
    
    self.backgroundImage = url;
}

-(void)setBackgroundPaddingLeft_:(id)left
{
    padding.origin.x = [TiUtils floatValue:left];
    repad = YES;
    [self padLabel];
}

-(void)setBackgroundPaddingRight_:(id)right
{
    padding.size.width = [TiUtils floatValue:right];
    repad = YES;
    [self padLabel];
}

-(void)setBackgroundPaddingTop_:(id)top
{
    padding.origin.y = [TiUtils floatValue:top];
    repad = YES;
    [self padLabel];
}

-(void)setBackgroundPaddingBottom_:(id)bottom
{
    padding.size.height = [TiUtils floatValue:bottom];
    repad = YES;
    [self padLabel];
}

-(void)setTextAlign_:(id)alignment
{
	[[self label] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
}

-(void)setShadowColor_:(id)color
{
	if (color==nil)
	{
		[[self label] setShadowColor:nil];
	}
	else
	{
		color = [TiUtils colorValue:color];
		[[self label] setShadowColor:[color _color]];
	}
}

-(void)setShadowOffset_:(id)value
{
	CGPoint p = [TiUtils pointValue:value];
	CGSize size = {p.x,p.y};
	[[self label] setShadowOffset:size];
}

@end
