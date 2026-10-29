/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy(creatableInModule = ti.modules.titanium.ui.UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_FOOTER_TITLE,
		TiC.PROPERTY_FOOTER_VIEW,
		TiC.PROPERTY_HEADER_TITLE,
		TiC.PROPERTY_HEADER_VIEW
	})
public class ListSectionProxy extends TiViewProxy
{
	private static final String TAG = "ListSectionProxy";

	protected final List<ListItemEntry> items = new ArrayList<>();

	private int filteredItemCount = -1;
	private boolean shouldUpdate = true;

	public ListSectionProxy()
	{
		super();
	}

	/**
	 * Append ListDataItem array to items.
	 *
	 * @param dataItems ListDataItems to append.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void appendItems(Object dataItems, @Kroll.argument(optional = true) KrollDict animation)
	{
		final List<ListItemEntry> items = processItems(dataItems);

		// Add to current items.
		final int start = this.items.size();
		this.items.addAll(items);
		reindex(start);

		// Notify ListView of new items.
		notifyItemsInserted(start, items.size());
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		// No view.
		// We are making use of additional features TiViewProxy offers over KrollProxy.
		return null;
	}

	/**
	 * Delete number of items at specified index.
	 *
	 * @param index     Index to start item deletion from.
	 * @param count     Number of items to delete.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void deleteItemsAt(int index, int count, @Kroll.argument(optional = true) KrollDict animation)
	{
		final List<ListItemEntry> removedEntries = new ArrayList<>(Math.max(count, 0));
		for (int i = 0; i < count; i++) {
			final ListItemEntry entry = this.items.get(index);

			// Remove item.
			this.items.remove(index);
			entry.setSection(null);
			removedEntries.add(entry);
		}
		reindex(index);

		// Notify ListView of deleted items.
		notifyItemsDeleted(index, removedEntries);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ListSection";
	}

	/**
	 * Get number of filtered items in section.
	 *
	 * @return Integer of section item count after search filter.
	 */
	@Kroll.getProperty
	public int getFilteredItemCount()
	{
		if (this.filteredItemCount != -1) {
			return this.filteredItemCount;
		}

		return getItemCount();
	}

