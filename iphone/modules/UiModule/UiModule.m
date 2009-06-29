/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_UI

#import "UiModule.h"


NSString * const iPhoneBarButtonGeneratorFunction = @"function(token){"
//	"var token=;"
"var result={_TOKEN:token,onClick:Ti._ONEVT,"
	"_EVT:{click:[],valuechange:[]},addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
	"title:null,image:null,style:null,systemButton:null,useDivProperties:function(div){"
		"if(!div)return;"
		"var attr=div.attributes;if(attr){"
			"var i=attr.length;while(i>0){"
				"i--;this[attr[i].name]=attr[i].value;"
			"}}"
		"this.y=0;this.x=0;this.width=div.offsetWidth;this.height=div.offsetHeight;"
		"while(div){this.x+=div.offsetLeft;this.y+=div.offsetTop;div=div.offsetParent;}"
	"},bindToDiv:function(div){this._DIV=div;this.useDivProperties(div);Ti.UI.currentWindow.insertButton(this);}};"
"Ti.UI._BTN[token]=result;"
"return result;"
"}";


NSDictionary * barButtonSystemItemForStringDict = nil;

enum { //MUST BE NEGATIVE, as it inhabits the same space as UIBarButtonSystemItem
	UITitaniumNativeItemNone = -1, //Also is a bog-standard button.
	UITitaniumNativeItemSpinner = -2,
	UITitaniumNativeItemProgressBar = -3,

	UITitaniumNativeItemSlider = -4,
	UITitaniumNativeItemSwitch = -5,
	UITitaniumNativeItemMultiButton = -6,

	UITitaniumNativeItemSegmented = -7,

	UITitaniumNativeItemTextView = -8,
	UITitaniumNativeItemTextField = -9,
	UITitaniumNativeItemSearchBar = -10,

	UITitaniumNativeItemPicker = -11,
	UITitaniumNativeItemDatePicker = -12,
};


int barButtonSystemItemForString(NSString * inputString){
	if (barButtonSystemItemForStringDict == nil) {
		barButtonSystemItemForStringDict = [[NSDictionary alloc] initWithObjectsAndKeys:
				[NSNumber numberWithInt:UIBarButtonSystemItemAction],@"action",
				[NSNumber numberWithInt:UIBarButtonSystemItemBookmarks],@"bookmarks",
				[NSNumber numberWithInt:UIBarButtonSystemItemCamera],@"camera",
				[NSNumber numberWithInt:UIBarButtonSystemItemCompose],@"compose",
				[NSNumber numberWithInt:UIBarButtonSystemItemDone],@"done",
				[NSNumber numberWithInt:UIBarButtonSystemItemCancel],@"cancel",
				[NSNumber numberWithInt:UIBarButtonSystemItemEdit],@"edit",
				[NSNumber numberWithInt:UIBarButtonSystemItemSave],@"save",
				[NSNumber numberWithInt:UIBarButtonSystemItemAdd],@"add",
				[NSNumber numberWithInt:UIBarButtonSystemItemFlexibleSpace],@"flexiblespace",
				[NSNumber numberWithInt:UIBarButtonSystemItemFixedSpace],@"fixedspace",
				[NSNumber numberWithInt:UIBarButtonSystemItemReply],@"reply",
				[NSNumber numberWithInt:UIBarButtonSystemItemOrganize],@"organize",
				[NSNumber numberWithInt:UIBarButtonSystemItemSearch],@"search",
				[NSNumber numberWithInt:UIBarButtonSystemItemRefresh],@"refresh",
				[NSNumber numberWithInt:UIBarButtonSystemItemStop],@"stop",
				[NSNumber numberWithInt:UIBarButtonSystemItemTrash],@"trash",
				[NSNumber numberWithInt:UIBarButtonSystemItemPlay],@"play",
				[NSNumber numberWithInt:UIBarButtonSystemItemPause],@"pause",
				[NSNumber numberWithInt:UIBarButtonSystemItemRewind],@"rewind",
				[NSNumber numberWithInt:UIBarButtonSystemItemFastForward],@"fastforward",
				[NSNumber numberWithInt:UITitaniumNativeItemSpinner],@"activity",
				[NSNumber numberWithInt:UITitaniumNativeItemSlider],@"slider",
				[NSNumber numberWithInt:UITitaniumNativeItemSwitch],@"switch",
				[NSNumber numberWithInt:UITitaniumNativeItemPicker],@"picker",
				[NSNumber numberWithInt:UITitaniumNativeItemDatePicker],@"datepicker",
				[NSNumber numberWithInt:UITitaniumNativeItemTextField],@"text",
				[NSNumber numberWithInt:UITitaniumNativeItemTextView],@"textarea",
				[NSNumber numberWithInt:UITitaniumNativeItemSearchBar],@"search",
				nil];
	}
	NSNumber * result = [barButtonSystemItemForStringDict objectForKey:[inputString lowercaseString]];
	if (result != nil) return [result intValue];
	return UITitaniumNativeItemNone;
}

