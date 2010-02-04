/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIGroupedSectionProxy.h"
#import "TiUtils.h"

@implementation TiUIGroupedSectionProxy

-(void)dealloc
{
	RELEASE_TO_NIL(section);
	[super dealloc];
}

-(TiUITableViewGroupSection*)section
{
	if (section == nil)
	{
		section = [[TiUITableViewGroupSection alloc] initWithHeader:[self valueForKey:@"header"] footer:[self valueForKey:@"footer"] withProperties:dynprops];
		section.delegate = self;
		
		NSString* name = [self valueForKey:@"name"];
		if (name!=nil)
		{
			[section setName:name];
		}
		
		id rowHeightObj = [self valueForKey:@"rowHeight"];
		if(rowHeightObj!=nil)
		{
			[section setRowHeight:[TiUtils dimensionValue:rowHeightObj]];
		}
		
		BOOL isButtonGroup = NO;
		NSString * rowType = [self valueForKey:@"type"];
		if (rowType!=nil)
		{
			if([rowType isEqualToString:@"button"])
			{
				isButtonGroup = YES;
			} 
			else if ([rowType isEqualToString:@"option"])
			{
				[section setIsOptionList:YES];
			}
		}
		
		TiColor *color = [TiUtils colorValue:@"color" properties:dynprops def:nil];
		if (color!=nil)
		{
			[section setHeaderColor:[color _color]];
		}
		
		NSDictionary * templateCellDict = [self valueForKey:@"template"];
		if (templateCellDict!=nil)
		{
			ENSURE_DICT(templateCellDict);
			[section setTemplateCell:[CellDataWrapper cellDataWithProperties:templateCellDict proxy:self font:[WebFont tableRowFont] template:nil]];
		}		
		
		NSArray * thisDataArray = [self valueForKey:@"data"];
		if (thisDataArray!=nil)
		{
			ENSURE_ARRAY(thisDataArray);
			for (NSDictionary * thisEntry in thisDataArray)
			{
				ENSURE_DICT(thisEntry);
				
				CellDataWrapper * thisRow = [CellDataWrapper cellDataWithProperties:thisEntry proxy:self font:[WebFont tableRowFont] template:nil];
				if (isButtonGroup) 
				{
					[thisRow setIsButton:YES];
				}
				
				[section addRow:thisRow];
			}
		}
	}
	return section;
}

-(void)didReceiveMemoryWarning:(NSNotification *)notification
{
	RELEASE_TO_NIL(section);
	[super didReceiveMemoryWarning:notification];
}

@end
