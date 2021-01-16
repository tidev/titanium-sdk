/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RadioGroup;
import android.widget.Checkable;
import androidx.annotation.NonNull;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.button.MaterialButtonToggleGroup;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipDrawable;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.radiobutton.MaterialRadioButton;
import java.util.HashMap;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.UIModule;

public class TiUIOptionBar extends TiUIView
{
	private static final String TAG = "TiUIOptionBar";

	/** Private listener used by the processLabels() method to add options the native view. */
	private interface ProcessLabelsListener {
		void onAddOption(@NonNull String title, Drawable imageDrawable);
	}

	/** Set true to prevent "click" events from firing. Set false to allow these events. */
	private boolean isIgnoringCheckEvent;

	public TiUIOptionBar(TiViewProxy proxy)
	{
		super(proxy);

		// Determine if the options should be shown vertically or horizontally.
		String layout = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_LAYOUT), TiC.LAYOUT_HORIZONTAL);
		boolean isHorizontal = !TiC.LAYOUT_VERTICAL.equals(layout);

		// Create the native view using giving "style" and "labels" properties.
		int styleId = UIModule.OPTION_STYLE_BUTTON;
		styleId = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_STYLE), styleId);
		ViewGroup viewGroup;
		switch (styleId) {
			case UIModule.OPTION_STYLE_CHIP:
				// Create a "Choice Chip" group.
				viewGroup = new ChipGroup(proxy.getActivity());
				((ChipGroup) viewGroup).setSelectionRequired(true);
				((ChipGroup) viewGroup).setSingleSelection(true);
				processLabels((title, imageDrawable) -> {
					Chip chip = new Chip(viewGroup.getContext());
					chip.setChipDrawable(ChipDrawable.createFromAttributes(
						chip.getContext(), null, 0, R.style.Widget_MaterialComponents_Chip_Choice));
					chip.setText(title);
					if (imageDrawable != null) {
						chip.setChipIcon(imageDrawable);
						chip.setChipIconVisible(true);
						if (title.isEmpty()) {
							float size = (new TiDimension("12dp", TiDimension.TYPE_WIDTH)).getAsPixels(chip);
							chip.setChipStartPadding(size);
							chip.setChipEndPadding(size);
							chip.setTextStartPadding(0);
							chip.setTextEndPadding(0);
						}
					}
					viewGroup.addView(chip);
				});
				((ChipGroup) viewGroup).setOnCheckedChangeListener(this::onCheckChanged);
				break;
			case UIModule.OPTION_STYLE_RADIO:
				// Create a radio button group.
				viewGroup = new RadioGroup(proxy.getActivity());
				((RadioGroup) viewGroup).setOrientation(isHorizontal ? RadioGroup.HORIZONTAL : RadioGroup.VERTICAL);
				processLabels((title, imageDrawable) -> {
					MaterialRadioButton button = new MaterialRadioButton(viewGroup.getContext());
					button.setText(title);
					viewGroup.addView(button);
				});
				((RadioGroup) viewGroup).setOnCheckedChangeListener(this::onCheckChanged);
				break;
			case UIModule.OPTION_STYLE_BUTTON:
			default:
				// Create an outlined toggle button group. (Looks similar to iOS' old segmented control.)
				viewGroup = new MaterialButtonToggleGroup(proxy.getActivity());
				((MaterialButtonToggleGroup) viewGroup).setSelectionRequired(true);
				((MaterialButtonToggleGroup) viewGroup).setSingleSelection(true);
				((MaterialButtonToggleGroup) viewGroup).setOrientation(
					isHorizontal ? MaterialButtonToggleGroup.HORIZONTAL : MaterialButtonToggleGroup.VERTICAL);
				processLabels((title, imageDrawable) -> {
					MaterialButton button = new MaterialButton(
						viewGroup.getContext(), null, R.attr.materialButtonOutlinedStyle);
					button.setText(title);
					if (imageDrawable != null) {
						button.setIcon(imageDrawable);
						if (title.isEmpty()) {
							button.setIconGravity(MaterialButton.ICON_GRAVITY_TEXT_START);
							button.setIconPadding(0);
							button.setPadding(0, 0, 0, 0);
						}
					}
					//TODO: Add below when we upgrade material library to v1.3.0.
//					if (!isHorizontal) {
//						button.setInsetTop(0);
//						button.setInsetBottom(0);
//					}
					viewGroup.addView(button);
				});
				((MaterialButtonToggleGroup) viewGroup).addOnButtonCheckedListener((buttonGroup, viewId, isChecked) -> {
					onCheckChanged(buttonGroup, viewId);
				});
				break;
		}

		// Set up view to fire a "postlayout" event every time its layout has changed.
		viewGroup.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View v, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		});

		// Keep a reference to the above created view.
		setNativeView(viewGroup);
	}

	@Override
	public void processProperties(KrollDict properties)
	{
		// Validate.
		if (properties == null) {
			return;
		}

		// Apply given properties to view.
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
			}
		}
	}

	private void processLabels(@NonNull ProcessLabelsListener listener)
	{
		// Do not continue if proxy has been released.
		if (this.proxy == null) {
			return;
		}

		// Fetch "labels" property and validate it.
		Object objectValue = this.proxy.getProperty(TiC.PROPERTY_LABELS);
		if ((objectValue == null) || !objectValue.getClass().isArray()) {
			return;
		}
		Object[] objectArray = (Object[]) objectValue;
		if (objectArray.length <= 0) {
			return;
		}

		// Process the labels object.
		if (objectArray[0] instanceof String) {
			// We were given an array of option titles.
			for (Object title : objectArray) {
				listener.onAddOption(TiConvert.toString(title, ""), null);
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

				// Notify caller to add an option to the view.
				listener.onAddOption(title, imageDrawable);
			}
		}
	}

	private void onCheckChanged(ViewGroup viewGroup, int optionViewId)
	{
		// Validate.
		if ((this.proxy == null) || (viewGroup == null)) {
			return;
		}

		// Find the checked/selected view matching the given ID.
		for (int index = 0; index < viewGroup.getChildCount(); index++) {
			View childView = viewGroup.getChildAt(index);
			if ((childView instanceof Checkable) && (childView.getId() == optionViewId)) {
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
}
