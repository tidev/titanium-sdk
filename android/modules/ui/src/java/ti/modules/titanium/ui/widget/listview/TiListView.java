/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.util.Pair;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.AbsListView;
import android.widget.AbsListView.OnScrollListener;
import android.widget.BaseAdapter;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import ti.modules.titanium.ui.RefreshControlProxy;
import ti.modules.titanium.ui.SearchBarProxy;
import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.android.SearchViewProxy;
import ti.modules.titanium.ui.widget.TiSwipeRefreshLayout;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar.OnSearchChangeListener;
import ti.modules.titanium.ui.widget.searchview.TiUISearchView;

public class TiListView extends TiUIView implements OnSearchChangeListener
{

	private TiNestedListView listView;
	private TiBaseAdapter adapter;
	private ArrayList<ListSectionProxy> sections;
	private AtomicInteger itemTypeCount;
	private String defaultTemplateBinding;
	private ListViewWrapper wrapper;
	private HashMap<String, TiListViewTemplate> templatesByBinding;
	private int listItemId;
	public static int listContentId;
	public static int isCheck;
	public static int hasChild;
	public static int disclosure;
	public static int accessory;
	private int headerFooterId;
	public LayoutInflater inflater;
	private int titleId;
	private int dividerHeight;
	private int scrollDamping = 5;
	private ArrayList<Pair<Integer, Integer>> markers = new ArrayList<Pair<Integer, Integer>>();
	private View headerView;
	private View footerView;
	private String searchText;
	private boolean caseInsensitive;
	private LinearLayout searchLayout;
	private static final String TAG = "TiListView";

	/* We cache properties that already applied to the recycled list item in ViewItem.java
	 * However, since Android randomly selects a cached view to recycle, our cached properties
	 * will not be in sync with the native view's properties when user changes those values via
	 * User Interaction - i.e click. For this reason, we create a list that contains the properties
	 * that must be reset every time a view is recycled, to ensure synchronization. Currently, only
	 * "value" is in this list to correctly update the value of Ti.UI.Switch.
	 */
	public static List<String> MUST_SET_PROPERTIES =
		Arrays.asList(TiC.PROPERTY_VALUE, TiC.PROPERTY_AUTO_LINK, TiC.PROPERTY_TEXT, TiC.PROPERTY_HTML,
					  TiC.PROPERTY_WIDTH, TiC.PROPERTY_HEIGHT, TiC.PROPERTY_IMAGE);

	public static final String MIN_SEARCH_HEIGHT = "50dp";
	public static final int HEADER_FOOTER_WRAP_ID = View.generateViewId();
	public static final int HEADER_FOOTER_VIEW_TYPE = 0;
	public static final int HEADER_FOOTER_TITLE_TYPE = 1;
	public static final int BUILT_IN_TEMPLATE_ITEM_TYPE = 2;
	public static final int CUSTOM_TEMPLATE_ITEM_TYPE = 3;

	private class ListViewWrapper extends TiSwipeRefreshLayout
	{
		private boolean viewFocused = false;
		private boolean selectionSet = false;
		public ListViewWrapper(Context context)
		{
			super(context);
		}

		@Override
		protected void onLayout(boolean changed, int left, int top, int right, int bottom)
		{
			// To prevent undesired "focus" and "blur" events during layout caused
			// by ListView temporarily taking focus, we will disable focus events until
			// layout has finished.
			// First check for a quick exit. listView can be null, such as if window closing.
			// Starting with API 18, calling requestFocus() will trigger another layout pass of the listview,
			// resulting in an infinite loop. Here we check if the view is already focused, and stop the loop.
			if (listView == null || (Build.VERSION.SDK_INT >= 18 && listView != null && !changed && viewFocused)) {
				viewFocused = false;
				super.onLayout(changed, left, top, right, bottom);
				return;
			}
			// Starting with API 21, setSelection() triggers another layout pass, so we need to end it here to prevent
			// an infinite loop
			if (Build.VERSION.SDK_INT >= 21 && selectionSet) {
				selectionSet = false;
				return;
			}
			OnFocusChangeListener focusListener = null;
			View focusedView = listView.findFocus();
			int cursorPosition = -1;
			if (focusedView != null) {
				OnFocusChangeListener listener = focusedView.getOnFocusChangeListener();
				if (listener != null && listener instanceof TiUIView) {
					// Before unfocus the current editText, store cursor position so
					// we can restore it later
					if (focusedView instanceof EditText) {
						cursorPosition = ((EditText) focusedView).getSelectionStart();
					}
					focusedView.setOnFocusChangeListener(null);
					focusListener = listener;
				}
			}

			// We are temporarily going to block focus to descendants
			// because LinearLayout on layout will try to find a focusable descendant
			if (focusedView != null) {
				listView.setDescendantFocusability(ViewGroup.FOCUS_BLOCK_DESCENDANTS);
			}
			super.onLayout(changed, left, top, right, bottom);
			// Now we reset the descendant focusability
			listView.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);

