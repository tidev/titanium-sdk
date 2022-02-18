/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.util.TiDeviceOrientation;
import org.appcelerator.titanium.view.TiUIDecorView;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.view.View;

@Kroll.proxy
public class DecorViewProxy extends TiViewProxy
{
	private static final String TAG = "DecorViewProxy";
	protected View layout;
	protected int[] orientationModes = null;

	public DecorViewProxy(View layout)
	{
		super();
		this.layout = layout;
		this.view = createView(null);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIDecorView(this);
	}

	public View getLayout()
	{
		return layout;
	}

	@Kroll.method
	public int getOrientation()
	{
		return TiDeviceOrientation.fromDefaultDisplay().toTiIntId();
	}

	@Kroll.method
	public void setOrientationModes(int[] modes)
	{
		int activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
		boolean hasPortrait = false;
		boolean hasPortraitReverse = false;
		boolean hasLandscape = false;
		boolean hasLandscapeReverse = false;

		// Store the given orientation modes.
		orientationModes = modes;

		// Fetch the activity to apply orientation modes to.
		Activity activity = getActivity();
		if (activity == null) {
			return;
		}

		// Convert given Titanium orientation modes to an Android orientation identifier.
		if (modes != null) {
			// look through orientation modes and determine what has been set
			for (int i = 0; i < orientationModes.length; i++) {
				int integerId = orientationModes[i];
				TiDeviceOrientation orientation = TiDeviceOrientation.fromTiIntId(integerId);
				if (orientation != null) {
					switch (orientation) {
						case PORTRAIT:
							hasPortrait = true;
							break;
						case UPSIDE_PORTRAIT:
							hasPortraitReverse = true;
							break;
						case LANDSCAPE_RIGHT:
							hasLandscape = true;
							break;
						case LANDSCAPE_LEFT:
							hasLandscapeReverse = true;
							break;
						default:
							Log.w(TAG, "'orientationMode' cannot be set to: " + orientation.toTiConstantName());
							break;
					}
				} else {
					Log.w(TAG, "'orientationMode' was given unknown value: " + integerId);
				}
			}

			// determine if we have a valid activity orientation mode based on provided modes list
			if (orientationModes.length == 0) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
			} else if ((hasPortrait || hasPortraitReverse) && (hasLandscape || hasLandscapeReverse)) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
			} else if (hasPortrait && hasPortraitReverse) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;
			} else if (hasLandscape && hasLandscapeReverse) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
			} else if (hasPortrait) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
			} else if (hasPortraitReverse) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT;
			} else if (hasLandscape) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
			} else if (hasLandscapeReverse) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE;
			}
		} else if (activity instanceof TiBaseActivity) {
			activityOrientationMode = ((TiBaseActivity) activity).getOriginalOrientationMode();
		}

		// Attempt to change the activity's orientation setting.
		// Note: A semi-transparent activity cannot be assigned a fixed orientation. Will throw an exception.
		try {
			activity.setRequestedOrientation(activityOrientationMode);
		} catch (Exception ex) {
			Log.e(TAG, ex.getMessage());
		}
	}

	@Kroll.method
	public int[] getOrientationModes()
	{
		return orientationModes;
	}
}
