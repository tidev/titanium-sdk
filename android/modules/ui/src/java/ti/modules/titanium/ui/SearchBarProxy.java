/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar;
import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_AUTOCAPITALIZATION,
		TiC.PROPERTY_AUTOCORRECT,
		TiC.PROPERTY_BAR_COLOR,
		TiC.PROPERTY_COLOR,
		TiC.PROPERTY_HINT_TEXT,
		TiC.PROPERTY_HINT_TEXT_COLOR,
		TiC.PROPERTY_HINT_TEXT_ID,
		TiC.PROPERTY_ICONIFIED,
		TiC.PROPERTY_ICONIFIED_BY_DEFAULT,
		TiC.PROPERTY_PROMPT,
		TiC.PROPERTY_PROMPT_ID,
		TiC.PROPERTY_VALUE
})
public class SearchBarProxy extends TiViewProxy
{
	public SearchBarProxy()
	{
		this.defaultValues.put(TiC.PROPERTY_AUTOCAPITALIZATION, UIModule.TEXT_AUTOCAPITALIZATION_NONE);
		this.defaultValues.put(TiC.PROPERTY_AUTOCORRECT, false);
		this.defaultValues.put(TiC.PROPERTY_ICONIFIED_BY_DEFAULT, false);
		this.defaultValues.put(TiC.PROPERTY_SHOW_CANCEL, false);
		this.defaultValues.put(TiC.PROPERTY_VALUE, "");
	}

	@Override
	protected KrollDict getLangConversionTable()
	{
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_PROMPT, TiC.PROPERTY_PROMPT_ID);
		table.put(TiC.PROPERTY_HINT_TEXT, TiC.PROPERTY_HINT_TEXT_ID);
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUISearchBar(this);
	}

	@Kroll.getProperty(name = "focused")
	public boolean isFocused()
	{
		TiUIView v = peekView();
		if (v != null) {
			return v.isFocused();
		}
		return false;
	}

	@Kroll.getProperty
	public boolean getShowCancel()
	{
		return TiConvert.toBoolean(getProperty(TiC.PROPERTY_SHOW_CANCEL), false);
	}

	@Kroll.setProperty
	public void setShowCancel(boolean isShown)
	{
		setShowCancel(isShown, null);
	}

	@Kroll.method
	public void setShowCancel(boolean isShown, @Kroll.argument(optional = true) KrollDict options)
	{
		setPropertyAndFire(TiC.PROPERTY_SHOW_CANCEL, isShown);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.SearchBar";
	}
}
