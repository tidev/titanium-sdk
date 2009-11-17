/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_UI

#import "UiModule.h"
#import "Webcolor.h"
#import "TitaniumHost.h"
#import "TitaniumAppDelegate.h"
#import "TitaniumBlobWrapper.h"

#import "NativeControlProxy.h"
#import "SearchBarControl.h"



#import "TitaniumWebViewController.h"
#import "TitaniumTableViewController.h"
#import "TitaniumScrollableViewController.h"
#import "TitaniumCompositeViewController.h"
#import "TitaniumImageViewController.h"
#import "TitaniumCoverFlowViewController.h"

#import "TitaniumJSEvent.h"
#import "Logging.h"

#if __IPHONE_OS_VERSION_MIN_REQUIRED >= 30000
#import <MessageUI/MessageUI.h>
#import <MessageUI/MFMailComposeViewController.h>
#else
enum MFMailComposeResult {
    MFMailComposeResultCancelled,
    MFMailComposeResultSaved,
    MFMailComposeResultSent,
    MFMailComposeResultFailed
};
typedef enum MFMailComposeResult MFMailComposeResult;   // available in iPhone 3.0

@class MFMailComposeViewController;
@protocol MFMailComposeViewControllerDelegate <NSObject>
@end

#endif

NSString * UrlEncodeString(NSString * string)
{
	NSString *out = [string stringByAddingPercentEscapesUsingEncoding:[string fastestEncoding]];
	out = [out stringByReplacingOccurrencesOfString:@"'" withString:@"%27"];
	//out = [out stringByReplacingOccurrencesOfString:@" " withString:@"+"];
	return out;
}

@interface ModalProxy : NSObject<UIActionSheetDelegate,UIAlertViewDelegate>
{
	UIActionSheet * actionSheet;
	UIAlertView * alertView;
	UIView * parentView;
	NSString * tokenString;
	NSString * contextString;
}
@property(nonatomic,copy,readwrite)	NSString * tokenString;
@property(nonatomic,copy,readwrite)	NSString * contextString;
@property(nonatomic,retain,readwrite)	UIView * parentView;

- (void) showActionSheetWithDict: (NSDictionary *) inputDict;
- (void) showAlertViewWithDict: (NSDictionary *) inputDict;

@end

@implementation ModalProxy
@synthesize tokenString,contextString,parentView;

- (BOOL) takeToken: (NSDictionary *) inputDict;
{
	NSString * tokenStringObject = [inputDict objectForKey:@"_TOKEN"];
	if (![tokenStringObject isKindOfClass:[NSString class]])return NO;
	[self setTokenString:tokenStringObject];
	
	TitaniumHost * theTH = [TitaniumHost sharedHost];
	[self setContextString:[[theTH currentThread] magicToken]];
	[self setParentView:[[theTH titaniumViewControllerForToken:contextString] view]];
	
	return YES;
}

- (void) showActionSheetWithDict: (NSDictionary *) inputDict;
{
	Class NSStringClass = [NSString class];

	[actionSheet release];
	actionSheet = [[UIActionSheet alloc] init];
	[actionSheet setDelegate:self];
	
	id titleString = [inputDict objectForKey:@"title"];
	if ([titleString respondsToSelector:@selector(stringValue)])titleString = [titleString stringValue];
	if ([titleString isKindOfClass:NSStringClass]) [actionSheet setTitle:titleString];

	BOOL needsCancel = YES;
	NSArray * optionObjectArray = [inputDict objectForKey:@"options"];
	if ([optionObjectArray isKindOfClass:[NSArray class]]){
		for (id buttonTitle in optionObjectArray){
			if([buttonTitle respondsToSelector:@selector(stringValue)])buttonTitle = [buttonTitle stringValue];
			if([buttonTitle isKindOfClass:NSStringClass]){
				[actionSheet addButtonWithTitle:buttonTitle];
				needsCancel = NO;
			} else {
				//Error?
			}
		}
	}

	id destructiveObject = [inputDict objectForKey:@"destructive"];
	if ([destructiveObject respondsToSelector:@selector(intValue)]){
		[actionSheet setDestructiveButtonIndex:[destructiveObject intValue]];
	}

	if (needsCancel) {
		[actionSheet setCancelButtonIndex:[actionSheet addButtonWithTitle:@"OK"]];
	} else {
		id cancelObject = [inputDict objectForKey:@"cancel"];
		if ([cancelObject respondsToSelector:@selector(intValue)]){
			[actionSheet setCancelButtonIndex:[cancelObject intValue]];
		}
	}
	
	UIView * doomedView = [[[TitaniumAppDelegate sharedDelegate] viewController] view];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:YES];
	[actionSheet showInView:doomedView];

	// fire action to any module listeners
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventActionSheetShown:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(actionSheet),@"actionSheet",VAL_OR_NSNULL(inputDict),@"properties",nil]];

	[self retain];
}

- (void) showAlertViewWithDict: (NSDictionary *) inputDict;
{
	Class NSStringClass = [NSString class];
	
	[alertView release];
	alertView = [[UIAlertView alloc] init];
	[alertView setDelegate:self];
	
	id titleString = [inputDict objectForKey:@"title"];
	if ([titleString respondsToSelector:@selector(stringValue)])titleString = [titleString stringValue];
	if ([titleString isKindOfClass:NSStringClass]) [alertView setTitle:titleString];

	id messageString = [inputDict objectForKey:@"message"];
	if ([messageString respondsToSelector:@selector(stringValue)])messageString = [messageString stringValue];
	if ([messageString isKindOfClass:NSStringClass]) [alertView setMessage:messageString];
	
	BOOL needsCancel = YES;
	NSArray * optionObjectArray = [inputDict objectForKey:@"options"];
	if ([optionObjectArray isKindOfClass:[NSArray class]]){
		for (id buttonTitle in optionObjectArray){
			if([buttonTitle respondsToSelector:@selector(stringValue)])buttonTitle = [buttonTitle stringValue];
			if([buttonTitle isKindOfClass:NSStringClass]){
				[alertView addButtonWithTitle:buttonTitle];
				needsCancel = NO;
			} else {
				//Error?
			}
		}
	}
	
	if (needsCancel) {
		[alertView setCancelButtonIndex:[alertView addButtonWithTitle:@"OK"]];
	} else {
		id cancelObject = [inputDict objectForKey:@"cancel"];
		if ([cancelObject respondsToSelector:@selector(intValue)]){
			[alertView setCancelButtonIndex:[cancelObject intValue]];
		}
	}
	
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:YES];
	[alertView show];
	// fire event listener
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAlertViewShown:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(alertView),@"alertView",VAL_OR_NSNULL(inputDict),@"properties",nil]];
	[self retain];
}

- (void)actionSheet:(UIActionSheet *)anActionSheet clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSString * result = [NSString stringWithFormat:@"Ti.UI._MODAL.%@.onClick('click',"
			"{type:'click',index:%d,cancel:%d,destructive:%d})",tokenString,buttonIndex,
			[anActionSheet cancelButtonIndex],[anActionSheet destructiveButtonIndex]];
	[[TitaniumHost sharedHost] sendJavascript:result toPageWithToken:contextString];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:NO];
	[self autorelease];
}

- (void)alertView:(UIAlertView *)anAlertView clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSString * result = [NSString stringWithFormat:@"Ti.UI._MODAL.%@.onClick('click',"
			"{type:'click',index:%d,cancel:%d})",tokenString,buttonIndex,[anAlertView cancelButtonIndex]];
	[[TitaniumHost sharedHost] sendJavascript:result toPageWithToken:contextString];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:NO];
	[self autorelease];
}

- (void) dealloc
{
	[actionSheet release];
	[alertView release];
	[parentView release];
	[tokenString release];
	[contextString release];
	[super dealloc];
}


@end


@interface EmailComposerProxy : TitaniumProxyObject<MFMailComposeViewControllerDelegate>
{
	BOOL animated;
	NSDictionary * propertyDict;
	MFMailComposeViewController * emailComposer;
	NSURL * urlVersion;
}
@property(nonatomic,readwrite,retain)	NSDictionary * propertyDict;
@property(nonatomic,readwrite,assign)	BOOL animated;

- (void) setPropertyDict: (NSDictionary *) newDict;
- (void) performComposition;

@end

@implementation EmailComposerProxy
@synthesize animated,propertyDict;

- (id) init
{
	VERBOSE_LOG(@"[DEBUG] Initing emailcomposerproxy");
	self = [super init];
	if (self != nil) {
		animated = YES;
	}
	return self;
}

- (void) dealloc
{
	VERBOSE_LOG(@"[DEBUG] Deallocing emailcomposer");
	[emailComposer release];
	[urlVersion release];
	[super dealloc];
}


- (NSString *) sanitizeString:(id) inputObject;
{
	if ([inputObject respondsToSelector:@selector(stringValue)])return [inputObject stringValue];
	if ([inputObject isKindOfClass:[NSString class]]) return inputObject;
	return nil;
}

- (NSArray *) sanitizeArray:(id) inputObject;
{
	Class stringClass = [NSString class];

	if ([inputObject isKindOfClass:[NSArray class]]){
		for (NSString * thisEntry in inputObject){
			if (![thisEntry isKindOfClass:stringClass]) return nil;
		}
		return inputObject;
	}
	
	if ([inputObject isKindOfClass:stringClass]){
		return [NSArray arrayWithObject:inputObject];
	}
	
	return nil;
}

- (void) performComposition;
{
	[self setToken:[self sanitizeString:[propertyDict objectForKey:@"_TOKEN"]]];
	Class mailClass = NSClassFromString(@"MFMailComposeViewController");
	NSString * subject = [self sanitizeString:[propertyDict objectForKey:@"subject"]];
	NSArray * toArray = [self sanitizeArray:[propertyDict objectForKey:@"toRecipients"]];
	NSArray * bccArray = [self sanitizeArray:[propertyDict objectForKey:@"bccRecipients"]];
	NSArray * ccArray = [self sanitizeArray:[propertyDict objectForKey:@"ccRecipients"]];
	NSString * message = [self sanitizeString:[propertyDict objectForKey:@"messageBody"]];
	NSArray * attachmentArray = [propertyDict objectForKey:@"attachments"];
	
	if ((mailClass != nil) && [mailClass canSendMail]){
		if(emailComposer==nil){
			VERBOSE_LOG(@"[DEBUG] Creating emailcomposer");
			emailComposer = [[mailClass alloc] init];
			[emailComposer setMailComposeDelegate:self];
		}
		NSString * emailBarColorString = [self sanitizeString:[propertyDict objectForKey:@"barColor"]];
		if(emailBarColorString != nil){
			UIColor * emailBarColor = UIColorWebColorNamed(emailBarColorString);
			if(emailBarColor != nil)[[emailComposer navigationBar] setTintColor:emailBarColor];
		}
		[emailComposer setSubject:subject];
		[emailComposer setToRecipients:toArray];
		[emailComposer setBccRecipients:bccArray];
		[emailComposer setCcRecipients:ccArray];
		[emailComposer setMessageBody:message isHTML:NO];
		if([attachmentArray isKindOfClass:[NSArray class]]){
			for (id thisAttachment in attachmentArray){
				if ([thisAttachment isKindOfClass:[TitaniumBlobWrapper class]]){
					[emailComposer addAttachmentData:[(TitaniumBlobWrapper *)thisAttachment dataBlob]
											mimeType:[(TitaniumBlobWrapper *)thisAttachment mimeType]
											fileName:[(TitaniumBlobWrapper *)thisAttachment virtualFileName]];
				}
			}
		}
		UIViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:[self parentPageToken]];
		[[TitaniumHost sharedHost] navigationController:[ourVC navigationController] presentModalView:(UIViewController *)emailComposer animated:animated];
		[self retain];
		
		return;
	}
	
	[urlVersion release];
	
	NSMutableString * resultString = [[NSMutableString alloc] initWithFormat:@"mailto:%@?",UrlEncodeString([toArray componentsJoinedByString:@","])];
	
	if(ccArray)[resultString appendFormat:@"cc=%@&",UrlEncodeString([ccArray componentsJoinedByString:@","])];
	
	if(bccArray)[resultString appendFormat:@"bcc=%@&",UrlEncodeString([bccArray componentsJoinedByString:@","])];
	
	if(subject)[resultString appendFormat:@"subject=%@&",UrlEncodeString(subject)];
	
	if(message)[resultString appendFormat:@"body=%@",UrlEncodeString(message)];
	
	urlVersion = [[NSURL alloc] initWithString:resultString];
	
	if(urlVersion==nil){
		NSLog(@"[WARN] UiModule: Trying to generate an email url failed. Url \"%@\" came from dict %@",resultString,propertyDict);
	}
	
	[resultString release];
	
	VERBOSE_LOG(@"[INFO] Since we don't have access to MFMailComposeViewController, we're launching %@ instead.",urlVersion);
	[[UIApplication sharedApplication] openURL:urlVersion];
}

