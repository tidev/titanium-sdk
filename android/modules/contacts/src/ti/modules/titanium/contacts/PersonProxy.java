/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.contacts;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;

import android.app.Activity;
import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Contacts;

public class PersonProxy extends TiProxy
{
	private static final String LCAT = "PersonProxy";
	private String lastName, firstName, fullName, middleName, firstPhonetic, lastPhonetic, middlePhonetic, department;
	private String jobTitle, nickname, note, organization, prefix, suffix;
	private String birthday, created, modified;
	private int kind;
	private TiDict email, phone, address;
	private long id;
	
	protected static final String[] PEOPLE_PROJECTION = new String[] {
        Contacts.People._ID,
        Contacts.People.NAME,
        Contacts.People.NOTES,
    };
	
	private static final String[] CONTACT_METHOD_PROJECTION = new String[] {
		Contacts.ContactMethods.DATA,
		Contacts.ContactMethods.TYPE
	};
	
	private static final String[] PHONE_PROJECTION = new String[] {
		Contacts.Phones.NUMBER,
		Contacts.Phones.TYPE
	};

	public PersonProxy(TiContext tiContext)
	{
		super(tiContext);
	}
	
	public static PersonProxy[] getAllPersons(TiContext tiContext)
	{
		ArrayList<PersonProxy> all = new ArrayList<PersonProxy>();
		Cursor cursor = tiContext.getActivity().managedQuery(
				Contacts.People.CONTENT_URI, 
				PEOPLE_PROJECTION, 
				null, 
				null,
				null);
		while (cursor.moveToNext()) {
			all.add(fromCursor(tiContext, cursor));
		}
		cursor.close();
		return all.toArray(new PersonProxy[]{});
	}
	
	public static PersonProxy[] getPeopleWithName(TiContext tiContext, String name)
	{
		ArrayList<PersonProxy> all = new ArrayList<PersonProxy>();
		Cursor cursor = tiContext.getActivity().managedQuery(
				Contacts.People.CONTENT_URI, 
				PEOPLE_PROJECTION, 
				Contacts.People.NAME + " = ?", 
				new String[]{name},
				null);
		while (cursor.moveToNext()) {
			all.add(fromCursor(tiContext, cursor));
		}
		cursor.close();
		return all.toArray(new PersonProxy[]{});
	}
	
	public static PersonProxy fromId(TiContext tiContext, long id)
	{
		Uri uri = ContentUris.withAppendedId(Contacts.People.CONTENT_URI, id);
		return fromUri(tiContext, uri);
	}
	
	public static PersonProxy fromUri(TiContext tiContext, Uri uri)
	{
		Activity root = tiContext.getRootActivity();

		Cursor cursor = root.managedQuery(uri, PEOPLE_PROJECTION, null, null, null);
		PersonProxy person = null;
		try {
			cursor.moveToFirst();
			person = fromCursor(tiContext, cursor);
		} catch (Throwable t) {
			Log.e(LCAT, "Error fetching contact from cursor: " + t.getMessage(), t);
		} finally {
			try {
				cursor.close();
			} catch(Throwable tt) {
				// ignore
			}
		}
		return person;
		
	}
	
