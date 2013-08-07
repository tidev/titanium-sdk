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

@synthesize tab = tab;
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
    [self forgetProxy:openAnimation];
    RELEASE_TO_NIL(openAnimation);
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
    [self forgetProxy:closeAnimation];
    RELEASE_TO_NIL(closeAnimation);
    tab = nil;
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
    
    isModal = [self argOrWindowProperty:@"modal" args:args];
    
    if (!isModal) {
        openAnimation = [[TiAnimation animationFromArg:args context:[self pageContext] create:NO] retain];
        [self rememberProxy:openAnimation];
    }
    //Lets keep ourselves safe
    [self rememberSelf];
    
    //TODO Argument Processing
    id object = [self valueForUndefinedKey:@"orientationModes"];
    _supportedOrientations = [TiUtils TiOrientationFlagsFromObject:object];
    
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
    closeAnimation = [[TiAnimation animationFromArg:args context:[self pageContext] create:NO] retain];
    [self rememberProxy:closeAnimation];

    //GO ahead and call close on UI thread
    TiThreadPerformOnMainThread(^{
        [self closeOnUIThread:args];
    }, YES);
    
}

-(BOOL)_handleOpen:(id)args
{
    TiRootControllerNeue* theController = [[TiApp app] neueController];
    if (isModal || (tab != nil)) {
        [self forgetProxy:openAnimation];
        RELEASE_TO_NIL(openAnimation);
    }
    
    if ( (tab == nil) && (isModal == NO) && ([theController topPresentedController] != [theController topContainerController]) ){
        DebugLog(@"[WARN] The top View controller is not a container controller. This window will open behind the presented controller.")
        [self forgetProxy:openAnimation];
        RELEASE_TO_NIL(openAnimation);
    }
    
    return YES;
}

-(BOOL)_handleClose:(id)args
{
    TiRootControllerNeue* theController = [[TiApp app] neueController];
    if (isModal || (tab != nil)) {
        [self forgetProxy:closeAnimation];
        RELEASE_TO_NIL(closeAnimation);
    }
    if ( (tab == nil) && (isModal == NO) && ([theController topPresentedController] != [theController topContainerController]) ){
        DebugLog(@"[WARN] The top View controller is not a container controller. This window will open behind the presented controller.")
        [self forgetProxy:closeAnimation];
        RELEASE_TO_NIL(closeAnimation);
    }
    return YES;
}

-(BOOL)opening
{
    return opening;
}

-(BOOL)closing
{
    return closing;
}

-(BOOL)isModal
{
    return isModal;
}

-(BOOL)handleFocusEvents
{
	return YES;
}

-(void)gainFocus
{
    if (focussed == NO) {
        focussed = YES;
        if ([self handleFocusEvents]) {
            if ([self _hasListeners:@"focus"]) {
                [self fireEvent:@"focus" withObject:nil withSource:self propagate:NO reportSuccess:NO errorCode:0 message:nil];
            }
        }
    }
}

-(void)resignFocus
{
    if (focussed == YES) {
        focussed = NO;
        if ([self handleFocusEvents]) {
            if ([self _hasListeners:@"blur"]) {
                [self fireEvent:@"blur" withObject:nil withSource:self propagate:NO reportSuccess:NO errorCode:0 message:nil];
            }
        }
    }
}

-(UIViewController*)initController;
{
    if (controller == nil) {
        controller = [[[TiViewControllerNeue alloc] initWithViewProxy:self] retain];
    }
    return controller;
}