- (void)mailComposeController:(MFMailComposeViewController *)controller didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error;
{

	if(error){
		NSLog(@"[ERROR] Unexpected composing error: %@",error);
	}

	switch (result) {
		case MFMailComposeResultSent:
			break;
		case MFMailComposeResultSaved:
			break;
		case MFMailComposeResultCancelled:
			break;
		case MFMailComposeResultFailed:
			break;
		default:
			break;
	}
	
	UIViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:[self parentPageToken]];
	[[ourVC navigationController] dismissModalViewControllerAnimated:animated];
	[emailComposer release];
	emailComposer = nil;
	[self autorelease];
}

@end




@implementation UiModule
#pragma mark Utility methods

#pragma mark button

- (NSString *) makeButtonToken;
{
	return [NativeControlProxy requestToken];
}

- (NativeControlProxy *) proxyForObject: (id) proxyObject scan: (BOOL) scanning recurse: (BOOL) recursion;
{
	NSString * token = nil;
	if ([proxyObject isKindOfClass:[NSDictionary class]]){
		token = [proxyObject objectForKey:@"_TOKEN"];
		if(!scanning) return [NativeControlProxy controlProxyForToken:token];

		TitaniumContentViewController * thisVC = [[TitaniumHost sharedHost] currentTitaniumContentViewController];
		NSURL * currentUrl = [(TitaniumWebViewController *)thisVC currentContentURL];

		NativeControlProxy * result = [NativeControlProxy controlProxyWithDictionary:proxyObject relativeToUrl:currentUrl];
		
		return result;

	} else if ([proxyObject isKindOfClass:[NSString class]]){
		return [NativeControlProxy controlProxyForToken:proxyObject];
	}

	return nil;
}

- (void) updateButton: (id)proxyObject options: (id) optionObject;
{
	NativeControlProxy * ourProxy = [self proxyForObject:proxyObject scan:YES recurse:YES];
	[ourProxy performSelectorOnMainThread:@selector(updateWithOptions:) withObject:optionObject waitUntilDone:NO];

}

- (void) setButton: (id)proxyObject focus:(id) isFocusObject;
{
	if(![isFocusObject respondsToSelector:@selector(boolValue)]) return;
	
	NativeControlProxy * target = [self proxyForObject:proxyObject scan:NO recurse:YES];
	if (![target hasView]) return;
	
	if ([isFocusObject boolValue]){
		[target performSelectorOnMainThread:@selector(becomeFirstResponder) withObject:nil waitUntilDone:NO];
	} else {
		[target performSelectorOnMainThread:@selector(resignFirstResponder) withObject:nil waitUntilDone:NO];
	}
}

//New rules: When called by the Javascript, exceptions raised will be handled and relayed properly, so we need not
//Double-check and fail silently when an invalid call comes through. However, things in the main thread NEEDS to not
//raise exceptions
- (id) picker: (NSString *)tokenString action: (NSNumber *) actionNumber arguments: (NSArray *) arguments;
{
	NativeControlProxy * target = [self proxyForObject:tokenString scan:NO recurse:NO];
	if(target==nil)return nil;
	BOOL argsIsArray = [arguments isKindOfClass:[NSArray class]];
	switch ([actionNumber intValue]) {
		case PICKER_SELECTROW:{
			if(([target templateValue]==UITitaniumNativeItemPicker) && argsIsArray && ([arguments count]>1)){
				[target performSelectorOnMainThread:@selector(selectRowColumn:) withObject:arguments waitUntilDone:NO];
			}
			return nil;
		}
		default:
			break;
	}
	return nil;
}

//- (void) modalPicker: (id)proxyObject visible:(NSNumber *) isVisibleObject options: (NSDictionary *) optionsObject;
//{
//	if(![isVisibleObject respondsToSelector:@selector(boolValue)])return;
//	NativeControlProxy * target = [self proxyForObject:proxyObject scan:YES recurse:YES];
//	//TODO: Modal picker stuff
//}

#pragma mark Window actions

- (NSString *) openWindow: (NSDictionary *)windowObject options: (NSDictionary *) optionsObject; //Defaults to {animated:true,modal:false}.
{
	if (![windowObject isKindOfClass:[NSDictionary class]]){
		return nil;
	}
	NSString * token = [windowObject objectForKey:@"_TOKEN"];
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	if ([theHost titaniumContentViewControllerForToken:token] != nil){
		return token; //So that it doesn't drop its token.
	}//It is possible that a token was created and later stopped being used. In that case, we create the window again.
			
	TitaniumContentViewController * thisVC = [[TitaniumHost sharedHost] currentTitaniumContentViewController];
	TitaniumViewController * resultVC = [TitaniumViewController viewControllerForState:windowObject relativeToUrl:[(TitaniumWebViewController *)thisVC currentContentURL]];
	token = [resultVC primaryToken];
	
//	[virtualWindowsDict setObject:resultVC forKey:token];
	id leftNavButton=[windowObject objectForKey:@"lNavBtn"];
	if (leftNavButton != nil){
		[self setWindow:token navSide:[NSNumber numberWithBool:YES] button:leftNavButton options:nil];
	}

	id rightNavButton=[windowObject objectForKey:@"rNavBtn"];
	if (rightNavButton != nil){
		[self setWindow:token navSide:[NSNumber numberWithBool:NO] button:rightNavButton options:nil];
	}
	
	id toolbarObject = [windowObject objectForKey:@"toolbar"];
	if (toolbarObject != nil){
		[self setWindow:token toolbar:toolbarObject options:nil];
	}
	
	BOOL isAnimated = YES;
	BOOL isModal = NO;

	if ([optionsObject isKindOfClass:[NSDictionary class]]){
		id isAnimatedObject = [optionsObject objectForKey:@"animated"];
		if ([isAnimatedObject respondsToSelector:@selector(boolValue)]) isAnimated = [isAnimatedObject boolValue];

		id isModalObject = [optionsObject objectForKey:@"modal"];
		if ([isModalObject respondsToSelector:@selector(boolValue)]) isModal = [isModalObject boolValue];		
	}

	SEL action;
	if(isModal){
		action = isAnimated ? @selector(presentViewControllerAnimated:) : @selector(presentViewControllerNonAnimated:);
	} else {
		action = isAnimated ? @selector(pushViewControllerAnimated:) : @selector(pushViewControllerNonAnimated:);
	}
	 
	
	TitaniumViewController * thisWindow = [[TitaniumHost sharedHost] titaniumViewControllerForToken:[thisVC titaniumWindowToken]];
	[thisWindow performSelectorOnMainThread:action withObject:resultVC waitUntilDone:NO];
	return token;
}

- (void) closeWindow: (NSString *) tokenString animated: (id) animatedObject; //Defaults to true.
{
	TitaniumViewController * doomedVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[doomedVC setCancelOpening:YES]; //Just in case of race conditions.
	[doomedVC performSelectorOnMainThread:@selector(close:) withObject:animatedObject waitUntilDone:NO];
}

#pragma mark Window Accessors

- (void) setWindow:(NSString *)tokenString URL:(NSString *)newURLString baseURL:(NSString *)baseURLString;
{
	if (![newURLString isKindOfClass:[NSString class]]) return;
	TitaniumWebViewController * ourVC = (id)[[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumWebViewController class]])return;

	NSURL * baseURL = nil;
	if ([newURLString isKindOfClass:[NSString class]] && ([newURLString length]>0)){
		baseURL = [NSURL URLWithString:newURLString];
	}

	NSURL * newURL;
	if (baseURL != nil) {
		newURL = [NSURL URLWithString:newURLString relativeToURL:baseURL];
	} else {
		newURL = [NSURL URLWithString:newURLString];
	}

	[ourVC performSelectorOnMainThread:@selector(setCurrentContentURL:) withObject:newURL waitUntilDone:NO];
}

#define WINDOW_FIRE_JSEVENT		0

- (id) window:(NSString *)tokenString action:(NSNumber *)actionNumber arguments: (id) args;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if((ourVC == nil) || ![actionNumber respondsToSelector:@selector(intValue)])return nil;
	switch ([actionNumber intValue]) {
		case WINDOW_FIRE_JSEVENT:{
			if(![args isKindOfClass:[NSArray class]] || ([args count]<2))return nil;
			NSString * eventName = [args objectAtIndex:0];
			NSDictionary * eventDict = [args objectAtIndex:1];
			if(![eventName isKindOfClass:[NSString class]] || ![eventDict isKindOfClass:[NSDictionary class]])return nil;

			TitaniumJSEvent * ourEvent = [[TitaniumJSEvent alloc] init];
			[ourEvent setEventName:eventName];
			[ourEvent setEventDict:eventDict];

			[ourVC performSelectorOnMainThread:@selector(handleJavascriptEvent:) withObject:ourEvent waitUntilDone:NO];
			[ourEvent release];
			return nil;
		}
	}
	return nil;
}

- (void) setWindow:(NSString *)tokenString fullscreen:(id) fullscreenObject;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setFullscreenObject:) withObject:fullscreenObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString title: (NSString *) newTitle;
{
	if (![newTitle isKindOfClass:[NSString class]]){
		if([newTitle respondsToSelector:@selector(stringValue)]) newTitle = [(id)newTitle stringValue];
		else newTitle = nil;
	}

	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setTitle:) withObject:newTitle waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString titleImage: (id) newTitleImagePath;
{
	if (![newTitleImagePath isKindOfClass:[NSString class]]){
		newTitleImagePath = nil;
	}

	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setTitleViewImagePath:) withObject:newTitleImagePath waitUntilDone:NO];	
}

- (void) setWindow:(NSString *)tokenString titleProxy: (id) newTitleProxyObject;
{
	NativeControlProxy * newTitleProxy = [self proxyForObject:newTitleProxyObject scan:YES recurse:YES];
	
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setTitleViewProxy:) withObject:newTitleProxy waitUntilDone:NO];	
}

