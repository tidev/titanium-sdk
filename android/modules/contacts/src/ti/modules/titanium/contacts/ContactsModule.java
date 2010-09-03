/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.contacts;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Activity;
import android.content.Intent;
import android.provider.Contacts;

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
	private Map<Integer, Map<String, KrollCallback>> requests;
	
	public ContactsModule(TiContext tiContext)
	{
		super(tiContext);
	}
	
	@Kroll.method
	public Object[] getAllPeople(@Kroll.argument(optional=true) KrollDict options)
	{
		//TODO: right now, this is needed to be able to constrain
		//temporarily for a specific app.. we need to rethink this entire API
		int length = Integer.MAX_VALUE;
		if (options.containsKey("max"))
		{
			Double maxObj = (Double)options.get("max");
			length = maxObj.intValue();
		}
		return PersonProxy.getAllPersons(getTiContext(),length);
	}
	
	@Kroll.method
	public Object[] getPeopleWithName(String name)
	{
		return PersonProxy.getPeopleWithName(getTiContext(), name);
	}
	
	@Kroll.method
	public PersonProxy getPersonByID(long id)
	{
		return PersonProxy.fromId(getTiContext(), id);
	}
	
	@Kroll.method
	public void showContacts(@Kroll.argument(optional=true) KrollDict d)
	{
		Intent intent = new Intent(Intent.ACTION_PICK, Contacts.People.CONTENT_URI);
		if (DBG) {
			Log.d(LCAT, "Launching content picker activity");
		}
		
		int requestCode = requestCodeGen.getAndIncrement();
		
		if (requests == null) {
			requests = new HashMap<Integer, Map<String,KrollCallback>>();
		}
		Map<String, KrollCallback> callbacks = new HashMap<String, KrollCallback>();
		requests.put(new Integer(requestCode), callbacks);
		
		String[] callbacksToConsider = new String[]{"selectedPerson", "cancel"};
		for (String callbackToConsider : callbacksToConsider) {
			if (d.containsKey(callbackToConsider)) {
				Object test = d.get(callbackToConsider);
				if (test instanceof KrollCallback) {
					callbacks.put(callbackToConsider, (KrollCallback)test);
				}
			}
		}
		
		TiActivitySupport activitySupport = (TiActivitySupport) getTiContext().getActivity();
		
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
			Map<String, KrollCallback> request = requests.get(rcode);
			if (DBG) {
				Log.d(LCAT, "Received result from contact picker.  Result code: " + resultCode);
			}
			if (resultCode == Activity.RESULT_CANCELED) {
				if (request.containsKey("cancel")) {
					KrollCallback callback = request.get("cancel");
					if (callback != null) {
						callback.call();
					}
				}
			} else if (resultCode == Activity.RESULT_OK) {
				if (request.containsKey("selectedPerson")) {
					KrollCallback callback = request.get("selectedPerson");
					if (callback != null) {
						PersonProxy person = PersonProxy.fromUri(getTiContext(), data.getData());
						callback.call(new Object[]{person});
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
