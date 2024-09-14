/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.searchview;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar.OnSearchChangeListener;
import androidx.appcompat.widget.SearchView;

import android.app.Activity;
import android.widget.EditText;

public class TiUISearchView extends TiUIView implements SearchView.OnQueryTextListener, SearchView.OnCloseListener
{
	private SearchView searchView;

	private boolean changeEventEnabled = true;

	public static final String TAG = "SearchView";

	protected OnSearchChangeListener searchChangeListener;

	public TiUISearchView(TiViewProxy proxy)
	{
		super(proxy);

		searchView = new SearchView(proxy.getActivity());
		searchView.setOnQueryTextListener(this);
		searchView.setOnCloseListener(this);
		searchView.setOnQueryTextFocusChangeListener(this);

		setNativeView(searchView);
	}

	@Override
	public void processProperties(KrollDict props)
	{
		super.processProperties(props);

		final Activity activity = proxy.getActivity();

		// Check if the hint text is specified when the view is created.
		if (props.containsKey(TiC.PROPERTY_HINT_TEXT)) {
			searchView.setQueryHint(props.getString(TiC.PROPERTY_HINT_TEXT));
		}
		if (props.containsKey(TiC.PROPERTY_HINT_TEXT_COLOR)) {
			try {
				int id = TiRHelper.getResource("id.search_src_text");
				EditText text = (EditText) searchView.findViewById(id);
				if (text != null) {
					text.setHintTextColor(TiConvert.toColor(props, TiC.PROPERTY_HINT_TEXT_COLOR, activity));
				}
			} catch (ResourceNotFoundException e) {
				Log.e(TAG, "Could not find SearchView EditText");
			}
		}
		if (props.containsKey(TiC.PROPERTY_VALUE)) {
			changeEventEnabled = false;
			searchView.setQuery(props.getString(TiC.PROPERTY_VALUE), false);
			changeEventEnabled = true;
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
		if (props.containsKey(TiC.PROPERTY_COLOR)) {
			try {
				int id = TiRHelper.getResource("id.search_src_text");
				EditText text = (EditText) searchView.findViewById(id);
				if (text != null) {
					text.setTextColor(TiConvert.toColor(props, TiC.PROPERTY_COLOR, activity));
				}
			} catch (ResourceNotFoundException e) {
				Log.e(TAG, "Could not find SearchView EditText");
			}
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{

		if (key.equals(TiC.PROPERTY_COLOR)) {
			try {
				int id = TiRHelper.getResource("id.search_src_text");
				EditText text = (EditText) searchView.findViewById(id);
				if (text != null) {
					// TODO: reset to default value when property is null
					text.setTextColor(TiConvert.toColor(newValue, proxy.getActivity()));
				}
			} catch (ResourceNotFoundException e) {
				Log.e(TAG, "Could not find SearchView EditText");
			}
		} else if (key.equals(TiC.PROPERTY_HINT_TEXT)) {
			searchView.setQueryHint((String) newValue);
		} else if (key.equals(TiC.PROPERTY_HINT_TEXT_COLOR)) {
			try {
				int id = TiRHelper.getResource("id.search_src_text");
				EditText text = (EditText) searchView.findViewById(id);
				if (text != null) {
					// TODO: reset to default value when property is null
					text.setHintTextColor(TiConvert.toColor(newValue, proxy.getActivity()));
				}
			} catch (ResourceNotFoundException e) {
				Log.e(TAG, "Could not find SearchView EditText");
			}
		} else if (key.equals(TiC.PROPERTY_VALUE)) {
			searchView.setQuery((String) newValue, false);
		} else if (key.equals(TiC.PROPERTY_ICONIFIED)) {
			searchView.setIconified(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_ICONIFIED_BY_DEFAULT)) {
			searchView.setIconifiedByDefault(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_SUBMIT_ENABLED)) {
			searchView.setSubmitButtonEnabled(TiConvert.toBoolean(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public boolean onClose()
	{
		fireEvent(TiC.EVENT_CANCEL, null);
		return false;
	}

	@Override
	public boolean onQueryTextChange(String query)
	{
		proxy.setProperty(TiC.PROPERTY_VALUE, query);
		if (searchChangeListener != null) {
			searchChangeListener.filterBy(query);
		}
		if (changeEventEnabled) {
			fireEvent(TiC.EVENT_CHANGE, null);
		}
		return false;
	}

	@Override
	public boolean onQueryTextSubmit(String query)
	{
		TiUIHelper.showSoftKeyboard(nativeView, false);
		fireEvent(TiC.EVENT_SUBMIT, null);
		return false;
	}

	public void setOnSearchChangeListener(OnSearchChangeListener listener)
	{
		searchChangeListener = listener;
	}

	@Override
	public void release()
	{
		if (searchView != null) {
			searchView.setOnQueryTextListener(null);
			searchView.setOnCloseListener(null);
			searchView.setOnQueryTextFocusChangeListener(null);
			searchView = null;
		}
		if (searchChangeListener != null) {
			searchChangeListener = null;
		}
		super.release();
	}
}