@implementation UIButtonProxy
@synthesize nativeBarButton;
@synthesize titleString, iconPath, templateValue, barButtonStyle, nativeView, labelView, progressView;
@synthesize minValue,maxValue,floatValue,stringValue;

- (id) init;
{
	if ((self = [super init])){
		templateValue = UITitaniumNativeItemNone;
		spinnerStyle = UIActivityIndicatorViewStyleWhite;
		maxValue = 1.0;
	}
	return self;
}

#define GRAB_IF_SELECTOR(keyString,methodName,resultOutput)	\
	{id newObject=[newDict objectForKey:keyString];	\
	if ([newObject respondsToSelector:@selector(methodName)]){	\
		resultOutput = [newObject methodName];	\
		needsRefreshing = YES;	\
	}}

#define GRAB_IF_STRING(keyString,resultOutput)	\
	{id newObject=[newDict objectForKey:keyString];	\
	if ([newObject isKindOfClass:[NSString class]] && ![resultOutput isEqualToString:newObject]) {	\
		self.resultOutput = newObject;	\
		needsRefreshing = YES;	\
	}}

- (void) setPropertyDict: (NSDictionary *) newDict;
{	
	GRAB_IF_STRING(@"title",titleString);
	GRAB_IF_STRING(@"image",iconPath);

	GRAB_IF_SELECTOR(@"style",intValue,barButtonStyle);

	GRAB_IF_SELECTOR(@"min",floatValue,minValue);
	GRAB_IF_SELECTOR(@"max",floatValue,maxValue);

	id valueObject = [newDict objectForKey:@"value"];
	if ([valueObject respondsToSelector:@selector(floatValue)]){
		floatValue = [valueObject floatValue];
		needsRefreshing = YES;
	}
	if ([valueObject respondsToSelector:@selector(stringValue)]){
		[self setStringValue:[valueObject stringValue]];
		needsRefreshing = YES;
	} else if ([valueObject isKindOfClass:[NSString class]]) {
		[self setStringValue:valueObject];
		needsRefreshing = YES;
	}

	GRAB_IF_SELECTOR(@"width",floatValue,frame.size.width);
	GRAB_IF_SELECTOR(@"height",floatValue,frame.size.height);
	GRAB_IF_SELECTOR(@"x",floatValue,frame.origin.x);
	GRAB_IF_SELECTOR(@"y",floatValue,frame.origin.y);

	
	id newTemplate = [newDict objectForKey:@"systemButton"];
	if ([newTemplate isKindOfClass:[NSString class]]) {
		[self setTemplateValue:barButtonSystemItemForString(newTemplate)];
		needsRefreshing = YES;
	} else if ([newTemplate isKindOfClass:[NSNumber class]]) {
		[self setTemplateValue:[newTemplate intValue]];
		needsRefreshing = YES;
	}
	
	
	
}

