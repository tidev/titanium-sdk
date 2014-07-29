/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.titanium.TiContext;

import android.graphics.Bitmap;
import android.util.Log;

@Kroll.proxy(parentModule=ContactsModule.class, propertyAccessors={
	TiC.PROPERTY_NOTE,
	TiC.PROPERTY_BIRTHDAY,
	TiC.PROPERTY_EMAIL,
	TiC.PROPERTY_PHONE,
	TiC.PROPERTY_ADDRESS,
	TiC.PROPERTY_URL,
	TiC.PROPERTY_INSTANTMSG,
	TiC.PROPERTY_RELATED_NAMES,
	TiC.PROPERTY_DATE,
	TiC.PROPERTY_KIND
})
public class PersonProxy extends KrollProxy
{
	private static final String TAG = "Person";
	private TiBlob image = null;
	private boolean imageFetched; // lazy load these bitmap images
	protected boolean hasImage = false;
	private String fullName = "";
	private String firstName = "";
	private String lastName = "";
	private String prefix = "";
	private String middleName = "";
	private String suffix = "";
	private String nickName = "";
	private String firstPhonetic = "";
	private String middlePhonetic = "";
	private String lastPhonetic = "";
	private String organization = "";
	private String jobTitle = "";
	private String department = "";
	private String birthDay = "";
	
	// Contact Modifications
	private HashMap<String, Boolean> modified = new HashMap<String, Boolean>();

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
		long id = (Long) getProperty(TiC.PROPERTY_ID);
		return (id > 0 && hasImage );
	}
	
	public void finishModification()
	{
		modified.clear();
	}

	@Kroll.method @Kroll.getProperty
	public String getFullName() 
	{
		return fullName;
	}
	
	public void setFullName(String fname) 
	{
		fullName = fname;
	}
	
	@Kroll.method @Kroll.getProperty
	public String getFirstName()
	{
		return firstName;
	}

	@Kroll.method @Kroll.getProperty
	public String getLastName()
	{
		return lastName;
	}

	@Kroll.method @Kroll.getProperty
	public String getPrefix()
	{
		return prefix;
	}

	@Kroll.method @Kroll.getProperty
	public String getMiddleName()
	{
		return middleName;
	}

	@Kroll.method @Kroll.getProperty
	public String getSuffix()
	{
		return suffix;
	}

	@Kroll.method @Kroll.setProperty
	public void setMiddleName(String mname)
	{
		middleName = mname;
	}

	public void setSuffix(String sname)
	{
		suffix = sname;
	}

	public void setPrefix(String pname)
	{
		prefix = pname;
	}

	@Kroll.method @Kroll.setProperty
	public void setFirstName(String fname)
	{
		firstName = fname;
	}

	@Kroll.method @Kroll.setProperty
	public void setLastName(String lname)
	{
		lastName = lname;
	}

	@Kroll.method @Kroll.getProperty
	public String getFirstPhonetic()
	{
		return firstPhonetic;
	}

	@Kroll.method @Kroll.setProperty
	public void setFirstPhonetic(String fphonetic)
	{
		firstPhonetic = fphonetic;
	}

	@Kroll.method @Kroll.getProperty
	public String getMiddlePhonetic()
	{
		return middlePhonetic;
	}

	@Kroll.method @Kroll.setProperty
	public void setMiddlePhonetic(String mphonetic)
	{
		middlePhonetic = mphonetic;
	}
	
	@Kroll.method @Kroll.getProperty
	public String getLastPhonetic()
	{
		return lastPhonetic;
	}

	@Kroll.method @Kroll.setProperty
	public void setLastPhonetic(String lphonetic)
	{
		lastPhonetic = lphonetic;
	}
	
	@Kroll.method @Kroll.getProperty
	public String getBirthDay()
	{
		return birthDay;
	}

	@Kroll.method @Kroll.setProperty
	public void setBirthDay(String birthday)
	{
		this.birthDay = birthday;
	}
	
	@Kroll.method @Kroll.getProperty
	public String getNickName()
	{
		return nickName;
	}

	@Kroll.method @Kroll.setProperty
	public void setNickName(String nickname)
	{
		nickName = nickname;
	}

	@Kroll.method @Kroll.getProperty
	public String getOrganization()
	{
		return this.organization;
	}

	@Kroll.method @Kroll.setProperty
	public void setOrganization(String organization)
	{
		this.organization = organization;
	}

	@Kroll.method @Kroll.getProperty
	public String getJobTitle()
	{
		return jobTitle;
	}

	@Kroll.method @Kroll.setProperty
	public void setJobTitle(String jobtitle)
	{
		jobTitle = jobtitle;
	}

	@Kroll.method @Kroll.getProperty
	public String getDepartment()
	{
		return this.department;
	}

	@Kroll.method @Kroll.setProperty
	public void setDepartment(String department)
	{
		this.department = department;
	}
	
	@Kroll.method @Kroll.getProperty
	public long getId() 
	{
		return (Long) getProperty(TiC.PROPERTY_ID);
	}

	public boolean isFieldModified(String field)
	{
		return (modified.containsKey(field) && modified.get(field));
	}
	

	@Kroll.method @Kroll.getProperty
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
	
	@Kroll.method @Kroll.setProperty
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
		for (String key: map.keySet()) {
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
		
		if (name.equals(TiC.PROPERTY_FIRSTNAME) || name.equals(TiC.PROPERTY_MIDDLENAME) || name.equals(TiC.PROPERTY_LASTNAME)) {
			modified.put(TiC.PROPERTY_NAME, true);
		} else if (name.equals(TiC.PROPERTY_BIRTHDAY)) {
			modified.put(TiC.PROPERTY_BIRTHDAY, true);
		} else if (name.equals(TiC.PROPERTY_ORGANIZATION)) {
			modified.put(TiC.PROPERTY_ORGANIZATION, true);
		} else if (name.equals(TiC.PROPERTY_NOTE)) {
			modified.put(TiC.PROPERTY_NOTE, true);
		} else if (name.equals(TiC.PROPERTY_NICKNAME)) {
			modified.put(TiC.PROPERTY_NICKNAME, true);
		} else if (name.equals(TiC.PROPERTY_PHONE)) {
			modified.put(TiC.PROPERTY_PHONE, true);
		} else if (name.equals(TiC.PROPERTY_ADDRESS)) {
			modified.put(TiC.PROPERTY_ADDRESS, true);
		} else if (name.equals(TiC.PROPERTY_INSTANTMSG)) {
			modified.put(TiC.PROPERTY_INSTANTMSG, true);
		} else if (name.equals(TiC.PROPERTY_URL)) {
			modified.put(TiC.PROPERTY_URL, true);
		} else if (name.equals(TiC.PROPERTY_EMAIL)) {
			modified.put(TiC.PROPERTY_EMAIL, true);
		} else if (name.equals(TiC.PROPERTY_RELATED_NAMES)) {
			modified.put(TiC.PROPERTY_RELATED_NAMES, true);
		} else if (name.equals(TiC.PROPERTY_DATE)) {
			modified.put(TiC.PROPERTY_DATE, true);
		}
		super.onPropertyChanged(name, value);
	}

	@Override
	public String getApiName()
	{
		return "Ti.Contacts.Person";
	}
}
