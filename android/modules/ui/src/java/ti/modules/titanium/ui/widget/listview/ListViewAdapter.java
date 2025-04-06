/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import java.util.LinkedList;
import java.util.List;
import java.util.TreeMap;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiRHelper;

import android.content.Context;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.constraintlayout.widget.ConstraintLayout;

public class ListViewAdapter extends TiRecyclerViewAdapter<ListViewHolder, ListItemProxy>
{
	private static final String TAG = "ListViewAdapter";

	private final TreeMap<String, LinkedList<ListItemProxy>> recyclableItemsMap = new TreeMap<>();

	public ListViewAdapter(@NonNull Context context, @NonNull List<ListItemProxy> models)
	{
		super(context, models);

		// Obtain TableViewHolder layout identifier.
		try {
			if (this.id_holder == 0) {
				this.id_holder = TiRHelper.getResource("layout.titanium_ui_listview_holder");
			}
		} catch (TiRHelper.ResourceNotFoundException e) {
			Log.e(TAG, "Could not load 'layout.titanium_ui_listview_holder'.");
		}
	}

	/**
	 * Get unique integer identifier of the template the item uses.
	 * This tells the RecyclerView to only bind scrolled-in items to holders of the same type/template.
	 * @param position Index position of item to obtain identifier.
	 * @return Unique integer ID of the template the item uses.
	 */
	@Override
	public int getItemViewType(int position)
	{
		ListItemProxy proxy = this.models.get(position);
		if (proxy != null) {
			String templateId = proxy.getTemplateId();
			if (templateId != null) {
				return templateId.hashCode();
			}
		}
		return 0;
	}

	/**
	 * Bind item to holder.
	 * This is the listener that updates our list holders to the correct items.
	 *
	 * @param holder Holder to bind.
	 * @param position Position of item in list.
	 */
	@Override
	public void onBindViewHolder(@NonNull ListViewHolder holder, int position)
	{
		// Fetch item proxy for given list position.
		final ListItemProxy item = this.models.get(position);
		final boolean selected = this.tracker != null ? this.tracker.isSelected(item) : false;

		// Check if we have any recyclable items for the current template.
		LinkedList<ListItemProxy> recyclableItems = this.recyclableItemsMap.get(item.getTemplateId());
		if (recyclableItems != null) {
			// If item is in recycle collection, then remove it.
			recyclableItems.remove(item);

			// If item has no child proxies/views, then take the children from a recyclable item.
			// This significantly boosts scroll performance by avoiding creating new views.
			if (!item.hasChildren()) {
				while (!recyclableItems.isEmpty()) {
					ListItemProxy oldItem = recyclableItems.poll();
					if ((oldItem != null) && (oldItem.getHolder() == null) && oldItem.hasChildren()) {
						oldItem.moveChildrenTo(item);
						break;
					}
				}
			}
		}

		// Notify item of its selected status.
		// This is necessary to maintain selection status on theme change.
		item.setSelected(selected);

		// Update ListViewHolder with new model data.
		holder.bind(item, selected);
	}

	/**
	 * Create new holder.
	 * This listener creates new holders which are used to bind with.
	 *
	 * @param parent Parent view.
	 * @param viewType Type of view.
	 * @return ListViewHolder.
	 */
	@Override
	public ListViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType)
	{
		// Create new TableViewHolder instance.
		final ConstraintLayout layout = (ConstraintLayout) inflater.inflate(id_holder, null);
		return new ListViewHolder(parent.getContext(), layout);
	}

	/**
	 * Recycle holder for future binding.
	 * This is used when holders are scrolled out of visibility.
	 *
	 * @param holder
	 */
	@Override
	public void onViewRecycled(@NonNull ListViewHolder holder)
	{
		super.onViewRecycled(holder);

		TiViewProxy view = holder.getProxy();
		if (view instanceof ListItemProxy) {
			// Add item to recycle list so that it's child proxies/views can be re-used by another item.
			ListItemProxy item = (ListItemProxy) view;
			if (item.hasChildren() && (item.getHolder() == holder)) {
				LinkedList<ListItemProxy> recyclableItems = this.recyclableItemsMap.get(item.getTemplateId());
				if (recyclableItems == null) {
					recyclableItems = new LinkedList<>();
					this.recyclableItemsMap.put(item.getTemplateId(), recyclableItems);
				}
				if (!recyclableItems.contains(item)) {
					item.setSelected(false);
					item.setHolder(null);
					recyclableItems.add(item);
				}
			}
		} else if (view != null) {
			// Release the native views for all other proxy types.
			view.releaseViews();
		}
	}
}
