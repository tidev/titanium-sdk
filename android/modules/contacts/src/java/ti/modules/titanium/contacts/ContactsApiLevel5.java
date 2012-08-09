/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.contacts;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

import android.app.Activity;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Intent;
import android.content.OperationApplicationException;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.RemoteException;
import android.provider.Contacts.Phones;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds.Email;
import android.provider.ContactsContract.CommonDataKinds.Event;
import android.provider.ContactsContract.CommonDataKinds.Im;
import android.provider.ContactsContract.CommonDataKinds.Nickname;
import android.provider.ContactsContract.CommonDataKinds.Note;
import android.provider.ContactsContract.CommonDataKinds.Organization;
import android.provider.ContactsContract.CommonDataKinds.Phone;
import android.provider.ContactsContract.CommonDataKinds.Photo;
import android.provider.ContactsContract.CommonDataKinds.Relation;
import android.provider.ContactsContract.CommonDataKinds.StructuredName;
import android.provider.ContactsContract.CommonDataKinds.StructuredPostal;
import android.provider.ContactsContract.CommonDataKinds.Website;
import android.provider.ContactsContract.Data;
import android.provider.ContactsContract.RawContacts;

public class ContactsApiLevel5 extends CommonContactsApi
{
	protected boolean loadedOk;
	//private WeakReference<TiContext> weakContext ;
	private static final String TAG = "TiContacts5";
	private Method openContactPhotoInputStream;
	private static Class<?> Contacts;
	private static Uri ContactsUri;
	private static Uri DataUri;
	private static String[] DATA_PROJECTION = new String[] {
		"contact_id",
		"mimetype",
		"photo_id",
		"display_name",
		"data1",
		"data2",
		"data3",
		"data4",
		"data5",
		"data6",
		"data7",
		"data8",
		"data9",
		"data10"

	};
	protected static int DATA_COLUMN_CONTACT_ID = 0;
	protected static int DATA_COLUMN_MIMETYPE = 1;
	protected static int DATA_COLUMN_PHOTO_ID = 2;
	protected static int DATA_COLUMN_DISPLAY_NAME = 3;
	protected static int DATA_COLUMN_DATA1 = 4;
	protected static int DATA_COLUMN_DATA2 = 5;
	protected static int DATA_COLUMN_DATA3 = 6;
	protected static int DATA_COLUMN_DATA4 = 7;
	protected static int DATA_COLUMN_DATA5 = 8;
	protected static int DATA_COLUMN_DATA6 = 9;
	protected static int DATA_COLUMN_DATA7 = 10;
	protected static int DATA_COLUMN_DATA8 = 11;
	protected static int DATA_COLUMN_DATA9 = 12;
	protected static int DATA_COLUMN_DATA10 = 13;

	protected static int DATA_COLUMN_NOTE = DATA_COLUMN_DATA1;

	protected static int DATA_COLUMN_EMAIL_ADDR = DATA_COLUMN_DATA1;
	protected static int DATA_COLUMN_EMAIL_TYPE = DATA_COLUMN_DATA2;

	protected static int DATA_COLUMN_PHONE_NUMBER = DATA_COLUMN_DATA1;
	protected static int DATA_COLUMN_PHONE_TYPE = DATA_COLUMN_DATA2;

	protected static int DATA_COLUMN_NAME_FIRST = DATA_COLUMN_DATA2;
	protected static int DATA_COLUMN_NAME_LAST = DATA_COLUMN_DATA3;
	protected static int DATA_COLUMN_NAME_PREFIX = DATA_COLUMN_DATA4;
	protected static int DATA_COLUMN_NAME_MIDDLE = DATA_COLUMN_DATA5;
	protected static int DATA_COLUMN_NAME_SUFFIX = DATA_COLUMN_DATA6;

	protected static int DATA_COLUMN_ADDRESS_FULL = DATA_COLUMN_DATA1;
	protected static int DATA_COLUMN_ADDRESS_TYPE = DATA_COLUMN_DATA2;
	protected static int DATA_COLUMN_ADDRESS_STREET = DATA_COLUMN_DATA4;
	protected static int DATA_COLUMN_ADDRESS_POBOX = DATA_COLUMN_DATA5;
	protected static int DATA_COLUMN_ADDRESS_NEIGHBORHOOD = DATA_COLUMN_DATA6;
	protected static int DATA_COLUMN_ADDRESS_CITY = DATA_COLUMN_DATA7;
	protected static int DATA_COLUMN_ADDRESS_STATE = DATA_COLUMN_DATA8;
	protected static int DATA_COLUMN_ADDRESS_POSTCODE = DATA_COLUMN_DATA9;
	protected static int DATA_COLUMN_ADDRESS_COUNTRY = DATA_COLUMN_DATA10;

	protected static String KIND_NAME = "vnd.android.cursor.item/name";
	protected static String KIND_EMAIL = "vnd.android.cursor.item/email_v2";
	protected static String KIND_NOTE = "vnd.android.cursor.item/note";
	protected static String KIND_PHONE = "vnd.android.cursor.item/phone_v2";
	protected static String KIND_ADDRESS = "vnd.android.cursor.item/postal-address_v2";

