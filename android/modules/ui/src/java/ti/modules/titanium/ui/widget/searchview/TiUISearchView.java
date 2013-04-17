/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.searchview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar.OnSearchChangeListener;
import android.widget.SearchView;

public class TiUISearchView extends TiUIView implements SearchView.OnQueryTextListener, SearchView.OnCloseListener {
	private SearchView searchView;

	public static final String TAG = "SearchView";

	protected OnSearchChangeListener searchChangeListener;

	public TiUISearchView(TiViewProxy proxy) {
		super(proxy);

		searchView = new SearchView(proxy.getActivity());
		searchView.setOnQueryTextListener(this);
		searchView.setOnCloseListener(this);
		searchView.setOnQueryTextFocusChangeListener(this);

		setNativeView(searchView);

	}

	@Override
	public void processProperties(KrollDict props) {
		super.processProperties(props);

		// Check if the hint text is specified when the view is created.
		if (props.containsKey(TiC.PROPERTY_HINT_TEXT)) {
			searchView.setQueryHint(props.getString(TiC.PROPERTY_HINT_TEXT));			
		} 
		if (props.containsKey(TiC.PROPERTY_VALUE)) {
			searchView.setQuery(props.getString(TiC.PROPERTY_VALUE), false);			
		} 
		if (props.containsKey(TiC.PROPERTY_ICONIFIED)) {
			searchView.setIconified(props.getBoolean(TiC.PROPERTY_ICONIFIED));
		} 
		if (props.containsKey(TiC.PROPERTY_ICONIFIED_BY_DEFAULT)) {
			searchView.setIconifiedByDefault(props.getBoolean(TiC.PROPERTY_ICONIFIED_BY_DEFAULT));
		}
		if (props.containsKey(TiC.PROPERTY_SUBMIT_ENABLED)) {
			searchView.setSubmitButtonEnabled((props.getBoolean(TiC.PROPERTY_SUBMIT_ENABLED)));			
		} 
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {

		if (key.equals(TiC.PROPERTY_HINT_TEXT)) {
			searchView.setQueryHint((String) newValue);
		}  else if (key.equals(TiC.PROPERTY_VALUE)) {
			searchView.setQuery((String) newValue, false);			
		} else if (key.equals(TiC.PROPERTY_ICONIFIED)) {
			searchView.setIconified(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_ICONIFIED_BY_DEFAULT)) {
			searchView.setIconifiedByDefault(TiConvert.toBoolean(newValue));
		} else if  (key.equals(TiC.PROPERTY_SUBMIT_ENABLED)) {
			searchView.setSubmitButtonEnabled(TiConvert.toBoolean(newValue));			
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public boolean onClose() {
		fireEvent(TiC.EVENT_CANCEL, null);
		return false;
	}

	@Override
	public boolean onQueryTextChange(String query) {
		proxy.setProperty(TiC.PROPERTY_VALUE, query);
		if (searchChangeListener != null) {
			searchChangeListener.filterBy(query);
		}
		fireEvent(TiC.EVENT_CHANGE, null);
		return false;
	}

	@Override
	public boolean onQueryTextSubmit(String query) {
		TiUIHelper.showSoftKeyboard(nativeView, false);
		fireEvent(TiC.EVENT_SUBMIT, null);
		return false;
	}

	public void setOnSearchChangeListener(OnSearchChangeListener listener) {
		searchChangeListener = listener;
	}



}