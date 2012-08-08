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
import org.appcelerator.titanium.util.TiOrientationHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIDecorView;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Build;


@Kroll.proxy
public class DecorViewProxy extends TiViewProxy
{
	private static final String TAG = "DecorViewProxy";
	protected TiCompositeLayout layout;
	protected int[] orientationModes = null;


	public DecorViewProxy(TiCompositeLayout layout)
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


	public TiCompositeLayout getLayout()
	{
		return layout;
	}

	@Kroll.method
	public int getOrientation()
	{
		Activity activity = getActivity();

		if (activity != null)
		{
			return TiOrientationHelper.convertConfigToTiOrientationMode(activity.getResources().getConfiguration().orientation);
		}

		Log.e(TAG, "Unable to get orientation, activity not found for window", Log.DEBUG_MODE);
		return TiOrientationHelper.ORIENTATION_UNKNOWN;
	}

	@Kroll.method
	public void setOrientationModes (int[] modes)
	{
		int activityOrientationMode = -1;
		boolean hasPortrait = false;
		boolean hasPortraitReverse = false;
		boolean hasLandscape = false;
		boolean hasLandscapeReverse = false;

		// update orientation modes that get exposed
		orientationModes = modes;

		if (modes != null)
		{
			// look through orientation modes and determine what has been set
			for (int i = 0; i < orientationModes.length; i++)
			{
				if (orientationModes [i] == TiOrientationHelper.ORIENTATION_PORTRAIT)
				{
					hasPortrait = true;
				}
				else if (orientationModes [i] == TiOrientationHelper.ORIENTATION_PORTRAIT_REVERSE)
				{
					hasPortraitReverse = true;
				}
				else if (orientationModes [i] == TiOrientationHelper.ORIENTATION_LANDSCAPE)
				{
					hasLandscape = true;
				}
				else if (orientationModes [i] == TiOrientationHelper.ORIENTATION_LANDSCAPE_REVERSE)
				{
					hasLandscapeReverse = true;
				}
			}

			// determine if we have a valid activity orientation mode based on provided modes list
			if (orientationModes.length == 0)
			{
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
			}
			else if ((hasPortrait || hasPortraitReverse) && (hasLandscape || hasLandscapeReverse))
			{
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
			}
			else if (hasPortrait && hasPortraitReverse)
			{
				//activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;

				// unable to use constant until sdk lvl 9, use constant value instead
				// if sdk level is less than 9, set as regular portrait
				if (Build.VERSION.SDK_INT >= 9)
				{
					activityOrientationMode = 7;
				}
				else
				{
					activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
				}
			}
			else if (hasLandscape && hasLandscapeReverse)
			{
				//activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;

				// unable to use constant until sdk lvl 9, use constant value instead
				// if sdk level is less than 9, set as regular landscape
				if (Build.VERSION.SDK_INT >= 9)
				{
					activityOrientationMode = 6;
				}
				else
				{
					activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
				}
			}
			else if (hasPortrait)
			{
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
			}
			else if (hasPortraitReverse && Build.VERSION.SDK_INT >= 9)
			{
				activityOrientationMode = 9;
			}
			else if (hasLandscape)
			{
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
			}
			else if (hasLandscapeReverse && Build.VERSION.SDK_INT >= 9)
			{
				activityOrientationMode = 8;
			}

			Activity activity = getActivity();
			if (activity != null)
			{
				if (activityOrientationMode != -1)
				{
					activity.setRequestedOrientation(activityOrientationMode);
				}
				else
				{
					activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
				}
			}
		}
		else
		{
			Activity activity = getActivity();
			if (activity != null)
			{
				if (activity instanceof TiBaseActivity)
				{
					activity.setRequestedOrientation(((TiBaseActivity)activity).getOriginalOrientationMode());
				}
			}
		}
	}

	@Kroll.method
	public int[] getOrientationModes()
	{
		return orientationModes;
	}
}