- (BOOL) updateNativeView: (BOOL) forBar;
{
	id resultView=nil;

	CGRect viewFrame=frame;
	if (forBar){
		viewFrame.size.height = 40.0;
	} else if (viewFrame.size.height < 2) viewFrame.size.height = 20;
	if (viewFrame.size.width < 2) viewFrame.size.width = 30;

	if (templateValue == UITitaniumNativeItemSpinner){
		if ([nativeView isKindOfClass:[UIActivityIndicatorView class]]){
			resultView = [nativeView retain];
			[(UIActivityIndicatorView *)resultView setActivityIndicatorViewStyle:spinnerStyle];
		} else {
			resultView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:spinnerStyle];
			[(UIActivityIndicatorView *)resultView startAnimating];
		}
		viewFrame.size = [(UIView *)resultView frame].size;
		[(UIView *)resultView setFrame:viewFrame];

	} else if (templateValue == UITitaniumNativeItemSlider){
		if ([nativeView isKindOfClass:[UISlider class]]){
			resultView = [nativeView retain];
			[(UIView *)resultView setFrame:viewFrame];
		} else {
			resultView = [[UISlider alloc] initWithFrame:viewFrame];
			[(UISlider *)resultView addTarget:self action:@selector(onValueChange:) forControlEvents:UIControlEventValueChanged];
		}
		[(UISlider *)resultView setMinimumValue:minValue];
		[(UISlider *)resultView setMaximumValue:maxValue];
		[(UISlider *)resultView setValue:floatValue];
		

	} else if (templateValue == UITitaniumNativeItemSwitch){
		if ([nativeView isKindOfClass:[UISwitch class]]){
			resultView = [nativeView retain];
			[(UIView *)resultView setFrame:viewFrame];
		} else {
			resultView = [[UISwitch alloc] initWithFrame:viewFrame];
			[(UISwitch *)resultView addTarget:self action:@selector(onSwitchChange:) forControlEvents:UIControlEventValueChanged];
		}
		[(UISwitch *)resultView setOn:(floatValue > ((minValue + maxValue)/2))];

	} else if (templateValue == UITitaniumNativeItemTextField){
		if (viewFrame.size.height < 20) viewFrame.size.height = 20;
		if ([nativeView isKindOfClass:[UITextField class]]){
			resultView = [nativeView retain];
			[(UIView *)resultView setFrame:viewFrame];
		} else {
			resultView = [[UITextField alloc] initWithFrame:viewFrame];
			[(UITextField *)resultView setDelegate:self];
		}
		[(UITextField *)resultView setText:stringValue];
		
	} else if (templateValue == UITitaniumNativeItemTextView){
		if (viewFrame.size.height < 20) viewFrame.size.height = 20;
		if ([nativeView isKindOfClass:[UITextView class]]){
			resultView = [nativeView retain];
			[(UIView *)resultView setFrame:viewFrame];
		} else {
			resultView = [[UITextView alloc] initWithFrame:viewFrame];
			[(UITextView *)resultView setDelegate:self];
		}
		[(UITextView *)resultView setText:stringValue];
		
		
//	} else if (templateValue == UITitaniumNativeItemPicker){
//		if ([nativeView isKindOfClass:[UIPickerView class]]){
//			resultView = [nativeView retain];
//			[(UIView *)resultView setFrame:viewFrame];
//		} else {
//			resultView = [[UISwitch alloc] initWithFrame:viewFrame];
//		}
//		[(UISwitch *)resultView setOn:(floatValue > ((minValue + maxValue)/2))];
//		[(UISwitch *)resultView addTarget:self action:@selector(onSwitchChange:) forControlEvents:UIControlEventValueChanged];
	}
	
	
	if (resultView == nil) {
		UIButtonType resultType = UIButtonTypeRoundedRect;
//		switch (<#expression#>) {
//			case <#constant#>:
//				<#statements#>
//				break;
//			default:
//				break;
//		}

		if([nativeView isKindOfClass:[UIButton class]] && ([(UIButton *)nativeView buttonType]==resultType)){
			resultView = [nativeView retain];
		} else {
			resultView = [[UIButton buttonWithType:resultType] retain];
			[(UIButton *)resultView addTarget:self action:@selector(onClick:) forControlEvents:UIControlEventTouchUpInside];
		}
	
		[resultView setFrame:viewFrame];
		UIImage * iconImage = [[TitaniumHost sharedHost] imageForResource:iconPath];
		[(UIButton *)resultView setImage:iconImage forState:UIControlStateNormal];
		[(UIButton *)resultView setTitle:titleString forState:UIControlStateNormal];
	}	
		
	[nativeView autorelease];
	BOOL isNewView = (nativeView != resultView);
	nativeView = resultView;
	return isNewView;
}

- (void) updateNativeBarButton;
{
	UIBarButtonItem * result = nil;
	SEL onClickSel = @selector(onClick:);
	
	if (templateValue <= UITitaniumNativeItemSpinner){
		[self updateNativeView:YES];
		if ([nativeBarButton customView]==nativeView) {
			result = [nativeBarButton retain]; //Why waste a good bar button?
		} else {
			result = [[UIBarButtonItem alloc] initWithCustomView:nativeView];
		}

		[result setStyle:barButtonStyle];

	} else if (templateValue != UITitaniumNativeItemNone){
		result = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:templateValue target:self action:onClickSel];

	} else if (iconPath != nil) {
		UIImage * iconImage = [[TitaniumHost sharedHost] imageForResource:iconPath];
		if (iconImage != nil) {
			result = [[UIBarButtonItem alloc] initWithImage:iconImage style:barButtonStyle target:self action:onClickSel];
		}
	} //Because a possibly wrong url, we break the ifelse chain.
	
	if (result == nil) { //Still failed? Use the title.
		result = [[UIBarButtonItem alloc] initWithTitle:titleString style:barButtonStyle target:self action:onClickSel];
	}
	
	[result setWidth:frame.size.width];
	[nativeBarButton autorelease];
	nativeBarButton = result;
}

- (UIBarButtonItem *) nativeBarButton;
{
	if ((nativeBarButton == nil) || needsRefreshing) {
		[self updateNativeBarButton];
		needsRefreshing = NO;
	}
	return nativeBarButton;
}

