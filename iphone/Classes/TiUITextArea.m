/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITEXTAREA
#import "TiUITextArea.h"
#import "TiUITextAreaProxy.h"

#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/Webcolor.h>

#ifdef USE_TI_UIATTRIBUTEDSTRING
#import "TiUIAttributedStringProxy.h"
#endif

@implementation TiUITextViewImpl

@synthesize enableCopy;

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  // If copy support is disabled, then remove actions "copy", "cut", and "share" from context menu.
  // Note: The "share" API is private. So, we remove it by accepting all other actions.
  if (!enableCopy) {
    if ((action != @selector(select:)) && (action != @selector(selectAll:)) && (action != @selector(paste:)) && (action != @selector(delete:))) {
      return NO;
    }
  }
  return [super canPerformAction:action withSender:sender];
}

- (void)setTouchHandler:(TiUIView *)handler
{
  // Assign only. No retain
  touchHandler = handler;
}

- (NSComparisonResult)comparePosition:(UITextPosition *)position toPosition:(UITextPosition *)other
{
  NSComparisonResult result = NSOrderedAscending;
  @try {
    result = [super comparePosition:position toPosition:other];
  }
  @catch (NSException *ex) {
    // Ignore exception that can occur on iOS 15 if "maxLength" trims text that was dragged-and-dropped.
  }
  return result;
}

- (BOOL)touchesShouldBegin:(NSSet *)touches withEvent:(UIEvent *)event inContentView:(UIView *)view
{
  // If the content view is of type TiUIView touch events will automatically propagate
  // If it is not of type TiUIView we will fire touch events with ourself as source
  if ([view isKindOfClass:[TiUIView class]]) {
    touchedContentView = view;
  } else {
    touchedContentView = nil;
  }
  return [super touchesShouldBegin:touches withEvent:event inContentView:view];
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  // When userInteractionEnabled is false we do nothing since touch events are automatically
  // propagated. If it is dragging do not do anything.
  // The reason we are not checking tracking (like in scrollview) is because for some
  // reason UITextView always returns true for tracking after the initial focus

  UITouch *touch = [touches anyObject];
  [(TiUITextArea *)touchHandler checkLinkForTouch:touch];

  if (!self.dragging && self.userInteractionEnabled && (touchedContentView == nil)) {
    [touchHandler processTouchesBegan:touches withEvent:event];
  }
  [super touchesBegan:touches withEvent:event];
}
- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  if (!self.dragging && self.userInteractionEnabled && (touchedContentView == nil)) {
    [touchHandler processTouchesMoved:touches withEvent:event];
  }
  [super touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  if (!self.dragging && self.userInteractionEnabled && (touchedContentView == nil)) {
    [touchHandler processTouchesEnded:touches withEvent:event];
  }
  [super touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  if (!self.dragging && self.userInteractionEnabled && (touchedContentView == nil)) {
    [touchHandler processTouchesCancelled:touches withEvent:event];
  }
  [super touchesCancelled:touches withEvent:event];
}
@end

@implementation TiUITextArea

#pragma mark Internal

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  [[self textWidgetView] sizeToFit];
  [super frameSizeChanged:frame bounds:bounds];
  [self updateVerticalAlignment];
}

