/**
 * Copyright (c) 2009 Alex Fajkowski, Apparent Logic LLC
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
#if defined(USE_TI_UIIOSCOVERFLOWVIEW) || defined(USE_TI_UICOVERFLOWVIEW)	

#import "AFOpenFlowView.h"
#import "AFOpenFlowConstants.h"
#import "AFUIImageReflection.h"


@interface AFOpenFlowView (hidden)

- (void)setUpInitialState;
- (AFItemView *)coverForIndex:(NSInteger)coverIndex;
- (void)updateCoverImage:(AFItemView *)aCover;
- (AFItemView *)dequeueReusableCover;
- (void)layoutCovers:(NSInteger)selected fromCover:(NSInteger)lowerBound toCover:(NSInteger)upperBound;
- (void)layoutCover:(AFItemView *)aCover selectedCover:(NSInteger)selectedIndex animated:(Boolean)animated;
- (AFItemView *)findCoverOnscreen:(CALayer *)targetLayer;

@end

@implementation AFOpenFlowView (hidden)

const static CGFloat kReflectionFraction = 0.85;

- (void)setUpInitialState {
	// Set up the default image for the coverflow.
	self.defaultImage = [self.dataSource defaultImage];
	
	// Create data holders for onscreen & offscreen covers & UIImage objects.
	coverImages = [[NSMutableDictionary alloc] init];
	coverImageHeights = [[NSMutableDictionary alloc] init];
	offscreenCovers = [[NSMutableSet alloc] init];
	onscreenCovers = [[NSMutableDictionary alloc] init];
	
	scrollView = [[UIScrollView alloc] initWithFrame:self.frame];
	scrollView.userInteractionEnabled = NO;
	scrollView.multipleTouchEnabled = NO;
	scrollView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
	[self addSubview:scrollView];
	
	self.multipleTouchEnabled = NO;
	self.userInteractionEnabled = YES;
	self.autoresizesSubviews = YES;
	self.layer.position=CGPointMake(self.frame.size.width / 2, self.frame.size.height / 2);
	
	// Initialize the visible and selected cover range.
	lowerVisibleCover = upperVisibleCover = -1;
	selectedCoverView = nil;
	
	// Set up the cover's left & right transforms.
	leftTransform = CATransform3DTranslate(CATransform3DIdentity, 0, 0, SIDE_COVER_ZPOSITION);
	leftTransform = CATransform3DRotate(leftTransform, SIDE_COVER_ANGLE, 0.0f, 1.0f, 0.0f);
	rightTransform = CATransform3DTranslate(CATransform3DIdentity, 0, 0, SIDE_COVER_ZPOSITION);
	rightTransform = CATransform3DRotate(rightTransform, SIDE_COVER_ANGLE, 0.0f, -1.0f, 0.0f);
	
	// Set some perspective
	CATransform3D sublayerTransform = CATransform3DIdentity;
	sublayerTransform.m34 = -0.01;
	[scrollView.layer setSublayerTransform:sublayerTransform];
	
	[self updateLayout];
}

- (AFItemView *)coverForIndex:(NSInteger)coverIndex {
	AFItemView *coverView = [self dequeueReusableCover];
	if (!coverView)
		coverView = [[[AFItemView alloc] initWithFrame:CGRectZero] autorelease];
	
	coverView.number = coverIndex;
	
	return coverView;
}

- (void)updateCoverImage:(AFItemView *)aCover {
	NSNumber *coverNumber = [NSNumber numberWithInteger:aCover.number];
	UIImage *coverImage = (UIImage *)[coverImages objectForKey:coverNumber];
	if (coverImage) {
		NSNumber *coverImageHeightNumber = (NSNumber *)[coverImageHeights objectForKey:coverNumber];
		if (coverImageHeightNumber)
			[aCover setImage:coverImage originalImageHeight:[coverImageHeightNumber floatValue] reflectionFraction:kReflectionFraction];
	} else {
		// Bugfix for invalid defaultImage - SPT
		UIImage* cover = defaultImage;
		if (cover == nil) {
			cover = [self.dataSource defaultImage];
		}
		[aCover setImage:cover originalImageHeight:defaultImageHeight reflectionFraction:kReflectionFraction];
		[self.dataSource openFlowView:self requestImageForIndex:aCover.number];
	}
}

- (AFItemView *)dequeueReusableCover {
	AFItemView *aCover = [offscreenCovers anyObject];
	if (aCover) {
		[[aCover retain] autorelease];
		[offscreenCovers removeObject:aCover];
	}
	return aCover;
}

- (void)layoutCover:(AFItemView *)aCover selectedCover:(NSInteger)selectedIndex animated:(Boolean)animated  {
	NSInteger coverNumber = aCover.number;
	CATransform3D newTransform;
	CGPoint newPosition;
	
	newPosition.x = halfScreenWidth + aCover.horizontalPosition;
	newPosition.y = halfScreenHeight + aCover.verticalPosition;
	if (coverNumber < selectedIndex) {
		newPosition.x -= CENTER_COVER_OFFSET;
		newTransform = leftTransform;
	} else if (coverNumber > selectedIndex) {
		newPosition.x += CENTER_COVER_OFFSET;
		newTransform = rightTransform;
	} else {
		newTransform = CATransform3DIdentity;
	}
	
	if (animated) {
		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
		[UIView setAnimationBeginsFromCurrentState:YES];
	}
	
	aCover.layer.transform = newTransform;
	aCover.layer.position = newPosition;
	
	if (animated) {
		[UIView commitAnimations];
	}
}

- (void)layoutCovers:(NSInteger)selected fromCover:(NSInteger)lowerBound toCover:(NSInteger)upperBound {
	AFItemView *cover;
	NSNumber *coverNumber;
	for (NSInteger i = lowerBound; i <= upperBound; i++) {
		coverNumber = [[NSNumber alloc] initWithInteger:i];
		cover = (AFItemView *)[onscreenCovers objectForKey:coverNumber];
		[coverNumber release];
		[self layoutCover:cover selectedCover:selected animated:YES];
	}
}

- (AFItemView *)findCoverOnscreen:(CALayer *)targetLayer {
	// See if this layer is one of our covers.
	NSEnumerator *coverEnumerator = [onscreenCovers objectEnumerator];
	AFItemView *aCover = nil;
	while (aCover = (AFItemView *)[coverEnumerator nextObject])
		if ([[aCover.imageView layer] isEqual:targetLayer])
			break;
	
	return aCover;
}
@end


@implementation AFOpenFlowView
@synthesize dataSource, viewDelegate, numberOfImages, defaultImage;

#define COVER_BUFFER 6

- (void)awakeFromNib {
	[self setUpInitialState];
}

- (id)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		[self setUpInitialState];
	}
	
	return self;
}

- (void)dealloc {
	[defaultImage release];
	[scrollView release];
	
	[coverImages release];
	[coverImageHeights release];
	[offscreenCovers removeAllObjects];
	[offscreenCovers release];
	
	[onscreenCovers removeAllObjects];
	[onscreenCovers release];
	
	[super dealloc];
}

- (void)updateLayout
{
	halfScreenWidth = self.bounds.size.width / 2;
	halfScreenHeight = self.bounds.size.height / 2;

	NSInteger lowerBound = MAX(-1, selectedCoverView.number - COVER_BUFFER);
	NSInteger upperBound = MIN(self.numberOfImages - 1, selectedCoverView.number + COVER_BUFFER);

	[self layoutCovers:selectedCoverView.number fromCover:lowerBound toCover:upperBound];
	[self centerOnSelectedCover:NO];
}

- (void)setFrame:(CGRect)newSize {
	[super setFrame:newSize];
	[self updateLayout];
}

- (void)setBounds:(CGRect)newSize {
	[super setBounds:newSize];
	scrollView.contentSize = CGSizeMake(numberOfImages * COVER_SPACING + self.bounds.size.width, self.bounds.size.height);
	[self updateLayout];
}

- (void)setNumberOfImages:(NSInteger)newNumberOfImages {
    
    BOOL force = (newNumberOfImages != numberOfImages);
    if (newNumberOfImages < numberOfImages) {
        NSInteger current = newNumberOfImages;
        while (current < numberOfImages) {
            NSNumber *coverNumber = [NSNumber numberWithInteger:current];
            [coverImages removeObjectForKey:coverNumber];
            [coverImageHeights removeObjectForKey:coverNumber];
            current ++;
        }
    }
    
	numberOfImages = newNumberOfImages;
	scrollView.contentSize = CGSizeMake(newNumberOfImages * COVER_SPACING + self.bounds.size.width, self.bounds.size.height);

	NSInteger lowerBound = MAX(0, selectedCoverView.number - COVER_BUFFER);
	NSInteger upperBound = MIN(self.numberOfImages - 1, selectedCoverView.number + COVER_BUFFER);
	
    if (selectedCoverView) {
        if (!force) {
            [self layoutCovers:selectedCoverView.number fromCover:lowerBound toCover:upperBound];
        } else {
            NSInteger newSelected = (selectedCoverView.number < numberOfImages) ? selectedCoverView.number : (numberOfImages - 1);
            [self setSelectedCover:newSelected forceCalculation:YES];
        }
    }
    else {
        [self setSelectedCover:0];
    }
	
	[self centerOnSelectedCover:NO];
}

- (void)setDefaultImage:(UIImage *)newDefaultImage {
	[defaultImage release];
	if (newDefaultImage)
	{
		defaultImageHeight = newDefaultImage.size.height;
		defaultImage = [AddImageReflection(newDefaultImage,kReflectionFraction) retain];
	}
}

- (void)setImage:(UIImage *)image forIndex:(NSInteger)index {
	if (image==nil) return;
	// Create a reflection for this image.
	UIImage *imageWithReflection = AddImageReflection(image,kReflectionFraction);
	NSNumber *coverNumber = [NSNumber numberWithInteger:index];
	[coverImages setObject:imageWithReflection forKey:coverNumber];
	[coverImageHeights setObject:[NSNumber numberWithFloat:image.size.height] forKey:coverNumber];
	
	// If this cover is onscreen, set its image and call layoutCover.
	AFItemView *aCover = (AFItemView *)[onscreenCovers objectForKey:[NSNumber numberWithInteger:index]];
	if (aCover) {
		[aCover setImage:imageWithReflection originalImageHeight:image.size.height reflectionFraction:kReflectionFraction];
		[self layoutCover:aCover selectedCover:selectedCoverView.number animated:NO];
	}
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
	CGPoint startPoint = [[touches anyObject] locationInView:self];
	isDraggingACover = NO;
	
	// Which cover did the user tap?
	CALayer *targetLayer = (CALayer *)[scrollView.layer hitTest:startPoint];
	AFItemView *targetCover = [self findCoverOnscreen:targetLayer];
	isDraggingACover = (targetCover != nil);

	beginningCover = selectedCoverView.number;
	// Make sure the user is tapping on a cover.
	startPosition = (startPoint.x / 1.5) + scrollView.contentOffset.x;
	
	if (isSingleTap)
		isDoubleTap = YES;
		
	isSingleTap = ([touches count] == 1);
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event {
	isSingleTap = NO;
	isDoubleTap = NO;
	
	// Only scroll if the user started on a cover.
	if (!isDraggingACover)
		return;
	
	CGPoint movedPoint = [[touches anyObject] locationInView:self];
	CGFloat offset = startPosition - (movedPoint.x / 1.5);
	CGPoint newPoint = CGPointMake(offset, 0);
	scrollView.contentOffset = newPoint;
	int newCover = offset / COVER_SPACING;
	if (newCover != selectedCoverView.number) {
		if (newCover < 0)
			[self setSelectedCover:0];
		else if (newCover >= self.numberOfImages)
			[self setSelectedCover:self.numberOfImages - 1];
		else
			[self setSelectedCover:newCover];
	}
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {
	if (isSingleTap) {
		// Which cover did the user tap?
		CGPoint targetPoint = [[touches anyObject] locationInView:self];
		CALayer *targetLayer = (CALayer *)[scrollView.layer hitTest:targetPoint];
		AFItemView *targetCover = [self findCoverOnscreen:targetLayer];
		if (targetCover && (targetCover.number != selectedCoverView.number))
			[self setSelectedCover:targetCover.number];

		//jhaynie: modification to send click events on single taps
		if ([self.viewDelegate respondsToSelector:@selector(openFlowView:click:)])
		{
			[self.viewDelegate openFlowView:self click:selectedCoverView.number];
		}
	}
	[self centerOnSelectedCover:YES];
	
	// And send the delegate the newly selected cover message.
	if (beginningCover != selectedCoverView.number)
		if ([self.viewDelegate respondsToSelector:@selector(openFlowView:selectionDidChange:)])
			[self.viewDelegate openFlowView:self selectionDidChange:selectedCoverView.number];
}

- (void)centerOnSelectedCover:(BOOL)animated {
	CGPoint selectedOffset = CGPointMake(COVER_SPACING * selectedCoverView.number, 0);
    animated &= (self.frame.size.width > 0);
	[scrollView setContentOffset:selectedOffset animated:animated];
}

- (void)setSelectedCover:(NSInteger)newSelectedCover {
    [self setSelectedCover:newSelectedCover forceCalculation:NO];
}

- (void)setSelectedCover:(NSInteger)newSelectedCover forceCalculation:(BOOL)force{
	if (!force && selectedCoverView && (newSelectedCover == selectedCoverView.number))
		return;
	
	AFItemView *cover;
	NSInteger newLowerBound = MAX(0, newSelectedCover - COVER_BUFFER);
	NSInteger newUpperBound = MIN(self.numberOfImages - 1, newSelectedCover + COVER_BUFFER);
	if (!selectedCoverView || force) {
		[offscreenCovers removeAllObjects];
		[onscreenCovers removeAllObjects];
		// Allocate and display covers from newLower to newUpper bounds.
		for (NSInteger i=newLowerBound; i <= newUpperBound; i++) {
			cover = [self coverForIndex:i];
			[onscreenCovers setObject:cover forKey:[NSNumber numberWithInteger:i]];
			[self updateCoverImage:cover];
			[scrollView.layer addSublayer:cover.layer];
			[self layoutCover:cover selectedCover:newSelectedCover animated:NO];
		}
		
		lowerVisibleCover = newLowerBound;
		upperVisibleCover = newUpperBound;
		selectedCoverView = (AFItemView *)[onscreenCovers objectForKey:[NSNumber numberWithInteger:newSelectedCover]];
		
		return;
	}
	
	// Check to see if the new & current ranges overlap.
	if ((newLowerBound > upperVisibleCover) || (newUpperBound < lowerVisibleCover)) {
		// They do not overlap at all.
		// This does not animate--assuming it's programmatically set from view controller.
		// Recycle all onscreen covers.
		AFItemView *cover;
		for (NSInteger i = lowerVisibleCover; i <= upperVisibleCover; i++) {
			cover = (AFItemView *)[onscreenCovers objectForKey:[NSNumber numberWithInteger:i]];
			if (cover) {
				[offscreenCovers addObject:cover];
				[cover.layer removeFromSuperlayer];
				[onscreenCovers removeObjectForKey:[NSNumber numberWithInteger:cover.number]];
			}
		}
			
		// Move all available covers to new location.
		for (NSInteger i=newLowerBound; i <= newUpperBound; i++) {
			cover = [self coverForIndex:i];
			[onscreenCovers setObject:cover forKey:[NSNumber numberWithInteger:i]];
			[self updateCoverImage:cover];
			[scrollView.layer addSublayer:cover.layer];
		}

		lowerVisibleCover = newLowerBound;
		upperVisibleCover = newUpperBound;
		selectedCoverView = (AFItemView *)[onscreenCovers objectForKey:[NSNumber numberWithInteger:newSelectedCover]];
		[self layoutCovers:newSelectedCover fromCover:newLowerBound toCover:newUpperBound];
		
		return;
	} else if (newSelectedCover > selectedCoverView.number) {
		// Move covers that are now out of range on the left to the right side,
		// but only if appropriate (within the range set by newUpperBound).
		for (NSInteger i=lowerVisibleCover; i < newLowerBound; i++) {
			cover = (AFItemView *)[onscreenCovers objectForKey:[NSNumber numberWithInteger:i]];
			if (upperVisibleCover < newUpperBound) {
				// Tack it on the right side.
				upperVisibleCover++;
				cover.number = upperVisibleCover;
				[self updateCoverImage:cover];
				[onscreenCovers setObject:cover forKey:[NSNumber numberWithInteger:cover.number]];
				[self layoutCover:cover selectedCover:newSelectedCover animated:NO];
			} else {
				if (cover) {
					[offscreenCovers addObject:cover];
					[cover.layer removeFromSuperlayer];
				}
			}
			[onscreenCovers removeObjectForKey:[NSNumber numberWithInteger:i]];
		}
		lowerVisibleCover = newLowerBound;
		
		// Add in any missing covers on the right up to the newUpperBound.
		for (NSInteger i=upperVisibleCover + 1; i <= newUpperBound; i++) {
			cover = [self coverForIndex:i];
			[onscreenCovers setObject:cover forKey:[NSNumber numberWithInteger:i]];
			[self updateCoverImage:cover];
			[scrollView.layer addSublayer:cover.layer];
			[self layoutCover:cover selectedCover:newSelectedCover animated:NO];
		}
		upperVisibleCover = newUpperBound;
	} else {
		// Move covers that are now out of range on the right to the left side,
		// but only if appropriate (within the range set by newLowerBound).
		for (NSInteger i=upperVisibleCover; i > newUpperBound; i--) {
			cover = (AFItemView *)[onscreenCovers objectForKey:[NSNumber numberWithInteger:i]];
			if (lowerVisibleCover > newLowerBound) {
				// Tack it on the left side.
				lowerVisibleCover --;
				cover.number = lowerVisibleCover;
				[self updateCoverImage:cover];
				[onscreenCovers setObject:cover forKey:[NSNumber numberWithInteger:lowerVisibleCover]];
				[self layoutCover:cover selectedCover:newSelectedCover animated:NO];
			} else {
				// Recycle this cover.
				if (cover) {
					[offscreenCovers addObject:cover];
					[cover.layer removeFromSuperlayer];
				}
			}
			[onscreenCovers removeObjectForKey:[NSNumber numberWithInteger:i]];
		}
		upperVisibleCover = newUpperBound;
		
		// Add in any missing covers on the left down to the newLowerBound.
		for (NSInteger i=lowerVisibleCover - 1; i >= newLowerBound; i--) {
			cover = [self coverForIndex:i];
			[onscreenCovers setObject:cover forKey:[NSNumber numberWithInteger:i]];
			[self updateCoverImage:cover];
			[scrollView.layer addSublayer:cover.layer];
			[self layoutCover:cover selectedCover:newSelectedCover animated:NO];
		}
		lowerVisibleCover = newLowerBound;
	}

	if (selectedCoverView.number > newSelectedCover)
		[self layoutCovers:newSelectedCover fromCover:newSelectedCover toCover:selectedCoverView.number];
	else if (newSelectedCover > selectedCoverView.number)
		[self layoutCovers:newSelectedCover fromCover:selectedCoverView.number toCover:newSelectedCover];
	
	selectedCoverView = (AFItemView *)[onscreenCovers objectForKey:[NSNumber numberWithInteger:newSelectedCover]];
}

-(void)layoutSubviews
{
	[self centerOnSelectedCover:NO];
	[super layoutSubviews];
}

@end

#endif