- (UIView *) nativeView;
{
	if ((nativeView == nil) || needsRefreshing){
		[self updateNativeView:NO];
		needsRefreshing = NO;
	}
	return nativeView;
}

- (IBAction) onClick: (id) sender;
{
	NSString * handleClickCommand = [NSString stringWithFormat:@"(function(){Titanium.UI._BTN.%@.onClick({type:'click'});}).call(Titanium.UI._BTN.%@);",token,token];
	[[TitaniumHost sharedHost] sendJavascript:handleClickCommand toPageWithToken:parentPageToken];
}

- (IBAction) onSwitchChange: (id) sender;
{
	NSString * newValue = ([(UISwitch *)sender isOn] ? @"true":@"false");
	NSString * handleClickCommand = [NSString stringWithFormat:@"(function(){Titanium.UI._BTN.%@.onClick({type:'change',value:%@});}).call(Titanium.UI._BTN.%@);",token,newValue,token];
	[[TitaniumHost sharedHost] sendJavascript:handleClickCommand toPageWithToken:parentPageToken];
}

- (IBAction) onTextChange: (id) sender;
{
	SBJSON * parser = [[SBJSON alloc] init];
	NSString * valueString = [parser stringWithFragment:[sender text] error:nil];
	[parser release];
	NSString * handleClickCommand = [NSString stringWithFormat:@"(function(){Titanium.UI._BTN.%@.onClick({type:'change',value:%@});}).call(Titanium.UI._BTN.%@);",token,valueString,token];
	[[TitaniumHost sharedHost] sendJavascript:handleClickCommand toPageWithToken:parentPageToken];
}

- (void)textFieldDidEndEditing:(UITextField *)textField;
{
	[self onTextChange:textField];
}

- (void)textViewDidEndEditing:(UITextView *)textView;
{
	[self onTextChange:textView];
}



- (IBAction) onValueChange: (id) sender;
{
	float newValue = [(UISlider *)sender value];
	NSString * handleClickCommand = [NSString stringWithFormat:@"(function(){Titanium.UI._BTN.%@.onClick({type:'change',value:%f});}).call(Titanium.UI._BTN.%@);",token,newValue,token];
	[[TitaniumHost sharedHost] sendJavascript:handleClickCommand toPageWithToken:parentPageToken];
}
		


- (void) dealloc
{
	[titleString release];
	[iconPath release];
	[nativeBarButton release];
	[super dealloc];
}


@end

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
	if (![self takeToken:inputDict])return;

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
	[actionSheet performSelectorOnMainThread:@selector(showInView:) withObject:doomedView waitUntilDone:NO];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:YES];
	[self retain];
}

- (void) showAlertViewWithDict: (NSDictionary *) inputDict;
{
	if (![self takeToken:inputDict])return;

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
	
	[alertView performSelectorOnMainThread:@selector(show) withObject:nil waitUntilDone:NO];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:YES];
	[self retain];
}

- (void)actionSheet:(UIActionSheet *)anActionSheet clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSString * result = [NSString stringWithFormat:@"Ti.UI._MODAL.%@.onClick("
			"{type:'click',index:%d,cancel:%d,destructive:%d})",tokenString,buttonIndex,
			[anActionSheet cancelButtonIndex],[anActionSheet destructiveButtonIndex]];
	
	[[TitaniumHost sharedHost] sendJavascript:result toPageWithToken:contextString];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:NO];
	[self autorelease];
}

