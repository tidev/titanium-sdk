/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

const SUCCESS = 'SUCCESS!';

export default class TEST {

	constructor() {
		this.value = 'GETTER';
		this.testProperty = SUCCESS;
	}

	static get testStaticConstant () {
		return SUCCESS;
	}

	get testGetterSetter () {
		return this.value;
	}

	set testGetterSetter (value) {
		this.value = SUCCESS;
	}

	testMethod () {
		return SUCCESS;
	}

	static testStaticMethod () {
		return SUCCESS;
	}
}