	public static PersonProxy fromCursor(TiContext tiContext, Cursor cursor)
	{
		if (cursor.isBeforeFirst() ) {
			cursor.moveToFirst();
		}
		PersonProxy person = new PersonProxy(tiContext);
		person.setFullName(cursor.getString(cursor.getColumnIndex(Contacts.People.NAME)));
		person.setKind(ContactsModule.CONTACTS_KIND_PERSON) ;
		person.setNote(cursor.getString(cursor.getColumnIndex(Contacts.People.NOTES)));
		long personId = cursor.getInt(cursor.getColumnIndex(Contacts.People._ID));
		person.setId(personId);
		
		Cursor emailsCursor = tiContext.getActivity().managedQuery(Contacts.ContactMethods.CONTENT_URI, 
				CONTACT_METHOD_PROJECTION, 
				Contacts.ContactMethods.PERSON_ID + " = ? AND " + Contacts.ContactMethods.KIND + " = ?" , 
				new String[]{ Long.toString(personId) , Integer.toString(Contacts.KIND_EMAIL) }, 
				null);
		

		Map<String, ArrayList<String>> emails = new HashMap<String, ArrayList<String>>();
		while (emailsCursor.moveToNext()) {
			String emailAddress = emailsCursor.getString(emailsCursor.getColumnIndex(Contacts.ContactMethods.DATA));
			int type = emailsCursor.getInt(emailsCursor.getColumnIndex(Contacts.ContactMethods.TYPE));
			String key = "other";
			if (type == Contacts.ContactMethods.TYPE_HOME) {
				key = "home";
			} else if (type == Contacts.ContactMethods.TYPE_WORK) {
				key = "work";
			}
			
			ArrayList<String> collection;
			if (emails.containsKey(key)) {
				collection = emails.get(key);
			} else {
				collection = new ArrayList<String>();
				emails.put(key, collection);
			}
			collection.add(emailAddress);
		}
		emailsCursor.close();		
		person.setEmailFromMap(emails);
		
		
		Cursor phonesCursor = tiContext.getActivity().managedQuery(
				Contacts.Phones.CONTENT_URI,
				PHONE_PROJECTION,
				Contacts.Phones.PERSON_ID + " = ?",
				new String[]{ Long.toString(personId) },
				null);
		Map<String, ArrayList<String>> phones = new HashMap<String, ArrayList<String>>();
		while (phonesCursor.moveToNext()) {
			String phoneNumber = phonesCursor.getString(
					phonesCursor.getColumnIndex(Contacts.Phones.NUMBER));
			int type = phonesCursor.getInt(phonesCursor.getColumnIndex(Contacts.Phones.TYPE));
			String key = "other";
			if (type == Contacts.Phones.TYPE_FAX_HOME) {
				key = "homeFax";
			}
			if (type == Contacts.Phones.TYPE_FAX_WORK) {
				key = "workFax";
			}
			if (type == Contacts.Phones.TYPE_HOME) {
				key = "home";
			}
			if (type == Contacts.Phones.TYPE_MOBILE) {
				key = "mobile";
			}
			if (type == Contacts.Phones.TYPE_PAGER) {
				key = "pager";
			}
			if (type == Contacts.Phones.TYPE_WORK) {
				key = "work";
			}
			ArrayList<String> collection;
			if (phones.containsKey(key)) {
				collection = phones.get(key);
			} else {
				collection = new ArrayList<String>();
				phones.put(key, collection);
			}
			collection.add(phoneNumber);
		}
		phonesCursor.close();
		person.setPhoneFromMap(phones);
		
		Cursor addressesCursor = tiContext.getActivity().managedQuery(
				Contacts.ContactMethods.CONTENT_URI,
				CONTACT_METHOD_PROJECTION,
				Contacts.ContactMethods.PERSON_ID + " = ? AND " + Contacts.ContactMethods.KIND + " = ?",
				new String[]{ Long.toString(personId), Integer.toString(Contacts.KIND_POSTAL) },
				null);
		Map<String, ArrayList<String>> addresses = new HashMap<String, ArrayList<String>>();
		while (addressesCursor.moveToNext()) {
			String fullAddress = addressesCursor.getString(
					addressesCursor.getColumnIndex(Contacts.ContactMethods.DATA));
			int type = addressesCursor.getInt(addressesCursor.getColumnIndex(Contacts.ContactMethods.TYPE));
			String key = "other";
			if (type == Contacts.ContactMethods.TYPE_HOME) {
				key = "home";
			} else if (type == Contacts.ContactMethods.TYPE_WORK) {
				key = "work";
			}
			ArrayList<String> collection;
			if (addresses.containsKey(key)) {
				collection = addresses.get(key);
			} else {
				collection = new ArrayList<String>();
				addresses.put(key, collection);
			}
			collection.add(fullAddress);
		}
		addressesCursor.close();
		person.setAddressFromMap(addresses);
		
		return person;
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