	protected static String BASE_SELECTION = Data.RAW_CONTACT_ID + "=? AND " + Data.MIMETYPE + "=?";
	protected static String[] RELATED_NAMES_TYPE = {TiC.PROPERTY_ASSISTANT, TiC.PROPERTY_BROTHER, TiC.PROPERTY_CHILD, TiC.PROPERTY_DOMESTIC_PARTNER,
		TiC.PROPERTY_FATHER, TiC.PROPERTY_FRIEND, TiC.PROPERTY_MANAGER, TiC.PROPERTY_MOTHER, TiC.PROPERTY_PARENT,
		TiC.PROPERTY_PARTNER, TiC.PROPERTY_REFERRED_BY, TiC.PROPERTY_OTHER, TiC.PROPERTY_SISTER};

	private static String[] PEOPLE_PROJECTION = new String[] {
		"_id",
		"display_name",
		"photo_id"
	};
	protected static int PEOPLE_COL_ID = 0;
	protected static int PEOPLE_COL_NAME = 1;
	protected static int PEOPLE_COL_PHOTO_ID = 2;

	private static String INConditionForKinds =
			"('" + KIND_ADDRESS + "','" + KIND_EMAIL + "','" +
					KIND_NAME + "','" + KIND_NOTE + "','" + KIND_PHONE + "')";

	protected ContactsApiLevel5()
	{
		//weakContext = new WeakReference<TiContext>(tiContext);
		loadedOk = true;
		try {
			DataUri = (Uri) Class.forName("android.provider.ContactsContract$Data").getField("CONTENT_URI").get(null);
			Contacts = Class.forName("android.provider.ContactsContract$Contacts");
			ContactsUri = (Uri) Contacts.getField("CONTENT_URI").get(null);
			openContactPhotoInputStream = Contacts.getMethod("openContactPhotoInputStream", ContentResolver.class, Uri.class);

		} catch (Throwable t) {
			Log.e(TAG, "Failed to load android.provider.ContactsContract$Contacts " + t.getMessage(), t, Log.DEBUG_MODE);
			loadedOk = false;
			return;
		}
	}

	protected ContactsApiLevel5(TiContext tiContext)
	{
		this();
	}

	@Override
	protected PersonProxy[] getAllPeople(int limit)
	{
		return getPeople(limit, null, null);
	}

	private PersonProxy[] getPeople(int limit, String additionalCondition, String[] additionalSelectionArgs)
	{
		//TiContext tiContext = weakContext.get();
		/*if (tiContext == null) {
			Log.d(LCAT , "Could not getPeople, context is GC'd");
			return null;
		}*/

		if (TiApplication.getInstance() == null) {
			Log.e(TAG, "Failed to call getPeople(), application is null", Log.DEBUG_MODE);
			return null;
		}

		Activity activity = TiApplication.getInstance().getRootOrCurrentActivity();
		if (activity == null) {
			Log.e(TAG, "Failed to call getPeople(), activity is null", Log.DEBUG_MODE);
			return null;
		}

		LinkedHashMap<Long, CommonContactsApi.LightPerson> persons = new LinkedHashMap<Long, LightPerson>();

		String condition = "mimetype IN " + INConditionForKinds +
				" AND in_visible_group=1";

		if (additionalCondition != null) {
			condition += " AND " + additionalCondition;
		}

		Cursor cursor = activity.getContentResolver().query(
				DataUri, 
				DATA_PROJECTION, 
				condition, 
				additionalSelectionArgs, 
				"display_name COLLATE LOCALIZED asc, contact_id asc, mimetype asc, is_super_primary desc, is_primary desc");

		while (cursor.moveToNext() && persons.size() < limit) {
			long id = cursor.getLong(DATA_COLUMN_CONTACT_ID);
			CommonContactsApi.LightPerson person;
			if (persons.containsKey(id)) {
				person = persons.get(id);
			} else {
				person = new CommonContactsApi.LightPerson();
				person.addPersonInfoFromL5DataRow(cursor);
				persons.put(id, person);
			}
			person.addDataFromL5Cursor(cursor);
		}

		cursor.close();

		return proxifyPeople(persons);
	}

	@Override
	protected Intent getIntentForContactsPicker()
	{
		return new Intent(Intent.ACTION_PICK, ContactsUri);
	}

	@Override
	protected PersonProxy[] getPeopleWithName(String name)
	{
		return getPeople(Integer.MAX_VALUE, "display_name like ? or display_name like ?" , new String[]{name + '%', "% " + name + '%'});
	}

	protected void updateContactField(ArrayList<ContentProviderOperation> ops, String mimeType, String idKey,
			Object idValue, String typeKey, int typeValue, long rawContactId) 
	{
		ContentProviderOperation.Builder  builder = ContentProviderOperation.newInsert(Data.CONTENT_URI)
				.withValue(Data.MIMETYPE, mimeType)
				.withValue(idKey, idValue);
		if (rawContactId == -1) {
			builder.withValueBackReference(Data.RAW_CONTACT_ID, 0);
		} else {
			builder.withValue(Data.RAW_CONTACT_ID, rawContactId);
		}
		
		if (typeKey != null) {
			builder.withValue(typeKey, typeValue);
		}

		ops.add(builder.build());
	}
	
	protected int processIMProtocol(String serviceName) 
	{
		if (serviceName == null) {
			return -2;
		}
		
		if (serviceName.equals("AIM")) {
			return Im.PROTOCOL_AIM;
		} else if (serviceName.equals("MSN")) {
			return Im.PROTOCOL_MSN;
		} else if (serviceName.equals("ICQ")) {
			return Im.PROTOCOL_ICQ;
		} else if (serviceName.equals("Facebook")) {
			return Im.PROTOCOL_CUSTOM;
		} else if (serviceName.equals("GaduGadu")) {
			return Im.PROTOCOL_CUSTOM;
		} else if (serviceName.equals("GoogleTalk")) {
			return Im.PROTOCOL_GOOGLE_TALK;
		} else if (serviceName.equals("QQ")) {
			return Im.PROTOCOL_QQ;
		} else if (serviceName.equals("Skype")) {
			return Im.PROTOCOL_SKYPE;
		} else if (serviceName.equals("Yahoo")) {
			return Im.PROTOCOL_YAHOO;
		} else {
			return -2;
		}
	}
	
