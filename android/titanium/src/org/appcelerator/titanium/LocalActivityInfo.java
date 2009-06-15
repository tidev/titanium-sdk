package org.appcelerator.titanium;

import java.io.Serializable;

import org.appcelerator.titanium.util.TitaniumIntentWrapper;

public class LocalActivityInfo implements Serializable {
	private static final long serialVersionUID = 1L;

	private String activityId;
	private TitaniumIntentWrapper intent;

	public LocalActivityInfo(String activityId, TitaniumIntentWrapper intent) {
		this.activityId = activityId;
		this.intent = intent;
	}

	public String getActivityId() {
		return activityId;
	}

	public void setActivityId(String activityId) {
		this.activityId = activityId;
	}

	public TitaniumIntentWrapper getIntent() {
		return intent;
	}

	public void setIntent(TitaniumIntentWrapper intent) {
		this.intent = intent;
	}
}

