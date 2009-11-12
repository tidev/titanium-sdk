/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.map;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.module.ui.TitaniumBaseView;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Handler;
import android.os.Message;
import android.view.View;
import android.view.Window;
import android.widget.FrameLayout;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.MapActivity;
import com.google.android.maps.MapController;
import com.google.android.maps.MapView;
import com.google.android.maps.MapView.ReticleDrawMode;

public class TitaniumMapView extends TitaniumBaseView
	implements Handler.Callback
{
	private static final String LCAT = "TiMapView";

	private static final String API_KEY = "ti.android.google.map.api.key";

	public static final int MAP_VIEW_STANDARD = 1;
	public static final int MAP_VIEW_SATELLITE = 2;
	public static final int MAP_VIEW_HYBRID = 3;

	private static final int MSG_SET_CENTER = 300;
	private static final int MSG_SET_REGION = 301;
	private static final int MSG_SET_TYPE = 302;

	//private MapView view;
	private int type;
	private boolean zoomEnabled;
	private boolean scrollEnabled;
	private JSONObject region;

	private MapView view;
	private Window mapWindow;

	public TitaniumMapView(TitaniumModuleManager tmm, Window mapWindow) {
		super(tmm);

		this.mapWindow = mapWindow;

		this.type = MAP_VIEW_STANDARD;
		this.zoomEnabled = false;
		this.scrollEnabled = false;
		this.region = null;
	}

	@Override
	public boolean handleMessage(Message msg) {
		boolean handled = super.handleMessage(msg);

		if (!handled) {
			switch(msg.what) {
				case MSG_SET_CENTER : {
					doSetCenter((JSONObject) msg.obj);
					break;
				}
				case MSG_SET_REGION : {
					doSetRegion((JSONObject) msg.obj);
					handled = true;
					break;
				}
				case MSG_SET_TYPE : {
					doSetType(msg.arg1);
					handled = true;
					break;
				}
			}
		}

		return handled;
	}

	@Override
	protected void processLocalOptions(JSONObject o) throws JSONException
	{
		if (o.has("type")) {
			this.type = o.getInt("type");
		}
		if (o.has("zoomEnabled")) {
			this.zoomEnabled = o.getBoolean("zoomEnabled");
		}
		if (o.has("scrollEnabled")) {
			this.scrollEnabled = o.getBoolean("scrollEnabled");
		}
		if (o.has("region")) {
			region = o.getJSONObject("region");
		}
	}

	@Override
	protected void doOpen()
	{
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		setLayoutParams(params);

		String apiKey = tmm.getApplication().getAppInfo().getSystemProperties().getString(API_KEY, null);

		view = new MapView(mapWindow.getContext(), apiKey);
		MapActivity ma = (MapActivity) mapWindow.getContext();
		ma.setContentView(view);

		MapController mc = view.getController();
		view.setBuiltInZoomControls(zoomEnabled);
		view.setClickable(true);
		doSetType(type);
		doSetRegion(region);
	}

	@Override
	protected View getContentView() {
		return mapWindow.getDecorView();
	}

	public void setCenterCoordinate(JSONObject json) {
		handler.obtainMessage(MSG_SET_CENTER, json).sendToTarget();
	}

	public void doSetCenter(JSONObject o) {
		if (view != null) {
			if (o.has("longitude") && o.has("latitude")) {
				try {
					GeoPoint gp = new GeoPoint(scaleToGoogle(o.getDouble("latitude")), scaleToGoogle(o.getDouble("longitude")));
					if (o.optBoolean("animate", false)) {
						view.getController().animateTo(gp);
					} else {
						view.getController().setCenter(gp);
					}
				} catch (JSONException e) {
					Log.e(LCAT,"Error pulling values from JSONObject: " + e.getMessage(), e);
				}
			} else {
				Log.w(LCAT, "Must have latitude and longitude for a coordinate");
			}
		}
	}

	public void setRegion(JSONObject json) {
		handler.obtainMessage(MSG_SET_REGION, json).sendToTarget();
	}

	public void doSetRegion(JSONObject o) {
		if (view != null) {
			try {
				if (o.has("coordinate")) {
					JSONObject c = o.getJSONObject("coordinate");
					doSetCenter(c);
				}

				if (o.has("span")) {
					JSONObject span = o.getJSONObject("span");
					if (span.has("longitudeDelta") && span.has("latitudeDelta")) {
						view.getController().zoomToSpan(scaleToGoogle(span.getDouble("latitudeDelta")), scaleToGoogle(span.getDouble("longitudeDelta")));
					} else {
						Log.w(LCAT, "span must have longitudeDelta and latitudeDelta");
					}
				}
			} catch (JSONException e) {
				Log.e(LCAT, "Error pulling values from JSONObject: " + e.getMessage(), e);
			}
		}
	}

	public void setType(int type) {
		handler.obtainMessage(MSG_SET_TYPE, type, -1).sendToTarget();
	}

	public void doSetType(int type) {
		if (view != null) {
			switch(type) {
			case MAP_VIEW_STANDARD :
				view.setSatellite(false);
				view.setTraffic(false);
				view.setStreetView(false);
				break;
			case MAP_VIEW_SATELLITE:
				view.setSatellite(true);
				view.setTraffic(false);
				view.setStreetView(false);
				break;
			case MAP_VIEW_HYBRID :
				view.setSatellite(false);
				view.setTraffic(false);
				view.setStreetView(true);
				break;
			}
		}
	}

	private double scaleFromGoogle(int value) {
		return value / 1000000;
	}

	private int scaleToGoogle(double value) {
		return (int)(value * 1000000);
	}
}
