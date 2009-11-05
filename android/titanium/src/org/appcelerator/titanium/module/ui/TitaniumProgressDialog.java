/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.ui;

import java.lang.ref.WeakReference;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.api.ITitaniumProgressDialog;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.TitaniumActivityHelper;

import android.app.Activity;
import android.app.ProgressDialog;
import android.os.Handler;
import android.os.Message;

public class TitaniumProgressDialog
	implements ITitaniumProgressDialog, Handler.Callback
{
	@SuppressWarnings("unused")
	private static final String LCAT = "TiProgressDlg";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_SET_MESSAGE = 300;
	private static final int MSG_SET_POSITION = 301;
	private static final int MSG_SHOW = 302;
	private static final int MSG_HIDE = 303;

	protected Handler handler;
	protected String message;
	protected Type type;
	protected Location location;
	protected int min;
	protected int max;

	protected boolean visible;
	protected ProgressDialog progressDialog;
	protected int incrementFactor;
	protected WeakReference<Activity> weakParent;

	protected String statusBarTitle;

	public TitaniumProgressDialog(TitaniumActivity activity)
	{
		this.handler = new Handler(this);
		this.message = "Message not set...";
		this.type = Type.INDETERMINANT;
		this.location = Location.DIALOG;
		this.visible = false;
		this.min = 0;
		this.max = 100;
		this.incrementFactor = 10000 / (this.max - this.min);
		this.weakParent = new WeakReference<Activity>(TitaniumActivityHelper.getRootActivity(activity));

	}

	public boolean handleMessage(Message msg)
	{
		Activity parent = weakParent.get();
		if (parent == null) {
			return false;
		}
		switch(msg.what) {
			case MSG_SET_MESSAGE :
				progressDialog.setMessage((String) msg.obj);
				return true;
			case MSG_SET_POSITION :
				if (msg.arg1 == Location.STATUS_BAR.ordinal()) {
					parent.setProgress(msg.arg2);
				} else {
					if (progressDialog != null) {
						progressDialog.setProgress(msg.arg2);
					}
				}
				return true;
			case MSG_SHOW :
				if (location == Location.STATUS_BAR) {
					incrementFactor = 10000 / (max - min); // TODO range check, and setters

					if (type == Type.INDETERMINANT) {
						parent.setProgressBarIndeterminate(true);
						parent.setProgressBarIndeterminateVisibility(true);
						statusBarTitle = parent.getTitle().toString();
						parent.setTitle(message);
					} else {
						parent.setProgressBarIndeterminate(false);
						parent.setProgressBarIndeterminateVisibility(false);
						parent.setProgressBarVisibility(true);
						statusBarTitle = parent.getTitle().toString();
						parent.setTitle(message);
					}
				} else {
					incrementFactor = 1;
					if (progressDialog == null) {
						progressDialog = new ProgressDialog(parent);
					}

					progressDialog.setMessage(message);
					progressDialog.setCancelable(false);

					if (type == Type.INDETERMINANT) {
						progressDialog.setIndeterminate(true);
					} else {
						progressDialog.setIndeterminate(false);
						progressDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
						if (min != 0) {
							progressDialog.setMax(max-min); // no min setting so shift
						} else {
							progressDialog.setMax(max);
						}
						progressDialog.setProgress(0);
					}
					progressDialog.show();
				}
				return true;
			case MSG_HIDE :
				if (location == Location.STATUS_BAR) {
					if (parent != null) {
						parent.setProgressBarIndeterminate(false);
						parent.setProgressBarIndeterminateVisibility(false);
						parent.setProgressBarVisibility(false);
						parent.setTitle(statusBarTitle);
						statusBarTitle = null;
					}
				} else {
					if (progressDialog != null) {
						progressDialog.dismiss();
					}
				}
				return true;
		}
		return false;
	}

	public void setMessage(final String message)
	{
		this.message = message;
		if (visible && location == Location.DIALOG) {
			handler.obtainMessage(MSG_SET_MESSAGE, message).sendToTarget();
		}
	}

	public void setLocation(int location) {
		switch(location) {
		case 0: this.location = Location.STATUS_BAR; break;
		case 1: this.location = Location.DIALOG; break;
		default :
			throw new IllegalArgumentException("Invalid location");
		}
	}

	public void setType(int type) {
		switch(type) {
		case 0: this.type = Type.INDETERMINANT; break;
		case 1: this.type = Type.DETERMINANT; break;
		default :
			throw new IllegalArgumentException("Invalid type");
		}
	}

	public void setMax(int max) {
		this.max = max;
	}

	public void setMin(int min) {
		this.min = min;
	}

	public void setPosition(final int pos) {
		if (visible) {
			int thePos = (pos - min) * incrementFactor;
			handler.obtainMessage(MSG_SET_POSITION, location.ordinal(), thePos).sendToTarget();
		}
	}

	public void show() {
		visible = true;
		handler.obtainMessage(MSG_SHOW).sendToTarget();
	}

	public void hide() {
		visible = false;
		handler.obtainMessage(MSG_HIDE).sendToTarget();
	}

}
