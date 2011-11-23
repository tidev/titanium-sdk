package ti.modules.titanium.contacts;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.LinkedHashMap;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
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
		LinkedHashMap<Long, CommonContactsApi.LightPerson> persons = new LinkedHashMap<Long, LightPerson>();
		
		String condition = "mimetype IN " + INConditionForKinds +
		" AND in_visible_group=1";
		
		if (additionalCondition != null) {
			condition += " AND " + additionalCondition;
		}
		
		Cursor cursor = TiApplication.getInstance().getCurrentActivity().managedQuery(
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
		
		CommonContactsApi.LightPerson person = null;

		Activity currentActivity = TiApplication.getInstance().getCurrentActivity();
		if (currentActivity == null) {
			currentActivity = TiApplication.getInstance().getRootActivity();
		}
		// Basic person data.
		Cursor cursor = currentActivity.managedQuery(
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
		
		cursor = currentActivity.managedQuery(
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
		Uri uri = ContentUris.withAppendedId(ContactsUri, id);
		ContentResolver cr = TiApplication.getInstance().getCurrentActivity().getContentResolver();
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

}