- (void) setWindow:(NSString *)tokenString titlePrompt: (id) newValue;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	NSString *value = nil;
	if ([newValue isKindOfClass:[NSString class]])
	{
		value = newValue;
	}
	[ourVC performSelectorOnMainThread:@selector(setTitlePrompt:) withObject:value waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString showNavBar: (id) animatedObject;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(showNavBarWithAnimation:) withObject:animatedObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString hideNavBar: (id) animatedObject;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(hideNavBarWithAnimation:) withObject:animatedObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString barColor: (NSString *) newColorName;
{
	UIColor * newColor = UIColorWebColorNamed(newColorName);
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	
	[ourVC performSelectorOnMainThread:@selector(setNavBarTint:) withObject:newColor waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString navSide:(id) isLeftObject button: (NSDictionary *) buttonObject options: (NSDictionary *) optionsObject;
{	
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if ((ourVC == nil) || (![isLeftObject respondsToSelector:@selector(boolValue)])) return;
	
	NativeControlProxy * ourButton = nil;
	if ([buttonObject isKindOfClass:[NSDictionary class]]){
		ourButton = [self proxyForObject:buttonObject scan:YES recurse:YES];
		if (ourButton == nil) return;
	} else if ((buttonObject != nil) && (buttonObject != (id)[NSNull null])) {
		return;
	}
	
	BOOL animated = NO;	
	if([optionsObject isKindOfClass:[NSDictionary class]]){
		id animatedObject = [optionsObject objectForKey:@"animated"];
		if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	}

	SEL actionSelector;
	if([isLeftObject boolValue]){
		actionSelector = animated ? @selector(setLeftNavButtonAnimated:)
				: @selector(setLeftNavButtonNonAnimated:);
	} else {
		actionSelector = animated ? @selector(setRightNavButtonAnimated:)
				: @selector(setRightNavButtonNonAnimated:);
	}
//TODO: Edge cases with the button being applied to a different window?
	[ourVC performSelectorOnMainThread:actionSelector withObject:[ourButton barButton] waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString toolbar: (id) barObject options: (id) optionsObject;
{
	//OptionsObject is ignored for now.
	//	BOOL animated=NO;
	//	if ([optionsObject isKindOfClass:[NSDictionary class]]){
	//		id animatedObject = [optionsObject objectForKey:@"animated"];
	//		if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	//	}
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if (ourVC == nil) return;
	
	if ([barObject isKindOfClass:[NSArray class]]){
		NSMutableArray *result = [NSMutableArray arrayWithCapacity:[barObject count]];
		for (NSDictionary * thisButtonDict in barObject){
			NativeControlProxy * thisProxy = [self proxyForObject:thisButtonDict scan:YES recurse:YES];
			if (thisProxy == nil) return;
			[result addObject:thisProxy];
		}
		
		[ourVC performSelectorOnMainThread:@selector(setToolbarProxies:) withObject:result waitUntilDone:NO];
	} else if ((barObject == nil) || (barObject == [NSNull null])) {
		[ourVC performSelectorOnMainThread:@selector(setToolbarItems:) withObject:nil waitUntilDone:NO];
	}
}

- (void) addWindow: (NSString *) tokenString nativeView: (id) viewObject options: (id) optionsObject;
{
	Class dictClass = [NSDictionary class];
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if (![ourVC isKindOfClass:[TitaniumWebViewController class]] || ![viewObject isKindOfClass:dictClass]) return;
	
	NativeControlProxy * ourNativeViewProxy = [self proxyForObject:viewObject scan:YES recurse:YES];
	if (ourNativeViewProxy == nil) return;
	
	[ourVC performSelectorOnMainThread:@selector(addNativeViewProxy:) withObject:ourNativeViewProxy waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString setViews:(NSArray *)viewsObject overwrite:(NSNumber *)overwriteObject options:(id)optionsObject;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if (![ourVC isKindOfClass:[TitaniumViewController class]] || ![viewsObject isKindOfClass:[NSArray class]] || ![overwriteObject respondsToSelector:@selector(boolValue)]) return;

	if(![optionsObject isKindOfClass:[NSDictionary class]])optionsObject = [NSDictionary dictionary];

	TitaniumContentViewController * thisVC = [[TitaniumHost sharedHost] currentTitaniumContentViewController];
	NSURL * currentUrl = [(TitaniumWebViewController *)thisVC currentContentURL];

	NSArray * messagePacket = [[NSArray alloc] initWithObjects:viewsObject,overwriteObject,currentUrl,optionsObject,nil];
	[ourVC updateContentViewArray:messagePacket];
	[messagePacket release];
}

- (NSString *) reserveViewToken;
{
	return [TitaniumContentViewController requestToken];
}

- (NSArray *) getWindowViewsForToken: (NSString *) tokenString;
{
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	TitaniumViewController * ourVC = [theHost titaniumViewControllerForToken:tokenString];
	if(ourVC == nil) return nil;
	
	NSString * callingToken = [[theHost currentThread] magicToken];

	NSMutableArray * result = [NSMutableArray array];
	for(TitaniumContentViewController * thisContent in [ourVC contentViewControllers]){
		[result addObject:[thisContent stateValue]];
		[thisContent addListeningWebContextToken:callingToken];
	}
	
	return result;
}

- (NSDictionary *) getTabPropsByName: (NSString *) nameString;
{
	if(![nameString isKindOfClass:[NSString class]])return nil;
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForName:nameString];
	TitaniumViewController * rootVC = [[[ourVC navigationController] viewControllers] objectAtIndex:0];
	return [rootVC tabPropertiesDict];
}


- (NSDictionary *) getWindowPropsByName: (NSString *) nameString;
{
	if(![nameString isKindOfClass:[NSString class]])return nil;
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForName:nameString];
	return [ourVC propertiesDict];
}


- (void) setWindow:(NSString *)tokenString setActiveViewIndex:(NSNumber *)newIndexObject options:(id)optionsObject;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if (![ourVC isKindOfClass:[TitaniumViewController class]] || ![newIndexObject respondsToSelector:@selector(intValue)]) return;
	
	if(![optionsObject isKindOfClass:[NSDictionary class]])optionsObject = [NSDictionary dictionary];
	
	NSArray * messagePacket = [[NSArray alloc] initWithObjects:newIndexObject,optionsObject,nil];
	
	[ourVC performSelectorOnMainThread:@selector(updateSelectedContentView:) withObject:messagePacket waitUntilDone:NO];
	[messagePacket release];
}

- (id) setWindow:(NSString *)tokenString code:(NSString *)code
{
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if (![ourVC isKindOfClass:[TitaniumWebViewController class]]) return nil;
	
	if ([ourVC respondsToSelector:@selector(sendJavascriptAndGetResult:)])
	{
		NSMutableDictionary *a = [NSMutableDictionary dictionaryWithObject:code forKey:@"code"];
		[ourVC performSelectorOnMainThread:@selector(sendJavascriptAndGetResult:) withObject:a waitUntilDone:YES];
		return [a objectForKey:@"result"];
	}
	else
	{
		NSLog(@"[ERROR] evalJS called but on incorrect content view. %@",[ourVC class]);
	}
	
	return nil;
}

- (void) setTab: (NSString *)tokenString badge: (id) newBadge;
{
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if(currentViewController == nil)return;

	NSString * result = nil;

	if ([newBadge isKindOfClass:[NSString class]])result=newBadge;
	if ([newBadge respondsToSelector:@selector(stringValue)])result=[newBadge stringValue];
	
	[[currentViewController tabBarItem] performSelectorOnMainThread:@selector(setBadgeValue:) withObject:result waitUntilDone:NO];
}


#pragma mark View actions

- (void) setTableView:(NSString *)tokenString deleteRow:(NSNumber *)rowIndex options:(NSDictionary *)optionsObject;
{
	if(![rowIndex respondsToSelector:@selector(intValue)])return;
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumTableViewController class]]) return;
	
	TitaniumTableActionWrapper * newAction = [[TitaniumTableActionWrapper alloc] init];
	[newAction setKind:TitaniumTableActionDeleteRow];
	[newAction setIndex:[rowIndex intValue]];
	[newAction setAnimationDict:optionsObject];
	
	[(TitaniumTableViewController *)ourVC enqueueAction:newAction];
	[newAction release];
}

- (void) setTableView:(NSString *)tokenString setRow: (NSNumber *) rowIndex data:(NSDictionary *)dataObject action:(NSNumber *)actionObject options:(NSDictionary *)optionsObject;
{
	if(![rowIndex respondsToSelector:@selector(intValue)])return;
	if(![actionObject respondsToSelector:@selector(intValue)])return;
	if(![dataObject isKindOfClass:[NSDictionary class]])return;
	
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumTableViewController class]]) return;
	
	TitaniumTableActionWrapper * newAction = [[TitaniumTableActionWrapper alloc] init];
	[newAction setKind:[actionObject intValue]];
	[newAction setIndex:[rowIndex intValue]];
	[newAction setRowData:dataObject];
	[newAction getBaseUrl];
	[newAction setAnimationDict:optionsObject];
	
	[(TitaniumTableViewController *)ourVC enqueueAction:newAction];
	[newAction release];
}

- (void) setTableView:(NSString *)tokenString loadData:(NSArray *)newData isSections: (NSNumber *)isSections options:(NSDictionary *)optionsObject;
{
	if(![newData isKindOfClass:[NSArray class]] || ![isSections respondsToSelector:@selector(boolValue)])return;
	
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumTableViewController class]]) return;
	
	TitaniumTableActionWrapper * newAction = [[TitaniumTableActionWrapper alloc] init];
	[newAction setKind:[isSections boolValue]?TitaniumGroupActionReloadSections:TitaniumTableActionReloadData];
	[newAction setReplacedData:newData];
	[newAction getBaseUrl];
	[newAction setAnimationDict:optionsObject];
	
	[(TitaniumTableViewController *)ourVC enqueueAction:newAction];
	[newAction release];
}

- (void) setGroupedView:(NSString *)tokenString section: (NSNumber *) sectionObject row: (NSNumber *) rowObject data:(NSDictionary *)dataObject replace:(NSNumber *)isReplace options:(NSDictionary *)optionsObject;
{
	if(![sectionObject respondsToSelector:@selector(intValue)] || ![rowObject respondsToSelector:@selector(intValue)] ||
			![dataObject isKindOfClass:[NSDictionary class]] || ![isReplace respondsToSelector:@selector(boolValue)])return;
	
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumTableViewController class]]) return;
	
	TitaniumTableActionWrapper * newAction = [[TitaniumTableActionWrapper alloc] init];
	[newAction setKind:[isReplace boolValue]?TitaniumGroupActionUpdateRow:TitaniumGroupActionInsertBeforeRow];
	[newAction setSection:[sectionObject intValue]];
	[newAction setRow:[rowObject intValue]];
	[newAction setRowData:dataObject];
	[newAction getBaseUrl];
	[newAction setAnimationDict:optionsObject];
	
	[(TitaniumTableViewController *)ourVC enqueueAction:newAction];
	[newAction release];
}

- (void) setGroupedView:(NSString *)tokenString section: (NSNumber *) sectionObject deleteRow: (NSNumber *) rowObject options:(NSDictionary *)optionsObject;
{
	if(![sectionObject respondsToSelector:@selector(intValue)] || ![rowObject respondsToSelector:@selector(intValue)])return;
	
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumTableViewController class]]) return;
	
	TitaniumTableActionWrapper * newAction = [[TitaniumTableActionWrapper alloc] init];
	[newAction setKind:TitaniumGroupActionDeleteRow];
	[newAction setSection:[sectionObject intValue]];
	[newAction setRow:[rowObject intValue]];
	[newAction setAnimationDict:optionsObject];
	
	[(TitaniumTableViewController *)ourVC enqueueAction:newAction];
	[newAction release];	
}

- (void) setGroupedView:(NSString *)tokenString section: (NSNumber *) sectionObject data:(NSDictionary *)dataObject replace:(NSNumber *)isReplace options:(NSDictionary *)optionsObject;
{
	if(![sectionObject respondsToSelector:@selector(intValue)] || ![dataObject isKindOfClass:[NSDictionary class]] ||
			![isReplace respondsToSelector:@selector(boolValue)])return;
	
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumTableViewController class]]) return;
	
	TitaniumTableActionWrapper * newAction = [[TitaniumTableActionWrapper alloc] init];
	[newAction setKind:[isReplace boolValue]?TitaniumGroupActionUpdateGroup:TitaniumGroupActionInsertBeforeGroup];
	[newAction setSection:[sectionObject intValue]];
	[newAction setSectionData:dataObject];
	[newAction getBaseUrl];
	[newAction setAnimationDict:optionsObject];
	
	[(TitaniumTableViewController *)ourVC enqueueAction:newAction];
	[newAction release];	
}

