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
#ifdef USE_TI_UIIOS3DMATRIX
	#import "TiUIiOS3DMatrix.h"
#endif
#import "TiViewProxy.h"
#import "TiApp.h"
#import "UIImage+Resize.h"

void InsetScrollViewForKeyboard(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight)
{
	VerboseLog(@"ScrollView:%@, keyboardTop:%f minimumContentHeight:%f",scrollView,keyboardTop,minimumContentHeight);

	CGRect scrollVisibleRect = [scrollView convertRect:[scrollView bounds] toView:[[TiApp controller] view]];
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

	CGRect scrollVisibleRect = [scrollView convertRect:[scrollView bounds] toView:[[TiApp controller] view]];
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

	CGRect scrollVisibleRect = [scrollView convertRect:[scrollView bounds] toView:[[TiApp controller] view]];
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

#define DOUBLE_TAP_DELAY		0.35
#define HORIZ_SWIPE_DRAG_MIN	12
#define VERT_SWIPE_DRAG_MAX		4

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
		[super performSelectorOnMainThread:@selector(removeFromSuperview) withObject:nil waitUntilDone:YES];
	}
}

- (id) init
{
	self = [super init];
	if (self != nil)
	{

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
	handlesTaps = touchEventsSupported && [self proxyHasTapListener];
	handlesTouches = touchEventsSupported && [self proxyHasTouchListener];
	handlesSwipes = touchEventsSupported && [proxy _hasListeners:@"swipe"];
}

-(void)initializeState
{
	virtualParentTransform = CGAffineTransformIdentity;
	
	[self updateTouchHandling];
	 
	self.backgroundColor = [UIColor clearColor]; 
	self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    
    // If a user has not explicitly set whether or not the view interacts, base it on whether or
    // not it handles events, and if not, set it to the interaction default.
    if (!changedInteraction) {
        self.userInteractionEnabled = (handlesTouches || handlesTaps || handlesSwipes) || [self interactionDefault];
    }
}

-(void)configurationSet
{
	// can be used to trigger things after all properties are set
}

-(void)setProxy:(TiProxy *)p
{
	proxy = p;
	[proxy setModelDelegate:self];
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
	// for subclasses to do crap
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
#ifdef USE_TI_UIIOS3DMATRIX	
	if ([transformMatrix isKindOfClass:[TiUIiOS3DMatrix class]])
	{
		self.layer.transform = CATransform3DConcat(CATransform3DMakeAffineTransform(virtualParentTransform),[(TiUIiOS3DMatrix*)transformMatrix matrix]);
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

-(void)setOpacity_:(id)opacity
{
	self.alpha = [TiUtils floatValue:opacity];
}

-(CALayer *)backgroundImageLayer
{
	return [self layer];
}

-(void)setBackgroundImage_:(id)image
{
	NSURL *bgURL = [TiUtils toURL:image proxy:proxy];
	UIImage *resultImage = [[ImageLoader sharedLoader] loadImmediateImage:bgURL];
	if (resultImage==nil && [image isEqualToString:@"Default.png"])
	{
		// special case where we're asking for Default.png and it's in Bundle not path
		resultImage = [UIImage imageNamed:image];
	}
	if((resultImage != nil) && ([resultImage imageOrientation] != UIImageOrientationUp))
	{
		resultImage = [UIImageResize resizedImage:[resultImage size] 
							 interpolationQuality:kCGInterpolationNone image:resultImage hires:NO];
	}

	[self backgroundImageLayer].contents = (id)resultImage.CGImage;
	[self backgroundImageLayer].contentsCenter = TiDimensionLayerContentCenter(topCap, leftCap, topCap, leftCap, [resultImage size]);
	self.clipsToBounds = image!=nil;
    self.backgroundImage = image;
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
	self.hidden = ![TiUtils boolValue:visible];
    
//	Redraw ourselves if changing from invisible to visible, to handle any changes made
	if (!self.hidden) {
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
#ifdef DEBUG
		NSLog(@"[DEBUG] animated called and we're not ready ... (will try again) %@",self);
#endif		
		if (animationDelayGuard++ > 5)
		{
#ifdef DEBUG
			NSLog(@"[DEBUG] animation guard triggered, we exceeded the timeout on waiting for view to become ready");
#endif		
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
		NSLog(@"[WARN] animate called with %@ but couldn't make an animation object",newAnimation);
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
		[singleTapRecognizer setCancelsTouchesInView:NO];
		[self addGestureRecognizer:singleTapRecognizer];

		if (doubleTapRecognizer != nil) {
			[singleTapRecognizer requireGestureRecognizerToFail:doubleTapRecognizer];
		}
		//If there are more gesture recognizer relationships, add it here.
	}
	return singleTapRecognizer;
}

-(UITapGestureRecognizer*)doubleTapRecognizer;
{
	if (doubleTapRecognizer == nil) {
		doubleTapRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedTap:)];
		[doubleTapRecognizer setNumberOfTapsRequired:2];
		[doubleTapRecognizer setDelaysTouchesBegan:NO];
		[doubleTapRecognizer setCancelsTouchesInView:NO];
		[self addGestureRecognizer:doubleTapRecognizer];
		
		if (singleTapRecognizer != nil) {
			[singleTapRecognizer requireGestureRecognizerToFail:doubleTapRecognizer];
		}		
		//If there are more gesture recognizer relationships, add it here.
	}
	return doubleTapRecognizer;
}

-(UITapGestureRecognizer*)twoFingerTapRecognizer;
{
	if (twoFingerTapRecognizer == nil) {
		twoFingerTapRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedTap:)];
		[twoFingerTapRecognizer setNumberOfTouchesRequired:2];
		[twoFingerTapRecognizer setCancelsTouchesInView:NO];
		[self addGestureRecognizer:twoFingerTapRecognizer];
		
		//If there are more gesture recognizer relationships, add it here.
	}
	return twoFingerTapRecognizer;
}

