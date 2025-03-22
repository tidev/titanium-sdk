/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.view.View;
import android.widget.RadioButton;
import android.widget.RadioGroup;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIRadioButtons extends TiUIView
{
	private static final String TAG = "TiUIButtonBar";

	public TiUIRadioButtons(TiViewProxy proxy)
	{
		super(proxy);

		// Create view group used to host buttons.
		RadioGroup radioGroup = new RadioGroup(proxy.getActivity());
		setNativeView(radioGroup);
	}

	@Override
	public void processProperties(KrollDict properties)
	{
		// Validate.
		if (properties == null) {
			return;
		}

		if (properties.containsKey(TiC.PROPERTY_SELECTED_INDEX)) {
			proxy.setProperty(TiC.PROPERTY_SELECTED_INDEX, properties.getInt(TiC.PROPERTY_SELECTED_INDEX));
		}
		if (properties.containsKey(TiC.PROPERTY_LABELS)) {
			processLabels(properties.get(TiC.PROPERTY_LABELS));
		}

		super.processProperties(properties);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key == null) {
			return;
		}

		if (key.equals(TiC.PROPERTY_LABELS)) {
			processLabels(newValue);
		} else if (key.equals(TiC.PROPERTY_SELECTED_INDEX)) {
			RadioGroup radioGroup = getRadioGroup();
			int newIndex = TiConvert.toInt(newValue);
			if (radioGroup != null) {
				if (newIndex < radioGroup.getChildCount()) {
					RadioButton button = (RadioButton)
						radioGroup.getChildAt(newIndex);
					int id = button.getId();
					radioGroup.check(id);
					button.setChecked(true);
				} else {
					// change selected property back to current value
					int currentIndex = radioGroup.indexOfChild(
						radioGroup.findViewById(radioGroup.getCheckedRadioButtonId())
					);
					getProxy().setProperty(TiC.PROPERTY_SELECTED_INDEX, currentIndex);
				}
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	private void processLabels(Object labels)
	{
		if (this.proxy == null) {
			return;
		}

		RadioGroup radioGroup = getRadioGroup();
		if (radioGroup == null) {
			return;
		}

		radioGroup.removeAllViews();

		if ((labels == null) || !labels.getClass().isArray()) {
			return;
		}
		Object[] objectArray = (Object[]) labels;
		if (objectArray.length == 0) {
			return;
		}

		int count = 0;
		int selectedIndex = TiConvert.toInt(getProxy().getProperty(TiC.PROPERTY_SELECTED_INDEX));
		if (objectArray[0] instanceof String) {
			for (Object title : objectArray) {
				boolean selected = (selectedIndex > -1 && selectedIndex == count);
				addButton(TiConvert.toString(title, ""), selected);
				count++;
			}
		}
	}

	private void addButton(String title, boolean isSelected)
	{
		// Fetch the radio group view.
		RadioGroup radioGroup = getRadioGroup();
		if (radioGroup == null) {
			return;
		}

		// Title must be non-null.
		if (title == null) {
			title = "";
		}

		RadioButton radioButton = new RadioButton(TiApplication.getAppRootOrCurrentActivity());
		radioButton.setText(title);
		radioGroup.addView(radioButton);
		if (isSelected) {
			radioButton.setChecked(true);
			radioGroup.check(radioButton.getId());
		}
		radioButton.setOnClickListener(v -> {
			int index = radioGroup.indexOfChild(radioGroup.findViewById(v.getId()));
			proxy.setProperty(TiC.PROPERTY_SELECTED_INDEX, index);
			KrollDict kd = new KrollDict();
			kd.put("index", index);
			fireEvent(TiC.EVENT_CLICK, kd);
		});
	}

	private RadioGroup getRadioGroup()
	{
		View view = getNativeView();
		if (view instanceof RadioGroup) {
			return (RadioGroup) view;
		}
		return null;
	}
}