	protected void parseIm(ArrayList<ContentProviderOperation> ops, HashMap instantHashMap, long rawContactId) {
		
		if (instantHashMap.containsKey(TiC.PROPERTY_WORK)) {
			processInstantMsg(instantHashMap, TiC.PROPERTY_WORK, ops, Im.TYPE_WORK, rawContactId);
		} 
		
		if (instantHashMap.containsKey(TiC.PROPERTY_HOME)) {
			processInstantMsg(instantHashMap, TiC.PROPERTY_HOME, ops, Im.TYPE_HOME, rawContactId);
		}
		
		if (instantHashMap.containsKey(TiC.PROPERTY_OTHER)) {
			processInstantMsg(instantHashMap, TiC.PROPERTY_OTHER, ops, Im.TYPE_OTHER, rawContactId);
		}
	}
	
	protected void processInstantMsg(HashMap instantHashMap, String msgType, ArrayList<ContentProviderOperation> ops, int iType, long rawContactId) 
	{
		Object instantObject = instantHashMap.get(msgType);
		if (instantObject instanceof Object[]) {
			Object[] instantArray = (Object[]) instantObject;
			for (int i = 0; i < instantArray.length; i++) {
				Object typeIM = instantArray[i];
				if (typeIM instanceof HashMap) {
					HashMap typeHashMap = (HashMap) typeIM;
					String userName = "";
					String serviceName = "";
					int serviceType = -2;
					if (typeHashMap.containsKey("service")) {
						serviceName = TiConvert.toString(typeHashMap, "service");
						serviceType = processIMProtocol(serviceName);
					}
					
					if (typeHashMap.containsKey("username")) {
						userName = TiConvert.toString(typeHashMap, "username");
					}
					
					//unsupported protocol 
					if (serviceType == -2) {
						Log.e(TAG, "Unsupported IM Protocol detected when adding new contact");
						continue;
					}
					//user name isn't provided
					if (userName.length() == 0) {
						Log.e(TAG, "User name not provided when adding new contact");
						continue;
					}
					ContentProviderOperation.Builder builder = ContentProviderOperation.newInsert(Data.CONTENT_URI)
							.withValue(Data.MIMETYPE, Im.CONTENT_ITEM_TYPE)
							.withValue(Im.DATA, userName)
							.withValue(Im.TYPE, iType);
					if (rawContactId == -1) {
						builder.withValueBackReference(Data.RAW_CONTACT_ID, 0);
					} else {
						builder.withValue(Data.RAW_CONTACT_ID, rawContactId);
					}
					//custom
					if (serviceType == -1) {
						builder.withValue(Im.CUSTOM_PROTOCOL, serviceName);
					} else {
						builder.withValue(Im.PROTOCOL, serviceType);
					}
					
					ops.add(builder.build());
				}
			}
		}
	}

	protected void processData(HashMap dataHashMap, String dataType, ArrayList<ContentProviderOperation> ops, int dType,
			String mimeType, String idKey, String typeKey, long rawContactId) 
	{
		Object dataObject = dataHashMap.get(dataType);
		if (dataObject instanceof Object[]) {
			Object[] dataArray = (Object[]) dataObject;
			for (int i = 0; i < dataArray.length; i++) {
				String data = dataArray[i].toString();
				updateContactField(ops, mimeType, idKey, data, typeKey, dType, rawContactId);
			}
		}
	}
	
	protected void parseURL(ArrayList<ContentProviderOperation> ops, HashMap urlHashMap, long rawContactId)
	{
		if (urlHashMap.containsKey(TiC.PROPERTY_HOMEPAGE)) {
			processURL(urlHashMap, TiC.PROPERTY_HOMEPAGE, ops, Website.TYPE_HOMEPAGE, rawContactId);
		}
		if (urlHashMap.containsKey(TiC.PROPERTY_WORK)) {
			processURL(urlHashMap, TiC.PROPERTY_WORK, ops, Website.TYPE_WORK, rawContactId);
		} 
		
		if (urlHashMap.containsKey(TiC.PROPERTY_HOME)) {
			processURL(urlHashMap, TiC.PROPERTY_HOME, ops, Website.TYPE_HOME, rawContactId);
		}
		
		if (urlHashMap.containsKey(TiC.PROPERTY_OTHER)) {
			processURL(urlHashMap, TiC.PROPERTY_OTHER, ops, Website.TYPE_OTHER, rawContactId);
		}
	}
	
	protected void processURL(HashMap urlHashMap, String urlType, ArrayList<ContentProviderOperation> ops, int uType, long rawContactId) 
	{
		processData(urlHashMap, urlType, ops, uType, Website.CONTENT_ITEM_TYPE, Website.DATA, Website.TYPE, rawContactId);
	}
	
	protected void processRelation(HashMap relHashMap, String relType, ArrayList<ContentProviderOperation> ops, int rType, long rawContactId) 
	{
		processData(relHashMap, relType, ops, rType, Relation.CONTENT_ITEM_TYPE, Relation.DATA, Relation.TYPE, rawContactId);
	}
	
