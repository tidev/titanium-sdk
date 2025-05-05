/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

@Kroll.proxy(creatableInModule = UIModule.class)
public class PickerRowProxy extends KrollProxy
{
	public interface OnChangedListener {
		void onChanged(PickerRowProxy proxy);
	}

	private static final String TAG = "PickerRowProxy";
	private final ArrayList<PickerRowProxy.OnChangedListener> listeners = new ArrayList<>();
	private String title = "[PickerRow]";

	public void addListener(PickerRowProxy.OnChangedListener listener)
	{
		if ((listener != null) && !this.listeners.contains(listener)) {
			this.listeners.add(listener);
		}
	}

	public void removeListener(PickerRowProxy.OnChangedListener listener)
	{
		this.listeners.remove(listener);
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);

		if (options.containsKey(TiC.PROPERTY_TITLE)) {
			this.title = TiConvert.toString(options, TiC.PROPERTY_TITLE);
		}
	}

	@Kroll.getProperty
	public String getColor()
	{
		return (String) getProperty(TiC.PROPERTY_COLOR);
	}

	@Kroll.setProperty
	public void setColor(String color)
	{
		setPropertyAndFire(TiC.PROPERTY_COLOR, color);
		onRowChanged();
	}

	@Kroll.getProperty
	public String getTitle()
	{
		return this.title;
	}

	@Kroll.setProperty
	public void setTitle(String value)
	{
		this.title = value;
		setPropertyAndFire(TiC.PROPERTY_TITLE, this.title);
		onRowChanged();
	}

	private void onRowChanged()
	{
		ArrayList<PickerRowProxy.OnChangedListener> clonedListeners = new ArrayList<>(this.listeners);
		for (PickerRowProxy.OnChangedListener listener : clonedListeners) {
			if (this.listeners.contains(listener)) {
				listener.onChanged(this);
			}
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.PickerRow";
	}
}
