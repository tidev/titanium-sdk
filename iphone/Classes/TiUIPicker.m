/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIPicker.h"
#import "TiUtils.h"
#import "TiUIPickerRowProxy.h"
#import "TiUIPickerColumnProxy.h"

#define DEFAULT_ROW_HEIGHT 40
#define DEFAULT_COLUMN_PADDING 30

@implementation TiUIPicker

#pragma mark Internal

-(void)dealloc
{
	RELEASE_TO_NIL(picker);
	[super dealloc];
}

USE_PROXY_FOR_VERIFY_AUTORESIZING

-(CGFloat)verifyHeight:(CGFloat)suggestedHeight
{
	// pickers have a forced height so we use it's height
	// instead of letting the user set it
	return picker.frame.size.height;
}

-(UIControl*)picker 
{
	if (picker==nil)
	{
		if (type == -1)
		{
			picker = [[UIPickerView alloc] initWithFrame:CGRectZero];
			((UIPickerView*)picker).delegate = self;
			((UIPickerView*)picker).dataSource = self;
		}
		else 
		{
			//TODO: count down timer requires us to drive our own timer (or the dev)
			
			picker = [[UIDatePicker alloc] initWithFrame:CGRectZero];
			[(UIDatePicker*)picker setDatePickerMode:type];
		}
		[self addSubview:picker];
	}
	return picker;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (picker!=nil)
	{
		[TiUtils setView:picker positionRect:bounds];
	}
}

-(BOOL)isDatePicker
{
	return type != -1;
}

#pragma mark Framework 

-(void)reloadColumn:(id)column
{
	ENSURE_SINGLE_ARG(column,TiUIPickerColumnProxy);
	if ([self isDatePicker]==NO)
	{
		[(UIPickerView*)[self picker] reloadComponent:((TiUIPickerColumnProxy*)column).column];
	}
}

-(NSArray*)columns 
{
	return [self.proxy valueForKey:@"columns"];
}

#pragma mark Public APIs 

-(void)setType_:(id)type_
{
	type = [TiUtils intValue:type_];
	[self picker];
}

-(void)setSelectionIndicator_:(id)value
{
	if ([self isDatePicker]==NO)
	{
		[(UIPickerView*)[self picker] setShowsSelectionIndicator:[TiUtils boolValue:value]];
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
	return [proxy rowCount];
}
			 
			 
#pragma mark Delegates (only for UIPickerView) 


// returns width of column and height of row for each component. 
- (CGFloat)pickerView:(UIPickerView *)pickerView widthForComponent:(NSInteger)component
{
	//TODO: add blain's super duper width algorithm
	
	// first check to determine if this column has a width
	TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
	id width = [proxy valueForKey:@"width"];
	if (width != nil)
	{
		return [TiUtils floatValue:width];
	}
	return (self.frame.size.width - DEFAULT_COLUMN_PADDING) / [[self columns] count];
}

- (CGFloat)pickerView:(UIPickerView *)pickerView rowHeightForComponent:(NSInteger)component
{
	TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
	id height = [proxy valueForKey:@"height"];
	if (height != nil)
	{
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

/*- (UIView *)pickerView:(UIPickerView *)pickerView viewForRow:(NSInteger)row forComponent:(NSInteger)component reusingView:(UIView *)view
{
	return view;
}
*/

- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component
{
	if ([self.proxy _hasListeners:@"change"])
	{
		TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
		TiUIPickerRowProxy *rowproxy = [proxy rowAt:row];
		NSMutableArray *selected = [NSMutableArray array];
		//TODO: implemented selectedValue
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
							   selected,@"selectedValue",
							   NUMINT(row),@"rowIndex",
							   NUMINT(component),@"columnIndex",
							   proxy,@"column",
							   rowproxy,@"row",
							   nil];
		[self.proxy fireEvent:@"change" withObject:event];
	}
}


@end