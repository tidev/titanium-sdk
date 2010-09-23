package ti.modules.titanium.contacts;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

import org.appcelerator.titanium.TiContext;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Contacts;
import android.util.Log;

public class ContactsApiLevel5 extends CommonContactsApi
{
	protected boolean loadedOk;
	private WeakReference<TiContext> weakContext ;
	private static final String LCAT = "TiContacts5";
	private static Class<?> Contacts;
	private static Uri ContactsUri;
	private static Class<?> RawContacts;
	private static Uri RawContactsUri;
	private static Class<?> Email;
	private static Uri EmailUri;
	private static Class<?> Phone;
	private static Uri PhoneUri;
	private static Class<?> Postal;
	private static Uri PostalUri;
	
	private static String[] PEOPLE_PROJECTION = new String[] {
        "_id",
        "display_name",
    };
	protected static int PEOPLE_COL_ID = 0;
	protected static int PEOPLE_COL_NAME = 1;
	
	private static String[] EMAIL_PROJECTION = new String[] {
		"raw_contact_id",
		"data1",
		"data2"
	};
	protected static int EMAIL_COL_CONTACT_ID = 0;
	protected static int EMAIL_COL_ADDRESS = 1;
	protected static int EMAIL_COL_TYPE = 2;
	
	private static String[] PHONE_PROJECTION = new String[] {
		"raw_contact_id",
		"data1",
		"data2"
	};
	protected static int PHONE_COL_CONTACT_ID = 0;
	protected static int PHONE_COL_NUMBER = 1;
	protected static int PHONE_COL_TYPE = 2;
	
	private static String[] POSTAL_PROJECTION = new String[] {
		"raw_contact_id",
		"data1",
		"data2"
	};
	protected static int POSTAL_COL_CONTACT_ID = 0;
	protected static int POSTAL_COL_FORMATTED_ADDRESS = 1; // This mimics what's avail in api level 4.
	protected static int POSTAL_COL_TYPE = 2;
	
	protected ContactsApiLevel5(TiContext tiContext)
	{
		weakContext = new WeakReference<TiContext>(tiContext);
		loadedOk = true;
		try {
			Contacts = Class.forName("android.provider.ContactsContract$Contacts");
			ContactsUri = (Uri) Contacts.getField("CONTENT_URI").get(null);
			RawContacts = Class.forName("android.provider.ContactsContract$RawContacts");
			RawContactsUri = (Uri) RawContacts.getField("CONTENT_URI").get(null);
			Email = Class.forName("android.provider.ContactsContract$CommonDataKinds$Email");
			EmailUri = (Uri) Email.getField("CONTENT_URI").get(null);
			Phone = Class.forName("android.provider.ContactsContract$CommonDataKinds$Phone");
			PhoneUri = (Uri) Phone.getField("CONTENT_URI").get(null);
			Postal = Class.forName("android.provider.ContactsContract$CommonDataKinds$StructuredPostal");
			PostalUri = (Uri) Postal.getField("CONTENT_URI").get(null);
			
		} catch (Throwable t) {
			Log.d(LCAT, "Failed to load ContactsContract$Contacts " + t.getMessage(),t);
			loadedOk = false;
			return;
		}
	}
	
	@Override
	protected PersonProxy[] getAllPeople(int limit)
	{
		TiContext tiContext = weakContext.get();
		if (tiContext == null) {
			Log.d(LCAT , "Could not getAllPeople, context is GC'd");
		}
		
		Map<Long, CommonContactsApi.LightPerson> persons = new HashMap<Long, CommonContactsApi.LightPerson>();
		SortedMap<String, Long> sortedPersons = new TreeMap<String, Long>();
		
		// The Person record
		Cursor cursor = tiContext.getActivity().managedQuery(
				RawContactsUri, 
				PEOPLE_PROJECTION, null, null, "display_name");
		
		int count = 0;
		while (cursor.moveToNext() && count < limit) {
			CommonContactsApi.LightPerson lp = new CommonContactsApi.LightPerson();
			lp.addPersonInfoFromL5Cursor(cursor);
			persons.put(lp.id, lp);
			sortedPersons.put(lp.name + "/" + lp.id, lp.id);
			count++;
		}
		cursor.close();
		
		// Email
		cursor = tiContext.getActivity().managedQuery(
				EmailUri, 
				EMAIL_PROJECTION, null, null, "raw_contact_id");
		while (cursor.moveToNext()) {
			long id = cursor.getLong(EMAIL_COL_CONTACT_ID);
			CommonContactsApi.LightPerson lp = persons.get(id);
			lp.addEmailFromL5Cursor(cursor);
		
		}
		cursor.close();
		
		// Phone
		cursor = tiContext.getActivity().managedQuery(
				PhoneUri, 
				PHONE_PROJECTION, null, null, "raw_contact_id");
		while (cursor.moveToNext()) {
			long id = cursor.getLong(PHONE_COL_CONTACT_ID);
			CommonContactsApi.LightPerson lp = persons.get(id);
			lp.addPhoneFromL5Cursor(cursor);
		
		}
		cursor.close();
		
		// Postal Address
		cursor = tiContext.getActivity().managedQuery(
				PostalUri, 
				POSTAL_PROJECTION, null, null, "raw_contact_id");
		while (cursor.moveToNext()) {
			long id = cursor.getLong(POSTAL_COL_CONTACT_ID);
			CommonContactsApi.LightPerson lp = persons.get(id);
			lp.addAddressFromL5Cursor(cursor);
		}
		cursor.close();
		
		PersonProxy[] proxies = proxifyLightPeopleMap(persons, sortedPersons, tiContext);
		persons.clear();
		return proxies;
	}

	@Override
	protected Intent getIntentForContactsPicker()
	{
		return new Intent(Intent.ACTION_PICK, ContactsUri);
	}

	@Override
	protected PersonProxy[] getPeopleWithName(String name)
	{
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	protected PersonProxy getPersonById(long id)
	{
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	protected PersonProxy getPersonByUri(Uri uri)
	{
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	protected PersonProxy getPersonFromCursor(Cursor cursor)
	{
		// TODO Auto-generated method stub
		return null;
	}

}
