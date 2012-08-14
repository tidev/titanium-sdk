/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiUIView.h"
#import "TiColor.h"
#import "TiRect.h"
#import "TiUtils.h"
#import "ImageLoader.h"
#ifdef USE_TI_UI2DMATRIX	
	#import "Ti2DMatrix.h"
#endif
#if defined(USE_TI_UIIOS3DMATRIX) || defined(USE_TI_UI3DMATRIX)
	#import "Ti3DMatrix.h"
#endif
#import "TiViewProxy.h"
#import "TiApp.h"
#import "UIImage+Resize.h"

void InsetScrollViewForKeyboard(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight)
{
	VerboseLog(@"ScrollView:%@, keyboardTop:%f minimumContentHeight:%f",scrollView,keyboardTop,minimumContentHeight);

	CGRect scrollVisibleRect = [scrollView convertRect:[scrollView bounds] toView:[[TiApp app] topMostView]];
	//First, find out how much we have to compensate.

	CGFloat obscuredHeight = scrollVisibleRect.origin.y + scrollVisibleRect.size.height - keyboardTop;	
	//ObscuredHeight is how many vertical pixels the keyboard obscures of the scroll view. Some of this may be acceptable.

	CGFloat unimportantArea = MAX(scrollVisibleRect.size.height - minimumContentHeight,0);
	//It's possible that some of the covered area doesn't matter. If it all matters, unimportant is 0.

	//As such, obscuredHeight is now how much actually matters of scrollVisibleRect.

	CGFloat bottomInset = MAX(0,obscuredHeight-unimportantArea);
	[scrollView setContentInset:UIEdgeInsetsMake(0, 0, bottomInset, 0)];

	CGPoint offset = [scrollView contentOffset];

	if(offset.y + bottomInset < 0 )
	{
		offset.y = -bottomInset;
		[scrollView setContentOffset:offset animated:YES];
	}

	VerboseLog(@"ScrollVisibleRect(%f,%f),%fx%f; obscuredHeight:%f; unimportantArea:%f",
			scrollVisibleRect.origin.x,scrollVisibleRect.origin.y,scrollVisibleRect.size.width,scrollVisibleRect.size.height,
			obscuredHeight,unimportantArea);
}

void OffsetScrollViewForRect(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight,CGRect responderRect)
{
	VerboseLog(@"ScrollView:%@, keyboardTop:%f minimumContentHeight:%f responderRect:(%f,%f),%fx%f;",
			scrollView,keyboardTop,minimumContentHeight,
			responderRect.origin.x,responderRect.origin.y,responderRect.size.width,responderRect.size.height);

	CGRect scrollVisibleRect = [scrollView convertRect:[scrollView bounds] toView:[[TiApp app] topMostView]];
	//First, find out how much we have to compensate.

	CGFloat obscuredHeight = scrollVisibleRect.origin.y + scrollVisibleRect.size.height - keyboardTop;	
	//ObscuredHeight is how many vertical pixels the keyboard obscures of the scroll view. Some of this may be acceptable.

	//It's possible that some of the covered area doesn't matter. If it all matters, unimportant is 0.

	//As such, obscuredHeight is now how much actually matters of scrollVisibleRect.

	VerboseLog(@"ScrollVisibleRect(%f,%f),%fx%f; obscuredHeight:%f;",
			scrollVisibleRect.origin.x,scrollVisibleRect.origin.y,scrollVisibleRect.size.width,scrollVisibleRect.size.height,
			obscuredHeight);

	scrollVisibleRect.size.height -= MAX(0,obscuredHeight);

	//Okay, the scrollVisibleRect.size now represents the actually visible area.

	CGPoint offsetPoint = [scrollView contentOffset];

	CGPoint offsetForBottomRight;
	offsetForBottomRight.x = responderRect.origin.x + responderRect.size.width - scrollVisibleRect.size.width;
	offsetForBottomRight.y = responderRect.origin.y + responderRect.size.height - scrollVisibleRect.size.height;

	offsetPoint.x = MIN(responderRect.origin.x,MAX(offsetPoint.x,offsetForBottomRight.x));
	offsetPoint.y = MIN(responderRect.origin.y,MAX(offsetPoint.y,offsetForBottomRight.y));
	VerboseLog(@"OffsetForBottomright:(%f,%f) OffsetPoint:(%f,%f)",
			offsetForBottomRight.x, offsetForBottomRight.y, offsetPoint.x, offsetPoint.y);

	CGFloat maxOffset = [scrollView contentInset].bottom + [scrollView contentSize].height - scrollVisibleRect.size.height;
	
	if(maxOffset < offsetPoint.y)
	{
		offsetPoint.y = MAX(0,maxOffset);
	}

	[scrollView setContentOffset:offsetPoint animated:YES];
}