- (void) setGroupedView:(NSString *)tokenString deleteSection: (NSNumber *) sectionObject options:(NSDictionary *)optionsObject;
{
	if(![sectionObject respondsToSelector:@selector(intValue)])return;
	
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumTableViewController class]]) return;
	
	TitaniumTableActionWrapper * newAction = [[TitaniumTableActionWrapper alloc] init];
	[newAction setKind:TitaniumGroupActionDeleteGroup];
	[newAction setSection:[sectionObject intValue]];
	[newAction setAnimationDict:optionsObject];
	
	[(TitaniumTableViewController *)ourVC enqueueAction:newAction];
	[newAction release];	
}

#define SCROLLVIEW_ADDVIEW				0
#define SCROLLVIEW_SETCURRENTPAGE		1
#define SCROLLVIEW_SETPAGECONTROL		2

- (id) scrollView:(NSString *)tokenString doAction:(NSNumber *)action args:(id)args options:(NSDictionary *)optionsObject;
{
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	TitaniumScrollableViewController * scrollView = (TitaniumScrollableViewController *)[theHost titaniumContentViewControllerForToken:tokenString];
	if(![scrollView isKindOfClass:[TitaniumScrollableViewController class]] || ![action respondsToSelector:@selector(intValue)])return nil;
	switch ([action intValue]) {
		case SCROLLVIEW_ADDVIEW:{
			NSString * callingToken = [[theHost currentThread] magicToken];
				
			TitaniumWebViewController * contextVC = (TitaniumWebViewController *)[theHost titaniumContentViewControllerForToken:callingToken];
			TitaniumContentViewController * newVC = [TitaniumContentViewController viewControllerForState:args relativeToUrl:[contextVC currentContentURL]];
			if(newVC != nil){
				[scrollView addViewController:newVC];
				[newVC addListeningWebContextToken:callingToken];
			}
			return nil;
		}
		case SCROLLVIEW_SETCURRENTPAGE:{
			if(![args respondsToSelector:@selector(intValue)])return nil;
			[scrollView setCurrentPage:[args intValue]];
			return nil;
		}
	}
	
	return nil;
}

#define COMPOSITEVIEW_ADDRULE	0

- (id) compositeView:(NSString *)tokenString doAction:(NSNumber *)action args:(id)args options:(NSDictionary *)optionsObject;
{
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	TitaniumCompositeViewController * compositeView = (TitaniumCompositeViewController *)[theHost titaniumContentViewControllerForToken:tokenString];
	if(![compositeView isKindOfClass:[TitaniumCompositeViewController class]] || ![action respondsToSelector:@selector(intValue)])return nil;
	switch ([action intValue]) {
		case COMPOSITEVIEW_ADDRULE:{
			if(![args isKindOfClass:[NSDictionary class]])return nil;
			NSString * callingToken = [[theHost currentThread] magicToken];
			TitaniumWebViewController * contextVC = (TitaniumWebViewController *)[theHost titaniumContentViewControllerForToken:callingToken];
			[compositeView addRule:args baseUrl:[contextVC currentContentURL]];
			return nil;
		}
	}
	return nil;
}

#define IMAGEVIEW_SETURL	0

- (id) imageView:(NSString *)tokenString doAction:(NSNumber *)action args:(id)args options:(NSDictionary *)optionsObject;
{
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	TitaniumImageViewController * imageViewCon = (TitaniumImageViewController *)[theHost titaniumContentViewControllerForToken:tokenString];
	if(![imageViewCon isKindOfClass:[TitaniumImageViewController class]] || ![action respondsToSelector:@selector(intValue)])return nil;
	switch ([action intValue]) {
		case IMAGEVIEW_SETURL:{
			if(![args isKindOfClass:[NSString class]])return nil;
			NSString * callingToken = [[theHost currentThread] magicToken];
			TitaniumWebViewController * contextVC = (TitaniumWebViewController *)[theHost titaniumContentViewControllerForToken:callingToken];
			[imageViewCon setUrl:[NSURL URLWithString:args relativeToURL:[contextVC currentContentURL]]];
			return nil;
		}
	}
	return nil;
}

#define COVERFLOWVIEW_SETURL	0
#define COVERFLOWVIEW_SETSELECTED 1

- (id) cloverFlowView:(NSString *)tokenString doAction:(NSNumber *)action args:(id)args options:(NSDictionary *)optionsObject;
{
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	TitaniumCoverFlowViewController * con = (TitaniumCoverFlowViewController *)[theHost titaniumContentViewControllerForToken:tokenString];
	if(![con isKindOfClass:[TitaniumCoverFlowViewController class]] || ![action respondsToSelector:@selector(intValue)])return nil;
	switch ([action intValue]) {
		case COVERFLOWVIEW_SETURL:{
			NSArray * _args = (NSArray*)args;
			NSString * callingToken = [[theHost currentThread] magicToken];
			TitaniumWebViewController * contextVC = (TitaniumWebViewController *)[theHost titaniumContentViewControllerForToken:callingToken];
			[con setUrl:[NSURL URLWithString:[_args objectAtIndex:1] relativeToURL:[contextVC currentContentURL]] index:(NSNumber*)[_args objectAtIndex:0]];
			return nil;
		}
		case COVERFLOWVIEW_SETSELECTED:{
			NSArray * _args = (NSArray*)args;
			[con setSelected:[_args objectAtIndex:0]];
			return nil;
		}
	}
	return nil;
}


#pragma mark Current Window actions

- (void) setStatusBarStyle: (id) newValue;
{
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[currentViewController performSelectorOnMainThread:@selector(setStatusBarStyleObject:) withObject:newValue waitUntilDone:NO];
}

- (void) setbarStyle: (id) newValue;
{
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[currentViewController performSelectorOnMainThread:@selector(setNavBarStyleObject:) withObject:newValue waitUntilDone:NO];
}

- (void) resizeCurrentWindow;
{
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[currentViewController performSelectorOnMainThread:@selector(needsUpdateAnimated) withObject:nil waitUntilDone:NO];
}



#pragma mark App-wide actions

- (void) setAppBadge: (id) newBadge;
{
	NSInteger newNumber = 0;
	if([newBadge respondsToSelector:@selector(intValue)]) newNumber=[newBadge intValue];

	[[UIApplication sharedApplication] setApplicationIconBadgeNumber:newNumber];
}

- (NSArray *) getAllTabs;
{
	UITabBarController * theTabCon = (UITabBarController *)[[TitaniumAppDelegate sharedDelegate] viewController];
	if(![theTabCon isKindOfClass:[UITabBarController class]])return nil;
	
	NSArray * theNavArray = [theTabCon viewControllers];
	
	NSMutableArray * result = [NSMutableArray arrayWithCapacity:[theNavArray count]];
	for(UINavigationController * thisNav in theNavArray){
		TitaniumViewController * rootVC = [[thisNav viewControllers] objectAtIndex:0];
		[result addObject:[rootVC tabPropertiesDict]];
	}
	
	return result;
}

- (void) setActiveTab: (NSString *) windowToken;
{
	UITabBarController * theTabCon = (UITabBarController *)[[TitaniumAppDelegate sharedDelegate] viewController];
	if(![theTabCon isKindOfClass:[UITabBarController class]])return;
	
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:windowToken];
	UINavigationController * ourNav = [ourVC navigationController];

	if(ourNav == nil) return;
	
	NSArray * theNavArray = [theTabCon viewControllers];
	if([theNavArray containsObject:ourNav]){
		[theTabCon performSelectorOnMainThread:@selector(setSelectedViewController:) withObject:ourNav waitUntilDone:NO];
	}
}

#pragma mark Modal things (alert and options)

- (void) showModal: (NSDictionary *) modalObject isAlert: (id) isAlertObject;
{
	if ((![isAlertObject respondsToSelector:@selector(boolValue)]) || (![modalObject isKindOfClass:[NSDictionary class]])) return;
	ModalProxy * result = [[[ModalProxy alloc] init] autorelease];
	if (![result takeToken:modalObject])return;
	if ([isAlertObject boolValue]){
		[result performSelectorOnMainThread:@selector(showAlertViewWithDict:) withObject:modalObject waitUntilDone:NO];
	} else {
		[result performSelectorOnMainThread:@selector(showActionSheetWithDict:) withObject:modalObject waitUntilDone:NO];
	}
}

#pragma mark Email thingy generation

- (void) openEmailComposer: (NSDictionary *) emailComposerObject options: (NSDictionary *) optionsObject;
{
	Class dictClass = [NSDictionary class];
	if (![emailComposerObject isKindOfClass:dictClass]) return;
	
	EmailComposerProxy * ourProxy = [[EmailComposerProxy alloc] init];
	[ourProxy setPropertyDict:emailComposerObject];
	
	if([optionsObject isKindOfClass:dictClass]){
		NSNumber * isAnimatedObject = [optionsObject objectForKey:@"animated"];
		if ([isAnimatedObject respondsToSelector:@selector(boolValue)]){
			[ourProxy setAnimated:[isAnimatedObject boolValue]];
		}
	}
	
	[ourProxy performSelectorOnMainThread:@selector(performComposition) withObject:nil waitUntilDone:NO];
	[ourProxy release];
}

#define SAFE_ARRAY_COUNT(foo)	([foo isKindOfClass:[NSArray class]]?[foo count]:-1)

