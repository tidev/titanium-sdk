package ti.modules.titanium.contacts;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

import android.app.Activity;
import android.content.ContentUris;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Contacts;

public class ContactsApiLevel4 extends CommonContactsApi
{
	private WeakReference<TiContext> weakContext;
	private static final String LCAT = "TiContacts4";
	
	private static String[] PEOPLE_PROJECTION = new String[] {
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
	
	protected ContactsApiLevel4(TiContext tiContext)
	{
		weakContext = new WeakReference<TiContext>(tiContext);
	}
	
	@Override
	protected PersonProxy[] getAllPeople(int limit)
	{
		TiContext tiContext = weakContext.get();
		if (tiContext == null) {
			Log.d(LCAT , "Could not getAllPeople, context is GC'd");
		}
		
		// Fly through all three cursors (people, contact methods (emails & addresses)
		// and phones) in one direction, one pass each, and add to local data structures.
		Map<Long, CommonContactsApi.LightPerson> persons = new HashMap<Long, CommonContactsApi.LightPerson>();
		SortedMap<String, Long> sortedPersons = new TreeMap<String, Long>();
		
		// The Person record
		Cursor cursor = tiContext.getActivity().managedQuery(
				Contacts.People.CONTENT_URI, 
				PEOPLE_PROJECTION, null, null, Contacts.People.NAME);
		
		int count = 0;
		while (cursor.moveToNext() && count < limit) {
			CommonContactsApi.LightPerson lp = new CommonContactsApi.LightPerson();
			lp.addPersonInfoFromL4Cursor(cursor);
			persons.put(lp.id, lp);
			sortedPersons.put(lp.name + "/" + lp.id, lp.id);
			count++;
		}
		cursor.close();
		
		// Emails and addresses
		cursor = tiContext.getActivity().managedQuery(
				Contacts.ContactMethods.CONTENT_URI,
				CONTACT_METHOD_PROJECTION, null, null, null);
		while (cursor.moveToNext()) {
			long id = cursor.getLong(CONTACT_METHOD_COL_PERSONID);
			CommonContactsApi.LightPerson lp = persons.get(id);
			if (lp != null) {
				int kind = cursor.getInt(CONTACT_METHOD_COL_KIND);
				if (kind == Contacts.KIND_EMAIL) {
					lp.addEmailFromL4Cursor(cursor);
				} else if (kind == Contacts.KIND_POSTAL) {
					lp.addAddressFromL4Cursor(cursor);
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
			CommonContactsApi.LightPerson lp = persons.get(id);
			if (lp != null) {
				lp.addPhoneFromL4Cursor(cursor);
			}
		}
		cursor.close();
		
		// Photo info
		cursor = tiContext.getActivity().managedQuery(
				Contacts.Photos.CONTENT_URI,
				PHOTOS_PROJECTION, Contacts.Photos.DATA + " IS NOT NULL", null, null);
		while (cursor.moveToNext()) {
			long id = cursor.getLong(PHOTO_COL_PERSONID);
			CommonContactsApi.LightPerson lp = persons.get(id);
			if (lp != null) {
				lp.addPhotoInfoFromL4Cursor(cursor);
			}
		}
		cursor.close();
		
		PersonProxy[] proxies = proxifyLightPeopleMap(persons, sortedPersons, tiContext);
		persons.clear();
		persons = null;
		return proxies;
	}

	@Override
	protected PersonProxy[] getPeopleWithName(String name)
	{
		TiContext tiContext = weakContext.get();
		if (tiContext == null) {
			Log.d(LCAT , "Could not getAllPeople, context is GC'd");
		}
		
		ArrayList<PersonProxy> all = new ArrayList<PersonProxy>();
		Cursor cursor = tiContext.getActivity().managedQuery(
				Contacts.People.CONTENT_URI, 
				PEOPLE_PROJECTION, 
				Contacts.People.NAME + " = ?", 
				new String[]{name},
				null);
		while (cursor.moveToNext()) {
			all.add(getPersonFromCursor(cursor));
		}
		cursor.close();
		return all.toArray(new PersonProxy[all.size()]);
	}

	@Override
	protected PersonProxy getPersonById(long id)
	{
		Uri uri = ContentUris.withAppendedId(Contacts.People.CONTENT_URI, id);
		return getPersonByUri(uri);
	}

	@Override
	protected PersonProxy getPersonByUri(Uri uri)
	{
		TiContext tiContext = weakContext.get();
		if (tiContext == null) {
			Log.d(LCAT , "Could not getPersonByUri, context is GC'd");
		}
		Activity root = tiContext.getRootActivity();

		Cursor cursor = root.managedQuery(uri, PEOPLE_PROJECTION, null, null, null);
		PersonProxy person = null;
		try {
			cursor.moveToFirst();
			person = getPersonFromCursor(cursor);
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

	@Override
	protected PersonProxy getPersonFromCursor(Cursor cursor)
	{
		TiContext tiContext = weakContext.get();
		if (tiContext == null) {
			Log.d(LCAT , "Could not getPersonFromCursor, context is GC'd");
		}
		if (cursor.isBeforeFirst() ) {
			cursor.moveToFirst();
		}
		CommonContactsApi.LightPerson lp = new CommonContactsApi.LightPerson();
		lp.addPersonInfoFromL4Cursor(cursor);
		long personId = lp.id;
		Cursor emailsCursor = tiContext.getActivity().managedQuery(Contacts.ContactMethods.CONTENT_URI, 
				CONTACT_METHOD_PROJECTION, 
				Contacts.ContactMethods.PERSON_ID + " = ? AND " + Contacts.ContactMethods.KIND + " = ?" , 
				new String[]{ Long.toString(personId) , Integer.toString(Contacts.KIND_EMAIL) }, 
				null);
		while (emailsCursor.moveToNext()) {
			lp.addEmailFromL4Cursor(emailsCursor);
		}
		emailsCursor.close();
		
		Cursor phonesCursor = tiContext.getActivity().managedQuery(
				Contacts.Phones.CONTENT_URI,
				PHONE_PROJECTION,
				Contacts.Phones.PERSON_ID + " = ?",
				new String[]{ Long.toString(personId) },
				null);
		while (phonesCursor.moveToNext()) {
			lp.addPhoneFromL4Cursor(phonesCursor);
		}
		phonesCursor.close();
		
		Cursor addressesCursor = tiContext.getActivity().managedQuery(
				Contacts.ContactMethods.CONTENT_URI,
				CONTACT_METHOD_PROJECTION,
				Contacts.ContactMethods.PERSON_ID + " = ? AND " + Contacts.ContactMethods.KIND + " = ?",
				new String[]{ Long.toString(personId), Integer.toString(Contacts.KIND_POSTAL) },
				null);
		while (addressesCursor.moveToNext()) {
			lp.addAddressFromL4Cursor(addressesCursor);
		}
		addressesCursor.close();
		
		Cursor photosCursor = tiContext.getActivity().managedQuery(
				Contacts.Photos.CONTENT_URI,
				PHOTOS_PROJECTION,
				Contacts.Photos.PERSON_ID + " = ? AND " + Contacts.Photos.DATA + " IS NOT NULL",
				new String[]{ Long.toString(personId)},
				null);
		while (photosCursor.moveToNext()) {
			lp.addPhotoInfoFromL4Cursor(photosCursor);
		}
		photosCursor.close();
		
		return lp.proxify(tiContext);
	}
	
	@Override
	protected Intent getIntentForContactsPicker()
	{
		return new Intent(Intent.ACTION_PICK, Contacts.People.CONTENT_URI);
	}

}
