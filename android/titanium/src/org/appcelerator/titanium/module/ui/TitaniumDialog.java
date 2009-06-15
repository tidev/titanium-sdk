package org.appcelerator.titanium.module.ui;


import org.appcelerator.titanium.api.ITitaniumDialog;
import org.appcelerator.titanium.util.TitaniumJSEventManager;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Handler;
import android.util.Config;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumDialog implements ITitaniumDialog
{
	private static final String LCAT = "TiDialog";
	private static boolean DBG = Config.LOGD;

	public static final String CLICK_EVENT = "click";

	protected WebView webView;
	protected AlertDialog.Builder builder;
	protected TitaniumJSEventManager eventListeners;

	protected class ClickHandler implements DialogInterface.OnClickListener {

		private int result;

		public ClickHandler(int id) {
			this.result = id;
		}
		public void onClick(DialogInterface dialog, int which) {
			handleEvent(result);
			dialog.dismiss();
		}
	}
	public TitaniumDialog(Handler handler, WebView webView)
	{
		this.webView = webView;
		this.eventListeners = new TitaniumJSEventManager(handler, webView);
		this.eventListeners.supportEvent(CLICK_EVENT);
		this.builder = new AlertDialog.Builder(webView.getContext());
		this.builder.setCancelable(true);
	}

	public void setMessage(String msg) {
		builder.setMessage(msg);
	}

	public void setTitle(String title) {
		builder.setTitle(title);
	}

	public void addListener(String eventName, String listener) {
		if(eventName == null || !eventName.toLowerCase().equals(CLICK_EVENT)) {
			throw new IllegalStateException("TitaniumDialog only handles listeners named: " + CLICK_EVENT);
		}

		eventListeners.addListener(eventName, listener);
	}

	public void setButtons(String[] buttonText)
	{
		builder.setPositiveButton(null, null);
		builder.setNegativeButton(null, null);
		builder.setNeutralButton(null, null);

		for (int id = 0; id < buttonText.length; id++) {
			String text = buttonText[id];
			ClickHandler clicker = new ClickHandler(id);
			switch (id) {
			case 0:
				builder.setPositiveButton(text, clicker);
				break;
			case 1:
				builder.setNeutralButton(text, clicker);
				break;
			case 2:
				builder.setNegativeButton(text, clicker);
				break;
			default:
				Log.e(LCAT, "Only 3 buttons are supported");
			}
		}
	}

	public void setOptions(String[] optionText) {
		if (DBG) {
			Log.d(LCAT, "Option Text length: " + optionText.length);
			for (String t : optionText) {
				Log.d(LCAT, "Option: " + t);
			}
		}
		builder.setSingleChoiceItems(optionText, -1 , new DialogInterface.OnClickListener() {

			public void onClick(DialogInterface dialog, int which) {
				handleEvent(which);
				dialog.dismiss();
			}});
	}

	protected void handleEvent(int id) {
		eventListeners.invokeSuccessListeners(CLICK_EVENT, "{ type : '" + CLICK_EVENT + "', index : " + id + " }");
	}

	public void show() {
		builder.create().show();
	}
}