void ModifyScrollViewForKeyboardHeightAndContentHeightWithResponderRect(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight,CGRect responderRect)
{
	VerboseLog(@"ScrollView:%@, keyboardTop:%f minimumContentHeight:%f responderRect:(%f,%f),%fx%f;",
			scrollView,keyboardTop,minimumContentHeight,
			responderRect.origin.x,responderRect.origin.y,responderRect.size.width,responderRect.size.height);

	CGRect scrollVisibleRect = [scrollView convertRect:[scrollView bounds] toView:[[TiApp app] topMostView]];
	//First, find out how much we have to compensate.

	CGFloat obscuredHeight = scrollVisibleRect.origin.y + scrollVisibleRect.size.height - keyboardTop;	
	//ObscuredHeight is how many vertical pixels the keyboard obscures of the scroll view. Some of this may be acceptable.

	CGFloat unimportantArea = MAX(scrollVisibleRect.size.height - minimumContentHeight,0);
	//It's possible that some of the covered area doesn't matter. If it all matters, unimportant is 0.

	//As such, obscuredHeight is now how much actually matters of scrollVisibleRect.

	[scrollView setContentInset:UIEdgeInsetsMake(0, 0, MAX(0,obscuredHeight-unimportantArea), 0)];

	VerboseLog(@"ScrollVisibleRect(%f,%f),%fx%f; obscuredHeight:%f; unimportantArea:%f",
			scrollVisibleRect.origin.x,scrollVisibleRect.origin.y,scrollVisibleRect.size.width,scrollVisibleRect.size.height,
			obscuredHeight,unimportantArea);

	scrollVisibleRect.size.height -= MAX(0,obscuredHeight);

	//Okay, the scrollVisibleRect.size now represents the actually visible area.

	CGPoint offsetPoint = [scrollView contentOffset];

	if(!CGRectIsEmpty(responderRect))
	{
		CGPoint offsetForBottomRight;
		offsetForBottomRight.x = responderRect.origin.x + responderRect.size.width - scrollVisibleRect.size.width;
		offsetForBottomRight.y = responderRect.origin.y + responderRect.size.height - scrollVisibleRect.size.height;
	
		offsetPoint.x = MIN(responderRect.origin.x,MAX(offsetPoint.x,offsetForBottomRight.x));
		offsetPoint.y = MIN(responderRect.origin.y,MAX(offsetPoint.y,offsetForBottomRight.y));
		VerboseLog(@"OffsetForBottomright:(%f,%f) OffsetPoint:(%f,%f)",
				offsetForBottomRight.x, offsetForBottomRight.y, offsetPoint.x, offsetPoint.y);
	}
	else
	{
		offsetPoint.x = MAX(0,offsetPoint.x);
		offsetPoint.y = MAX(0,offsetPoint.y);
		VerboseLog(@"OffsetPoint:(%f,%f)",offsetPoint.x, offsetPoint.y);
	}

	[scrollView setContentOffset:offsetPoint animated:YES];
}

NSArray* listenerArray = nil;

@interface TiUIView ()
-(void)sanitycheckListeners;
@end

@interface TiUIView(Private)
-(void)renderRepeatedBackground:(id)image;
@end

@implementation TiUIView

DEFINE_EXCEPTIONS

@synthesize proxy,touchDelegate,backgroundImage;

#pragma mark Internal Methods

#if VIEW_DEBUG
-(id)retain
{
	[super retain];
	NSLog(@"[VIEW %@] RETAIN: %d", self, [self retainCount]);
}

-(oneway void)release
{
	NSLog(@"[VIEW %@] RELEASE: %d", self, [self retainCount]-1);
	[super release];
}
#endif

-(void)dealloc
{
	[transformMatrix release];
	[animation release];
	[backgroundImage release];
	[gradientLayer release];
	[singleTapRecognizer release];
	[doubleTapRecognizer release];
	[twoFingerTapRecognizer release];
	[pinchRecognizer release];
	[leftSwipeRecognizer release];
	[rightSwipeRecognizer release];
	[upSwipeRecognizer release];
	[downSwipeRecognizer release];
	[longPressRecognizer release];
	proxy = nil;
	touchDelegate = nil;
	[super dealloc];
}

-(void)removeFromSuperview
{
	if ([NSThread isMainThread])
	{
		[super removeFromSuperview];
	}
	else 
	{
		TiThreadPerformOnMainThread(^{[super removeFromSuperview];}, YES);
	}
}

- (id) init
{
	self = [super init];
	if (self != nil)
	{
		touchPassThrough = false;
	}
	return self;
}

-(BOOL)viewSupportsBaseTouchEvents
{
	// give the ability for the subclass to turn off our event handling
	// if it wants too
	return YES;
}


-(BOOL)proxyHasTapListener
{
	return [proxy _hasListeners:@"singletap"] ||
			[proxy _hasListeners:@"doubletap"] ||
			[proxy _hasListeners:@"twofingertap"];
}

-(BOOL)proxyHasTouchListener
{
	return [proxy _hasListeners:@"touchstart"] ||
			[proxy _hasListeners:@"touchcancel"] ||
			[proxy _hasListeners:@"touchend"] ||
			[proxy _hasListeners:@"touchmove"] ||
			[proxy _hasListeners:@"click"] ||
			[proxy _hasListeners:@"dblclick"];
} 

-(void)updateTouchHandling
{
	BOOL touchEventsSupported = [self viewSupportsBaseTouchEvents];
	handlesTouches = touchEventsSupported && (
                [self proxyHasTouchListener]
                || [self proxyHasTapListener]
                || [proxy _hasListeners:@"swipe"]
                || [proxy _hasListeners:@"pinch"]
                || [proxy _hasListeners:@"longpress"]);

    // If a user has not explicitly set whether or not the view interacts, base it on whether or
    // not it handles events, and if not, set it to the interaction default.
    if (!changedInteraction) {
        self.userInteractionEnabled = handlesTouches || [self interactionDefault];
    }
}

