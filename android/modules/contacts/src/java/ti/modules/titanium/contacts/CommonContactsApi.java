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
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;

public abstract class CommonContactsApi
{
	private static final boolean TRY_NEWER_API =
		(android.os.Build.VERSION.SDK_INT > android.os.Build.VERSION_CODES.DONUT);
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

	public boolean hasContactsPermissions()
	{
		if (Build.VERSION.SDK_INT < 23) {
			return true;
		}
		Context context = TiApplication.getInstance().getApplicationContext();
		// If READ_CONTACTS is granted, WRITE_CONTACTS is also granted if the permission is included in manifest.
		if (context != null
			&& context.checkSelfPermission(Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) {
			return true;
		}
		Log.w(TAG, "Contact permissions are missing");
		return false;
	}

	protected static Bitmap getContactImage(long contact_id)
	{
		CommonContactsApi api = getInstance();
		return api.getInternalContactImage(contact_id);
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
		for (LightPerson person : persons.values()) {
			proxies[index] = person.proxify();
			index++;
		}
		return proxies;
	}

	// Happily, these codes are common across api level
	protected static String getEmailTextType(int type)
	{
		String key = "other";
		if (type == ContactsContract.CommonDataKinds.Email.TYPE_HOME) {
			key = "home";
		} else if (type == ContactsContract.CommonDataKinds.Email.TYPE_WORK) {
			key = "work";
		}
		return key;
	}

	protected static String getDateTextType(int type)
	{
		String key = TiC.PROPERTY_OTHER;
		if (type == ContactsContract.CommonDataKinds.Event.TYPE_ANNIVERSARY) {
			key = TiC.PROPERTY_ANNIVERSARY;
		} else if (type == ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY) {
			key = TiC.PROPERTY_BIRTHDAY;
		} else if (type == ContactsContract.CommonDataKinds.Event.TYPE_CUSTOM) {
			key = TiC.PROPERTY_CUSTOM;
		}
		return key;
	}

	protected static String getImTextType(int type)
	{
		String key = "other";
		if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_AIM) {
			key = "aim";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_CUSTOM) {
			key = "custom";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_MSN) {
			key = "msn";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_YAHOO) {
			key = "yahoo";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_SKYPE) {
			key = "skype";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_QQ) {
			key = "qq";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_GOOGLE_TALK) {
			key = "googleTalk";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_ICQ) {
			key = "icq";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_JABBER) {
			key = "jabber";
		} else if (type == ContactsContract.CommonDataKinds.Im.PROTOCOL_NETMEETING) {
			key = "netMeeting";
		}
		return key;
	}

	protected static String getRelatedNamesType(int type)
	{
		String key = "other";
		if (type == ContactsContract.CommonDataKinds.Relation.TYPE_ASSISTANT) {
			key = "assistant";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_BROTHER) {
			key = "brother";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_CHILD) {
			key = "child";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_DOMESTIC_PARTNER) {
			key = "domesticPartner";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_FATHER) {
			key = "father";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_FRIEND) {
			key = "friend";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_MANAGER) {
			key = "manager";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_MOTHER) {
			key = "mother";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_PARENT) {
			key = "parent";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_PARTNER) {
			key = "partner";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_REFERRED_BY) {
			key = "referredBy";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_RELATIVE) {
			key = "relative";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_SISTER) {
			key = "sister";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_SPOUSE) {
			key = "spose";
		} else if (type == ContactsContract.CommonDataKinds.Relation.TYPE_CUSTOM) {
			key = "custom";
		}
		return key;
	}

	protected static String getPhoneTextType(int type)
	{
		String key = "other";
		if (type == ContactsContract.CommonDataKinds.Phone.TYPE_FAX_HOME) {
			key = "homeFax";
		}
		if (type == ContactsContract.CommonDataKinds.Phone.TYPE_FAX_WORK) {
			key = "workFax";
		}
		if (type == ContactsContract.CommonDataKinds.Phone.TYPE_HOME) {
			key = "home";
		}
		if (type == ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE) {
			key = "mobile";
		}
		if (type == ContactsContract.CommonDataKinds.Phone.TYPE_PAGER) {
			key = "pager";
		}
		if (type == ContactsContract.CommonDataKinds.Phone.TYPE_WORK) {
			key = "work";
		}
		return key;
	}

