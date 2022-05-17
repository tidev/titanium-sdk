/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListSectionProxy.h"
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIListViewProxy : TiViewProxy <TiUIListViewDelegate>

@property (nonatomic, readonly) NSArray *sections;
@property (nonatomic, readonly) NSNumber *sectionCount;

- (TiUIListSectionProxy *)sectionForIndex:(NSUInteger)index;
- (void)deleteSectionAtIndex:(NSUInteger)index;
- (void)setMarker:(id)args;
@end

@interface TiUIListViewProxy (internal)
- (void)willDisplayCell:(NSIndexPath *)indexPath;
@end
#endif
