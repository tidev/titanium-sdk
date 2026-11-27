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

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.proxy.TiViewProxy;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Set;

/**
 * Base adapter shared by ListView and TableView.
 *
 * @param <VH> View holder type.
 * @param <V> Model type. Usually a proxy, but ListView uses lightweight {@link ListItemEntry} records.
 */
public abstract class TiRecyclerViewAdapter<VH extends RecyclerView.ViewHolder, V>
	extends RecyclerView.Adapter<VH>
{
	protected Context context;
	protected int id_holder;
	protected LayoutInflater inflater;
	protected List<V> models;
	protected SelectionTracker tracker;

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

		// DiffUtil costs O(N * D) where D is the number of changes. When nothing can be re-used,
		// a full refresh is both cheaper and equivalent.
		if (force || this.models.isEmpty() || newModelsClone.isEmpty() || !sharesAnyModel(newModelsClone)) {

			// Update models.
			this.models = newModelsClone;

			// Update adapter for all models.
			notifyDataSetChanged();

			return;
		}

		final var diffResult = DiffUtil.calculateDiff(new AsyncListDiffer(newModelsClone, this.models));

		// Update models.
		this.models = newModelsClone;

		// Update adapter based on diff.
		diffResult.dispatchUpdatesTo(this);
	}

	/**
	 * Determine if at least one of the given models is currently in the adapter.
	 * Compares by identity, which is what areItemsTheSame() defaults to for proxies and entries.
	 */
	private boolean sharesAnyModel(List<V> newModels)
	{
		final Set<V> current = Collections.newSetFromMap(new IdentityHashMap<>(this.models.size()));
		current.addAll(this.models);
		for (V model : newModels) {
			if (current.contains(model)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Insert models at the given position and notify the RecyclerView of exactly that range.
	 * Must be called on the UI thread.
	 */
	public void insertModels(int position, @NonNull List<V> newModels)
	{
		if (newModels.isEmpty()) {
			return;
		}
		this.models.addAll(position, newModels);
		notifyItemRangeInserted(position, newModels.size());
	}

	/**
	 * Remove models at the given position and notify the RecyclerView of exactly that range.
	 * Must be called on the UI thread.
	 */
	public void removeModels(int position, int count)
	{
		if (count <= 0) {
			return;
		}
		this.models.subList(position, position + count).clear();
		notifyItemRangeRemoved(position, count);
	}

	/**
	 * Replace the model at the given position and notify the RecyclerView to re-bind it.
	 * Must be called on the UI thread.
	 */
	public void replaceModel(int position, @NonNull V model)
	{
		this.models.set(position, model);
		notifyItemChanged(position);
	}

	/**
	 * Notify the RecyclerView to re-bind the row at the given position, if it is a valid position.
	 */
	public void refreshModel(int position)
	{
		if ((position >= 0) && (position < this.models.size())) {
			notifyItemChanged(position);
		}
	}

	/**
	 * Determine if two models represent the same row. Used by DiffUtil to detect moves/removals.
	 * Defaults to equality.
	 */
	protected boolean areItemsTheSame(@NonNull V oldModel, @NonNull V newModel)
	{
		return oldModel.equals(newModel);
	}

	/**
	 * Determine if two models representing the same row have the same content.
	 * Used by DiffUtil to decide whether a visible row must be re-bound.
	 * Defaults to comparing proxy properties and children for proxies, identity otherwise.
	 */
	protected boolean areContentsTheSame(@NonNull V oldModel, @NonNull V newModel)
	{
		if ((oldModel instanceof TiViewProxy oldProxy) && (newModel instanceof TiViewProxy newProxy)) {
			final KrollDict oldProperties = oldProxy.getProperties();
			final KrollDict newProperties = newProxy.getProperties();

			if (oldProperties == null || newProperties == null) {
				return false;
			}

			// Calculate content specific hashes.
			// Compare properties and children.
			final long oldHash = oldProperties.hashCode() ^ Arrays.hashCode(oldProxy.getChildren());
			final long newHash = newProperties.hashCode() ^ Arrays.hashCode(newProxy.getChildren());

			return oldHash == newHash;
		}
		return oldModel == newModel;
	}

	/**
	 * Define DiffUtil.Callback to optimize updating the adapter.
	 */
	private class AsyncListDiffer extends DiffUtil.Callback
	{

		List<V> newViews;
		List<V> oldViews;

		public AsyncListDiffer(List<V> newViews, List<V> oldViews)
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

			return TiRecyclerViewAdapter.this.areItemsTheSame(oldView, newView);
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

			return TiRecyclerViewAdapter.this.areContentsTheSame(oldView, newView);
		}
	}
}