-(UIPinchGestureRecognizer*)pinchRecognizer;
{
	if (pinchRecognizer == nil) {
		pinchRecognizer = [[UIPinchGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedPinch:)];
		[pinchRecognizer setCancelsTouchesInView:NO];
		[self addGestureRecognizer:pinchRecognizer];
		
		//If there are more gesture recognizer relationships, add it here.		
	}
	return pinchRecognizer;
}

-(UISwipeGestureRecognizer*)leftSwipeRecognizer;
{
	if (leftSwipeRecognizer == nil) {
		leftSwipeRecognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedSwipe:)];
		[leftSwipeRecognizer setDirection:UISwipeGestureRecognizerDirectionLeft];
		[leftSwipeRecognizer setCancelsTouchesInView:NO];
		[self addGestureRecognizer:leftSwipeRecognizer];
	   
	   //If there are more gesture recognizer relationships, add it here.		
	}
	return leftSwipeRecognizer;
}

-(UISwipeGestureRecognizer*)rightSwipeRecognizer;
{
	if (rightSwipeRecognizer == nil) {
		rightSwipeRecognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedSwipe:)];
		[rightSwipeRecognizer setDirection: UISwipeGestureRecognizerDirectionRight];
		[rightSwipeRecognizer setCancelsTouchesInView:NO];
		[self addGestureRecognizer:rightSwipeRecognizer];
		
		//If there are more gesture recognizer relationships, add it here.		
	}
	return rightSwipeRecognizer;
}

