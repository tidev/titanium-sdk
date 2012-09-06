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
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiContext;

import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.provider.Contacts;

public abstract class CommonContactsApi 
{
	private static final boolean TRY_NEWER_API = (android.os.Build.VERSION.SDK_INT > android.os.Build.VERSION_CODES.DONUT);
	private static final String TAG = "TiCommonContactsApi";
	
	protected static CommonContactsApi getInstance()
	{
		boolean useNew = false;
		if (TRY_NEWER_API) {
			try {
				Class.forName("android.provider.ContactsContract"); // just a test for success
				useNew = true;

			} catch (ClassNotFoundException e) {
				Log.e(TAG, "Unable to load contacts api: " + e.getMessage(), e);
				useNew = false;
			}
		} else {
			Log.e(TAG, "Contacts API 4 is not supported");
		}
		
		if (useNew) {
			ContactsApiLevel5 c = new ContactsApiLevel5();
			if (!c.loadedOk) {
				Log.e(TAG, "ContactsApiLevel5 did not load successfully.");
				return null;

			} else {
				return c;
			}

		}

		return null;
	}

	protected static CommonContactsApi getInstance(TiContext tiContext)
	{
		return getInstance();
	}

	protected static Bitmap getContactImage(long contact_id)
	{
		CommonContactsApi api = getInstance();
		return api.getInternalContactImage(contact_id);
	}

	protected static Bitmap getContactImage(TiContext context, long contact_id)
	{
		return getContactImage(contact_id);
	}

	protected abstract PersonProxy getPersonById(long id);
	protected abstract PersonProxy addContact(KrollDict options);
	protected abstract void save(Object people);
	protected abstract PersonProxy getPersonByUri(Uri uri);
	protected abstract PersonProxy[] getAllPeople(int limit);
	protected abstract PersonProxy[] getPeopleWithName(String name);
	protected abstract Intent getIntentForContactsPicker();
	protected abstract Bitmap getInternalContactImage(long id);
	protected abstract void removePerson(PersonProxy person);
	
	protected PersonProxy[] getAllPeople()
	{
		return getAllPeople(Integer.MAX_VALUE);
	}
	
	protected PersonProxy[] proxifyPeople(Map<Long, LightPerson> persons)
	{
		PersonProxy[] proxies = new PersonProxy[persons.size()];
		int index = 0;
		for (LightPerson person: persons.values()) {
			proxies[index] = person.proxify();
			index++;
		}
		return proxies;
	}

	protected PersonProxy[] proxifyPeople(Map<Long, LightPerson> persons, TiContext tiContext)
	{
		return proxifyPeople(persons);
	}

	// Happily, these codes are common across api level
	protected static String getEmailTextType(int type) 
	{
		String key = "other";
		if (type == Contacts.ContactMethods.TYPE_HOME) {
			key = "home";
		} else if (type == Contacts.ContactMethods.TYPE_WORK) {
			key = "work";
		}
		return key;
	}
	
	protected static String getPhoneTextType(int type)
	{
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
		return key;
	}
	
	
	protected static String getPostalAddressTextType(int type)
	{
		String key = "other";
		if (type == Contacts.ContactMethods.TYPE_HOME) {
			key = "home";
		} else if (type == Contacts.ContactMethods.TYPE_WORK) {
			key = "work";
		}
		return key;
	}
	
	protected static class LightPerson
	{
		long id;
		String name;
		String notes;
		boolean hasImage = false;
		Map<String, ArrayList<String>> emails = new HashMap<String, ArrayList<String>>();
		Map<String, ArrayList<String>> phones = new HashMap<String, ArrayList<String>>();
		Map<String, ArrayList<String>> addresses = new HashMap<String, ArrayList<String>>();
		
