/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;

@Kroll.proxy
public abstract class RecyclerViewProxy extends TiViewProxy
{
	public abstract void swipeItem(int index);

	public abstract int moveItem(int fromIndex, int toIndex);

	public abstract boolean onMoveItemStarting(int index);

	public abstract void onMoveItemEnded(int index);
}