- (void)updateVerticalAlignment
{
  UITextView *tv = (UITextView *)[self textWidgetView];

  id basePadding = [[self proxy] valueForUndefinedKey:@"padding"];
  UIEdgeInsets baseInset = [TiUtils contentInsets:basePadding];

  // Always reset to base insets first so we start from a clean state
  tv.textContainerInset = baseInset;
  [tv layoutIfNeeded];

  // Calculate the actual content height using base padding
  CGFloat contentHeight = tv.contentSize.height;
  CGFloat boundsHeight = self.bounds.size.height - 2 * self.layer.borderWidth;

  if (contentHeight < boundsHeight && verticalAlign != UIControlContentVerticalAlignmentTop) {
    CGFloat extraSpace = boundsHeight - contentHeight;
    if (verticalAlign == UIControlContentVerticalAlignmentCenter) {
      tv.textContainerInset = UIEdgeInsetsMake(baseInset.top + (extraSpace / 2.0), baseInset.left, baseInset.bottom + (extraSpace / 2.0), baseInset.right);
    } else if (verticalAlign == UIControlContentVerticalAlignmentBottom) {
      tv.textContainerInset = UIEdgeInsetsMake(baseInset.top, baseInset.left, baseInset.bottom + extraSpace, baseInset.right);
    }
    // Content fits, no scrolling needed
    tv.scrollEnabled = NO;
    // Reset offset so text is visible at the correct position
    tv.contentOffset = CGPointZero;
  } else if (tv.isFirstResponder) {
    // During editing, ensure the cursor stays visible by scrolling the selected range into view
    [tv scrollRangeToVisible:tv.selectedRange];
  }
}

- (UIView<UITextInputTraits> *)textWidgetView
{
  if (textWidgetView == nil) {
    TiUITextViewImpl *textViewImpl = [[TiUITextViewImpl alloc] initWithFrame:CGRectZero];
    [textViewImpl setTouchHandler:self];
    textViewImpl.delaysContentTouches = NO;
    textViewImpl.delegate = self;
    textViewImpl.enableCopy = YES;
    textViewImpl.text = @"";

    [self addSubview:textViewImpl];
    [textViewImpl setContentInset:UIEdgeInsetsZero];
    self.clipsToBounds = YES;

    lastSelectedRange.location = 0;
    lastSelectedRange.length = 0;

    textWidgetView = textViewImpl;

    verticalAlign = UIControlContentVerticalAlignmentTop;
    linesCount = 0;
    maxRows = -1;

    id padding = [[self proxy] valueForUndefinedKey:@"padding"];
    if (padding) {
      [self setPadding_:padding];
    }

    id verticalAlignValue = [[self proxy] valueForUndefinedKey:@"verticalAlign"];
    if (verticalAlignValue) {
      [self setVerticalAlign_:verticalAlignValue];
    } else {
      [self updateVerticalAlignment];
    }

    NSNumber *lines = [[self proxy] valueForUndefinedKey:@"lines"];
    if ([lines isKindOfClass:[NSNumber class]]) {
      [self setLines_:lines];
    }

    NSNumber *maxLines = [[self proxy] valueForUndefinedKey:@"maxLines"];
    if ([maxLines isKindOfClass:[NSNumber class]]) {
      [self setMaxLines_:maxLines];
    }
  }
  return textWidgetView;
}

- (void)adjustOffsetIfRequired:(UITextView *)tv
{
  CGFloat contentHeight = tv.contentSize.height;
  CGFloat boundsHeight = tv.bounds.size.height;
  CGFloat lineHeight = tv.font.lineHeight;

  if (contentHeight >= (boundsHeight - lineHeight)) {
    CGPoint curOffset = tv.contentOffset;
    curOffset.y = curOffset.y + lineHeight;
    [tv setContentOffset:curOffset animated:NO];
  }
}

- (void)checkLinkForTouch:(UITouch *)touch
{
  // TIMOB-23887: This is similar to UILabel implementation, rather native link recognizer of UITextView, to support TIMOB-19165.
  BOOL testLink = (textWidgetView != nil) && ([(TiViewProxy *)[self proxy] _hasListeners:@"link" checkParent:NO]);
  BOOL isEditable = ((UITextView *)[self textWidgetView]).isEditable;
  BOOL isLinkEnabled = [TiUtils boolValue:[[self proxy] valueForUndefinedKey:@"handleLinks"] def:YES];
  if (testLink && isLinkEnabled && !isEditable) {
    UITextView *textView = (UITextView *)[self textWidgetView];
    CGPoint tapPoint = [touch locationInView:textView];
    [self checkLinkAttributeForString:[textView attributedText] atPoint:tapPoint];
  }
}

