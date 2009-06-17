/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.api.ITitaniumProgressDialog;

import android.app.Activity;
import android.app.ProgressDialog;
import android.util.Config;

public class TitaniumProgressDialog implements ITitaniumProgressDialog
{
	@SuppressWarnings("unused")
	private static final String LCAT = "TiProgressDlg";
	@SuppressWarnings("unused")
	private static final boolean DBG = Config.LOGD;

	protected TitaniumActivity activity;
	protected String message;
	protected Type type;
	protected Location location;
	protected int min;
	protected int max;

	protected boolean visible;
	protected ProgressDialog progressDialog;
	protected int incrementFactor;
	protected Activity parent;

	protected String statusBarTitle;

	public TitaniumProgressDialog(TitaniumActivity activity)
	{
		this.activity = activity;
		this.message = "Message not set...";
		this.type = Type.INDETERMINANT;
		this.location = Location.DIALOG;
		this.visible = false;
		this.min = 0;
		this.max = 100;
		this.incrementFactor = 10000 / (this.max - this.min);
		this.parent = activity.getRootActivity();

	}

	public void setMessage(final String message)
	{
		this.message = message;
		if (visible && location == Location.DIALOG) {
			activity.runOnUiThread(new Runnable(){
				public void run() {
					progressDialog.setMessage(message);
				}
			});
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
			if (location == Location.STATUS_BAR) {
				if (parent != null) {
					if (type == Type.DETERMINANT) {
						parent.runOnUiThread(new Runnable(){
							public void run() {
								parent.setProgress((pos - min) * incrementFactor);
							}
						});
					}
				}
			} else {
				if (parent != null && progressDialog != null) {
					parent.runOnUiThread(new Runnable(){
						public void run() {
							progressDialog.setProgress((pos - min) * incrementFactor);
						}
					});

				}
			}
		}
	}

	public void show() {
		visible = true;

		if (location == Location.STATUS_BAR) {
			incrementFactor = 10000 / (max - min); // TODO range check, and setters

			if (type == Type.INDETERMINANT) {
				parent.runOnUiThread(new Runnable(){
					public void run() {
						parent.setProgressBarIndeterminate(true);
						parent.setProgressBarIndeterminateVisibility(true);
						statusBarTitle = parent.getTitle().toString();
						parent.setTitle(message);
					}
				});
			} else {
				parent.runOnUiThread(new Runnable(){
					public void run() {
						parent.setProgressBarIndeterminate(false);
						parent.setProgressBarIndeterminateVisibility(false);
						parent.setProgressBarVisibility(true);
						statusBarTitle = parent.getTitle().toString();
						parent.setTitle(message);
					}
				});
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
				}
				progressDialog.setProgress(0);
			}
			progressDialog.show();
		}
	}

	public void hide() {
		visible = false;
		if (location == Location.STATUS_BAR) {
			final Activity parent = activity.getRootActivity();
			if (parent != null) {
				parent.runOnUiThread(new Runnable(){
					public void run() {
						parent.setProgressBarIndeterminate(false);
						parent.setProgressBarIndeterminateVisibility(false);
						parent.setProgressBarVisibility(false);
						parent.setTitle(statusBarTitle);
						statusBarTitle = null;
					}
				});
			}
		} else {
			progressDialog.dismiss();
		}
	}
}
