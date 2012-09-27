/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.contacts;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;

import android.app.Activity;
import android.content.Intent;

@Kroll.module @ContextSpecific
public class ContactsModule extends KrollModule
		implements TiActivityResultHandler
{
	private static final String TAG = "TiContacts";
	
	@Kroll.constant public static final int CONTACTS_KIND_ORGANIZATION = 0;
	@Kroll.constant public static final int CONTACTS_KIND_PERSON = 1;
	@Kroll.constant public static final int CONTACTS_SORT_FIRST_NAME = 0;
	@Kroll.constant public static final int CONTACTS_SORT_LAST_NAME = 1;

	@Kroll.constant public static final int AUTHORIZATION_AUTHORIZED = 3;
	@Kroll.constant public static final int AUTHORIZATION_DENIED = 2;
	@Kroll.constant public static final int AUTHORIZATION_RESTRICTED = 1;
	@Kroll.constant public static final int AUTHORIZATION_UNKNOWN = 0;

	
	private final AtomicInteger requestCodeGen = new AtomicInteger();
	private final CommonContactsApi contactsApi;
	private Map<Integer, Map<String, KrollFunction>> requests;
	
	public ContactsModule()
	{
		super();
		contactsApi = CommonContactsApi.getInstance();
	}

	public ContactsModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.getProperty @Kroll.method
	public int getContactsAuthorization() {
		return AUTHORIZATION_AUTHORIZED;
	}

	@Kroll.method
	public Object[] getAllPeople(@Kroll.argument(optional=true) KrollDict options)
	{
		Calendar start = Calendar.getInstance();
		//TODO: right now, this is needed to be able to constrain
		//temporarily for a specific app.. we need to rethink this entire API
		int length = Integer.MAX_VALUE;
		if (options != null) {
			if (options.containsKey("max"))
			{
				Double maxObj = (Double)options.get("max");
				length = maxObj.intValue();
			}
		}

		Object[] persons = contactsApi.getAllPeople(length);
		
		Calendar end = Calendar.getInstance();
		long elapsed = end.getTimeInMillis() - start.getTimeInMillis();
		Log.d(TAG, "getAllPersons elapsed: " + elapsed + " milliseconds", Log.DEBUG_MODE);
		return persons;
	}
	
	@Kroll.method
	public PersonProxy createPerson(KrollDict options)
	{
		return contactsApi.addContact(options);
	}
	
	@Kroll.method
	public Object[] getPeopleWithName(String name)
	{
		return contactsApi.getPeopleWithName(name);
	}
	
	@Kroll.method
	public void save (KrollDict people) 
	{
		contactsApi.save(people);
	}
	
	@Kroll.method
	public PersonProxy getPersonByID(long id)
	{
		return contactsApi.getPersonById(id);
	}
	
	@Kroll.method
	public void removePerson(PersonProxy person)
	{
		contactsApi.removePerson(person);
	}
	
	@Kroll.method
	public void requestAuthorization(KrollFunction function) 
	{
		KrollDict dict = new KrollDict();
		dict.put(TiC.PROPERTY_SUCCESS, true);
		function.callAsync(getKrollObject(), dict);
	}
	
	@Kroll.method
	public void showContacts(@Kroll.argument(optional=true) KrollDict d)
	{
		if (TiApplication.getInstance() == null) {
			Log.e(TAG, "Could not showContacts, application is null", Log.DEBUG_MODE);
			return;
		}
		
		Activity launchingActivity = TiApplication.getInstance().getCurrentActivity();
		if (launchingActivity == null) {
			Log.e(TAG, "Could not showContacts, current activity is null., Log.DEBUG_MODE");
			return;
		}
		
		/*
		if (launchingActivity == null) { // Not sure if that's even possible
			launchingActivity = this.getTiContext().getActivity();
		}*/

		Intent intent = contactsApi.getIntentForContactsPicker();
		Log.d(TAG, "Launching content picker activity", Log.DEBUG_MODE);
		
		int requestCode = requestCodeGen.getAndIncrement();
		
		if (requests == null) {
			requests = new HashMap<Integer, Map<String,KrollFunction>>();
		}
		Map<String, KrollFunction> callbacks = new HashMap<String, KrollFunction>();
		requests.put(new Integer(requestCode), callbacks);
		
		String[] callbacksToConsider = new String[]{"selectedPerson", "cancel"};
		for (String callbackToConsider : callbacksToConsider) {
			if (d.containsKey(callbackToConsider)) {
				Object test = d.get(callbackToConsider);
				if (test instanceof KrollFunction) {
					callbacks.put(callbackToConsider, (KrollFunction)test);
				}
			}
			if (d.containsKey("proxy")) {
				Object test = d.get("proxy");
				if (test != null && test instanceof KrollProxy) {
					launchingActivity = ((KrollProxy) test).getActivity();
				}
			}
		}
		
		TiActivitySupport activitySupport = (TiActivitySupport) launchingActivity;
		
		activitySupport.launchActivityForResult(intent, requestCode, this);
	}

	@Override
	public void onError(Activity activity, int requestCode, Exception e)
	{
		Log.e(TAG, "Error from contact picker activity: " + e.getMessage(), e);
	}

	@Override
	public void onResult(Activity activity, int requestCode, int resultCode,
			Intent data)
	{
		Integer rcode = new Integer(requestCode);
		if (requests.containsKey(rcode)) {
			Map<String, KrollFunction> request = requests.get(rcode);
			Log.d(TAG, "Received result from contact picker.  Result code: " + resultCode, Log.DEBUG_MODE);
			if (resultCode == Activity.RESULT_CANCELED) {
				if (request.containsKey("cancel")) {
					KrollFunction callback = request.get("cancel");
					if (callback != null) {
						callback.callAsync(getKrollObject(), new Object[0]);
					}
				}
			} else if (resultCode == Activity.RESULT_OK) {
				if (request.containsKey("selectedPerson")) {
					KrollFunction callback = request.get("selectedPerson");
					if (callback != null) {
						PersonProxy person = contactsApi.getPersonByUri(data.getData());
						KrollDict result = new KrollDict();
						result.put("person", person);
						callback.callAsync(getKrollObject(), new Object[] { result });
					}
				}
			} else {
				Log.w(TAG, "Result code from contact picker activity not understood: " + resultCode);
			}

			// Teardown the request -- it's a one timer.
			request.clear();
			requests.remove(rcode);
		}
	}
}