- (void)alertView:(UIAlertView *)anAlertView clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSString * result = [NSString stringWithFormat:@"Ti.UI._MODAL.%@.onClick("
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





@implementation UiModule
#pragma mark Utility methods
//- (TitaniumViewController *) titaniumViewControllerForToken: (NSString *) tokenString;
//{
//	if (![tokenString isKindOfClass:[NSString class]]) return nil;
//	TitaniumViewController * ourVC = [virtualWindowsDict objectForKey:tokenString];
//	if(ourVC == nil) {
//		ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
//	}
//	return ourVC;
//}

#pragma mark button

- (NSString *) makeButtonToken;
{
	UIButtonProxy * newProxy = [[UIButtonProxy alloc] init];
	NSString * buttonToken = [NSString stringWithFormat:@"BTN%X",nextButtonToken++];
	[newProxy setToken:buttonToken];
	[buttonContexts setObject:newProxy forKey:buttonToken];
	[newProxy release];
	return buttonToken;
}

- (UIButtonProxy *) proxyForObject: (id) proxyObject;
{
	NSString * token = nil;
	if ([proxyObject isKindOfClass:[NSDictionary class]]){
		token = [proxyObject objectForKey:@"_TOKEN"];
		if (![token isKindOfClass:[NSString class]]) return nil;
		UIButtonProxy * result = [buttonContexts objectForKey:token];

		NSDictionary * divAttributeDict = [proxyObject objectForKey:@"divAttr"];
		if ([divAttributeDict isKindOfClass:[NSDictionary class]])[result setPropertyDict:divAttributeDict];

		[result setPropertyDict:proxyObject];
		return result;

	} else if ([proxyObject isKindOfClass:[NSString class]]){
		return [buttonContexts objectForKey:proxyObject];
	}

	return nil;
}


#pragma mark Window actions

- (NSString *) openWindow: (id)windowObject animated: (id) animatedObject; //Defaults to true.
{
	if (![windowObject isKindOfClass:[NSDictionary class]]){
		return nil;
	}
	NSString * token = [windowObject objectForKey:@"_TOKEN"];
	if ([token isKindOfClass:[NSString class]]) return token; //So that it doesn't drop its token.
		
	TitaniumViewController * thisVC = [[TitaniumHost sharedHost] currentTitaniumViewController];
	TitaniumViewController * resultVC = [TitaniumViewController viewControllerForState:windowObject relativeToUrl:[thisVC currentContentURL]];
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
	
	BOOL animated = YES;

	if ([animatedObject isKindOfClass:[NSDictionary class]]) animatedObject = [animatedObject objectForKey:@"animated"];
	if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];

	SEL action = animated ? @selector(pushViewControllerAnimated:) : @selector(pushViewControllerNonAnimated:);

	[thisVC performSelectorOnMainThread:action withObject:resultVC waitUntilDone:NO];
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
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];

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

	[ourVC performSelectorOnMainThread:@selector(currentContentURL:) withObject:newURL waitUntilDone:NO];
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
	
	UIButtonProxy * ourButton = nil;
	if ([buttonObject isKindOfClass:[NSDictionary class]]){
		ourButton = [self proxyForObject:buttonObject];
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
	[ourVC performSelectorOnMainThread:actionSelector withObject:[ourButton nativeBarButton] waitUntilDone:NO];
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
			UIButtonProxy * thisProxy = [self proxyForObject:thisButtonDict];
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
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if ((ourVC == nil) || ![viewObject isKindOfClass:dictClass]) return;
	
	UIButtonProxy * ourNativeViewProxy = [self proxyForObject:viewObject];
	if (ourNativeViewProxy == nil) return;
	
	[ourVC performSelectorOnMainThread:@selector(addNativeViewProxy:) withObject:ourNativeViewProxy waitUntilDone:NO];
}


#pragma mark Current Window actions

- (void) setTabBadge: (id) newBadge;
{
	NSString * result = nil;
	
	if ([newBadge isKindOfClass:[NSDictionary class]])newBadge=[newBadge objectForKey:@"badge"];
	
	if ([newBadge isKindOfClass:[NSString class]])result=newBadge;
	if ([newBadge respondsToSelector:@selector(stringValue)])result=[newBadge stringValue];
	
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[[currentViewController tabBarItem] performSelectorOnMainThread:@selector(setBadgeValue:) withObject:result waitUntilDone:NO];
}

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

#pragma mark App-wide actions

- (void) setAppBadge: (id) newBadge;
{
	NSInteger newNumber = 0;
	if([newBadge respondsToSelector:@selector(intValue)]) newNumber=[newBadge intValue];

	[[UIApplication sharedApplication] setApplicationIconBadgeNumber:newNumber];
}

#pragma mark Modal things (alert and options)

- (void) showModal: (NSDictionary *) modalObject isAlert: (id) isAlertObject;
{
	if ((![isAlertObject respondsToSelector:@selector(boolValue)]) || (![modalObject isKindOfClass:[NSDictionary class]])) return;
	ModalProxy * result = [[ModalProxy alloc] init];
	if ([isAlertObject boolValue]){
		[result showAlertViewWithDict:modalObject];
	} else {
		[result showActionSheetWithDict:modalObject];
	}
	
	[result release];
}


#pragma mark startModule