-(void)initializeState
{
	virtualParentTransform = CGAffineTransformIdentity;
	
	[self updateTouchHandling];
	 
	self.backgroundColor = [UIColor clearColor]; 
	self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
}

-(void)configurationSet
{
	// can be used to trigger things after all properties are set
    configurationSet = YES;
}

-(void)setProxy:(TiProxy *)p
{
	proxy = p;
	[proxy setModelDelegate:self];
	[self sanitycheckListeners];
}

-(UIImage*)loadImage:(id)image 
{
	if (image==nil) return nil;
	NSURL *url = [TiUtils toURL:image proxy:proxy];
	if (url==nil)
	{
		NSLog(@"[WARN] could not find image: %@",[url absoluteString]);
		return nil;
	}
	return [[ImageLoader sharedLoader] loadImmediateStretchableImage:url withLeftCap:leftCap topCap:topCap];
}

-(id)transformMatrix
{
	return transformMatrix;
}

#pragma mark Layout 

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    if (backgroundRepeat) {
        [self renderRepeatedBackground:backgroundImage];
    }
}


-(void)setFrame:(CGRect)frame
{
	[super setFrame:frame];
	
	// this happens when a view is added to another view but not
	// through the framework (such as a tableview header) and it
	// means we need to force the layout of our children
	if (childrenInitialized==NO && 
		CGRectIsEmpty(frame)==NO &&
		[self.proxy isKindOfClass:[TiViewProxy class]])
	{
		childrenInitialized=YES;
		[(TiViewProxy*)self.proxy layoutChildren:NO];
	}
}

-(void)checkBounds
{
	CGRect newBounds = [self bounds];
	if(!CGSizeEqualToSize(oldSize, newBounds.size))
	{
		oldSize = newBounds.size;
		[gradientLayer setFrame:newBounds];
		[self frameSizeChanged:[TiUtils viewPositionRect:self] bounds:newBounds];
	}
}

-(void)setBounds:(CGRect)bounds
{
	[super setBounds:bounds];
	[self checkBounds];
}

-(void)layoutSubviews
{
	[super layoutSubviews];
	[self checkBounds];
}

-(void)updateTransform
{
#ifdef USE_TI_UI2DMATRIX	
	if ([transformMatrix isKindOfClass:[Ti2DMatrix class]])
	{
		self.transform = CGAffineTransformConcat(virtualParentTransform, [(Ti2DMatrix*)transformMatrix matrix]);
		return;
	}
#endif
#if defined(USE_TI_UIIOS3DMATRIX) || defined(USE_TI_UI3DMATRIX)
	if ([transformMatrix isKindOfClass:[Ti3DMatrix class]])
	{
		self.layer.transform = CATransform3DConcat(CATransform3DMakeAffineTransform(virtualParentTransform),[(Ti3DMatrix*)transformMatrix matrix]);
		return;
	}
#endif
	self.transform = virtualParentTransform;
}


-(void)setVirtualParentTransform:(CGAffineTransform)newTransform
{
	virtualParentTransform = newTransform;
	[self updateTransform];
}

-(void)fillBoundsToRect:(TiRect*)rect
{
	CGRect r = [self bounds];
	[rect setRect:r];
}

-(void)fillFrameToRect:(TiRect*)rect
{
	CGRect r = [self frame];
	[rect setRect:r];
}

#pragma mark Public APIs

-(void)setBorderColor_:(id)color
{
	TiColor *ticolor = [TiUtils colorValue:color];
	self.layer.borderWidth = MAX(self.layer.borderWidth,1);
	self.layer.borderColor = [ticolor _color].CGColor;
}
 
-(void)setBorderWidth_:(id)w
{ 
	self.layer.borderWidth = [TiUtils sizeValue:w];
}

-(void)setBackgroundColor_:(id)color
{
	if ([color isKindOfClass:[UIColor class]])
	{
		super.backgroundColor = color;
	}
	else
	{
		TiColor *ticolor = [TiUtils colorValue:color];
		super.backgroundColor = [ticolor _color];
	}
}

-(void)setTileBackground_:(id)image
{
    UIImage* tileImage = [TiUtils loadBackgroundImage:image forProxy:proxy];

}

-(void)setOpacity_:(id)opacity
{
	self.alpha = [TiUtils floatValue:opacity];
}

-(CALayer *)backgroundImageLayer
{
	return [self layer];
}

// You might wonder why we don't just use the native feature of -[UIColor colorWithPatternImage:].
// Here's why:
// * It doesn't properly handle alpha channels
// * You can't combine background tesselations with background colors
// * By making the background-repeat flag a boolean swap, we would have to cache, check, and uncache
//   background colors everywhere - and this starts getting really complicated for some views
//   (on the off chance somebody wants to swap tesselation AND has a background color they want to replace it with).

