/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.contacts;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.runtime.v8.V8Callback;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Activity;
import android.content.Intent;

@Kroll.module @ContextSpecific
public class ContactsModule extends KrollModule
		implements TiActivityResultHandler
{
	private static final String LCAT = "TiContacts";
	private static final boolean DBG = TiConfig.LOGD;
	
	@Kroll.constant public static final int CONTACTS_KIND_ORGANIZATION = 0;
	@Kroll.constant public static final int CONTACTS_KIND_PERSON = 1;
	@Kroll.constant public static final int CONTACTS_SORT_FIRST_NAME = 0;
	@Kroll.constant public static final int CONTACTS_SORT_LAST_NAME = 1;
	
	private final AtomicInteger requestCodeGen = new AtomicInteger();
	private final CommonContactsApi contactsApi;
	private Map<Integer, Map<String, V8Callback>> requests;
	
	public ContactsModule()
	{
		super();
		contactsApi = CommonContactsApi.getInstance();
	}
	
	@Kroll.method
	public Object[] getAllPeople(@Kroll.argument(optional=true) KrollDict options)
	{
		Calendar start = Calendar.getInstance();
		//TODO: right now, this is needed to be able to constrain
		//temporarily for a specific app.. we need to rethink this entire API
		int length = Integer.MAX_VALUE;
		if (options.containsKey("max"))
		{
			Double maxObj = (Double)options.get("max");
			length = maxObj.intValue();
		}
		
		Object[] persons = contactsApi.getAllPeople(length);
		
		Calendar end = Calendar.getInstance();
		long elapsed = end.getTimeInMillis() - start.getTimeInMillis();
		if (DBG) {
			Log.d(LCAT, "getAllPersons elapsed: " + elapsed + " milliseconds"); 
		}
		return persons;
	}
	
	@Kroll.method
	public Object[] getPeopleWithName(String name)
	{
		return contactsApi.getPeopleWithName(name);
	}
	
	@Kroll.method
	public PersonProxy getPersonByID(long id)
	{
		return contactsApi.getPersonById(id);
	}
	
	@Kroll.method
	public void showContacts(@Kroll.argument(optional=true) KrollDict d)
	{
		Activity launchingActivity = TiApplication.getInstance().getRootActivity();
		
		/*
		if (launchingActivity == null) { // Not sure if that's even possible
			launchingActivity = this.getTiContext().getActivity();
		}*/

		Intent intent = contactsApi.getIntentForContactsPicker();
		if (DBG) {
			Log.d(LCAT, "Launching content picker activity");
		}
		
		int requestCode = requestCodeGen.getAndIncrement();
		
		if (requests == null) {
			requests = new HashMap<Integer, Map<String,V8Callback>>();
		}
		Map<String, V8Callback> callbacks = new HashMap<String, V8Callback>();
		requests.put(new Integer(requestCode), callbacks);
		
		String[] callbacksToConsider = new String[]{"selectedPerson", "cancel"};
		for (String callbackToConsider : callbacksToConsider) {
			if (d.containsKey(callbackToConsider)) {
				Object test = d.get(callbackToConsider);
				if (test instanceof V8Callback) {
					callbacks.put(callbackToConsider, (V8Callback)test);
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
		Log.e(LCAT, "Error from contact picker activity: " + e.getMessage(), e);
	}

	@Override
	public void onResult(Activity activity, int requestCode, int resultCode,
			Intent data)
	{
		Integer rcode = new Integer(requestCode);
		if (requests.containsKey(rcode)) {
			Map<String, V8Callback> request = requests.get(rcode);
			if (DBG) {
				Log.d(LCAT, "Received result from contact picker.  Result code: " + resultCode);
			}
			if (resultCode == Activity.RESULT_CANCELED) {
				if (request.containsKey("cancel")) {
					V8Callback callback = request.get("cancel");
					if (callback != null) {
						callback.invoke(this, new Object[]{});
						//callback.callAsync();
					}
				}
			} else if (resultCode == Activity.RESULT_OK) {
				if (request.containsKey("selectedPerson")) {
					V8Callback callback = request.get("selectedPerson");
					if (callback != null) {
						PersonProxy person = contactsApi.getPersonByUri(data.getData());
						KrollDict result = new KrollDict();
						result.put("person", person);
						callback.invoke(this, result);
						//callback.callAsync(new Object[]{result});
					}
				}
			} else {
				Log.w(LCAT, "Result code from contact picker activity not understood: " + resultCode);
			}
			
			// Teardown the request -- it's a one timer.
			request.clear();
			requests.remove(rcode);
		}
	}
	
}
