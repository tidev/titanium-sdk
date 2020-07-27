/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.List;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiRHelper;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import androidx.annotation.NonNull;
import androidx.recyclerview.selection.SelectionTracker;
import androidx.recyclerview.widget.RecyclerView;

import ti.modules.titanium.ui.TableViewRowProxy;

public class TableViewAdapter extends RecyclerView.Adapter<TableViewHolder>
{
	private static final String TAG = "TableViewAdapter";

	private Context context;
	private List<TableViewRowProxy> models;
	private SelectionTracker tracker;

	private static LayoutInflater inflater;
	private static int id_holder;

	public TableViewAdapter(@NonNull Context context, @NonNull List<TableViewRowProxy> models)
	{
		// Obtain layout inflater instance.
		if (inflater == null) {
			inflater = LayoutInflater.from(context);
		}

		// Obtain TableViewHolder layout identifier.
		try {
			if (id_holder == 0) {
				id_holder = TiRHelper.getResource("layout.titanium_ui_tableview_holder");
			}
		} catch (TiRHelper.ResourceNotFoundException e) {
			Log.e(TAG, "Could not load 'layout.titanium_ui_tableview_holder'.");
		}

		this.context = context;
		this.models = models;

		setHasStableIds(true);
	}

	public SelectionTracker getTracker()
	{
		return tracker;
	}

	public void setTracker(SelectionTracker tracker)
	{
		this.tracker = tracker;
	}

	@Override
	public TableViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType)
	{
		// Create new TableViewHolder instance.
		final RelativeLayout layout = (RelativeLayout) inflater.inflate(id_holder, null, false);
		return new TableViewHolder(context, layout);
	}

	@Override
	public void onBindViewHolder(@NonNull TableViewHolder holder, int position)
	{
		final TableViewRowProxy row = this.models.get(position);
		final boolean selected = tracker != null ? tracker.isSelected(row) : false;

		// Update TableViewHolder with new model data.
		// TODO: Optimize `bind()`.
		holder.bind(row, selected);
	}

	@Override
	public int getItemCount()
	{
		return this.models.size();
	}

	@Override
	public long getItemId(int position)
	{
		return this.models.get(position).hashCode();
	}

	public void replaceModels(List<TableViewRowProxy> models)
	{
		this.models = models;
		notifyDataSetChanged();
	}
}
