/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.picker;

import androidx.annotation.NonNull;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.PickerProxy;
import ti.modules.titanium.ui.PickerColumnProxy;

public abstract class TiUIPlainPicker extends TiUIView
{
	public TiUIPlainPicker(@NonNull PickerProxy proxy)
	{
		super(proxy);
	}

	protected PickerProxy getPickerProxy()
	{
		return (this.proxy instanceof PickerProxy) ? (PickerProxy) proxy : null;
	}

	public abstract void selectRow(int columnIndex, int rowIndex, boolean animated);
	public abstract void onColumnChanged(PickerColumnProxy proxy);
	public abstract void onColumnListChanged();
}
