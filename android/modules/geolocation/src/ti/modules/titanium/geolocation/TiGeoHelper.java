/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollMethod;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.util.Log;

import android.app.Activity;

public abstract class TiGeoHelper implements OnLifecycleEvent
{
	private static final String LCAT = "TiGeoHelper";
	protected WeakReference<TiContext> weakContext;
	protected List<KrollMethod> listeners = Collections.synchronizedList( new ArrayList<KrollMethod>() );
	private AtomicInteger eventid = new AtomicInteger(0);
	protected WeakReference<KrollModule> weakProxy;
	
	public enum GeoFeature {DIRECTION, LOCATION}
	
	public TiGeoHelper(TiContext context, KrollModule proxy)
	{
		weakProxy = new WeakReference<KrollModule>(proxy);
		weakContext = new WeakReference<TiContext>(context);
		if (! (context.getActivity() instanceof TiRootActivity)) {
			context.addOnLifecycleEventListener(this);
			// lifecycle listeners in Geolocation module will handle root activity events
		}
	}

	@Override
	public void onStart(Activity activity) {} // not needed

	@Override
	public void onResume(Activity activity)
	{
		Log.d(LCAT, this.getClass().getSimpleName() + " onResume");
		resume();
	}

	@Override
	public void onPause(Activity activity)
	{
		Log.d(LCAT, this.getClass().getSimpleName() + " onPause");
		detach();
	}

	@Override
	public void onStop(Activity activity)
	{
		Log.d(LCAT, this.getClass().getSimpleName() + " onStop");
		detach();
	}

	@Override
	public void onDestroy(Activity activity)
	{
		Log.d(LCAT, this.getClass().getSimpleName() + " onDestroy");
		listeners.clear();
		detach();
	}
	
	public static TiGeoHelper getInstance(TiContext context, KrollModule proxy, GeoFeature feature)
	{
		TiGeoHelper inst;
		if (feature == GeoFeature.DIRECTION)
		{
			inst = new TiCompass(context, proxy);
		} else {
			inst  = new TiLocation(context, proxy);
		}
		return inst;
	}
	
	public static boolean isGeoEvent(String eventName)
	{
		return eventName.equals(TiLocation.EVENT_LOCATION) || eventName.equals(TiCompass.EVENT_HEADING);
	}
	
	public static GeoFeature getFeatureForEvent(String eventName)
	{
		if (eventName.equals(TiCompass.EVENT_HEADING)) {
			return GeoFeature.DIRECTION;
		} else {
			return GeoFeature.LOCATION;
		}
	}
	
	protected int addEventListener(Object listener)
	{
		if (listener == null) {
			return -1;
		}
		if (listener instanceof KrollMethod) {
			listeners.add((KrollMethod)listener);
			attach();
			return eventid.getAndIncrement();
		} else {
			Log.w(LCAT, "Unknown listener type " + listener.getClass().getSimpleName());
			return -1;
		}
	}
	
	protected void removeEventListener(Object listener)
	{
		if (listener == null) {
			return;
		}
		if (listener instanceof KrollMethod) {
			listeners.remove(listener);
			if (listeners.size() == 0) {
				detach();
			}
		} else {
			Log.w(LCAT, "Unknown listener type " + listener.getClass().getSimpleName());
		}
	}
	
	protected boolean hasListeners()
	{
		return listeners.size() > 0;
	}
	
	protected void fireEvent(String eventName, KrollDict data)
	{
		if (data == null || listeners.size() == 0) return;
		KrollModule proxy = weakProxy.get();
		if (proxy != null) {
			if (!data.containsKey("type")) {
				data.put("type", eventName);
			}
			synchronized(listeners) {
				for (KrollMethod listener : listeners) {
					proxy.fireSingleEvent(eventName, listener, data, true);
				}
			}
		}
	}
	
	protected abstract void detach();
	protected abstract void attach();
	protected abstract void resume();
	protected abstract GeoFeature getFeature();
	protected abstract boolean supportsEvent(String eventName);

}
