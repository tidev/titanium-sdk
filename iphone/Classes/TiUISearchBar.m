/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW
#ifndef USE_TI_UISEARCHBAR
#define USE_TI_UISEARCHBAR
#endif
#endif

#ifdef USE_TI_UISEARCHBAR

#import "TiUtils.h"
#import "TiUISearchBarProxy.h"
#import "TiUISearchBar.h"

@implementation TiUISearchBar

-(void)dealloc
{
	[searchView setDelegate:nil];
	RELEASE_TO_NIL(searchView);
	[backgroundLayer removeFromSuperlayer];
	RELEASE_TO_NIL(backgroundLayer);
	[super dealloc];
}
-(CGFloat)contentHeightForWidth:(CGFloat)width
{
    return [[self searchBar] sizeThatFits:CGSizeZero].height;
}

-(UISearchBar*)searchBar
{
	if (searchView==nil)
	{
		searchView = [[UISearchBar alloc] initWithFrame:CGRectZero];
		[searchView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[searchView setDelegate:self];
		[searchView setShowsCancelButton:[(TiUISearchBarProxy *)[self proxy] showsCancelButton]];
		[self addSubview:searchView];
	}
	return searchView;
}	

- (id)accessibilityElement
{
	return [self searchBar];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[[self searchBar] setFrame:bounds];
	[backgroundLayer setFrame:bounds];
    [super frameSizeChanged:frame bounds:bounds];
}

-(void)setDelegate:(id<UISearchBarDelegate>)delegate_
{
	delegate = delegate_;
}

#pragma mark View controller stuff

-(void)blur:(id)args
{
	[searchView resignFirstResponder];
}

-(void)focus:(id)args
{
	[searchView becomeFirstResponder];
}


-(void)setValue_:(id)value
{
	[[self searchBar] setText:[TiUtils stringValue:value]];
}

-(void)setShowBookmark_:(id)value
{
	UISearchBar *search = [self searchBar];
	[search setShowsBookmarkButton:[TiUtils boolValue:value]];
	[search sizeToFit];
}

-(void)setShowCancel_:(id)value
{
	UISearchBar *search = [self searchBar];
	[search setShowsCancelButton:[TiUtils boolValue:value]];
	[search sizeToFit];
}

-(void)setHintText_:(id)value
{
	[[self searchBar] setPlaceholder:[TiUtils stringValue:value]];
}

-(void)setKeyboardType_:(id)value
{
	[[self searchBar] setKeyboardType:[TiUtils intValue:value]];
}

-(void)setPrompt_:(id)value
{
	[[self searchBar] setPrompt:[TiUtils stringValue:value]];
}

-(void)setAutocorrect_:(id)value
{
	[[self searchBar] setAutocorrectionType:[TiUtils boolValue:value] ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo];
}

-(void)setAutocapitalization_:(id)value
{
	[[self searchBar] setAutocapitalizationType:[TiUtils intValue:value]];
}

-(void)setBarColor_:(id)value
{
	TiColor * newBarColor = [TiUtils colorValue:value];
	UISearchBar *search = [self searchBar];
	
	[search setBarStyle:[TiUtils barStyleForColor:newBarColor]];
	[search setTintColor:[TiUtils barColorForColor:newBarColor]];
	[search setTranslucent:[TiUtils barTranslucencyForColor:newBarColor]];
}

-(CALayer *)backgroundImageLayer
{
	if(backgroundLayer==nil)
	{
		backgroundLayer = [[CALayer alloc] init];
		[backgroundLayer setFrame:[self bounds]];
		[[[self searchBar] layer] insertSublayer:backgroundLayer atIndex:1];
	}
	return backgroundLayer;
}

#pragma mark Delegate 

// called when text starts editing
- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar                    
{
	NSString * text = [searchBar text];
	[self.proxy replaceValue:text forKey:@"value" notification:NO];
	
	//No need to setValue, because it's already been set.
	if ([self.proxy _hasListeners:@"focus"])
	{
		[self.proxy fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"] propagate:NO];
	}
	
	if (delegate!=nil && [delegate respondsToSelector:@selector(searchBarTextDidBeginEditing:)])
	{
		[delegate searchBarTextDidBeginEditing:searchBar];
	}
}

// called when text ends editing
- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar                       
{
	NSString * text = [searchBar text];
	[self.proxy replaceValue:text forKey:@"value" notification:NO];
	
	//No need to setValue, because it's already been set.
	if ([self.proxy _hasListeners:@"blur"])
	{
		[self.proxy fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"] propagate:NO];
	}

	if (delegate!=nil && [delegate respondsToSelector:@selector(searchBarTextDidEndEditing:)])
	{
		[delegate searchBarTextDidEndEditing:searchBar];
	}
}

// called when text changes (including clear)
- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText   
{
	NSString * text = [searchBar text];
	[self.proxy replaceValue:text forKey:@"value" notification:NO];
	
	//No need to setValue, because it's already been set.
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}

	if (delegate!=nil && [delegate respondsToSelector:@selector(searchBar:textDidChange:)])
	{
		[delegate searchBar:searchBar textDidChange:searchText];
	}
}

// called when keyboard search button pressed
- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar                     
{
	NSString * text = [searchBar text];
	[self.proxy replaceValue:text forKey:@"value" notification:NO];
	
	//No need to setValue, because it's already been set.
	if ([self.proxy _hasListeners:@"return"])
	{
		[self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}

	if (delegate!=nil && [delegate respondsToSelector:@selector(searchBarSearchButtonClicked:)])
	{
		[delegate searchBarSearchButtonClicked:searchBar];
	}
}

// called when bookmark button pressed
- (void)searchBarBookmarkButtonClicked:(UISearchBar *)searchBar                   
{	
	NSString * text = @"";
	
	if ([searchBar text]!=nil)
	{
		text = [searchBar text];
	}
	
	[self.proxy replaceValue:text forKey:@"value" notification:NO];
	
	if ([self.proxy _hasListeners:@"bookmark"])
	{
		[self.proxy fireEvent:@"bookmark" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}
	
	if (delegate!=nil && [delegate respondsToSelector:@selector(searchBarBookmarkButtonClicked:)])
	{
		[delegate searchBarBookmarkButtonClicked:searchBar];
	}
	
}

// called when cancel button pressed
- (void)searchBarCancelButtonClicked:(UISearchBar *) searchBar                    
{
	NSString * text = [searchBar text];
	[self.proxy replaceValue:text forKey:@"value" notification:NO];
	
	if ([self.proxy _hasListeners:@"cancel"])
	{
		[self.proxy fireEvent:@"cancel" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}
	
	if (delegate!=nil && [delegate respondsToSelector:@selector(searchBarCancelButtonClicked:)])
	{
		[delegate searchBarCancelButtonClicked:searchBar];
	}
}


@end

#endif
