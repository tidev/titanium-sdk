/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.contacts;

import java.util.ArrayList;
import java.util.Map;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;

import android.graphics.Bitmap;

@Kroll.proxy(parentModule=ContactsModule.class, propertyAccessors={
	"lastName", "firstName", "fullName", "middleName", "firstPhonetic", "lastPhonetic", "middlePhonetic", "department",
	"jobTitle", "nickname", "note", "organization", "prefix", "suffix", "birthday", "created", "modified", "kind", "email", 
	"phone", "address", TiC.PROPERTY_URL, TiC.PROPERTY_INSTANTMSG, TiC.PROPERTY_RELATED_NAMES, TiC.PROPERTY_DATE
})
public class PersonProxy extends KrollProxy
{
	private TiBlob image = null;
	public long id = -1;
	private boolean imageFetched; // lazy load these bitmap images
	protected boolean hasImage = false;
	
	//Flags to track modification
	private boolean nameModified =  false;
	private boolean phoneModified = false;
	private boolean addressModified = false;
	private boolean emailModified = false;
	private boolean instantMsgModified = false;
	private boolean relationModified = false;
	private boolean otherModified = false;
	private boolean urlModified = false;

	public PersonProxy()
	{
		super();
	}

	public PersonProxy(TiContext tiContext)
	{
		this();
	}

	private boolean isPhotoFetchable()
	{
		long id = (Long) getProperty("id");
		return (id > 0 && hasImage );
	}
	
	@Kroll.method @Kroll.getProperty
	public long getId() 
	{
		return id;
	}
	
	public void setId(long i) 
	{
		id = i;
	}
	@Kroll.method @Kroll.getProperty
	public TiBlob getImage()
	{
		if (this.image != null) {
			return this.image;
		} else if (!imageFetched && isPhotoFetchable()) {
			long id = (Long) getProperty("id");
			Bitmap photo = CommonContactsApi.getContactImage(id);
			if (photo != null) {
				this.image = TiBlob.blobFromImage(photo);
			}
			imageFetched = true;
		}
		return this.image;
	}
	
	@Kroll.method @Kroll.setProperty
	public void setImage(TiBlob blob)
	{
		image = blob;
		hasImage = true;
		imageFetched = true;
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
		setProperty("email", contactMethodMapToDict(map));
	}
	
	protected void setPhoneFromMap(Map<String, ArrayList<String>> map)
	{
		setProperty("phone", contactMethodMapToDict(map));
	}
	
	protected void setAddressFromMap(Map<String, ArrayList<String>> map)
	{
		// We're supposed to support "Street", "CountryCode", "State", etc.
		// But Android 1.6 does not have structured addresses so we're just put
		// everything in Street.
		KrollDict address = new KrollDict();
		for (String key: map.keySet()) {
			ArrayList<String> values = map.get(key);
			KrollDict[] dictValues = new KrollDict[values.size()];
			for (int i = 0; i < dictValues.length; i++) {
				dictValues[i] = new KrollDict();
				dictValues[i].put("Street", values.get(i));
			}
			address.put(key, dictValues);
		}

		setProperty("address", address);
	}
	
	public boolean getNameModified() 
	{
		return nameModified;
	}
	
	public boolean getPhoneModified() 
	{
		return phoneModified;
	}
	
	public boolean getAddressModified()
	{
		return addressModified;
	}
	
	public boolean getInstantMsgModified()
	{
		return instantMsgModified;
	}
	
	public boolean getRelationModified()
	{
		return relationModified;
	}
	
	@Override
	public void onPropertyChanged(String name, Object value) 
	{
		if (name == null) {
			return;
		}
		
		if (name.equals(TiC.PROPERTY_FIRSTNAME) || name.equals(TiC.PROPERTY_LASTNAME) || 
			name.equals(TiC.PROPERTY_MIDDLENAME) || name.equals(TiC.PROPERTY_FULLNAME)) {
			nameModified = true;
		} else if (name.equals(TiC.PROPERTY_PHONE)) {
			phoneModified = true;
		} else if (name.equals(TiC.PROPERTY_ADDRESS)) {
			addressModified = true;
		} else if (name.equals(TiC.PROPERTY_INSTANTMSG)) {
			instantMsgModified = true;
		} else if (name.equals(TiC.PROPERTY_RELATED_NAMES)) {
			relationModified = true;
		} else if (name.equals(TiC.PROPERTY_EMAIL)) {
			emailModified = true;
		} else if (name.equals(TiC.PROPERTY_BIRTHDAY) || name.equals(TiC.PROPERTY_ORGANIZATION)
				|| name.equals(TiC.PROPERTY_NOTE) || name.equals(TiC.PROPERTY_NICKNAME)) {
			otherModified = true;
		}
	}
}
