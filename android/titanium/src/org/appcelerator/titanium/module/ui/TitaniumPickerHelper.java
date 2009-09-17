/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.api.ITitaniumPickerConstants;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.widgets.TitaniumPickerView;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Handler;
import android.os.Message;

public class TitaniumPickerHelper
	implements ITitaniumPickerConstants, TitaniumPickerView.OnItemSelectionListener,
		Handler.Callback
{
	private static final String LCAT = "TiPickerHelper";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private JSONArray data;
	private Handler handler;
	private TitaniumJSEventManager eventManager;
	private TitaniumPickerView tp;

	class Holder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public Holder() {
			super(0);
		}
		public Object o;
		public int i;
	}

	public TitaniumPickerHelper(Context context, Handler handler, TitaniumJSEventManager eventManager)
	{
		this.handler = handler;
		this.eventManager = eventManager;

	}

	public void processOptions(JSONObject o) throws JSONException
	{
		eventManager.supportEvent(EVENT_CHANGE);

		if (o.has("data")) {
			this.data = o.getJSONArray("data");
		}

	}

	public void setView(TitaniumPickerView tp) {
		this.tp = tp;
		this.tp.setData(data);
		this.tp.setOnItemSelectionListener(this);
	}

	public TitaniumPickerView getView() {
		return tp;
	}

	public boolean handleMessage(Message msg) {
		boolean handled = false;

		switch(msg.what) {
			case MSG_SELECTROW : {
				getView().selectRow(msg.arg1, msg.arg2);
				handled = true;
				break;
			}
			case MSG_SETDATA : {
				try {
					JSONArray d = new JSONArray((String) msg.obj);
					this.data = d;
					if (getView() != null) {
						getView().setData(d);
					}
				} catch(JSONException e) {
					Log.e(LCAT, "Unable to process data: ", e);
				}
				handled = true;
				break;
			}
			case MSG_GETSELECTEDROW : {
				Holder h = (Holder) msg.obj;
				h.i = getView().getSelectedRow(msg.arg1);
				h.release();
				handled = true;
				break;
			}
			case MSG_SETCOLUMNDATA : {
				try {
					int col = msg.arg1;
					JSONObject d = new JSONObject((String) msg.obj);
					data.put(col, d);
					getView().setColumnData(col, d);
				} catch (JSONException e) {
					Log.e(LCAT, "Unable to process data: ", e);
				}

				handled = true;
				break;
			}
			case MSG_SELECTIONCHANGE : {
				int col = msg.arg1;
				int row = msg.arg2;

				try {
					JSONObject o = new JSONObject();
					o.put("column", col);
					o.put("row", row);

					JSONArray a = new JSONArray();
					for(int i = 0; i < data.length(); i++) {
						JSONObject cell= getView().getSelectedRowData(i);
						if (DBG) {
							Log.d(LCAT, "Column[" + i + "] = " + cell.toString());
						}
						a.put(cell);
					}
					o.put("selectedValue", a);

					eventManager.invokeSuccessListeners(EVENT_CHANGE, o.toString());
				} catch (JSONException e) {
					Log.w(LCAT, "Unable to invoke selection change event: ", e);
				}
			}
		}

		return handled;
	}

	public void onItemSelected(TitaniumPickerView view, int col, int row) {
		handler.obtainMessage(MSG_SELECTIONCHANGE, col, row).sendToTarget();
	}

	public int getSelectedRow(int col)
	{
		Holder h = new Holder();
		handler.obtainMessage(MSG_GETSELECTEDROW, col, -1, h).sendToTarget();
		synchronized(h) {
			try {
				h.acquire();
			} catch (InterruptedException e) {
				Log.w(LCAT, "Interrupted while waiting for selected row: ", e);
			}
		}
		return h.i;
	}

}
