/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.facebook;

import java.util.HashMap;
import java.util.Map;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;


public class FBActivity extends Activity 
{
    private static final Map<String,FBActivityDelegate> activities = new HashMap<String,FBActivityDelegate>();
    
    public static void registerActivity(String identifier, FBActivityDelegate activity)
    {
        activities.put(identifier, activity);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) 
    {
        super.onCreate(savedInstanceState);
        
        String action = getIntent().getAction();
        FBActivityDelegate delegate = activities.get(action);
        delegate.forward(action,this);
        
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data)
    {
        super.onActivityResult(requestCode, resultCode, data);
    }
}