- (BOOL) startModule;
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
	[(UiModule *)invocGen setWindow:nil title:nil];
	NSInvocation * setTitleInvoc = [invocGen invocation];

	[(UiModule *)invocGen setWindow:nil titleImage:nil];
	NSInvocation * setTitleImageInvoc = [invocGen invocation];

	[(UiModule *)invocGen openWindow:nil animated:nil];
	NSInvocation * openWinInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen closeWindow:nil animated:nil];
	NSInvocation * closeWinInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil URL:nil baseURL:nil];
	NSInvocation * changeWinUrlInvoc = [invocGen invocation];	

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

	[(UiModule *)invocGen makeButtonToken];
	NSInvocation * buttonTokenGen = [invocGen invocation];


	[(UiModule *)invocGen setAppBadge:nil];
	NSInvocation * appBadgeInvoc = [invocGen invocation];

	[(UiModule *)invocGen setTabBadge:nil];
	NSInvocation * tabBadgeInvoc = [invocGen invocation];

	[(UiModule *)invocGen setStatusBarStyle:nil];
	NSInvocation * statusBarStyleInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil toolbar:nil options:nil];
	NSInvocation * updateToolbarInvoc = [invocGen invocation];

	[(UiModule *)invocGen showModal:nil isAlert:nil];
	NSInvocation * showModalInvoc = [invocGen invocation];

	[(UiModule *)invocGen addWindow:nil nativeView:nil options:nil];
	NSInvocation * insertNativeViewInvoc = [invocGen invocation];
	
	buttonContexts = [[NSMutableDictionary alloc] init];
	
	//NOTE: createWindow doesn't actually create a native-side window. Instead, it simply sets up the dict.
	//The actual actions are performed at open time.
	
	NSString * currentWindowString = @"{"
			"toolbar:{},_EVT:{close:[],unfocused:[],focused:[]},doEvent:Ti._ONEVT,"
			"addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
			"close:function(args){Ti.UI._CLS(Ti._TOKEN,args);},"
			"setTitle:function(args){Ti.UI._WTITLE(Ti._TOKEN,args);},"
			"setBarColor:function(args){Ti.UI._WNAVTNT(Ti._TOKEN,args);},"
			"setURL:function(newUrl){Ti.UI._WURL(Ti._TOKEN,newUrl,document.location);},"
			"setFullscreen:function(newBool){Ti.UI._WFSCN(Ti._TOKEN,newBool);},"
			"setTitle:function(args){Ti.UI._WTITLE(Ti._TOKEN,args);},"
			"showNavBar:function(args){Ti.UI._WSHNAV(Ti._TOKEN,args);},"
			"hideNavBar:function(args){Ti.UI._WHDNAV(Ti._TOKEN,args);},"
			"setTitleImage:function(args){Ti.UI._WTITLEIMG(Ti._TOKEN,args);},"
			"setLeftNavButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WNAVBTN(Ti._TOKEN,true,btn,args);},"
			"setRightNavButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WNAVBTN(Ti._TOKEN,false,btn,args);},"
			"setToolbar:function(bar,args){if(bar){var i=bar.length;while(i>0){i--;bar[i].ensureToken();};};"
				"Ti.UI._WTOOL(Ti._TOKEN,bar,args);},"
			"insertButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WINSBTN(Ti._TOKEN,btn,args);}"
			"}";

	NSString * createWindowString = @"function(args){var res={};"
			"for(property in args){res[property]=args[property];res['_'+property]=args[property];};"