	protected void parseDate(ArrayList<ContentProviderOperation> ops, HashMap dateHashMap, long rawContactId)
	{
		if (dateHashMap.containsKey(TiC.PROPERTY_ANNIVERSARY)) {
			processDate(dateHashMap, TiC.PROPERTY_ANNIVERSARY, ops, Event.TYPE_ANNIVERSARY, rawContactId);
		}
		
		if (dateHashMap.containsKey(TiC.PROPERTY_OTHER)) {
			processDate(dateHashMap, TiC.PROPERTY_OTHER, ops, Event.TYPE_OTHER, rawContactId);
		}
	}
	
	protected void processDate(HashMap dateHashMap, String dateType, ArrayList<ContentProviderOperation> ops, int dType, long rawContactId)
	{
		processData(dateHashMap, dateType, ops, dType, Event.CONTENT_ITEM_TYPE, Event.START_DATE, Event.TYPE, rawContactId);
	}
	
	protected void parseEmail(ArrayList<ContentProviderOperation> ops, HashMap emailHashMap, long rawContactId) 
	{
		if (emailHashMap.containsKey(TiC.PROPERTY_WORK)) {
			processEmail(emailHashMap, TiC.PROPERTY_WORK, ops, Email.TYPE_WORK, rawContactId);
		}
		
		if (emailHashMap.containsKey(TiC.PROPERTY_HOME)) {
			processEmail(emailHashMap, TiC.PROPERTY_HOME, ops, Email.TYPE_HOME, rawContactId);
		}
		
		if (emailHashMap.containsKey(TiC.PROPERTY_OTHER)) {
			processEmail(emailHashMap, TiC.PROPERTY_OTHER, ops, Email.TYPE_OTHER, rawContactId);
		}
	}
	
	protected void processEmail(HashMap emailHashMap, String emailType, ArrayList<ContentProviderOperation> ops, int eType, long rawContactId)
	{
		processData(emailHashMap, emailType, ops, eType, Email.CONTENT_ITEM_TYPE, Email.DATA, Email.TYPE, rawContactId);
	}
	
	protected void parsePhone(ArrayList<ContentProviderOperation> ops, HashMap phoneHashMap, long rawContactId)
	{
		if (phoneHashMap.containsKey(TiC.PROPERTY_MOBILE)) {
			processPhone(phoneHashMap, TiC.PROPERTY_MOBILE, ops, Phone.TYPE_MOBILE, rawContactId);
		} 
		
		if (phoneHashMap.containsKey(TiC.PROPERTY_WORK)) {
			processPhone(phoneHashMap, TiC.PROPERTY_WORK, ops, Phone.TYPE_WORK, rawContactId);
		} 
		
		if (phoneHashMap.containsKey(TiC.PROPERTY_OTHER)) {
			processPhone(phoneHashMap, TiC.PROPERTY_OTHER, ops, Phones.TYPE_OTHER, rawContactId);
		} 
	}

	protected void processPhone(HashMap phoneHashMap, String phoneType, ArrayList<ContentProviderOperation> ops, int pType, long rawContactId) 
	{
		processData(phoneHashMap, phoneType, ops, pType, Phone.CONTENT_ITEM_TYPE, Phone.NUMBER, Phone.TYPE, rawContactId);
	}
	
	protected void parseAddress(ArrayList<ContentProviderOperation> ops, HashMap addressHashMap, long rawContactId)
	{
		if (addressHashMap.containsKey(TiC.PROPERTY_WORK)) {
			processAddress(addressHashMap, TiC.PROPERTY_WORK, ops, StructuredPostal.TYPE_WORK, rawContactId);
		} 
		
		if (addressHashMap.containsKey(TiC.PROPERTY_HOME)) {
			processAddress(addressHashMap, TiC.PROPERTY_HOME, ops, StructuredPostal.TYPE_HOME, rawContactId);
		} 
		
		if (addressHashMap.containsKey(TiC.PROPERTY_OTHER)) {				
			processAddress(addressHashMap, TiC.PROPERTY_OTHER, ops, StructuredPostal.TYPE_OTHER, rawContactId);
		}
	}
	
	protected void processAddress(HashMap addressHashMap, String addressType, ArrayList<ContentProviderOperation> ops, int aType, long rawContactId)
	{
		String country = "";
		String street = "";
		String city = "";
		String state = "";
		String zip = "";
		
		Object type = addressHashMap.get(addressType);
		if (type instanceof Object[]) {
			Object[] typeArray = (Object[]) type;
			for (int i = 0; i < typeArray.length; i++) {
				Object typeAddress = typeArray[i];
				if (typeAddress instanceof HashMap) {
					HashMap typeHashMap = (HashMap) typeAddress;
					if (typeHashMap.containsKey("Country")) {
						country = TiConvert.toString(typeHashMap, "Country");
					}

					if (typeHashMap.containsKey("Street")) {
						street = TiConvert.toString(typeHashMap, "Street");
					}

					if (typeHashMap.containsKey("City")) {
						city = TiConvert.toString(typeHashMap, "City");
					}

					if (typeHashMap.containsKey("ZIP")) {
						zip = TiConvert.toString(typeHashMap, "ZIP");
					}

					if (typeHashMap.containsKey("State")) {
						state = TiConvert.toString(typeHashMap, "State");
					}

					ContentProviderOperation.Builder builder = ContentProviderOperation.newInsert(Data.CONTENT_URI)
							.withValue(Data.MIMETYPE, StructuredPostal.CONTENT_ITEM_TYPE)
							.withValue(StructuredPostal.CITY, city) 
							.withValue(StructuredPostal.REGION, state) 
							.withValue(StructuredPostal.COUNTRY, country) 
							.withValue(StructuredPostal.STREET, street) 
							.withValue(StructuredPostal.POSTCODE, zip) 
							.withValue(StructuredPostal.TYPE, aType);
					if (rawContactId == -1) {
						builder.withValueBackReference(Data.RAW_CONTACT_ID, 0);
					} else {
						builder.withValue(Data.RAW_CONTACT_ID, rawContactId);
					}
					ops.add(builder.build());
				}
			}
		}
	}

