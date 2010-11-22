/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.gesture;

import java.lang.ref.WeakReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBaseActivity.ConfigurationChangedListener;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiWeakList;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;

@Kroll.module @ContextSpecific
public class GestureModule extends KrollModule
	implements ConfigurationChangedListener
{
	public static final String EVENT_ONCONFIGCHANGE = "orientationchange";

	protected TiWeakList<TiBaseActivity> activities = new TiWeakList<TiBaseActivity>();

	public GestureModule(TiContext tiContext) {
		super(tiContext);
		eventManager.addOnEventChangeListener(this);
	}

	@Override
	public int addEventListener(KrollInvocation invocation, String eventName, Object listener) {
		if (EVENT_ONCONFIGCHANGE.equals(eventName)) {
			Activity activity = invocation.getTiContext().getActivity();
			if (activity instanceof TiBaseActivity) {
				TiBaseActivity tiActivity = (TiBaseActivity) activity;
				tiActivity.addConfigurationChangedListener(this);
				activities.add(new WeakReference<TiBaseActivity>(tiActivity));
			}
		}
		return super.addEventListener(invocation, eventName, listener);
	}
	
	@Override
	public void removeEventListener(KrollInvocation invocation, String eventName, Object listener) {
		if (EVENT_ONCONFIGCHANGE.equals(eventName) && activities.size() > 0) {
			Activity activity = invocation.getTiContext().getActivity();
			if (activity instanceof TiBaseActivity) {
				TiBaseActivity tiActivity = (TiBaseActivity)activity;
				tiActivity.removeConfigurationChangedListener(this);
				activities.remove(tiActivity);
			}
		}
		super.removeEventListener(invocation, eventName, listener);
	}

	@Override
	public void onConfigurationChanged(TiBaseActivity activity, Configuration newConfig) {
		KrollDict data = new KrollDict();
		data.put("orientation", TiUIHelper.convertToTiOrientation(newConfig.orientation, activity.getOrientationDegrees()));
		fireEvent(EVENT_ONCONFIGCHANGE, data);
	}
	
	protected int doGetOrientation(KrollInvocation invocation) {
		return invocation.getActivity().getResources().getConfiguration().orientation;
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean isPortrait(KrollInvocation invocation) {
		return doGetOrientation(invocation) == Configuration.ORIENTATION_PORTRAIT;
	}

	@Kroll.getProperty @Kroll.method
	public boolean isLandscape(KrollInvocation invocation) {
		return doGetOrientation(invocation) == Configuration.ORIENTATION_LANDSCAPE;
	}

	@Kroll.getProperty @Kroll.method
	public int getOrientation(KrollInvocation invocation) {
		return TiUIHelper.convertToTiOrientation(doGetOrientation(invocation));
	}

	@Override
	public void onResume(Activity activity) {
		super.onResume(activity);
		if (activities.contains(activity)) {
			TiBaseActivity tiActivity = (TiBaseActivity)activity;
			tiActivity.addConfigurationChangedListener(this);
		}
	}

	@Override
	public void onPause(Activity activity) {
		super.onPause(activity);
		if (activities.contains(activity)) {
			TiBaseActivity tiActivity = (TiBaseActivity)activity;
			tiActivity.removeConfigurationChangedListener(this);
		}
	}
}