-(UILongPressGestureRecognizer*)longPressRecognizer;
{
	if (longPressRecognizer == nil) {
		longPressRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedLongPress:)];
		[longPressRecognizer setCancelsTouchesInView:NO];
		[self addGestureRecognizer:longPressRecognizer];
		
		//If there are more gesture recognizer relationships, add it here.				
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
	return (handlesSwipes|| handlesTaps || handlesTouches);
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
	
    return [super hitTest:point withEvent:event];
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

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event 
{
	int count = [[event touchesForView:self] count];
	
	if (count == 0) {
		//The touch events are not for this view. Propagate and return
		[super touchesBegan:touches withEvent:event];
		return;
	}
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
			} else {
				[touchDelegate touchesBegan:touches withEvent:event];
			}
		} else if ([touch tapCount] == 2 && [proxy _hasListeners:@"dblclick"]) {
			[proxy fireEvent:@"dblclick" withObject:evt propagate:YES];
			return;
		}
	}
	[super touchesBegan:touches withEvent:event];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event 
{
	int count = [[event touchesForView:self] count];
	
	if (count == 0) {
		//The touch events are not for this view. Propagate and return
		[super touchesMoved:touches withEvent:event];
		return;
	}
	
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
	
	if (touchDelegate!=nil)
	{
		[touchDelegate touchesMoved:touches withEvent:event];
	}
	[super touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event 
{
	int count = [[event touchesForView:self] count];
	
	if (count == 0) {
		//The touch events are not for this view. Propagate and return
		[super touchesEnded:touches withEvent:event];
		return;
	}
	
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
	
	if (touchDelegate!=nil)
	{
		[touchDelegate touchesEnded:touches withEvent:event];
	}
	[super touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event 
{
	int count = [[event touchesForView:self] count];
	
	if (count == 0) {
		//The touch events are not for this view. Propagate and return
		[super touchesCancelled:touches withEvent:event];
		return;
	}
	
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
	
	if (touchDelegate!=nil)
	{
		[touchDelegate touchesCancelled:touches withEvent:event];
	}
	[super touchesCancelled:touches withEvent:event];
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

-(void)handleListenerAddedWithEvent:(NSString *)event
{
	ENSURE_UI_THREAD_1_ARG(event);
	if ([self proxyHasTouchListener])
	{
		handlesTouches = YES;
	}
	
	if ([event isEqualToString:@"singletap"]) {
		[[self singleTapRecognizer] setEnabled:YES];
		return;
    }
	if ([event isEqualToString:@"doubletap"]) {
		[[self doubleTapRecognizer] setEnabled:YES];
		return;
    }
	if ([event isEqualToString:@"twofingertap"]) {
		self.multipleTouchEnabled = YES;
		[[self twoFingerTapRecognizer] setEnabled:YES];
		return;
    }
	if ([event isEqualToString:@"swipe"]) {
		[[self leftSwipeRecognizer] setEnabled:YES];
		[[self rightSwipeRecognizer] setEnabled:YES];
		return;
    }
    if ([event isEqualToString:@"pinch"]) {
		[[self pinchRecognizer] setEnabled:YES];
		return;
    }
	if ([event isEqualToString:@"longpress"]) {
		[[self longPressRecognizer] setEnabled:YES];
		return;
    }
}

-(void)handleListenerRemovedWithEvent:(NSString *)event
{
	ENSURE_UI_THREAD_1_ARG(event);
	// unfortunately on a remove, we have to check all of them
	// since we might be removing one but we still have others
	
	if (handlesTouches && 
		[self.proxy _hasListeners:@"touchstart"]==NO &&
		[self.proxy _hasListeners:@"touchmove"]==NO &&
		[self.proxy _hasListeners:@"touchcancel"]==NO &&
		[self.proxy _hasListeners:@"touchend"]==NO &&
		[self.proxy _hasListeners:@"click"]==NO &&
		[self.proxy _hasListeners:@"dblclick"]==NO)
	{
		handlesTouches = NO;
	}
	if ([event isEqualToString:@"singletap"]) {
		[singleTapRecognizer setEnabled:NO];
		return;
    }
	if ([event isEqualToString:@"doubletap"]) {
		[doubleTapRecognizer setEnabled:NO];
		return;
    }
	if ([event isEqualToString:@"twofingertap"]) {
		self.multipleTouchEnabled = YES;
		[twoFingerTapRecognizer setEnabled:NO];
		return;
    }
	if ([event isEqualToString:@"swipe"]) {
		[leftSwipeRecognizer setEnabled:NO];
		[rightSwipeRecognizer setEnabled:NO];
		return;
    }
    if ([event isEqualToString:@"pinch"]) {
		[pinchRecognizer setEnabled:NO];
		return;
    }
	if ([event isEqualToString:@"longpress"]) {
		[longPressRecognizer setEnabled:NO];
		return;
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

@end
