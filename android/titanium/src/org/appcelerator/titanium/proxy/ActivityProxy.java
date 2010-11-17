/**
 * 
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

public class ActivityProxy 
	extends KrollProxy
{
	private static final String TAG = "ActivityProxy";
	private static boolean DBG = TiConfig.LOGD;
		
	protected Activity activity;
	protected IntentProxy intentProxy;
	
	public ActivityProxy(TiContext tiContext) {
		super(tiContext);
	}
	
	public ActivityProxy(TiContext tiContext, Activity activity) {
		this(tiContext);
		this.activity = activity;
		
		Intent intent = activity.getIntent();
		if (intent != null) {
			intentProxy = new IntentProxy(tiContext, activity.getIntent());
		}
	}
	
	protected Activity getActivity(KrollInvocation invocation) {
		Activity activity = this.activity;
		if (activity != null) return activity;
		
		if (invocation != null) {
			activity = invocation.getTiContext().getActivity();
			if (activity != null) return activity;
		}
		
		activity = getTiContext().getActivity();
		if (activity != null) return activity;
		
		activity = getTiContext().getRootActivity();
		if (activity != null) return activity;
		
		return null;
	}
	
	@Kroll.method
	public void start(KrollInvocation invocation, IntentProxy intentProxy) {
		Intent intent = intentProxy.getIntent();
		Activity activity = getActivity(invocation);
		if (activity != null) {
			activity.startActivity(intent);
		}
	}
	
	@Kroll.method @Kroll.getProperty
	public IntentProxy getIntent() {
		return intentProxy;
	}
	
	public Context getContext() {
		if (activity == null) {
			return getTiContext().getActivity().getApplication();
		}
		return activity;
	}
	
	public Activity getActivity() {
		return activity;
	}
	
	public void release() {
		activity = null;
	}
}
