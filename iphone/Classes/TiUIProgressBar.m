/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPROGRESSBAR

#import "TiUIProgressBar.h"
#import "TiUtils.h"
#import "WebFont.h"

@implementation TiUIProgressBar

-(id)initWithStyle:(UIProgressViewStyle)style_
{
	if (self = [super initWithFrame:CGRectZero])
	{
		style = style_;
		min = 0;
		max = 1;
		[self setHidden:YES];
        [self setDefaultWidth:TiDimensionAutoSize];
        [self setDefaultHeight:TiDimensionAutoSize];
        backgroundView = [[UIView alloc] init];
        [self setInnerView:backgroundView];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(progress);
	RELEASE_TO_NIL(messageLabel);
    RELEASE_TO_NIL(backgroundView);
	[super dealloc];
}

#pragma mark Accessors

-(UIProgressView*)progress
{
	if (progress==nil)
	{
		progress = [[UIProgressView alloc] initWithProgressViewStyle:style];
        [progress setTranslatesAutoresizingMaskIntoConstraints:NO];
		[backgroundView addSubview:progress];
	}
	return progress;
}

-(UILabel *)messageLabel
{
	if (messageLabel==nil)
	{
		messageLabel=[[UILabel alloc] init];
        [messageLabel setTranslatesAutoresizingMaskIntoConstraints:NO];
		[messageLabel setBackgroundColor:[UIColor clearColor]];
        [backgroundView addSubview:messageLabel];
	}
	return messageLabel;
}

- (id)accessibilityElement
{
	return [self messageLabel];
}

#define TI_VIEWS(...) NSDictionaryOfVariableBindings(__VA_ARGS__)
-(void)updateConstraints
{
    if (!_constraintsAdded) {
        messageLabel = [self messageLabel];
        progress = [self progress];
        [backgroundView addConstraints:TI_CONSTR(@"V:|[progress]-[messageLabel]|", TI_VIEWS(progress, messageLabel))];
        [backgroundView addConstraints:TI_CONSTR(@"H:|[progress]|", TI_VIEWS(progress, messageLabel))];
        [backgroundView addConstraint:[NSLayoutConstraint constraintWithItem:messageLabel
                                                                   attribute:NSLayoutAttributeCenterX
                                                                   relatedBy:NSLayoutRelationEqual
                                                                      toItem:backgroundView
                                                                   attribute:NSLayoutAttributeCenterX
                                                                  multiplier:1
                                                                    constant:0]];
    }
    [super updateConstraints];
}
#undef TI_VIEWS

#pragma mark Properties

-(void)setMin_:(id)value
{
	min = [TiUtils floatValue:value];
}

-(void)setMax_:(id)value
{
	max = [TiUtils floatValue:value];
}

-(void)setValue_:(id)value
{
	CGFloat newValue = ([TiUtils floatValue:value] - min) / (max-min);
	[[self progress] setProgress:newValue];
}


-(void)setFont_:(id)value
{
	WebFont * newFont = [TiUtils fontValue:value def:[WebFont defaultFont]];
	[[self messageLabel] setFont:[newFont font]];
	[self setNeedsLayout];
}


-(void)setColor_:(id)value
{
	UIColor * newColor = [[TiUtils colorValue:value] _color];
	if (newColor == nil) {
		newColor = [UIColor blackColor];
	}
	[[self messageLabel] setTextColor:newColor];
}

-(void)setMessage_:(id)value
{
	NSString * text = [TiUtils stringValue:value];
    [[self messageLabel] setText:text];
}


@end

#endif