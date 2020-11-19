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
import org.appcelerator.kroll.KrollEventCallback;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.runtime.v8.V8Function;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.ColorProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.view.View;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.widget.TiView;

@Kroll.proxy(
	creatableInModule = ti.modules.titanium.ui.UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_ACCESSORY_TYPE,
		TiC.PROPERTY_ITEM_ID,
		TiC.PROPERTY_SEARCHABLE_TEXT
	}
)
public class ListItemProxy extends TiViewProxy
{
	private static final String TAG = "ListItemProxy";

	private final HashMap<String, TiViewProxy> binds = new HashMap<>();
	private final HashMap<String, Object> childProperties = new HashMap<>();
	private  final List<String> ignoredTemplateKeys = new ArrayList<>();

	public int index;

	private int filteredIndex = -1;
	private ListViewHolder holder;
	private KrollDict template;
	private String templateId;
	private boolean placeholder = false;

	public ListItemProxy()
	{
		super();

		defaultValues.put(TiC.PROPERTY_ACCESSORY_TYPE, UIModule.LIST_ACCESSORY_TYPE_NONE);
	}

	public ListItemProxy(boolean placeholder)
	{
		this();

		// Determine if item is placeholder for header or footer.
		this.placeholder = placeholder;
	}

	/**
	 * Generate ListItem view from specified template.
	 *
	 * @param activity the context activity.
	 * @return TiUIView of ListItem.
	 */
	@Override
	public TiUIView createView(Activity activity)
	{
		if (placeholder) {

			// Placeholder for header or footer, do not create view.
			return null;
		}

		final ListViewProxy listViewProxy = getListViewProxy();

		if (listViewProxy != null) {
			final KrollDict listViewProperties = listViewProxy.getProperties();
			final KrollDict listViewTemplates = listViewProperties.getKrollDict(TiC.PROPERTY_TEMPLATES);

			if (this.templateId == null) {
				final String defaultTemplateId = listViewProperties.optString(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE,
					UIModule.LIST_ITEM_TEMPLATE_DEFAULT);

				// Attempt to obtain ListItem `template` identifier.
				// If `template` is not set, use default.
				this.templateId = properties.optString(TiC.PROPERTY_TEMPLATE, defaultTemplateId);
			}
			if (listViewTemplates != null && listViewTemplates.containsKey(templateId)) {

				// Obtain specified template for item.
				this.template = listViewTemplates.getKrollDict(templateId);
			}
			if (this.template != null) {

				if (this.children.size() == 0) {

					// Generate view and add children to parent.
					generateViewFromTemplate(this, this.template);
				}

				return new ItemView(this);
			}
		}

		return null;
	}

	/**
	 * Override fireEvent to inject ListItem data into payload.
	 *
	 * @param eventName Name of fired event.
	 * @param data      Data payload of fired event.
	 * @param bubbles   Specify if event should bubble up to parent.
	 * @return
	 */
	@Override
	public boolean fireEvent(String eventName, Object data, boolean bubbles)
	{
		// Inject row data into events.
		final ListViewProxy listViewProxy = getListViewProxy();
		if (listViewProxy != null) {
			final KrollDict payload = data instanceof HashMap
				? new KrollDict((HashMap<String, Object>) data) : new KrollDict();

			final Object parent = getParent();
			if (parent instanceof ListSectionProxy) {
				final ListSectionProxy section = (ListSectionProxy) parent;

				// Include section specific properties.
				payload.put(TiC.PROPERTY_SECTION, section);
				payload.put(TiC.PROPERTY_SECTION_INDEX, listViewProxy.getIndexOfSection(section));
				payload.put(TiC.PROPERTY_ITEM_INDEX, getIndexInSection());
			}

			final String itemId = getProperties().optString(TiC.PROPERTY_ITEM_ID, null);
			if (itemId != null) {

				// Include `itemId` if specified.
				payload.put(TiC.PROPERTY_ITEM_ID, itemId);
			}

			if (this.template.containsKey(TiC.PROPERTY_BIND_ID)) {

				// Include `bindId` of template if specified.
				payload.put(TiC.PROPERTY_BIND_ID, this.template.getString(TiC.PROPERTY_BIND_ID));
			}

			final int accessoryType = getProperties().optInt(TiC.PROPERTY_ACCESSORY_TYPE,
				UIModule.LIST_ACCESSORY_TYPE_NONE);
			final boolean isAccessoryDetail = accessoryType == UIModule.LIST_ACCESSORY_TYPE_DETAIL;

			// If item is `LIST_ACCESSORY_TYPE_DETAIL` then `accessoryClicked` will be `true`.
			payload.put(TiC.EVENT_PROPERTY_ACCESSORY_CLICKED, isAccessoryDetail);

			// Override data with new payload.
			data = payload;

			// Fire `itemclick` event on ListView.
			if (eventName.equals(TiC.EVENT_CLICK)) {
				listViewProxy.fireEvent(TiC.EVENT_ITEM_CLICK, data);
			}
		}

		return super.fireEvent(eventName, data, bubbles);
	}

