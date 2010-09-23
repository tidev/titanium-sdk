/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.contacts;

import java.util.ArrayList;
import java.util.Map;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;

import android.graphics.Bitmap;

public class PersonProxy extends TiProxy
{
	private String lastName, firstName, fullName, middleName, firstPhonetic, lastPhonetic, middlePhonetic, department;
	private String jobTitle, nickname, note, organization, prefix, suffix;
	private String birthday, created, modified;
	private int kind;
	private TiDict email, phone, address;
	private long id;
	private TiBlob image = null;
	private boolean imageFetched; // lazy load these bitmap images
	protected boolean hasImage = false;
	
	public PersonProxy(TiContext tiContext)
	{
		super(tiContext);
	}
	
	private boolean isPhotoFetchable()
	{
		return (id > 0 && hasImage );
	}
	
	public TiBlob getImage()
	{
		if (this.image != null) {
			return this.image;
		} else if (!imageFetched && isPhotoFetchable()) {
			Bitmap photo = CommonContactsApi.getContactImage(getTiContext(), this.id);
			if (photo != null) {
				this.image = TiBlob.blobFromImage(getTiContext(), photo);
			}
			imageFetched = true;
		}
		return this.image;
	}
	
	public void setImage(TiBlob blob)
	{
		image = blob;
		hasImage = true;
		imageFetched = true;
	}

	public String getBirthday()
	{
		return birthday;
	}

	public void setBirthday(String birthday)
	{
		this.birthday = birthday;
	}

	public String getCreated()
	{
		return created;
	}

	public void setCreated(String created)
	{
		this.created = created;
	}

	public String getModified()
	{
		return modified;
	}

	public void setModified(String modified)
	{
		this.modified = modified;
	}

	public String getLastName()
	{
		return lastName;
	}

	public void setLastName(String lastName)
	{
		this.lastName = lastName;
	}

	public String getFirstName()
	{
		return firstName;
	}

	public void setFirstName(String firstName)
	{
		this.firstName = firstName;
	}

	public String getFullName()
	{
		return fullName;
	}

	public void setFullName(String fullName)
	{
		this.fullName = fullName;
	}

	public String getMiddleName()
	{
		return middleName;
	}

	public void setMiddleName(String middleName)
	{
		this.middleName = middleName;
	}

	public String getFirstPhonetic()
	{
		return firstPhonetic;
	}

	public void setFirstPhonetic(String firstPhonetic)
	{
		this.firstPhonetic = firstPhonetic;
	}

	public String getLastPhonetic()
	{
		return lastPhonetic;
	}

	public void setLastPhonetic(String lastPhonetic)
	{
		this.lastPhonetic = lastPhonetic;
	}

	public String getMiddlePhonetic()
	{
		return middlePhonetic;
	}

	public void setMiddlePhonetic(String middlePhonetic)
	{
		this.middlePhonetic = middlePhonetic;
	}

	public String getDepartment()
	{
		return department;
	}

	public void setDepartment(String department)
	{
		this.department = department;
	}

	public String getJobTitle()
	{
		return jobTitle;
	}

	public void setJobTitle(String jobTitle)
	{
		this.jobTitle = jobTitle;
	}

	public String getNickname()
	{
		return nickname;
	}

	public void setNickname(String nickname)
	{
		this.nickname = nickname;
	}

	public String getNote()
	{
		return note;
	}

	public void setNote(String note)
	{
		this.note = note;
	}

	public String getOrganization()
	{
		return organization;
	}

	public void setOrganization(String organization)
	{
		this.organization = organization;
	}

	public String getPrefix()
	{
		return prefix;
	}

	public void setPrefix(String prefix)
	{
		this.prefix = prefix;
	}

	public String getSuffix()
	{
		return suffix;
	}

	public void setSuffix(String suffix)
	{
		this.suffix = suffix;
	}
	
	public TiDict getEmail()
	{
		return email;
	}
	public void setEmail(TiDict email)
	{
		this.email = email;
	}
	
	private TiDict contactMethodMapToDict(Map<String, ArrayList<String>> map)
	{
		TiDict result = new TiDict();
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
		address = new TiDict();
		for (String key: map.keySet()) {
			ArrayList<String> values = map.get(key);
			TiDict[] dictValues = new TiDict[values.size()];
			for (int i = 0; i < dictValues.length; i++) {
				dictValues[i] = new TiDict();
				dictValues[i].put("Street", values.get(i));
			}
			address.put(key, dictValues);
		}
	}

	public void setPhone(TiDict phone)
	{
		this.phone = phone;
	}

	public TiDict getPhone()
	{
		return phone;
	}
	
	public TiDict getAddress()
	{
		return address;
	}

	public void setAddress(TiDict address)
	{
		this.address = address;
	}

	public void setKind(int kind)
	{
		this.kind = kind;
	}

	public int getKind()
	{
		return kind;
	}

	public void setId(long id)
	{
		this.id = id;
	}

	public long getId()
	{
		return id;
	}

}

