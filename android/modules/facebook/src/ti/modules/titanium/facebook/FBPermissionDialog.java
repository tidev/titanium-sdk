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

import android.app.Activity;

public class FBPermissionDialog extends FBDialog {

    private static final String PERMISSION_URL = "http://www.facebook.com/connect/prompt_permissions.php";

    private String[] mPermissions;

    public FBPermissionDialog(Activity context, FBSession session, String[] permissions) {
        super(context, session);
        mPermissions = permissions;
    }

    private void loadExtendedPermissionPage() {
        Map<String, String> params = new HashMap<String, String>();
        params.put("fbconnect", "1");
        params.put("connect_display", "touch");
        params.put("api_key", mSession.getApiKey());
        params.put("next", "fbconnect://success");
        params.put("cancel", "fbconnect://cancel");

        // Building the comma separated list of permissions
        String permissionList = "";
        int permissionLength = mPermissions.length;
        for (int i = 0; i < permissionLength; i++) {
            permissionList += mPermissions[i] + ((i == (permissionLength - 1)) ? "" : ",");
        }

        params.put("ext_perm", permissionList);

        try {
            loadURL(PERMISSION_URL, "GET", params, null);
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void load() {
        loadExtendedPermissionPage();
    }
}
