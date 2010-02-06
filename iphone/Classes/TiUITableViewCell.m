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


@synthesize clickedName, valueLabel;

#pragma mark Initialization

- (void) dealloc
{
	[proxy removeObserver:self forKeyPath:@"jsonValues"];
	[self flushBlobWatching];

	RELEASE_TO_NIL(proxy);
	RELEASE_TO_NIL(layoutViewsArray);
	RELEASE_TO_NIL(clickedName);
	RELEASE_TO_NIL(watchedBlobs);
	RELEASE_TO_NIL(valueLabel);

	[super dealloc];
}

#pragma mark HTML handling

-(UIWebView*) webViewForString:(NSString*) htmlString_
{
	UIWebView * result = [[UIWebView alloc] init];
	[result setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
	[result setExclusiveTouch:NO];
	[result setUserInteractionEnabled:NO];
	[result setBackgroundColor:[UIColor clearColor]];
	[result setScalesPageToFit:NO];
	[result setOpaque:NO];
	NSString * injection = [NSString stringWithFormat:@"document.write('<body>%@</body>');",htmlString_];
	[result stringByEvaluatingJavaScriptFromString:injection];
	return [result autorelease];	
}

-(void)setWebViewForString:(UIWebView*) webView html:(NSString*) htmlString
{
	//Do nothing for now.
}

#pragma mark TableCellView obligations

- (void)prepareForReuse;
{
	[super prepareForReuse];
	lastLayoutArray = nil;
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


#pragma mark Internal utilities

- (BOOL) shouldUseHilightColors
{
	if([self respondsToSelector:@selector(isHighlighted)] && [self isHighlighted])
	{
		return YES;
	}
	return [self isSelected];
}

- (void)flushBlobWatching
{
	if([watchedBlobs count]==0)
	{
		return;
	}
	for (id thisBlob in watchedBlobs) 
	{
		[thisBlob removeObserver:self forKeyPath:@"imageBlob"];
	}
	[watchedBlobs removeAllObjects];
}

- (void) flushLayoutViews
{
	if([layoutViewsArray count]==0)
	{
		return;
	}
	for (UIView * doomedView in layoutViewsArray) 
	{
		[doomedView removeFromSuperview];
	}
	[layoutViewsArray removeAllObjects];	
}

- (void) applyImageNamed: (NSString *) name toView: (UIImageView *) view
{
	UIImage * entryImage = [proxy imageForKey:name];
	[view setImage:entryImage];
	if (entryImage==nil) {
//		TitaniumBlobWrapper * ourBlob = [dataWrapper blobWrapperForKey:name];
//		if (ourBlob != nil) {
//
//			if (watchedBlobs == nil) {
//				watchedBlobs = [[NSMutableSet alloc] initWithObjects:ourBlob,nil];
//			} else {
//				[watchedBlobs addObject:ourBlob];
//			}
//			[ourBlob addObserver:self forKeyPath:@"imageBlob" options:NSKeyValueObservingOptionNew context:view];
//		}
	}
}

- (void)updateState:(BOOL)hilighted animated: (BOOL) animated
{
	NSLog(@"Updating state %d %d",hilighted,animated);
	if (lastLayoutArray == nil) 
	{
		[self updateDefaultLayoutViews:hilighted];
	} 
	else 
	{
		[self updateDataInSubviews:hilighted];
	}
}

#pragma mark Accessors

- (void)setProxy:(TiUITableViewCellProxy *)newWrapper
{
	if(newWrapper == proxy)
	{
		return;
	}
	[proxy removeObserver:self forKeyPath:@"jsonValues"];
	[newWrapper retain];
	[proxy release];
	proxy=newWrapper;
	[proxy addObserver:self forKeyPath:@"jsonValues" options:NSKeyValueObservingOptionNew context:nil];
	[self refreshFromDataWrapper];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
	if(object==proxy)
	{
		[self refreshFromDataWrapper];
	}
	
	if ([keyPath isEqualToString:@"imageBlob"]) 
	{
		[object removeObserver:self forKeyPath:keyPath];
		
		[watchedBlobs removeObject:object];
		for (UIView * changedView in layoutViewsArray) 
		{
			if (changedView == context) 
			{
//				[(UIImageView *)changedView setImage:[(TitaniumBlobWrapper *)object imageBlob]];
				return;
			}
		}
		NSLog(@"[WARN] Shouldn't happen. %@ notified us, but we didn't care.",object);
	}
}


#pragma mark Default Layout Actions

- (void) hideDefaultLayoutViews
{
	[[self textLabel] setHidden:YES];
	[[self imageView] setHidden:YES];
	[valueLabel setHidden:YES];
	[htmlView setHidden:YES];
}

- (void) updateDefaultLayoutViews:(BOOL) hilighted
{
	UILabel * ourTextLabel = [self textLabel];
	NSString * ourHTML = [proxy html];
	NSString * ourTitle;

	UIView * ourContentView = [self contentView];

	if([ourHTML length]>0)
	{
		NSString * actionString;
		if (hilighted) 
		{
			actionString = @"document.body.style['color']='white';";
		} 
		else if ([self accessoryType] == UITableViewCellAccessoryCheckmark)
		{
			actionString = @"document.body.style['color']='#374F82';";
		} 
		else 
		{
			actionString = @"document.body.style['color']='black';";
		}		
	
		if (![ourHTML isEqualToString:htmlString])
		{ 
			//No good. Get a new one!
			NSLog(@"New html view");
			if(htmlView != nil)
			{
				[self setWebViewForString:htmlView html:htmlString];
				[htmlView removeFromSuperview];
				[htmlView release];
			}
			htmlView = [[self webViewForString:ourHTML] retain];
			[TiUtils setView:htmlView positionRect:[ourContentView bounds]];
			[htmlView stringByEvaluatingJavaScriptFromString:actionString];
			[ourContentView addSubview:htmlView];
			[htmlString release];
			htmlString = [ourHTML copy];
		} 
		else 
		{
			[htmlView stringByEvaluatingJavaScriptFromString:actionString];
			[htmlView setNeedsDisplay];
		}

		ourTitle = nil;
	} 
	else 
	{
		[self setWebViewForString:htmlView html:htmlString];
		[htmlView removeFromSuperview];
		[htmlView release];
		htmlView = nil;
		[htmlString release];
		htmlString = nil;
		ourTitle = [proxy title];
	}
	
	if([ourTitle length]>0)
	{
		UIColor * ourTextColor;
		if([self accessoryType]==UITableViewCellAccessoryCheckmark)
		{
			ourTextColor = UIColorCheckmarkColor();
		} 
		else 
		{
			ourTextColor = [UIColor blackColor];
		}
		
		[ourTextLabel setHighlighted:hilighted];
		[ourTextLabel setTextColor:ourTextColor];
		[ourTextLabel setBackgroundColor:[UIColor clearColor]];
		[ourTextLabel setFont:[proxy font]];
		[ourTextLabel setText:ourTitle];
		[ourTextLabel setTextAlignment:[proxy isButton]?UITextAlignmentCenter:UITextAlignmentLeft];
		[ourTextLabel setHidden:NO];
	} 
	else 
	{
		[ourTextLabel setHidden:YES];
		[ourTextLabel setText:nil];
	}
}

- (void)refreshFromDataWrapper
{
	[self setAccessoryType:[proxy accessoryType]];
	
	if([proxy layoutArray] == nil)
	{
		[self updateDefaultLayoutViews:[self shouldUseHilightColors]];
	} 
	else 
	{
		[self hideDefaultLayoutViews];
		[self setNeedsLayout];
	}
}

#pragma mark Layout-based actions

- (void) updateDataInSubviews:(BOOL)hilighted
{
	NSEnumerator * viewEnumerator = [layoutViewsArray objectEnumerator];
	
	for (LayoutEntry * thisEntry in lastLayoutArray) 
	{
		UIView * thisEntryView = [viewEnumerator nextObject];
		NSString * name = [thisEntry nameString];
		
		if([thisEntryView isKindOfClass:[UIImageView class]])
		{
			[self applyImageNamed:name toView:(UIImageView *)thisEntryView];
			continue;
		}
		if([thisEntryView isKindOfClass:[TiTextLabel class]])
		{
			[(TiTextLabel *)thisEntryView setText:[proxy stringForKey:name]];
			[(TiTextLabel *)thisEntryView setHighlighted:hilighted];
			[thisEntryView setNeedsDisplay];
			continue;
		}
	}
}

- (void)layoutSubviews
{
	[super layoutSubviews];
	
	NSArray * layoutArray = [proxy layoutArray];
	[self flushBlobWatching];
	
	if(layoutArray == nil)
	{	
		//This has already been set in setDataWrapper.
		lastLayoutArray = nil;
		[self flushLayoutViews];
		[self updateDefaultLayoutViews:[self shouldUseHilightColors]];
		return;
	}
	
	if(layoutArray == lastLayoutArray)
	{ 
		//Okay, everyone's still in position!
		[self updateDataInSubviews:[self shouldUseHilightColors]];
		return;
	}
	
	lastLayoutArray = layoutArray;
	
	if(layoutViewsArray == nil)
	{
		layoutViewsArray = [[NSMutableArray alloc] initWithCapacity:[layoutArray count]];
	} 
	else 
	{
		[self flushLayoutViews];
	}
	
	CGRect boundRect;
	boundRect = [[self contentView] bounds];
	BOOL useHilightColors = [self shouldUseHilightColors];
 
	for (LayoutEntry * thisEntry in layoutArray) 
	{
		UIView * thisEntryView;
		NSString * name = [thisEntry nameString];
		
		switch ([thisEntry type]) 
		{
			case LayoutEntryText:
			{
				thisEntryView = [[[TiTextLabel alloc] initWithFrame:CGRectZero] autorelease];
				
				[(TiTextLabel *)thisEntryView setText:[proxy stringForKey:name]];
				[(TiTextLabel *)thisEntryView setHighlighted:useHilightColors];
				[(TiTextLabel *)thisEntryView setTextAlignment:[thisEntry textAlign]];
				
				UIColor * thisTextColor = [thisEntry textColor];
				UIColor * thisHighlightedTextColor = [thisEntry selectedTextColor];
				if (thisHighlightedTextColor == nil) 
				{
					thisHighlightedTextColor = thisTextColor;
				}
				if (thisHighlightedTextColor == nil) 
				{
					thisHighlightedTextColor = [proxy colorForKey:@"selectedColor"];
				}
				if (thisTextColor == nil) 
				{
					thisTextColor = [proxy colorForKey:@"color"];
				}
				if (thisHighlightedTextColor == nil) 
				{
					thisHighlightedTextColor = thisTextColor;
				}
				if (thisTextColor == nil) 
				{
					thisTextColor = [UIColor blackColor];
				}
				if (thisHighlightedTextColor == nil) 
				{
					thisHighlightedTextColor = [UIColor whiteColor];
				}
				[(TiTextLabel *)thisEntryView setTextColor:thisTextColor];
				[(TiTextLabel *)thisEntryView setHighlightedTextColor:thisHighlightedTextColor];
				[(TiTextLabel *)thisEntryView setFont:[[thisEntry labelFont] font]];
				
				break;
			}
			case LayoutEntryImage:
			{
				thisEntryView = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
				[self applyImageNamed:name toView:(UIImageView *)thisEntryView];				
				break;
			}
			case LayoutEntryButton:
			{
				thisEntryView = nil;
				break;
			}
			default:
			{
				continue;
			}
		}
		
		[thisEntryView setBackgroundColor:[UIColor clearColor]];
		LayoutConstraint thisConstraint = [thisEntry constraint];
		
		ApplyConstraintToViewWithinViewWithBounds(&thisConstraint, thisEntryView, self, boundRect,YES);
		[layoutViewsArray addObject:thisEntryView];
	}
	
}


- (void) touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event;
{
	UITouch * anyTouch = [touches anyObject];
	int currentViewIndex = 0;
	for (UIView * thisView in layoutViewsArray) {
		CGPoint thisPoint;
		thisPoint = [anyTouch locationInView:thisView];
		if ([thisView pointInside:thisPoint withEvent:nil]) {
			LayoutEntry * thisEntry = [[proxy layoutArray] objectAtIndex:currentViewIndex];
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
