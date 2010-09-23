/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.contacts;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.SortedMap;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

import android.app.Activity;
import android.content.ContentUris;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Contacts;

public abstract class CommonContactsApi 
{
	private static final boolean TRY_NEWER_API = false;//(android.os.Build.VERSION.SDK_INT > android.os.Build.VERSION_CODES.DONUT);
	private static final String LCAT = "TiCommonContactsApi";
	
	protected static CommonContactsApi getInstance(TiContext tiContext)
	{
		boolean useNew = false;
		if (TRY_NEWER_API) {
			try {
				Class<?> c = Class.forName("android.provider.ContactsContract");
				useNew = true;
			} catch (ClassNotFoundException e) {
				Log.d(LCAT, "Unable to load newer contacts api: " + e.getMessage(), e);
				useNew = false;
			}
		} 
		Log.d(LCAT, "Using " + (useNew ? "newer " : "older ") + "contacts api.  Android SDK level: " + android.os.Build.VERSION.SDK_INT);
		if (useNew) {
			ContactsApiLevel5 c = new ContactsApiLevel5(tiContext);
			if (!c.loadedOk) {
				Log.d(LCAT, "ContactsApiLevel5 did not load successfully.  Falling back to L4.");
				return new ContactsApiLevel4(tiContext);
			} else {
				return c;
			}
		} else {
			return new ContactsApiLevel4(tiContext);
		}
	}
	
	protected abstract PersonProxy getPersonById(long id);
	protected abstract PersonProxy getPersonByUri(Uri uri);
	protected abstract PersonProxy getPersonFromCursor(Cursor cursor);
	protected abstract PersonProxy[] getAllPeople(int limit);
	protected abstract PersonProxy[] getPeopleWithName(String name);
	protected abstract Intent getIntentForContactsPicker();
	
	protected PersonProxy[] getAllPeople()
	{
		return getAllPeople(Integer.MAX_VALUE);
	}
	
	protected PersonProxy[] proxifyLightPeopleMap(Map<Long, LightPerson> persons, SortedMap<String, Long> sortedPersons, TiContext tiContext)
	{
		Collection<Long> keyset = sortedPersons.values();
		PersonProxy[] proxies = new PersonProxy[keyset.size()];
		int index = 0;
		for (Long key : keyset) {
			proxies[index] = persons.get(key).proxify(tiContext);
			index++;
		}
		return proxies;
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
		
		void addPersonInfoFromL4Cursor(Cursor cursor)
		{
			this.id = cursor.getLong(ContactsApiLevel4.PEOPLE_COL_ID);
			this.name = cursor.getString(ContactsApiLevel4.PEOPLE_COL_NAME);
			this.notes = cursor.getString(ContactsApiLevel4.PEOPLE_COL_NOTES);
		}
		
		void addPersonInfoFromL5Cursor(Cursor cursor)
		{
			this.id = cursor.getLong(ContactsApiLevel5.PEOPLE_COL_ID);
			this.name = cursor.getString(ContactsApiLevel5.PEOPLE_COL_NAME);
		}
		
		void addEmailFromL4Cursor(Cursor emailsCursor)
		{
			String emailAddress = emailsCursor.getString(ContactsApiLevel4.CONTACT_METHOD_COL_DATA);
			int type = emailsCursor.getInt(ContactsApiLevel4.CONTACT_METHOD_COL_TYPE);
			String key = ContactsApiLevel4.getEmailTextType(type);
			
			ArrayList<String> collection;
			if (emails.containsKey(key)) {
				collection = emails.get(key);
			} else {
				collection = new ArrayList<String>();
				emails.put(key, collection);
			}
			collection.add(emailAddress);
		}
		void addEmailFromL5Cursor(Cursor emailsCursor)
		{
			String emailAddress = emailsCursor.getString(ContactsApiLevel5.EMAIL_COL_ADDRESS);
			int type = emailsCursor.getInt(ContactsApiLevel5.EMAIL_COL_TYPE);
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
		
		void addPhoneFromL4Cursor(Cursor phonesCursor)
		{
			String phoneNumber = phonesCursor.getString(ContactsApiLevel4.PHONE_COL_NUMBER);
			int type = phonesCursor.getInt(ContactsApiLevel4.PHONE_COL_TYPE);
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
		
		void addPhoneFromL5Cursor(Cursor phonesCursor)
		{
			String phoneNumber = phonesCursor.getString(ContactsApiLevel5.PHONE_COL_NUMBER);
			int type = phonesCursor.getInt(ContactsApiLevel5.PHONE_COL_TYPE);
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
		
		void addAddressFromL4Cursor(Cursor addressesCursor)
		{
			String fullAddress = addressesCursor.getString(ContactsApiLevel4.CONTACT_METHOD_COL_DATA);
			int type = addressesCursor.getInt(ContactsApiLevel4.CONTACT_METHOD_COL_TYPE);
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
		
		void addAddressFromL5Cursor(Cursor addressesCursor)
		{
			String fullAddress = addressesCursor.getString(ContactsApiLevel5.POSTAL_COL_FORMATTED_ADDRESS);
			int type = addressesCursor.getInt(ContactsApiLevel5.POSTAL_COL_TYPE);
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
		
		void addPhotoInfoFromL4Cursor(Cursor photosCursor)
		{
			hasImage = true;
		}
		
		PersonProxy proxify(TiContext tiContext)
		{
			PersonProxy proxy = new PersonProxy(tiContext);
			proxy.setFullName(name);
			proxy.setNote(notes);
			proxy.setEmailFromMap(emails);
			proxy.setPhoneFromMap(phones);
			proxy.setAddressFromMap(addresses);
			proxy.setKind(ContactsModule.CONTACTS_KIND_PERSON) ;
			proxy.setId(id);
			proxy.hasImage = this.hasImage;
			return proxy;
			
		}
	}
	
	
}