-(void)renderRepeatedBackground:(id)image
{
    if (![NSThread isMainThread]) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self renderRepeatedBackground:image];
        });
        return;
    }
    
    UIImage* bgImage = [TiUtils loadBackgroundImage:image forProxy:proxy];
    if (bgImage == nil) {
        [self backgroundImageLayer].contents = nil;
        return;
    }
    
    // Due to coordinate system shenanagins (there are multiple translations between the UIKit coordinate system
    // and the CG coordinate system happening here) we have to manually flip the background image to render
    // before passing it to the tiling system (via passing it through another UIGraphics context; this orients the
    // image in the "correct" way for the second pass).
    //
    // Note that this means passes through two different graphics contexts. They can be nested, but that makes the code
    // even uglier.
    //
    // NOTE: Doing this begins the image tesselation starting at the upper-left, which is considered the 'origin' for all
    // drawing operations on iOS (and presumably Android). By removing this code and instead blitting the [bgImage CGImage]
    // directly into the graphics context, it tesselates from the lower-left.
    
    UIGraphicsBeginImageContextWithOptions(bgImage.size, NO, bgImage.scale);
    CGContextRef imageContext = UIGraphicsGetCurrentContext();
    CGContextDrawImage(imageContext, CGRectMake(0, 0, bgImage.size.width , bgImage.size.height), [bgImage CGImage]);
    UIImage* translatedImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    
    UIGraphicsBeginImageContextWithOptions(self.bounds.size, NO, bgImage.scale);
    CGContextRef background = UIGraphicsGetCurrentContext();
    CGRect imageRect = CGRectMake(0, 0, bgImage.size.width, bgImage.size.height);
    CGContextDrawTiledImage(background, imageRect, [translatedImage CGImage]);
    UIImage* renderedBg = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    [self backgroundImageLayer].contents = (id)renderedBg.CGImage;
}

-(void)setBackgroundImage_:(id)image
{
    UIImage* bgImage = [TiUtils loadBackgroundImage:image forProxy:proxy];
    
    if (backgroundRepeat) {
        [self renderRepeatedBackground:bgImage];
    }
    else {
        [self backgroundImageLayer].contents = (id)bgImage.CGImage;
        if (bgImage != nil) {
            [self backgroundImageLayer].contentsScale = [bgImage scale];
            [self backgroundImageLayer].contentsCenter = TiDimensionLayerContentCenter(topCap, leftCap, topCap, leftCap, [bgImage size]);
        }
    }
    
    self.clipsToBounds = bgImage!=nil;
    self.backgroundImage = bgImage;
}

-(void)setBackgroundRepeat_:(id)repeat
{
    backgroundRepeat = [TiUtils boolValue:repeat def:NO];
    [self setBackgroundImage_:backgroundImage];
}


-(void)setBackgroundLeftCap_:(id)value
{
    TiDimension cap = TiDimensionFromObject(value);
    if (!TiDimensionEqual(leftCap, cap)) {
        leftCap = cap;
        [self setBackgroundImage_:backgroundImage];
    }
}

-(void)setBackgroundTopCap_:(id)value
{
    TiDimension cap = TiDimensionFromObject(value);
    if (!TiDimensionEqual(topCap, cap)) {
        topCap = cap;
        [self setBackgroundImage_:backgroundImage];
    }
}

-(void)setBorderRadius_:(id)radius
{
	self.layer.cornerRadius = [TiUtils floatValue:radius];
	self.clipsToBounds = YES;
}

-(void)setAnchorPoint_:(id)point
{
	self.layer.anchorPoint = [TiUtils pointValue:point];
}

-(void)setTransform_:(id)transform_
{
	RELEASE_TO_NIL(transformMatrix);
	transformMatrix = [transform_ retain];
	[self updateTransform];
}

-(void)setCenter_:(id)point
{
	self.center = [TiUtils pointValue:point];
}

-(void)setVisible_:(id)visible
{
    BOOL oldVal = self.hidden;
    self.hidden = ![TiUtils boolValue:visible];
    //Redraw ourselves if changing from invisible to visible, to handle any changes made
	if (!self.hidden && oldVal) {
        TiViewProxy* viewProxy = (TiViewProxy*)[self proxy];
        [viewProxy willEnqueue];
    }
}

-(void)setTouchEnabled_:(id)arg
{
	self.userInteractionEnabled = [TiUtils boolValue:arg];
    changedInteraction = YES;
}

-(BOOL) touchEnabled {
	return touchEnabled;
}

-(void)setTouchPassThrough_:(id)arg
{
	touchPassThrough = [TiUtils boolValue:arg];
}

-(UIView *)gradientWrapperView
{
	return self;
}

-(void)setBackgroundGradient_:(id)arg
{
	if (arg == nil)
	{
		[gradientLayer removeFromSuperlayer];
		RELEASE_TO_NIL(gradientLayer);
	}
	else if (gradientLayer == nil)
	{
		gradientLayer = [[TiGradientLayer alloc] init];
		[(TiGradientLayer *)gradientLayer setGradient:arg];
		[gradientLayer setNeedsDisplayOnBoundsChange:YES];
		[gradientLayer setFrame:[self bounds]];
		[gradientLayer setNeedsDisplay];
		[[[self gradientWrapperView] layer] insertSublayer:gradientLayer atIndex:0];
	}
	else
	{
		[(TiGradientLayer *)gradientLayer setGradient:arg];
		[gradientLayer setNeedsDisplay];
	}
}