	protected static String getPostalAddressTextType(int type)
	{
		String key = "other";
		if (type == ContactsContract.CommonDataKinds.Email.TYPE_HOME) {
			key = "home";
		} else if (type == ContactsContract.CommonDataKinds.Email.TYPE_WORK) {
			key = "work";
		}
		return key;
	}

	protected static class LightPerson
	{
		long id;
		String name;
		String lname;
		String fname;
		String mname;
		String pname;
		String sname;
		String notes;
		String birthday;
		String nickname;
		String fphonetic;
		String mphonetic;
		String lphonetic;
		String organization;
		String instantMessage;
		String relatedName;
		String jobTitle;
		String department;

		boolean hasImage = false;
		Map<String, ArrayList<String>> emails = new HashMap<String, ArrayList<String>>();
		Map<String, ArrayList<String>> phones = new HashMap<String, ArrayList<String>>();
		Map<String, ArrayList<String>> addresses = new HashMap<String, ArrayList<String>>();
		Map<String, ArrayList<String>> instantMessages = new HashMap<String, ArrayList<String>>();
		Map<String, ArrayList<String>> relatedNames = new HashMap<String, ArrayList<String>>();
		Map<String, ArrayList<String>> websites = new HashMap<String, ArrayList<String>>();
		Map<String, ArrayList<String>> dates = new HashMap<String, ArrayList<String>>();

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