- (id) scrollWindowTo: (NSArray *) args;
{
	ASSERT_ARRAY_COUNT(args,4);

	NSString * tokenString = [args objectAtIndex:0];
	TitaniumWebViewController * targetView = (TitaniumWebViewController *)[[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![targetView isKindOfClass:[TitaniumWebViewController class]])return TITANIUM_JS_ERROR(TitaniumErrorInvalidTokenValue,"Token doesn't represent a web view");
	
	CGPoint position;
	position.x = [[args objectAtIndex:1] floatValue];
	position.y = [[args objectAtIndex:2] floatValue];
	NSValue * positionValue = [NSValue valueWithCGPoint:position];
	BOOL relative = [[args objectAtIndex:3] boolValue];
	if(relative){
		[targetView performSelectorOnMainThread:@selector(scrollRelative:) withObject:positionValue waitUntilDone:NO];
	}else{
		[targetView performSelectorOnMainThread:@selector(scrollAbsolute:) withObject:positionValue waitUntilDone:NO];
	}
	return nil;
}

- (id) scrollTableViewTo: (NSArray *) args;
{
	ASSERT_ARRAY_COUNT(args,2);
	TitaniumTableViewController * targetView = (TitaniumTableViewController *)[[TitaniumHost sharedHost]
			titaniumContentViewControllerForToken:[args objectAtIndex:0]];
	if(![targetView isKindOfClass:[TitaniumTableViewController class]])return TITANIUM_JS_ERROR(TitaniumErrorInvalidTokenValue,"Token doesn't represent a table view");
	int blessedRow = [[args objectAtIndex:1] intValue];
	BOOL animated = NO;
	UITableViewScrollPosition scrollPosition = UITableViewScrollPositionNone;
	NSDictionary * options = ([args count]>2)?[args objectAtIndex:2]:nil;
	if ([options isKindOfClass:[NSDictionary class]]) {
		id animatedObject = [options objectForKey:@"animated"];
		if ([animatedObject respondsToSelector:@selector(boolValue)])animated = [animatedObject boolValue];

		id positionObject = [options objectForKey:@"position"];
		if ([positionObject respondsToSelector:@selector(intValue)])scrollPosition = [positionObject intValue];
	}
	
	TitaniumTableActionWrapper * newAction = [[TitaniumTableActionWrapper alloc] init];
	[newAction setKind:TitaniumTableActionScrollRow];
	[newAction setIndex:blessedRow];
	[newAction setIsAnimated:animated];
	[newAction setScrollPosition:scrollPosition];
	
	[targetView enqueueAction:newAction];
	[newAction release];
	
	return nil;
}

#pragma mark startModule
#define STRINGIFY(foo)	# foo
#define STRINGVAL(foo)	STRINGIFY(foo)


- (BOOL) startModule;
{
	[SearchBarControl registerAsClassNamed:@"searchBar"];


	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
	[(UiModule *)invocGen window:nil action:nil arguments:nil];
	NSInvocation * windowActionInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil title:nil];
	NSInvocation * setTitleInvoc = [invocGen invocation];

	[(UiModule *)invocGen setWindow:nil titleImage:nil];
	NSInvocation * setTitleImageInvoc = [invocGen invocation];

	[(UiModule *)invocGen setWindow:nil titleProxy:nil];
	NSInvocation * setTitleImageProxyInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil titlePrompt:nil];
	NSInvocation * setTitlePromptInvoc = [invocGen invocation];

	[(UiModule *)invocGen openWindow:nil options:nil];
	NSInvocation * openWinInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen closeWindow:nil animated:nil];
	NSInvocation * closeWinInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil URL:nil baseURL:nil];
	NSInvocation * changeWinUrlInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil code:nil];
	NSInvocation * evalInvoc = [invocGen invocation];

	[(UiModule *)invocGen setWindow:nil fullscreen:nil];
	NSInvocation * changeWinFullScreenInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil barColor:nil];
	NSInvocation * changeWinNavColorInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil showNavBar:nil];
	NSInvocation * showNavBarInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil hideNavBar:nil];
	NSInvocation * hideNavBarInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil navSide:nil button:nil options:nil];
	NSInvocation * setNavButtonInvoc = [invocGen invocation];

	[(UiModule *)invocGen setWindow:nil setViews:nil overwrite: nil options:nil];
	NSInvocation * setWindowViewsInvoc = [invocGen invocation];

	[(UiModule *)invocGen getWindowViewsForToken:nil];
	NSInvocation * getWindowViewsInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen getWindowPropsByName:nil];
	NSInvocation * getWindowInvoc = [invocGen invocation];

	[(UiModule *)invocGen getTabPropsByName:nil];
	NSInvocation * getTabByNameInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen getAllTabs];
	NSInvocation * getAllTabsInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil setActiveViewIndex:nil options:nil];
	NSInvocation * setWindowActiveViewInvoc = [invocGen invocation];

	[(UiModule *)invocGen setActiveTab:nil];
	NSInvocation * activateTabInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen makeButtonToken];
	NSInvocation * buttonTokenGen = [invocGen invocation];

	[(UiModule *)invocGen setButton:nil focus:nil];
	NSInvocation * setButtonFocusInvoc = [invocGen invocation];

	[(UiModule *)invocGen setAppBadge:nil];
	NSInvocation * appBadgeInvoc = [invocGen invocation];

	[(UiModule *)invocGen setTab: nil badge:nil];
	NSInvocation * tabBadgeInvoc = [invocGen invocation];

	[(UiModule *)invocGen setStatusBarStyle:nil];
	NSInvocation * statusBarStyleInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil toolbar:nil options:nil];
	NSInvocation * updateToolbarInvoc = [invocGen invocation];

	[(UiModule *)invocGen showModal:nil isAlert:nil];
	NSInvocation * showModalInvoc = [invocGen invocation];

	[(UiModule *)invocGen addWindow:nil nativeView:nil options:nil];
	NSInvocation * insertNativeViewInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen openEmailComposer:nil options:nil];
	NSInvocation * emailComposeInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen updateButton:nil options:nil];
	NSInvocation * updateButtonInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen reserveViewToken];
	NSInvocation * reserveTokenInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setTableView:nil setRow:nil data:nil action:nil options:nil];
	NSInvocation * insertRowInvoc = [invocGen invocation];

	[(UiModule *)invocGen setTableView:nil deleteRow:nil options:nil];
	NSInvocation * deleteRowInvoc = [invocGen invocation];

	[(UiModule *)invocGen setTableView:nil loadData:nil isSections:nil options:nil];
	NSInvocation * updateDataInvoc = [invocGen invocation];

	[(UiModule *)invocGen setGroupedView:nil section:nil row:nil data:nil replace:nil options:nil];
	NSInvocation * setSectionRowInvoc = [invocGen invocation];

	[(UiModule *)invocGen setGroupedView:nil section:nil deleteRow:nil options:nil];
	NSInvocation * deleteSectionRowInvoc = [invocGen invocation];

	[(UiModule *)invocGen setGroupedView:nil section:nil data:nil replace:nil options:nil];
	NSInvocation * setSectionInvoc = [invocGen invocation];

	[(UiModule *)invocGen setGroupedView:nil deleteSection:nil options:nil];
	NSInvocation * deleteSectionInvoc = [invocGen invocation];

	
	[(UiModule *)invocGen resizeCurrentWindow];
	NSInvocation * resizeWindowInvoc = [invocGen invocation];
	
//	[(UiModule *)invocGen modalPicker: nil visible: nil options:nil];
//	NSInvocation * displayInputModallyInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen scrollView:nil doAction:nil args:nil options:nil];
	NSInvocation * scrollViewInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen compositeView:nil doAction:nil args:nil options:nil];
	NSInvocation * compositeViewInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen imageView:nil doAction:nil args:nil options:nil];
	NSInvocation * imageViewInvoc = [invocGen invocation];
		
	[(UiModule *)invocGen cloverFlowView:nil doAction:nil args:nil options:nil];
	NSInvocation * coverflowViewInvoc = [invocGen invocation];
		
	//NOTE: createWindow doesn't actually create a native-side window. Instead, it simply sets up the dict.
	//The actual actions are performed at open time.
	
	NSString * createEmailString = @"function(args){var res={};for(property in args){res[property]=args[property];};"
			"res.attachments=[];"
			"res.setBarColor=function(arg){this.barColor=arg;};"
			"res.setSubject=function(arg){this.subject=arg;};"
			"res.setToRecipients=function(arg){this.toRecipients=arg;};"
			"res.setCcRecipients=function(arg){this.ccRecipients=arg;};"
			"res.setBccRecipients=function(arg){this.bccRecipients=arg;};"
			"res.setMessageBody=function(arg){this.messageBody=arg;};"
			"res.addAttachment=function(arg){this.attachments.push(arg);};"
			"res.open=function(arg){if(!this._TOKEN){var tkn='eml'+Ti.UI._NEXTTKN++;this._TOKEN=tkn;Ti.UI._EMAIL[tkn]=this;}Ti.UI._OPNEMAIL(this,arg);};"
			"return res;}";

	NSString * currentViewString = @"{_EVT:{load:[],focused:[],unfocused:[]},_TOKEN:Ti._TOKEN,_TYPE:'web',"
			"setURL:function(newUrl){Ti.UI._WURL(Ti._TOKEN,newUrl,document.location);},"
			"doEvent:Ti._ONEVT,addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT}";

	TitaniumJSCode * currentWindowScript = [TitaniumJSCode codeWithString:@"{"
			"toolbar:{},_EVT:{close:[],unfocused:[],focused:[]},doEvent:Ti._ONEVT,"
			"addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
			"close:function(args){Ti.UI._CLS(Ti._TOKEN,args);},"
			"setTitle:function(args){Ti.UI._WTITLE(Ti._TOKEN,args);},"
			"fireEvent:function(typ,evt){if(Ti._TOKEN){Ti.UI._WACT(Ti._TOKEN," STRINGVAL(WINDOW_FIRE_JSEVENT) ",[typ,evt]);}},"
			"setBarColor:function(args){Ti.UI._WNAVTNT(Ti._TOKEN,args);},"
			"setFullscreen:function(newBool){Ti.UI._WFSCN(Ti._TOKEN,newBool);},"
			"setTitle:function(args){Ti.UI._WTITLE(Ti._TOKEN,args);},"
			"showNavBar:function(args){Ti.UI._WSHNAV(Ti._TOKEN,args);},"
			"hideNavBar:function(args){Ti.UI._WHDNAV(Ti._TOKEN,args);},"
			"setTitlePrompt:function(args){Ti.UI._WTITLEPROMPT(Ti._TOKEN,args);},"
			"setTitleImage:function(args){Ti.UI._WTITLEIMG(Ti._TOKEN,args);},"
			"setTitleControl:function(args){if(args)args.ensureToken();Ti.UI._WTITLEPXY(Ti._TOKEN,args);},"
			"setLeftNavButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WNAVBTN(Ti._TOKEN,true,btn,args);},"
			"setRightNavButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WNAVBTN(Ti._TOKEN,false,btn,args);},"
//TODO: Handling views with CurrentWindow
			"addView:function(newView,args){newView.ensureToken();Ti.UI._WSVIEWS(Ti._TOKEN,[newView],false,args);},"
			"getViewByName:function(name){var views=this.getViews();for(var i=0;i<views.length;i++){if(views[i].name==name)return views[i];}return null;},"
			"getViews:function(){return Ti.UI.viewsForWindowToken(Ti._TOKEN);},"
//			"setViews:function(newViews,args){"
//				"for(var i=0;i<newViews.length;i++){newViews.ensureToken();}"
//				"Ti.UI._WSVIEWS(Ti._TOKEN,newViews,true,args)},"
			"setActiveViewIndex:function(newIndex,args){Ti.UI._WSAVIEW(Ti._TOKEN,newIndex,args);},"
			"showView:function(blessedView,args){var ourViews = Ti.UI.viewsForWindowToken(Ti._TOKEN);var viewCount=ourViews.length;"
				"for(var i=0;i<viewCount;i++){if(ourViews[i]._TOKEN==blessedView._TOKEN){Ti.UI._WSAVIEW(Ti._TOKEN,i,args);return;}}},"
			"repaint:function(){if(!Ti.UI._WILLRESIZE && !Ti.UI._ISRESIZING){"
				"Ti.UI._WILLRESIZE=true;setTimeout('Ti.UI._DORESIZE();Ti.UI._WILLRESIZE=false;',0);}},"
			"setToolbar:function(bar,args){if(bar){var i=bar.length;while(i>0){i--;bar[i].ensureToken();}}Ti.UI._WTOOL(Ti._TOKEN,bar,args);},"
			"insertButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WINSBTN(Ti._TOKEN,btn,args);},"
			"}"];
			
	[currentWindowScript setEpilogueCode:@"window.addEventListener('DOMNodeInserted',Ti.UI.currentWindow.repaint,false);"
			"window.addEventListener('load',function(){if(document.body){document.body.addEventListener('load',"
				"function(e){if(e.srcElement.tagName=='IMG')Titanium.UI.currentWindow.repaint();},true);}},false);"
				"delete window.scrollTo;window.scrollTo=function(x,y){Ti._TIDO('ui','scrollWindowTo',[Ti._TOKEN,x,y,false]);};"
				"delete window.scrollBy;window.scrollBy=function(x,y){Ti._TIDO('ui','scrollWindowTo',[Ti._TOKEN,x,y,true]);};"];

	NSString * viewsForWindowString = @"function(winTkn){var fetched=Ti.UI._WGVIEWS(winTkn);if(!fetched)return {};var res=[];var i=0;var viewCount=fetched.length;while(i<viewCount){"
			"var props=fetched[i];var viewTkn=props._TOKEN;var view;"
			"if(viewTkn==Ti._TOKEN)view=Ti.UI.currentView;"
			"else view=Ti.UI._VIEW[viewTkn];"
			"if(view){for(thisprop in props){view[thisprop]=props[thisprop];}}else{"
				"if(props._TYPE=='table'){"
					"if(props.grouped)view=Ti.UI.createGroupedView(props);"
					"else view=Ti.UI.createTableView(props);"
				"}else view=Ti.UI.createWebView(props);"
				"Ti.UI._VIEW[viewTkn]=view;"
			"}res.push(view);i++;}return res;}";


	NSString * createWindowString = @"function(args){var res={};"
			"for(property in args){res[property]=args[property];res['_'+property]=args[property];};"
