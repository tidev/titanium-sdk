/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import android.view.View;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import org.appcelerator.titanium.proxy.TiViewProxy;

import java.lang.ref.WeakReference;

public abstract class TiRecyclerViewHolder extends RecyclerView.ViewHolder
{
	protected WeakReference<TiViewProxy> proxy;

	public TiRecyclerViewHolder(@NonNull View itemView)
	{
		super(itemView);
	}

	/**
	 * Get current proxy assigned to holder.
	 *
	 * @return TiViewProxy
	 */
	public TiViewProxy getProxy()
	{
		if (this.proxy != null) {
			return this.proxy.get();
		}
		return null;
	}
}
