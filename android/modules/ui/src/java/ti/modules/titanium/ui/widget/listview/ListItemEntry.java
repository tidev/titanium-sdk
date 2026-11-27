/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import android.app.Activity;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import java.util.HashMap;

import ti.modules.titanium.ui.UIModule;

/**
 * Lightweight record for one row of a ListView.
 * <p>
 * A ListSection stores one entry per row and the adapter's flat item list is built from these.
 * An entry holds the raw "ListDataItem" dictionary handed over from JavaScript and only creates
 * the much heavier {@link ListItemProxy} (which in turn creates a JavaScript object and the
 * template's child proxies) when the row is scrolled into view or explicitly requested.
 * This keeps memory usage and the cost of setItems()/appendItems() proportional to the rows
 * that are actually displayed rather than to the size of the data set.
 * <p>
 * Entries are compared by identity. Replacing a row's data replaces its entry.
 */
public final class ListItemEntry
{
	/**
	 * Raw ListDataItem dictionary. Set to null once the proxy has been created.
	 * Readers must snapshot this field first: it is only cleared after "proxy" has been assigned,
	 * so a null here guarantees a non-null proxy.
	 */
	private volatile HashMap<String, Object> data;

	/** Materialized item proxy. Null until first requested via getProxy(). */
	private volatile ListItemProxy proxy;

	/** Section this entry belongs to. Null for ListView level placeholders and detached entries. */
	private ListSectionProxy section;

	/** Cached template ID. Resolved lazily from the data item or the ListView's default template. */
	private String templateId;

	private boolean hasResolvedSearchInfo = false;
	private String searchableText;
	private String searchableTextLower;
	private boolean filterAlwaysInclude = false;

	/** Position in the adapter's flat list. -1 when not currently in the list (e.g. filtered out). */
	private int adapterIndex = -1;

	/** Position within the owning section. Maintained by ListSectionProxy. */
	private int indexInSection = -1;

	/** Position within the owning section after search filtering. -1 when not filtering. */
	private int filteredIndex = -1;

	/**
	 * Creates an entry from a raw ListDataItem dictionary. The proxy is created on demand.
	 *
	 * @param data ListDataItem dictionary as received from JavaScript.
	 */
	public ListItemEntry(@NonNull HashMap<String, Object> data)
	{
		this.data = data;
	}

	/**
	 * Creates an entry wrapping an already existing proxy, such as a ListItem created by JavaScript,
	 * a header/footer placeholder, or an item being moved between sections.
	 *
	 * @param proxy Existing item proxy.
	 */
	public ListItemEntry(@NonNull ListItemProxy proxy)
	{
		this.proxy = proxy;
		proxy.setEntry(this);
	}

	/**
	 * Returns the proxy if it has been created, without creating it.
	 */
	@Nullable
	public ListItemProxy peekProxy()
	{
		return this.proxy;
	}

	/**
	 * Returns the item proxy, creating it from the raw data item on first call.
	 * <p>
	 * Safe to call from any thread. The proxy's JavaScript object is created asynchronously
	 * on the runtime thread, so this never blocks the UI thread.
	 */
	@NonNull
	public synchronized ListItemProxy getProxy()
	{
		if (this.proxy == null) {
			final ListItemProxy newProxy = new ListItemProxy();
			newProxy.setEntry(this);
			if (this.section != null) {
				newProxy.setParent(this.section);
				final Activity activity = this.section.getActivity();
				if (activity != null) {
					newProxy.setActivity(activity);
				}
			}
			newProxy.handleCreationDataItem(new KrollDict(this.data));

			// Publish the proxy before clearing the raw data so readers never see both as null.
			this.proxy = newProxy;
			this.data = null;
		}
		return this.proxy;
	}

	/**
	 * Returns the ListDataItem dictionary for this row, as exposed to JavaScript via
	 * ListSection.items / getItemAt().
	 */
	@NonNull
	public KrollDict getDataItem()
	{
		final HashMap<String, Object> rawData = this.data;
		if (rawData == null) {
			return this.proxy.getDataItem();
		}

		// Row has never been displayed. Return the data as given, normalized to always
		// carry "properties" and the resolved "template" like a materialized item would.
		final KrollDict dataItem = new KrollDict(rawData);
		if (!(dataItem.get(TiC.PROPERTY_PROPERTIES) instanceof HashMap)) {
			dataItem.put(TiC.PROPERTY_PROPERTIES, new KrollDict());
		}
		dataItem.put(TiC.PROPERTY_TEMPLATE, getTemplateId());
		return dataItem;
	}

