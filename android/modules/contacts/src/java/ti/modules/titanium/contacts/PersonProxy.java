/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.contacts;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;

import android.graphics.Bitmap;
import android.util.Log;

@Kroll.proxy(parentModule = ContactsModule.class,
	propertyAccessors = {
		TiC.PROPERTY_LASTNAME,
		TiC.PROPERTY_FIRSTNAME,
		TiC.PROPERTY_MIDDLENAME,
		TiC.PROPERTY_NICKNAME,
		TiC.PROPERTY_NOTE,
		TiC.PROPERTY_ORGANIZATION,
		TiC.PROPERTY_BIRTHDAY,
		TiC.PROPERTY_EMAIL,
		TiC.PROPERTY_PHONE,
		TiC.PROPERTY_ADDRESS,
		TiC.PROPERTY_URL,
		TiC.PROPERTY_INSTANTMSG,
		TiC.PROPERTY_RELATED_NAMES,
		TiC.PROPERTY_DATE,
		TiC.PROPERTY_KIND,
		TiC.PROPERTY_PREFIX,
		TiC.PROPERTY_SUFFIX,
		TiC.PROPERTY_FIRSTPHONETIC,
		TiC.PROPERTY_MIDDLEPHONETIC,
		TiC.PROPERTY_LASTPHONETIC,
		TiC.PROPERTY_JOBTITLE,
		TiC.PROPERTY_DEPARTMENT
})
public class PersonProxy extends KrollProxy
{
	private static final String TAG = "Person";
	private TiBlob image = null;
	private boolean imageFetched; // lazy load these bitmap images
	protected boolean hasImage = false;
	private String fullName = "";

	// Contact Modifications
	private final HashMap<String, Boolean> modified = new HashMap<>();

	public PersonProxy()
	{
		super();
	}

	private boolean isPhotoFetchable()
	{
		long id = (Long) getProperty(TiC.PROPERTY_ID);
		return (id > 0 && hasImage);
	}

	public void finishModification()
	{
		modified.clear();
	}

	@Kroll.getProperty
	public String getFullName()
	{
		return fullName;
	}

	public void setFullName(String fname)
	{
		fullName = fname;
	}

	@Kroll.getProperty
	public long getId()
	{
		return (Long) getProperty(TiC.PROPERTY_ID);
	}

	public boolean isFieldModified(String field)
	{
		return (modified.containsKey(field) && modified.get(field));
	}

	@Kroll.getProperty
	public TiBlob getImage()
	{
		if (this.image != null) {
			return this.image;
		} else if (!imageFetched && isPhotoFetchable()) {
			long id = (Long) getProperty(TiC.PROPERTY_ID);
			Bitmap photo = CommonContactsApi.getContactImage(id);
			if (photo != null) {
				this.image = TiBlob.blobFromImage(photo);
			}
			imageFetched = true;
		}
		return this.image;
	}

	@Kroll.setProperty
	public void setImage(TiBlob blob)
	{
		image = blob;
		hasImage = true;
		imageFetched = true;
		modified.put(TiC.PROPERTY_IMAGE, true);
	}

	private KrollDict contactMethodMapToDict(Map<String, ArrayList<String>> map)
	{
		KrollDict result = new KrollDict();
		for (String key : map.keySet()) {
			ArrayList<String> values = map.get(key);
			result.put(key, values.toArray());
		}
		return result;
	}

	protected void setEmailFromMap(Map<String, ArrayList<String>> map)
	{
		setProperty(TiC.PROPERTY_EMAIL, contactMethodMapToDict(map));
	}

	protected void setDateFromMap(Map<String, ArrayList<String>> map)
	{
		setProperty(TiC.PROPERTY_DATE, contactMethodMapToDict(map));
	}

	protected void setIMFromMap(Map<String, ArrayList<String>> map)
	{
		setProperty(TiC.PROPERTY_INSTANTMSG, contactMethodMapToDict(map));
	}

	protected void setRelatedNameFromMap(Map<String, ArrayList<String>> map)
	{
		setProperty(TiC.PROPERTY_RELATED_NAMES, contactMethodMapToDict(map));
	}

	protected void setWebSiteFromMap(Map<String, ArrayList<String>> map)
	{
		setProperty(TiC.EVENT_PROPERTY_URL, contactMethodMapToDict(map));
	}

	protected void setPhoneFromMap(Map<String, ArrayList<String>> map)
	{
		setProperty(TiC.PROPERTY_PHONE, contactMethodMapToDict(map));
	}

	protected void setAddressFromMap(Map<String, ArrayList<String>> map)
	{
		// We're supposed to support "Street", "CountryCode", "State", etc.
		// But Android 1.6 does not have structured addresses so we're just put
		// everything in Street.
		KrollDict address = new KrollDict();
		for (String key : map.keySet()) {
			ArrayList<String> values = map.get(key);
			KrollDict[] dictValues = new KrollDict[values.size()];
			for (int i = 0; i < dictValues.length; i++) {
				dictValues[i] = new KrollDict();
				dictValues[i].put("Street", values.get(i));
			}
			address.put(key, dictValues);
		}

		setProperty(TiC.PROPERTY_ADDRESS, address);
	}

	public void onPropertyChanged(String name, Object value)
	{
		if (name == null) {
			Log.w(TAG, "Property is null. Unable to process change");
			return;
		}

		if (name.equals(TiC.PROPERTY_FIRSTNAME) || name.equals(TiC.PROPERTY_MIDDLENAME)
			|| name.equals(TiC.PROPERTY_LASTNAME)) {
			modified.put(TiC.PROPERTY_NAME, true);
		} else if (name.equals(TiC.PROPERTY_BIRTHDAY) || name.equals(TiC.PROPERTY_ORGANIZATION)
				   || name.equals(TiC.PROPERTY_NOTE) || name.equals(TiC.PROPERTY_NICKNAME)
				   || name.equals(TiC.PROPERTY_PHONE) || name.equals(TiC.PROPERTY_ADDRESS)
				   || name.equals(TiC.PROPERTY_INSTANTMSG) || name.equals(TiC.PROPERTY_URL)
				   || name.equals(TiC.PROPERTY_EMAIL) || name.equals(TiC.PROPERTY_RELATED_NAMES)
				   || name.equals(TiC.PROPERTY_DATE) || name.equals(TiC.PROPERTY_KIND)
				   || name.equals(TiC.PROPERTY_PREFIX) || name.equals(TiC.PROPERTY_SUFFIX)
				   || name.equals(TiC.PROPERTY_FIRSTPHONETIC) || name.equals(TiC.PROPERTY_MIDDLEPHONETIC)
				   || name.equals(TiC.PROPERTY_LASTPHONETIC) || name.equals(TiC.PROPERTY_JOBTITLE)
				   || name.equals(TiC.PROPERTY_DEPARTMENT)) {

			modified.put(name, true);
		}
		super.onPropertyChanged(name, value);
	}

	@Override
	public String getApiName()
	{
		return "Ti.Contacts.Person";
	}
}