#pragma mark - Private Methods
-(void)openOnUIThread:(NSArray*)args
{
    if ([self _handleOpen:args]) {
        [self view];
        if (isModal) {
            UIViewController* theController = [self initController];
            [self windowWillOpen];
            NSDictionary *dict = [args count] > 0 ? [args objectAtIndex:0] : nil;
            int style = [TiUtils intValue:@"modalTransitionStyle" properties:dict def:-1];
            if (style == -1) {
                [theController setModalTransitionStyle:style];
            }
            style = [TiUtils intValue:@"modalStyle" properties:dict def:-1];
            if (style != -1) {
				// modal transition style page curl must be done only in fullscreen
				// so only allow if not page curl
				if ([theController modalTransitionStyle]!=UIModalTransitionStylePartialCurl)
				{
					[theController setModalPresentationStyle:style];
				}
            }
            BOOL animated = [TiUtils boolValue:@"animated" properties:dict def:YES];
            [[TiApp app] showModalController:theController animated:animated];
            [self windowDidOpen];
        } else {
            [self windowWillOpen];
            if ((openAnimation == nil) || (![openAnimation isTransitionAnimation])){
                [self attachViewToTopContainerController];
            }
            if (openAnimation != nil) {
                [openAnimation setDelegate:self];
                [openAnimation animate:self];
            } else {
                [self windowDidOpen];
            }
        }
    } else {
        DebugLog(@"[WARN] OPEN ABORTED. _handleOpen returned NO");
        opening = NO;
        opened = NO;
        [self forgetProxy:openAnimation];
        RELEASE_TO_NIL(openAnimation);
    }
}

-(void)closeOnUIThread:(NSArray *)args
{
    if ([self _handleClose:args]) {
        if (isModal) {
            [self windowWillClose];
            NSDictionary *dict = [args count] > 0 ? [args objectAtIndex:0] : nil;
            BOOL animated = [TiUtils boolValue:@"animated" properties:dict def:YES];
            [[TiApp app] hideModalController:controller animated:animated];
            [self windowDidClose];
        } else {
            [self windowWillClose];
            if (closeAnimation != nil) {
                [closeAnimation setDelegate:self];
                [closeAnimation animate:self];
            } else {
                [self windowDidClose];
            }
        }
        
    } else {
        DebugLog(@"[WARN] CLOSE ABORTED. _handleClose returned NO");
        closing = NO;
        RELEASE_TO_NIL(closeAnimation);
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
    if (controller != nil) {
        [self resignFocus];
    }
}
-(void)viewDidAppear:(BOOL)animated
{
    if (controller != nil) {
        [self gainFocus];
    }
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


#pragma mark - TiAnimation Delegate Methods
-(BOOL)animationShouldTransition:(TiAnimation *)sender
{
    BOOL isOpenAnimation = NO;
    UIView* hostingView = nil;
    if (sender == openAnimation) {
        hostingView = [[[[TiApp app] neueController] topContainerController] view];
        isOpenAnimation = YES;
    } else {
        hostingView = [[self view] superview];
    }
    
    void (^animation)(void) = ^{
        if (isOpenAnimation) {
            RELEASE_TO_NIL(animatedOver);
            NSArray* subviews = [hostingView subviews];
            if ([subviews count] > 0) {
                animatedOver = [[subviews lastObject] retain];
            }
            if (animatedOver != nil) {
                [animatedOver removeFromSuperview];
            }
            [hostingView addSubview:[self view]];
        }
        else
        {
            [[self view] removeFromSuperview];
        }
    };

    [UIView transitionWithView:hostingView
                      duration:[(TiAnimation*)sender animationDuration]
                       options:[[(TiAnimation*)sender transition] intValue]
                    animations:animation
                    completion:^(BOOL finished) {
                        [sender animationCompleted:[NSString stringWithFormat:@"%@",hostingView]
                                          finished:[NSNumber numberWithBool:finished]
                                           context:sender];
                    }
     ];

    return NO;
}

-(void)animationDidComplete:(TiAnimation *)sender
{
    if (sender == openAnimation) {
        if (animatedOver != nil) {
            if ([animatedOver isKindOfClass:[TiUIView class]]) {
                TiViewProxy* theProxy = (TiViewProxy*)[(TiUIView*)animatedOver proxy];
                if ([theProxy viewAttached]) {
                    [[[self view] superview] insertSubview:animatedOver belowSubview:[self view]];
                    LayoutConstraint* layoutProps = [theProxy layoutProperties];
                    ApplyConstraintToViewWithBounds(layoutProps, (TiUIView*)animatedOver, [[animatedOver superview] bounds]);
                    [theProxy layoutChildren:NO];
                    RELEASE_TO_NIL(animatedOver);
                }
            } else {
                [[[self view] superview] insertSubview:animatedOver belowSubview:[self view]];
            }
        }
        [self windowDidOpen];
    } else {
        [self windowDidClose];
    }
}

@end
