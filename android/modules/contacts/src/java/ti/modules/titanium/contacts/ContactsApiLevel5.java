package ti.modules.titanium.contacts;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;

import org.appcelerator.kroll.KrollDict;
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
import android.util.Log;

public class ContactsApiLevel5 extends CommonContactsApi
{
	protected boolean loadedOk;
	//private WeakReference<TiContext> weakContext ;
	private static final String LCAT = "TiContacts5";
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
			Log.d(LCAT, "Failed to load ContactsContract$Contacts " + t.getMessage(),t);
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
			Log.e(LCAT, "Could not getPeople, application is null");
			return null;
		}

		Activity activity = TiApplication.getInstance().getRootOrCurrentActivity();
		if (activity == null) {
			Log.e(LCAT, "Could not getPeople, activity is null");
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
			Object idValue, String typeKey, int typeValue) 
	{
		if (typeKey == null) {
			ops.add(ContentProviderOperation
					.newInsert(Data.CONTENT_URI)
					.withValueBackReference(Data.RAW_CONTACT_ID, 0)
					.withValue(Data.MIMETYPE, mimeType)
					.withValue(idKey, idValue) 
					.build());
		} else {
			ops.add(ContentProviderOperation
					.newInsert(Data.CONTENT_URI)
					.withValueBackReference(Data.RAW_CONTACT_ID, 0)
					.withValue(Data.MIMETYPE, mimeType)
					.withValue(idKey, idValue) 
					.withValue(typeKey, typeValue)
					.build());
		}
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
	
	protected void processInstantMsg(HashMap instantHashMap, String msgType, ArrayList<ContentProviderOperation> ops, int iType) 
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
						Log.e(LCAT, "Unsupported IM Protocol detected when adding new contact");
						continue;
					}
					//user name isn't provided
					if (userName.length() == 0) {
						Log.e(LCAT, "User name is not provided when adding new contact");
						continue;
					}
					//custom
					if (serviceType == -1) {
						ops.add(ContentProviderOperation
								.newInsert(Data.CONTENT_URI)
								.withValueBackReference(Data.RAW_CONTACT_ID, 0)
								.withValue(Data.MIMETYPE, Im.CONTENT_ITEM_TYPE)
								.withValue(Im.PROTOCOL, serviceType) 
								.withValue(Im.CUSTOM_PROTOCOL, serviceName) 
								.withValue(Im.DATA, userName)
								.withValue(Im.TYPE, iType) 
								.build());
					} else {
						ops.add(ContentProviderOperation
								.newInsert(Data.CONTENT_URI)
								.withValueBackReference(Data.RAW_CONTACT_ID, 0)
								.withValue(Data.MIMETYPE, Im.CONTENT_ITEM_TYPE)
								.withValue(Im.PROTOCOL, serviceType) 
								.withValue(Im.CUSTOM_PROTOCOL, serviceName) 
								.withValue(Im.DATA, userName)
								.withValue(Im.TYPE, iType) 
								.build());
					}
				}
			}
		}
	}

	protected void processData(HashMap dataHashMap, String dataType, ArrayList<ContentProviderOperation> ops, int dType,
			String mimeType, String idKey, String typeKey) 
	{
		Object dataObject = dataHashMap.get(dataType);
		if (dataObject instanceof Object[]) {
			Object[] dataArray = (Object[]) dataObject;
			for (int i = 0; i < dataArray.length; i++) {
				String data = dataArray[i].toString();
				updateContactField(ops, mimeType, idKey, data, typeKey, dType);
			}
		}
	}
	
	protected void processURL(HashMap urlHashMap, String urlType, ArrayList<ContentProviderOperation> ops, int uType) 
	{
		processData(urlHashMap, urlType, ops, uType, Website.CONTENT_ITEM_TYPE, Website.DATA, Website.TYPE);
	}
	
	protected void processRelation(HashMap relHashMap, String relType, ArrayList<ContentProviderOperation> ops, int rType) 
	{
		processData(relHashMap, relType, ops, rType, Relation.CONTENT_ITEM_TYPE, Relation.DATA, Relation.TYPE);
	}
	
	protected void processDate(HashMap dateHashMap, String dateType, ArrayList<ContentProviderOperation> ops, int dType)
	{
		processData(dateHashMap, dateType, ops, dType, Event.CONTENT_ITEM_TYPE, Event.START_DATE, Event.TYPE);
	}
	
	protected void processEmail(HashMap emailHashMap, String emailType, ArrayList<ContentProviderOperation> ops, int eType)
	{
		processData(emailHashMap, emailType, ops, eType, Email.CONTENT_ITEM_TYPE, Email.DATA, Email.TYPE);
	}
	
	protected void processPhone(HashMap phoneHashMap, String phoneType, ArrayList<ContentProviderOperation> ops, int pType) 
	{
		processData(phoneHashMap, phoneType, ops, pType, Phone.CONTENT_ITEM_TYPE, Phone.NUMBER, Phone.TYPE);
	}
	
	protected void processAddress(HashMap addressHashMap, String addressType, ArrayList<ContentProviderOperation> ops, int aType)
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

					ops.add(ContentProviderOperation
							.newInsert(Data.CONTENT_URI)
							.withValueBackReference(Data.RAW_CONTACT_ID, 0)
							.withValue(Data.MIMETYPE, StructuredPostal.CONTENT_ITEM_TYPE)
							.withValue(StructuredPostal.CITY, city) 
							.withValue(StructuredPostal.REGION, state) 
							.withValue(StructuredPostal.COUNTRY, country) 
							.withValue(StructuredPostal.STREET, street) 
							.withValue(StructuredPostal.POSTCODE, zip) 
							.withValue(StructuredPostal.TYPE, aType)
							.build());
				}
			}
		}
	}

	@SuppressWarnings("rawtypes")
	protected PersonProxy addContact(KrollDict options) {

		if (options == null) {
			return null;
		}
		
		String firstName = "";
		String lastName = "";
		String fullName = "";
		String middleName = "";
		String displayName = "";
		String birthday = "";
		
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

		if (options.containsKey(TiC.PROPERTY_FULLNAME)) {
			fullName = TiConvert.toString(options, TiC.PROPERTY_FULLNAME);
			displayName = fullName;
		} else {
			displayName = firstName + " " + middleName + " " + lastName;
		}

		updateContactField(ops, StructuredName.CONTENT_ITEM_TYPE, StructuredName.DISPLAY_NAME, displayName, null, 0);
		
		if (fullName.length() > 0) {
			newContact.setProperty(TiC.PROPERTY_FULLNAME, fullName);
		}

		if (options.containsKey(TiC.PROPERTY_PHONE)) {
			Object phoneNumbers = options.get(TiC.PROPERTY_PHONE);
			if (phoneNumbers instanceof HashMap) {
				HashMap phones = (HashMap)phoneNumbers;
				newContact.setProperty(TiC.PROPERTY_PHONE, phones);
		
				if (phones.containsKey(TiC.PROPERTY_MOBILE)) {
					processPhone(phones, TiC.PROPERTY_MOBILE, ops, Phone.TYPE_MOBILE);
				} 
				
				if (phones.containsKey(TiC.PROPERTY_WORK)) {
					processPhone(phones, TiC.PROPERTY_WORK, ops, Phone.TYPE_WORK);
				} 
				
				if (phones.containsKey(TiC.PROPERTY_OTHER)) {
					processPhone(phones, TiC.PROPERTY_OTHER, ops, Phones.TYPE_OTHER);
				} 
			}
		}

		if (options.containsKey(TiC.PROPERTY_BIRTHDAY)) {
			birthday = TiConvert.toString(options, TiC.PROPERTY_BIRTHDAY);
			newContact.setProperty(TiC.PROPERTY_BIRTHDAY, birthday);
			updateContactField(ops, Event.CONTENT_ITEM_TYPE, Event.START_DATE, birthday, Event.TYPE, Event.TYPE_BIRTHDAY);
		}

		if (options.containsKey(TiC.PROPERTY_ADDRESS)) {
			Object address = options.get(TiC.PROPERTY_ADDRESS);
			if (address instanceof HashMap) {
				HashMap addressHashMap = (HashMap) address;
				newContact.setProperty(TiC.PROPERTY_ADDRESS, addressHashMap);
				if (addressHashMap.containsKey(TiC.PROPERTY_WORK)) {
					processAddress(addressHashMap, TiC.PROPERTY_WORK, ops, StructuredPostal.TYPE_WORK);
				} 
				
				if (addressHashMap.containsKey(TiC.PROPERTY_HOME)) {
					processAddress(addressHashMap, TiC.PROPERTY_HOME, ops, StructuredPostal.TYPE_HOME);
				} 
				
				if (addressHashMap.containsKey(TiC.PROPERTY_OTHER)) {				
					processAddress(addressHashMap, TiC.PROPERTY_OTHER, ops, StructuredPostal.TYPE_OTHER);
				}
			}
		}
		
		if (options.containsKey(TiC.PROPERTY_INSTANTMSG)) {
			Object instantMsg = options.get(TiC.PROPERTY_INSTANTMSG);
			if (instantMsg instanceof HashMap) {
				HashMap instantHashMap = (HashMap) instantMsg;
				newContact.setProperty(TiC.PROPERTY_INSTANTMSG, instantHashMap);
				if (instantHashMap.containsKey(TiC.PROPERTY_WORK)) {
					processInstantMsg(instantHashMap, TiC.PROPERTY_WORK, ops, Im.TYPE_WORK);
				} 
				
				if (instantHashMap.containsKey(TiC.PROPERTY_HOME)) {
					processInstantMsg(instantHashMap, TiC.PROPERTY_HOME, ops, Im.TYPE_HOME);
				}
				
				if (instantHashMap.containsKey(TiC.PROPERTY_OTHER)) {
					processInstantMsg(instantHashMap, TiC.PROPERTY_OTHER, ops, Im.TYPE_OTHER);
				}
			}
		}
		
		if (options.containsKey(TiC.PROPERTY_ORGANIZATION)) {
			String organization = TiConvert.toString(options, TiC.PROPERTY_ORGANIZATION);
			newContact.setProperty(TiC.PROPERTY_ORGANIZATION, organization);
			updateContactField(ops, Organization.CONTENT_ITEM_TYPE, Organization.COMPANY, organization, null, 0);
		}
		
		if (options.containsKey(TiC.PROPERTY_URL)) {
			Object urlObject = options.get(TiC.PROPERTY_URL);
			if (urlObject instanceof HashMap) {
				HashMap urlHashMap = (HashMap) urlObject;
				newContact.setProperty(TiC.PROPERTY_URL, urlHashMap);
				
				if (urlHashMap.containsKey(TiC.PROPERTY_HOMEPAGE)) {
					processURL(urlHashMap, TiC.PROPERTY_HOMEPAGE, ops, Website.TYPE_HOMEPAGE);
				}
				if (urlHashMap.containsKey(TiC.PROPERTY_WORK)) {
					processURL(urlHashMap, TiC.PROPERTY_WORK, ops, Website.TYPE_WORK);
				} 
				
				if (urlHashMap.containsKey(TiC.PROPERTY_HOME)) {
					processURL(urlHashMap, TiC.PROPERTY_HOME, ops, Website.TYPE_HOME);
				}
				
				if (urlHashMap.containsKey(TiC.PROPERTY_OTHER)) {
					processURL(urlHashMap, TiC.PROPERTY_OTHER, ops, Website.TYPE_OTHER);
				}
			}
		}

		if (options.containsKey(TiC.PROPERTY_EMAIL)) {
			Object emailObject = options.get(TiC.PROPERTY_EMAIL);
			if (emailObject instanceof HashMap) {
				HashMap emailHashMap = (HashMap) emailObject;
				newContact.setProperty(TiC.PROPERTY_EMAIL, emailHashMap);
				
				if (emailHashMap.containsKey(TiC.PROPERTY_WORK)) {
					processEmail(emailHashMap, TiC.PROPERTY_WORK, ops, Email.TYPE_WORK);
				}
				
				if (emailHashMap.containsKey(TiC.PROPERTY_HOME)) {
					processEmail(emailHashMap, TiC.PROPERTY_HOME, ops, Email.TYPE_HOME);
				}
				
				if (emailHashMap.containsKey(TiC.PROPERTY_OTHER)) {
					processEmail(emailHashMap, TiC.PROPERTY_OTHER, ops, Email.TYPE_OTHER);
				}
			}
		}
		
		if (options.containsKey(TiC.PROPERTY_RELATED_NAMES)) {
			Object namesObject = options.get(TiC.PROPERTY_RELATED_NAMES);
			String[] types = {TiC.PROPERTY_ASSISTANT, TiC.PROPERTY_BROTHER, TiC.PROPERTY_CHILD, TiC.PROPERTY_DOMESTIC_PARTNER,
					TiC.PROPERTY_FATHER, TiC.PROPERTY_FRIEND, TiC.PROPERTY_MANAGER, TiC.PROPERTY_MOTHER, TiC.PROPERTY_PARENT,
					TiC.PROPERTY_PARTNER, TiC.PROPERTY_REFERRED_BY, TiC.PROPERTY_OTHER, TiC.PROPERTY_SISTER};

			if (namesObject instanceof HashMap) {
				HashMap namesHashMap = (HashMap) namesObject;
				newContact.setProperty(TiC.PROPERTY_RELATED_NAMES, namesHashMap);
				for (int i = 0; i < types.length; i++) {
					if (namesHashMap.containsKey(types[i])) {
						processRelation(namesHashMap, types[i], ops, i+1);
					}
				}
			}
		}

		if (options.containsKey(TiC.PROPERTY_NOTE)) {
			String note = TiConvert.toString(options, TiC.PROPERTY_NOTE);
			newContact.setProperty(TiC.PROPERTY_NOTE, note);
			updateContactField(ops, Note.CONTENT_ITEM_TYPE, Note.NOTE, note, null, 0);
		}
		
		if (options.containsKey(TiC.PROPERTY_NICKNAME)) {
			String nickname = TiConvert.toString(options, TiC.PROPERTY_NICKNAME);
			newContact.setProperty(TiC.PROPERTY_NICKNAME, nickname);
			updateContactField(ops, Nickname.CONTENT_ITEM_TYPE, Nickname.NAME, nickname, Nickname.TYPE, Nickname.TYPE_DEFAULT);
		}

		if (options.containsKey(TiC.PROPERTY_IMAGE)) {
			Object imageObject = options.get(TiC.PROPERTY_IMAGE);
			if (imageObject instanceof TiBlob) {
				TiBlob imageBlob = (TiBlob) imageObject;
				newContact.setImage(imageBlob);
				updateContactField(ops, Photo.CONTENT_ITEM_TYPE, Photo.PHOTO, imageBlob.getData(), null, 0);
			}
		}
		
		if (options.containsKey(TiC.PROPERTY_DATE)) {
			Object dateObject = options.get(TiC.PROPERTY_DATE);
			if (dateObject instanceof HashMap) {
				HashMap dateHashMap = (HashMap) dateObject;
				newContact.setProperty(TiC.PROPERTY_DATE, dateHashMap);
				if (dateHashMap.containsKey(TiC.PROPERTY_ANNIVERSARY)) {
					processDate(dateHashMap, TiC.PROPERTY_ANNIVERSARY, ops, Event.TYPE_ANNIVERSARY);
				}
				
				if (dateHashMap.containsKey(TiC.PROPERTY_OTHER)) {
					processDate(dateHashMap, TiC.PROPERTY_OTHER, ops, Event.TYPE_OTHER);
				}
			}
		}

		try {

			ContentProviderResult[] providerResult = TiApplication.getAppRootOrCurrentActivity().getContentResolver().applyBatch(ContactsContract.AUTHORITY, ops);
			long id = ContentUris.parseId(providerResult[0].uri);
			newContact.setProperty("id", id);
			newContact.setId(id);

		} catch (RemoteException e) { 

			Log.e(LCAT, "RemoteException - Failed to add new contact into database");
			return null;

		} catch (OperationApplicationException e) {

			Log.e(LCAT, "OperationApplicationException - Failed to add new contact into database");
			return null;
		}   
		
		return newContact;
	}
	
	protected void removePerson(PersonProxy person) 
	{
		if (!(person instanceof PersonProxy)) {
			Log.e(LCAT, "Invalid argument type. Expected [PersonProxy], but was: " + person);
			return;
		}

		Object idObj = person.getProperty("id");
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
			Log.e(LCAT, "Could not getPersonById, application is null");
			return null;
		}

		Activity activity = TiApplication.getInstance().getRootOrCurrentActivity();
		if (activity == null) {
			Log.e(LCAT, "Could not getPersonById, activity is null");
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
			Log.e(LCAT, "Could not getInternalContactImage, application is null");
			return null;
		}

		Uri uri = ContentUris.withAppendedId(ContactsUri, id);
		ContentResolver cr = TiApplication.getInstance().getContentResolver();
		InputStream stream = null;
		try {
			stream = (InputStream) openContactPhotoInputStream.invoke(null, cr, uri);
		} catch (Throwable t) {
			Log.d(LCAT, "Could not invoke openContactPhotoInputStream: " + t.getMessage(), t);
			return null;
		}
		if (stream == null) {
			return null;
		}
		Bitmap bm = BitmapFactory.decodeStream(stream);
		try {
			stream.close();
		} catch (IOException e) {
			Log.d(LCAT, "Unable to close stream from openContactPhotoInputStream: " + e.getMessage(), e);
		}
		return bm;
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
				//For now we will delete/re-add modified contacts b/c this is a relatively fast operation.
				//We will optimize this process if such a need arise.
				removePerson(person);
				addContact(person.getProperties());
			} else {
				Log.e(LCAT, "Invalid argument type to save");
			}
		}
		
	}

}