//			"delete res._TOKEN;"
			"res.setURL=function(newUrl){this.url=newUrl;if(this._TOKEN){Ti.UI._WURL(this._TOKEN,newUrl,document.location);};};"
			"res.setFullscreen=function(newBool){this.fullscreen=newBool;if(this._TOKEN){Ti.UI._WFSCN(this._TOKEN,newBool);};};"
			"res.setTitle=function(args){this.title=args;if(this._TOKEN){Ti.UI._WTITLE(this._TOKEN,args);};};"
			"res.showNavBar=function(args){this._hideNavBar=false;if(this._TOKEN){Ti.UI._WSHNAV(this._TOKEN,args);};};"
			"res.hideNavBar=function(args){this._hideNavBar=true;if(this._TOKEN){Ti.UI._WHDNAV(this._TOKEN,args);};};"
			"res.setTitleImage=function(args){this.titleImage=args;if(this._TOKEN){Ti.UI._WTITLEIMG(this._TOKEN,args);};};"
			"res.setBarColor=function(args){this.barColor=args;if(this._TOKEN){Ti.UI._WNAVTNT(this._TOKEN,args);};};"
			"res.setLeftNavButton=function(btn,args){if(btn)btn.ensureToken();this.lNavBtn=btn;if(this._TOKEN){Ti.UI._WNAVBTN(this._TOKEN,true,btn,args);};};"
			"res.setRightNavButton=function(btn,args){if(btn)btn.ensureToken();this.rNavBtn=btn;if(this._TOKEN){Ti.UI._WNAVBTN(this._TOKEN,false,btn,args);};};"
			"res.close=function(args){Ti.UI._CLS(this._TOKEN,args);};"
			"res.open=function(args){"
				"if(this.data){var data=this.data;var i=data.length;while(i>0){i--;var inp=data[i].input;if(inp)inp.ensureToken();}};"
				"if(this._GRP){var grp=this._GRP;var j=grp.length;while(j>0){j--;var data=grp[j].data;var i=data.length;"
					"while(i>0){i--;var inp=data[i].input;if(inp)inp.ensureToken();}"
				"}};"
				"var res=Ti.UI._OPN(this,args);this._TOKEN=res;};"
			"res.setToolbar=function(bar,args){if(bar){var i=bar.length;while(i>0){i--;bar[i].ensureToken();};};"
				"this.toolbar=bar;"
				"if(this._TOKEN){"
					"Ti.UI._WTOOL(this._TOKEN,bar,args);}};"
			"res.insertButton=function(btn,args){if(btn)btn.ensureToken();Ti.UI._WINSBTN(this._TOKEN,btn,args);};"
			"return res;}";

	NSString * createTableWindowString = @"function(args,callback){var res=Ti.UI.createWindow(args);res._TYPE='table';res._WINTKN=Ti._TOKEN;res.onClick=callback;"
			"var tkn='TBL'+(Ti.UI._NEXTTBL++);Ti.UI._TBL[tkn]=res;res._PATH='Ti.UI._TBL.'+tkn;return res;}";	

	NSString * createGroupedViewString = @"function(args,callback){var res=Ti.UI.createTableView(args,callback);res.grouped=true;"
			"res._GRP=[];res.addSection=function(section){this._GRP.push(section);};return res;}";
	
	NSString * createGroupedSectionString = @"function(args){var res={header:null};for(prop in args){res[prop]=args[prop]};"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;res.onClick=Ti.ONEVT;return res;}";

	NSString * systemButtonStyleString = [NSString stringWithFormat:@"{PLAIN:%d,BORDERED:%d,DONE:%d}",
										  UIBarButtonItemStylePlain,UIBarButtonItemStyleBordered,UIBarButtonItemStyleDone];
	NSString * systemIconString = @"{BOOKMARKS:'ti:bookmarks',CONTACTS:'ti:contacts',DOWNLOADS:'ti:downloads',"
			"FAVORITES:'ti:favorites',DOWNLOADS:'ti:downloads',FEATURED:'ti:featured',MORE:'ti:more',MOST_RECENT:'ti:most_recent',"
			"MOST_VIEWED:'ti:most_viewed',RECENTS:'ti:recents',SEARCH:'ti:search',TOP_RATED:'ti:top_rated'}";
	NSString * systemButtonString = @"{ACTION:'action',ACTIVITY:'activity',CAMERA:'camera',COMPOSE:'compose',BOOKMARKS:'bookmarks',"
			"SEARCH:'search',ADD:'add',TRASH:'trash',ORGANIZE:'organize',REPLY:'reply',STOP:'stop',REFRESH:'refresh',"
			"PLAY:'play',FAST_FORWARD:'fastforward',PAUSE:'pause',REWIND:'rewind',EDIT:'edit',CANCEL:'cancel',"
			"SAVE:'save',DONE:'done',FLEXIBLE_SPACE:'flexiblespace',FIXED_SPACE:'fixedspace'}";
	NSString * statusBarString = [NSString stringWithFormat:@"{GREY:%d,DEFAULT:%d,OPAQUE_BLACK:%d,TRANSLUCENT_BLACK:%d}",
								  UIStatusBarStyleDefault,UIStatusBarStyleDefault,UIStatusBarStyleBlackOpaque,UIStatusBarStyleBlackTranslucent];
	
	NSString * createButtonString = @"function(args,buttonType){var res={"
			"onClick:Ti._ONEVT,_EVT:{click:[],change:[]},addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
			"ensureToken:function(){if(this._TOKEN)return;var tkn=Ti.UI._BTNTKN();this._TOKEN=tkn;Ti.UI._BTN[tkn]=this;},"
			"setDiv:function(div){this.div=div;divObj=document.getElementById(div);this.divObj=divObj;divAttr={};this.divAttr=divAttr;if(!divObj)return;"
