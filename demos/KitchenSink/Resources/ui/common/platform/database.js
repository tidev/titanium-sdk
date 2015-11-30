function db(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var l = Titanium.UI.createLabel({
		text:'See Log for output',
		top:10,
		left:10,
		height:Ti.UI.SIZE,
		width:Ti.UI.SIZE
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
		var Win1 = require('ui/common/platform/database_2');
		var win1 = new Win1({title: 'DB in 2nd Context'});
		var l1 = Titanium.UI.createLabel({
			text:'2nd context test - see log.',
			color:'#fff',
			font:{fontSize:14},
			width:Ti.UI.SIZE,
			height:Ti.UI.SIZE
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
		var Win2 = require('ui/common/platform/database_3');
		var win2 = new Win2({title: 'Pre-packaged DB'});
		var l2= Titanium.UI.createLabel({
			text:'Pre-packaged Db - see log.',
			color:'#fff',
			font:{fontSize:14},
			width:Ti.UI.SIZE,
			height:Ti.UI.SIZE
		});
		win2.add(l2);
		win2.open();
		
	});
	var l3 = Titanium.UI.createLabel({
		text:'unicode placeholder',
		width:300,
		height:40,
		top:190
	});
	win.add(l3);
	if (Ti.Platform.osname !== 'android')
	{
		win.add(l3);
			var b3 = Titanium.UI.createButton({
			title:'Check DB FullPath',
			width:200,
			height:40,
			top:150
		});
		b3.addEventListener('click', function()
		{
			var path = db.file;
			alert("mysql.db fullpath : \n \nType :" + path +"\n\nFullPath: "+path.nativePath);	
		});
		win.add(b3);
	}
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
	
	return win;
};

module.exports = db;	