	@SuppressWarnings("rawtypes")
	protected PersonProxy addContact(KrollDict options) 
	{

		if (options == null) {
			return null;
		}
		
		String firstName = "";
		String lastName = "";
		String middleName = "";
		String displayName = "";
		String birthday = "";
		long rawContactId = -1;
		
		PersonProxy newContact = new PersonProxy();
		ArrayList<ContentProviderOperation> ops = new ArrayList<ContentProviderOperation>();

		ops.add(ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
				.withValue(RawContacts.ACCOUNT_TYPE, null)
				.withValue(RawContacts.ACCOUNT_NAME, null).build());

		if (options.containsKey(TiC.PROPERTY_FIRSTNAME)) {
			firstName = TiConvert.toString(options, TiC.PROPERTY_FIRSTNAME);
			newContact.setProperty(TiC.PROPERTY_FIRSTNAME, firstName);
		}

		if (options.containsKey(TiC.PROPERTY_LASTNAME)) {
			lastName = TiConvert.toString(options, TiC.PROPERTY_LASTNAME);
			newContact.setProperty(TiC.PROPERTY_LASTNAME, lastName);
		}

		if (options.containsKey(TiC.PROPERTY_MIDDLENAME)) {
			middleName = TiConvert.toString(options, TiC.PROPERTY_MIDDLENAME);
			newContact.setProperty(TiC.PROPERTY_MIDDLENAME, middleName);
		}
		
		displayName = firstName + " " + middleName + " " + lastName;
		
		updateContactField(ops, StructuredName.CONTENT_ITEM_TYPE, StructuredName.DISPLAY_NAME, displayName, null, 0, rawContactId);
		
		if (displayName.length() > 0) {
			newContact.setFullName(displayName);
		}

		if (options.containsKey(TiC.PROPERTY_PHONE)) {
			Object phoneNumbers = options.get(TiC.PROPERTY_PHONE);
			if (phoneNumbers instanceof HashMap) {
				HashMap phoneHashMap = (HashMap)phoneNumbers;
				newContact.setProperty(TiC.PROPERTY_PHONE, phoneHashMap);
				parsePhone(ops, phoneHashMap, rawContactId);
			}
		}

		if (options.containsKey(TiC.PROPERTY_BIRTHDAY)) {
			birthday = TiConvert.toString(options, TiC.PROPERTY_BIRTHDAY);
			newContact.setProperty(TiC.PROPERTY_BIRTHDAY, birthday);
			updateContactField(ops, Event.CONTENT_ITEM_TYPE, Event.START_DATE, birthday, Event.TYPE, Event.TYPE_BIRTHDAY, rawContactId);
		}

		if (options.containsKey(TiC.PROPERTY_ADDRESS)) {
			Object address = options.get(TiC.PROPERTY_ADDRESS);
			if (address instanceof HashMap) {
				HashMap addressHashMap = (HashMap) address;
				newContact.setProperty(TiC.PROPERTY_ADDRESS, addressHashMap);
				parseAddress(ops, addressHashMap, rawContactId);
			}
		}
		
		if (options.containsKey(TiC.PROPERTY_INSTANTMSG)) {
			Object instantMsg = options.get(TiC.PROPERTY_INSTANTMSG);
			if (instantMsg instanceof HashMap) {
				HashMap instantHashMap = (HashMap) instantMsg;
				newContact.setProperty(TiC.PROPERTY_INSTANTMSG, instantHashMap);
				parseIm(ops, instantHashMap, rawContactId);
			}
		}
		
		if (options.containsKey(TiC.PROPERTY_ORGANIZATION)) {
			String organization = TiConvert.toString(options, TiC.PROPERTY_ORGANIZATION);
			newContact.setProperty(TiC.PROPERTY_ORGANIZATION, organization);
			updateContactField(ops, Organization.CONTENT_ITEM_TYPE, Organization.COMPANY, organization, null, 0, rawContactId);
		}
		
		if (options.containsKey(TiC.PROPERTY_URL)) {
			Object urlObject = options.get(TiC.PROPERTY_URL);
			if (urlObject instanceof HashMap) {
				HashMap urlHashMap = (HashMap) urlObject;
				newContact.setProperty(TiC.PROPERTY_URL, urlHashMap);
				parseURL(ops, urlHashMap, rawContactId);
			}
		}

		if (options.containsKey(TiC.PROPERTY_EMAIL)) {
			Object emailObject = options.get(TiC.PROPERTY_EMAIL);
			if (emailObject instanceof HashMap) {
				HashMap emailHashMap = (HashMap) emailObject;
				newContact.setProperty(TiC.PROPERTY_EMAIL, emailHashMap);
				parseEmail(ops, emailHashMap, rawContactId);
			}
		}
		
		if (options.containsKey(TiC.PROPERTY_RELATED_NAMES)) {
			Object namesObject = options.get(TiC.PROPERTY_RELATED_NAMES);
			if (namesObject instanceof HashMap) {
				HashMap namesHashMap = (HashMap) namesObject;
				newContact.setProperty(TiC.PROPERTY_RELATED_NAMES, namesHashMap);
				for (int i = 0; i < RELATED_NAMES_TYPE.length; i++) {
					if (namesHashMap.containsKey(RELATED_NAMES_TYPE[i])) {
						processRelation(namesHashMap, RELATED_NAMES_TYPE[i], ops, i+1, rawContactId);
					}
				}
			}
		}

		if (options.containsKey(TiC.PROPERTY_NOTE)) {
			String note = TiConvert.toString(options, TiC.PROPERTY_NOTE);
			newContact.setProperty(TiC.PROPERTY_NOTE, note);
			updateContactField(ops, Note.CONTENT_ITEM_TYPE, Note.NOTE, note, null, 0, rawContactId);
		}
		
		if (options.containsKey(TiC.PROPERTY_NICKNAME)) {
			String nickname = TiConvert.toString(options, TiC.PROPERTY_NICKNAME);
			newContact.setProperty(TiC.PROPERTY_NICKNAME, nickname);
			updateContactField(ops, Nickname.CONTENT_ITEM_TYPE, Nickname.NAME, nickname, Nickname.TYPE, Nickname.TYPE_DEFAULT, rawContactId);
		}

		if (options.containsKey(TiC.PROPERTY_IMAGE)) {
			Object imageObject = options.get(TiC.PROPERTY_IMAGE);
			if (imageObject instanceof TiBlob) {
				TiBlob imageBlob = (TiBlob) imageObject;
				newContact.setImage(imageBlob);
				updateContactField(ops, Photo.CONTENT_ITEM_TYPE, Photo.PHOTO, imageBlob.getData(), null, 0, rawContactId);
			}
		}
		
		if (options.containsKey(TiC.PROPERTY_DATE)) {
			Object dateObject = options.get(TiC.PROPERTY_DATE);
			if (dateObject instanceof HashMap) {
				HashMap dateHashMap = (HashMap) dateObject;
				newContact.setProperty(TiC.PROPERTY_DATE, dateHashMap);
				parseDate(ops, dateHashMap, rawContactId);
			}
		}

		try {

			ContentProviderResult[] providerResult = TiApplication.getAppRootOrCurrentActivity().getContentResolver().applyBatch(ContactsContract.AUTHORITY, ops);
			long id = ContentUris.parseId(providerResult[0].uri);
			newContact.setProperty(TiC.PROPERTY_ID, id);

		} catch (RemoteException e) { 

			Log.e(TAG, "RemoteException - Failed to add new contact into database");
			return null;

		} catch (OperationApplicationException e) {

			Log.e(TAG, "OperationApplicationException - Failed to add new contact into database");
			return null;
		}   
		
		return newContact;
	}
	
