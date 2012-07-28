/*
 * Copyright 2010 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* MODIFICATIONS:
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/*
 * Notes: Based originally on this file from Facebook Android SDK's "FBSimple" 
 * example app:
 * https://github.com/facebook/facebook-android-sdk/blob/ac14a5fe46e477d5503c95cea1c6db1c6d3e51cc/examples/simple/src/com/facebook/android/SessionStore.java
 * Our modifications:
 * - Also store the UID and APPID
 * - Add method getSavedAppid
 * - First param to methods is instance of our FacebookModule instead of Facebook
 */
package ti.modules.titanium.facebook;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

public class SessionStore {
    
    private static final String TOKEN = "FBAccessToken";
    private static final String EXPIRES = "FBSessionExpires";
    private static final String UID = "FBUserId";
    private static final String APPID = "FBAppId";
    private static final String KEY = "facebook-session";
    
    public static boolean save(FacebookModule fbmod, Context context) {
        Editor editor =
            context.getSharedPreferences(KEY, Context.MODE_PRIVATE).edit();
        editor.putString(TOKEN, fbmod.facebook.getAccessToken());
        editor.putLong(EXPIRES, fbmod.facebook.getAccessExpires());
        editor.putString(UID, fbmod.uid);
        editor.putString(APPID, fbmod.getAppid());
        return editor.commit();
    }

    public static boolean restore(FacebookModule fbmod, Context context) {
        SharedPreferences savedSession =
            context.getSharedPreferences(KEY, Context.MODE_PRIVATE);
        fbmod.facebook.setAccessToken(savedSession.getString(TOKEN, null));
        fbmod.facebook.setAccessExpires(savedSession.getLong(EXPIRES, 0));
        fbmod.uid = savedSession.getString(UID, null);
        fbmod.setAppid(savedSession.getString(APPID, null));
        return fbmod.facebook.isSessionValid();
    }

    public static void clear(Context context) {
        Editor editor = 
            context.getSharedPreferences(KEY, Context.MODE_PRIVATE).edit();
        editor.clear();
        editor.commit();
    }
    
    public static String getSavedAppId(Context context) {
    	SharedPreferences savedSession =
            context.getSharedPreferences(KEY, Context.MODE_PRIVATE);
    	return savedSession.getString(APPID, null);
    }
    
}