			TiViewProxy viewProxy = proxy;
			if (viewProxy != null && viewProxy.hasListeners(TiC.EVENT_POST_LAYOUT)) {
				viewProxy.fireEvent(TiC.EVENT_POST_LAYOUT, null);
			}

			// Layout is finished, re-enable focus events.
			if (focusListener != null) {
				// If the configuration changed, we manually fire the blur event
				if (changed) {
					focusedView.setOnFocusChangeListener(focusListener);
					focusListener.onFocusChange(focusedView, false);
				} else {
					// Ok right now focus is with listView. So set it back to the focusedView
					viewFocused = true;
					focusedView.requestFocus();
					focusedView.setOnFocusChangeListener(focusListener);
					// Restore cursor position
					if (cursorPosition != -1) {
						((EditText) focusedView).setSelection(cursorPosition);
						selectionSet = true;
					}
				}
			}
		}
	}

	public class TiBaseAdapter extends BaseAdapter
	{

		Activity context;

		public TiBaseAdapter(Activity activity)
		{
			context = activity;
		}

		@Override
		public int getCount()
		{
			int count = 0;
			for (int i = 0; i < sections.size(); i++) {
				ListSectionProxy section = sections.get(i);
				count += section.getItemCount();
			}
			return count;
		}

		@Override
		public Object getItem(int arg0)
		{
			// not using this method
			return arg0;
		}

		@Override
		public long getItemId(int position)
		{
			// not using this method
			return position;
		}

		// One type for header/footer title, one for header/footer view, one for built-in template, and one type per
		// custom template.
		@Override
		public int getViewTypeCount()
		{
			return 3 + templatesByBinding.size();
		}
		@Override
		public int getItemViewType(int position)
		{
			Pair<ListSectionProxy, Pair<Integer, Integer>> info = getSectionInfoByEntryIndex(position);
			ListSectionProxy section = info.first;
			int sectionItemIndex = info.second.second;
			if (section.isHeaderTitle(sectionItemIndex) || section.isFooterTitle(sectionItemIndex))
				return HEADER_FOOTER_TITLE_TYPE;
			if (section.isHeaderView(sectionItemIndex) || section.isFooterView(sectionItemIndex)) {
				return HEADER_FOOTER_VIEW_TYPE;
			}
			return section.getTemplateByIndex(sectionItemIndex).getType();
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent)
		{
			// Get section info from index
			Pair<ListSectionProxy, Pair<Integer, Integer>> info = getSectionInfoByEntryIndex(position);
			ListSectionProxy section = info.first;
			int sectionItemIndex = info.second.second;
			int sectionIndex = info.second.first;

			View content = convertView;

			// Handles header/footer views and titles.
			if (section.isHeaderView(sectionItemIndex) || section.isFooterView(sectionItemIndex)) {
				return section.getHeaderOrFooterView(sectionItemIndex);
			} else if (section.isHeaderTitle(sectionItemIndex) || section.isFooterTitle(sectionItemIndex)) {
				// No content to reuse, so we create a new view
				if (content == null) {
					content = inflater.inflate(headerFooterId, null);
				}
				TextView title = (TextView) content.findViewById(titleId);
				title.setText(section.getHeaderOrFooterTitle(sectionItemIndex));
				return content;
			}

			// check marker and fire appropriate events
			checkMarker(sectionIndex, sectionItemIndex, section.hasHeader());

			// Handling templates
			KrollDict data = section.getListItemData(sectionItemIndex);
			TiListViewTemplate template = section.getTemplateByIndex(sectionItemIndex);

			if (content != null) {
				TiBaseListViewItem itemContent = (TiBaseListViewItem) content.findViewById(listContentId);
				section.populateViews(data, itemContent, template, sectionItemIndex, sectionIndex, content);
				// Manually add drawable for ripple touch feedback
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
					try {
						TypedValue typedValue = new TypedValue();
						context.getTheme().resolveAttribute(android.R.attr.selectableItemBackground, typedValue, true);
						itemContent.setClickable(true);
						itemContent.setForeground(
							context.getResources().getDrawable(typedValue.resourceId, context.getTheme()));
					} catch (Exception ex) {
						ex.printStackTrace();
					}
				}
			} else {
				content = inflater.inflate(listItemId, null);
				TiBaseListViewItem itemContent = (TiBaseListViewItem) content.findViewById(listContentId);
				LayoutParams params = new LayoutParams();
				params.autoFillsWidth = true;
				itemContent.setLayoutParams(params);
				section.generateCellContent(sectionIndex, data, template, itemContent, sectionItemIndex, content);
				// Manually add drawable for ripple touch feedback
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
					try {
						TypedValue typedValue = new TypedValue();
						context.getTheme().resolveAttribute(android.R.attr.selectableItemBackground, typedValue, true);
						itemContent.setClickable(true);
						itemContent.setForeground(
							context.getResources().getDrawable(typedValue.resourceId, context.getTheme()));
					} catch (Exception ex) {
						ex.printStackTrace();
					}
				}
			}
			return content;
		}
	}

	public TiListView(TiViewProxy proxy, Activity activity)
	{
		super(proxy);

		// initializing variables
		sections = new ArrayList<ListSectionProxy>();
		itemTypeCount = new AtomicInteger(CUSTOM_TEMPLATE_ITEM_TYPE);
		templatesByBinding = new HashMap<String, TiListViewTemplate>();
		defaultTemplateBinding = UIModule.LIST_ITEM_TEMPLATE_DEFAULT;
		caseInsensitive = true;

		// handling marker
		ArrayList<HashMap<String, Integer>> preloadMarkers = ((ListViewProxy) proxy).getPreloadMarkers();
		if (preloadMarkers != null) {
			setMarkers(preloadMarkers);
		}

		// initializing listView and adapter
		ListViewWrapper wrapper = new ListViewWrapper(activity);
		wrapper.setSwipeRefreshEnabled(false);
		wrapper.setFocusable(false);
		wrapper.setFocusableInTouchMode(false);
		listView = TiNestedListView.createUsing(activity);
		listView.setLayoutParams(new ViewGroup.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
		wrapper.addView(listView);
		adapter = new TiBaseAdapter(activity);

		// init inflater
		inflater = LayoutInflater.from(activity);

		listView.setCacheColorHint(Color.TRANSPARENT);
		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;
		listView.setFocusable(true);
		listView.setFocusableInTouchMode(true);
		listView.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);

		final TiViewProxy fProxy = proxy;
		listView.setOnScrollListener(new OnScrollListener() {
			private int _firstVisibleItem = 0;
			private int _visibleItemCount = 0;
			private boolean canFireScrollStart = true;
			private boolean canFireScrollEnd = false;
			private int mInitialScroll = 0;
			private int scrollUp = 0;
			private int newScrollUp = 0;

			@Override
			public void onScrollStateChanged(AbsListView view, int scrollState)
			{
				String eventName;
				if (scrollState == OnScrollListener.SCROLL_STATE_IDLE && canFireScrollEnd) {
					eventName = TiC.EVENT_SCROLLEND;
					canFireScrollEnd = false;
					canFireScrollStart = true;
					newScrollUp = 0;
				} else if (scrollState == OnScrollListener.SCROLL_STATE_TOUCH_SCROLL && canFireScrollStart) {
					eventName = TiC.EVENT_SCROLLSTART;
					canFireScrollEnd = true;
					canFireScrollStart = false;
				} else {
					return;
				}

				KrollDict eventArgs = new KrollDict();
				Pair<ListSectionProxy, Pair<Integer, Integer>> info = getSectionInfoByEntryIndex(_firstVisibleItem);

				if (info == null) {
					return;
				}

				int visibleItemCount = _visibleItemCount;

				int itemIndex = info.second.second;
				ListSectionProxy section = info.first;

				if (section.getHeaderTitle() == null || section.getHeaderView() == null) {
					if (itemIndex > 0) {
						itemIndex -= 1;
					}
					visibleItemCount -= 1;
				}
				eventArgs.put("firstVisibleSection", section);
				eventArgs.put("firstVisibleSectionIndex", info.second.first);
				eventArgs.put("firstVisibleItem", section.getItemAt(itemIndex));
				eventArgs.put("firstVisibleItemIndex", itemIndex);
				eventArgs.put("visibleItemCount", visibleItemCount);

				fProxy.fireEvent(eventName, eventArgs, false);
			}

			public void onScroll(AbsListView view, int firstVisibleItem, int visibleItemCount, int totalItemCount)
			{
				_firstVisibleItem = firstVisibleItem;
				_visibleItemCount = visibleItemCount;
				int scrolledOffset = listView.getVerticalScrollOffset();
				if (Math.abs(mInitialScroll - scrolledOffset) > scrollDamping) {
					if (scrolledOffset > mInitialScroll) {
						scrollUp = 1;
					} else {
						scrollUp = -1;
					}
					if (scrollUp != newScrollUp) {
						KrollDict eventArgs = new KrollDict();
						eventArgs.put("direction", (scrollUp > 0) ? "up" : "down");
						eventArgs.put("velocity", 0);
						eventArgs.put("targetContentOffset", 0);
						fProxy.fireEvent(TiC.EVENT_SCROLLING, eventArgs, false);
						newScrollUp = scrollUp;
					}
					mInitialScroll = scrolledOffset;
				}
			}
		});

		try {
			headerFooterId = TiRHelper.getResource("layout.titanium_ui_list_header_or_footer");
			listItemId = TiRHelper.getResource("layout.titanium_ui_list_item");
			titleId = TiRHelper.getResource("id.titanium_ui_list_header_or_footer_title");
			listContentId = TiRHelper.getResource("id.titanium_ui_list_item_content");
			isCheck = TiRHelper.getImageRessource("drawable.btn_check_buttonless_on");
			hasChild = TiRHelper.getImageRessource("drawable.btn_more");
			disclosure = TiRHelper.getImageRessource("drawable.disclosure");
			accessory = TiRHelper.getResource("id.titanium_ui_list_item_accessoryType");
		} catch (ResourceNotFoundException e) {
			Log.e(TAG, "XML resources could not be found!!!", Log.DEBUG_MODE);
		}

		this.wrapper = wrapper;
		setNativeView(wrapper);
	}

	public String getSearchText()
	{
		return searchText;
	}

	public boolean getCaseInsensitive()
	{
		return caseInsensitive;
	}

	public void setHeaderTitle(String title)
	{
		TextView textView = (TextView) headerView.findViewById(titleId);
		textView.setText(title);
		if (textView.getVisibility() == View.GONE) {
			textView.setVisibility(View.VISIBLE);
		}
	}

	public void setFooterTitle(String title)
	{
		TextView textView = (TextView) footerView.findViewById(titleId);
		textView.setText(title);
		if (textView.getVisibility() == View.GONE) {
			textView.setVisibility(View.VISIBLE);
		}
	}

	@Override
	public void registerForTouch()
	{
		registerForTouch(listView);
	}

	public void setMarker(HashMap<String, Integer> markerItem)
	{
		markers.clear();
		addMarker(markerItem);
	}

	public void setMarkers(ArrayList<HashMap<String, Integer>> markerItems)
	{
		markers.clear();
		for (int i = 0; i < markerItems.size(); ++i) {
			HashMap<String, Integer> markerItem = markerItems.get(i);
			addMarker(markerItem);
		}
	}

	public void checkMarker(int sectionIndex, int sectionItemIndex, boolean hasHeader)
	{
		if (markers.isEmpty()) {
			return;
		}

		if (hasHeader) {
			sectionItemIndex--;
		}

		Iterator<Pair<Integer, Integer>> iterator = markers.iterator();
		while (iterator.hasNext()) {
			Pair<Integer, Integer> marker = iterator.next();
			if (sectionIndex == marker.first && sectionItemIndex == marker.second) {
				KrollDict data = new KrollDict();
				data.put(TiC.PROPERTY_SECTION_INDEX, sectionIndex);
				data.put(TiC.PROPERTY_ITEM_INDEX, sectionItemIndex);
				if (proxy != null && proxy.hasListeners(TiC.EVENT_MARKER)) {
					proxy.fireEvent(TiC.EVENT_MARKER, data, false);
				}
				iterator.remove();
			}
		}
	}

	public void addMarker(HashMap<String, Integer> markerItem)
	{
		int sectionIndex = markerItem.get(TiC.PROPERTY_SECTION_INDEX);
		int itemIndex = markerItem.get(TiC.PROPERTY_ITEM_INDEX);
		markers.add(new Pair<Integer, Integer>(sectionIndex, itemIndex));
	}

	public void processProperties(KrollDict d)
	{

		if (d.containsKey(TiC.PROPERTY_TEMPLATES)) {
			Object templates = d.get(TiC.PROPERTY_TEMPLATES);
			if (templates != null) {
				processTemplates(new KrollDict((HashMap) templates));
			}
		}

		if (d.containsKey(TiC.PROPERTY_REFRESH_CONTROL)) {
			Object object = d.get(TiC.PROPERTY_REFRESH_CONTROL);
			if (object instanceof RefreshControlProxy) {
				((RefreshControlProxy) object).assignTo(this.wrapper);
			}
		}

		if (d.containsKey(TiC.PROPERTY_SEARCH_TEXT)) {
			this.searchText = TiConvert.toString(d, TiC.PROPERTY_SEARCH_TEXT);
		}

		if (d.containsKey(TiC.PROPERTY_SEARCH_VIEW)) {
			TiViewProxy searchView = (TiViewProxy) d.get(TiC.PROPERTY_SEARCH_VIEW);
			if (isSearchViewValid(searchView)) {
				TiUIView search = searchView.getOrCreateView();
				setSearchListener(searchView, search);
				layoutSearchView(searchView);
			} else {
				Log.e(TAG, "Searchview type is invalid");
			}
		}

		if (d.containsKey(TiC.PROPERTY_CASE_INSENSITIVE_SEARCH)) {
			this.caseInsensitive = TiConvert.toBoolean(d, TiC.PROPERTY_CASE_INSENSITIVE_SEARCH, true);
		}

		if (d.containsKey(TiC.PROPERTY_SEPARATOR_HEIGHT)) {
			TiDimension dHeight = TiConvert.toTiDimension(d.get(TiC.PROPERTY_SEPARATOR_HEIGHT), -1);
			int height = dHeight.getAsPixels(listView);
			if (height >= 0) {
				dividerHeight = height;
				listView.setDividerHeight(height);
			}
		}

		if (d.containsKey(TiC.PROPERTY_SEPARATOR_COLOR)) {
			String color = TiConvert.toString(d, TiC.PROPERTY_SEPARATOR_COLOR);
			setSeparatorColor(color);
		}
		if (d.containsKey(TiC.PROPERTY_SEPARATOR_STYLE)) {
			setSeparatorStyle(TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_SEPARATOR_STYLE),
											  UIModule.TABLE_VIEW_SEPARATOR_STYLE_NONE));
		}
		if (d.containsKey(TiC.PROPERTY_FOOTER_DIVIDERS_ENABLED)) {
			boolean enabled = TiConvert.toBoolean(d, TiC.PROPERTY_FOOTER_DIVIDERS_ENABLED, false);
			listView.setFooterDividersEnabled(enabled);
		} else {
			listView.setFooterDividersEnabled(false);
		}

		if (d.containsKey(TiC.PROPERTY_HEADER_DIVIDERS_ENABLED)) {
			boolean enabled = TiConvert.toBoolean(d, TiC.PROPERTY_HEADER_DIVIDERS_ENABLED, false);
			listView.setHeaderDividersEnabled(enabled);
		} else {
			listView.setHeaderDividersEnabled(false);
		}

		if (d.containsKey(TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR)) {
			listView.setVerticalScrollBarEnabled(
				TiConvert.toBoolean(d, TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR, true));
		}

		if (d.containsKey(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE)) {
			defaultTemplateBinding = TiConvert.toString(d, TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE);
		}

		ListViewProxy listProxy = (ListViewProxy) proxy;
		if (d.containsKey(TiC.PROPERTY_SECTIONS)) {
			// if user didn't append/modify/delete sections before this is called, we process sections
			// as usual. Otherwise, we process the preloadSections, which should also contain the section(s)
			// from this dictionary as well as other sections that user append/insert/deleted prior to this.
			if (!listProxy.getPreload()) {
				processSections((Object[]) d.get(TiC.PROPERTY_SECTIONS));
			} else {
				processSections(listProxy.getPreloadSections().toArray());
			}
		} else if (listProxy.getPreload()) {
			// if user didn't specify 'sections' property upon creation of listview but append/insert it afterwards
			// we process them instead.
			processSections(listProxy.getPreloadSections().toArray());
		}

		listProxy.clearPreloadSections();
		listProxy.setPreload(false);

		if (d.containsKey(TiC.PROPERTY_HEADER_VIEW)) {
			Object viewObj = d.get(TiC.PROPERTY_HEADER_VIEW);
			setHeaderOrFooterView(viewObj, true);
		} else if (d.containsKey(TiC.PROPERTY_HEADER_TITLE)) {
			headerView = inflater.inflate(headerFooterId, null);
			setHeaderTitle(TiConvert.toString(d, TiC.PROPERTY_HEADER_TITLE));
		}

		if (d.containsKey(TiC.PROPERTY_FOOTER_VIEW)) {
			Object viewObj = d.get(TiC.PROPERTY_FOOTER_VIEW);
			setHeaderOrFooterView(viewObj, false);
		} else if (d.containsKey(TiC.PROPERTY_FOOTER_TITLE)) {
			footerView = inflater.inflate(headerFooterId, null);
			setFooterTitle(TiConvert.toString(d, TiC.PROPERTY_FOOTER_TITLE));
		}

		// Check to see if headerView and footerView are specified. If not, we hide the views
		if (headerView == null) {
			headerView = inflater.inflate(headerFooterId, null);
			headerView.findViewById(titleId).setVisibility(View.GONE);
		}

		if (footerView == null) {
			footerView = inflater.inflate(headerFooterId, null);
			footerView.findViewById(titleId).setVisibility(View.GONE);
		}

		if (d.containsKeyAndNotNull(TiC.PROPERTY_CAN_SCROLL)) {
			this.listView.setTouchScrollable(TiConvert.toBoolean(d.get(TiC.PROPERTY_CAN_SCROLL), true));
		}

		if (d.containsKeyAndNotNull(TiC.PROPERTY_SCROLL_DAMPING)) {
			scrollDamping = TiConvert.toInt(d.get(TiC.PROPERTY_SCROLL_DAMPING), 0);
		}

		if (d.containsKeyAndNotNull(TiC.PROPERTY_FAST_SCROLL)) {
			listView.setFastScrollEnabled(TiConvert.toBoolean(d.get(TiC.PROPERTY_FAST_SCROLL), false));
		}
		// Have to add header and footer before setting adapter
		listView.addHeaderView(headerView, null, false);
		listView.addFooterView(footerView, null, false);

		listView.setAdapter(adapter);
		super.processProperties(d);
	}

	private void layoutSearchView(TiViewProxy searchView)
	{
		TiUIView search = searchView.getOrCreateView();
		LinearLayout layout = new LinearLayout(proxy.getActivity());
		layout.setOrientation(LinearLayout.VERTICAL);
		layout.setPadding(0, 0, 0, 0);
		addSearchLayout(layout, searchView, search);
		setNativeView(layout);
	}

	private void addSearchLayout(LinearLayout layout, TiViewProxy searchView, TiUIView search)
	{
		// Fetch the height of the SearchBar/SearchView.
		TiDimension rawHeight;
		if (searchView.hasProperty(TiC.PROPERTY_HEIGHT)) {
			rawHeight = TiConvert.toTiDimension(searchView.getProperty(TiC.PROPERTY_HEIGHT), 0);
		} else {
			rawHeight = TiConvert.toTiDimension(MIN_SEARCH_HEIGHT, 0);
		}

		// Add the search view to the top of the vertical layout.
		LinearLayout.LayoutParams params =
			new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, rawHeight.getAsPixels(layout));
		layout.addView(search.getNativeView(), params);

		// Add the ListView to the bottom of the vertical layout.
		params = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
											   LinearLayout.LayoutParams.MATCH_PARENT);
		ViewParent parentWrapper = wrapper.getParent();
		if (parentWrapper != null && parentWrapper instanceof ViewGroup) {
			// get the previous layout params so we can reset with new layout
			ViewGroup.LayoutParams lastParams = wrapper.getLayoutParams();
			ViewGroup parentView = (ViewGroup) parentWrapper;
			// remove view from parent
			parentView.removeView(wrapper);
			// add new layout
			layout.addView(wrapper, params);
			parentView.addView(layout, lastParams);

		} else {
			layout.addView(wrapper, params);
		}
		this.searchLayout = layout;
	}

	private void setHeaderOrFooterView(Object viewObj, boolean isHeader)
	{
		if (viewObj instanceof TiViewProxy) {
			TiViewProxy viewProxy = (TiViewProxy) viewObj;
			View view = layoutHeaderOrFooterView(viewProxy);
			if (view != null) {
				if (isHeader) {
					headerView = view;
				} else {
					footerView = view;
				}
			}
		}
	}

	private void reFilter(String searchText)
	{
		int numResults = 0;
		if (searchText != null) {
			for (int i = 0; i < sections.size(); ++i) {
				ListSectionProxy section = sections.get(i);
				numResults += section.applyFilter(searchText);
			}
		}
		if (numResults == 0) {
			fireEvent(TiC.EVENT_NO_RESULTS, null);
		}
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	private boolean isSearchViewValid(TiViewProxy proxy)
	{
		if (proxy instanceof SearchBarProxy || proxy instanceof SearchViewProxy) {
			return true;
		} else {
			return false;
		}
	}

	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{

		if (key.equals(TiC.PROPERTY_HEADER_TITLE)) {
			setHeaderTitle(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_FOOTER_TITLE)) {
			setFooterTitle(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_SECTIONS) && newValue instanceof Object[]) {
			processSectionsAndNotify((Object[]) newValue);
		} else if (key.equals(TiC.PROPERTY_REFRESH_CONTROL)) {
			if (newValue == null) {
				RefreshControlProxy.unassignFrom(this.wrapper);
			} else if (newValue instanceof RefreshControlProxy) {
				((RefreshControlProxy) newValue).assignTo(this.wrapper);
			} else {
				Log.e(TAG, "Invalid value assigned to property '" + key + "'. Must be of type 'RefreshControl'.");
			}
		} else if (key.equals(TiC.PROPERTY_SEARCH_TEXT)) {
			this.searchText = TiConvert.toString(newValue);
			if (this.searchText != null) {
				reFilter(this.searchText);
			}
		} else if (key.equals(TiC.PROPERTY_CASE_INSENSITIVE_SEARCH)) {
			this.caseInsensitive = TiConvert.toBoolean(newValue, true);
			if (this.searchText != null) {
				reFilter(this.searchText);
			}
		} else if (key.equals(TiC.PROPERTY_SEARCH_VIEW)) {
			TiViewProxy searchView = (TiViewProxy) newValue;
			if (isSearchViewValid(searchView)) {
				TiUIView search = searchView.getOrCreateView();
				setSearchListener(searchView, search);
				if (searchLayout != null) {
					searchLayout.removeAllViews();
					addSearchLayout(searchLayout, searchView, search);
				} else {
					layoutSearchView(searchView);
				}
			} else {
				Log.e(TAG, "Searchview type is invalid");
			}

		} else if (key.equals(TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR) && newValue != null) {
			listView.setVerticalScrollBarEnabled(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE) && newValue != null) {
			defaultTemplateBinding = TiConvert.toString(newValue);
			refreshItems();
		} else if (key.equals(TiC.PROPERTY_SEPARATOR_COLOR)) {
			String color = TiConvert.toString(newValue);
			setSeparatorColor(color);
		} else if (key.equals(TiC.PROPERTY_SEPARATOR_HEIGHT)) {
			TiDimension dHeight = TiConvert.toTiDimension(newValue, -1);
			int height = dHeight.getAsPixels(listView);
			if (height >= 0) {
				dividerHeight = height;
				listView.setDividerHeight(height);
			}
		} else if (key.equals(TiC.PROPERTY_CAN_SCROLL)) {
			this.listView.setTouchScrollable(TiConvert.toBoolean(newValue, true));
		} else if (key.equals(TiC.PROPERTY_FAST_SCROLL)) {
			listView.setFastScrollEnabled(TiConvert.toBoolean(newValue, false));
		} else if (key.equals(TiC.PROPERTY_SCROLL_DAMPING)) {
			scrollDamping = TiConvert.toInt(newValue, 0);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	private void setSearchListener(TiViewProxy searchView, TiUIView search)
	{
		if (searchView instanceof SearchBarProxy) {
			((TiUISearchBar) search).setOnSearchChangeListener(this);
		} else if (searchView instanceof SearchViewProxy) {
			((TiUISearchView) search).setOnSearchChangeListener(this);
		}
	}

	private void setSeparatorColor(String color)
	{
		int sepColor = TiColorHelper.parseColor(color);
		int dHeight = 0;
		if (dividerHeight == 0) {
			dHeight = listView.getDividerHeight();
		} else {
			dHeight = dividerHeight;
		}
		listView.setDivider(new ColorDrawable(sepColor));
		listView.setDividerHeight(dHeight);
	}

	public void setSeparatorStyle(int style)
	{
		if (style == UIModule.TABLE_VIEW_SEPARATOR_STYLE_NONE) {
			listView.setDividerHeight(0);
		} else if (style == UIModule.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE) {
			listView.setDividerHeight(dividerHeight);
		}
	}

	private void refreshItems()
	{
		for (int i = 0; i < sections.size(); i++) {
			ListSectionProxy section = sections.get(i);
			section.refreshItems();
		}
	}

	protected void processTemplates(KrollDict templates)
	{
		for (String key : templates.keySet()) {
			// Here we bind each template with a key so we can use it to look up later
			KrollDict properties = new KrollDict((HashMap) templates.get(key));
			TiListViewTemplate template = new TiListViewTemplate(key, properties);
			// Set type to template, for recycling purposes.
			template.setType(getItemType());
			templatesByBinding.put(key, template);
			// set parent of root item
			template.setRootParent(proxy);
		}
	}

	public View layoutHeaderOrFooterView(TiViewProxy viewProxy)
	{
		TiUIView tiView = viewProxy.peekView();
		if (tiView != null) {
			TiViewProxy parentProxy = viewProxy.getParent();
			// Remove parent view if possible
			if (parentProxy != null) {
				TiUIView parentView = parentProxy.peekView();
				if (parentView != null) {
					parentView.remove(tiView);
				}
			}
		} else {
			TiViewProxy listViewProxy = getProxy();
			if ((listViewProxy != null) && (listViewProxy.getActivity() != null)) {
				viewProxy.setActivity(listViewProxy.getActivity());
			}
			tiView = viewProxy.forceCreateView();
		}
		View outerView = tiView.getOuterView();
		ViewGroup parentView = (ViewGroup) outerView.getParent();
		if (parentView != null && parentView.getId() == HEADER_FOOTER_WRAP_ID) {
			return parentView;
		} else {
			// add a wrapper so layout params such as height, width takes in effect.
			TiCompositeLayout wrapper = new TiCompositeLayout(viewProxy.getActivity(), LayoutArrangement.DEFAULT, null);
			AbsListView.LayoutParams params = new AbsListView.LayoutParams(AbsListView.LayoutParams.MATCH_PARENT,
																		   AbsListView.LayoutParams.WRAP_CONTENT);
			wrapper.setLayoutParams(params);
			outerView = tiView.getOuterView();
			wrapper.addView(outerView, tiView.getLayoutParams());
			wrapper.setId(HEADER_FOOTER_WRAP_ID);
			return wrapper;
		}
	}

	protected void processSections(Object[] sections)
	{
		for (ListSectionProxy listSectionProxy : this.sections) {
			listSectionProxy.releaseViews();
		}
		this.sections.clear();

		for (int i = 0; i < sections.length; i++) {
			processSection(sections[i], -1);
		}
	}

	protected void processSectionsAndNotify(Object[] sections)
	{
		processSections(sections);
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	protected void processSection(Object sec, int index)
	{
		if (sec instanceof ListSectionProxy) {
			ListSectionProxy section = (ListSectionProxy) sec;
			if (this.sections.contains(section)) {
				return;
			}
			if (index == -1 || index >= sections.size()) {
				this.sections.add(section);
			} else {
				this.sections.add(index, section);
			}
			section.setAdapter(adapter);
			section.setListView(this);
			// Attempts to set type for existing templates.
			section.setTemplateType();
			// Process preload data if any
			section.processPreloadData();
			// Apply filter if necessary
			if (searchText != null) {
				section.applyFilter(searchText);
			}
		}
	}

	protected Pair<ListSectionProxy, Pair<Integer, Integer>> getSectionInfoByEntryIndex(int index)
	{
		if (index < 0) {
			return null;
		}
		for (int i = 0; i < sections.size(); i++) {
			ListSectionProxy section = sections.get(i);
			int sectionItemCount = section.getItemCount();
			if (index <= sectionItemCount - 1) {
				return new Pair<ListSectionProxy, Pair<Integer, Integer>>(section,
																		  new Pair<Integer, Integer>(i, index));
			} else {
				index -= sectionItemCount;
			}
		}

		return null;
	}

	public int getItemType()
	{
		return itemTypeCount.getAndIncrement();
	}

	public TiListViewTemplate getTemplateByBinding(String binding)
	{
		return templatesByBinding.get(binding);
	}

	public String getDefaultTemplateBinding()
	{
		return defaultTemplateBinding;
	}

	public int getSectionCount()
	{
		return sections.size();
	}

	public void appendSection(Object section)
	{
		if (section instanceof Object[]) {
			Object[] secs = (Object[]) section;
			for (int i = 0; i < secs.length; i++) {
				processSection(secs[i], -1);
			}
		} else {
			processSection(section, -1);
		}
		adapter.notifyDataSetChanged();
	}

	public void deleteSectionAt(int index)
	{
		if (index >= 0 && index < sections.size()) {
			sections.remove(index);
			adapter.notifyDataSetChanged();
		} else {
			Log.e(TAG, "Invalid index to delete section");
		}
	}

	public void insertSectionAt(int index, Object section)
	{
		if (index > sections.size()) {
			Log.e(TAG, "Invalid index to insert/replace section");
			return;
		}
		if (section instanceof Object[]) {
			Object[] secs = (Object[]) section;
			for (int i = 0; i < secs.length; i++) {
				processSection(secs[i], index);
				index++;
			}
		} else {
			processSection(section, index);
		}
		adapter.notifyDataSetChanged();
	}

	public void replaceSectionAt(int index, Object section)
	{
		deleteSectionAt(index);
		insertSectionAt(index, section);
	}

	private int findItemPosition(int sectionIndex, int sectionItemIndex)
	{
		int position = 0;
		for (int i = 0; i < sections.size(); i++) {
			ListSectionProxy section = sections.get(i);
			if (i == sectionIndex) {
				if (sectionItemIndex >= section.getContentCount()) {
					Log.e(TAG, "Invalid item index");
					return -1;
				}
				position += sectionItemIndex;
				if (section.getHeaderTitle() != null) {
					position += 1;
				}
				break;
			} else {
				position += section.getItemCount();
			}
		}
		return position;
	}

	protected void scrollToItem(int sectionIndex, int sectionItemIndex, boolean animated)
	{
		final int position = findItemPosition(sectionIndex, sectionItemIndex);
		if (position > -1) {
			if (animated) {
				listView.smoothScrollToPosition(position + 1);
			} else {
				listView.post(new Runnable() {
					@Override
					public void run()
					{
						listView.setSelection(position + 1);
					}
				});
			}
		}
	}

	public void release()
	{
		for (int i = 0; i < sections.size(); i++) {
			sections.get(i).releaseViews();
		}

		templatesByBinding.clear();
		sections.clear();

		// If a refresh control is currently assigned, then detach it.
		RefreshControlProxy.unassignFrom(this.wrapper);

		if (wrapper != null) {
			wrapper = null;
		}

		if (listView != null) {
			listView.setAdapter(null);
			listView = null;
		}
		if (headerView != null) {
			headerView = null;
		}
		if (footerView != null) {
			footerView = null;
		}

		super.release();
	}

	@Override
	public void filterBy(String text)
	{
		this.searchText = text;
		reFilter(text);
	}

	public ListSectionProxy[] getSections()
	{
		return sections.toArray(new ListSectionProxy[sections.size()]);
	}
}
