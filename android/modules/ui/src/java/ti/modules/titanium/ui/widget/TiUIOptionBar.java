/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Checkable;
import androidx.appcompat.view.ContextThemeWrapper;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.button.MaterialButtonToggleGroup;
import java.util.HashMap;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIOptionBar extends TiUIView
{
	private static final String TAG = "TiUIOptionBar";

	/** Set true to prevent "click" events from firing. Set false to allow these events. */
	private boolean isIgnoringCheckEvent;

	public TiUIOptionBar(TiViewProxy proxy)
	{
		super(proxy);

		// Determine if the options should be shown vertically or horizontally.
		String layout = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_LAYOUT), TiC.LAYOUT_HORIZONTAL);
		boolean isHorizontal = !TiC.LAYOUT_VERTICAL.equals(layout);

		// Create an outlined toggle button group. (Looks similar to iOS' old segmented control.)
		MaterialButtonToggleGroup buttonGroup = new MaterialButtonToggleGroup(proxy.getActivity());
		buttonGroup.setSelectionRequired(true);
		buttonGroup.setSingleSelection(true);
		buttonGroup.setOrientation(
			isHorizontal ? MaterialButtonToggleGroup.HORIZONTAL : MaterialButtonToggleGroup.VERTICAL);

		// Listen for selection changes.
		buttonGroup.addOnButtonCheckedListener(this::onButtonChecked);

		// Set up view to fire a "postlayout" event every time its layout has changed.
		buttonGroup.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View v, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		});

		// Keep a reference to the above created view.
		setNativeView(buttonGroup);
	}

	@Override
	public void processProperties(KrollDict properties)
	{
		// Validate.
		if (properties == null) {
			return;
		}

		// Apply given properties to view.
		if (properties.containsKey(TiC.PROPERTY_LABELS)) {
			processLabels(properties.get(TiC.PROPERTY_LABELS));
		}
		if (properties.containsKey(TiC.PROPERTY_INDEX)) {
			checkOption(TiConvert.toInt(properties.get(TiC.PROPERTY_INDEX)));
		}

		// Let base class handle all other view property settings.
		super.processProperties(properties);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		// Validate.
		if (key == null) {
			return;
		}

		// Handle property change.
		if (key.equals(TiC.PROPERTY_INDEX)) {
			checkOption(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_LABELS)) {
			processLabels(newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	private void checkOption(int index)
	{
		View view = getNativeView();
		if (view instanceof ViewGroup) {
			ViewGroup viewGroup = (ViewGroup) view;
			if ((index >= 0) && (index < viewGroup.getChildCount())) {
				view = viewGroup.getChildAt(index);
				if (view instanceof Checkable) {
					boolean oldValue = this.isIgnoringCheckEvent;
					this.isIgnoringCheckEvent = true;
					((Checkable) view).setChecked(true);
					this.isIgnoringCheckEvent = oldValue;
				}
			} else if (index == -1) {
				// unselect all
				getButtonGroup().clearChecked();
			}
		}
	}

	private void processLabels(Object labels)
	{
		// Do not continue if proxy has been released.
		if (this.proxy == null) {
			return;
		}

		// Fetch the button group view.
		MaterialButtonToggleGroup buttonGroup = getButtonGroup();
		if (buttonGroup == null) {
			return;
		}

		// Clear the previously assigned buttons.
		buttonGroup.removeAllViews();

		// Fetch "labels" property and validate it.
		if ((labels == null) || !labels.getClass().isArray()) {
			return;
		}
		Object[] objectArray = (Object[]) labels;
		if (objectArray.length <= 0) {
			return;
		}

		// Process the labels object.
		if (objectArray[0] instanceof String) {
			// We were given an array of option titles.
			for (Object title : objectArray) {
				addButton(TiConvert.toString(title, ""), null, null, true);
			}
		} else if (objectArray[0] instanceof HashMap) {
			// We were given an array of Titanium "BarItemType" dictionaries.
			for (Object nextObject : objectArray) {
				// Make sure next element is a dictionary.
				if ((nextObject instanceof HashMap) == false) {
					continue;
				}
				HashMap hashMap = (HashMap) nextObject;

				// Fetch the optional "title" property.
				String title = TiConvert.toString(hashMap.get(TiC.PROPERTY_TITLE), "");

				// Fetch the optional "accessibilityLabel" property.
				String accessibilityLabel = TiConvert.toString(hashMap.get(TiC.PROPERTY_ACCESSIBILITY_LABEL), null);

				// Fetch the optional "image" property and load it as a drawable.
				Drawable imageDrawable = null;
				Object imageObject = hashMap.get(TiC.PROPERTY_IMAGE);
				if (imageObject != null) {
					imageDrawable = TiUIHelper.getResourceDrawable(imageObject);
				}

				// Fetch the optional "enabled" flag.
				boolean isEnabled = TiConvert.toBoolean(hashMap.get(TiC.PROPERTY_ENABLED), true);

				// Add the button.
				addButton(title, accessibilityLabel, imageDrawable, isEnabled);
			}
		}
	}

	private void addButton(String title, String accessibilityLabel, Drawable imageDrawable, boolean isEnabled)
	{
		// Fetch the button group view.
		MaterialButtonToggleGroup buttonGroup = getButtonGroup();
		if (buttonGroup == null) {
			return;
		}

		// Title must be non-null.
		if (title == null) {
			title = "";
		}

		// Create a button with given settings and add it to view group.
		Context context = buttonGroup.getContext();
		int attributeId = R.attr.materialButtonOutlinedStyle;
		if (title.isEmpty() && (imageDrawable != null)) {
			context = new ContextThemeWrapper(context, R.style.Widget_Titanium_OutlinedButton_IconOnly);
			attributeId = R.attr.materialButtonToggleGroupStyle;
		}
		MaterialButton button = new MaterialButton(context, null, attributeId);
		button.setEnabled(isEnabled);
		button.setText(title);
		if ((accessibilityLabel != null) && !accessibilityLabel.isEmpty()) {
			button.setContentDescription(accessibilityLabel);
		}
		if (imageDrawable != null) {
			button.setIcon(imageDrawable);
		}
		if (buttonGroup.getOrientation() != MaterialButtonToggleGroup.HORIZONTAL) {
			button.setInsetTop(0);
			button.setInsetBottom(0);
		}
		buttonGroup.addView(button);
	}

	private void onButtonChecked(ViewGroup viewGroup, int viewId, boolean isChecked)
	{
		// Validate.
		if ((this.proxy == null) || (viewGroup == null)) {
			return;
		}

		// Find the checked/selected view matching the given ID.
		for (int index = 0; index < viewGroup.getChildCount(); index++) {
			View childView = viewGroup.getChildAt(index);
			if ((childView instanceof Checkable) && (childView.getId() == viewId)) {
				if (((Checkable) childView).isChecked()) {
					// Update the proxy's "index" property.
					this.proxy.setProperty(TiC.PROPERTY_INDEX, index);
					// Fire a "click" event for selected option.
					if (!this.isIgnoringCheckEvent) {
						KrollDict data = new KrollDict();
						data.put(TiC.PROPERTY_INDEX, index);
						this.proxy.fireEvent(TiC.EVENT_CLICK, data);
					}
					return;
				}
			}
		}
	}

	private MaterialButtonToggleGroup getButtonGroup()
	{
		View view = getNativeView();
		if (view instanceof MaterialButtonToggleGroup) {
			return (MaterialButtonToggleGroup) view;
		}
		return null;
	}
}
