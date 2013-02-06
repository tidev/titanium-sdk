/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILABEL

#import "TiUIView.h"
#import "TTTAttributedLabel.h"

typedef enum {
    kContentTypeText,
    kContentTypeHTML
} ContentType;

@interface TiUILabel : TiUIView<LayoutAutosizing, TTTAttributedLabelDelegate> {
@private
	TTTAttributedLabel *label;
	BOOL requiresLayout;
    CGRect padding;
    CGRect textPadding;
    CGRect initialLabelFrame;
    
    ContentType contentType;
    NSString * content;
    
    NSMutableDictionary * options;
    
    UILineBreakMode _multilineBreakMode;
    
    WebFont* webFont;
    
    BOOL configSet;
}

@property(nonatomic,getter=isHighlighted) BOOL     highlighted;          // default is NO

@end

#endif
