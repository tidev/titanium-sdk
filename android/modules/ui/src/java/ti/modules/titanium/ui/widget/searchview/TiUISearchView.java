/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.searchview;

import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.support.v7.widget.SearchView;
import android.text.SpannableStringBuilder;
import android.text.style.ImageSpan;
import android.widget.EditText;
import android.widget.ImageView;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar.OnSearchChangeListener;

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
		// Check if the hint text is specified when the view is created.
		if (props.containsKey(TiC.PROPERTY_HINT_TEXT)) {
			searchView.setQueryHint(props.getString(TiC.PROPERTY_HINT_TEXT));
		}
		if (props.containsKey(TiC.PROPERTY_HINT_TEXT_COLOR)) {
			updateHintColorProperty(TiConvert.toColor(props, TiC.PROPERTY_HINT_TEXT_COLOR));
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
			updateColorProperty(TiConvert.toColor(props, TiC.PROPERTY_COLOR));
		}
		if (props.containsKeyAndNotNull(TiC.PROPERTY_ICON_SEARCH_COLOR)) {
			updateIconSearchColor(TiConvert.toColor(props, TiC.PROPERTY_ICON_SEARCH_COLOR));
		}
		if (props.containsKeyAndNotNull(TiC.PROPERTY_ICON_SEARCH_CLOSE_COLOR)) {
			updateIconSearchCloseColor(TiConvert.toColor(props, TiC.PROPERTY_ICON_SEARCH_CLOSE_COLOR));
		}
		if (props.containsKeyAndNotNull(TiC.PROPERTY_ICON_SEARCH_HINT_COLOR)) {
			updateIconSearchHintColor(TiConvert.toColor(props, TiC.PROPERTY_ICON_SEARCH_HINT_COLOR));
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_COLOR)) {
			updateColorProperty(TiConvert.toColor((String) newValue));
		} else if (key.equals(TiC.PROPERTY_HINT_TEXT)) {
			searchView.setQueryHint((String) newValue);
		} else if (key.equals(TiC.PROPERTY_HINT_TEXT_COLOR)) {
			updateHintColorProperty(TiConvert.toColor((String) newValue));
		} else if (key.equals(TiC.PROPERTY_VALUE)) {
			searchView.setQuery((String) newValue, false);
		} else if (key.equals(TiC.PROPERTY_ICONIFIED)) {
			searchView.setIconified(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_ICONIFIED_BY_DEFAULT)) {
			searchView.setIconifiedByDefault(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_SUBMIT_ENABLED)) {
			searchView.setSubmitButtonEnabled(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_ICON_SEARCH_COLOR)) {
			updateIconSearchColor(TiConvert.toColor((String) newValue));
		} else if (key.equals(TiC.PROPERTY_ICON_SEARCH_CLOSE_COLOR)) {
			updateIconSearchCloseColor(TiConvert.toColor(((String) newValue)));
		} else if (key.equals(TiC.PROPERTY_ICON_SEARCH_HINT_COLOR)) {
			updateIconSearchHintColor(TiConvert.toColor(((String) newValue)));
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

	private void updateColorProperty(int colorId)
	{
		try {
			int id = TiRHelper.getResource("id.search_src_text");
			EditText text = (EditText) searchView.findViewById(id);
			if (text != null) {
				text.setTextColor(colorId);
			}
		} catch (ResourceNotFoundException e) {
			Log.e(TAG, "Could not find SearchView EditText");
		}
	}

	private void updateHintColorProperty(int colorId)
	{
		try {
			int id = TiRHelper.getResource("id.search_src_text");
			EditText text = (EditText) searchView.findViewById(id);
			if (text != null) {
				text.setHintTextColor(colorId);
			}
		} catch (ResourceNotFoundException e) {
			Log.e(TAG, "Could not find SearchView EditText");
		}
	}

	private void updateIconSearchColor(int colorId)
	{
		try {
			// Get the Search Button ImageView from the layout.
			int id = TiRHelper.getResource("id.search_button");
			ImageView buttonIV = searchView.findViewById(id);
			// Apply a color filter with the proxy's color property.
			buttonIV.setColorFilter(colorId);
			// When iconified is disabled the view uses an imageView with
			// the search_mag_icon id, so we will apply the color filter on it too.
			// In iconified mode this view is not visible.
			int idMagIcon = TiRHelper.getResource("id.search_mag_icon");
			ImageView magIconImageView = searchView.findViewById(idMagIcon);
			magIconImageView.setColorFilter(colorId);
		} catch (ResourceNotFoundException e) {
			Log.e(TAG, "Could not find SearchView Search Button");
		}
	}

	private void updateIconSearchCloseColor(int colorId)
	{
		try {
			// Get the Close Search Button ImageView from the layout.
			int closeButtonId = TiRHelper.getResource("id.search_close_btn");
			ImageView buttonIV = searchView.findViewById(closeButtonId);
			// Apply a color filter with the proxy's color property.
			buttonIV.setColorFilter(colorId);
		} catch (ResourceNotFoundException e) {
			Log.e(TAG, "Could not find SearchView Search Close Button");
		}
	}

	private void updateIconSearchHintColor(int colorInt)
	{
		try {
			// Get the EditText instance from the layout.
			EditText editText = searchView.findViewById(TiRHelper.getResource("id.search_src_text"));
			// Set the default textSize from Appcompat
			int textSize = (int) ((double) editText.getTextSize() * 1.25D);
			// Get the Search icon drawable.
			Drawable searchIconDrawable;
			searchIconDrawable = getProxy().getActivity().getResources().getDrawable(
				TiRHelper.getResource("drawable.abc_ic_search_api_material"), null);
			// Make it mutable to allow different states of it to be used.
			searchIconDrawable.mutate();
			// Apply a color filter with the color from the proxy's property.
			searchIconDrawable.setColorFilter(colorInt, PorterDuff.Mode.SRC_IN);
			// Set the default bounds from Appcompat
			searchIconDrawable.setBounds(0, 0, textSize, textSize);
			// Create the SpannableStringBuilder.
			SpannableStringBuilder ssb = new SpannableStringBuilder("   ");
			// Set the new ImageSpan.
			ssb.setSpan(new ImageSpan(searchIconDrawable), 1, 2, 33);
			ssb.append("");
			// In order to stick to the default behavior we need to manually add the hint text,
			// if there is one, to the newly created SpannableString. This is necessary because
			// calling setQuery method of the SearchView triggers the default getDecoratedHint
			// method that will create a new ImageSpan without the custom color filter.
			if (getProxy().hasPropertyAndNotNull(TiC.PROPERTY_HINT_TEXT)) {
				ssb.append(getProxy().getProperty(TiC.PROPERTY_HINT_TEXT).toString());
			}
			// Add it as a hint.
			editText.setHint(ssb);
		} catch (ResourceNotFoundException e) {
			Log.e(TAG, "Could not find SearchView EditText");
		}
	}
}
