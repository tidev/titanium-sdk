function db2(_args) {
	var self = Titanium.UI.createWindow({
		title:_args.title,
		height:30,
		width:280,
		borderRadius:10,
		bottom:80,
		backgroundColor:'#333'
	});
		
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
	db.close();  // close db when you're done to save resources
	
	self.addEventListener('click',function(e){
		self.close();
	});
	
	self.addEventListener('open', function() {
		setTimeout(function() {
			self.close();
		},3000);
	});
	
	return self;
};

module.exports = db2;
