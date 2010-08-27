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

@ContextSpecific
public class ContactsModule extends TiModule
		implements TiActivityResultHandler
{
	private static KrollDict constants;
	private static final String LCAT = "TiContacts";
	private static final boolean DBG = TiConfig.LOGD;
	
	protected static final int CONTACTS_KIND_ORGANIZATION = 0;
	protected static final int CONTACTS_KIND_PERSON = 1;
	private static final int CONTACTS_SORT_FIRST_NAME = 0;
	private static final int CONTACTS_SORT_LAST_NAME = 1;
	
	private final AtomicInteger requestCodeGen = new AtomicInteger();
	private Map<Integer, Map<String, KrollCallback>> requests;
	
	public ContactsModule(TiContext tiContext)
	{
		super(tiContext);
	}
	
	@Override
	public KrollDict getConstants()
	{
		if (constants == null) {
			constants = new KrollDict();
			constants.put("CONTACTS_KIND_ORGANIZATION", CONTACTS_KIND_ORGANIZATION);
			constants.put("CONTACTS_KIND_PERSON", CONTACTS_KIND_PERSON);
			constants.put("CONTACTS_SORT_FIRST_NAME", CONTACTS_SORT_FIRST_NAME);
			constants.put("CONTACTS_SORT_LAST_NAME", CONTACTS_SORT_LAST_NAME);
		}
		return constants;
	}
	
	public Object[] getAllPeople(Object [] args)
	{
		//TODO: right now, this is needed to be able to constrain
		//temporarily for a specific app.. we need to rethink this entire API
		int length = Integer.MAX_VALUE;
		if (args!=null && args.length > 0)
		{
			KrollDict d = (KrollDict) args[0];
			Double maxObj = (Double)d.get("max");
			length = maxObj.intValue();
		}
		return PersonProxy.getAllPersons(getTiContext(),length);
	}
	
	public Object[] getPeopleWithName(String name)
	{
		return PersonProxy.getPeopleWithName(getTiContext(), name);
	}
	
	public PersonProxy getPersonByID(long id)
	{
		return PersonProxy.fromId(getTiContext(), id);
	}
	
	public void showContacts(Object[] args)
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
		
		if (args.length > 0) {
			KrollDict d = (KrollDict) args[0];
			String[] callbacksToConsider = new String[]{"selectedPerson", "cancel"};
			for (String callbackToConsider : callbacksToConsider) {
				if (d.containsKey(callbackToConsider)) {
					Object test = d.get(callbackToConsider);
					if (test instanceof KrollCallback) {
						callbacks.put(callbackToConsider, (KrollCallback)test);
					}
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