- (NSUInteger)characterIndexAtPoint:(NSAttributedString *)theString atPoint:(CGPoint)point
{
  UITextView *textView = ((UITextView *)[self textWidgetView]);
  NSTextContainer *textContainer = textView.textContainer;
  NSLayoutManager *layoutManager = textView.layoutManager;

  // Manage point with respect to padding
  point.x -= textView.textContainerInset.left;
  point.y -= textView.textContainerInset.top;

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  CGRect wholeTextRect = [layoutManager boundingRectForGlyphRange:glyphRange
                                                  inTextContainer:textContainer];
  // Bail early if point outside the whole text bounding rect
  if (!CGRectContainsPoint(wholeTextRect, point)) {
    return NSNotFound;
  }

  // ask the layoutManager which glyph is under this tapped point
  NSUInteger glyphIdx = [layoutManager glyphIndexForPoint:point
                                          inTextContainer:textContainer
                           fractionOfDistanceThroughGlyph:NULL];

  // as explained in Apple's documentation the previous method returns the nearest glyph
  // if no glyph was present at that point. So if we want to ensure the point actually
  // lies on that glyph, we should check that explicitly
  CGRect glyphRect = [layoutManager boundingRectForGlyphRange:NSMakeRange(glyphIdx, 1)
                                              inTextContainer:textContainer];
  if (CGRectContainsPoint(glyphRect, point)) {
    NSUInteger index = [layoutManager characterIndexForGlyphAtIndex:glyphIdx];
    return index;
  } else {
    return NSNotFound;
  }
}

- (BOOL)checkLinkAttributeForString:(NSAttributedString *)theString atPoint:(CGPoint)p
{
  NSUInteger idx = [self characterIndexAtPoint:theString atPoint:p];

  if (idx == NSNotFound) {
    return NO;
  }

  NSRange theRange = NSMakeRange(0, 0);
  NSString *url = nil;
#ifdef USE_TI_UIATTRIBUTEDSTRING
  TiUIAttributedStringProxy *tempString = [[self proxy] valueForKey:@"attributedString"];
  url = [tempString getLink:idx];
#endif

  if (url == nil || url.length == 0) {
    return NO;
  }

  NSDictionary *eventDict = [NSDictionary dictionaryWithObjectsAndKeys:
                                              url, @"url",
                                          [NSArray arrayWithObjects:NUMUINTEGER(theRange.location), NUMUINTEGER(theRange.length), nil], @"range",
                                          nil];
  [[self proxy] fireEvent:@"link" withObject:eventDict propagate:NO reportSuccess:NO errorCode:0 message:nil];
  return YES;
}
#pragma mark Public APIs

- (void)setValue_:(id)value
{
  [super setValue_:value];
  TiThreadPerformOnMainThread(
      ^{
        [self updateVerticalAlignment];
      },
      NO);
}

- (void)setShowUndoRedoActions:(id)value
{
  UITextView *tv = (UITextView *)[self textWidgetView];
  if ([TiUtils boolValue:value]) {

    tv.inputAssistantItem.leadingBarButtonGroups = self.inputAssistantItem.leadingBarButtonGroups;
    tv.inputAssistantItem.trailingBarButtonGroups = self.inputAssistantItem.trailingBarButtonGroups;

  } else {

    tv.inputAssistantItem.leadingBarButtonGroups = @[];
    tv.inputAssistantItem.trailingBarButtonGroups = @[];
  }
}

- (void)setEnabled_:(id)value
{
  BOOL _trulyEnabled = ([TiUtils boolValue:value def:YES] && [TiUtils boolValue:[[self proxy] valueForUndefinedKey:@"editable"] def:YES]);
  [(UITextView *)[self textWidgetView] setEditable:_trulyEnabled];
}

- (void)setEnableCopy_:(id)value
{
  ((TiUITextViewImpl *)[self textWidgetView]).enableCopy = [TiUtils boolValue:value def:YES];
}

- (void)setScrollable_:(id)value
{
  [(UITextView *)[self textWidgetView] setScrollEnabled:[TiUtils boolValue:value]];
}