-(void)didAddSubview:(UIView*)view
{
	// So, it turns out that adding a subview places it beneath the gradient layer.
	// Every time we add a new subview, we have to make sure the gradient stays where it belongs...
	if (gradientLayer != nil) {
		[[[self gradientWrapperView] layer] insertSublayer:gradientLayer atIndex:0];
	}
}

-(void)animate:(TiAnimation *)newAnimation
{
	RELEASE_TO_NIL(animation);
	
	if ([self.proxy isKindOfClass:[TiViewProxy class]] && [(TiViewProxy*)self.proxy viewReady]==NO)
	{
		DebugLog(@"[DEBUG] Ti.View.animate() called before view %@ was ready: Will re-attempt", self);
		if (animationDelayGuard++ > 5)
		{
			DebugLog(@"[DEBUG] Animation guard triggered, exceeded timeout to perform animation.");
            animationDelayGuard = 0;
			return;
		}
		[self performSelector:@selector(animate:) withObject:newAnimation afterDelay:0.01];
		return;
	}
	
	animationDelayGuard = 0;

	if (newAnimation != nil)
	{
		RELEASE_TO_NIL(animation);
		animation = [newAnimation retain];
		animating = YES;
		[animation animate:self];
	}	
	else
	{
		DebugLog(@"[WARN] Ti.View.animate() (view %@) could not make animation from: %@", self, newAnimation);
	}
}

-(void)animationCompleted
{
	animating = NO;
}

-(BOOL)animating
{
	return animating;
}

#pragma mark Property Change Support

-(SEL)selectorForProperty:(NSString*)key
{
	NSString *method = [NSString stringWithFormat:@"set%@%@_:", [[key substringToIndex:1] uppercaseString], [key substringFromIndex:1]];
	return NSSelectorFromString(method);
}

-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys
{
	DoProxyDelegateReadValuesWithKeysFromProxy(self, keys, proxy);
}

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy_
{
	DoProxyDelegateChangedValuesWithProxy(self, key, oldValue, newValue, proxy_);
}


//Todo: Generalize.
-(void)setKrollValue:(id)value forKey:(NSString *)key withObject:(id)props
{
	if(value == [NSNull null])
	{
		value = nil;
	}

	SEL method = SetterWithObjectForKrollProperty(key);
	if([self respondsToSelector:method])
	{
		[self performSelector:method withObject:value withObject:props];
		return;
	}		

	method = SetterForKrollProperty(key);
	if([self respondsToSelector:method])
	{
		[self performSelector:method withObject:value];
	}	
}

-(void)transferProxy:(TiViewProxy*)newProxy
{
	TiViewProxy * oldProxy = (TiViewProxy *)[self proxy];
	
	// We can safely skip everything if we're transferring to ourself.
	if (oldProxy != newProxy) {
		NSArray * oldProperties = (NSArray *)[oldProxy allKeys];
		NSArray * newProperties = (NSArray *)[newProxy allKeys];
		NSArray * keySequence = [newProxy keySequence];
		[oldProxy retain];
		[self retain];
		
		[newProxy setReproxying:YES];
		
		[oldProxy setView:nil];
		[newProxy setView:self];
		[self setProxy:[newProxy retain]];
		
		//The important sequence first:
		for (NSString * thisKey in keySequence)
		{
			id newValue = [newProxy valueForKey:thisKey];
			[self setKrollValue:newValue forKey:thisKey withObject:nil];
		}
		
		for (NSString * thisKey in oldProperties)
		{
			if([newProperties containsObject:thisKey] || [keySequence containsObject:thisKey])
			{
				continue;
			}
			[self setKrollValue:nil forKey:thisKey withObject:nil];
		}
		
		for (NSString * thisKey in newProperties)
		{
			if ([keySequence containsObject:thisKey])
			{
				continue;
			}
			
			// Always set the new value, even if 'equal' - some view setters (as in UIImageView)
			// use internal voodoo to determine what to display.
			// TODO: We may be able to take this out once the imageView.url property is taken out, and change it back to an equality test.
			id newValue = [newProxy valueForUndefinedKey:thisKey];
			[self setKrollValue:newValue forKey:thisKey withObject:nil];
		}
		
		[oldProxy release];
		
		[newProxy setReproxying:NO];
		[self release];
	}
}


-(id)proxyValueForKey:(NSString *)key
{
	return [proxy valueForKey:key];
}

#pragma mark First Responder delegation

-(void)makeRootViewFirstResponder
{
	[[[TiApp controller] view] becomeFirstResponder];
}

#pragma mark Recognizers

-(UITapGestureRecognizer*)singleTapRecognizer;
{
	if (singleTapRecognizer == nil) {
		singleTapRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedTap:)];
		[self configureGestureRecognizer:singleTapRecognizer];
		[self addGestureRecognizer:singleTapRecognizer];

		if (doubleTapRecognizer != nil) {
			[singleTapRecognizer requireGestureRecognizerToFail:doubleTapRecognizer];
		}
	}
	return singleTapRecognizer;
}

