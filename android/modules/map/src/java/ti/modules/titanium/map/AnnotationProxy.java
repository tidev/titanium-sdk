/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import java.lang.ref.WeakReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;

@Kroll.proxy(creatableInModule=MapModule.class, propertyAccessors = {
	TiC.PROPERTY_ANIMATE,
	TiC.PROPERTY_IMAGE,
	TiC.PROPERTY_LEFT_BUTTON,
	TiC.PROPERTY_LEFT_VIEW,
	TiC.PROPERTY_PIN_IMAGE,
	TiC.PROPERTY_PINCOLOR,
	TiC.PROPERTY_RIGHT_IMAGE,
	TiC.PROPERTY_RIGHT_VIEW,
	TiC.PROPERTY_RIGHT_BUTTON,
	TiC.PROPERTY_SUBTITLE,
	TiC.PROPERTY_SUBTITLEID,
	TiC.PROPERTY_TITLE,
	TiC.PROPERTY_TITLEID,
	TiC.PROPERTY_LATITUDE,
	TiC.PROPERTY_LONGITUDE
})
public class AnnotationProxy extends KrollProxy
{
	private static final String TAG = "AnnotationProxy";
	
	private WeakReference<ViewProxy> viewProxy;
	
	public AnnotationProxy()
	{
		super();

		Log.d(TAG, "Creating an Annotation", Log.DEBUG_MODE);
	}

	public AnnotationProxy(TiContext tiContext)
	{
		this();
	}

	public void setViewProxy(ViewProxy viewProxy)
	{
		this.viewProxy = new WeakReference<ViewProxy>(viewProxy);
	}

	@Override
	protected KrollDict getLangConversionTable() {
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_SUBTITLE, TiC.PROPERTY_SUBTITLEID);
		table.put(TiC.PROPERTY_TITLE, TiC.PROPERTY_TITLEID);
		return table;
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		super.onPropertyChanged(name, value);
		if (viewProxy != null && viewProxy.get() != null) {
			TiMapView mapView = viewProxy.get().getMapView();
			if (mapView != null) {
				mapView.updateAnnotations();
			}
		}
	}
}