		void addDataFromL5Cursor(Cursor cursor)
		{
			String kind = cursor.getString(ContactsApiLevel5.DATA_COLUMN_MIMETYPE);
			if (kind.equals(ContactsApiLevel5.KIND_ADDRESS)) {
				loadAddressFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_EMAIL)) {
				loadEmailFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_EVENT)) {
				loadBirthdayFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_NAME)) {
				loadNameFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_NOTE)) {
				loadNoteFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_PHONE)) {
				loadPhoneFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_PHONE)) {
				loadPhoneFromL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_NICKNAME)) {
				loadPhonNickL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_ORGANIZE)) {
				loadOrganizationL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_IM)) {
				loadImL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_RELATED_NAME)) {
				loadRelatedNamesL5DataRow(cursor);
			} else if (kind.equals(ContactsApiLevel5.KIND_WEBSITE)) {
				loadWebSiteL5DataRow(cursor);
			}
		}

		void loadImL5DataRow(Cursor imCursor)
		{
			this.instantMessage = imCursor.getString(ContactsApiLevel5.DATA_COLUMN_IM);
			int type = imCursor.getInt(ContactsApiLevel5.DATA_COLUMN_IM_TYPE);
			String key = getImTextType(type);
			ArrayList<String> collection;
			if (instantMessages.containsKey(key)) {
				collection = instantMessages.get(key);
			} else {
				collection = new ArrayList<String>();
				instantMessages.put(key, collection);
			}
			collection.add(instantMessage);
		}

		void loadRelatedNamesL5DataRow(Cursor rnCursor)
		{
			this.relatedName = rnCursor.getString(ContactsApiLevel5.DATA_COLUMN_RELATED_NAME);
			int type = rnCursor.getInt(ContactsApiLevel5.DATA_COLUMN_RELATED_NAME_TYPE);
			String key = getRelatedNamesType(type);

			ArrayList<String> collection;
			if (relatedNames.containsKey(key)) {
				collection = relatedNames.get(key);
			} else {
				collection = new ArrayList<String>();
				relatedNames.put(key, collection);
			}
			collection.add(relatedName);
		}

		void loadOrganizationL5DataRow(Cursor cursor)
		{
			this.organization = cursor.getString(ContactsApiLevel5.DATA_COLUMN_ORGANIZATION);
			this.jobTitle = cursor.getString(ContactsApiLevel5.DATA_COLUMN_JOB_TITLE);
			this.department = cursor.getString(ContactsApiLevel5.DATA_COLUMN_DEPARTMENT);
		}

		void loadPhonNickL5DataRow(Cursor cursor)
		{
			this.nickname = cursor.getString(ContactsApiLevel5.DATA_COLUMN_NICK_NAME);
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

		void loadBirthdayFromL5DataRow(Cursor cursor)
		{
			int type = cursor.getInt(ContactsApiLevel5.DATA_COLUMN_EVENT_TYPE);
			if (type == ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY) {
				this.birthday = cursor.getString(ContactsApiLevel5.DATA_COLUMN_EVENT_DATE);
			}
			loadDatesL5DataRow(cursor);
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

		void loadWebSiteL5DataRow(Cursor websitesCursor)
		{
			ArrayList<String> collection;
			String website = websitesCursor.getString(ContactsApiLevel5.DATA_COLUMN_WEBSITE_ADDR);
			String key = "website";

			if (websites.containsKey(key)) {
				collection = websites.get(key);
			} else {
				collection = new ArrayList<String>();
				websites.put(key, collection);
			}

			collection.add(website);
		}

		void loadDatesL5DataRow(Cursor datesCursor)
		{
			ArrayList<String> collection;
			String date = datesCursor.getString(ContactsApiLevel5.DATA_COLUMN_DATE_ADDR);
			int type = datesCursor.getInt(ContactsApiLevel5.DATA_COLUMN_DATE_TYPE);
			String key = getDateTextType(type);
			if (dates.containsKey(key)) {
				collection = dates.get(key);
			} else {
				collection = new ArrayList<String>();
				dates.put(key, collection);
			}
			collection.add(date);
		}

		void loadNameFromL5DataRow(Cursor nameCursor)
		{
			this.fname = nameCursor.getString(ContactsApiLevel5.DATA_COLUMN_NAME_FIRST);
			this.lname = nameCursor.getString(ContactsApiLevel5.DATA_COLUMN_NAME_LAST);
			this.pname = nameCursor.getString(ContactsApiLevel5.DATA_COLUMN_NAME_PREFIX);
			this.mname = nameCursor.getString(ContactsApiLevel5.DATA_COLUMN_NAME_MIDDLE);
			this.sname = nameCursor.getString(ContactsApiLevel5.DATA_COLUMN_NAME_SUFFIX);
			this.fphonetic = nameCursor.getString(ContactsApiLevel5.DATA_COLUMN_DATA9);
			this.mphonetic = nameCursor.getString(ContactsApiLevel5.DATA_COLUMN_DATA8);
			this.lphonetic = nameCursor.getString(ContactsApiLevel5.DATA_COLUMN_DATA7);
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
			proxy.setProperty(TiC.PROPERTY_FIRSTNAME, fname);
			proxy.setProperty(TiC.PROPERTY_LASTNAME, lname);
			proxy.setProperty(TiC.PROPERTY_MIDDLENAME, mname);
			proxy.setProperty(TiC.PROPERTY_PREFIX, pname);
			proxy.setProperty(TiC.PROPERTY_SUFFIX, sname);
			proxy.setProperty(TiC.PROPERTY_FIRSTPHONETIC, fphonetic);
			proxy.setProperty(TiC.PROPERTY_MIDDLEPHONETIC, mphonetic);
			proxy.setProperty(TiC.PROPERTY_LASTPHONETIC, lphonetic);
			proxy.setProperty(TiC.PROPERTY_BIRTHDAY, birthday);
			proxy.setProperty(TiC.PROPERTY_ORGANIZATION, organization);
			proxy.setProperty(TiC.PROPERTY_JOBTITLE, jobTitle);
			proxy.setProperty(TiC.PROPERTY_DEPARTMENT, department);
			proxy.setProperty(TiC.PROPERTY_NICKNAME, nickname);
			proxy.setIMFromMap(instantMessages);
			proxy.setRelatedNameFromMap(relatedNames);
			proxy.setWebSiteFromMap(websites);
			proxy.setProperty(TiC.PROPERTY_NOTE, notes);
			proxy.setProperty(TiC.PROPERTY_BIRTHDAY, birthday);
			proxy.setEmailFromMap(emails);
			proxy.setDateFromMap(dates);
			proxy.setPhoneFromMap(phones);
			proxy.setAddressFromMap(addresses);
			proxy.setProperty(TiC.PROPERTY_KIND, ContactsModule.CONTACTS_KIND_PERSON);
			proxy.setProperty(TiC.PROPERTY_ID, id);
			proxy.hasImage = this.hasImage;
			return proxy;
		}
	}
}
