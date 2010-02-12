/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewRowProxy.h"
#import "TiUITableViewCell.h"

#import "Webcolor.h"
#import "WebFont.h"
#import "ImageLoader.h"
#import "TiUtils.h"
#import "LayoutEntry.h"	

@implementation TiUITableViewRowProxy
@synthesize children, parent;

- (void) dealloc
{
	RELEASE_TO_NIL(children);
	parent = nil; //NOT RETAINED BY ROW
	[super dealloc];
}

- (void) replaceValue:(id)value forKey:(NSString*)key notification:(BOOL)notify
{
	id oldValue = [[self valueForKey:key] retain];
	[super replaceValue:value forKey:key notification:notify];
	if(notify && (parent != nil))
	{
		[parent row:self changedValue:value oldValue:oldValue forKey:key];
	}
	[oldValue release];
}


-(TiUITableViewCell *)cellForTableView:(UITableView *)tableView
{
	NSString * indentifier = [TiUtils stringValue:[self valueForKey:@"rowClass"]];
	if (indentifier==nil)
	{
		indentifier = [NSString stringWithFormat:@"%X",self];
	}

	TiUITableViewCell *result = (TiUITableViewCell *)[tableView dequeueReusableCellWithIdentifier:indentifier];
	if (result == nil)
	{
		int cellStyle = [TiUtils intValue:[self valueForKey:@"style"]];
		result = [[[TiUITableViewCell alloc] initWithStyle:cellStyle reuseIdentifier:indentifier] autorelease];
		[result setTableStyle:[tableView style]];
	}
	[result setProxy:self];	//This will read all the proxy values and set it alllllll up.
	return result;
}

-(CGFloat)rowHeightForWidth:(CGFloat)rowWidth
{
	CGFloat result;
	switch (rowHeight.type)
	{
		case TiDimensionTypePixels:
			result = rowHeight.value;
			break;
		case TiDimensionTypeAuto:
			result = [self autoHeightForWidth:rowWidth];
			break;
		default:
			return 0;	//Even if there's a minRowHeight or maxRowHeight, we don't want to honor it if we have no height?
			break;
	}
	
	return MAX(TiDimensionCalculateValue(minRowHeight, 0),
			MIN(TiDimensionCalculateValue(maxRowHeight, 0),result));
}

//This is called either internally or if the rowHeight of a table/section is 'auto'.
-(CGFloat)autoHeightForWidth:(CGFloat) rowWidth
{
	CGFloat result = 0;
	SEL autoHeightSelector = @selector(minimumParentHeightForWidth:);
	for (TiViewProxy * thisProxy in children)
	{
		if (![thisProxy respondsToSelector:autoHeightSelector])
		{
			continue;
		}

		CGFloat newResult = [thisProxy minimumParentHeightForWidth:rowWidth];
		if (newResult > result)
		{
			result = newResult;
		}
	}
	return result;
}

-(void)add:(id)args
{
	NSLog(@"added: %@",args);
	ENSURE_ARG_COUNT(args,1);
	TiViewProxy * newChild = [args objectAtIndex:0];

	ENSURE_TYPE(newChild,TiViewProxy);

	if (children==nil)
	{
		children = [[NSMutableArray alloc] initWithObjects:newChild,nil];
	}
	else
	{
		[children addObject:newChild];
	}

	if ([self modelDelegate] != nil)
	{
		[(TiUITableViewCell *)[self modelDelegate] performSelectorOnMainThread:@selector(addChild:)
				withObject:[newChild view] waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
	}
}

-(void)remove:(id)args
{
	ENSURE_ARG_COUNT(args,1);
	TiViewProxy * doomedChild = [args objectAtIndex:0];

//TODO: If this isn't a tiviewproxy, do we care?
	if (![children containsObject:doomedChild])
	{
		return;
	}
	
	if (([self modelDelegate] != nil) && [doomedChild viewAttached])
	{
		[(TiUITableViewCell *)[self modelDelegate] performSelectorOnMainThread:@selector(removeChild:)
				withObject:[doomedChild view] waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
	}

	[children removeObject:doomedChild];
}


#pragma mark JS-exposed properties

#define DECLARE_TIDIMENSION_SETTER(setter,prop)	\
-(void)setter:(id)newValue	\
{	\
prop = TiDimensionFromObject(newValue);	\
[self setValue:newValue forUndefinedKey:@"" #prop];	\
}

DECLARE_TIDIMENSION_SETTER(setRowHeight,rowHeight)
DECLARE_TIDIMENSION_SETTER(setMinRowHeight,minRowHeight)
DECLARE_TIDIMENSION_SETTER(setMaxRowHeight,maxRowHeight)

@end
