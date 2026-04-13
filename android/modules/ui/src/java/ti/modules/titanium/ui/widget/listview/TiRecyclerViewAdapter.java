/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import android.content.Context;
import android.view.LayoutInflater;

import androidx.annotation.NonNull;
import androidx.recyclerview.selection.SelectionTracker;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.RecyclerView;

import org.appcelerator.titanium.proxy.TiViewProxy;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import androidx.collection.LruCache;

public abstract class TiRecyclerViewAdapter<VH extends TiRecyclerViewHolder<V>, V extends TiViewProxy>
	extends RecyclerView.Adapter<VH>
{
	protected Context context;
	protected int id_holder;
	protected LayoutInflater inflater;
	protected List<V> models;
	protected SelectionTracker tracker;

	// Hash caching for DiffUtil optimization
	private final LruCache<V, Long> modelHashCache = new LruCache<>(100);

	public TiRecyclerViewAdapter(@NonNull Context context, @NonNull List<V> models)
	{
		// Obtain context.
		this.context = context;

		// Obtain layout inflater instance.
		this.inflater = LayoutInflater.from(context);

		// Set models.
		this.models = new ArrayList<>(models);

		setHasStableIds(true);
	}

	/**
	 * Get number of items in list.
	 *
	 * @return Integer of item count.
	 */
	@Override
	public int getItemCount()
	{
		return this.models.size();
	}

	/**
	 * Get unique item identifier.
	 *
	 * @param position Index position of item to obtain identifier.
	 * @return Long of item identifier.
	 */
	@Override
	public long getItemId(int position)
	{
		return this.models.get(position).hashCode();
	}

	/**
	 * Get adapter context.
	 *
	 * @return Context
	 */
	public Context getContext()
	{
		return this.context;
	}

	/**
	 * Get selection tracker object.
	 *
	 * @return Selection tracker.
	 */
	public SelectionTracker getTracker()
	{
		return this.tracker;
	}

	/**
	 * Set selection tracker for adapter.
	 *
	 * @param tracker Selection tracker.
	 */
	public void setTracker(SelectionTracker tracker)
	{
		this.tracker = tracker;
	}

	/**
	 * Replace models in adapter.
	 *
	 * @param newModels Replacement models.
	 */
	public void update(List<V> newModels, boolean force)
	{
		final var newModelsClone = new ArrayList<>(newModels);

		if (force) {

			// Update models.
			this.models = newModelsClone;

			// Update adapter for all models.
			notifyDataSetChanged();

			return;
		}

		final var diffResult = DiffUtil.calculateDiff(new TableViewDiffCallback(newModelsClone, this.models));

		// Update models.
		this.models = newModelsClone;

		// Update adapter based on diff.
		diffResult.dispatchUpdatesTo(this);
	}

	/**
	 * Define DiffUtil.Callback to optimize updating the adapter.
	 */
	private class TableViewDiffCallback extends DiffUtil.Callback
	{

		List<V> newViews;
		List<V> oldViews;

		public TableViewDiffCallback(List<V> newViews, List<V> oldViews)
		{
			this.newViews = newViews;
			this.oldViews = oldViews;
		}

		@Override
		public int getOldListSize()
		{
			return oldViews.size();
		}

		@Override
		public int getNewListSize()
		{
			return newViews.size();
		}

		@Override
		public boolean areItemsTheSame(int oldItemPosition, int newItemPosition)
		{

			if (oldViews.size() <= oldItemPosition || newViews.size() <= newItemPosition) {
				return false;
			}
			final V oldView = oldViews.get(oldItemPosition);
			final V newView = newViews.get(newItemPosition);

			if (oldView == null || newView == null) {
				return false;
			}

			return oldView.equals(newView);
		}

		@Override
		public boolean areContentsTheSame(int oldItemPosition, int newItemPosition)
		{
			if (oldViews.size() <= oldItemPosition || newViews.size() <= newItemPosition) {
				return false;
			}
			final V oldView = oldViews.get(oldItemPosition);
			final V newView = newViews.get(newItemPosition);

			if (oldView == null || newView == null) {
				return false;
			}

			// Calculate content specific hashes.
			// Compare properties and children.
			final long oldHash = ((long) oldView.getProperties().hashCode()) ^ Arrays.hashCode(oldView.getChildren());
			final long newHash = ((long) newView.getProperties().hashCode()) ^ Arrays.hashCode(newView.getChildren());

			// Update hash cache
			final Long oldCachedHash = modelHashCache.get(oldView);
			final Long newCachedHash = modelHashCache.get(newView);

			modelHashCache.put(oldView, oldHash);
			modelHashCache.put(newView, newHash);

			// If both items are the same proxy (areItemsTheSame returned true),
			// compare cached hash to detect content changes.
			if (oldView == newView) {
				return oldCachedHash != null && oldCachedHash == oldHash;
			}

			return oldHash == newHash;
		}
	}
}
