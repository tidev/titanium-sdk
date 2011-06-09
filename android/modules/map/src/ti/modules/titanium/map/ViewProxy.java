/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.LocalActivityManager;
import android.content.Intent;
import android.os.Message;
import android.view.Window;

@Kroll.proxy(creatableInModule=MapModule.class)
public class ViewProxy extends TiViewProxy 
	implements OnLifecycleEvent 
{
	private static LocalActivityManager lam;
	private static Window mapWindow;
	private static final String LCAT = "TiMapViewProxy";
	
	/*
	 * Track whether the map activity has been destroyed (or told to destroy).
	 * Only one map activity may run, so we're tracking its life here.
	 */
	private boolean destroyed = false;

	private TiMapView mapView;
	private ArrayList<AnnotationProxy> annotations;
	private ArrayList<TiMapView.SelectedAnnotation> selectedAnnotations;
	private KrollDict location;
	
	public ViewProxy(TiContext tiContext) {
		super(tiContext);

		eventManager.addOnEventChangeListener(this);
		tiContext.addOnLifecycleEventListener(this);

		annotations = new ArrayList<AnnotationProxy>();
		selectedAnnotations = new ArrayList<TiMapView.SelectedAnnotation>();
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
		mapView = new TiMapView(this, mapWindow, annotations, selectedAnnotations);

		if(location != null) {
			mapView.doSetLocation(location);
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
					//if (DBG) {
					//	Log.d(LCAT, "Annotation found at index: " + " with title: " + title);
					//}
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
		if(mapView == null) {
			this.location = location;
		} else {
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
