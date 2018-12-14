/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import android.app.Activity;
import android.os.Message;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.android.AndroidModule;
import ti.modules.titanium.ui.widget.TiUITabbedBar;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors =
													 {
														 TiC.PROPERTY_INDEX,
														 TiC.PROPERTY_LABELS,
														 TiC.PROPERTY_STYLE,
													 })
public class TabbedBarProxy extends TiViewProxy
{

	private static final int MSG_CHANGE_INDEX = 3001;
	private static final int MSG_CHANGE_LABELS = 3002;
	private static final int MSG_CHANGE_STYLE = 3003;

	private static final String TAG = "TabbedBarProxy";

	private TiUITabbedBar tabbedBar;

	@Override
	public String getApiName()
	{
		return "Ti.UI.TabbedBar";
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);
		// If a style is not set in the creation dictionary use the default one
		if (!options.containsKeyAndNotNull(TiC.PROPERTY_STYLE)) {
			this.setProperty(TiC.PROPERTY_STYLE, AndroidModule.TABS_STYLE_DEFAULT);
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		tabbedBar = new TiUITabbedBar(this);
		if (hasPropertyAndNotNull(TiC.PROPERTY_INDEX)) {
			tabbedBar.setSelectedIndex(((int) getProperty(TiC.PROPERTY_INDEX)));
		}
		return tabbedBar;
	}

	// clang-format off
	@Kroll.getProperty
	@Kroll.method
	public int getIndex()
	// clang-format on
	{
		return tabbedBar.getSelectedIndex();
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		super.onPropertyChanged(name, value);
		if (name.equals(TiC.PROPERTY_INDEX)) {
			if (TiApplication.isUIThread()) {
				tabbedBar.setSelectedIndex(((int) value));
			} else {
				TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_CHANGE_INDEX), value);
			}
		}
		if (name.equals(TiC.PROPERTY_LABELS)) {
			if (TiApplication.isUIThread()) {
				tabbedBar.setNewLabels();
			} else {
				TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_CHANGE_LABELS));
			}
		}
		/*if (name.equals(TiC.PROPERTY_STYLE)) {
			if (TiApplication.isUIThread()) {
				tabbedBar.setNewStyle(((int) value));
			} else {
				TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_CHANGE_STYLE), value);
			}
		}*/
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_CHANGE_INDEX) {
			AsyncResult result = (AsyncResult) msg.obj;
			tabbedBar.setSelectedIndex(((int) result.getArg()));
			result.setResult(null);
			return true;
		} else if (msg.what == MSG_CHANGE_LABELS) {
			AsyncResult result = (AsyncResult) msg.obj;
			tabbedBar.setNewLabels();
			result.setResult(null);
			return true;
			//TODO: See if iOS supports change of styles after creation
			/*} else if (msg.what == MSG_CHANGE_STYLE) {
			AsyncResult result = (AsyncResult) msg.obj;
			tabbedBar.setNewStyle(((int) result.getArg()));
			result.setResult(null);
			return true;*/
		} else {
			return super.handleMessage(msg);
		}
	}
}
