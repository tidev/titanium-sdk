/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.locale;

import java.util.Locale;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiResourceHelper;

import android.telephony.PhoneNumberUtils;

public class LocaleModule extends TiModule
{
	private static final String LCAT = "LocaleModule";

	public LocaleModule(TiContext tiContext)
	{
		super(tiContext);
	}
	
	public String getCurrentLanguage()
	{
	    return Locale.getDefault().getLanguage();
	}
	
	public String getCurrentCountry()
	{
	    return Locale.getDefault().getCountry();
	}
	
	public String formatTelephoneNumber(String telephoneNumber)
	{
		return PhoneNumberUtils.formatNumber(telephoneNumber);
	}
	
	public void setLanguage(String language) 
	{
	    Log.w(LCAT,"Locale.setLanguage not supported for Android.");
	}

    public String getString(TiContext tiContext, Object args[])
    {
	    String key = (String)args[0];
	    int value = TiResourceHelper.getString(key);
	    if (value==0)
	    {
	        if (args.length > 1)
	        {
    	        return (String)args[1];
	        }
	        return null;
	    }
	    return tiContext.getActivity().getString(value);
    }
}
