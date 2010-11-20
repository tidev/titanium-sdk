var win = Titanium.UI.currentWindow;

var l = Titanium.UI.createLabel({
	text:'See Log for output',
	top:10,
	left:10,
	height:'auto',
	width:'auto'
});
win.add(l);

var b1 = Titanium.UI.createButton({
	title:'DB in 2nd Context',
	width:200,
	height:40,
	top:40
});
win.add(b1);

b1.addEventListener('click', function()
{
	var win1 = Titanium.UI.createWindow({
		url:'database_2.js',
		height:30,
		width:280,
		borderRadius:10,
		bottom:80,
		backgroundColor:'#333'
	});
	var l1 = Titanium.UI.createLabel({
		text:'2nd context test - see log.',
		color:'#fff',
		font:{fontSize:14},
		width:'auto',
		height:'auto'
	});
	win1.add(l1);
	win1.open();
});

var b2 = Titanium.UI.createButton({
	title:'Pre-packaged DB',
	width:200,
	height:40,
	top:100
});
win.add(b2);

b2.addEventListener('click', function()
{
	var win2 = Titanium.UI.createWindow({
		url:'database_3.js',
		height:30,
		width:280,
		borderRadius:10,
		bottom:140,
		backgroundColor:'#333'
	});
	var l2= Titanium.UI.createLabel({
		text:'Pre-packaged Db - see log.',
		color:'#fff',
		font:{fontSize:14},
		width:'auto',
		height:'auto'
	});
	win2.add(l2);
	win2.open();
	
});
var l3 = Titanium.UI.createLabel({
	text:'unicode placeholder',
	width:300,
	height:40,
	top:160
});
win.add(l3);
var db = Titanium.Database.open('mydb');

db.execute('CREATE TABLE IF NOT EXISTS DATABASETEST  (ID INTEGER, NAME TEXT)');
db.execute('DELETE FROM DATABASETEST');

db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',1,'Name 1');
db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',2,'Name 2');
db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',3,'Name 3');
db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',4,'Name 4');
db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)', 5, '\u2070 \u00B9 \u00B2 \u00B3 \u2074 \u2075 \u2076 \u2077 \u2078 \u2079');
var updateName = 'I was updated';
var updateId = 4;
db.execute('UPDATE DATABASETEST SET NAME = ? WHERE ID = ?', updateName, updateId);

db.execute('UPDATE DATABASETEST SET NAME = "I was updated too" WHERE ID = 2');

db.execute('DELETE FROM DATABASETEST WHERE ID = ?',1);

Titanium.API.info('JUST INSERTED, rowsAffected = ' + db.rowsAffected);
Titanium.API.info('JUST INSERTED, lastInsertRowId = ' + db.lastInsertRowId);

var rows = db.execute('SELECT * FROM DATABASETEST');
Titanium.API.info('ROW COUNT = ' + rows.getRowCount());
Titanium.API.info('ROW COUNT = ' + rows.getRowCount());
Titanium.API.info('ROW COUNT = ' + rows.getRowCount());

while (rows.isValidRow())
{
	Titanium.API.info('ID: ' + rows.field(0) + ' NAME: ' + rows.fieldByName('name') + ' COLUMN NAME ' + rows.fieldName(0));
	if (rows.field(0)==5)
	{
		l3.text = rows.fieldByName('name');
	}

	rows.next();
}
rows.close();
db.close(); // close db when you're done to save resources