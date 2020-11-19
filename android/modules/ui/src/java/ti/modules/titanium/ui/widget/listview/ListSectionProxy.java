/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
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
		TiC.PROPERTY_HEADER_VIEW,
		TiC.PROPERTY_ITEMS
	})
public class ListSectionProxy extends TiViewProxy
{
	private static final String TAG = "ListSectionProxy";

	protected List<ListItemProxy> items = new ArrayList<>();

	private int filteredItemCount = -1;

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
		final List<ListItemProxy> items = processItems(dataItems);

		for (final ListItemProxy item : items) {

			// Add to current items.
			this.items.add(item);
		}

		// Notify ListView of new items.
		update();
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
		for (int i = 0; i < count; i++) {
			final ListItemProxy item = this.items.get(index);

			// Remove item.
			item.setParent(null);
			this.items.remove(item);
		}

		// Notify ListView of deleted items.
		update();
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
	@Kroll.method
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

	/**
	 * Obtain ListItemProxy from index in section.
	 *
	 * @param index Integer of index to obtain ListItemProxy from.
	 * @return ListItemProxy
	 */
	public ListItemProxy getListItemAt(int index)
	{
		return this.items.get(index);
	}

	/**
	 * Obtain ListItemProxy index in section.
	 *
	 * @param item ListItemProxy of item to obtain index of.
	 * @return Integer of index.
	 */
	public int getListItemIndex(ListItemProxy item)
	{
		return this.items.indexOf(item);
	}

	/**
	 * Obtain current items in section.
	 *
	 * @return ArrayList of ListItemProxy in section.
	 */
	public List<ListItemProxy> getListItems()
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
		final List<ListItemProxy> items = processItems(dataItems);

		// Insert items at specified index.
		this.items.addAll(index, items);

		// Notify ListView of new items.
		update();
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
	 * Process ListDataItem dictionary into ListItemProxy.
	 *
	 * @param object ListDataItem or ListItemProxy.
	 * @return ListItemProxy
	 */
	private ListItemProxy processItem(Object object)
	{
		if (object instanceof HashMap) {

			// Create ListItem from ListItemData.
			final ListItemProxy item = new ListItemProxy();

			item.setParent(this);
			item.handleCreationDataItem(new KrollDict((HashMap) object));
			return item;

		} else if (object instanceof ListItemProxy) {
			final ListItemProxy item = (ListItemProxy) object;

			item.setParent(this);
			return item;
		}

		return null;
	}

	/**
	 * Process ListDataItem array into ListItemProxy array.
	 *
	 * @param objects ListDataItem array to process.
	 * @return ArrayList of ListItemProxy items.
	 */
	private List<ListItemProxy> processItems(Object objects)
	{
		final List<ListItemProxy> items = new ArrayList<>();

		if (objects instanceof Object[]) {
			for (final Object object : (Object[]) objects) {
				final ListItemProxy item = processItem(object);

				if (item != null) {
					items.add(item);
				}
			}
		} else if (objects instanceof Object) {
			final ListItemProxy item = processItem(objects);

			if (item != null) {
				items.add(item);
			}
		}

		return items;
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
		for (final ListItemProxy item : this.items) {

			// Release all section item views.
			item.releaseViews();
		}
	}

	/**
	 * Remove all items from section.
	 */
	private void removeAllItems()
	{
		for (final ListItemProxy item : this.items) {
			item.setParent(null);
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
		removeAllItems();

		final List<ListItemProxy> items = processItems(dataItems);
		this.items.addAll(items);

		// Notify ListView of new items.
		update();
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
	 * Notify ListView to update all adapter items.
	 */
	private void update()
	{
		final ListViewProxy listViewProxy = getListViewProxy();

		if (listViewProxy != null) {
			listViewProxy.update();
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
		final ListItemProxy item = processItem(dataItem);

		if (item != null) {
			this.items.set(index, item);

			// Notify ListView of new items.
			update();
		}
	}
}
