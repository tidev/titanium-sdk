/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.map;

import java.util.List;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.module.ui.TitaniumBaseView;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.OvalShape;
import android.os.Handler;
import android.os.Message;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.Toast;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.ItemizedOverlay;
import com.google.android.maps.MapActivity;
import com.google.android.maps.MapView;
import com.google.android.maps.MyLocationOverlay;
import com.google.android.maps.Overlay;
import com.google.android.maps.OverlayItem;

public class TitaniumMapView extends TitaniumBaseView
	implements Handler.Callback
{
	private static final String LCAT = "TiMapView";

	private static final String API_KEY = "ti.android.google.map.api.key";

	public static final int MAP_VIEW_STANDARD = 1;
	public static final int MAP_VIEW_SATELLITE = 2;
	public static final int MAP_VIEW_HYBRID = 3;

	private static final int MSG_SET_LOCATION = 300;
	private static final int MSG_SET_MAPTYPE = 301;
	private static final int MSG_SET_REGIONFIT = 302;
	private static final int MSG_SET_ANIMATE = 303;
	private static final int MSG_SET_USERLOCATION = 304;
	private static final int MSG_SET_SCROLLENABLED = 305;

	//private MapView view;
	private int type;
	private boolean zoomEnabled;
	private boolean scrollEnabled;
	private JSONObject region;
	private boolean regionFit;
	private boolean animate;
	private boolean userLocation;
	private JSONArray annotations;

	private LocalMapView view;
	private Window mapWindow;
	private MyLocationOverlay myLocation;

	class LocalMapView extends MapView
	{
		private boolean scrollEnabled;

		public LocalMapView(Context context, String apiKey) {
			super(context, apiKey);
			scrollEnabled = false;
		}

		public void setScrollable(boolean enable) {
			scrollEnabled = enable;
		}

		@Override
		public boolean dispatchTouchEvent(MotionEvent ev) {
			if (!scrollEnabled && ev.getAction() == MotionEvent.ACTION_MOVE) {
				return true;
			}
			return super.dispatchTouchEvent(ev);
		}

		@Override
		public boolean dispatchTrackballEvent(MotionEvent ev) {
			if (!scrollEnabled && ev.getAction() == MotionEvent.ACTION_MOVE) {
				return true;
			}
			return super.dispatchTrackballEvent(ev);
		}
	}

	class TitaniumOverlay extends ItemizedOverlay<OverlayItem>
	{
		JSONArray annotations;

		public TitaniumOverlay(Drawable defaultDrawable) {
			super(defaultDrawable);
		}

		public void setAnnotations(JSONArray annotations) {
			this.annotations = annotations;

			populate();
		}

		@Override
		protected OverlayItem createItem(int i) {
			OverlayItem item = null;
			try {
				JSONObject a = annotations.getJSONObject(i);
				if (a.has("latitude") && a.has("longitude")) {
					String title = a.optString("title", "");
					String subtitle = a.optString("subtitle", "");

					GeoPoint location = new GeoPoint(scaleToGoogle(a.getDouble("latitude")), scaleToGoogle(a.getDouble("longitude")));
					item = new OverlayItem(location, title, subtitle);

					if (a.has("pincolor")) {
						switch(a.getInt("pincolor")) {
						case 1 : // RED
							item.setMarker(makeMarker(Color.RED));
							break;
						case 2 : // GREEN
							item.setMarker(makeMarker(Color.GREEN));
							break;
						case 3 : // PURPLE
							item.setMarker(makeMarker(Color.argb(255,192,0,192)));
							break;
						}
					}
				} else {
					Log.w(LCAT, "Skipping annotation: No coordinates #" + i);
				}
			} catch (JSONException e) {
				Log.e(LCAT, "Error proccessing annotation #" + i + ": " + e.getMessage());
			}

			return item;
		}

		@Override
		public int size() {
			return (annotations == null) ? 0 : annotations.length();
		}
	}

	public TitaniumMapView(TitaniumModuleManager tmm, Window mapWindow) {
		super(tmm);

		this.mapWindow = mapWindow;

		this.type = MAP_VIEW_STANDARD;
		this.zoomEnabled = true;
		this.scrollEnabled = true;
		this.region = null;
		this.regionFit =true;
		this.animate = false;
		this.userLocation = false;
	}

	@Override
	public boolean handleMessage(Message msg) {
		boolean handled = super.handleMessage(msg);

		if (!handled) {
			switch(msg.what) {
				case MSG_SET_LOCATION : {
					doSetLocation((JSONObject) msg.obj);
					handled = true;
					break;
				}
				case MSG_SET_MAPTYPE : {
					doSetMapType(msg.arg1);
					handled = true;
					break;
				}
				case MSG_SET_REGIONFIT :
					regionFit = msg.arg1 == 1 ? true : false;
					handled = true;
					break;
				case MSG_SET_ANIMATE :
					animate = msg.arg1 == 1 ? true : false;
					handled = true;
					break;
				case MSG_SET_SCROLLENABLED :
					animate = msg.arg1 == 1 ? true : false;
					if (view != null) {
						view.setScrollable(scrollEnabled);
					}
					handled = true;
					break;
				case MSG_SET_USERLOCATION :
					userLocation = msg.arg1 == 1 ? true : false;
					doUserLocation(userLocation);
					handled = true;
					break;
			}
		}

		return handled;
	}

	@Override
	protected void processLocalOptions(JSONObject o) throws JSONException
	{
		if (o.has("mapType")) {
			this.type = o.getInt("mapType");
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
		if (o.has("regionFit")) {
			regionFit = o.getBoolean("regionFit");
		}
		if (o.has("animate")) {
			animate = o.getBoolean("animate");
		}
		if (o.has("userLocation")) {
			userLocation = o.getBoolean("userLocation");
		}
		if (o.has("annotations")) {
			annotations = o.getJSONArray("annotations");
		}
	}

	@Override
	protected void doOpen()
	{
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		setLayoutParams(params);

		try {
			String apiKey = tmm.getApplication().getAppInfo().getSystemProperties().getString(API_KEY, null);

			view = new LocalMapView(mapWindow.getContext(), apiKey);
			MapActivity ma = (MapActivity) mapWindow.getContext();
			ma.setContentView(view);

			view.setBuiltInZoomControls(zoomEnabled);
			view.setScrollable(scrollEnabled);
			view.setClickable(true);

			doSetMapType(type);
			doSetLocation(region);
			doSetAnnotations(annotations);
			doUserLocation(userLocation);
		} catch (IllegalArgumentException e) {
			Log.e(LCAT, "Missing API Key: " + e.getMessage());
			Toast.makeText(getContext(), "Missing MAP API Key", Toast.LENGTH_LONG).show();
		}
	}

	@Override
	protected View getContentView() {
		return mapWindow.getDecorView();
	}

	public void setLocation(JSONObject json) {
		handler.obtainMessage(MSG_SET_LOCATION, json).sendToTarget();
	}

	public void doSetLocation(JSONObject o) {
		if (view != null) {
			try {
				if (o.has("longitude") && o.has("latitude")) {
					GeoPoint gp = new GeoPoint(scaleToGoogle(o.getDouble("latitude")), scaleToGoogle(o.getDouble("longitude")));
					if (o.optBoolean("animate", false)) {
						view.getController().animateTo(gp);
					} else {
						view.getController().setCenter(gp);
					}
				}
				if (regionFit && o.has("longitudeDelta") && o.has("latitudeDelta")) {
					view.getController().zoomToSpan(scaleToGoogle(o.getDouble("latitudeDelta")), scaleToGoogle(o.getDouble("longitudeDelta")));
				} else {
					Log.w(LCAT, "span must have longitudeDelta and latitudeDelta");
				}

			} catch (JSONException e) {
				Log.e(LCAT, "Error pulling values from JSONObject: " + e.getMessage(), e);
			}
		}
	}

	public void setMapType(int type) {
		handler.obtainMessage(MSG_SET_MAPTYPE, type, -1).sendToTarget();
	}

	public void doSetMapType(int type) {
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

	public void doSetAnnotations(JSONArray annotations) {
		if (annotations != null) {
			List<Overlay> overlays = view.getOverlays();

			synchronized(overlays) {
				int len = annotations.length();
				if (len > 0) {
					TitaniumOverlay overlay = new TitaniumOverlay(makeMarker(Color.BLUE));
					overlay.setAnnotations(annotations);
					overlays.add(overlay);
				}
			}
		}
	}

	public void doUserLocation(boolean userLocation)
	{
		if (view != null) {
			if (userLocation) {
				if (myLocation == null) {
					myLocation = new MyLocationOverlay(getContext(), view);
				}

				List<Overlay> overlays = view.getOverlays();
				synchronized(overlays) {
					if (!overlays.contains(myLocation)) {
						overlays.add(myLocation);
					}
				}

				myLocation.enableMyLocation();

			} else {
				List<Overlay> overlays = view.getOverlays();
				synchronized(overlays) {
					if (overlays.contains(myLocation)) {
						overlays.remove(myLocation);
					}
					myLocation.disableMyLocation();
				}
			}
		}
	}

	private Drawable makeMarker(int c)
	{
		OvalShape s = new OvalShape();
		s.resize(1.0f, 1.0f);
		ShapeDrawable d = new ShapeDrawable(s);
		d.setBounds(0, 0, 15, 15);
		d.getPaint().setColor(c);

		return d;
	}
	public void setRegionFit(boolean enabled) {
		handler.obtainMessage(MSG_SET_REGIONFIT, enabled ? 1 : 0).sendToTarget();
	}
	public void setAnimate(boolean enabled) {
		handler.obtainMessage(MSG_SET_ANIMATE, enabled ? 1 : 0).sendToTarget();
	}
	public void setUserLocation(boolean enabled) {
		handler.obtainMessage(MSG_SET_USERLOCATION, enabled ? 1 : 0).sendToTarget();
	}
	private double scaleFromGoogle(int value) {
		return value / 1000000;
	}

	private int scaleToGoogle(double value) {
		return (int)(value * 1000000);
	}
}