-(UITapGestureRecognizer*)doubleTapRecognizer;
{
	if (doubleTapRecognizer == nil) {
		doubleTapRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedTap:)];
		[doubleTapRecognizer setNumberOfTapsRequired:2];
		[self configureGestureRecognizer:doubleTapRecognizer];
		[self addGestureRecognizer:doubleTapRecognizer];
		
		if (singleTapRecognizer != nil) {
			[singleTapRecognizer requireGestureRecognizerToFail:doubleTapRecognizer];
		}		
	}
	return doubleTapRecognizer;
}

-(UITapGestureRecognizer*)twoFingerTapRecognizer;
{
	if (twoFingerTapRecognizer == nil) {
		twoFingerTapRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedTap:)];
		[twoFingerTapRecognizer setNumberOfTouchesRequired:2];
		[self configureGestureRecognizer:twoFingerTapRecognizer];
		[self addGestureRecognizer:twoFingerTapRecognizer];
	}
	return twoFingerTapRecognizer;
}

-(UIPinchGestureRecognizer*)pinchRecognizer;
{
	if (pinchRecognizer == nil) {
		pinchRecognizer = [[UIPinchGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedPinch:)];
		[self configureGestureRecognizer:pinchRecognizer];
		[self addGestureRecognizer:pinchRecognizer];
	}
	return pinchRecognizer;
}

-(UISwipeGestureRecognizer*)leftSwipeRecognizer;
{
	if (leftSwipeRecognizer == nil) {
		leftSwipeRecognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedSwipe:)];
		[leftSwipeRecognizer setDirection:UISwipeGestureRecognizerDirectionLeft];
		[self configureGestureRecognizer:leftSwipeRecognizer];
		[self addGestureRecognizer:leftSwipeRecognizer];
	}
	return leftSwipeRecognizer;
}

-(UISwipeGestureRecognizer*)rightSwipeRecognizer;
{
	if (rightSwipeRecognizer == nil) {
		rightSwipeRecognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedSwipe:)];
		[rightSwipeRecognizer setDirection:UISwipeGestureRecognizerDirectionRight];
		[self configureGestureRecognizer:rightSwipeRecognizer];
		[self addGestureRecognizer:rightSwipeRecognizer];
	}
	return rightSwipeRecognizer;
}
-(UISwipeGestureRecognizer*)upSwipeRecognizer;
{
	if (upSwipeRecognizer == nil) {
		upSwipeRecognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedSwipe:)];
		[upSwipeRecognizer setDirection:UISwipeGestureRecognizerDirectionUp];
		[self configureGestureRecognizer:upSwipeRecognizer];
		[self addGestureRecognizer:upSwipeRecognizer];
	}
	return upSwipeRecognizer;
}
-(UISwipeGestureRecognizer*)downSwipeRecognizer;
{
	if (downSwipeRecognizer == nil) {
		downSwipeRecognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedSwipe:)];
		[downSwipeRecognizer setDirection:UISwipeGestureRecognizerDirectionDown];
		[self configureGestureRecognizer:downSwipeRecognizer];
		[self addGestureRecognizer:downSwipeRecognizer];
	}
	return downSwipeRecognizer;
}

-(UILongPressGestureRecognizer*)longPressRecognizer;
{
	if (longPressRecognizer == nil) {
		longPressRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedLongPress:)];
		[self configureGestureRecognizer:longPressRecognizer];
		[self addGestureRecognizer:longPressRecognizer];
	}
	return longPressRecognizer;
}


-(void)recognizedTap:(UITapGestureRecognizer*)recognizer
{
	CGPoint tapPoint = [recognizer locationInView:self];
	NSMutableDictionary *event;

#define GLOBALPOINT	//Remove this for 1.9, as global point is depricated.

#ifdef GLOBALPOINT
	event = [[TiUtils pointToDictionary:tapPoint] mutableCopy];
	NSDictionary *globalPoint = [TiUtils pointToDictionary:[self convertPoint:tapPoint toView:nil]];
	[event setValue: globalPoint forKey:@"globalPoint"];
#else
	event = [TiUtils pointToDictionary:tapPoint];
#endif	//GLOBALPOINT
	
	if ([recognizer numberOfTouchesRequired] == 2) {
		[proxy fireEvent:@"twofingertap" withObject:event];
	}
	else if ([recognizer numberOfTapsRequired] == 2) {
		//Because double-tap suppresses touchStart and double-click, we must do this:
		if ([proxy _hasListeners:@"touchstart"])
		{
			[proxy fireEvent:@"touchstart" withObject:event propagate:YES];
		}
		if ([proxy _hasListeners:@"dblclick"]) {
			[proxy fireEvent:@"dblclick" withObject:event propagate:YES];
		}
		[proxy fireEvent:@"doubletap" withObject:event];
	}
	else {
		[proxy fireEvent:@"singletap" withObject:event];		
	}

#ifdef GLOBALPOINT
	[event release];
#endif	
}	

-(void)recognizedPinch:(UIPinchGestureRecognizer*)recognizer 
{ 
    NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                           NUMDOUBLE(recognizer.scale), @"scale", 
                           NUMDOUBLE(recognizer.velocity), @"velocity", 
                           nil]; 
    [self.proxy fireEvent:@"pinch" withObject:event]; 
}