//				"var attr=divObj.attributes;if(attr){var i=attr.length;while(i>0){i--;divAttr[attr[i].name]=attr[i].value;}};"
				"divAttr.y=0;divAttr.x=0;divAttr.width=divObj.offsetWidth;divAttr.height=divObj.offsetHeight;"
				"while(divObj){divAttr.x+=divObj.offsetLeft;divAttr.y+=divObj.offsetTop;divObj=divObj.offsetParent;}"
			"}};"
			"if(args){for(prop in args){res[prop]=args[prop];}};"
			"if(buttonType)res.systemButton=buttonType;"
			"if(res.div){res.setDiv(res.div);Ti.UI.currentWindow.insertButton(res);}"
			"return res;}";

	NSString * createOptionDialogString = @"function(args){var res={};for(prop in args){res[prop]=args[prop];};"
			"res._TOKEN='MDL'+(Ti.UI._NEXTMODAL++);Ti.UI._MODAL[res._TOKEN]=res;res.onClick=Ti._ONEVT;"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setOptions=function(args){this.options=args;};"
			"res.setTitle=function(args){this.title=args;};"
			"res.setDestructive=function(args){this.destructive=args;};"
			"res.setCancel=function(args){this.cancel=args;};"
			"res.show=function(){Ti.UI._MSHOW(this,false)};"
			"return res;}";
	TitaniumJSCode * createAlertCode = [TitaniumJSCode codeWithString:
			@"function(args){var res={};for(prop in args){res[prop]=args[prop];};"
			"res._TOKEN='MDL'+(Ti.UI._NEXTMODAL++);Ti.UI._MODAL[res._TOKEN]=res;res.onClick=Ti._ONEVT;"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setButtonNames=function(args){this.options=args;};"
			"res.setTitle=function(args){this.title=args;};"
			"res.setMessage=function(args){this.message=args;};"
			"res.show=function(){Ti.UI._MSHOW(this,true)};"
			"return res;}"];
	[createAlertCode setEpilogueCode:@"window.alert=function(args){Ti.API.log('alert',args);};"];

	NSDictionary * uiDict = [NSDictionary dictionaryWithObjectsAndKeys:
			closeWinInvoc,@"_CLS",
			openWinInvoc,@"_OPN",
			changeWinUrlInvoc,@"_WURL",
			changeWinFullScreenInvoc,@"_WFSCN",
			showNavBarInvoc,@"_WSHNAV",
			hideNavBarInvoc,@"_WHDNAV",
			setTitleInvoc,@"_WTITLE",
			setTitleImageInvoc,@"_WTITLEIMG",
			changeWinNavColorInvoc,@"_WNAVTNT",
			setNavButtonInvoc,@"_WNAVBTN",
			updateToolbarInvoc,@"_WTOOL",
			insertNativeViewInvoc,@"_WINSBTN",
			
			buttonContexts, @"_BTN",
			buttonTokenGen,@"_BTNTKN",
			[TitaniumJSCode codeWithString:iPhoneBarButtonGeneratorFunction],@"_BTNGEN",
			[TitaniumJSCode codeWithString:createButtonString],@"createButton",

			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'switch');}"],@"createSwitch",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'slider');}"],@"createSlider",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'text');}"],@"createTextField",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'textarea');}"],@"createTextArea",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'multibutton');}"],@"createButtonBar",

			[TitaniumJSCode codeWithString:@"{}"],@"_MODAL",
			[NSNumber numberWithInt:1],@"_NEXTMODAL",
			showModalInvoc,@"_MSHOW",
			[TitaniumJSCode codeWithString:createOptionDialogString],@"createOptionDialog",
			createAlertCode,@"createAlertDialog",
			
			appBadgeInvoc,@"setAppBadge",
			tabBadgeInvoc,@"setTabBadge",

			[TitaniumJSCode codeWithString:@"{}"],@"_TBL",
			[NSNumber numberWithInt:1],@"_NEXTTBL",
			[TitaniumJSCode codeWithString:currentWindowString],@"currentWindow",
			[TitaniumJSCode codeWithString:createWindowString],@"createWindow",
			[TitaniumJSCode codeWithString:createTableWindowString],@"createTableView",
			
			[NSNumber numberWithInt:TitaniumViewControllerPortrait],@"PORTRAIT",
			[NSNumber numberWithInt:TitaniumViewControllerLandscape],@"LANDSCAPE",
			[NSNumber numberWithInt:TitaniumViewControllerLandscapeOrPortrait],@"PORTRAIT_AND_LANDSCAPE",


			[NSDictionary dictionaryWithObjectsAndKeys:
					[TitaniumJSCode codeWithString:createGroupedViewString],@"createGroupedView",
					[TitaniumJSCode codeWithString:createGroupedSectionString],@"createGroupedSection",
					statusBarStyleInvoc,@"setStatusBarStyle",
					[TitaniumJSCode codeWithString:systemButtonStyleString],@"SystemButtonStyle",
					[TitaniumJSCode codeWithString:systemButtonString],@"SystemButton",
					[TitaniumJSCode codeWithString:systemIconString],@"SystemIcon",
					[TitaniumJSCode codeWithString:statusBarString],@"StatusBar",
					nil],@"iPhone",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:uiDict forKey:@"UI"];
	
	return YES;
}

- (void) dealloc
{
//	[virtualWindowsDict release];
	[buttonContexts release];
	[super dealloc];
}


@end

#endif