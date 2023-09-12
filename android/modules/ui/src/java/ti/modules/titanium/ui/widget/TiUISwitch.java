/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.app.Activity;
import android.view.View;
import android.widget.CompoundButton;
import android.widget.CompoundButton.OnCheckedChangeListener;
import androidx.appcompat.widget.AppCompatToggleButton;
import com.google.android.material.checkbox.MaterialCheckBox;
import com.google.android.material.chip.Chip;
import com.google.android.material.switchmaterial.SwitchMaterial;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.UIModule;

public class TiUISwitch extends TiUIView implements OnCheckedChangeListener
{
	private static final String TAG = "TiUISwitch";

	private View.OnLayoutChangeListener layoutListener;
	private boolean oldValue = false;

	public TiUISwitch(TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a switch", Log.DEBUG_MODE);

		this.layoutListener = new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View v, int left, int top, int right, int bottom, int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		};

		propertyChanged(TiC.PROPERTY_STYLE, null, proxy.getProperty(TiC.PROPERTY_STYLE), proxy);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		if (d.containsKey(TiC.PROPERTY_STYLE)) {
			setStyle(TiConvert.toInt(d.get(TiC.PROPERTY_STYLE), UIModule.SWITCH_STYLE_SLIDER));
		}

		if (d.containsKey(TiC.PROPERTY_VALUE)) {
			oldValue = TiConvert.toBoolean(d, TiC.PROPERTY_VALUE);
		}

		View nativeView = getNativeView();
		if (nativeView != null) {
			updateButton((CompoundButton) nativeView, d);
		}
	}

	protected void updateButton(CompoundButton cb, KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			if ((cb instanceof MaterialCheckBox) || (cb instanceof Chip) || (cb instanceof SwitchMaterial)) {
				cb.setText(TiConvert.toString(d, TiC.PROPERTY_TITLE));
			}
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_OFF)) {
			if (cb instanceof AppCompatToggleButton) {
				((AppCompatToggleButton) cb).setTextOff(TiConvert.toString(d, TiC.PROPERTY_TITLE_OFF));
			} else if (cb instanceof SwitchMaterial) {
				((SwitchMaterial) cb).setTextOff(TiConvert.toString(d, TiC.PROPERTY_TITLE_OFF));
			}
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_ON)) {
			if (cb instanceof AppCompatToggleButton) {
				((AppCompatToggleButton) cb).setTextOn(TiConvert.toString(d, TiC.PROPERTY_TITLE_ON));
			} else if (cb instanceof SwitchMaterial) {
				((SwitchMaterial) cb).setTextOn(TiConvert.toString(d, TiC.PROPERTY_TITLE_ON));
			}
		}
		if (d.containsKey(TiC.PROPERTY_VALUE)) {
			cb.setChecked(TiConvert.toBoolean(d, TiC.PROPERTY_VALUE));
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			cb.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR, proxy.getActivity()));
		}
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(cb, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN)) {
			String textAlign = d.getString(TiC.PROPERTY_TEXT_ALIGN);
			TiUIHelper.setAlignment(cb, textAlign, null);
		}
		if (d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String verticalAlign = d.getString(TiC.PROPERTY_VERTICAL_ALIGN);
			TiUIHelper.setAlignment(cb, null, verticalAlign);
		}
		cb.invalidate();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}

		CompoundButton cb = (CompoundButton) getNativeView();
		if (key.equals(TiC.PROPERTY_STYLE) && newValue != null) {
			setStyle(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_TITLE)) {
			if ((cb instanceof MaterialCheckBox) || (cb instanceof Chip) || (cb instanceof SwitchMaterial)) {
				cb.setText(TiConvert.toString(newValue));
			}
		} else if (key.equals(TiC.PROPERTY_TITLE_OFF)) {
			if (cb instanceof AppCompatToggleButton) {
				((AppCompatToggleButton) cb).setTextOff((String) newValue);
			} else if (cb instanceof SwitchMaterial) {
				((SwitchMaterial) cb).setTextOff((String) newValue);
			}
		} else if (key.equals(TiC.PROPERTY_TITLE_ON)) {
			if (cb instanceof AppCompatToggleButton) {
				((AppCompatToggleButton) cb).setTextOn((String) newValue);
			} else if (cb instanceof SwitchMaterial) {
				((SwitchMaterial) cb).setTextOn((String) newValue);
			}
		} else if (key.equals(TiC.PROPERTY_VALUE)) {
			cb.setChecked(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			// TODO: reset to default value when property is null
			cb.setTextColor(TiConvert.toColor(newValue, proxy.getActivity()));
		} else if (key.equals(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(cb, (KrollDict) newValue);
		} else if (key.equals(TiC.PROPERTY_TEXT_ALIGN)) {
			TiUIHelper.setAlignment(cb, TiConvert.toString(newValue), null);
			cb.requestLayout();
		} else if (key.equals(TiC.PROPERTY_VERTICAL_ALIGN)) {
			TiUIHelper.setAlignment(cb, null, TiConvert.toString(newValue));
			cb.requestLayout();
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
 	}

	@Override
	public void onCheckedChanged(CompoundButton btn, boolean value)
	{
		KrollDict data = new KrollDict();

		proxy.setProperty(TiC.PROPERTY_VALUE, value);
		//if user triggered change, we fire it.
		if (oldValue != value) {
			data.put(TiC.PROPERTY_VALUE, value);
			fireEvent(TiC.EVENT_CHANGE, data);
			oldValue = value;
		}
	}

	protected void setStyle(int style)
	{
		CompoundButton currentButton = (CompoundButton) getNativeView();
		CompoundButton button = null;

		Activity activity = proxy.getActivity();
		if (activity == null) {
			activity = TiApplication.getAppCurrentActivity();
			if (activity == null) {
				return;
			}
		}

		switch (style) {
			case UIModule.SWITCH_STYLE_CHECKBOX:
				if (!(currentButton instanceof MaterialCheckBox)) {
					button = new MaterialCheckBox(activity);
				}
				break;

			case UIModule.SWITCH_STYLE_TOGGLE_BUTTON:
				if (!(currentButton instanceof AppCompatToggleButton)) {
					button = new AppCompatToggleButton(activity);
				}
				break;

			case UIModule.SWITCH_STYLE_SLIDER:
				if (!(currentButton instanceof SwitchMaterial)) {
					button = new SwitchMaterial(activity);
					button.setMinimumHeight(0);
					button.setMinHeight(0);
				}
				break;

			case UIModule.SWITCH_STYLE_CHIP:
				if (!(currentButton instanceof Chip)) {
					Chip chip = new Chip(activity);
					chip.setCheckable(true);
					button = chip;
				}
				break;

			default:
				return;
		}

		if (button != null) {
			setNativeView(button);
			updateButton(button, proxy.getProperties());
			button.addOnLayoutChangeListener(this.layoutListener);
			button.setOnCheckedChangeListener(this);
		}
	}
}
