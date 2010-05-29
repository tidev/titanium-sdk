/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;


import java.net.MalformedURLException;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.titanium.util.Log;

import android.app.Activity;

/**
 * Dialog for handling permissions
 *
 */
public class FBPermissionDialog extends FBDialog
{
    private static final String LOG = FBPermissionDialog.class.getSimpleName();
    private static final String FB_PERMISSION_URL = "http://www.facebook.com/connect/prompt_permission.php";


    private final String permission;


    /**
     * @param context
     * @param session
     */
    public FBPermissionDialog(Activity context, FBSession session, FacebookModule tb, String permission)
    {
        super(context, session, tb);
        this.permission = permission;
    }

    @Override
    protected void load()
    {
        Map<String, String> params = new HashMap<String, String>();
        params.put("display", "touch");
        params.put("api_key", session.getApiKey());
        params.put("session_key", session.getSessionKey());
        params.put("next", "fbconnect:success");
        params.put("cancel", "fbconnect:cancel");
        params.put("ext_perm", permission);

        try
        {
            loadURL(FB_PERMISSION_URL, "GET", params, null);
        }
        catch (MalformedURLException e)
        {
            Log.e(LOG,"Error loading URL: "+FB_PERMISSION_URL,e);
        }
    }
}
