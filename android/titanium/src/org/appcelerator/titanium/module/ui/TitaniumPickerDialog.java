package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumModalPicker;
import org.appcelerator.titanium.api.ITitaniumPicker;
import org.appcelerator.titanium.api.ITitaniumPickerConstants;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.widgets.TitaniumPickerView;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;

public class TitaniumPickerDialog extends AlertDialog
	implements ITitaniumPicker, ITitaniumModalPicker, ITitaniumPickerConstants,
	Handler.Callback, DialogInterface.OnClickListener
{
	private static final String LCAT = "TitaniumPickerDialog";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_OPEN = 300;
	private static final int MSG_SHOW = 301;
	private static final int MSG_HIDE = 302;
	private static final int MSG_OK = 303;

	TitaniumModuleManager tmm;
	Handler handler;
	TitaniumPickerHelper helper;
	TitaniumJSEventManager eventManager;

	public TitaniumPickerDialog(TitaniumModuleManager tmm) {
		super(tmm.getActivity());
		this.tmm = tmm;
		this.handler = new Handler(this);
		this.eventManager = new TitaniumJSEventManager(tmm);
		this.helper = new TitaniumPickerHelper(tmm.getActivity(), handler, eventManager);

		setCancelable(true);

		setButton(DialogInterface.BUTTON_POSITIVE, "OK", this);
		setButton(DialogInterface.BUTTON_NEGATIVE, "Cancel", this);
	}

	@Override
	protected void onStart() {
		super.onStart();
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = helper.handleMessage(msg);

		if (!handled) {
			switch(msg.what) {
				case MSG_OPEN : {
					TitaniumPickerView tp = new TitaniumPickerView(getContext(), true);
					tp.setId(100);
					helper.setView(tp);
					setTitle("Choose");
					setView(tp, 5,5,5,5);

					handled = true;
					break;
				}
				case MSG_SHOW : {
					super.show();
					handled = true;
					break;
				}
				case MSG_HIDE : {
					super.hide();
					handled = true;
					break;
				}
				case MSG_OK : {
					try {
						JSONObject o = new JSONObject();
						o.put("column", 0);
						o.put("row", 0);

						JSONArray a = new JSONArray();
						for(int i = 0; i < helper.getView().getColumnCount(); i++) {
							JSONObject cell= helper.getView().getSelectedRowData(i);
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
		}
		return handled;
	}


	public void onClick(DialogInterface dialog, int which) {
		switch(which) {
			case DialogInterface.BUTTON_POSITIVE : {
				handler.obtainMessage(MSG_OK).sendToTarget();
				break;
			}
			case DialogInterface.BUTTON_NEGATIVE : {
				handler.obtainMessage(MSG_HIDE).sendToTarget();
				break;
			}
		}
	}

	@Override
	public void show() {
		handler.obtainMessage(MSG_SHOW).sendToTarget();
	}

	@Override
	public void hide() {
		handler.obtainMessage(MSG_HIDE).sendToTarget();
	}

	public int getSelectedRow(int col) {
		return helper.getSelectedRow(col);
	}

	public void selectRow(int col, int row, String json) {
		handler.obtainMessage(MSG_SELECTROW, col, row, json).sendToTarget();
	}

	public void setColumnData(int col, String json) {
		handler.obtainMessage(MSG_SETCOLUMNDATA, col, -1, json).sendToTarget();
	}

	public void setData(String json) {
		handler.obtainMessage(MSG_SETDATA, json).sendToTarget();
	}

	public void open() {
		handler.obtainMessage(MSG_OPEN).sendToTarget();
	}

	public int addEventListener(String eventName, String listener) {
		return eventManager.addListener(eventName, listener);
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventManager.removeListener(eventName, listenerId);
	}

	public void setOptions(String json) {
		try {
			JSONObject o = new JSONObject(json);
			helper.processOptions(o);
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to set data: ", e);
		}
	}

	// Not needed by dialog
	public void blur() {
		// TODO Auto-generated method stub

	}

	public void focus() {
		// TODO Auto-generated method stub

	}

	public String getHtmlId() {
		return null;
	}

	public void handleLayoutRequest(Bundle position) {
	}
}
