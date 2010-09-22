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
import java.util.Set;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

import android.app.Activity;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
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
	
	private TiBlob image = null;
	private boolean imageFetched; // lazy load these bitmap images
	protected boolean hasImage = false;
	private Uri personUri;
	
	protected static final String[] PEOPLE_PROJECTION = new String[] {
		Contacts.People._ID,
		Contacts.People.NAME,
		Contacts.People.NOTES,
	};
	protected static final int PEOPLE_COL_ID = 0;
	protected static final int PEOPLE_COL_NAME = 1;
	protected static final int PEOPLE_COL_NOTES = 2;
	
	private static final String[] CONTACT_METHOD_PROJECTION = new String[] {
		Contacts.ContactMethods.PERSON_ID,
		Contacts.ContactMethods.KIND,
		Contacts.ContactMethods.TYPE,
		Contacts.ContactMethods.DATA
	};
	protected static final int CONTACT_METHOD_COL_PERSONID = 0;
	protected static final int CONTACT_METHOD_COL_KIND = 1;
	protected static final int CONTACT_METHOD_COL_TYPE = 2;
	protected static final int CONTACT_METHOD_COL_DATA = 3;
	
	private static final String[] PHONE_PROJECTION = new String[] {
		Contacts.Phones.PERSON_ID,
		Contacts.Phones.TYPE,
		Contacts.Phones.NUMBER
		
	};
	protected static final int PHONE_COL_PERSONID = 0;
	protected static final int PHONE_COL_TYPE = 1;
	protected static final int PHONE_COL_NUMBER = 2;
	
	private static final String[] PHOTOS_PROJECTION = new String[] {
		Contacts.Photos.PERSON_ID,
		Contacts.Photos.DOWNLOAD_REQUIRED
	};
	protected static final int PHOTO_COL_PERSONID = 0;
	protected static final int PHOTO_COL_DOWNLOAD_REQUIRED = 1;
	
	public PersonProxy(TiContext tiContext)
	{
		super(tiContext);
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
		
		LightPerson(long id, String name, String notes) 
		{
			this.id = id;
			this.name = name;
			this.notes = notes;
		}
		LightPerson(Cursor cursor)
		{
			this(cursor.getLong(PersonProxy.PEOPLE_COL_ID), cursor.getString(PersonProxy.PEOPLE_COL_NAME), cursor.getString(PersonProxy.PEOPLE_COL_NOTES));
		}
		
		void addEmailFromCursor(Cursor emailsCursor)
		{
			String emailAddress = emailsCursor.getString(PersonProxy.CONTACT_METHOD_COL_DATA);
			int type = emailsCursor.getInt(PersonProxy.CONTACT_METHOD_COL_TYPE);
			String key = PersonProxy.getEmailTextType(type);
			
			ArrayList<String> collection;
			if (emails.containsKey(key)) {
				collection = emails.get(key);
			} else {
				collection = new ArrayList<String>();
				emails.put(key, collection);
			}
			collection.add(emailAddress);
		}
		
		void addPhoneFromCursor(Cursor phonesCursor)
		{
			String phoneNumber = phonesCursor.getString(PersonProxy.PHONE_COL_NUMBER);
			int type = phonesCursor.getInt(PersonProxy.PHONE_COL_TYPE);
			String key = PersonProxy.getPhoneTextType(type);
			ArrayList<String> collection;
			if (phones.containsKey(key)) {
				collection = phones.get(key);
			} else {
				collection = new ArrayList<String>();
				phones.put(key, collection);
			}
			collection.add(phoneNumber);
		}
		
		void addAddressFromCursor(Cursor addressesCursor)
		{
			String fullAddress = addressesCursor.getString(PersonProxy.CONTACT_METHOD_COL_DATA);
			int type = addressesCursor.getInt(PersonProxy.CONTACT_METHOD_COL_TYPE);
			String key = PersonProxy.getAddressTextType(type);
			ArrayList<String> collection;
			if (addresses.containsKey(key)) {
				collection = addresses.get(key);
			} else {
				collection = new ArrayList<String>();
				addresses.put(key, collection);
			}
			collection.add(fullAddress);
		}
		void addPhotoInfoFromCursor(Cursor photosCursor)
		{
			hasImage = true;
		}
		
		PersonProxy proxify(TiContext tiContext)
		{
			PersonProxy proxy = new PersonProxy(tiContext);
			proxy.firstName = name;
			proxy.note = notes;
			proxy.setEmailFromMap(emails);
			proxy.setPhoneFromMap(phones);
			proxy.setAddressFromMap(addresses);
			proxy.kind = ContactsModule.CONTACTS_KIND_PERSON;
			proxy.id = id;
			proxy.hasImage = this.hasImage;
			return proxy;
			
		}
	}
	
	public static PersonProxy[] getAllPersons(TiContext tiContext, int limit)
	{
		// Fly through all three cursors (people, contact methods (emails & addresses)
		// and phones) in one direction, one pass each, and add to local data structures.
		Map<Long, LightPerson> persons = new HashMap<Long, LightPerson>();
		
		// The Person record
		Cursor cursor = tiContext.getActivity().managedQuery(
				Contacts.People.CONTENT_URI, 
				PEOPLE_PROJECTION, null, null, null);
		
		int count = 0;
		while (cursor.moveToNext() && count < limit) {
			LightPerson lp = new LightPerson(cursor);
			persons.put(lp.id, lp);
			count++;
		}
		cursor.close();
		
		// Emails and addresses
		cursor = tiContext.getActivity().managedQuery(
				Contacts.ContactMethods.CONTENT_URI,
				CONTACT_METHOD_PROJECTION, null, null, null);
		while (cursor.moveToNext()) {
			long id = cursor.getLong(CONTACT_METHOD_COL_PERSONID);
			LightPerson lp = persons.get(id);
			if (lp != null) {
				int kind = cursor.getInt(CONTACT_METHOD_COL_KIND);
				if (kind == Contacts.KIND_EMAIL) {
					lp.addEmailFromCursor(cursor);
				} else if (kind == Contacts.KIND_POSTAL) {
					lp.addAddressFromCursor(cursor);
				}
			}
		}
		cursor.close();
		
		// Phone Numbers
		cursor = tiContext.getActivity().managedQuery(
				Contacts.Phones.CONTENT_URI,
				PHONE_PROJECTION, null, null, null);
		while (cursor.moveToNext()) {
			long id = cursor.getLong(PHONE_COL_PERSONID);
			LightPerson lp = persons.get(id);
			if (lp != null) {
				lp.addPhoneFromCursor(cursor);
			}
		}
		cursor.close();
		
		// Photo info
		cursor = tiContext.getActivity().managedQuery(
				Contacts.Photos.CONTENT_URI,
				PHOTOS_PROJECTION, Contacts.Photos.DATA + " IS NOT NULL", null, null);
		while (cursor.moveToNext()) {
			long id = cursor.getLong(PHOTO_COL_PERSONID);
			LightPerson lp = persons.get(id);
			if (lp != null) {
				lp.addPhotoInfoFromCursor(cursor);
			}
		}
		cursor.close();
		
		// Now return array of proxies for all those people.
		Set<Long> keyset = persons.keySet();
		PersonProxy[] proxies = new PersonProxy[keyset.size()];
		int index = 0;
		for (Long key : keyset) {
			proxies[index] = persons.get(key).proxify(tiContext);
			index++;
		}
		persons.clear();
		persons = null;
		return proxies;
	}
	
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
	
	protected static String getAddressTextType(int type)
	{
		String key = "other";
		if (type == Contacts.ContactMethods.TYPE_HOME) {
			key = "home";
		} else if (type == Contacts.ContactMethods.TYPE_WORK) {
			key = "work";
		}
		return key;
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
		LightPerson lp = new LightPerson(cursor);
		long personId = lp.id;
		Cursor emailsCursor = tiContext.getActivity().managedQuery(Contacts.ContactMethods.CONTENT_URI, 
				CONTACT_METHOD_PROJECTION, 
				Contacts.ContactMethods.PERSON_ID + " = ? AND " + Contacts.ContactMethods.KIND + " = ?" , 
				new String[]{ Long.toString(personId) , Integer.toString(Contacts.KIND_EMAIL) }, 
				null);
		while (emailsCursor.moveToNext()) {
			lp.addEmailFromCursor(emailsCursor);
		}
		emailsCursor.close();
		
		Cursor phonesCursor = tiContext.getActivity().managedQuery(
				Contacts.Phones.CONTENT_URI,
				PHONE_PROJECTION,
				Contacts.Phones.PERSON_ID + " = ?",
				new String[]{ Long.toString(personId) },
				null);
		while (phonesCursor.moveToNext()) {
			lp.addPhoneFromCursor(phonesCursor);
		}
		phonesCursor.close();
		
		Cursor addressesCursor = tiContext.getActivity().managedQuery(
				Contacts.ContactMethods.CONTENT_URI,
				CONTACT_METHOD_PROJECTION,
				Contacts.ContactMethods.PERSON_ID + " = ? AND " + Contacts.ContactMethods.KIND + " = ?",
				new String[]{ Long.toString(personId), Integer.toString(Contacts.KIND_POSTAL) },
				null);
		while (addressesCursor.moveToNext()) {
			lp.addAddressFromCursor(addressesCursor);
		}
		addressesCursor.close();
		
		Cursor photosCursor = tiContext.getActivity().managedQuery(
				Contacts.Photos.CONTENT_URI,
				PHOTOS_PROJECTION,
				Contacts.Photos.PERSON_ID + " = ? AND " + Contacts.Photos.DATA + " IS NOT NULL",
				new String[]{ Long.toString(personId)},
				null);
		while (photosCursor.moveToNext()) {
			lp.addPhotoInfoFromCursor(photosCursor);
		}
		photosCursor.close();
		
		
		return lp.proxify(tiContext);
	}
	
	private Uri getPersonUri() 
	{
		if (personUri == null) {
			personUri = ContentUris.withAppendedId(Contacts.People.CONTENT_URI, this.id);
		}
		return personUri;
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
			final int NO_PLACEHOLDER_IMAGE = 0;
			Bitmap photo = Contacts.People.loadContactPhoto(getTiContext().getActivity(), getPersonUri(), NO_PLACEHOLDER_IMAGE, null);
			this.image = null;
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
