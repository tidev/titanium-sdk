var db = Titanium.Database.open('mydb');
db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',5,'Name 5');
db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',6,'Name 6');
db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',7,'Name 7');
db.execute('INSERT INTO DATABASETEST (ID, NAME ) VALUES(?,?)',8,'Name 8');

Titanium.API.info('JUST INSERTED, rowsAffected = ' + db.rowsAffected);
Titanium.API.info('JUST INSERTED, lastInsertRowId = ' + db.lastInsertRowId);

var rows = db.execute('SELECT * FROM DATABASETEST');
Titanium.API.info('ROW COUNT = ' + rows.getRowCount());

while (rows.isValidRow())
{
	Titanium.API.info('ID: ' + rows.field(0) + ' NAME: ' + rows.fieldByName('name'));
	rows.next();
}
rows.close();


Ti.UI.currentWindow.addEventListener('click',function(e){Titanium.UI.currentWindow.close();});
