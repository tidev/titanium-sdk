/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import android.app.Activity;
// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_CAN_SCROLL,
		TiC.PROPERTY_HEADER_TITLE,
		TiC.PROPERTY_FOOTER_TITLE,
		TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE,
		TiC.PROPERTY_FAST_SCROLL,
		TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR,
		TiC.PROPERTY_SEPARATOR_COLOR,
		TiC.PROPERTY_SEARCH_TEXT,
		TiC.PROPERTY_SEARCH_VIEW,
		TiC.PROPERTY_CASE_INSENSITIVE_SEARCH,
		TiC.PROPERTY_HEADER_DIVIDERS_ENABLED,
		TiC.PROPERTY_FOOTER_DIVIDERS_ENABLED,
		TiC.PROPERTY_REFRESH_CONTROL,
		TiC.PROPERTY_SEPARATOR_HEIGHT
})
// clang-format on
public class ListViewProxy extends TiViewProxy
{

	private static final String TAG = "ListViewProxy";

	//indicate if user attempts to add/modify/delete sections before TiListView is created
	private boolean preload = false;
	private ArrayList<ListSectionProxy> preloadSections;
	private ArrayList<HashMap<String, Integer>> preloadMarkers;

	public ListViewProxy()
	{
		super();
	}

	public TiUIView createView(Activity activity)
	{
		return new TiListView(this, activity);
	}