	/**
	 * Sets the activity this proxy's view should be attached to.
	 * @param activity The activity this proxy's view should be attached to.
	 */
	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);

		// Update activity of header/footer views.
		if (hasPropertyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {
			final Object headerObject = getProperty(TiC.PROPERTY_HEADER_VIEW);
			if (headerObject instanceof TiViewProxy headerProxy) {
				headerProxy.setActivity(activity);
			}
		}
		if (hasPropertyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {
			final Object footerObject = getProperty(TiC.PROPERTY_FOOTER_VIEW);
			if (footerObject instanceof TiViewProxy footerProxy) {
				footerProxy.setActivity(activity);
			}
		}

		// Only rows that have been displayed have a proxy. The rest pick up the activity when created.
		for (final ListItemEntry entry : this.items) {
			final ListItemProxy item = entry.peekProxy();
			if (item != null) {
				item.setActivity(activity);
			}
		}
	}

	/**
	 * Set number of items that are filtered in section.
	 *
	 * @param filteredItemCount Number of filtered items.
	 */
	public void setFilteredItemCount(int filteredItemCount)
	{
		this.filteredItemCount = filteredItemCount;
	}

	/**
	 * Get item at specified index.
	 *
	 * @param index Index to obtain ListDataItem from.
	 * @return ListDataItem
	 */
	@Kroll.method
	public KrollDict getItemAt(int index)
	{
		if (index >= 0 && index < this.items.size()) {

			// Return ListDataItem for specified index.
			return this.items.get(index).getDataItem();
		}
		return null;
	}

	/**
	 * Get the entry at specified index without creating its item proxy.
	 *
	 * @param index Index of entry to obtain.
	 * @return ListItemEntry or null if index is out of range.
	 */
	public ListItemEntry getEntryAt(int index)
	{
		if (index >= 0 && index < this.items.size()) {
			return this.items.get(index);
		}
		return null;
	}

	/**
	 * Get number of items in section.
	 *
	 * @return Integer of section item count.
	 */
	@Kroll.getProperty
	public int getItemCount()
	{
		return this.items.size();
	}

	/**
	 * Obtain all items from section.
	 *
	 * @return ListDataItem dictionary array.
	 */
	@Kroll.getProperty
	public KrollDict[] getItems()
	{
		final KrollDict[] dataItems = new KrollDict[this.items.size()];

		for (int i = 0; i < dataItems.length; i++) {

			// Place data item dictionary into array.
			dataItems[i] = this.items.get(i).getDataItem();
		}

		return dataItems;
	}

	@Kroll.setProperty
	public void setItems(Object value)
	{
		setItems(value, null);
	}

	/**
	 * Obtain ListItemProxy from index in section, creating it if the row was never displayed.
	 * Prefer getEntryAt() or peekListItemAt() when the proxy is not strictly required.
	 *
	 * @param index Integer of index to obtain ListItemProxy from.
	 * @return ListItemProxy or null if index is out of range.
	 */
	public ListItemProxy getListItemAt(int index)
	{
		final ListItemEntry entry = getEntryAt(index);
		return (entry != null) ? entry.getProxy() : null;
	}

	/**
	 * Obtain ListItemProxy from index in section without creating it.
	 *
	 * @param index Integer of index to obtain ListItemProxy from.
	 * @return ListItemProxy or null if index is out of range or the row was never displayed.
	 */
	public ListItemProxy peekListItemAt(int index)
	{
		final ListItemEntry entry = getEntryAt(index);
		return (entry != null) ? entry.peekProxy() : null;
	}

	/**
	 * Obtain entry index in section.
	 *
	 * @param entry Entry to obtain index of.
	 * @return Integer of index or -1 if not found.
	 */
	public int getListItemIndex(ListItemEntry entry)
	{
		if (entry == null) {
			return -1;
		}

		// Use cached index when still valid. Falls back to a linear search otherwise.
		final int index = entry.getIndexInSection();
		if ((index >= 0) && (index < this.items.size()) && (this.items.get(index) == entry)) {
			return index;
		}
		return this.items.indexOf(entry);
	}

	/**
	 * Obtain ListItemProxy index in section.
	 *
	 * @param item ListItemProxy of item to obtain index of.
	 * @return Integer of index or -1 if not found.
	 */
	public int getListItemIndex(ListItemProxy item)
	{
		return (item != null) ? getListItemIndex(item.getEntry()) : -1;
	}

	/**
	 * Obtain current entries in section.
	 *
	 * @return List of ListItemEntry in section.
	 */
	public List<ListItemEntry> getEntries()
	{
		return this.items;
	}

	/**
	 * Obtain parent ListView proxy.
	 *
	 * @return ListViewProxy
	 */
	public ListViewProxy getListViewProxy()
	{
		TiViewProxy parent = getParent();
		while (!(parent instanceof ListViewProxy) && parent != null) {

			// Traverse up until parent is reached.
			parent = parent.getParent();
		}
		return (ListViewProxy) parent;
	}

	/**
	 * Insert items at specified index.
	 *
	 * @param index     Index to start insert from.
	 * @param dataItems ListDataItems to insert.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void insertItemsAt(int index, Object dataItems, @Kroll.argument(optional = true) KrollDict animation)
	{
		final List<ListItemEntry> items = processItems(dataItems);

		// Insert items at specified index.
		this.items.addAll(index, items);
		reindex(index);

		// Notify ListView of new items.
		notifyItemsInserted(index, items.size());
	}

	/**
	 * Process new property value upon change.
	 *
	 * @param name  Property name.
	 * @param value New property value.
	 */
	@Override
	public void onPropertyChanged(String name, Object value)
	{
		super.onPropertyChanged(name, value);

		processProperty(name, value);
	}

	/**
	 * Process ListDataItem dictionary into a section entry.
	 * The ListItemProxy is not created here. It is created when the row is displayed.
	 *
	 * @param object ListDataItem, ListItemProxy or ListItemEntry.
	 * @return ListItemEntry
	 */
	private ListItemEntry processItem(Object object)
	{
		ListItemEntry entry = null;

		if (object instanceof HashMap) {

			// Keep the raw ListDataItem. A ListItem proxy is only created when the row is shown.
			entry = new ListItemEntry((HashMap<String, Object>) object);

		} else if (object instanceof ListItemProxy item) {

			// Re-use the item's existing entry if it is not attached to a section anymore,
			// which keeps its identity when moved between sections.
			final ListItemEntry existingEntry = item.getEntry();
			entry = (existingEntry != null && existingEntry.getSection() == null)
				? existingEntry : new ListItemEntry(item);

		} else if (object instanceof ListItemEntry existingEntry) {

			entry = existingEntry;
		}

		if (entry != null) {
			entry.setSection(this);
		}
		return entry;
	}

	/**
	 * Process ListDataItem array into section entries.
	 *
	 * @param objects ListDataItem array to process.
	 * @return ArrayList of ListItemEntry items.
	 */
	private List<ListItemEntry> processItems(Object objects)
	{
		final List<ListItemEntry> items;

		if (objects instanceof Object[] objectArray) {
			items = new ArrayList<>(objectArray.length);
			for (final Object object : objectArray) {
				final ListItemEntry entry = processItem(object);

				if (entry != null) {
					items.add(entry);
				}
			}
		} else {
			items = new ArrayList<>(1);
			final ListItemEntry entry = processItem(objects);

			if (entry != null) {
				items.add(entry);
			}
		}

		return items;
	}

	/**
	 * Refresh the cached section index of all entries from the given position onward.
	 *
	 * @param from Index to start from.
	 */
	private void reindex(int from)
	{
		for (int i = Math.max(from, 0); i < this.items.size(); i++) {
			this.items.get(i).setIndexInSection(i);
		}
	}

	/**
	 * Process properties.
	 *
	 * @param name  Property name.
	 * @param value Property value.
	 */
	private void processProperty(String name, Object value)
	{
		if (name.equals(TiC.PROPERTY_ITEMS)) {

			// Set new section items.
			setItems(value, null);

		} else if (name.equals(TiC.PROPERTY_HEADER_VIEW) || name.equals(TiC.PROPERTY_FOOTER_VIEW)) {
			if (value instanceof TiViewProxy view) {

				view.setActivity(getActivity());
				view.setParent(this);
			}
		}
	}

	/**
	 * Release all views and items.
	 */
	@Override
	public void release()
	{
		releaseViews();
		removeAllItems();

		super.release();
	}

	/**
	 * Release views to reclaim memory.
	 */
	@Override
	public void releaseViews()
	{
		// Release all section item views. Rows that were never displayed have nothing to release.
		for (final ListItemEntry entry : this.items) {
			final ListItemProxy item = entry.peekProxy();
			if (item != null) {
				item.releaseViews();
			}
		}

		// Release header/footer views.
		if (hasPropertyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {
			final TiViewProxy headerProxy = (TiViewProxy) getProperty(TiC.PROPERTY_HEADER_VIEW);
			headerProxy.releaseViews();
		}
		if (hasPropertyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {
			final TiViewProxy footerProxy = (TiViewProxy) getProperty(TiC.PROPERTY_FOOTER_VIEW);
			footerProxy.releaseViews();
		}
	}

	/**
	 * Remove all items from section.
	 */
	private void removeAllItems()
	{
		for (final ListItemEntry entry : this.items) {
			entry.setSection(null);
		}
		this.items.clear();
	}

	/**
	 * Replace number of items at a specified index.
	 *
	 * @param index     Index of items to replace.
	 * @param count     Number of items to replace.
	 * @param dataItems ListDataItems to be used as replacements.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void replaceItemsAt(int index, int count, Object dataItems,
							   @Kroll.argument(optional = true) KrollDict animation)
	{
		// Both operations notify the ListView of their exact range, so no combined update is needed.
		deleteItemsAt(index, count, null);
		insertItemsAt(index, dataItems, null);
	}

	/**
	 * Set new section items.
	 *
	 * @param dataItems ListDataItems to set.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void setItems(Object dataItems, @Kroll.argument(optional = true) KrollDict animation)
	{
		final List<ListItemEntry> newItems = processItems(dataItems);
		final List<ListItemEntry> oldItems = new ArrayList<>(this.items);

		removeAllItems();
		this.items.addAll(newItems);
		reindex(0);

		// Notify ListView of new items.
		notifyItemsSet(oldItems);
	}

	/**
	 * Process properties set.
	 *
	 * @param name  Property name.
	 * @param value Property value.
	 */
	@Override
	public void setProperty(String name, Object value)
	{
		super.setProperty(name, value);

		processProperty(name, value);
	}

	/**
	 * String definition of proxy instance.
	 */
	@Override
	public String toString()
	{
		return "[object ListSectionProxy]";
	}

	/**
	 * Notify ListView that items were inserted into this section.
	 * The ListView updates its adapter for exactly that range, or rebuilds if it cannot.
	 */
	private void notifyItemsInserted(int index, int count)
	{
		if (!shouldUpdate || (count <= 0)) {
			return;
		}
		final ListViewProxy listViewProxy = getListViewProxy();
		if (listViewProxy != null) {
			listViewProxy.onSectionItemsInserted(this, index, count);
		}
	}

	/**
	 * Notify ListView that items were removed from this section.
	 */
	private void notifyItemsDeleted(int index, List<ListItemEntry> removedEntries)
	{
		if (!shouldUpdate || removedEntries.isEmpty()) {
			return;
		}
		final ListViewProxy listViewProxy = getListViewProxy();
		if (listViewProxy != null) {
			listViewProxy.onSectionItemsDeleted(this, index, removedEntries);
		}
	}

	/**
	 * Notify ListView that a single item of this section was replaced.
	 */
	private void notifyItemReplaced(ListItemEntry previousEntry, ListItemEntry newEntry)
	{
		if (!shouldUpdate) {
			return;
		}
		final ListViewProxy listViewProxy = getListViewProxy();
		if (listViewProxy != null) {
			listViewProxy.onSectionItemReplaced(this, previousEntry, newEntry);
		}
	}

	/**
	 * Notify ListView that all items of this section were replaced.
	 */
	private void notifyItemsSet(List<ListItemEntry> previousEntries)
	{
		if (!shouldUpdate) {
			return;
		}
		final ListViewProxy listViewProxy = getListViewProxy();
		if (listViewProxy != null) {
			listViewProxy.onSectionItemsSet(this, previousEntries);
		}
	}

	/**
	 * Update item at specified index.
	 *
	 * @param index     Index of item to update.
	 * @param dataItem  ListDataItem to be used.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void updateItemAt(int index, Object dataItem, @Kroll.argument(optional = true) KrollDict animation)
	{
		final ListItemEntry entry = processItem(dataItem);

		if (entry != null) {
			final ListItemEntry previousEntry = this.items.set(index, entry);
			if ((previousEntry != null) && (previousEntry != entry)) {
				previousEntry.setSection(null);
			}
			entry.setIndexInSection(index);

			// Notify ListView of replaced item.
			notifyItemReplaced(previousEntry, entry);
		}
	}
}