//			"delete res._TOKEN;"
			"res.fireEvent=function(typ,evt){if(this._TOKEN){Ti.UI._WACT(this._TOKEN," STRINGVAL(WINDOW_FIRE_JSEVENT) ",[typ,evt]);}};"
			"res.setFullscreen=function(newBool){this.fullscreen=newBool;if(this._TOKEN){Ti.UI._WFSCN(this._TOKEN,newBool);};};"
			"res.setTitle=function(args){this.title=args;if(this._TOKEN){Ti.UI._WTITLE(this._TOKEN,args);}};"
			"res.showNavBar=function(args){this._hideNavBar=false;if(this._TOKEN){Ti.UI._WSHNAV(this._TOKEN,args);}};"
			"res.hideNavBar=function(args){this._hideNavBar=true;if(this._TOKEN){Ti.UI._WHDNAV(this._TOKEN,args);}};"
			"res.setTitleControl=function(args){if(args)args.ensureToken();this.titleControl=args;if(this._TOKEN){Ti.UI._WTITLEPXY(this._TOKEN,args);}};"
			"res.setTitleImage=function(args){this.titleImage=args;if(this._TOKEN){Ti.UI._WTITLEIMG(this._TOKEN,args);}};"
			"res.setTitlePrompt=function(args){this.titlePrompt=args;if(this._TOKEN){Ti.UI._WTITLEPROMPT(this._TOKEN,args);}};"
			"res.setBarColor=function(args){this.barColor=args;if(this._TOKEN){Ti.UI._WNAVTNT(this._TOKEN,args);}};"
			"res.setLeftNavButton=function(btn,args){if(btn)btn.ensureToken();this.lNavBtn=btn;if(this._TOKEN){Ti.UI._WNAVBTN(this._TOKEN,true,btn,args);}};"
			"res.setRightNavButton=function(btn,args){if(btn)btn.ensureToken();this.rNavBtn=btn;if(this._TOKEN){Ti.UI._WNAVBTN(this._TOKEN,false,btn,args);}};"
			"res.close=function(args){Ti.UI._CLS(this._TOKEN,args);};"
			"res.evalJS=function(js){if(this._TOKEN){return Ti.UI._WEJS(this._TOKEN,String(js));};};"
			"res._EVT={preload:[],load:[]};res.doEvent=Ti._ONEVT;res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.addView=function(newView,args){if(this.views){this.views.push(newView);}else{this.views=[newView];}if(this._TOKEN){newView.ensureToken();Ti.UI._WSVIEWS(this._TOKEN,[newView],false,args);}};"
			"res.getViews=function(){return Ti.UI.viewsForWindowToken(This._TOKEN);};"
			"res.getViewByName=function(name){var views=this.getViews();for(var i=0;i<views.length;i++){if(views[i].name==name)return views[i];}return null;};"
