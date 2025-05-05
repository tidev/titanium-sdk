/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.List;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiRHelper;

import android.content.Context;
import android.view.ViewGroup;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;

import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.widget.listview.TiRecyclerViewAdapter;

public class TableViewAdapter extends TiRecyclerViewAdapter<TableViewHolder, TableViewRowProxy>
{
	private static final String TAG = "TableViewAdapter";

	public TableViewAdapter(@NonNull Context context, @NonNull List<TableViewRowProxy> models)
	{
		super(context, models);

		// Obtain TableViewHolder layout identifier.
		try {
			if (this.id_holder == 0) {
				this.id_holder = TiRHelper.getResource("layout.titanium_ui_tableview_holder");
			}
		} catch (TiRHelper.ResourceNotFoundException e) {
			Log.e(TAG, "Could not load 'layout.titanium_ui_tableview_holder'.");
		}
	}

	/**
	 * Bind item to holder.
	 * This is the listener that updates our table holders to the correct items.
	 *
	 * @param holder Holder to bind.
	 * @param position Position of item in list.
	 */
	@Override
	public void onBindViewHolder(@NonNull TableViewHolder holder, int position)
	{
		final TableViewRowProxy row = this.models.get(position);
		final boolean selected = tracker != null ? tracker.isSelected(row) : false;

		// Notify row of its selected status.
		// This is necessary to maintain selection status on theme change.
		row.setSelected(selected);

		// Update TableViewHolder with new model data.
		holder.bind(row, selected);
	}

	/**
	 * Create new holder.
	 * This listener creates new holders which are used to bind with.
	 *
	 * @param parent Parent view.
	 * @param viewType Type of view.
	 * @return TableViewHolder.
	 */
	@Override
	public TableViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType)
	{
		// Create new TableViewHolder instance.
		final RelativeLayout layout = (RelativeLayout) inflater.inflate(id_holder, null);
		return new TableViewHolder(parent.getContext(), layout);
	}

	/**
	 * Recycle holder for future binding.
	 * This is used when holders are scrolled out of visibility.
	 *
	 * @param holder
	 */
	@Override
	public void onViewRecycled(@NonNull TableViewHolder holder)
	{
		super.onViewRecycled(holder);

		// Release child views for recycled holder.
		final TiViewProxy proxy = holder.getProxy();
		if (proxy != null) {
			proxy.releaseViews();
		}
	}
}
