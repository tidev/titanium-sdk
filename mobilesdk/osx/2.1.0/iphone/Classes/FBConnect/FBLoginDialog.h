/*
 * Copyright 2010 Facebook
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifdef USE_TI_FACEBOOK
#import "FBDialog.h"

@protocol FBLoginDialogDelegate2;

/**
 * Do not use this interface directly, instead, use authorize in Facebook.h
 *
 * Facebook Login Dialog interface for start the facebook webView login dialog.
 * It start pop-ups prompting for credentials and permissions.
 */

@interface FBLoginDialog2 : FBDialog2 {
  id<FBLoginDialogDelegate2> _loginDelegate;
}

-(id) initWithURL:(NSString *) loginURL 
      loginParams:(NSMutableDictionary *) params 
      delegate:(id <FBLoginDialogDelegate2>) delegate;
@end

///////////////////////////////////////////////////////////////////////////////////////////////////

@protocol FBLoginDialogDelegate2 <NSObject> 

- (void) fbDialogLogin:(NSString *) token expirationDate:(NSDate *) expirationDate;

- (void) fbDialogNotLogin:(BOOL) cancelled;

@end
#endif