	/**
	 * Generate views from specified template.
	 *
	 * @param parent   Parent proxy to add child views from template. (Creates new proxy when null)
	 * @param template Template to generate views from.
	 * @return Generated TiViewProxy.
	 */
	protected TiViewProxy generateViewFromTemplate(TiViewProxy parent, KrollDict template)
	{
		final TiViewProxy tiProxy = (TiViewProxy) template.get("tiProxy");
		final KrollDict templateProperties = template.getKrollDict(TiC.PROPERTY_PROPERTIES);
		final Object[] childTemplates = (Object[]) template.get(TiC.PROPERTY_CHILD_TEMPLATES);
		final String bindId = template.getString(TiC.PROPERTY_BIND_ID);
		final KrollDict events = template.getKrollDict(TiC.PROPERTY_EVENTS);

		if (parent == null) {
			try {

				// Parent undefined, create new proxy instance.
				parent = tiProxy.getClass().newInstance();

				final KrollDict properties = new KrollDict(tiProxy.getProperties());

				if (this.childProperties.containsKey(bindId)) {
					final Object childPropertiesObj = this.childProperties.get(bindId);

					if (childPropertiesObj instanceof KrollDict) {
						final KrollDict childProperties = (KrollDict) childPropertiesObj;

						// Include child properties for specified `bindId`.
						properties.putAll(childProperties);
					}
				}

				// Create instance with new properties.
				// NOTE: Calling `getActivity()` initializes activity associated with the proxy.
				parent.getActivity();
				parent.handleCreationArgs(null, new Object[] { properties });

			} catch (Exception e) {
				Log.w(TAG, "Failed to create child proxy instance from template.");
			}
		} else if (templateProperties != null) {

			// Apply template defined properties.
			for (String k : templateProperties.keySet()) {
				if (!ignoredTemplateKeys.contains(k)) {
					parent.setProperty(k, templateProperties.get(k));
				}
			}
		}
		if (bindId != null) {

			// Include new instance binding.
			binds.put(bindId, parent);
		}
		if (events != null) {

			// Iterate through template events.
			for (final String eventName : events.keySet()) {
				final V8Function callback = (V8Function) events.get(eventName);
				final KrollProxy proxy = parent;
				final KrollObject krollObject = parent.getKrollObject();

				// Add template event to item.
				proxy.addEventListener(eventName, new KrollEventCallback()
				{

					@Override
					public void call(Object data)
					{
						if (data instanceof KrollDict) {
							final KrollDict payload = new KrollDict((KrollDict) data);

							// Inject row data into events.
							final ListViewProxy listViewProxy = getListViewProxy();
							if (listViewProxy != null) {

								final Object parent = getParent();
								if (parent instanceof ListSectionProxy) {
									final ListSectionProxy section = (ListSectionProxy) parent;

									// Include section specific properties.
									payload.put(TiC.PROPERTY_SECTION, section);
									payload.put(TiC.PROPERTY_SECTION_INDEX, listViewProxy.getIndexOfSection(section));
									payload.put(TiC.PROPERTY_ITEM_INDEX, getIndexInSection());
								}

								final String itemId = getProperties().optString(TiC.PROPERTY_ITEM_ID, null);
								if (itemId != null) {

									// Include `itemId` if specified.
									payload.put(TiC.PROPERTY_ITEM_ID, itemId);
								}

								if (template.containsKey(TiC.PROPERTY_BIND_ID)) {

									// Include `bindId` of template if specified.
									payload.put(TiC.PROPERTY_BIND_ID, template.getString(TiC.PROPERTY_BIND_ID));
								}
							}

							data = payload;
						}

						// Call callback defined in template.
						callback.call(krollObject, new Object[] { data });
					}
				});
				krollObject.setHasListenersForEventType(eventName, true);
			}
		}

		if (childTemplates != null) {

			// Recursively process child templates.
			for (Object o : childTemplates) {
				if (o instanceof HashMap) {
					final KrollDict childTemplate = new KrollDict((HashMap) o);
					final TiViewProxy childView = generateViewFromTemplate(null, childTemplate);

					parent.add(childView);
				}
			}
		}

		return parent;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ListItem";
	}

