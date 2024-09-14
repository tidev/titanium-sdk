/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.searchbar;

import android.app.Activity;
import android.content.Context;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.text.InputType;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.ImageView;
import androidx.appcompat.widget.SearchView;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.UIModule;

public class TiUISearchBar extends TiUIView
{
	public interface OnSearchChangeListener {
		void filterBy(String text);
	}

	/** Listener to be invoked when search text changes. Typically assigned by ListView/TableView. */
	private OnSearchChangeListener searchChangeListener;

	/** Set true to prevent "change" events from firing. Set false to allow these events. */
	private boolean isIgnoringChangeEvent;

	/** Reference to clear button's image drawable. */
	private Drawable closeButtonDrawable;

	/** Used to show/hide the virtual keyboard. */
	private InputMethodManager inputManager;

	public TiUISearchBar(TiViewProxy proxy)
	{
		super(proxy);

		// Fetch input manager used to show/hide the virtual keyboard.
		TiApplication tiApp = TiApplication.getInstance();
		this.inputManager = (InputMethodManager) tiApp.getSystemService(Context.INPUT_METHOD_SERVICE);

		// Create and set up the search view.
		SearchView searchView = new SearchView(proxy.getActivity());
		searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
			@Override
			public boolean onQueryTextChange(String query)
			{
				proxy.setProperty(TiC.PROPERTY_VALUE, query);
				if (searchChangeListener != null) {
					searchChangeListener.filterBy(query);
				}
				if (!isIgnoringChangeEvent) {
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_VALUE, query);
					fireEvent(TiC.EVENT_CHANGE, data);
				}
				return false;
			}
			@Override
			public boolean onQueryTextSubmit(String query)
			{
				blur();
				KrollDict data = new KrollDict();
				data.put(TiC.PROPERTY_VALUE, query);
				fireEvent(TiC.EVENT_RETURN, data);
				return false;
			}
		});
		searchView.setOnSearchClickListener((View view) -> {
			if (this.proxy != null) {
				this.proxy.setProperty(TiC.PROPERTY_ICONIFIED, searchView.isIconified());
			}
		});
		searchView.setOnCloseListener(() -> {
			fireEvent(TiC.EVENT_CANCEL, null);
			return false;
		});
		searchView.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View v, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		});
		searchView.setOnQueryTextFocusChangeListener(this);
		setNativeView(searchView);
	}

	@Override
	public void release()
	{
		this.searchChangeListener = null;
		this.closeButtonDrawable = null;
		super.release();
	}

	@Override
	public void processProperties(KrollDict properties)
	{
		// Validate.
		if (properties == null) {
			return;
		}

		// Fetch the search view.
		SearchView searchView = getSearchView();
		if (searchView == null) {
			return;
		}

		final Activity activity = proxy.getActivity();

		// Apply given properties to view.
		if (properties.containsKey(TiC.PROPERTY_BAR_COLOR)) {
			searchView.setBackgroundColor(TiConvert.toColor(properties, TiC.PROPERTY_BAR_COLOR, activity));
		}
		if (properties.containsKey(TiC.PROPERTY_COLOR)) {
			EditText editText = getEditText();
			if (editText != null) {
				editText.setTextColor(TiConvert.toColor(properties, TiC.PROPERTY_COLOR, activity));
			}
		}
		if (properties.containsKey(TiC.PROPERTY_VALUE)) {
			boolean wasIgnored = this.isIgnoringChangeEvent;
			this.isIgnoringChangeEvent = true;
			searchView.setQuery(TiConvert.toString(properties, TiC.PROPERTY_VALUE), false);
			this.isIgnoringChangeEvent = wasIgnored;
		}
		if (properties.containsKey(TiC.PROPERTY_HINT_TEXT)) {
			searchView.setQueryHint(properties.getString(TiC.PROPERTY_HINT_TEXT));
		}
		if (properties.containsKey(TiC.PROPERTY_HINT_TEXT_COLOR)) {
			EditText editText = getEditText();
			if (editText != null) {
				editText.setHintTextColor(TiConvert.toColor(properties, TiC.PROPERTY_HINT_TEXT_COLOR, activity));
			}
		}
		if (properties.containsKey(TiC.PROPERTY_ICONIFIED)) {
			searchView.setIconified(TiConvert.toBoolean(properties, TiC.PROPERTY_ICONIFIED, false));
		}
		if (properties.containsKey(TiC.PROPERTY_ICONIFIED_BY_DEFAULT)) {
			searchView.setIconifiedByDefault(TiConvert.toBoolean(properties, TiC.PROPERTY_ICONIFIED_BY_DEFAULT, false));
		}
		if (properties.containsKey(TiC.PROPERTY_ICON_COLOR)) {
			updateIconColor(searchView, TiConvert.toColor(properties, TiC.PROPERTY_ICON_COLOR, activity));
		}
		updateCloseButton();
		updateInputType();

		// Let base class handle all other properties.
		super.processProperties(properties);
	}

	private void updateIconColor(SearchView searchView, int color)
	{
		ImageView imgSearch = searchView.findViewById(R.id.search_mag_icon);
		ImageView imgClose = searchView.findViewById(R.id.search_close_btn);

		if (imgSearch != null) {
			imgSearch.setColorFilter(color, PorterDuff.Mode.SRC_IN);
		}
		if (imgClose != null) {
			imgClose.setColorFilter(color, PorterDuff.Mode.SRC_IN);
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		// Validate.
		if (key == null) {
			return;
		}

		// Fetch the search view.
		SearchView searchView = getSearchView();
		if (searchView == null) {
			return;
		}

		// Handle property change.
		if (key.equals(TiC.PROPERTY_SHOW_CANCEL)) {
			updateCloseButton();
		} else if (key.equals(TiC.PROPERTY_BAR_COLOR)) {
			searchView.setBackgroundColor(TiConvert.toColor(newValue, proxy.getActivity()));
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			EditText editText = getEditText();
			if (editText != null) {
				editText.setTextColor(TiConvert.toColor(newValue, proxy.getActivity()));
			}
		} else if (key.equals(TiC.PROPERTY_VALUE)) {
			boolean wasIgnored = this.isIgnoringChangeEvent;
			this.isIgnoringChangeEvent = true;
			searchView.setQuery(TiConvert.toString(newValue), false);
			this.isIgnoringChangeEvent = wasIgnored;
		} else if (key.equals(TiC.PROPERTY_HINT_TEXT)) {
			searchView.setQueryHint(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_HINT_TEXT_COLOR)) {
			EditText editText = getEditText();
			if (editText != null) {
				editText.setHintTextColor(TiConvert.toColor(newValue, proxy.getActivity()));
			}
		} else if (key.equals(TiC.PROPERTY_ICONIFIED)) {
			searchView.setIconified(TiConvert.toBoolean(newValue, false));
		} else if (key.equals(TiC.PROPERTY_ICONIFIED_BY_DEFAULT)) {
			searchView.setIconifiedByDefault(TiConvert.toBoolean(newValue, false));
		} else if (key.equals(TiC.PROPERTY_AUTOCAPITALIZATION) || key.equals(TiC.PROPERTY_AUTOCORRECT)) {
			updateInputType();
		} else if (key.equals(TiC.PROPERTY_ICON_COLOR)) {
			updateIconColor(searchView, TiConvert.toColor(newValue, proxy.getActivity()));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void focus()
	{
		// Fetch the search view.
		SearchView searchView = getSearchView();
		if (searchView == null) {
			return;
		}

		// Expand search view if currently iconified.
		if (searchView.isIconified()) {
			searchView.setIconified(false);
		}

		// Give this view the focus.
		super.focus();

		// Show the virtual keyboard.
		this.inputManager.toggleSoftInput(InputMethodManager.SHOW_FORCED, InputMethodManager.HIDE_IMPLICIT_ONLY);
	}

	@Override
	public void blur()
	{
		// Fetch the search view.
		SearchView searchView = getSearchView();
		if (searchView == null) {
			return;
		}

		// Change the focus to the activity's root view. (The focus has to go somewhere.)
		View rootView = searchView.getRootView();
		if (rootView != null) {
			rootView.setFocusable(true);
			rootView.setFocusableInTouchMode(true);
			if (rootView instanceof ViewGroup) {
				((ViewGroup) rootView).setDescendantFocusability(ViewGroup.FOCUS_BEFORE_DESCENDANTS);
			}
			rootView.requestFocus();
		}

		// Remove focus from search view and hide keyboard.
		searchView.clearFocus();
		this.inputManager.hideSoftInputFromWindow(searchView.getWindowToken(), 0);
	}

	public OnSearchChangeListener getOnSearchChangeListener()
	{
		return this.searchChangeListener;
	}

	public void setOnSearchChangeListener(OnSearchChangeListener listener)
	{
		this.searchChangeListener = listener;
	}

	private void updateCloseButton()
	{
		// Do not continue if proxy was released.
		if (this.proxy == null) {
			return;
		}

		// Fetch the search view.
		SearchView searchView = getSearchView();
		if (searchView == null) {
			return;
		}

		// Fetch close button from the search view.
		View view = searchView.findViewById(R.id.search_close_btn);
		if (!(view instanceof ImageView)) {
			return;
		}
		ImageView imageView = (ImageView) view;

		// Store a reference to close button's image, if not done already.
		if (this.closeButtonDrawable == null) {
			this.closeButtonDrawable = imageView.getDrawable();
		}

		// Show/hide the close button by adding/removing its image. (There is no other way to do this.)
		boolean isShown = TiConvert.toBoolean(this.proxy.getProperty(TiC.PROPERTY_SHOW_CANCEL), false);
		if (isShown) {
			imageView.setImageDrawable(this.closeButtonDrawable);
		} else {
			imageView.setImageDrawable(null);
		}
		imageView.setEnabled(isShown);
	}

	private void updateInputType()
	{
		// Do not continue if proxy was released.
		if (this.proxy == null) {
			return;
		}

		// Fetch the search view.
		SearchView searchView = getSearchView();
		if (searchView == null) {
			return;
		}

		// Update the search view's input type.
		int inputTypeFlags = InputType.TYPE_CLASS_TEXT;
		if (TiConvert.toBoolean(this.proxy.getProperty(TiC.PROPERTY_AUTOCORRECT), false)) {
			inputTypeFlags |= InputType.TYPE_TEXT_FLAG_AUTO_CORRECT;
		}
		int autoCapId = TiConvert.toInt(
			this.proxy.getProperty(TiC.PROPERTY_AUTOCAPITALIZATION), UIModule.TEXT_AUTOCAPITALIZATION_NONE);
		switch (autoCapId) {
			case UIModule.TEXT_AUTOCAPITALIZATION_ALL:
				inputTypeFlags |= InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS;
				break;
			case UIModule.TEXT_AUTOCAPITALIZATION_SENTENCES:
				inputTypeFlags |= InputType.TYPE_TEXT_FLAG_CAP_SENTENCES;
				break;
			case UIModule.TEXT_AUTOCAPITALIZATION_WORDS:
				inputTypeFlags |= InputType.TYPE_TEXT_FLAG_CAP_WORDS;
				break;
		}
		searchView.setInputType(inputTypeFlags);
	}

	private SearchView getSearchView()
	{
		View view = getNativeView();
		if (view instanceof SearchView) {
			return (SearchView) view;
		}
		return null;
	}

	private EditText getEditText()
	{
		SearchView searchView = getSearchView();
		if (searchView != null) {
			View view = searchView.findViewById(R.id.search_src_text);
			if (view instanceof EditText) {
				return (EditText) view;
			}
		}
		return null;
	}
}
