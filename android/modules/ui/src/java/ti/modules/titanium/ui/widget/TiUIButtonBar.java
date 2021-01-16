/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.graphics.drawable.Drawable;
import android.view.View;
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
				addButton(TiConvert.toString(title, ""), null);
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

				// Fetch the optional "image" property and load it as a drawable.
				Drawable imageDrawable = null;
				Object imageObject = hashMap.get(TiC.PROPERTY_IMAGE);
				if (imageObject != null) {
					imageDrawable = TiUIHelper.getResourceDrawable(imageObject);
				}

				// Add the button.
				addButton(title, imageDrawable);
			}
		}
	}

	private void addButton(String title, Drawable imageDrawable)
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
		MaterialButton button = new MaterialButton(buttonGroup.getContext(), null, R.attr.materialButtonOutlinedStyle);
		button.setText(title);
		if (imageDrawable != null) {
			button.setIcon(imageDrawable);
			if (title.isEmpty()) {
				button.setIconGravity(MaterialButton.ICON_GRAVITY_TEXT_START);
				button.setIconPadding(0);
				button.setPadding(0, 0, 0, 0);
			}
		}
		buttonGroup.addView(button);
		button.setCheckable(false);
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