	/**
	 * Get ListDataItem dictionary.
	 *
	 * @return KrollDict
	 */
	public KrollDict getDataItem()
	{
		final KrollDict dataItem = new KrollDict();

		// Include child items.
		for (final String key : this.childProperties.keySet()) {
			dataItem.put(key, this.childProperties.get(key));
		}

		// Include properties and template.
		dataItem.put(TiC.PROPERTY_PROPERTIES, getProperties());
		dataItem.put(TiC.PROPERTY_TEMPLATE, getTemplateId());

		return dataItem;
	}

	/**
	 * Get filtered index of row in section.
	 *
	 * @return Integer of filtered index.
	 */
	public int getFilteredIndex()
	{
		return this.filteredIndex;
	}

	/**
	 * Set filtered index of row in section.
	 *
	 * @param index Filtered index to set.
	 */
	public void setFilteredIndex(int index)
	{
		this.filteredIndex = index;
	}

	/**
	 * Get current ListViewHolder for item.
	 *
	 * @return ListViewHolder
	 */
	public ListViewHolder getHolder()
	{
		return this.holder;
	}

	/**
	 * Set new ListViewHolder for item.
	 *
	 * @param holder ListViewHolder to set.
	 */
	public void setHolder(ListViewHolder holder)
	{
		this.holder = holder;
	}

	/**
	 * Get item index in section.
	 *
	 * @return Integer of index.
	 */
	public int getIndexInSection()
	{
		final TiViewProxy parent = getParent();

		if (parent instanceof ListSectionProxy) {
			final ListSectionProxy section = (ListSectionProxy) parent;

			return section.getListItemIndex(this);
		}

		return -1;
	}

	/**
	 * Get related ListView proxy for item.
	 *
	 * @return ListViewProxy
	 */
	public ListViewProxy getListViewProxy()
	{
		TiViewProxy parent = getParent();
		while (!(parent instanceof ListViewProxy) && parent != null) {
			parent = parent.getParent();
		}
		return (ListViewProxy) parent;
	}

	/**
	 * Override getRect() to amend dimensions.
	 *
	 * @return Dictinary of view dimensions.
	 */
	@Override
	public KrollDict getRect()
	{
		final View view = this.holder != null ? this.holder.itemView : null;

		return getViewRect(view);
	}

	/**
	 * Get template identifier associated with item.
	 *
	 * @return Template identifier.
	 */
	public String getTemplateId()
	{
		return templateId;
	}

	/**
	 * Handle creation from ListDataItem object.
	 *
	 * @param options ListDataItem properties.
	 */
	public void handleCreationDataItem(KrollDict options)
	{
		if (options == null) {
			options = new KrollDict();
		}

		final KrollDict properties = options.getKrollDict(TiC.PROPERTY_PROPERTIES);

		// Iterate through properties for children.
		for (String k : options.keySet()) {

			// Ignore reserved ListDataItem properties.
			if (k.equals(TiC.PROPERTY_PROPERTIES)
				|| k.equals(TiC.PROPERTY_TEMPLATE)) {
				continue;
			}

			final KrollDict childDict = options.getKrollDict(k);

			if (childDict != null) {

				// Additional dictionary properties are regarded as child properties for templates.
				// NOTE: `getKrollDict()` is necessary as using `get()` would return a `HashMap`.
				this.childProperties.put(k, childDict);
			} else {

				// Non-template properties are regarded as custom properties.
				this.childProperties.put(k, options.get(k));
			}
		}

		// Set item template.
		this.templateId = options.getString(TiC.PROPERTY_TEMPLATE);

		// Process item properties.
		handleCreationDict(properties);
	}

	/**
	 * Handle initial creation properties.
	 *
	 * @param options Initial creation properties.
	 */
	@Override
	public void handleCreationDict(KrollDict options)
	{
		if (options == null) {
			options = new KrollDict();
		}

		// Prevent template from overriding specified properties.
		ignoredTemplateKeys.addAll(options.keySet());

		super.handleCreationDict(options);
	}

	/**
	 * Determine if proxy contains listener for specified event.
	 *
	 * @param event Event name.
	 * @return Boolean determining if listener is present.
	 */
	@Override
	public boolean hierarchyHasListener(String event)
	{
		// Override to always detect `click` events, even when no listeners are present.
		// This is so we can fire `itemclick` events.
		if (event.equals(TiC.EVENT_CLICK)) {
			return true;
		}
		return super.hierarchyHasListener(event);
	}

	/**
	 * Invalidate item to re-bind holder.
	 * This will update the current holder to display new changes.
	 */
	public void invalidate()
	{
		if (this.holder != null) {
			this.holder.bind(this, this.holder.itemView.isActivated());
		}
	}

	/**
	 * Is current item a placeholder for header or footer.
	 *
	 * @return Boolean
	 */
	public boolean isPlaceholder()
	{
		return this.placeholder;
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		super.onPropertyChanged(name, value);

		processProperty(name, value);
	}