- (void)setLines_:(id)value
{
  linesCount = [TiUtils intValue:value def:0];
  [[self proxy] replaceValue:NUMINTEGER(linesCount) forKey:@"lines" notification:NO];
  if (linesCount > 0) {
    UITextView *tv = (UITextView *)[self textWidgetView];
    CGFloat lineHeight = tv.font.lineHeight;
    UIEdgeInsets padding = tv.textContainerInset;
    CGRect frame = self.bounds;
    frame.size.height = lineHeight * linesCount + padding.top + padding.bottom + 2 * self.layer.borderWidth;
    [self setFrame:frame];
  }
}

- (void)setMaxLines_:(id)value
{
  maxRows = [TiUtils intValue:value def:-1];
  [[self proxy] replaceValue:NUMINTEGER(maxRows) forKey:@"maxLines" notification:NO];
}

- (void)setEditable_:(id)value
{
  BOOL _trulyEnabled = ([TiUtils boolValue:value def:YES] && [TiUtils boolValue:[[self proxy] valueForUndefinedKey:@"enabled"] def:YES]);
  [(UITextView *)[self textWidgetView] setEditable:_trulyEnabled];
}

- (void)setAutoLink_:(id)type_
{
  [(UITextView *)[self textWidgetView] setDataDetectorTypes:[TiUtils intValue:type_ def:UIDataDetectorTypeNone]];
}

- (void)setBorderStyle_:(id)value
{
  // TODO
}

- (void)setScrollsToTop_:(id)value
{
  [(UITextView *)[self textWidgetView] setScrollsToTop:[TiUtils boolValue:value def:YES]];
}

- (void)setVerticalAlign_:(id)value
{
  verticalAlign = [TiUtils intValue:value];
  if (verticalAlign < UIControlContentVerticalAlignmentCenter || verticalAlign > UIControlContentVerticalAlignmentBottom) {
    verticalAlign = UIControlContentVerticalAlignmentCenter;
  }
  [[self proxy] replaceValue:value forKey:@"verticalAlign" notification:NO];
  [self updateVerticalAlignment];
}

- (void)setBackgroundColor_:(id)color
{
  [[self textWidgetView] setBackgroundColor:[TiUtils colorValue:color].color];
}

- (void)setPadding_:(id)args
{
  ENSURE_TYPE(args, NSDictionary);
  UIEdgeInsets inset = [TiUtils contentInsets:args];
  [(UITextView *)[self textWidgetView] setTextContainerInset:inset];

  [[self proxy] replaceValue:args forKey:@"padding" notification:NO];

  // Let the layout system handle it.
  // We don't force offset here because that breaks simulated vertical alignment via insets.
  [self updateVerticalAlignment];
}

#pragma mark Public Method

- (BOOL)hasText
{
  return [(UITextView *)[self textWidgetView] hasText];
}

// TODO: scrollRangeToVisible

#pragma mark UITextViewDelegate