	protected void removePerson(PersonProxy person) 
	{
		if (!(person instanceof PersonProxy)) {
			Log.e(TAG, "Invalid argument type. Expected [PersonProxy], but was: " + person);
			return;
		}

		Object idObj = person.getProperty(TiC.PROPERTY_ID);
		if (idObj instanceof Long) {
			Long id = (Long) idObj;
			ContentResolver cr = TiApplication.getAppRootOrCurrentActivity().getContentResolver();
			Cursor cur = cr.query(ContactsContract.Contacts.CONTENT_URI,
				null, Data._ID + "=?", new String[] {String.valueOf(id)}, null);
			if (cur.moveToNext()) {
				String lookupKey = cur.getString(cur.getColumnIndex(Data.LOOKUP_KEY));
				Uri uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_LOOKUP_URI, lookupKey);
				cr.delete(uri, null, null);
			}
			cur.close();
		}
	}

	@Override
	protected PersonProxy getPersonById(long id)
	{
		/*
		TiContext tiContext = weakContext.get();
		if (tiContext == null) {
			Log.d(LCAT , "Could not getPersonById, context is GC'd");
			return null;
		}
		 */

		if (TiApplication.getInstance() == null) {
			Log.e(TAG, "Failed to call getPersonById(), application is null", Log.DEBUG_MODE);
			return null;
		}

		Activity activity = TiApplication.getInstance().getRootOrCurrentActivity();
		if (activity == null) {
			Log.e(TAG, "Failed to call getPersonById(), activity is null", Log.DEBUG_MODE);
			return null;
		}

		CommonContactsApi.LightPerson person = null;

		// Basic person data.
		Cursor cursor = activity.getContentResolver().query(
				ContentUris.withAppendedId(ContactsUri, id),
				PEOPLE_PROJECTION, null, null, null);

		if (cursor.moveToFirst()) {
			person = new CommonContactsApi.LightPerson();
			person.addPersonInfoFromL5PersonRow(cursor);
		}

		cursor.close();

		if (person == null) {
			return null;
		}

		// Extended data (emails, phones, etc.)
		String condition = "mimetype IN " + INConditionForKinds +
				" AND contact_id = ?";

		cursor = activity.getContentResolver().query(
				DataUri, 
				DATA_PROJECTION, 
				condition, 
				new String[]{String.valueOf(id)}, 
				"mimetype asc, is_super_primary desc, is_primary desc");

		while (cursor.moveToNext()) {
			person.addDataFromL5Cursor(cursor);
		}
		cursor.close();
		return person.proxify();
	}

	@Override
	protected PersonProxy getPersonByUri(Uri uri)
	{
		long id = ContentUris.parseId(uri);
		return getPersonById(id);
	}

	@Override
	protected Bitmap getInternalContactImage(long id)
	{
		/*
		TiContext tiContext = weakContext.get();
		if (tiContext == null) {
			Log.d(LCAT , "Could not getContactImage, context is GC'd");
			return null;
		}
		 */

		if (TiApplication.getInstance() == null) {
			Log.e(TAG, "Failed to call getInternalContactImage(), application is null", Log.DEBUG_MODE);
			return null;
		}

		Uri uri = ContentUris.withAppendedId(ContactsUri, id);
		ContentResolver cr = TiApplication.getInstance().getContentResolver();
		InputStream stream = null;
		try {
			stream = (InputStream) openContactPhotoInputStream.invoke(null, cr, uri);
		} catch (Throwable t) {
			Log.e(TAG, "Could not invoke openContactPhotoInputStream: " + t.getMessage(), t, Log.DEBUG_MODE);
			return null;
		}
		if (stream == null) {
			return null;
		}
		Bitmap bm = BitmapFactory.decodeStream(stream);
		try {
			stream.close();
		} catch (IOException e) {
			Log.e(TAG, "Unable to close stream from openContactPhotoInputStream: " + e.getMessage(), e, Log.DEBUG_MODE);
		}
		return bm;
	}
	
	protected void deleteField(ArrayList<ContentProviderOperation> ops, String selection, String[] selectionArgs)
	{
		ops.add(ContentProviderOperation.newDelete(Data.CONTENT_URI)
			    .withSelection(selection, selectionArgs)
			    .build());
	}

	protected void modifyName(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id) 
	{
		String firstName = "";
		String lastName = "";
		String middleName = "";
		String displayName = "";
		
		if (person.hasProperty(TiC.PROPERTY_FIRSTNAME)) {
			firstName = TiConvert.toString(person.getProperty(TiC.PROPERTY_FIRSTNAME));
		}
		
		if (person.hasProperty(TiC.PROPERTY_LASTNAME)) {
			lastName = TiConvert.toString(person.getProperty(TiC.PROPERTY_LASTNAME));
		}
		
		if (person.hasProperty(TiC.PROPERTY_MIDDLENAME)) {
			middleName = TiConvert.toString(person.getProperty(TiC.PROPERTY_MIDDLENAME));
		}
		
		displayName = firstName + " " + middleName + " " + lastName;
		person.setFullName(displayName);
		
		String[] selectionArgs = new String[]{id, StructuredName.CONTENT_ITEM_TYPE};
		deleteField(ops, BASE_SELECTION, selectionArgs);
		updateContactField(ops, StructuredName.CONTENT_ITEM_TYPE, StructuredName.DISPLAY_NAME, displayName, null, 0, person.getId());
	}
	
	protected void modifyBirthday(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		String birthday = TiConvert.toString(person.getProperty(TiC.PROPERTY_BIRTHDAY));
		String selection = BASE_SELECTION + " AND " + Event.TYPE + "=?";
		String[] selectionArgs = new String[]{id, Event.CONTENT_ITEM_TYPE, String.valueOf(Event.TYPE_BIRTHDAY)};
		deleteField(ops, selection, selectionArgs);
		updateContactField(ops, Event.CONTENT_ITEM_TYPE, Event.START_DATE, birthday, Event.TYPE, Event.TYPE_BIRTHDAY, person.getId());
	}
	
	protected void modifyOrganization(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		String company = TiConvert.toString(person.getProperty(TiC.PROPERTY_ORGANIZATION));
		String[] selectionArgs =  new String[]{id, Organization.CONTENT_ITEM_TYPE};
		deleteField(ops, BASE_SELECTION, selectionArgs);
		updateContactField(ops, Organization.CONTENT_ITEM_TYPE, Organization.COMPANY, company, null, 0, person.getId());
	}
	
	protected void modifyNote(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		String note = TiConvert.toString(person.getProperty(TiC.PROPERTY_NOTE));
		String[] selectionArgs = new String[]{id, Note.CONTENT_ITEM_TYPE};
		deleteField(ops, BASE_SELECTION, selectionArgs);
		updateContactField(ops, Note.CONTENT_ITEM_TYPE, Note.NOTE, note, null, 0, person.getId());
	}
	
	protected void modifyNickName(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		String nickname = TiConvert.toString(person.getProperty(TiC.PROPERTY_NICKNAME));
		String selection = BASE_SELECTION + " AND " + Nickname.TYPE + "=?";
		String[] selectionArgs = new String[]{id, Nickname.CONTENT_ITEM_TYPE, String.valueOf(Nickname.TYPE_DEFAULT)};
		deleteField(ops, selection, selectionArgs);
		updateContactField(ops, Nickname.CONTENT_ITEM_TYPE, Nickname.NAME, nickname, Nickname.TYPE, Nickname.TYPE_DEFAULT, person.getId());
	}

	protected void modifyImage(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		TiBlob imageBlob = person.getImage();
		String[] selectionArgs = new String[]{id, Photo.CONTENT_ITEM_TYPE};
		deleteField(ops, BASE_SELECTION, selectionArgs);
		updateContactField(ops, Photo.CONTENT_ITEM_TYPE, Photo.PHOTO, imageBlob.getData(), null, 0, person.getId());
	}
	
	protected void modifyField(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id, long rawContactId, String field, String itemType)
	{
		Object fieldObject = person.getProperty(field);
		if (fieldObject instanceof HashMap) {
			HashMap fieldHashMap = (HashMap) fieldObject;
			String[] selectionArgs = new String[]{id, itemType};
			deleteField(ops, BASE_SELECTION, selectionArgs);
			if (field.equals(TiC.PROPERTY_PHONE)) {
				parsePhone(ops, fieldHashMap, rawContactId);
			} else if (field.equals(TiC.PROPERTY_ADDRESS)) {
				parseAddress(ops, fieldHashMap, rawContactId);
			} else if (field.equals(TiC.PROPERTY_INSTANTMSG)) {
				parseIm(ops, fieldHashMap, rawContactId);
			} else if (field.equals(TiC.PROPERTY_URL)) {
				parseURL(ops, fieldHashMap, rawContactId);
			} else if (field.equals(TiC.PROPERTY_EMAIL)) {
				parseEmail(ops, fieldHashMap, rawContactId);
			} else if (field.equals(TiC.PROPERTY_RELATED_NAMES)) {
				for (int i = 0; i < RELATED_NAMES_TYPE.length; i++) {
					if (fieldHashMap.containsKey(RELATED_NAMES_TYPE[i])) {
						processRelation(fieldHashMap, RELATED_NAMES_TYPE[i], ops, i+1, rawContactId);
					}
				}
			} else if (field.equals(TiC.PROPERTY_DATE)) {
				parseDate(ops, fieldHashMap, rawContactId);
				//Since date contains birthday, when we modify date, we must re-add birthday event appropriately
				if (person.hasProperty(TiC.PROPERTY_BIRTHDAY)) {
					String birthday = TiConvert.toString(person.getProperty(TiC.PROPERTY_BIRTHDAY));
					updateContactField(ops, Event.CONTENT_ITEM_TYPE, Event.START_DATE, birthday, Event.TYPE, Event.TYPE_BIRTHDAY, rawContactId);
				}
				
			}
		}
	}
	protected void modifyPhone(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		modifyField(ops, person, id, person.getId(), TiC.PROPERTY_PHONE, Phone.CONTENT_ITEM_TYPE);
	}

	protected void modifyAddress(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		modifyField(ops, person, id, person.getId(), TiC.PROPERTY_ADDRESS, StructuredPostal.CONTENT_ITEM_TYPE);
	}
	
	protected void modifyIm(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		modifyField(ops, person, id, person.getId(), TiC.PROPERTY_INSTANTMSG, Im.CONTENT_ITEM_TYPE);
	}
	
	protected void modifyUrl(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		modifyField(ops, person, id, person.getId(), TiC.PROPERTY_URL, Website.CONTENT_ITEM_TYPE);
	}
	
	protected void modifyEmail(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		modifyField(ops, person, id, person.getId(), TiC.PROPERTY_EMAIL, Email.CONTENT_ITEM_TYPE);
	}
	
	protected void modifyRelatedNames(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		modifyField(ops, person, id, person.getId(), TiC.PROPERTY_RELATED_NAMES, Relation.CONTENT_ITEM_TYPE);
	}
	
	protected void modifyDate(ArrayList<ContentProviderOperation> ops, PersonProxy person, String id)
	{
		modifyField(ops, person, id, person.getId(), TiC.PROPERTY_DATE, Event.CONTENT_ITEM_TYPE);
	}
	
	protected void modifyContact(PersonProxy person, String id)
	{
		ArrayList<ContentProviderOperation> ops = new ArrayList<ContentProviderOperation>();
		if (person.isFieldModified(TiC.PROPERTY_NAME)) {
			modifyName(ops, person, id); 
		}
		
		if (person.isFieldModified(TiC.PROPERTY_BIRTHDAY)) {
			modifyBirthday(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_ORGANIZATION)) {
			modifyOrganization(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_NOTE)) {
			modifyNote(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_NICKNAME)) {
			modifyNickName(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_IMAGE)) {
			modifyImage(ops, person, id); 
		}
		
		if (person.isFieldModified(TiC.PROPERTY_PHONE)) {
			modifyPhone(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_ADDRESS)) {
			modifyAddress(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_INSTANTMSG)) {
			modifyIm(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_URL)) {
			modifyUrl(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_EMAIL)) {
			modifyEmail(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_RELATED_NAMES)) {
			modifyRelatedNames(ops, person, id);
		}
		
		if (person.isFieldModified(TiC.PROPERTY_DATE)) {
			modifyDate(ops, person, id);
		}
		try {
			TiApplication.getAppRootOrCurrentActivity().getContentResolver().applyBatch(ContactsContract.AUTHORITY, ops);
			person.finishModification();
		} catch (RemoteException e) {
			Log.e(TAG, "RemoteException - unable to save changes to contact Database.");
		} catch (OperationApplicationException e) {
			Log.e(TAG, "OperationApplicationException - unable to save changes to contact Database.");
		}
		
	}
	
	@Override
	protected void save(Object people) {
		
		if (!(people instanceof Object[])) {
			return;
		}
		
		Object[] contacts = (Object[]) people;
		for (int i = 0; i < contacts.length; i++) {
			Object contact = contacts[i];
			if (contact instanceof PersonProxy) {
				PersonProxy person = (PersonProxy) contact;
				Object idObj = person.getProperty(TiC.PROPERTY_ID);
				if (idObj instanceof Long) {
					Long id = (Long) idObj;
					modifyContact(person, String.valueOf(id));
				}

			} else {
				Log.e(TAG, "Invalid argument type to save");
			}
		}
		
	}

}
