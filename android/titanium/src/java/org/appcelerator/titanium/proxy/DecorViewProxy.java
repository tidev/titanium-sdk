/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
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
import android.content.res.Configuration;
import android.os.Build;
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
		// Note: Android 16 (API 36) ignores fixed orientation on large screens (>600dp) for apps targeting API 36.
		try {
			if (Build.VERSION.SDK_INT >= 36 && isFixedOrientation(activityOrientationMode)) {
				Configuration config = activity.getResources().getConfiguration();
				int smallestScreenWidthDp = config.smallestScreenWidthDp;
				if (smallestScreenWidthDp > 600) {
					Log.w(TAG, "Fixed orientation is not supported on large screens (smallest width: "
						+ smallestScreenWidthDp + "dp). Orientation request will be ignored on Android 16+.");
				}
			}
			activity.setRequestedOrientation(activityOrientationMode);
		} catch (Exception ex) {
			Log.e(TAG, ex.getMessage());
		}
	}

	/**
	 * Checks if the given orientation mode locks to a single orientation (not sensor/user/unspecified).
	 * Used to detect orientation restrictions on Android 16+ large screen devices.
	 */
	private boolean isFixedOrientation(int orientationMode)
	{
		return orientationMode == ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
			|| orientationMode == ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
			|| orientationMode == ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
			|| orientationMode == ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
			|| orientationMode == ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
			|| orientationMode == ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
			|| orientationMode == ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT
			|| orientationMode == ActivityInfo.SCREEN_ORIENTATION_USER_LANDSCAPE;
	}

	@Kroll.method
	public int[] getOrientationModes()
	{
		return orientationModes;
	}
}
