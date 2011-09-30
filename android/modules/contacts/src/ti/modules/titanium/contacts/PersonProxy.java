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

import android.graphics.Bitmap;

@Kroll.proxy(parentModule=ContactsModule.class)
public class PersonProxy extends KrollProxy
{
	@Kroll.property protected String lastName, firstName, fullName, middleName, firstPhonetic, lastPhonetic, middlePhonetic, department;
	@Kroll.property protected String jobTitle, nickname, note, organization, prefix, suffix;
	@Kroll.property protected String birthday, created, modified;
	
	@Kroll.property protected int kind;
	@Kroll.property protected KrollDict email, phone, address;
	@Kroll.property protected long id;
	
	private TiBlob image = null;
	private boolean imageFetched; // lazy load these bitmap images
	protected boolean hasImage = false;

	/*
	public PersonProxy(TiContext tiContext)
	{
		super(tiContext);
	}
	*/
	
	private boolean isPhotoFetchable()
	{
		return (id > 0 && hasImage );
	}
	
	@Kroll.method @Kroll.getProperty
	public TiBlob getImage()
	{
		if (this.image != null) {
			return this.image;
		} else if (!imageFetched && isPhotoFetchable()) {
			Bitmap photo = CommonContactsApi.getContactImage(this.id);
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
		email = contactMethodMapToDict(map);
	}
	
	protected void setPhoneFromMap(Map<String, ArrayList<String>> map)
	{
		phone = contactMethodMapToDict(map);
	}
	
	protected void setAddressFromMap(Map<String, ArrayList<String>> map)
	{
		// We're supposed to support "Street", "CountryCode", "State", etc.
		// But Android 1.6 does not have structured addresses so we're just put
		// everything in Street.
		address = new KrollDict();
		for (String key: map.keySet()) {
			ArrayList<String> values = map.get(key);
			KrollDict[] dictValues = new KrollDict[values.size()];
			for (int i = 0; i < dictValues.length; i++) {
				dictValues[i] = new KrollDict();
				dictValues[i].put("Street", values.get(i));
			}
			address.put(key, dictValues);
		}
	}
}
