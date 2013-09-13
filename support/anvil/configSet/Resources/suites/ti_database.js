/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "ti_database";
	this.tests = [
		{name: "test_TIMOB_6239"},
                
	]

	this.test_TIMOB_6239 = function(testRun) {
        
        var db = Ti.Database.open('mydb');
        db.execute('DROP TABLE IF EXISTS welcome');
        db.execute("CREATE TABLE IF NOT EXISTS welcome (title TEXT)");
        db.execute("INSERT INTO welcome (title) VALUES (?)",'one');
        db.execute("INSERT INTO welcome (title) VALUES (?)",'two');
        
        var rows = db.execute("SELECT title FROM welcome");
        
        var count=rows.getRowCount();
        valueOf(testRun, count).shouldBe(2);
        
        var next = rows.next();
        valueOf(testRun, next).shouldBeTrue();
        
        var next = rows.next();
        valueOf(testRun, next).shouldBeFalse();

        rows.close();
        db.close();
        
        finish(testRun);
	}
}