- (BOOL)textView:(UITextView *)textView shouldInteractWithURL:(NSURL *)URL inRange:(NSRange)characterRange
{
  BOOL handleLinksSet = ([[self proxy] valueForUndefinedKey:@"handleLinks"] != nil);
  if ([(TiViewProxy *)[self proxy] _hasListeners:@"link" checkParent:NO]) {
    NSDictionary *eventDict = [NSDictionary dictionaryWithObjectsAndKeys:
                                                [URL absoluteString], @"url",
                                            [NSArray arrayWithObjects:NUMUINTEGER(characterRange.location), NUMUINTEGER(characterRange.length), nil], @"range",
                                            nil];
    [[self proxy] fireEvent:@"link" withObject:eventDict propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
  if (handleLinksSet) {
    return handleLinks;
  } else {
    return YES;
  }
}

- (void)textViewDidBeginEditing:(UITextView *)tv
{
  [self textWidget:tv didFocusWithText:[tv text]];
}

- (void)textViewDidEndEditing:(UITextView *)tv
{
  NSString *text = [(UITextView *)textWidgetView text];

  if (returnActive && [self.proxy _hasListeners:@"return"]) {
    [self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
  }

  returnActive = NO;

  [self textWidget:tv didBlurWithText:text];

  // Apply vertical alignment after editing is complete
  [self updateVerticalAlignment];
}

- (void)textViewDidChange:(UITextView *)tv
{
  NSNumber *textareaHeight = [NSNumber numberWithFloat:tv.contentSize.height];

  [(TiUITextAreaProxy *)[self proxy] noteValueChange:[(UITextView *)textWidgetView text]:textareaHeight];

  // Enforce maxLines cap
  if (maxRows > 0) {
    CGFloat lineHeight = tv.font.lineHeight;
    UIEdgeInsets padding = tv.textContainerInset;
    CGFloat maxHeight = lineHeight * maxRows + 2 * self.layer.borderWidth + padding.top + padding.bottom;

    // Only cap when content exceeds maxLines. Below maxLines, let the textarea
    // grow naturally without interfering with scrollEnabled.
    CGFloat contentTextHeight = tv.contentSize.height;
    if (contentTextHeight > maxHeight) {
      CGRect frame = self.bounds;
      if (frame.size.height > maxHeight) {
        frame.size.height = maxHeight;
        [self setFrame:frame];
      }
      tv.scrollEnabled = YES;
      [tv scrollRangeToVisible:tv.selectedRange];
    }
    // Below maxLines: don't touch scrollEnabled, let the textarea grow naturally.
  }
}

- (void)textViewDidChangeSelection:(UITextView *)tv
{
  if ([self.proxy _hasListeners:@"selected"]) {
    NSRange range = tv.selectedRange;
    NSDictionary *rangeDict = [NSDictionary dictionaryWithObjectsAndKeys:NUMUINTEGER(range.location), @"location",
                                            NUMUINTEGER(range.length), @"length", nil];
    NSDictionary *event = [NSDictionary dictionaryWithObject:rangeDict forKey:@"range"];
    [self.proxy fireEvent:@"selected" withObject:event];
  }
  // TIMOB-15401. Workaround for UI artifact
  if ((tv == textWidgetView) && (!NSEqualRanges(tv.selectedRange, lastSelectedRange))) {
    lastSelectedRange.location = tv.selectedRange.location;
    lastSelectedRange.length = tv.selectedRange.length;
    [tv scrollRangeToVisible:lastSelectedRange];
  }
}

- (BOOL)textViewShouldEndEditing:(UITextView *)tv
{
  return YES;
}

- (BOOL)textView:(UITextView *)tv shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  NSString *curText = [[tv text] stringByReplacingCharactersInRange:range withString:text];
  if ([text isEqualToString:@"\n"]) {
    [self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:[(UITextView *)textWidgetView text] forKey:@"value"]];
    if (suppressReturn) {
      [tv resignFirstResponder];
      return NO;
    }
  }

  [self processKeyPressed:text];

  if ((maxLength > -1) && ([curText length] > maxLength)) {
    [self setValue_:curText];
    return NO;
  }

  // TIMOB-15401. Workaround for UI artifact
  if ([tv isScrollEnabled] && [text isEqualToString:@"\n"]) {
    if (curText.length - tv.selectedRange.location == 1) {
      // Last line. Adjust
      [self adjustOffsetIfRequired:tv];
    }
  }

  return YES;
}

- (void)setHandleLinks_:(id)args
{
  ENSURE_SINGLE_ARG(args, NSNumber);
  handleLinks = [TiUtils boolValue:args];
  [[self proxy] replaceValue:NUMBOOL(handleLinks) forKey:@"handleLinks" notification:NO];
}

- (void)setHtml_:(id)html
{
  ENSURE_SINGLE_ARG(html, NSString);
  [[self proxy] replaceValue:html forKey:@"html" notification:NO];

  NSMutableAttributedString *attributedString = [[NSMutableAttributedString alloc] initWithData:[html dataUsingEncoding:NSUTF8StringEncoding]
                                                                                        options:@{ NSDocumentTypeDocumentAttribute : NSHTMLTextDocumentType,
                                                                                          NSCharacterEncodingDocumentAttribute : @(NSUTF8StringEncoding) }
                                                                             documentAttributes:nil
                                                                                          error:nil];

  // For parity with Android: Trim trailing newline characters which UIKit often appends for block tags.
  while (attributedString.length > 0) {
    unichar c = [[attributedString string] characterAtIndex:attributedString.length - 1];
    if (c == '\n' || c == '\r') {
      [attributedString deleteCharactersInRange:NSMakeRange(attributedString.length - 1, 1)];
    } else {
      break;
    }
  }

  [(UITextView *)[self textWidgetView] setAttributedText:attributedString];
  [attributedString release];
}

/*
Text area constrains the text event though the content offset and edge insets are set to 0
*/
#define TXT_OFFSET 20
- (CGFloat)contentWidthForWidth:(CGFloat)value
{
  UITextView *ourView = (UITextView *)[self textWidgetView];
  NSAttributedString *theString = [ourView attributedText];
  CGFloat txtWidth = ceilf([theString boundingRectWithSize:CGSizeMake(value, CGFLOAT_MAX)
                                                   options:NSStringDrawingUsesLineFragmentOrigin
                                                   context:nil]
                               .size.width);
  if (value - txtWidth >= TXT_OFFSET) {
    return (txtWidth + TXT_OFFSET);
  }
  return txtWidth + 2 * self.layer.borderWidth;
}

- (CGFloat)contentHeightForWidth:(CGFloat)value
{
  UITextView *ourView = (UITextView *)[self textWidgetView];

  // Measure using base padding only (without inflated alignment insets)
  // so the layout engine can shrink the frame when content decreases.
  id basePadding = [[self proxy] valueForUndefinedKey:@"padding"];
  UIEdgeInsets baseInset = [TiUtils contentInsets:basePadding];
  UIEdgeInsets savedInset = ourView.textContainerInset;
  ourView.textContainerInset = baseInset;

  // Force the text view to update its layout so contentSize is current.
  // This is needed because UITextView updates its layout asynchronously.
  CGSize fits = [ourView sizeThatFits:CGSizeMake(value, CGFLOAT_MAX)];
  ourView.textContainerInset = savedInset;

  CGFloat height = fits.height;

  // Floor height at lines
  if (linesCount > 0) {
    CGFloat lineHeight = ourView.font.lineHeight;
    UIEdgeInsets padding = savedInset;
    CGFloat minHeight = lineHeight * linesCount + 2 * self.layer.borderWidth + padding.top + padding.bottom;
    height = MAX(height, minHeight);
  }

  // Cap height at maxLines
  if (maxRows > 0) {
    CGFloat lineHeight = ourView.font.lineHeight;
    UIEdgeInsets padding = savedInset;
    CGFloat maxHeight = lineHeight * maxRows + 2 * self.layer.borderWidth + padding.top + padding.bottom;
    height = MIN(height, maxHeight);
  }

  return height;
}

- (void)scrollViewDidScroll:(id)scrollView
{
  // Clamp content offset to valid bounds when scrolling is disabled.
  // This prevents cursor displacement while keeping the view from
  // scrolling to invalid positions.
  UITextView *ourView = (UITextView *)[self textWidgetView];
  if (![ourView isScrollEnabled]) {
    CGPoint origin = [scrollView contentOffset];
    CGSize cs = ourView.contentSize;
    CGFloat maxOffsetY = MAX(0.0, cs.height - ourView.bounds.size.height);
    CGFloat maxOffsetX = MAX(0.0, cs.width - ourView.bounds.size.width);
    CGFloat clampedX = origin.x < 0 ? 0 : (origin.x > maxOffsetX ? maxOffsetX : origin.x);
    CGFloat clampedY = origin.y < 0 ? 0 : (origin.y > maxOffsetY ? maxOffsetY : origin.y);
    if (origin.x != clampedX || origin.y != clampedY) {
      [scrollView setContentOffset:CGPointMake(clampedX, clampedY) animated:NO];
    }
  }
}

@end

#endif
