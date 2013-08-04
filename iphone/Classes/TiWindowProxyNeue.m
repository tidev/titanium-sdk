//
//  TiWindowProxyNeue.m
//  Titanium
//
//  Created by Vishal Duggal on 7/30/13.
//
//

#import "TiWindowProxyNeue.h"
#import "TiUIWindow.h"
#import "TiApp.h"
#import "TiErrorController.h"

@interface TiWindowProxyNeue(Private)
-(void)openOnUIThread:(id)args;
-(void)closeOnUIThread:(id)args;
@end

@implementation TiWindowProxyNeue

-(void) dealloc {
    [super dealloc];
}

-(void)_destroy {
    [super _destroy];
}

-(void)_configure
{
    [self replaceValue:nil forKey:@"orientationModes" notification:NO];
    [super _configure];
}


-(TiUIView*)newView
{
	CGRect frame = [self appFrame];
	TiUIWindow * win = [[TiUIWindow alloc] initWithFrame:frame];
	return win;
}

#pragma mark - Utility Methods
-(void)windowWillOpen
{
    [super windowWillOpen];
    [self parentWillShow];
    [[[[TiApp app] neueController] topContainerController] willOpenWindow:self];
}

-(void)windowDidOpen
{
    opening = NO;
    opened = YES;
    [super windowDidOpen];
    [[[[TiApp app] neueController] topContainerController] didOpenWindow:self];
}

-(void) windowWillClose
{
    [[[[TiApp app] neueController] topContainerController] willCloseWindow:self];
    [super windowWillClose];
}

-(void) windowDidClose
{
    opened = NO;
    closing = NO;
    [[[[TiApp app] neueController] topContainerController] didCloseWindow:self];
    [super windowDidClose];
}

-(void)attachViewToTopContainerController
{
    UIViewController<TiControllerContainment>* topContainerController = [[[TiApp app] neueController] topContainerController];
    UIView *rootView = [topContainerController view];
    TiUIView* theView = [self view];
    [rootView addSubview:theView];
    [rootView bringSubviewToFront:theView];
}

-(BOOL)argOrWindowProperty:(NSString*)key args:(id)args
{
    if ([TiUtils boolValue:[self valueForUndefinedKey:key]]) {
        return YES;
    }
    if (args!=nil && [args count] > 0 && [[args objectAtIndex:0] isKindOfClass:[NSDictionary class]]) {
        return [TiUtils boolValue:key properties:[args objectAtIndex:0] def:NO];
    }
    return NO;
}

-(BOOL)isModal:(id)args
{
    return [self argOrWindowProperty:@"modal" args:args];
}

-(BOOL)isFullscreen:(id)args
{
    return [self argOrWindowProperty:@"fullscreen" args:args];
}

-(BOOL)isRootViewLoaded
{
    return [[[TiApp app] neueController] isViewLoaded];
}

-(BOOL)isRootViewAttached
{
    return ([[[[TiApp app] neueController] view] superview]!=nil);
}

#pragma mark - TiWindowProtocol Base Methods
-(void)open:(id)args
{
    //Make sure our RootView Controller is attached
    if (![self isRootViewLoaded]) {
        DebugLog(@"[WARN] ROOT VIEW NOT LOADED. WAITING");
        [self performSelector:@selector(open:) withObject:args afterDelay:0.1];
        return;
    }
    if (![self isRootViewAttached]) {
        DebugLog(@"[WARN] ROOT VIEW NOT ATTACHED. WAITING");
        [self performSelector:@selector(open:) withObject:args afterDelay:0.1];
        return;
    }
    
    //If an error is up, Go away
    if ([[[[TiApp app] neueController] topPresentedController] isKindOfClass:[TiErrorController class]]) {
        return;
    }
    
    //I am already open or will be soon. Go Away
    if (opening || opened) {
        return;
    }
    
    opening = YES;
    //Lets keep ourselves safe
    [self rememberSelf];
    
    //TODO Argument Processing
    
    
    //GO ahead and call open on the UI thread
    TiThreadPerformOnMainThread(^{
        [self openOnUIThread:args];
    }, YES);
    
}

-(void)close:(id)args
{
    //I am not open. Go Away
    if (opening) {
        DebugLog(@"Window is opening. Ignoring this close call");
        return;
    }
    
    if (!opened) {
        DebugLog(@"Window is not open. Ignoring this close call");
        return;
    }
    
    if (closing) {
        DebugLog(@"Window is already closing. Ignoring this close call.");
        return;
    }
    closing = YES;
    //TODO Argument Processing
    
    //GO ahead and call close on UI thread
    TiThreadPerformOnMainThread(^{
        [self closeOnUIThread:args];
    }, YES);
    
}

-(BOOL)_handleOpen:(id)args
{
    TiRootControllerNeue* theController = [[TiApp app] neueController];
    if ([theController topPresentedController] != [theController topContainerController]) {
        DebugLog(@"[WARN] The top View controller is not a container controller. This window will open behind the presented controller.")
    }
    
    id object = [self valueForUndefinedKey:@"orientationModes"];
    _supportedOrientations = [TiUtils TiOrientationFlagsFromObject:object];

    return YES;
}

-(BOOL)_handleClose:(id)args
{
    return YES;
}


#pragma mark - Private Methods
-(void)openOnUIThread:(NSArray*)args
{
    if ([self _handleOpen:args]) {
        [self view];
        [self windowWillOpen];
        [self attachViewToTopContainerController];
        [self windowDidOpen];
    } else {
        DebugLog(@"[WARN] OPEN ABORTED. _handleOpen returned NO");
    }
}

-(void)closeOnUIThread:(NSArray *)args
{
    if ([self _handleClose:args]) {
        [self windowWillClose];
        [self windowDidClose];
        
    } else {
        DebugLog(@"[WARN] CLOSE ABORTED. _handleClose returned NO");
    }
}

#pragma mark - TiOrientationController
-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;
{
    [parentController childOrientationControllerChangedFlags:self];
}

-(void)setParentOrientationController:(id <TiOrientationController>)newParent
{
    parentController = newParent;
}

-(id)parentOrientationController
{
	return parentController;
}

-(TiOrientationFlags) orientationFlags
{
    return _supportedOrientations;
}

#pragma mark - Appearance and Rotation Callbacks. For subclasses to override.
//Containing controller will call these callbacks(appearance/rotation) on contained windows when it receives them.
-(void)viewWillAppear:(BOOL)animated
{
    
}
-(void)viewWillDisappear:(BOOL)animated
{
    
}
-(void)viewDidAppear:(BOOL)animated
{
    
}
-(void)viewDidDisappear:(BOOL)animated
{
    
}
-(void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    
}
-(void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    
}
-(void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    
}


@end
