var win = Ti.UI.currentWindow;
win.backgroundColor = '#fff';
win.layout = 'vertical';

var l = Ti.UI.createScrollView({
	top:10,
	left:10,
	font:{fontSize:14},
	color:'black',
	height:180,
	width:300,
	borderWidth: 1
});

win.add(l);

var label1 = Titanium.UI.createLabel({
	height:40,
	top:5,
	left:10,
	width:300,
	text: 'mobile browser use two finger swipe to scroll data',
	font: {fontSize:12}
});

win.add(label1);

var field = Titanium.UI.createTextField({
	height:30,
	top:10,
	left:10,
	width:300,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});

win.add(field);

var b1 = Ti.UI.createButton({
	title:'Insert',
	height:30,
	width:300,
	top:10,
	left:10,
	font: {fontSize:18}
});
win.add(b1);

b1.addEventListener('click', function(){
	doInsert(field.value);
});

var b2 = Ti.UI.createButton({
	title:'See data',
	height:30,
	width:300,
	top:10,
	left:10,
	font:{fontSize:18}
});
win.add(b2);

b2.addEventListener('click', function(){
	seeResults();
});

var b3 = Ti.UI.createButton({
	title:'Clean',
	height:30,
	width:300,
	left:10,
	top:10,
	font:{fontSize:18}
});
win.add(b3);

b3.addEventListener('click', function(){
	deleteEverything();
});

if( (Ti.Platform.osname == 'iphone')&&(!Ti.Platform.isBrowser) ){
	var textArea = Ti.UI.createTextArea({
		value: '',
		width: 300,
		height: 180
	});
	l.add(textArea);
}

function writeToLog(/*string*/ newLogItem){
	if( (Ti.Platform.osname == 'iphone')&&(!Ti.Platform.isBrowser) ){
		textArea.value = textArea.value +'\n'+ newLogItem;
	}else{
		l.add(Ti.UI.createLabel({
				text: newLogItem + "<hr />",
			})
		);
	}
}

var db = Titanium.Database.open('mydb');
db.execute('CREATE TABLE IF NOT EXISTS DATABASETEST_ADV (ID INTEGER, NAME TEXT)');
db.execute('DELETE FROM DATABASETEST_ADV');
var counter = 0;

function doInsert(name){
	executeSQL('INSERT INTO DATABASETEST_ADV (ID, NAME ) VALUES(?,?)', counter++, name, reportResults);
}

function executeSQL (sql) {
	var values = [];
	var callback = null;
	for (var i = 1; i < arguments.length; i++){
		var val = arguments[i];
		
		if (typeof val == 'function'){
			callback = val;
		} else {
			values.push(val);
		}
	}
	str = "Execute SQL: " + sql + ", arguments passed: [" + values.join(", ") + "]";

	writeToLog(str);
	// selects require callback for mobile web - because SQL is async here
	if (Ti.Platform.isBrowser) {
		values.length > 0 ? db.execute(sql, values, callback) : db.execute(sql, callback);
	} else {
		callback(values.length ? db.execute(sql, values) : db.execute(sql));
	}
}

function reportResults (rows) {
    var str = '';
	str += 'INSERTED: rowsAffected = ' + db.rowsAffected + ", " + 'lastInsertRowId = ' + db.lastInsertRowId;
	writeToLog(str);
}

function seeResults(){
	executeSQL('SELECT * FROM DATABASETEST_ADV', function(rows){
		var str = '';
		str += 'ROW COUNT = ' + rows.getRowCount();

		while (rows.isValidRow()) {
			str += '\nID: ' + rows.field(0) + ' NAME: ' + rows.fieldByName('name');
			rows.next();
		}
		rows.close();
		writeToLog(str);
	});
}

function deleteEverything(){
	executeSQL('DELETE FROM DATABASETEST_ADV', function(){
		var str =  "Rows deleted: "+db.rowsAffected;
		writeToLog(str);
		counter = 0;
	});
}

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:30,
	width:300,
	top:10,
	left:10,
	font:{fontSize:20}
});
win.add(closeButton);

closeButton.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});
