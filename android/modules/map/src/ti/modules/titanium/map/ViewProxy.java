/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.LocalActivityManager;
import android.content.Intent;
import android.view.Window;

@Kroll.proxy(creatableInModule=MapModule.class, propertyAccessors = {
	TiC.PROPERTY_ANIMATE,
	TiC.PROPERTY_ANNOTATIONS,
	TiC.PROPERTY_MAP_TYPE,
	TiC.PROPERTY_REGION,
	TiC.PROPERTY_REGION_FIT,
	TiC.PROPERTY_USER_LOCATION
})
public class ViewProxy extends TiViewProxy 
	implements OnLifecycleEvent 
{
	private static LocalActivityManager lam;
	private static Window mapWindow;
	private static OnLifecycleEvent rootLifecycleListener;
	private static final String LCAT = "TiMapViewProxy";
	
	/*
	 * Track whether the map activity has been destroyed (or told to destroy).
	 * Only one map activity may run, so we're tracking its life here.
	 */
	private boolean destroyed = false;

	private TiMapView mapView;
	private ArrayList<AnnotationProxy> annotations;
	private ArrayList<TiMapView.SelectedAnnotation> selectedAnnotations;
	
	public ViewProxy() {
		super();

		// TODO ?
		//eventManager.addOnEventChangeListener(this);

		((TiBaseActivity)getActivity()).addOnLifecycleEventListener(this);
		//tiContext.addOnLifecycleEventListener(this);

		annotations = new ArrayList<AnnotationProxy>();
		selectedAnnotations = new ArrayList<TiMapView.SelectedAnnotation>();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		destroyed = false;
		if (lam == null) {
			/*
			TiContext tiContext = getTiContext();
			if (tiContext == null) {
				Log.w(LCAT, "MapView proxy context is no longer valid.  Unable to create MapView.");
				return null;
			}
			*/
			final TiRootActivity rootActivity = TiApplication.getInstance().getRootActivity();
			if (rootActivity == null) {
				Log.w(LCAT, "Application's root activity has been destroyed.  Unable to create MapView.");
				return null;
			}
			/*
			TiContext rootContext = rootActivity.getTiContext();
			if (rootContext == null) {
				Log.w(LCAT, "Application's root context is no longer valid.  Unable to create MapView.");
				return null;
			}
			*/
			// We need to know when root activity destroys, since this lam is
			// based on its context;
			rootLifecycleListener = new OnLifecycleEvent()
			{
				@Override
				public void onStop(Activity activity){}
				@Override
				public void onStart(Activity activity){}
				@Override
				public void onResume(Activity activity){}
				@Override
				public void onPause(Activity activity){}
				@Override
				public void onDestroy(Activity activity)
				{
					if (activity != null && activity.equals(rootActivity)) {
						lam = null;
					}
				}
			};
			TiApplication.getInstance().getRootActivity().addOnLifecycleEventListener(rootLifecycleListener);
			lam = new LocalActivityManager(rootActivity, true);
			lam.dispatchCreate(null);
		}

		if (mapWindow != null) {
			throw new IllegalStateException("MapView already created. Android can support one MapView per Application.");
		}

		TiApplication tiApp = TiApplication.getInstance();
		Intent intent = new Intent(tiApp, TiMapActivity.class);
		mapWindow = lam.startActivity("TIMAP", intent);
		lam.dispatchResume();
		mapView = new TiMapView(this, mapWindow, annotations, selectedAnnotations);

		Object location = getProperty(TiC.PROPERTY_LOCATION);
		if (location != null)
		{
			if(location instanceof KrollDict)
			{
				mapView.doSetLocation((KrollDict) location);
			}
			else
			{
				Log.e(LCAT, "location is set, but the structure is not correct");
			}
		}

		mapView.updateAnnotations();

		return mapView;
	}

	@Kroll.method
	public void zoom(int delta) {
		if (mapView != null) {
			mapView.changeZoomLevel(delta);
		}
	}

	@Kroll.method
	public void removeAllAnnotations()
	{
		annotations.clear();
		if(mapView != null) {
			mapView.updateAnnotations();
		}
	}

	@Kroll.method
	public void addAnnotation(AnnotationProxy annotation)
	{
		annotations.add(annotation);
		if(mapView != null) {
			mapView.updateAnnotations();
		}
	}

	protected int findAnnotation(String title)
	{
		int existsIndex = -1;
		// Check for existence
		int len = annotations.size();
		for(int i = 0; i < len; i++) {
			AnnotationProxy a = annotations.get(i);
			String t = (String) a.getProperty(TiC.PROPERTY_TITLE);

			if (t != null) {
				if (title.equals(t)) {
					existsIndex = i;
					break;
				}
			}
		}

		return existsIndex;
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
				int existsIndex = findAnnotation(title);
				if (existsIndex > -1) {
					annotations.remove(existsIndex);
				}

				if (mapView != null) {
					mapView.updateAnnotations();
				}
			}
		}
	}

	@Kroll.method
	public void selectAnnotation(Object[] args)
	{
		String title = null;
		boolean animate = false;
		boolean center = true; // keep existing default behavior

		if (args != null && args.length > 0) {
			if (args[0] instanceof KrollDict) {
				KrollDict params = (KrollDict)args[0];

				Object selectedAnnotation = params.get(TiC.PROPERTY_ANNOTATION);
				if(selectedAnnotation instanceof AnnotationProxy) {
					title = TiConvert.toString(((AnnotationProxy) selectedAnnotation).getProperty(TiC.PROPERTY_TITLE));
				} else {
					title = params.getString(TiC.PROPERTY_TITLE);
				}

				if (params.containsKeyAndNotNull(TiC.PROPERTY_ANIMATE)) {
					animate = params.getBoolean(TiC.PROPERTY_ANIMATE);
				}
				if (params.containsKeyAndNotNull(TiC.PROPERTY_CENTER)) {
					center = params.getBoolean(TiC.PROPERTY_CENTER);
				}

			} else {
				if (args[0] instanceof AnnotationProxy) {
					title = TiConvert.toString(((AnnotationProxy) args[0]).getProperty(TiC.PROPERTY_TITLE));

				} else if (args[0] instanceof String) {
					title = TiConvert.toString(args[0]);
				}

				if (args.length > 1) {
					animate = TiConvert.toBoolean(args[1]);
				}
			}
		}

		if (title != null) {
			if (mapView == null) {
				Log.e(LCAT, "calling selectedAnnotations.add");
				selectedAnnotations.add(new TiMapView.SelectedAnnotation(title, animate, center));
			} else {
				Log.e(LCAT, "calling selectedAnnotations.add2");
				mapView.selectAnnotation(true, title, animate, center);
			}
		}
	}

	@Kroll.method
	public void deselectAnnotation(Object[] args)
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

			if (mapView == null) {
				int numSelectedAnnotations = selectedAnnotations.size();
				for(int i = 0; i < numSelectedAnnotations; i++) {
					if((selectedAnnotations.get(i)).title.equals(title)) {
						selectedAnnotations.remove(i);
					}
				}
			} else {
				mapView.selectAnnotation(false, title, animate, false);
			}
		}
	}

	@Kroll.method
	public void setLocation(KrollDict location)
	{
		setProperty(TiC.PROPERTY_LOCATION, location);

		if(mapView != null)
		{
			mapView.doSetLocation(location);
		}
	}

	@Kroll.method
	public void setMapType(int mapType)
	{
		this.setProperty(TiC.PROPERTY_MAP_TYPE, mapType, true);
	}

	public void onDestroy(Activity activity) {
		if (lam != null && !destroyed) {
			destroyed = true;
			lam.dispatchDestroy(true);
			lam.destroyActivity("TIMAP", true);
		}
		mapWindow = null;
	}

	public void onPause(Activity activity) {
		if (lam != null) {
			lam.dispatchPause(false);
		}
	}

	public void onResume(Activity activity) {
		if (lam != null) {
			lam.dispatchResume();
		}
	}

	public void onStart(Activity activity) {
	}

	public void onStop(Activity activity) {
		if (lam != null) {
			lam.dispatchStop();
		}
	}

	@Override
	public void releaseViews()
	{
		super.releaseViews();
		onDestroy(null);
	}
}
