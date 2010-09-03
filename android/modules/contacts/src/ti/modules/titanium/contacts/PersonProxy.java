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

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

import android.app.Activity;
import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Contacts;

@Kroll.proxy @SuppressWarnings("unused")
public class PersonProxy extends KrollProxy
{
	private static final String LCAT = "PersonProxy";

	@Kroll.property private String lastName, firstName, fullName, middleName, firstPhonetic, lastPhonetic, middlePhonetic, department;
	@Kroll.property private String jobTitle, nickname, note, organization, prefix, suffix;
	@Kroll.property private String birthday, created, modified;
	
	@Kroll.property private int kind;
	@Kroll.property private KrollDict email, phone, address;
	@Kroll.property private long id;
	
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
	
	public static PersonProxy[] getAllPersons(TiContext tiContext, int limit)
	{
		ArrayList<PersonProxy> all = new ArrayList<PersonProxy>();
		Cursor cursor = tiContext.getActivity().managedQuery(
				Contacts.People.CONTENT_URI, 
				PEOPLE_PROJECTION, 
				null, 
				null,
				null);
		int count = 0;
		while (cursor.moveToNext()) {
			all.add(fromCursor(tiContext, cursor));
			if (++count == limit)
			{
				break;
			}
		}
		cursor.close();
		return all.toArray(new PersonProxy[all.size()]);
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
		return all.toArray(new PersonProxy[all.size()]);
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
		person.fullName = cursor.getString(cursor.getColumnIndex(Contacts.People.NAME));
		person.kind = ContactsModule.CONTACTS_KIND_PERSON;
		person.note = cursor.getString(cursor.getColumnIndex(Contacts.People.NOTES));
		long personId = cursor.getInt(cursor.getColumnIndex(Contacts.People._ID));
		person.id = personId;
		
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
