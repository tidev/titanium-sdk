/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIEmailDialogProxy.h"
#import "TiUtils.h"
#import "TiBlob.h"
#import "TiColor.h"
#import "TitaniumApp.h"

@implementation TiUIEmailDialogProxy

- (void) dealloc
{
	RELEASE_TO_NIL(attachments);
	[super dealloc];
}

-(void)_destroy
{
	RELEASE_TO_NIL(attachments);
	[super _destroy];
}

-(NSArray *)attachments
{
	return [[attachments copy] autorelease];
}

-(void)setAttachments:(NSArray *)newAttachments
{
	ENSURE_TYPE_OR_NIL(newAttachments,NSArray);
	[attachments autorelease];
	attachments = [newAttachments mutableCopy];
}

-(void)addAttachment:(id)ourAttachment;
{
	ENSURE_SINGLE_ARG_OR_NIL(ourAttachment,TiBlob);
	if (attachments == nil)
	{
		attachments = [[NSMutableArray alloc] initWithObjects:ourAttachment,nil];
	}
	else
	{
		[attachments addObject:ourAttachment];
	}
}


- (void)open:(id)args
{
	ENSURE_TYPE_OR_NIL(args,NSDictionary);
	Class arrayClass = [NSArray class];
	NSArray * toArray = [self valueForKey:@"toRecipients"];
	ENSURE_CLASS_OR_NIL(toArray,arrayClass);
	NSArray * bccArray = [self valueForKey:@"bccRecipients"];
	ENSURE_CLASS_OR_NIL(bccArray,arrayClass);
	NSArray * ccArray = [self valueForKey:@"ccRecipients"];
	ENSURE_CLASS_OR_NIL(ccArray,arrayClass);

	ENSURE_UI_THREAD(open,args);
	NSString * subject = [TiUtils stringValue:[self valueForKey:@"subject"]];
	NSString * message = [TiUtils stringValue:[self valueForKey:@"messageBody"]];

	if (![MFMailComposeViewController canSendMail])
	{
		//TODO: What to do? Throw an exception or call a similar nsurl?
		return;
	}

	UIColor * barColor = [[TiUtils colorValue:[self valueForKey:@"barColor"]] _color];
	
	MFMailComposeViewController * composer = [[MFMailComposeViewController alloc] init];
	[composer setMailComposeDelegate:self];
	if (barColor != nil)
	{
		[[composer navigationBar] setTintColor:barColor];
	}

	[composer setSubject:subject];
	[composer setToRecipients:toArray];
	[composer setBccRecipients:bccArray];
	[composer setCcRecipients:ccArray];
	[composer setMessageBody:message isHTML:NO];
	if(attachments != nil)
	{
		for (TiBlob * thisAttachment in attachments)
		{
			[composer addAttachmentData:[thisAttachment data]
									mimeType:[thisAttachment mimeType]
									fileName:[[thisAttachment path] lastPathComponent]];
		}
	}

	UIViewController *controller = [[TitaniumApp app] controller];
	
	BOOL animated = [TiUtils boolValue:[self valueForKey:@"animated"] def:YES];
	[controller presentModalViewController:composer animated:animated];
}

- (void)mailComposeController:(MFMailComposeViewController *)composer didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error;
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
	
	//TODO: Now what?
	
	BOOL animated = [TiUtils boolValue:[self valueForKey:@"animated"] def:YES];

	UIViewController *controller = [[TitaniumApp app] controller];
	
	ENSURE_CONSISTENCY(composer == [controller modalViewController]);

	[[[TitaniumApp app] controller] dismissModalViewControllerAnimated:animated];
	[composer autorelease];
}

@end
