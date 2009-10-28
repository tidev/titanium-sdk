/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumMapView;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Message;
import android.view.View;
import android.widget.FrameLayout;

public class TitaniumMapView extends TitaniumBaseView
	implements ITitaniumMapView
{
	private static final String LCAT = "TiMapView";

	private static final String API_KEY = "google.map.api.key";

	private static final int MSG_SET_CENTER = 300;
	private static final int MSG_SET_REGION = 301;
	private static final int MSG_SET_TYPE = 302;

	//private MapView view;
	private int type;
	private boolean zoomEnabled;
	private boolean scrollEnabled;
	private JSONObject region;

	public TitaniumMapView(TitaniumModuleManager tmm) {
		super(tmm);

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
		//view = new MapView(getContext(), apiKey);
	}

	@Override
	protected View getContentView() {
		return null;
	}

	public void setCenterCoordinate(String json) {
		// TODO Auto-generated method stub

	}

	public void doSetCenter(JSONObject o) {

	}

	public void setRegion(String json) {
		// TODO Auto-generated method stub

	}

	public void doSetRegion(JSONObject o) {

	}

	public void setType(int type) {
		handler.obtainMessage(MSG_SET_TYPE, type, -1).sendToTarget();
	}

	public void doSetType(int type) {
		/*
		if (view != null) {
			switch(type) {
			case MAP_VIEW_STANDARD :
				view.setSatellite(false);
				view.setTraffic(false);
				view.setStreetView(false);
			}
		}
		*/
	}
}