	private void processProperty(String name, Object value)
	{
		// Handle convenience properties for default template.
		if (name.equals(TiC.PROPERTY_TITLE)
			|| name.equals(TiC.PROPERTY_FONT)
			|| name.equals(TiC.PROPERTY_COLOR)) {

			// Properties apply to `title` in default template.
			final KrollDict titleProperties = new KrollDict();

			// Handle title text.
			if (name.equals(TiC.PROPERTY_TITLE) && value instanceof String) {
				titleProperties.put(TiC.PROPERTY_TEXT, value);
			}

			// Handle title font.
			if (name.equals(TiC.PROPERTY_FONT) && value instanceof HashMap) {
				titleProperties.put(TiC.PROPERTY_FONT, value);
			}

			// Handle title color.
			if (name.equals(TiC.PROPERTY_COLOR)
				&& (value instanceof String || value instanceof ColorProxy)) {
				titleProperties.put(TiC.PROPERTY_COLOR, value);
			}

			if (titleProperties.size() > 0) {
				if (this.childProperties.containsKey(TiC.PROPERTY_TITLE)) {
					final Object existingTitleObject = this.childProperties.get(TiC.PROPERTY_TITLE);

					if (existingTitleObject instanceof KrollDict) {
						final KrollDict existingTitleProperties = (KrollDict) existingTitleObject;

						// Child template already exists.
						// Merge new properties with existing properties.
						existingTitleProperties.putAll(titleProperties);
					}
				} else {

					// Add as child property to apply to default template.
					this.childProperties.put(TiC.PROPERTY_TITLE, titleProperties);
				}
			}
		}
		if (name.equals(TiC.PROPERTY_IMAGE) && value instanceof String) {
			final KrollDict imageProperties = new KrollDict();

			// Handle image path.
			imageProperties.put(TiC.PROPERTY_IMAGE, value);

			if (this.childProperties.containsKey(TiC.PROPERTY_IMAGE)) {
				final Object existingImageObject = this.childProperties.get(TiC.PROPERTY_IMAGE);

				if (existingImageObject instanceof KrollDict) {
					final KrollDict existingImageProperties = (KrollDict) existingImageObject;

					// Child template already exists.
					// Merge new properties with existing properties.
					existingImageProperties.putAll(imageProperties);
				}
			} else {

				// Add as child property to apply to default template.
				this.childProperties.put(TiC.PROPERTY_IMAGE, imageProperties);
			}
		}

		if (name.equals(TiC.PROPERTY_HEADER_VIEW) && value instanceof TiViewProxy) {
			final TiViewProxy headerProxy = (TiViewProxy) value;

			// Set header view parent, so it can be released correctly.
			headerProxy.setParent(this);
		}
		if (name.equals(TiC.PROPERTY_FOOTER_VIEW) && value instanceof TiViewProxy) {
			final TiViewProxy footerProxy = (TiViewProxy) value;

			// Set footer view parent, so it can be released correctly.
			footerProxy.setParent(this);
		}

		if (name.equals(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR)) {
			Log.w(TAG, "selectedBackgroundColor is deprecated, use backgroundSelectedColor instead.");
			setProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR, value);
		}
		if (name.equals(TiC.PROPERTY_SELECTED_BACKGROUND_IMAGE)) {
			Log.w(TAG, "selectedBackgroundImage is deprecated, use backgroundSelectedImage instead.");
			setProperty(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE, value);
		}
	}

	/**
	 * Release item.
	 */
	@Override
	public void release()
	{
		releaseViews();

		super.release();
	}

	/**
	 * Release views for item to reclaim memory.
	 */
	@Override
	public void releaseViews()
	{
		this.holder = null;

		final KrollDict properties = getProperties();

		if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {
			final TiViewProxy header = (TiViewProxy) properties.get(TiC.PROPERTY_HEADER_VIEW);

			if (header.getParent() == this) {
				header.releaseViews();
			}
		}
		if (properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {
			final TiViewProxy footer = (TiViewProxy) properties.get(TiC.PROPERTY_FOOTER_VIEW);

			if (footer.getParent() == this) {
				footer.releaseViews();
			}
		}

		super.releaseViews();
	}

	/**
	 * Process property set on proxy.
	 *
	 * @param name Name of proxy property.
	 * @param value Value to set property.
	 */
	@Override
	public void setProperty(String name, Object value)
	{
		super.setProperty(name, value);

		processProperty(name, value);
	}

	/**
	 * ItemView class used for ListItem.
	 * Auto-fills to width of parent.
	 */
	private class ItemView extends TiView
	{
		public ItemView(TiViewProxy proxy)
		{
			super(proxy);

			getLayoutParams().autoFillsWidth = true;
		}
	}
}