-(void)recognizedLongPress:(UILongPressGestureRecognizer*)recognizer 
{ 
    if ([recognizer state] == UIGestureRecognizerStateBegan) {
        CGPoint p = [recognizer locationInView:self];
        NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                               NUMFLOAT(p.x), @"x",
                               NUMFLOAT(p.y), @"y",
                               nil];
        [self.proxy fireEvent:@"longpress" withObject:event]; 
    }
}

-(void)recognizedSwipe:(UISwipeGestureRecognizer *)recognizer
{
	NSString* swipeString;
	switch ([recognizer direction]) {
		case UISwipeGestureRecognizerDirectionUp:
			swipeString = @"up";
			break;
		case UISwipeGestureRecognizerDirectionDown:
			swipeString = @"down";
			break;
		case UISwipeGestureRecognizerDirectionLeft:
			swipeString = @"left";
			break;
		case UISwipeGestureRecognizerDirectionRight:
			swipeString = @"right";
			break;
		default:
			swipeString = @"unknown";
			break;
	}
	
	CGPoint tapPoint = [recognizer locationInView:self];
	NSMutableDictionary *event = [[TiUtils pointToDictionary:tapPoint] mutableCopy];
	[event setValue:swipeString forKey:@"direction"];

#define GLOBALPOINT	//Remove this for 1.9, as global point is depricated.
	
#ifdef GLOBALPOINT
	NSDictionary *globalPoint = [TiUtils pointToDictionary:[self convertPoint:tapPoint toView:nil]];
	[event setValue: globalPoint forKey:@"globalPoint"];
#endif	//GLOBALPOINT
	
	[proxy fireEvent:@"swipe" withObject:event];
	
	[event release];

}

#pragma mark Touch Events


- (BOOL)interactionDefault
{
	return YES;
}

- (BOOL)interactionEnabled
{
	return self.userInteractionEnabled;
}

- (BOOL)hasTouchableListener
{
	return handlesTouches;
}

- (UIView *)hitTest:(CGPoint) point withEvent:(UIEvent *)event 
{
	BOOL hasTouchListeners = [self hasTouchableListener];

	// if we don't have any touch listeners, see if interaction should
	// be handled at all.. NOTE: we don't turn off the views interactionEnabled
	// property since we need special handling ourselves and if we turn it off
	// on the view, we'd never get this event
	if (hasTouchListeners == NO && [self interactionEnabled]==NO)
	{
		return nil;
	}
	
    // OK, this is problematic because of the situation where:
    // touchDelegate --> view --> button
    // The touch never reaches the button, because the touchDelegate is as deep as the touch goes.
    
    /*
	// delegate to our touch delegate if we're hit but it's not for us
	if (hasTouchListeners==NO && touchDelegate!=nil)
	{
		return touchDelegate;
	}
     */
	
	UIView *hitView = [super hitTest:point withEvent:event];
	if (touchPassThrough)
	{
		if (hitView != self) 
			return hitView;
		return nil;
	}
	return hitView;
}

// TODO: Revisit this design decision in post-1.3.0
-(void)handleControlEvents:(UIControlEvents)events
{
	// For subclasses (esp. buttons) to override when they have event handlers.
	TiViewProxy* parentProxy = [(TiViewProxy*)proxy parent];
	if ([parentProxy viewAttached] && [parentProxy canHaveControllerParent]) {
		[[parentProxy view] handleControlEvents:events];
	}
}

// For subclasses
-(BOOL)touchedContentViewWithEvent:(UIEvent *)event
{
    return NO;
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
    if ([[event touchesForView:self] count] > 0 || [self touchedContentViewWithEvent:event]) {
        [self processTouchesBegan:touches withEvent:event];
    }
    [super touchesBegan:touches withEvent:event];
}

- (void)processTouchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
    UITouch *touch = [touches anyObject];
	
	if (handlesTouches)
	{
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[touch locationInView:self]]];
		[evt setValue:[TiUtils pointToDictionary:[touch locationInView:nil]] forKey:@"globalPoint"];
		
		if ([proxy _hasListeners:@"touchstart"])
		{
			[proxy fireEvent:@"touchstart" withObject:evt propagate:YES];
			[self handleControlEvents:UIControlEventTouchDown];
		}
        // Click handling is special; don't propagate if we have a delegate,
        // but DO invoke the touch delegate.
		// clicks should also be handled by any control the view is embedded in.
		if ([touch tapCount] == 1 && [proxy _hasListeners:@"click"])
		{
			if (touchDelegate == nil) {
				[proxy fireEvent:@"click" withObject:evt propagate:YES];
				return;
			} 
		} else if ([touch tapCount] == 2 && [proxy _hasListeners:@"dblclick"]) {
			[proxy fireEvent:@"dblclick" withObject:evt propagate:YES];
			return;
		}
	}
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
    if ([[event touchesForView:self] count] > 0 || [self touchedContentViewWithEvent:event]) {
        [self processTouchesMoved:touches withEvent:event];
    }
    [super touchesMoved:touches withEvent:event];
}

- (void)processTouchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
	UITouch *touch = [touches anyObject];
	if (handlesTouches)
	{
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[touch locationInView:self]]];
		[evt setValue:[TiUtils pointToDictionary:[touch locationInView:nil]] forKey:@"globalPoint"];
		if ([proxy _hasListeners:@"touchmove"])
		{
			[proxy fireEvent:@"touchmove" withObject:evt propagate:YES];
		}
	}
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event 
{
    if ([[event touchesForView:self] count] > 0 || [self touchedContentViewWithEvent:event]) {
        [self processTouchesEnded:touches withEvent:event];
    }
    [super touchesEnded:touches withEvent:event];
}