//			"res.setViews=function(newViews,args){this.views=newViews;if(this._TOKEN){"
//				"for(var i=0;i<newViews.length;i++){newViews.ensureToken();}"
//				"Ti.UI._WSVIEWS(this._TOKEN,newViews,true,args);}};"
			"res.setActiveViewIndex=function(newIndex,args){this.activeViewIndex=newIndex;if(this._TOKEN){Ti.UI._WSAVIEW(this._TOKEN,newIndex,args);}};"
			"res.showView=function(blessedView,args){if(!this.views)return;var newIndex=0;var viewCount=this.views.length;"
				"for(var i=0;i<viewCount;i++){if(this.views[i]._TOKEN==blessedView._TOKEN){this.setActiveViewIndex(i,args);return;}}};"
			"res.setBackButtonTitle=function(newTitle,args){this.backButtonTitle=newTitle;this.update(args);};"
			"res.setBackButtonTitleImage=function(newImage,args){this.backButtonImage=newTitle;this.update(args);};"
			"res.open=function(args){"
				"this.ensureToken();"
				"if(this.views){for(var i=0;i<this.views.length;i++){this.views[i].ensureToken();}}"
				"var res=Ti.UI._OPN(this,args);this._TOKEN=res;};"
			"res.setToolbar=function(bar,args){if(bar){var i=bar.length;while(i>0){i--;bar[i].ensureToken();};};"
				"this.toolbar=bar;"
				"if(this._TOKEN){"
					"Ti.UI._WTOOL(this._TOKEN,bar,args);}};"
			"res.ensureToken=function(){"
				"if(this.data){var data=this.data;var i=data.length;while(i>0){i--;var inp=data[i].input;if(inp)inp.ensureToken();}};"
				"if(this.sections){var grp=this.sections;var j=grp.length;while(j>0){j--;var data=grp[j].data;var i=data.length;"
				"while(i>0){i--;var inp=data[i].input;if(inp)inp.ensureToken();}"
				"}};"
				"if(this._TOKEN)return;var tkn=Ti.UI._VTOKEN();this._TOKEN=tkn;Ti.UI._VIEW[tkn]=this;};"
			"res.update=function(args){if(!this._TOKEN)return;Ti.UI._WUPDATE(this,args);};"
			"if(res.rightNavButton)res.setRightNavButton(res.rightNavButton);"
			"if(res.leftNavButton)res.setLeftNavButton(res.leftNavButton);"
			"return res;}";
			
	NSString * getWindowByNameString = @"function(name){var winProps=Ti._WINGET(name);if(!winProps)return null;var tkn=winProps._TOKEN;var win=Ti.UI._VIEW[tkn];"
			"if(!win){win=Ti.createWindow(winProps);win._TOKEN=tkn;Ti.UI._VIEW[tkn]=win;}else{}return win;}"; //TODO: Update properties?

	NSString * setActiveTabString = @"function(win){var tok;if(win==Ti.currentWindow){tok=Ti._TOKEN;}else{tok=win._TOKEN;if(!tok)return;}Ti.UI._TABACT(tok);}";


	NSString * createViewString = @"function(args){var res={};"
			"for(property in args){res[property]=args[property];};"
			"res.addView=function(newView,args){if(this.views){this.views.push(newView);}else{this.views=[newView];}if(this._TOKEN){newView.ensureToken();Ti.UI._WSVIEWS(this._TOKEN,[newView],false,args);}};"
			"res.getViews=function(){return Ti.UI.viewsForWindowToken(This._TOKEN);};"
			"res.getViewByName=function(name){var views=this.getViews();for(var i=0;i<views.length;i++){if(views[i].name==name)return views[i];}return null;};"
			"res.setActiveViewIndex=function(newIndex,args){this.activeViewIndex=newIndex;if(this._TOKEN){Ti.UI._WSAVIEW(this._TOKEN,newIndex,args);}};"
			"res.showView=function(blessedView,args){if(!this.views)return;var newIndex=0;var viewCount=this.views.length;"
			"for(var i=0;i<viewCount;i++){if(this.views[i]._TOKEN==blessedView._TOKEN){this.setActiveViewIndex(i,args);return;}}};"
			"res.open=function(){Ti.API.fatal('Open is no longer supported in web/table views, as they are no longer their own windows.');};"
			"res.ensureToken=function(){"
				"if(this.data){var data=this.data;var i=data.length;while(i>0){i--;var inp=data[i].input;if(inp)inp.ensureToken();}};"
				"if(this.sections){var grp=this.sections;var j=grp.length;while(j>0){j--;var data=grp[j].data;var i=data.length;"
					"while(i>0){i--;var inp=data[i].input;if(inp)inp.ensureToken();}"
				"}};"
				"if(this.search)this.search.ensureToken();"
				"if(this._TOKEN)return;var tkn=Ti.UI._VTOKEN();this._TOKEN=tkn;Ti.UI._VIEW[tkn]=this;};"
			"res.update=function(args){if(!this._TOKEN)return;Ti.UI._WUPDATE(this,args);};"
			"if(res.rightNavButton)res.setRightNavButton(res.rightNavButton);"
			"if(res.leftNavButton)res.setLeftNavButton(res.leftNavButton);"
			"return res;}";
	
	NSString * createWebViewString = @"function(args){var res=Ti.UI.createView(args);res._TYPE='web';"
			"res.insertButton=function(btn,args){if(btn)btn.ensureToken();Ti.UI._WINSBTN(this._TOKEN,btn,args);};"
			"res.setURL=function(newUrl){this.url=newUrl;if(this._TOKEN){Ti.UI._WURL(this._TOKEN,newUrl,document.location);};};"
			"res.evalJS=function(js){if(this._TOKEN){return Ti.UI._WEJS(this._TOKEN,String(js));};};"
			"res._EVT={preload:[],load:[]};res.doEvent=Ti._ONEVT;res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"return res;}";

	NSString * createScrollingViewString = @"function(args){var res=Ti.UI.createView(args);res._TYPE='scroll';if(!res.views)res.views=[];"
			"res.addView=function(view){if(!view)return;this.views.push(view);if(this._TOKEN){view.ensureToken();Ti.UI._SCRVWACT(this._TOKEN," STRINGVAL(SCROLLVIEW_ADDVIEW) ",view);}};"
			"res.scrollToView=function(view){if(typeof(view)=='number'){this._SETCURPAG(view);return;}if(!view)return;"
			"var views=this.views;var len=views.length;for(var i=0;i<len;i++){if(views[i]==view){this._SETCURPAG(i);return;}}};"
			"res._SETCURPAG=function(indx){this.currentPage=indx;if(this._TOKEN)Ti.UI._SCRVWACT(this._TOKEN," STRINGVAL(SCROLLVIEW_SETCURRENTPAGE) ",indx);};"
			"res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;res._EVT={scroll:[]};res.doEvent=Ti._ONEVT;"
			"res.ensureToken=function(){var views=this.views;var len=views.length;for(var i=0;i<len;i++){"
				"views[i].ensureToken();}if(this._TOKEN)return;var tkn=Ti.UI._VTOKEN();this._TOKEN=tkn;Ti.UI._VIEW[tkn]=this;};"
			"return res;}";

	NSString * createCompositeViewString = @"function(args){var res=Ti.UI.createView(args);res._TYPE='multi';if(!res.rules)res.rules=[];"
			"res.addView=function(view,traits){if(!view)return;var rule={};for(prop in traits){rule[prop]=traits[prop];};rule.view=view;this.rules.push(rule);"
				"if(this._TOKEN){view.ensureToken();Ti.UI._CMPVWACT(this._TOKEN," STRINGVAL(COMPOSITEVIEW_ADDRULE) ",rule);}};"
			"res.ensureToken=function(){var rules=this.rules;var len=rules.length;for(var i=0;i<len;i++){"
				"rules[i].view.ensureToken();}if(this._TOKEN)return;var tkn=Ti.UI._VTOKEN();this._TOKEN=tkn;Ti.UI._VIEW[tkn]=this;};"
			"return res;}";
	
	NSString * createImageViewString = @"function(args){var res=Ti.UI.createView(args);res._TYPE='image';"
			"res._EVT={click:[]};res.doEvent=Ti._ONEVT;res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setURL=function(newUrl){this.url=newUrl;if(this._TOKEN){Ti.UI._IMGVWACT(this._TOKEN," STRINGVAL(IMAGEVIEW_SETURL) ",newUrl);}};"
			"return res;}";

	NSString * createCoverFlowViewString = @"function(args){var res=Ti.UI.createView(args);res._TYPE='coverflow';"
			"res._EVT={click:[]};res.doEvent=Ti._ONEVT;res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res._SEL=0; res.__defineGetter__('selected',function(){return res._SEL;}); res.__defineSetter__('selected',function(i){ Ti.UI._CFLVWACT(this._TOKEN," STRINGVAL(COVERFLOWVIEW_SETSELECTED) ",[i]); res._SEL=i; });"
			"res.setSelected=function(i){ res.selected = i; };"
			"res.getSelected=function(){ return res.selected; };"
			"res.setURL=function(i,newUrl){if(this._TOKEN){Ti.UI._CFLVWACT(this._TOKEN," STRINGVAL(COVERFLOWVIEW_SETURL) ",[i,newUrl]);}};"
			"return res;}";

	NSString * createTableViewString = [NSString stringWithFormat:@"function(args,callback){var res=Ti.UI.createView(args);res._TYPE='table';res._WINTKN=Ti._TOKEN;"
			"res._EVT={click:[]};res.onClick=Ti._ONEVT;res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.addEventListener('click',callback);"
			"if(!res.data)res.data=[];"
			"res.getIndexByName=function(name){var rowCount=this.data.length;for(var i=0;i<rowCount;i++){if(this.data[i].name==name)return i}return -1;};"
			"res.insertRowAfter=function(rowIndex,row,args){this.data.splice(rowIndex+1,0,row);if(this._TOKEN){if(row.input)row.input.ensureToken();Ti.UI._WROWCHG(this._TOKEN,rowIndex,row,%d,args);}};"
			"res.insertRowBefore=function(rowIndex,row,args){"
				"if((rowIndex<this.data.length)&&(row.header==undefined)){var oldRow=this.data[rowIndex];row.header=oldRow.header;oldRow.header=undefined;}"
				"this.data.splice(rowIndex,0,row);if(this._TOKEN){if(row.input)row.input.ensureToken();Ti.UI._WROWCHG(this._TOKEN,rowIndex,row,%d,args);}};"
			"res.deleteRow=function(rowIndex,args){"
				"if(rowIndex<(this.data.length-1)){var nextRow=this.data[rowIndex+1];if(nextRow.header==undefined)nextRow.header=this.data[rowIndex].header;}"
				"this.data.splice(rowIndex,1);if(this._TOKEN){Ti.UI._WROWDEL(this._TOKEN,rowIndex,args);}};"
			"res.updateRow=function(rowIndex,row,args){this.data.splice(rowIndex,1,row);if(this._TOKEN){if(row.input)row.input.ensureToken();Ti.UI._WROWCHG(this._TOKEN,rowIndex,row,%d,args);}};"
			"res.appendRow=function(row,args){this.data.push(row);if(this._TOKEN){if(row.input)row.input.ensureToken();Ti.UI._WROWCHG(this._TOKEN,0,row,%d,args);}};"
			"res.scrollToIndex=function(rowIndex,args){if(this._TOKEN)Ti._TIDO('ui','scrollTableViewTo',[this._TOKEN,rowIndex,args])};"
			"res.setData=function(newData,args){this.data=newData;if(this._TOKEN){"
					"for(var i=0;i<newData.length;i++){if(newData[i].input)newData[i].input.ensureToken();}Ti.UI._WDTAUPD(this._TOKEN,newData,false,args);}};"
			"var tkn='TBL'+(Ti.UI._NEXTTKN++);Ti.UI._TBL[tkn]=res;res._PATH='Ti.UI._TBL.'+tkn;return res;}",
			TitaniumTableActionInsertAfterRow,TitaniumTableActionInsertBeforeRow,TitaniumTableActionUpdateRow,TitaniumTableActionAppendRow];

	NSString * createGroupedViewString = @"function(args,callback){var res=Ti.UI.createTableView(args,callback);res.grouped=true;res.sections=[];"
			"res.setSections=function(newSections,args){"
					"var cnt=this.sections.length;for(var i=0;i<cnt;i++){this.sections[i]._PATH=undefined;}"
					"this.sections=newSections;cnt=newSections.length;for(var i=0;i<cnt;i++){newSections[i]._PATH=this._PATH;}"
					"if(this._TOKEN){Ti.UI._WDTAUPD(this._TOKEN,newSections,true,args);}};"
			"res.insertSectionBefore=function(secIndex,section,args){section._PATH=this._PATH;this.sections.splice(secIndex,0,section);if(this._TOKEN){Ti.UI._WSECCHG(this._TOKEN,secIndex,section,false,args)}};"
			"res.insertSectionAfter=function(secIndex,section,args){this.insertSectionBefore(secIndex+1,section,args)};"
			"res.deleteSection=function(secIndex,section,args){this.sections[secIndex]._PATH=undefined;this.sections.splice(secIndex,1);if(this._TOKEN){Ti.UI._WSECDEL(this._TOKEN,secIndex,args)}};"
			"res.updateSection=function(secIndex,section,args){this.sections[secIndex]._PATH=undefined;this.sections.splice(secIndex,1,section);section._PATH=this._PATH;if(this._TOKEN){Ti.UI._WSECCHG(this._TOKEN,secIndex,section,true,args)}};"
			"res.addSection=function(section,args){this.sections.push(section);section._PATH=this._PATH;if(this._TOKEN){Ti.UI._WSECCHG(this._TOKEN,this.sections.count,section,false,args)}};"
			"res.setSections(res.sections);"
			"return res;}";
	
	NSString * createGroupedSectionString = @"function(args){var res={header:null,'data':[]};for(prop in args){res[prop]=args[prop]};"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;res.onClick=Ti._ONEVT;"
			"res._GRPNUM=function(){var secs=eval(this._PATH).sections;for(var i=0;i<secs.length;i++){if(secs[i]==this)return i;}return -1;};"
			"res.insertRowAfter=function(rowIndex,row,args){this.data.splice(rowIndex+1,0,row);if(!this._PATH)return;var tkn=eval(this._PATH)._TOKEN;"
				"if(tkn){if(row.input)row.input.ensureToken();Ti.UI._WSECROWCHG(tkn,this._GRPNUM(),rowIndex+1,row,false,args);}};"
			"res.insertRowBefore=function(rowIndex,row,args){this.data.splice(rowIndex,0,row);if(!this._PATH)return;var tkn=eval(this._PATH)._TOKEN;"
				"if(tkn){if(row.input)row.input.ensureToken();Ti.UI._WSECROWCHG(tkn,this._GRPNUM(),rowIndex,row,false,args);}};"
			"res.deleteRow=function(rowIndex,args){this.data.splice(rowIndex,1);if(!this._PATH)return;var tkn=eval(this._PATH)._TOKEN;"
				"if(tkn){Ti.UI._WSECROWDEL(tkn,this._GRPNUM(),rowIndex,args);}};"
			"res.updateRow=function(rowIndex,row,args){this.data.splice(rowIndex,1,row);if(!this._PATH)return;var tkn=eval(this._PATH)._TOKEN;"
				"if(tkn){if(row.input)row.input.ensureToken();Ti.UI._WSECROWCHG(tkn,this._GRPNUM(),rowIndex,row,true,args);}};"
			"res.setData=function(data,args){this.data=data;eval(this._PATH).updateSection(this._GRPNUM(),this,args);};"
			"return res;}";

	NSString * systemButtonStyleString = [NSString stringWithFormat:@"{PLAIN:%d,BORDERED:%d,DONE:%d,BAR:%d,BIG:%d,DARK:%d}",
										  UIBarButtonItemStylePlain,UIBarButtonItemStyleBordered,UIBarButtonItemStyleDone,UITitaniumNativeStyleBar,UITitaniumNativeStyleBig,UITitaniumNativeStyleDark];
	NSString * systemIconString = @"{BOOKMARKS:'ti:bookmarks',CONTACTS:'ti:contacts',DOWNLOADS:'ti:downloads',"
			"FAVORITES:'ti:favorites',DOWNLOADS:'ti:downloads',FEATURED:'ti:featured',MORE:'ti:more',MOST_RECENT:'ti:most_recent',"
			"MOST_VIEWED:'ti:most_viewed',RECENTS:'ti:recents',SEARCH:'ti:search',TOP_RATED:'ti:top_rated'}";

	NSString * statusBarString = [NSString stringWithFormat:@"{GREY:%d,GRAY:%d,DEFAULT:%d,OPAQUE_BLACK:%d,TRANSLUCENT_BLACK:%d}",
								  UIStatusBarStyleDefault,UIStatusBarStyleDefault,UIStatusBarStyleDefault,UIStatusBarStyleBlackOpaque,UIStatusBarStyleBlackTranslucent];
	
	NSString * animationStyleString = [NSString stringWithFormat:@"{CURL_UP:%d,CURL_DOWN:%d,FLIP_FROM_LEFT:%d,FLIP_FROM_RIGHT:%d}",
				UIViewAnimationTransitionCurlUp,UIViewAnimationTransitionCurlDown,UIViewAnimationTransitionFlipFromLeft,UIViewAnimationTransitionFlipFromRight];
	
	NSString * rowAnimationStyleString = [NSString stringWithFormat:@"{FADE:%d,RIGHT:%d,LEFT:%d,TOP:%d,BOTTOM:%d,NONE:%d}",
				UITableViewRowAnimationFade,UITableViewRowAnimationRight,UITableViewRowAnimationLeft,
				UITableViewRowAnimationTop,UITableViewRowAnimationBottom,
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= 30000	 	
				UITableViewRowAnimationNone];        // available in iPhone 3.0
#else
				UITableViewRowAnimationBottom+1];	//We cheat!
