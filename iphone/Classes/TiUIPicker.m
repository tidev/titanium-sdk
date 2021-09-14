/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPICKER

#import "TiUIPicker.h"
#import "TiUIPickerColumnProxy.h"
#import "TiUIPickerRowProxy.h"
#import <TitaniumKit/TiUtils.h>

#define DEFAULT_ROW_HEIGHT 40
#define DEFAULT_COLUMN_PADDING 30

@implementation TiUIPicker

#pragma mark Internal

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoSize];
  [self setDefaultWidth:TiDimensionAutoSize];
}
#endif

- (void)dealloc
{
  RELEASE_TO_NIL(picker);
  [super dealloc];
}

USE_PROXY_FOR_VERIFY_AUTORESIZING

- (CGFloat)verifyHeight:(CGFloat)suggestedHeight
{
  // pickers have a forced height so we use it's height
  // instead of letting the user set it
  return picker.frame.size.height;
}

- (CGFloat)verifyWidth:(CGFloat)suggestedWidth
{
  if (suggestedWidth <= 0 && picker != nil) {
    return picker.frame.size.width;
  } else {
    return suggestedWidth;
  }
}

- (UIControl *)picker
{
  if (picker == nil) {
    CGFloat width = [TiUtils floatValue:[self.proxy valueForKey:@"width"] def:320];
    CGFloat height = [TiUtils floatValue:[self.proxy valueForKey:@"height"] def:216];

    NSString *widthString = [TiUtils stringValue:[self.proxy valueForKey:@"width"]];
    NSString *heightString = [TiUtils stringValue:[self.proxy valueForKey:@"height"]];
    NSNumberFormatter *shouldSize = [[[NSNumberFormatter alloc] init] autorelease];

    if ([shouldSize numberFromString:widthString] != nil) {
      [[self proxy] setValue:NUMDOUBLE(width) forKey:@"width"];
    }
    if ([shouldSize numberFromString:heightString] != nil) {
      [[self proxy] setValue:NUMDOUBLE(height) forKey:@"height"];
    }

    if (type == -1) {
      //TODO: this is not the way to abstract pickers, note the cast I had to add to the following line
      picker = (UIControl *)[[UIPickerView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
      ((UIPickerView *)picker).delegate = self;
      ((UIPickerView *)picker).dataSource = self;
    } else {
      picker = [[UIDatePicker alloc] initWithFrame:CGRectMake(0, 0, width, height)];
      [(UIDatePicker *)picker setTimeZone:[NSTimeZone localTimeZone]];
      [(UIDatePicker *)picker setDatePickerMode:type];
      [picker addTarget:self action:@selector(valueChanged:) forControlEvents:UIControlEventValueChanged];
    }
    [picker setBackgroundColor:[TiUtils isIOSVersionOrGreater:@"13.0"] ? UIColor.systemBackgroundColor : UIColor.whiteColor];

    [self addSubview:picker];
  }
  return picker;
}

- (id)accessibilityElement
{
  return [self picker];
}

- (BOOL)isDatePicker
{
  return type != -1;
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  if (picker != nil && !CGRectIsEmpty(bounds)) {
    [picker setFrame:bounds];
    if (![self isDatePicker]) {
      [(UIPickerView *)picker reloadAllComponents];
    }
  }
  [super frameSizeChanged:frame bounds:bounds];
}

- (void)didFirePropertyChanges
{
  if (!propertiesConfigured) {
    propertiesConfigured = YES;
    [(TiViewProxy *)[self proxy] firePropertyChanges];
  }
}

#pragma mark Framework

- (void)reloadColumn:(id)column
{
  //TODO: DatePicker checking should have been done long before the main thread.
  if ([self isDatePicker]) {
    return;
  }
  //Because the other logic checking and massaging is done in the proxy, we can jump to the chase.
  [(UIPickerView *)[self picker] reloadAllComponents];
}

- (NSArray *)columns
{
  return [self.proxy valueForKey:@"columns"];
}

- (TiProxy *)selectedRowForColumn:(NSInteger)column
{
  if ([self isDatePicker]) {
    //FIXME
    return nil;
  }
  NSInteger row = [(UIPickerView *)picker selectedRowInComponent:column];
  if (row == -1) {
    return nil;
  }
  TiUIPickerColumnProxy *columnProxy = [[self columns] objectAtIndex:column];
  return [columnProxy rowAt:row];
}

- (void)selectRowForColumn:(NSInteger)column row:(NSInteger)row animated:(BOOL)animated
{
  if (![self isDatePicker]) {
    [(UIPickerView *)picker selectRow:row inComponent:column animated:animated];
    [self pickerView:(UIPickerView *)picker didSelectRow:row inComponent:column];
  }
}

- (void)selectRow:(NSArray *)array
{
  NSInteger column = [TiUtils intValue:[array objectAtIndex:0]];
  NSInteger row = [TiUtils intValue:[array objectAtIndex:1]];
  BOOL animated = [array count] > 2 ? [TiUtils boolValue:[array objectAtIndex:2]] : NO;
  [self selectRowForColumn:column row:row animated:animated];
}

#pragma mark Public APIs

- (void)setType_:(id)type_
{
  NSInteger curtype = type;
  type = [TiUtils intValue:type_];
  id picker_ = [self picker];
  if (curtype != type && [self isDatePicker]) {
    [(UIDatePicker *)picker_ setDatePickerMode:type];
  }
}

#if IS_SDK_IOS_13_4
- (void)setDatePickerStyle_:(id)style
{
  if (![TiUtils isIOSVersionOrGreater:@"13.4"]) {
    DebugLog(@"setDatePickerStyle is only supported on iOS 13.4 and above");
    return;
  }
  UIControl *picker = [self picker];
  if ([self isDatePicker]) {
    [(UIDatePicker *)picker setPreferredDatePickerStyle:[TiUtils intValue:style]];
  }
}
#endif

// We're order-dependent on type being set first, so we need to make sure that anything that relies
// on whether or not this is a date picker needs to be set AFTER the initial configuration.
- (void)setSelectionIndicator_:(id)value
{
  if (picker == nil) {
    [[self proxy] replaceValue:value forKey:@"selectionIndicator" notification:NO];
  } else if (![self isDatePicker]) {
    [(UIPickerView *)[self picker] setShowsSelectionIndicator:[TiUtils boolValue:value]];
  }
}

- (void)setMinDate_:(id)date
{
  ENSURE_SINGLE_ARG_OR_NIL(date, NSDate);
  if (picker == nil) {
    [[self proxy] replaceValue:date forKey:@"minDate" notification:NO];
  } else if ([self isDatePicker]) {
    [(UIDatePicker *)[self picker] setMinimumDate:date];
  }
}

- (void)setMaxDate_:(id)date
{
  ENSURE_SINGLE_ARG_OR_NIL(date, NSDate);
  if (picker == nil) {
    [[self proxy] replaceValue:date forKey:@"maxDate" notification:NO];
  } else if ([self isDatePicker]) {
    [(UIDatePicker *)[self picker] setMaximumDate:date];
  }
}

- (void)setBackgroundColor_:(id)value
{
  [[self proxy] replaceValue:value forKey:@"backgroundColor" notification:NO];
  if (picker != nil) {
    [[self picker] setBackgroundColor:[[TiUtils colorValue:value] _color]];
  }
}

- (void)setDateTimeColor_:(id)value
{
  // Guard date picker and iOS 14+ date picker style
  if (![self isDatePicker] || [TiUtils isMacOS]) {
    return;
  }
#if IS_SDK_IOS_13_4
  if (((UIDatePicker *)[self picker]).preferredDatePickerStyle != UIDatePickerStyleWheels) {
    return;
  }
#endif

  [[self proxy] replaceValue:value
                      forKey:@"dateTimeColor"
                notification:NO];

  if (picker != nil) {
    [(UIDatePicker *)[self picker] setValue:[[TiUtils colorValue:value] _color] forKeyPath:@"textColor"];
    SEL selector = NSSelectorFromString(@"setHighlightsToday:");
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:[UIDatePicker instanceMethodSignatureForSelector:selector]];
    BOOL no = NO;

    [invocation setSelector:selector];
    [invocation setArgument:&no atIndex:2];
    [invocation invokeWithTarget:(UIDatePicker *)[self picker]];
  }
}

//TODO: minute interval

- (void)setValue_:(id)date
{
  ENSURE_SINGLE_ARG_OR_NIL(date, NSDate);
  if (picker == nil) {
    [[self proxy] replaceValue:date forKey:@"value" notification:NO];
  } else if ([self isDatePicker] && date != nil) {
    [(UIDatePicker *)[self picker] setDate:date];
  }
}

- (id)value_
{
  if ([self isDatePicker] && ([(UIDatePicker *)picker datePickerMode] != UIDatePickerModeCountDownTimer)) {
    return [(UIDatePicker *)[self picker] date];
  }
  return nil;
}

- (void)setLocale_:(id)value
{
  ENSURE_SINGLE_ARG_OR_NIL(value, NSString);
  if (picker == nil) {
    [[self proxy] replaceValue:value forKey:@"locale" notification:NO];
  } else if ([self isDatePicker]) {
    if (value == nil) {
      [(UIDatePicker *)[self picker] setLocale:[NSLocale currentLocale]];
    } else {
      NSString *identifier = [NSLocale canonicalLocaleIdentifierFromString:value];
      NSLocale *locale = [[NSLocale alloc] initWithLocaleIdentifier:identifier];
      [(UIDatePicker *)[self picker] setLocale:locale];
      [locale release];
    }
  }
}

- (void)setMinuteInterval_:(id)value
{
  ENSURE_SINGLE_ARG(value, NSObject);
  if (picker == nil) {
    [[self proxy] replaceValue:value forKey:@"minuteInterval" notification:NO];
  } else if ([self isDatePicker]) {
    NSInteger interval = [TiUtils intValue:value];
    [(UIDatePicker *)[self picker] setMinuteInterval:interval];
  }
}

- (void)setCountDownDuration_:(id)value
{
  ENSURE_SINGLE_ARG(value, NSObject);
  if (picker == nil) {
    [[self proxy] replaceValue:value forKey:@"countDownDuration" notification:NO];
  } else if ([self isDatePicker]) {
    double duration = [TiUtils doubleValue:value] / 1000;
    [(UIDatePicker *)[self picker] setDatePickerMode:UIDatePickerModeCountDownTimer];
    [(UIDatePicker *)[self picker] setCountDownDuration:duration];
  }
}

#pragma mark Datasources

// returns the number of 'columns' to display.
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView
{
  return [[self columns] count];
}

// returns the # of rows in each component..
- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component
{
  TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
  return proxy.rowCount.integerValue;
}

#pragma mark Delegates (only for UIPickerView)

// returns width of column and height of row for each component.
- (CGFloat)pickerView:(UIPickerView *)pickerView widthForComponent:(NSInteger)component
{
  //TODO: add blain's super duper width algorithm
  NSArray *theColumns = [self columns];
  if (component >= [theColumns count]) {
    return 0;
  }
  // first check to determine if this column has a width
  TiUIPickerColumnProxy *proxy = [theColumns objectAtIndex:component];
  id width = [proxy valueForKey:@"width"];
  if (width != nil) {
    return [TiUtils floatValue:width];
  }
  return (pickerView.frame.size.width - DEFAULT_COLUMN_PADDING) / [theColumns count];
}

- (CGFloat)pickerView:(UIPickerView *)pickerView rowHeightForComponent:(NSInteger)component
{
  NSArray *theColumns = [self columns];
  if (component >= [theColumns count]) {
    return 0;
  }
  TiUIPickerColumnProxy *proxy = [theColumns objectAtIndex:component];
  id height = [proxy valueForKey:@"height"];
  if (height != nil) {
    return [TiUtils floatValue:height];
  }

  return DEFAULT_ROW_HEIGHT;
}

// these methods return either a plain UIString, or a view (e.g UILabel) to display the row for the component.
// for the view versions, we cache any hidden and thus unused views and pass them back for reuse.
// If you return back a different object, the old one will be released. the view will be centered in the row rect
- (NSString *)pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component
{
  TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
  TiUIPickerRowProxy *rowproxy = [proxy rowAt:row];
  return [rowproxy valueForKey:@"title"];
}

- (UIView *)pickerView:(UIPickerView *)pickerView viewForRow:(NSInteger)row forComponent:(NSInteger)component reusingView:(UIView *)view
{
  TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
  TiUIPickerRowProxy *rowproxy = [proxy rowAt:row];
  CGRect frame = CGRectMake(0.0, 0.0, [self pickerView:pickerView widthForComponent:component] - 20, [self pickerView:pickerView rowHeightForComponent:component]);

  //Get the View
  UIView *theView = [rowproxy viewWithFrame:frame reusingView:view];

  //Configure Accessibility
  theView.isAccessibilityElement = YES;
  theView.accessibilityLabel = [TiUtils stringValue:[rowproxy valueForUndefinedKey:@"accessibilityLabel"]];
  theView.accessibilityValue = [TiUtils stringValue:[rowproxy valueForUndefinedKey:@"accessibilityValue"]];
  theView.accessibilityHint = [TiUtils stringValue:[rowproxy valueForUndefinedKey:@"accessibilityHint"]];
  return theView;
}

- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component
{
  if ([self.proxy _hasListeners:@"change"]) {
    TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
    TiUIPickerRowProxy *rowproxy = [proxy rowAt:row];
    NSMutableArray *selected = [NSMutableArray array];
    NSInteger colIndex = 0;
    for (TiUIPickerColumnProxy *col in [self columns]) {
      NSInteger rowIndex = row;
      if (component != colIndex) {
        rowIndex = [pickerView selectedRowInComponent:colIndex];
      }
      TiUIPickerRowProxy *rowSelected = [col rowAt:rowIndex];
      NSString *title = [rowSelected valueForUndefinedKey:@"title"];
      // if they have a title, make that the value otherwise use the row proxy
      if (title != nil) {
        [selected addObject:title];
      } else if (rowSelected != nil) {
        [selected addObject:rowSelected];
      } else {
        [selected addObject:[NSNull null]];
      }

      colIndex++;
    }
    NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                                            selected, @"selectedValue",
                                        NUMINTEGER(row), @"rowIndex",
                                        NUMINTEGER(component), @"columnIndex",
                                        proxy, @"column",
                                        rowproxy, @"row",
                                        nil];
    [self.proxy fireEvent:@"change" withObject:event];
  }
}

- (void)valueChanged:(id)sender
{
  if (sender == picker) {

    if ([self.proxy _hasListeners:@"change"]) {
      if ([self isDatePicker] && [(UIDatePicker *)picker datePickerMode] == UIDatePickerModeCountDownTimer) {
        double val = [(UIDatePicker *)picker countDownDuration] * 1000;
        NSNumber *newDuration = [NSNumber numberWithDouble:val];
        NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:newDuration, @"countDownDuration", nil];
        [self.proxy replaceValue:newDuration forKey:@"countDownDuration" notification:NO];
        [self.proxy fireEvent:@"change" withObject:event];
      } else {
        NSDate *date = [(UIDatePicker *)picker date];
        NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:date, @"value", nil];
        [self.proxy replaceValue:date forKey:@"value" notification:NO];
        [self.proxy fireEvent:@"change" withObject:event];
      }
    }
  }
}

@end

#endif
