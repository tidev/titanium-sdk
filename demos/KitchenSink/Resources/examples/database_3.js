var db = Titanium.Database.install('../testdb.db','quotes');

var rows = db.execute('SELECT * FROM TIPS');

while (rows.isValidRow())
{
	Titanium.API.info(rows.field(1) + '\n' + rows.field(0));
	rows.next();
}

// close database
rows.close();

Titanium.UI.currentWindow.close();