/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

@class TiUITableViewRowProxy;
@class TiUITableViewSectionProxy;

typedef enum 
{
	TiUITableViewActionUpdateRow,
	TiUITableViewActionDeleteRow,
	TiUITableViewActionInsertRowBefore,
    TiUITableViewActionInsertSectionBefore,
	TiUITableViewActionInsertRowAfter,
    TiUITableViewActionInsertSectionAfter,
	TiUITableViewActionAppendRow,
    TiUITableViewActionAppendRowWithSection,
	TiUITableViewActionSectionReload,
	TiUITableViewActionRowReload,
	TiUITableViewActionSetData
} TiUITableViewActionType;


@interface TiUITableViewAction : NSObject {
@private
	NSInteger animation;
	NSInteger section;
	TiUITableViewActionType type;
	TiUITableViewRowProxy *row;
}

@property(nonatomic,readonly) NSInteger animation;
@property(nonatomic,readonly) NSInteger section;
@property(nonatomic,readonly) TiUITableViewActionType type;
@property(nonatomic,readonly) TiUITableViewRowProxy *row;

-(id)initWithRow:(TiUITableViewRowProxy*)row animation:(NSDictionary*)animation section:(NSInteger)section type:(TiUITableViewActionType)type;
+(UITableViewRowAnimation)animationStyleForProperties:(NSDictionary*)properties;

@end

#endif