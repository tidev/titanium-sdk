/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.LocalActivityManager;
import android.content.Intent;
import android.view.Window;

@Kroll.proxy(creatableInModule=MapModule.class)
public class ViewProxy extends TiViewProxy
	implements OnLifecycleEvent
{

	private static LocalActivityManager lam;
	private static Window mapWindow;
	
	/*
	 * Track whether the map activity has been destroyed (or told to destroy).
	 * Only one map activity may run, so we're tracking its life here.
	 */
	private boolean destroyed = false;

	public ViewProxy(TiContext tiContext) {
		super(tiContext);

		tiContext.addOnEventChangeListener(this);
		tiContext.addOnLifecycleEventListener(this);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		destroyed = false;
		if (lam == null) {
			lam = new LocalActivityManager(getTiContext().getRootActivity(), true);
			lam.dispatchCreate(null);
		}

		if (mapWindow != null) {
			throw new IllegalStateException("MapView already created. Android can support one MapView per Application.");
		}

		TiApplication tiApp = getTiContext().getTiApp();
		Intent intent = new Intent(tiApp, TiMapActivity.class);
		mapWindow = lam.startActivity("TIMAP", intent);
		lam.dispatchResume();
		return new TiMapView(this, mapWindow);
	}

	@Kroll.method
	public void zoom(int delta) {
		TiMapView mv = (TiMapView) view;
		if (mv != null) {
			mv.changeZoomLevel(delta);
		}
	}

	@Kroll.method
	public void removeAllAnnotations()
	{
		TiMapView mv = (TiMapView) view;
		if (mv != null) {
			mv.removeAllAnnotations();
		}
	}

	@Kroll.method
	public void addAnnotation(AnnotationProxy annotation)
	{
		TiMapView mv = (TiMapView) view;
		mv.addAnnotation(annotation);
	}

	@Kroll.method
	public void removeAnnotation(Object arg)
	{
		String title = null;

		if (arg != null) {
			if (arg instanceof AnnotationProxy) {
				title = TiConvert.toString(((AnnotationProxy) arg).getProperty("title"));
			} else {
				title = TiConvert.toString(arg);
			}

			if (title != null) {
				TiMapView mv = (TiMapView) view;
				if (mv != null) {
					mv.removeAnnotation(title);
				}
			}
		}
	}

	@Kroll.method
	public void selectAnnotation(Object[] args)
	{
		String title = null;

		if (args.length > 0) {
			if (args[0] instanceof AnnotationProxy) {
				title = TiConvert.toString(((AnnotationProxy) args[0]).getProperty("title"));
			} else if (args[0] instanceof String) {
				title = TiConvert.toString(args[0]);
			}
		}
		if (title != null) {
			boolean animate = false;

			if (args.length > 1) {
				animate = TiConvert.toBoolean(args[1]);
			}

			TiMapView mv = (TiMapView) view;
			if (mv != null) {
				mv.selectAnnotation(true, title, animate);
			}
		}
	}

	public void onDestroy() {
		if (lam != null && !destroyed) {
			destroyed = true;
			lam.dispatchDestroy(true);
			lam.destroyActivity("TIMAP", true);
		}
		mapWindow = null;
	}

	public void onPause() {
		if (lam != null) {
			lam.dispatchPause(false);
		}
	}

	public void onResume() {
		if (lam != null) {
			lam.dispatchResume();
		}
	}

	public void onStart() {
	}

	public void onStop() {
		if (lam != null) {
			lam.dispatchStop();
		}
	}

	@Override
	public void releaseViews()
	{
		super.releaseViews();
		onDestroy(); 
	}
}