	public void handleCreationArgs(KrollModule createdInModule, Object[] args)
	{
		preloadSections = new ArrayList<ListSectionProxy>();
		preloadMarkers = new ArrayList<HashMap<String, Integer>>();
		defaultValues.put(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE, UIModule.LIST_ITEM_TEMPLATE_DEFAULT);
		defaultValues.put(TiC.PROPERTY_CASE_INSENSITIVE_SEARCH, true);
		defaultValues.put(TiC.PROPERTY_CAN_SCROLL, true);
		defaultValues.put(TiC.PROPERTY_FAST_SCROLL, false);
		super.handleCreationArgs(createdInModule, args);
	}

	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);
		//Adding sections to preload sections, so we can handle appendSections/insertSection
		//accordingly if user call these before TiListView is instantiated.
		if (options.containsKey(TiC.PROPERTY_SECTIONS)) {
			Object obj = options.get(TiC.PROPERTY_SECTIONS);
			if (obj instanceof Object[]) {
				addPreloadSections((Object[]) obj, -1, true);
			}
		}
		if (options.containsKey(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE)) {
			setProperty(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE, options.get(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE));
		}
	}

	public void clearPreloadSections()
	{
		if (preloadSections != null) {
			preloadSections.clear();
		}
	}

	public ArrayList<ListSectionProxy> getPreloadSections()
	{
		return preloadSections;
	}

	public boolean getPreload()
	{
		return preload;
	}

	public void setPreload(boolean pload)
	{
		preload = pload;
	}

	public ArrayList<HashMap<String, Integer>> getPreloadMarkers()
	{
		return preloadMarkers;
	}

	private void addPreloadSections(Object secs, int index, boolean arrayOnly)
	{
		if (secs instanceof Object[]) {
			Object[] sections = (Object[]) secs;
			for (int i = 0; i < sections.length; i++) {
				Object section = sections[i];
				addPreloadSection(section, -1);
			}
		} else if (!arrayOnly) {
			addPreloadSection(secs, -1);
		}
	}

	private void addPreloadSection(Object section, int index)
	{
		if (section instanceof ListSectionProxy) {
			if (index == -1) {
				preloadSections.add((ListSectionProxy) section);
			} else {
				preloadSections.add(index, (ListSectionProxy) section);
			}
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getSectionCount()
	// clang-format on
	{
		return handleSectionCount();
	}

	public int handleSectionCount()
	{
		if (peekView() == null && getParent() != null) {
			getParent().getOrCreateView();
		}
		TiUIView listView = peekView();

		if (listView != null) {
			return ((TiListView) listView).getSectionCount();
		}
		return preloadSections.size();
	}

	@Kroll.method
	public void scrollToItem(int sectionIndex, int itemIndex,
							 @SuppressWarnings("rawtypes") @Kroll.argument(optional = true) HashMap options)
	{
		boolean animated = true;
		if ((options != null) && (options instanceof HashMap<?, ?>) ) {
			@SuppressWarnings("unchecked")
			KrollDict animationargs = new KrollDict(options);
			if (animationargs.containsKeyAndNotNull(TiC.PROPERTY_ANIMATED)) {
				animated = TiConvert.toBoolean(animationargs.get(TiC.PROPERTY_ANIMATED), true);
			}
		}
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).scrollToItem(sectionIndex, itemIndex, animated);
		}
	}

	@Kroll.method
	public void setMarker(Object marker)
	{
		setMarkerHelper(marker);
	}

	public void setMarkerHelper(Object marker)
	{
		if (marker instanceof HashMap) {
			HashMap<String, Integer> m = (HashMap<String, Integer>) marker;
			TiUIView listView = peekView();
			if (listView != null) {
				((TiListView) listView).setMarker(m);
			} else {
				preloadMarkers.clear();
				preloadMarkers.add(m);
			}
		}
	}

	@Kroll.method
	public void addMarker(Object marker)
	{
		if (marker instanceof HashMap) {
			HashMap<String, Integer> m = (HashMap<String, Integer>) marker;
			TiUIView listView = peekView();
			if (listView != null) {
				((TiListView) listView).addMarker(m);
			} else {
				preloadMarkers.add(m);
			}
		}
	}

	@Kroll.method
	public void appendSection(Object section)
	{
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).appendSection(section);
		} else {
			preload = true;
			addPreloadSections(section, -1, false);
		}
	}

	@Kroll.method
	public void deleteSectionAt(int index)
	{
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).deleteSectionAt(index);
		} else {
			if (index < 0 || index >= preloadSections.size()) {
				Log.e(TAG, "Invalid index to delete section");
				return;
			}
			preload = true;
			preloadSections.remove(index);
		}
	}

	@Kroll.method
	public void insertSectionAt(int index, Object section)
	{
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).insertSectionAt(index, section);
		} else {
			if (index < 0 || index > preloadSections.size()) {
				Log.e(TAG, "Invalid index to insertSection");
				return;
			}
			preload = true;
			addPreloadSections(section, index, false);
		}
	}

	@Kroll.method
	public void replaceSectionAt(int index, Object section)
	{
		TiUIView listView = peekView();
		if (listView != null) {
			((TiListView) listView).replaceSectionAt(index, section);
		} else {
			deleteSectionAt(index);
			insertSectionAt(index, section);
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public ListSectionProxy[] getSections()
	// clang-format on
	{
		if (peekView() == null && getParent() != null) {
			getParent().getOrCreateView();
		}
		TiUIView listView = peekView();

		if (listView != null) {
			return ((TiListView) listView).getSections();
		}
		ArrayList<ListSectionProxy> preloadedSections = getPreloadSections();
		return preloadedSections.toArray(new ListSectionProxy[preloadedSections.size()]);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setSections(Object sections)
	// clang-format on
	{
		if (!(sections instanceof Object[])) {
			Log.e(TAG, "Invalid argument type to setSection(), needs to be an array", Log.DEBUG_MODE);
			return;
		}
		//Update java and javascript property
		setProperty(TiC.PROPERTY_SECTIONS, sections);

		Object[] sectionsArray = (Object[]) sections;
		TiUIView listView = peekView();
		//Preload sections if listView is not opened.
		if (listView == null) {
			preload = true;
			clearPreloadSections();
			addPreloadSections(sectionsArray, -1, true);
		} else {
			((TiListView) listView).processSectionsAndNotify(sectionsArray);
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ListView";
	}
}
