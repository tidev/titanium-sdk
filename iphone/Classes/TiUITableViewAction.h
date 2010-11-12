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
	TiUITableViewActionType type;
	id obj;
}

@property(nonatomic,readonly) NSInteger animation;
@property(nonatomic,readonly) TiUITableViewActionType type;
@property(nonatomic,readonly) id obj;

-(id)initWithObject:(id)obj_ animation:(NSDictionary*)animation_ type:(TiUITableViewActionType)type_;
+(UITableViewRowAnimation)animationStyleForProperties:(NSDictionary*)properties;

@end

#endif