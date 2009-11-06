/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.contacts;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumResultHandler;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumBaseModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.ContentUris;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Contacts;
import android.provider.Contacts.People;
import android.provider.Contacts.Phones;
import android.webkit.WebView;

public class TitaniumContacts extends TitaniumBaseModule
{
	private static final String LCAT = "TiContact";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public TitaniumContacts(TitaniumModuleManager manager, String moduleName) {
		super(manager, moduleName);
	}

	@Override
	public void register(WebView webView) {
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumContact as " + moduleName + " using TitaniumMethod.");
		}

		tmm.registerModule(moduleName, this);
	}

	public void showContact(JSONObject args) {
		TitaniumActivity activity = getActivity();
		TitaniumIntentWrapper contactIntent = new TitaniumIntentWrapper(new Intent());
		contactIntent.getIntent().setAction(Intent.ACTION_VIEW);
		String key = null;

		try {
			key = args.getString("key");
		} catch (JSONException e) {
			Log.e(LCAT, "Missing key for contact");
		}

		contactIntent.getIntent().setData(Uri.parse(key));
		contactIntent.getIntent().addCategory(Intent.CATEGORY_DEFAULT);

		final int code = activity.getUniqueResultCode();
		 activity.launchActivityForResult(contactIntent, code,
			new TitaniumResultHandler() {

				public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data)
				{
					Log.e(LCAT, "OnResult called: " + resultCode);
/*
					if (resultCode == Activity.RESULT_CANCELED) {
						invokeUserCallback(cancelCallback, null);
					} else {
						JSONObject contact = contactFromProvider(data.getData());

						JSONObject event = new JSONObject();
						try {
							event.put("contact", contact);
							event.put("key", data.getDataString());
							// There is an index attribute, but I have no idea what it's for

							invokeUserCallback(successCallback, event.toString());
						} catch (JSONException e) {
							Log.e(LCAT, "Unable to create contact event: " + e.getMessage());
						}
					}
			*/	}

				public void onError(TitaniumActivity activity, int requestCode, Exception e)
				{
					Log.e(LCAT, "Contact problem: ", e);
				}
			});

	}

	public void showContactPicker(JSONObject args)
	{
		final String successCallback = args.optString("success");
		final String cancelCallback = args.optString("cancel");

		if (successCallback == null) {
			Log.w(LCAT, "Missing success callback");
		}
		if (cancelCallback == null) {
			Log.w(LCAT, "Missing cancel callback");
		}

		TitaniumActivity activity = getActivity();
		TitaniumIntentWrapper contactIntent = new TitaniumIntentWrapper(new Intent());
		contactIntent.getIntent().setAction(Intent.ACTION_PICK);
		contactIntent.getIntent().setData(People.CONTENT_URI);
		contactIntent.getIntent().addCategory(Intent.CATEGORY_DEFAULT);

		final int code = activity.getUniqueResultCode();
		 activity.launchActivityForResult(contactIntent, code,
			new TitaniumResultHandler() {

				public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data)
				{
					Log.e(LCAT, "OnResult called: " + resultCode);
					if (resultCode == Activity.RESULT_CANCELED) {
						invokeUserCallback(cancelCallback, null);
					} else {
						JSONObject contact = contactFromProvider(data.getData());
						long id = ContentUris.parseId(data.getData());

						JSONObject event = new JSONObject();
						try {
							event.put("contact", contact);
							event.put("id", id);

							invokeUserCallback(successCallback, event.toString());
						} catch (JSONException e) {
							Log.e(LCAT, "Unable to create contact event: " + e.getMessage());
						}
					}
				}

				public void onError(TitaniumActivity activity, int requestCode, Exception e)
				{
					Log.e(LCAT, "Contact problem: ", e);
				}
			});
	}

	public JSONArray getAllContacts()
	{
		JSONArray contacts = new JSONArray();

		Activity activity = tmm.getActivity();
		if (activity != null) {

			Cursor c = null;
			try {
				String[] projection = new String[] {
					People._ID,
				};

				c = activity.getContentResolver().query(Contacts.People.CONTENT_URI, projection, null, null, null);
				while(c.moveToNext()) {
					contacts.put(c.getLong(0));
				}
			} finally {
				if (c != null) {
					c.close();
					c = null;
				}
			}
		}

		return contacts;
	}

	public void removeContact(JSONObject contact) {

	}

	public void saveContact(JSONObject contact) {

	}

	public void addContact(JSONObject contact) {

	}

	public JSONObject getContact(int id) {
		JSONObject contact = null;

		Uri contactUri = ContentUris.withAppendedId(Contacts.People.CONTENT_URI, id);
		contact = contactFromProvider(contactUri);

		return contact;
	}

	public JSONObject createContact(JSONObject contactInfo) {
		JSONObject contact = null;

		return contact;
	}

	private JSONObject contactFromProvider(Uri contactUri) {
		JSONObject contact = new JSONObject();

		Activity activity = tmm.getActivity();
		if (activity != null) {
			Cursor c = null;
			try {
				// Person
				String[] projection = new String[] {
					People.NAME,
					People.DISPLAY_NAME,
					People.PHONETIC_NAME
				};
				c = activity.getContentResolver().query(contactUri, projection, null, null, null);
				if (c.moveToFirst()) {
					addAttribute(contact, c, "name", Contacts.PeopleColumns.NAME);
					addAttribute(contact, c, "displayName", Contacts.PeopleColumns.DISPLAY_NAME);
					addAttribute(contact, c, "phoneticName", Contacts.PeopleColumns.PHONETIC_NAME);
				}
				c.close();
				c = null;

				// Notes
				JSONArray notes = new JSONArray();
				projection = new String[] {
					People.NOTES
				};
				c = activity.getContentResolver().query(contactUri, projection, null, null, null);
				while (c.moveToNext()) {
					JSONObject note = new JSONObject();
					addAttribute(note, c, "value", Contacts.PeopleColumns.NOTES);
					notes.put(note);
				}
				c.close();
				c = null;

				contact.put("note", notes);

				// Phones
				projection = new String[] {
					Phones.NUMBER, Phones.TYPE, Phones.LABEL
				};

				JSONArray phones = new JSONArray();

				Uri queryUri = Uri.withAppendedPath(contactUri, People.Phones.CONTENT_DIRECTORY);
				if (DBG) {
					Log.d(LCAT, "Phones URI: " + queryUri.toString());
				}

				c = activity.getContentResolver().query(queryUri, projection, null, null, null);
				while(c.moveToNext()) {
					JSONObject phone = new JSONObject();
					addAttribute(phone, c, "value", Contacts.PhonesColumns.NUMBER);
					int type = c.getInt(c.getColumnIndex(Contacts.PhonesColumns.TYPE));
					switch (type) {
					case Contacts.Phones.TYPE_CUSTOM :
						addAttribute(phone, c, "label", Contacts.PhonesColumns.LABEL);
						break;
					case Contacts.Phones.TYPE_HOME :
						phone.put("label", "home");
						break;
					case Contacts.Phones.TYPE_FAX_HOME :
						phone.put("label", "home fax");
						break;
					case Contacts.Phones.TYPE_FAX_WORK :
						phone.put("label", "work fax");
						break;
					case Contacts.Phones.TYPE_MOBILE :
						phone.put("label", "mobile");
						break;
					case Contacts.Phones.TYPE_OTHER :
						phone.put("label", "other");
						break;
					case Contacts.Phones.TYPE_PAGER :
						phone.put("label", "pager");
						break;
					case Contacts.Phones.TYPE_WORK :
						phone.put("label", "work");
					}

					phones.put(phone);
				}

				contact.put("phone", phones);
				c.close();
				c = null;

				// Contact methods
				JSONArray addresses = new JSONArray();
				JSONArray emails = new JSONArray();

				queryUri = Uri.withAppendedPath(contactUri, People.ContactMethods.CONTENT_DIRECTORY);
				if (DBG) {
					Log.d(LCAT, "Contact Methods URI: " + queryUri.toString());
				}

				projection = new String[] {
					Contacts.ContactMethodsColumns.LABEL,
					Contacts.ContactMethodsColumns.DATA,
					Contacts.ContactMethodsColumns.KIND,
					Contacts.ContactMethodsColumns.TYPE,
					Contacts.ContactMethodsColumns.AUX_DATA
				};

				c = activity.getContentResolver().query(queryUri, projection, null, null, null);
				while(c.moveToNext())
				{
					String data = c.getString(c.getColumnIndex(Contacts.ContactMethodsColumns.DATA));
					String auxData = c.getString(c.getColumnIndex(Contacts.ContactMethodsColumns.AUX_DATA));

					int type = c.getInt(c.getColumnIndex(Contacts.ContactMethodsColumns.TYPE));
					String label = "";
					switch(type) {
						case Contacts.ContactMethodsColumns.TYPE_CUSTOM :
							label = c.getString(c.getColumnIndex(Contacts.ContactMethodsColumns.LABEL));
							break;
						case Contacts.ContactMethodsColumns.TYPE_HOME :
							label = "home";
							break;
						case Contacts.ContactMethodsColumns.TYPE_WORK :
							label = "work";
							break;
						case Contacts.ContactMethodsColumns.TYPE_OTHER :
							label = "other";
							break;
					}

					int kind = c.getInt(c.getColumnIndex(Contacts.ContactMethodsColumns.KIND));
					switch(kind) {
						case Contacts.KIND_EMAIL :
							JSONObject email = new JSONObject();

							email.put("label", label);
							email.put("value", data);

							emails.put(email);
							break;
						case Contacts.KIND_POSTAL :
							JSONObject address = new JSONObject();

							address.put("label", label);

							JSONObject addr = new JSONObject();
							addr.put("displayAddress", data);
							addr.put("street1", "");
							addr.put("street2", "");
							addr.put("city", "");
							addr.put("region1", "");
							addr.put("region2", "");
							addr.put("postalCode", "");
							addr.put("country", "");
							addr.put("countryCode", "");

							address.put("value", addr);

							addresses.put(address);
							break;
						default :
							Log.e(LCAT, "Unhandled contact kind: " + kind);
					}
				}

				contact.put("address", addresses);
				contact.put("email", emails);
				c.close();
				c = null;

				// Organization
				JSONArray organizations = new JSONArray();

				queryUri = Uri.withAppendedPath(contactUri, Contacts.Organizations.CONTENT_DIRECTORY);
				if (DBG) {
					Log.d(LCAT, "Organizations URI: " + queryUri.toString());
				}

				projection = new String[] {
					Contacts.OrganizationColumns.LABEL,
					Contacts.OrganizationColumns.TYPE,
					Contacts.OrganizationColumns.COMPANY,
					Contacts.OrganizationColumns.TITLE
				};

				c = activity.getContentResolver().query(queryUri, projection, null, null, null);
				while(c.moveToNext())
				{
					String company = c.getString(c.getColumnIndex(Contacts.OrganizationColumns.COMPANY));
					String position = c.getString(c.getColumnIndex(Contacts.OrganizationColumns.TITLE));

					int type = c.getInt(c.getColumnIndex(Contacts.ContactMethodsColumns.TYPE));
					String label = "";
					switch(type) {
						case Contacts.OrganizationColumns.TYPE_CUSTOM :
							label = c.getString(c.getColumnIndex(Contacts.ContactMethodsColumns.LABEL));
							break;
						case Contacts.OrganizationColumns.TYPE_WORK :
							label = "work";
							break;
					}

					JSONObject organization = new JSONObject();
					organization.put("label", label);
					JSONObject orgValue = new JSONObject();
					orgValue.put("company", company);
					orgValue.put("position", position);
					organization.put("value", orgValue);

					organizations.put(organization);
				}

				contact.put("organization", organizations);
				c.close();
				c = null;

			} catch (JSONException e) {
				Log.e(LCAT, "Error retrieving contact data: " + e.getMessage());
			} finally {
				if (c != null) {
					c.close();
					c = null;
				}
			}
		}

		return contact;
	}

	private void addAttribute(JSONObject contact, Cursor c, String key, String column)
		throws JSONException
	{
		String value = c.getString(c.getColumnIndex(column));
		if (value != null) {
			contact.put(key, value);
		} else {
			contact.put(key, "");
		}
	}

}