	/**
	 * Returns the ID of the template this row uses. Never null.
	 */
	@NonNull
	public String getTemplateId()
	{
		if (this.templateId != null) {
			return this.templateId;
		}

		final HashMap<String, Object> rawData = this.data;
		if (rawData == null) {
			final String id = this.proxy.getTemplateId();
			if (id != null) {
				this.templateId = id;
				return id;
			}
			return UIModule.LIST_ITEM_TEMPLATE_DEFAULT;
		}

		// Same resolution order as ListItemProxy: item "template", then "properties.template",
		// then the ListView's "defaultItemTemplate".
		String id = TiConvert.toString(rawData.get(TiC.PROPERTY_TEMPLATE));
		if (id == null) {
			final HashMap<String, Object> properties = getRawProperties(rawData);
			if (properties != null) {
				id = TiConvert.toString(properties.get(TiC.PROPERTY_TEMPLATE));
			}
		}
		if (id == null) {
			final ListViewProxy listViewProxy = getListViewProxy();
			if (listViewProxy == null) {
				// Not attached to a ListView yet. Don't cache, the default may still change.
				return UIModule.LIST_ITEM_TEMPLATE_DEFAULT;
			}
			id = listViewProxy.getProperties().optString(
				TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE, UIModule.LIST_ITEM_TEMPLATE_DEFAULT);
		}
		this.templateId = id;
		return id;
	}

	/**
	 * Returns the row's "searchableText" property or null if not set.
	 */
	@Nullable
	public String getSearchableText()
	{
		final HashMap<String, Object> rawData = this.data;
		if (rawData == null) {
			return this.proxy.getProperties().optString(TiC.PROPERTY_SEARCHABLE_TEXT, null);
		}
		resolveSearchInfo(rawData);
		return this.searchableText;
	}

	/**
	 * Returns the row's "searchableText" property in lower case or null if not set.
	 */
	@Nullable
	public String getSearchableTextLower()
	{
		final HashMap<String, Object> rawData = this.data;
		if (rawData == null) {
			return this.proxy.getSearchableTextLower();
		}
		resolveSearchInfo(rawData);
		return this.searchableTextLower;
	}

	/**
	 * Determines if the row should always be shown while a search filter is active.
	 */
	public boolean isFilterAlwaysInclude()
	{
		final HashMap<String, Object> rawData = this.data;
		if (rawData == null) {
			return this.proxy.getProperties().optBoolean(TiC.PROPERTY_FILTER_ALWAYS_INCLUDE, false);
		}
		resolveSearchInfo(rawData);
		return this.filterAlwaysInclude;
	}

	private void resolveSearchInfo(@NonNull HashMap<String, Object> rawData)
	{
		if (this.hasResolvedSearchInfo) {
			return;
		}
		final HashMap<String, Object> properties = getRawProperties(rawData);
		if (properties != null) {
			this.searchableText = TiConvert.toString(properties.get(TiC.PROPERTY_SEARCHABLE_TEXT));
			if (this.searchableText != null) {
				this.searchableTextLower = this.searchableText.toLowerCase();
			}
			this.filterAlwaysInclude = TiConvert.toBoolean(properties.get(TiC.PROPERTY_FILTER_ALWAYS_INCLUDE), false);
		}
		this.hasResolvedSearchInfo = true;
	}

	@Nullable
	private static HashMap<String, Object> getRawProperties(@NonNull HashMap<String, Object> rawData)
	{
		final Object properties = rawData.get(TiC.PROPERTY_PROPERTIES);
		if (properties instanceof HashMap) {
			return (HashMap<String, Object>) properties;
		}
		return null;
	}

	/**
	 * Determines if this entry is a placeholder used to display a header or footer.
	 */
	public boolean isPlaceholder()
	{
		return (this.proxy != null) && this.proxy.isPlaceholder();
	}

	/**
	 * Determines if the row is currently selected. Rows that were never displayed are never selected.
	 */
	public boolean isSelected()
	{
		return (this.proxy != null) && this.proxy.isSelected();
	}

	@Nullable
	public ListSectionProxy getSection()
	{
		return this.section;
	}

	/**
	 * Attaches this entry to the given section (or detaches it when null) and updates the
	 * proxy's parent accordingly if the proxy exists.
	 */
	public void setSection(@Nullable ListSectionProxy section)
	{
		this.section = section;
		if (section == null) {
			// Keep "adapterIndex": TiListView still needs it to remove a detached entry from
			// the adapter, and it validates the cached index by identity anyway.
			this.indexInSection = -1;
		}
		if (this.proxy != null) {
			this.proxy.setParent(section);
		}
	}

	@Nullable
	public ListViewProxy getListViewProxy()
	{
		if (this.section != null) {
			return this.section.getListViewProxy();
		}
		if (this.proxy != null) {
			return this.proxy.getListViewProxy();
		}
		return null;
	}

	public int getAdapterIndex()
	{
		return this.adapterIndex;
	}

	public void setAdapterIndex(int index)
	{
		this.adapterIndex = index;
	}

	public int getIndexInSection()
	{
		return this.indexInSection;
	}

	public void setIndexInSection(int index)
	{
		this.indexInSection = index;
	}

	public int getFilteredIndex()
	{
		return this.filteredIndex;
	}

	public void setFilteredIndex(int index)
	{
		this.filteredIndex = index;
	}

	@Override
	public String toString()
	{
		return "[object ListItemEntry]";
	}
}