		void addPersonInfoFromL5DataRow(Cursor cursor)
		{
			this.id = cursor.getLong(ContactsApiLevel5.DATA_COLUMN_CONTACT_ID);
			this.name = cursor.getString(ContactsApiLevel5.DATA_COLUMN_DISPLAY_NAME);
			this.hasImage = (cursor.getInt(ContactsApiLevel5.DATA_COLUMN_PHOTO_ID) > 0);
		}
		
		void addPersonInfoFromL5PersonRow(Cursor cursor)
		{
			this.id = cursor.getLong(ContactsApiLevel5.PEOPLE_COL_ID);
			this.name = cursor.getString(ContactsApiLevel5.PEOPLE_COL_NAME);
			this.hasImage = (cursor.getInt(ContactsApiLevel5.PEOPLE_COL_PHOTO_ID) > 0);
		}
		
		void addDataFromL5Cursor(Cursor cursor) {
			String kind = cursor.getString(ContactsApiLevel5.DATA_COLUMN_MIMETYPE);
			if (kind.equals(ContactsApiLevel5.KIND_ADDRESS)) {
				loadAddressFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_EMAIL)) {
				loadEmailFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_NAME)) {
				//loadNameFromL5DataRow(cursor); TODO Structured names
			} else if (kind.equals(ContactsApiLevel5.KIND_NOTE)) {
				loadNoteFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_PHONE)) {
				loadPhoneFromL5DataRow(cursor);
			}
		}
		
		void loadPhoneFromL5DataRow(Cursor phonesCursor)
		{
			String phoneNumber = phonesCursor.getString(ContactsApiLevel5.DATA_COLUMN_PHONE_NUMBER);
			int type = phonesCursor.getInt(ContactsApiLevel5.DATA_COLUMN_PHONE_TYPE);
			String key = getPhoneTextType(type);
			ArrayList<String> collection;
			if (phones.containsKey(key)) {
				collection = phones.get(key);
			} else {
				collection = new ArrayList<String>();
				phones.put(key, collection);
			}
			collection.add(phoneNumber);
		}
		
		void loadNoteFromL5DataRow(Cursor cursor)
		{
			this.notes = cursor.getString(ContactsApiLevel5.DATA_COLUMN_NOTE);
		}
		
		
		void loadEmailFromL5DataRow(Cursor emailsCursor)
		{
			String emailAddress = emailsCursor.getString(ContactsApiLevel5.DATA_COLUMN_EMAIL_ADDR);
			int type = emailsCursor.getInt(ContactsApiLevel5.DATA_COLUMN_EMAIL_TYPE);
			String key = getEmailTextType(type);
			
			ArrayList<String> collection;
			if (emails.containsKey(key)) {
				collection = emails.get(key);
			} else {
				collection = new ArrayList<String>();
				emails.put(key, collection);
			}
			collection.add(emailAddress);
		}
		
		void loadAddressFromL5DataRow(Cursor cursor)
		{
			// TODO add structured addresss
			String fullAddress = cursor.getString(ContactsApiLevel5.DATA_COLUMN_ADDRESS_FULL);
			int type = cursor.getInt(ContactsApiLevel5.DATA_COLUMN_ADDRESS_TYPE);
			String key = getPostalAddressTextType(type);
			ArrayList<String> collection;
			if (addresses.containsKey(key)) {
				collection = addresses.get(key);
			} else {
				collection = new ArrayList<String>();
				addresses.put(key, collection);
			}
			collection.add(fullAddress);
		}
		
		PersonProxy proxify()
		{
			PersonProxy proxy = new PersonProxy();
			proxy.setFullName(name);
			proxy.setProperty("note", notes);
			proxy.setEmailFromMap(emails);
			proxy.setPhoneFromMap(phones);
			proxy.setAddressFromMap(addresses);
			proxy.setProperty("kind", ContactsModule.CONTACTS_KIND_PERSON);
			proxy.setProperty("id", id);
			proxy.hasImage = this.hasImage;
			return proxy;
			
		}

		PersonProxy proxify(TiContext tiContext)
		{
			return proxify();
		}
	}
	
	
}