#endif
	
	NSString * createTabString = @"function(args){var res={"
			"setBadge:function(val){this.badge=val;if(this._TOKEN)Ti.UI._TBADGE(this._TOKEN,val);},"
			"};"
			"if(args){for(prop in args){res[prop]=args[prop];}}"
			"return res;}";
	NSString * getTabByNameString = @"function(name){if(!name)return null;var props=Ti.UI._TABGET(name);if(!props)return null;return Ti.UI.createTab(props);}";
	NSString * getAllTabsString = @"function(){var propsAr=Ti.UI._TABALL();if(!propsAr)return null;var res=[];for(var i=0;i<propsAr.length;i++){res[i]=Ti.UI.createTab(propsAr[i]);}return res;}";

	NSString * createOptionDialogString = @"function(args){var res={};for(prop in args){res[prop]=args[prop];};"
			"res._TOKEN='MDL'+(Ti.UI._NEXTTKN++);Ti.UI._MODAL[res._TOKEN]=res;res.onClick=Ti._ONEVT;"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setOptions=function(args){this.options=args;};"
			"res.setTitle=function(args){this.title=args;};"
			"res.setDestructive=function(args){this.destructive=args;};"
			"res.setCancel=function(args){this.cancel=args;};"
			"res.show=function(){Ti.UI._MSHOW(this,false)};"
			"return res;}";
	TitaniumJSCode * createAlertCode = [TitaniumJSCode codeWithString:
			@"function(args){var res={};for(prop in args){res[prop]=args[prop];};"
			"if(args && args.buttonNames){res.options=args.buttonNames;}"
			"res._TOKEN='MDL'+(Ti.UI._NEXTTKN++);Ti.UI._MODAL[res._TOKEN]=res;res.onClick=Ti._ONEVT;"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setButtonNames=function(args){this.options=args;};"
			"res.setTitle=function(args){this.title=args;};"
			"res.setMessage=function(args){this.message=args;};"
			"res.show=function(){Ti.UI._MSHOW(this,true)};"
			"return res;}"];
	[createAlertCode setEpilogueCode:@"window.alert=function(args){Ti.API.log('alert',args);};"];

	NSString * createProgressBarString = @"function(args){var res=Ti.UI.createActivityIndicator(args,'progressbar');return res;}";

	NSString * timeModes = [NSString stringWithFormat:@"{MODE_TIME:%d,MODE_DATE:%d,MODE_DATE_AND_TIME:%d}",
			UIDatePickerModeTime,UIDatePickerModeDate,UIDatePickerModeDateAndTime];


	NSDictionary * uiDict = [NSDictionary dictionaryWithObjectsAndKeys:
			[TitaniumJSCode codeWithString:@"Ti._ADDEVT"],@"addEventListener",
			[TitaniumJSCode codeWithString:@"{tabchange:[]}"],@"_EVT",
			[TitaniumJSCode codeWithString:@"Ti._REMEVT"],@"removeEventListener",
			[TitaniumJSCode codeWithString:@"Ti._ONEVT"],@"_ONEVT",

			[NSNumber numberWithInt:UITableViewScrollPositionNone],@"TABLEVIEW_POSITION_ANY",
			[NSNumber numberWithInt:UITableViewScrollPositionTop],@"TABLEVIEW_POSITION_TOP",
			[NSNumber numberWithInt:UITableViewScrollPositionMiddle],@"TABLEVIEW_POSITION_MIDDLE",
			[NSNumber numberWithInt:UITableViewScrollPositionBottom],@"TABLEVIEW_POSITION_BOTTOM",


			windowActionInvoc,@"_WACT",

			closeWinInvoc,@"_CLS",
			openWinInvoc,@"_OPN",
			resizeWindowInvoc,@"_DORESIZE",
			changeWinUrlInvoc,@"_WURL",
			evalInvoc,@"_WEJS",				 
			changeWinFullScreenInvoc,@"_WFSCN",
			showNavBarInvoc,@"_WSHNAV",
			hideNavBarInvoc,@"_WHDNAV",
			setTitleInvoc,@"_WTITLE",

			getWindowInvoc,@"_WINGET",
			
			setTitleImageInvoc,@"_WTITLEIMG",
			setTitleImageProxyInvoc,@"_WTITLEPXY",
			setTitlePromptInvoc,@"_WTITLEPROMPT",
			changeWinNavColorInvoc,@"_WNAVTNT",
			setNavButtonInvoc,@"_WNAVBTN",
			updateToolbarInvoc,@"_WTOOL",
			insertNativeViewInvoc,@"_WINSBTN",
			
			activateTabInvoc,@"_TABACT",
			getTabByNameInvoc,@"_TABGET",
			getAllTabsInvoc,@"_TABALL",
			
			insertRowInvoc,@"_WROWCHG",
			deleteRowInvoc,@"_WROWDEL",
			updateDataInvoc,@"_WDTAUPD",
			setSectionRowInvoc,@"_WSECROWCHG",
			setSectionInvoc,@"_WSECCHG",
			deleteSectionInvoc,@"_WSECDEL",
			deleteSectionRowInvoc,@"_WSECROWDEL",
			
			reserveTokenInvoc,@"_VTOKEN",
			
			setWindowViewsInvoc,@"_WSVIEWS",
			getWindowViewsInvoc,@"_WGVIEWS",
			setWindowActiveViewInvoc,@"_WSAVIEW",
			
			[TitaniumJSCode codeWithString:@"{}"], @"_BTN",
			buttonTokenGen,@"_BTNTKN",
			setButtonFocusInvoc,@"_BTNFOC",
			updateButtonInvoc,@"_BTNUPD",

			scrollViewInvoc,@"_SCRVWACT",
			compositeViewInvoc,@"_CMPVWACT",
			imageViewInvoc,@"_IMGVWACT",
			coverflowViewInvoc,@"_CFLVWACT",				 

			[TitaniumJSCode codeWithString:createButtonString],@"createButton",
			[TitaniumJSCode codeWithString:createActivityIndicatorString],@"createActivityIndicator",
			[TitaniumJSCode codeWithString:createProgressBarString],@"createProgressBar",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'switch');}"],@"createSwitch",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'slider');}"],@"createSlider",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'text');}"],@"createTextField",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'textarea');}"],@"createTextArea",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'multibutton');}"],@"createButtonBar",
			[TitaniumJSCode codeWithString:@"function(args){var res=Ti.UI.createButton(args,'segmented');res.setIndex=function(val){this.index=val;this.update();};return res;}"],@"createTabbedBar",
			[TitaniumJSCode codeWithString:createDatePickerString],@"createDatePicker",
			[TitaniumJSCode codeWithString:createPickerString],@"createPicker",
			[TitaniumJSCode codeWithString:createSearchBarString],@"createSearchBar",

//			[TitaniumJSCode codeWithString:createModalDatePickerString],@"createModalDatePicker",
//			[TitaniumJSCode codeWithString:createModalPickerString],@"createModalPicker",

			[TitaniumInvocationGenerator invocationWithTarget:self selector:@selector(picker:action:arguments:) object:nil],@"_PICACT",

			[NSNumber numberWithInt:1],@"_NEXTTKN",
			showModalInvoc,@"_MSHOW",
			[TitaniumJSCode codeWithString:createOptionDialogString],@"createOptionDialog",
			createAlertCode,@"createAlertDialog",

			[TitaniumJSCode codeWithString:viewsForWindowString],@"viewsForWindowToken",

			
			appBadgeInvoc,@"setAppBadge",
			tabBadgeInvoc,@"_TBADGE",

			[TitaniumJSCode codeWithString:@"{}"],@"_MODAL",
			[TitaniumJSCode codeWithString:@"{}"],@"_TBL",
			[TitaniumJSCode codeWithString:@"{}"],@"_VIEW",
			[TitaniumJSCode codeWithString:@"{}"],@"_EMAIL",
			emailComposeInvoc,@"_OPNEMAIL",
			[TitaniumJSCode codeWithString:createEmailString],@"createEmailDialog",
			currentWindowScript,@"currentWindow",
			[TitaniumJSCode codeWithString:currentViewString],@"currentView",
			[TitaniumJSCode codeWithString:@"{_TOKEN:Ti._TOKEN}"],@"currentTab",
			[TitaniumJSCode codeWithString:createWindowString],@"createWindow",
			[TitaniumJSCode codeWithString:getWindowByNameString],@"getWindowByName",


			[TitaniumJSCode codeWithString:createViewString],@"createView",
			[TitaniumJSCode codeWithString:createWebViewString],@"createWebView",
			[TitaniumJSCode codeWithString:createScrollingViewString],@"createScrollableView",
			[TitaniumJSCode codeWithString:createCompositeViewString],@"createCompositeView",
			[TitaniumJSCode codeWithString:createImageViewString],@"createImageView",
			[TitaniumJSCode codeWithString:createTableViewString],@"createTableView",
			[TitaniumJSCode codeWithString:createCoverFlowViewString],@"createCoverFlowView",
			[TitaniumJSCode codeWithString:setActiveTabString],@"setActiveTab",
			[TitaniumJSCode codeWithString:createTabString],@"createTab",
			[TitaniumJSCode codeWithString:getTabByNameString],@"getTabByName",
			[TitaniumJSCode codeWithString:getAllTabsString],@"getTabs",
			
			[NSNumber numberWithInt:TitaniumViewControllerPortrait],@"PORTRAIT",
			[NSNumber numberWithInt:TitaniumViewControllerLandscape],@"LANDSCAPE",
			[NSNumber numberWithInt:TitaniumViewControllerLandscapeOrPortrait],@"PORTRAIT_AND_LANDSCAPE",
			[NSNumber numberWithInt:UIReturnKeyGo],@"RETURNKEY_GO",
			[NSNumber numberWithInt:UIReturnKeyGoogle],@"RETURNKEY_GOOGLE",
			[NSNumber numberWithInt:UIReturnKeyJoin],@"RETURNKEY_JOIN",
			[NSNumber numberWithInt:UIReturnKeyNext],@"RETURNKEY_NEXT",
			[NSNumber numberWithInt:UIReturnKeySearch],@"RETURNKEY_SEARCH",
			[NSNumber numberWithInt:UIReturnKeySend],@"RETURNKEY_SEND",
			[NSNumber numberWithInt:UIReturnKeyDone],@"RETURNKEY_DONE",
			[NSNumber numberWithInt:UIReturnKeyDefault],@"RETURNKEY_DEFAULT",
			[NSNumber numberWithInt:UIReturnKeyRoute],@"RETURNKEY_ROUTE",
			[NSNumber numberWithInt:UIReturnKeyYahoo],@"RETURNKEY_YAHOO",
			[NSNumber numberWithInt:UIReturnKeyEmergencyCall],@"RETURNKEY_EMERGENCY_CALL",

			[NSNumber numberWithInt:UIKeyboardTypeASCIICapable],@"KEYBOARD_ASCII",
			[NSNumber numberWithInt:UIKeyboardTypeURL],@"KEYBOARD_URL",
			[NSNumber numberWithInt:UIKeyboardTypePhonePad],@"KEYBOARD_PHONE_PAD",
			[NSNumber numberWithInt:UIKeyboardTypeNumbersAndPunctuation],@"KEYBOARD_NUMBERS_PUNCTUATION",
			[NSNumber numberWithInt:UIKeyboardTypeNumberPad],@"KEYBOARD_NUMBER_PAD",
			[NSNumber numberWithInt:UIKeyboardTypeEmailAddress],@"KEYBOARD_EMAIL_ADDRESS",
			[NSNumber numberWithInt:UIKeyboardTypeDefault],@"KEYBOARD_DEFAULT",

			[NSNumber numberWithInt:UITextFieldViewModeNever],@"INPUT_BUTTONMODE_NEVER",
			[NSNumber numberWithInt:UITextFieldViewModeAlways],@"INPUT_BUTTONMODE_ALWAYS",
			[NSNumber numberWithInt:UITextFieldViewModeWhileEditing],@"INPUT_BUTTONMODE_ONFOCUS",
			[NSNumber numberWithInt:UITextFieldViewModeUnlessEditing],@"INPUT_BUTTONMODE_ONBLUR",

			[NSNumber numberWithInt:UITextBorderStyleNone],@"INPUT_BORDERSTYLE_NONE",
			[NSNumber numberWithInt:UITextBorderStyleLine],@"INPUT_BORDERSTYLE_LINE",
			[NSNumber numberWithInt:UITextBorderStyleBezel],@"INPUT_BORDERSTYLE_BEZEL",
			[NSNumber numberWithInt:UITextBorderStyleRoundedRect],@"INPUT_BORDERSTYLE_ROUNDED",

			[TitaniumJSCode codeWithString:timeModes],@"DatePicker",

			[NSDictionary dictionaryWithObjectsAndKeys:
					[TitaniumJSCode codeWithString:createGroupedViewString],@"createGroupedView",
					[TitaniumJSCode codeWithString:createGroupedSectionString],@"createGroupedSection",
					statusBarStyleInvoc,@"setStatusBarStyle",
					[TitaniumJSCode codeWithString:systemButtonStyleString],@"SystemButtonStyle",
					[TitaniumJSCode codeWithString:systemButtonStyleString],@"ProgressBarStyle",
					[TitaniumJSCode codeWithString:systemButtonStyleString],@"ActivityIndicatorStyle",
					[TitaniumJSCode codeWithString:systemButtonString],@"SystemButton",
					[TitaniumJSCode codeWithString:systemIconString],@"SystemIcon",
					[TitaniumJSCode codeWithString:statusBarString],@"StatusBar",
					[TitaniumJSCode codeWithString:animationStyleString],@"AnimationStyle",
					[TitaniumJSCode codeWithString:rowAnimationStyleString],@"RowAnimationStyle",
					nil],@"iPhone",
			nil];
	[[TitaniumHost sharedHost] bindObject:uiDict toKeyPath:@"UI"];
	
	return YES;
}

- (void) dealloc
{
	[super dealloc];
}


@end

#endif