- (void)processTouchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
	if (handlesTouches)
	{
		UITouch *touch = [touches anyObject];
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[touch locationInView:self]]];
		[evt setValue:[TiUtils pointToDictionary:[touch locationInView:nil]] forKey:@"globalPoint"];
		if ([proxy _hasListeners:@"touchend"])
		{
			[proxy fireEvent:@"touchend" withObject:evt propagate:YES];
			[self handleControlEvents:UIControlEventTouchCancel];
		}
	}
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event 
{
    if ([[event touchesForView:self] count] > 0 || [self touchedContentViewWithEvent:event]) {
        [self processTouchesCancelled:touches withEvent:event];
    }
    [super touchesCancelled:touches withEvent:event];
}

- (void)processTouchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
	if (handlesTouches)
	{
		UITouch *touch = [touches anyObject];
		CGPoint point = [touch locationInView:self];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		if ([proxy _hasListeners:@"touchcancel"])
		{
			[proxy fireEvent:@"touchcancel" withObject:evt propagate:YES];
		}
	}
}

#pragma mark Listener management

-(void)removeGestureRecognizerOfClass:(Class)c
{
    for (UIGestureRecognizer* r in [self gestureRecognizers]) {
        if ([r isKindOfClass:c]) {
            [self removeGestureRecognizer:r];
            break;
        }
    }
}

-(void)configureGestureRecognizer:(UIGestureRecognizer*)gestureRecognizer
{
    [gestureRecognizer setDelaysTouchesBegan:NO];
    [gestureRecognizer setDelaysTouchesEnded:NO];
    [gestureRecognizer setCancelsTouchesInView:NO];
}

- (UIGestureRecognizer *)gestureRecognizerForEvent:(NSString *)event
{
    if ([event isEqualToString:@"singletap"]) {
        return [self singleTapRecognizer];
    }
    if ([event isEqualToString:@"doubletap"]) {
        return [self doubleTapRecognizer];
    }
    if ([event isEqualToString:@"twofingertap"]) {
        return [self twoFingerTapRecognizer];
    }
    if ([event isEqualToString:@"lswipe"]) {
        return [self leftSwipeRecognizer];
    }
    if ([event isEqualToString:@"rswipe"]) {
        return [self rightSwipeRecognizer];
    }
    if ([event isEqualToString:@"uswipe"]) {
        return [self upSwipeRecognizer];
    }
    if ([event isEqualToString:@"dswipe"]) {
        return [self downSwipeRecognizer];
    }
    if ([event isEqualToString:@"pinch"]) {
        return [self pinchRecognizer];
    }
    if ([event isEqualToString:@"longpress"]) {
        return [self longPressRecognizer];
    }
    return nil;
}

-(void)handleListenerAddedWithEvent:(NSString *)event
{
	ENSURE_UI_THREAD_1_ARG(event);
    [self updateTouchHandling];
    if ([event isEqualToString:@"swipe"]) {
        [[self gestureRecognizerForEvent:@"uswipe"] setEnabled:YES];
        [[self gestureRecognizerForEvent:@"dswipe"] setEnabled:YES];
        [[self gestureRecognizerForEvent:@"rswipe"] setEnabled:YES];
        [[self gestureRecognizerForEvent:@"lswipe"] setEnabled:YES];
    }
    else {
        [[self gestureRecognizerForEvent:event] setEnabled:YES];
    }
}

-(void)handleListenerRemovedWithEvent:(NSString *)event
{
	ENSURE_UI_THREAD_1_ARG(event);
	// unfortunately on a remove, we have to check all of them
	// since we might be removing one but we still have others

	[self updateTouchHandling];
    if ([event isEqualToString:@"swipe"]) {
        [[self gestureRecognizerForEvent:@"uswipe"] setEnabled:NO];
        [[self gestureRecognizerForEvent:@"dswipe"] setEnabled:NO];
        [[self gestureRecognizerForEvent:@"rswipe"] setEnabled:NO];
        [[self gestureRecognizerForEvent:@"lswipe"] setEnabled:NO];
    }
    else {
        [[self gestureRecognizerForEvent:event] setEnabled:NO];
    }
}

-(void)listenerAdded:(NSString*)event count:(int)count
{
	if (count == 1 && [self viewSupportsBaseTouchEvents])
	{
		[self handleListenerAddedWithEvent:event];
	}
}

-(void)listenerRemoved:(NSString*)event count:(int)count
{
	if (count == 0)
	{
		[self handleListenerRemovedWithEvent:event];
	}
}

-(void)sanitycheckListeners	//TODO: This can be optimized and unwound later.
{
	if(listenerArray == nil){
		listenerArray = [[NSArray alloc] initWithObjects: @"singletap",
						 @"doubletap",@"twofingertap",@"swipe",@"pinch",@"longpress",nil];
	}
	for (NSString * eventName in listenerArray) {
		if ([proxy _hasListeners:eventName]) {
			[self handleListenerAddedWithEvent:eventName];
		}
	}
}

@end
