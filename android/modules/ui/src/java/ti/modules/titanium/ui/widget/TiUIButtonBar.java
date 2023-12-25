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
import androidx.appcompat.view.ContextThemeWrapper;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.button.MaterialButtonToggleGroup;
import java.util.HashMap;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIButtonBar extends TiUIView
{
	private static final String TAG = "TiUIButtonBar";

	public TiUIButtonBar(TiViewProxy proxy)
	{
		super(proxy);

		// Create view group used to host buttons.
		MaterialButtonToggleGroup buttonGroup = new MaterialButtonToggleGroup(proxy.getActivity());
		buttonGroup.setSelectionRequired(false);
		buttonGroup.setSingleSelection(false);
		buttonGroup.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View v, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		});
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
		if (key.equals(TiC.PROPERTY_LABELS)) {
			processLabels(newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
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
			// We were given an array of button titles.
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
		button.setText(title);
		if ((accessibilityLabel != null) && !accessibilityLabel.isEmpty()) {
			button.setContentDescription(accessibilityLabel);
		}
		if (imageDrawable != null) {
			button.setIcon(imageDrawable);
		}
		buttonGroup.addView(button);
		button.setCheckable(false);
		button.setEnabled(isEnabled);
		button.setOnClickListener((view) -> {
			if (this.proxy == null) {
				return;
			}
			for (int index = 0; index < buttonGroup.getChildCount(); index++) {
				View childView = buttonGroup.getChildAt(index);
				if (childView == view) {
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_INDEX, index);
					this.proxy.fireEvent(TiC.EVENT_CLICK, data);
					return;
				}
			}
		});
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
