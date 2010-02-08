/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIGroupedView.h"
#import "TiUITableViewGroupSection.h"
#import "TiUITableViewCellProxy.h"
#import "TiUITableViewCell.h"
#import "Webcolor.h"

@implementation TiUIGroupedView


-(UITableViewStyle)tableStyle
{
	return UITableViewStyleGrouped;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{	
	TiUITableViewGroupSection * ourTableSection = [self sectionForIndex:[indexPath section]];
	TiUITableViewCellProxy * ourTableCell = [ourTableSection rowForIndex:[indexPath row]];
	
//	TiDimension result = [ourTableCell rowHeight];
//	CHECK_ROW_HEIGHT(result,ourTableCell,tableView);
//	
//	result = [[ourTableSection templateCell] rowHeight];
//	CHECK_ROW_HEIGHT(result,ourTableCell,tableView);
//	
//	result = [ourTableSection rowHeight];
//	CHECK_ROW_HEIGHT(result,ourTableCell,tableView);
	
	return [super tableView:tableView heightForRowAtIndexPath:indexPath];
}

-(TiUITableViewCell*)cellForIndexPath:(NSIndexPath *)path section:(TiUITableViewGroupSection*)sectionWrapper cell:(TiUITableViewCellProxy*)rowWrapper
{
	TiUITableViewCell *result = nil;
//	NSString * valueString = [rowWrapper value];
//	if (valueString == nil)
//	{
//		result = (TiUITableViewCell *)[tableview dequeueReusableCellWithIdentifier:@"text"];
//		if (result == nil)
//		{
//			result = [[[TiUITableViewValueCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"text"] autorelease];
//		}
//	} 
//	else 
//	{
//		UILabel * valueLabel;
//		id valueCell = [tableview dequeueReusableCellWithIdentifier:@"value"];
//		if (valueCell == nil)
//		{
//			result = [[[TiUITableViewValueCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"value"] autorelease];
//			valueLabel = [(TiUITableViewValueCell *)result valueLabel];
//			UIColor * textColor = [UIColor blackColor];
//			if ([rowWrapper accessoryType] == UITableViewCellAccessoryCheckmark) 
//			{
//				textColor = UIColorCheckmarkColor();
//			}
//			[valueLabel setTextColor:textColor]; 
//		} 
//		else 
//		{
//			valueLabel = [(TiUITableViewValueCell *)valueCell valueLabel];
//		}
//		[valueLabel setText:valueString];
//		[valueLabel setFont:[rowWrapper font]];	
//	}
	return result;
}


@end
