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

-(TiProxy*)selectedRowForColumn:(NSInteger)column
{
	if ([self isDatePicker])
	{
		//FIXME
		return nil;
	}
	NSInteger row = [(UIPickerView*)picker selectedRowInComponent:column];
	if (row==-1)
	{
		return nil;
	}
	TiUIPickerColumnProxy *columnProxy = [[self columns] objectAtIndex:column];
	return [columnProxy rowAt:row];
}

-(void)selectRowForColumn:(NSInteger)column row:(NSInteger)row animated:(BOOL)animated
{
	if ([self isDatePicker])
	{
		//TODO
	}
	else 
	{
		[(UIPickerView*)picker selectRow:row inComponent:column animated:animated];
		[self pickerView:(UIPickerView*)picker didSelectRow:row inComponent:column];
	}
}

-(void)selectRow:(NSArray*)array
{
	NSInteger column = [TiUtils intValue:[array objectAtIndex:0]];
	NSInteger row = [TiUtils intValue:[array objectAtIndex:1]];
	BOOL animated = [array count] > 2 ? [TiUtils boolValue:[array objectAtIndex:2]] : NO;
	[self selectRowForColumn:column row:row animated:animated];
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

- (UIView *)pickerView:(UIPickerView *)pickerView viewForRow:(NSInteger)row forComponent:(NSInteger)component reusingView:(UIView *)view
{
	TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
	TiUIPickerRowProxy *rowproxy = [proxy rowAt:row];
	NSString *title = [rowproxy valueForKey:@"title"];
	if (title!=nil)
	{
		UILabel *pickerLabel = (UILabel *)view;
		
		if (pickerLabel == nil) 
		{
			CGRect frame = CGRectMake(0.0, 0.0, [self pickerView:pickerView widthForComponent:component]-20, [self pickerView:pickerView rowHeightForComponent:component]);
			pickerLabel = [[[UILabel alloc] initWithFrame:frame] autorelease];
			[pickerLabel setTextAlignment:UITextAlignmentLeft];
			[pickerLabel setBackgroundColor:[UIColor clearColor]];
			
			float fontSize = [TiUtils floatValue:[rowproxy valueForUndefinedKey:@"fontSize"] def:[TiUtils floatValue:[self.proxy valueForUndefinedKey:@"fontSize"] def:18.0]];	
			[pickerLabel setFont:[UIFont boldSystemFontOfSize:fontSize]];
		}
		
		[pickerLabel setText:title];
		return pickerLabel;
	}
	else 
	{
		return [rowproxy view];
	}
}

- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component
{
	if ([self.proxy _hasListeners:@"change"])
	{
		TiUIPickerColumnProxy *proxy = [[self columns] objectAtIndex:component];
		TiUIPickerRowProxy *rowproxy = [proxy rowAt:row];
		NSMutableArray *selected = [NSMutableArray array];
		NSInteger colIndex = 0;
		for (TiUIPickerColumnProxy *col in [self columns])
		{
			int rowIndex = [pickerView selectedRowInComponent:colIndex];
			TiUIPickerRowProxy *rowSelected = [col rowAt:rowIndex];
			NSString *title = [rowSelected valueForUndefinedKey:@"title"];
			// if they have a title, make that the value otherwise use the row proxy
			if (title!=nil)
			{
				[selected addObject:title];
			}
			else 
			{
				[selected addObject:rowSelected];
			}
			colIndex++;
		}
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