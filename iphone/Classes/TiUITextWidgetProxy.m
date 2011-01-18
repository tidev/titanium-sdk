/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITEXTWIDGET) || defined(USE_TI_UITEXTAREA) || defined(USE_TI_UITEXTFIELD)

#import "TiUITextWidgetProxy.h"
#import "TiUITextWidget.h"

#import "TiUtils.h"

@implementation TiUITextWidgetProxy
DEFINE_DEF_BOOL_PROP(suppressReturn,YES);

- (void)windowWillClose
{
	if([self viewInitialized])
	{
		[[self view] resignFirstResponder];
	}
	[(TiViewProxy *)[keyboardTiView proxy] windowWillClose];
	for (TiViewProxy * thisToolBarItem in keyboardToolbarItems)
	{
		[thisToolBarItem windowWillClose];
	}
	[super windowWillClose];
}

- (void) dealloc
{	
	[keyboardTiView removeFromSuperview];
	[keyboardUIToolbar removeFromSuperview];
	RELEASE_TO_NIL(keyboardTiView);
	RELEASE_TO_NIL(keyboardToolbarItems);
	RELEASE_TO_NIL(keyboardUIToolbar);
	[super dealloc];
}


-(BOOL)hasText
{
	if ([self viewAttached])
	{
		return [(TiUITextWidget*)[self view] hasText];
	}
	NSString *value = [self valueForKey:@"value"];
	return value!=nil && [value length] > 0;
}

-(void)blur:(id)args
{
	if ([self viewAttached])
	{
		[[self view] performSelectorOnMainThread:@selector(resignFirstResponder) withObject:nil waitUntilDone:NO];
	}
}

-(void)focus:(id)args
{
	if ([self viewAttached])
	{
		[[self view] performSelectorOnMainThread:@selector(becomeFirstResponder) withObject:nil waitUntilDone:NO];
	}
}

-(BOOL)focused
{
	BOOL result=NO;
	if ([self viewAttached])
	{
		result = [(TiUITextWidget*)[self view] isFirstResponder];
	}

	return result;
}

-(void)noteValueChange:(NSString *)newValue
{
	if (![[self valueForKey:@"value"] isEqual:newValue])
	{
		[self replaceValue:newValue forKey:@"value" notification:NO];
		[self fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
	}
}

#pragma mark Toolbar

- (CGFloat) keyboardAccessoryHeight
{
	return MAX(keyboardAccessoryHeight,40);
}

-(void)setKeyboardToolbarHeight:(id)value
{
	ENSURE_UI_THREAD_1_ARG(value);
	keyboardAccessoryHeight = [TiUtils floatValue:value];
	//TODO: If we're focused or the toolbar is otherwise onscreen, we need to let the root view controller know and update.
}

-(void)setKeyboardToolbarColor:(id)value
{
	//Because views aren't lock-protected, ANY and all references, even checking if non-nil, should be done in the main thread.
	ENSURE_UI_THREAD_1_ARG(value);
	[self replaceValue:value forKey:@"keyboardToolbarColor" notification:YES];
	if(keyboardUIToolbar != nil){ //It already exists, update it.
		UIColor * newColor = [[TiUtils colorValue:value] _color];
		[keyboardUIToolbar setTintColor:newColor];
	}
}

-(void)updateUIToolbar
{
	NSMutableArray *items = [NSMutableArray arrayWithCapacity:[keyboardToolbarItems count]];
	for (TiViewProxy *proxy in keyboardToolbarItems)
	{
		if ([proxy supportsNavBarPositioning])
		{
			UIBarButtonItem* button = [proxy barButtonItem];
			[items addObject:button];
		}
	}
	[keyboardUIToolbar setItems:items animated:YES];
}

-(UIToolbar *)keyboardUIToolbar
{
	if(keyboardUIToolbar == nil)
	{
		keyboardUIToolbar = [[UIToolbar alloc] initWithFrame:CGRectMake(0, 0, 320,[self keyboardAccessoryHeight])];
		UIColor * newColor = [[TiUtils colorValue:[self valueForKey:@"keyboardToolbarColor"]] _color];
		if(newColor != nil){
			[keyboardUIToolbar setTintColor:newColor];
		}
		[self updateUIToolbar];
	}
	return keyboardUIToolbar;
}

-(void)setKeyboardToolbar:(id)value
{
	//Because views aren't lock-protected, ANY and all references, even checking if non-nil, should be done in the main thread.
	ENSURE_UI_THREAD_1_ARG(value);
	[self replaceValue:value forKey:@"keyboardToolbar" notification:YES];

	if (value == nil)
	{
//TODO: Should we remove these gracefully?
		[keyboardTiView removeFromSuperview];
		[keyboardUIToolbar removeFromSuperview];
		RELEASE_TO_NIL(keyboardTiView);
		RELEASE_TO_NIL(keyboardToolbarItems);
		[keyboardUIToolbar setItems:nil];
		return;
	}

	if ([value isKindOfClass:[NSArray class]])
	{
//TODO: Should we remove these gracefully?
		[keyboardTiView removeFromSuperview];
		RELEASE_TO_NIL(keyboardTiView);

//TODO: Make sure these are actually proxies.
		[keyboardToolbarItems autorelease];
		keyboardToolbarItems = [value copy];
		if(keyboardUIToolbar != nil){
			[self updateUIToolbar];
		}
//TODO: If we have focus while this happens, we need to signal an update.
		return;
	}

	if ([value isKindOfClass:[TiViewProxy class]])
	{
		if (value == keyboardTiView)
		{//Nothing to do here.
			return;
		}
//TODO: Should we remove these gracefully?
		[keyboardTiView removeFromSuperview];
		[keyboardUIToolbar removeFromSuperview];
		RELEASE_TO_NIL(keyboardTiView);
		RELEASE_TO_NIL(keyboardToolbarItems);
		[keyboardUIToolbar setItems:nil];
	
		keyboardTiView = [value retain];
//TODO: If we have focus while this happens, we need to signal an update.
	}
}

- (UIView *)keyboardAccessoryView;
{
	if(keyboardTiView != nil){
		return keyboardTiView;
	}

	if([keyboardToolbarItems count] > 0){
		return [self keyboardUIToolbar];
	}

	return nil;
}


@end

#endif