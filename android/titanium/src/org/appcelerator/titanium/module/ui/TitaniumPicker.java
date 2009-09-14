package org.appcelerator.titanium.module.ui;

import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumPicker;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.widgets.TitaniumPickerView;
import org.appcelerator.titanium.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Message;

public class TitaniumPicker extends TitaniumBaseNativeControl
	implements ITitaniumPicker, TitaniumPickerView.OnItemSelectionListener
{
	private static final String LCAT = "TiPicker";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final String EVENT_CHANGE = "change";

	private static final int MSG_SETDATA = 400;
	private static final int MSG_GETSELECTEDROW = 401;
	private static final int MSG_SELECTROW = 402;
	private static final int MSG_SETCOLUMNDATA = 403;
	private static final int MSG_SELECTIONCHANGE = 404;

	private JSONArray data;

	class Holder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public Holder() {
			super(0);
		}
		public Object o;
		public int i;
	}

	public TitaniumPicker(TitaniumModuleManager tmm) {
		super(tmm);
	}

	@Override
	protected void setLocalOptions(JSONObject o) throws JSONException
	{
		super.setLocalOptions(o);
		eventManager.supportEvent(EVENT_CHANGE);

		if (o.has("data")) {
			this.data = o.getJSONArray("data");
		}
	}

	@Override
	public void createControl(TitaniumModuleManager tmm)
	{
		Context context = tmm.getActivity();

		TitaniumPickerView tp = new TitaniumPickerView(context);
		tp.setData(data);
		tp.setOnItemSelectionListener(this);
		control = tp;
	}

	private TitaniumPickerView getView() {
		return (TitaniumPickerView) control;
	}

	@Override
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
					getView().setData(d);
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
			default: {
				handled = super.handleMessage(msg);
			}
		}

		return handled;
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

	public void selectRow(int col, int row, String json) {
		handler.obtainMessage(MSG_SELECTROW, col, row, json).sendToTarget();
	}

	public void setColumnData(int col, String json) {
		handler.obtainMessage(MSG_SETCOLUMNDATA, col, -1, json).sendToTarget();
	}

	public void setData(String json) {
		handler.obtainMessage(MSG_SETDATA, json).sendToTarget();
	}

	public void onItemSelected(TitaniumPickerView view, int col, int row) {
		handler.obtainMessage(MSG_SELECTIONCHANGE, col, row).sendToTarget();
	}

}
