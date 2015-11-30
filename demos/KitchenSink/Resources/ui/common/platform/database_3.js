function db3(_args) {
	var self = Titanium.UI.createWindow({
		title:_args.title,
		height:30,
		width:280,
		borderRadius:10,
		bottom:140,
		backgroundColor:'#333'
	});
		
	var db = Titanium.Database.install('/etc/testdb.db','quotes');
	
	var rows = db.execute('SELECT * FROM TIPS');
	db.execute('UPDATE TIPS SET TITLE="UPDATED TITLE" WHERE TITLE = "FOO"');
	db.execute('INSERT INTO TIPS VALUES("FOO", "BAR")');
	
	//db.execute("COMMIT");
	while (rows.isValidRow())
	{
		Titanium.API.info(rows.field(1) + '\n' + rows.field(0) + ' col 1 ' + rows.fieldName(0) + ' col 2 ' + rows.fieldName(1));
		rows.next();
	}
	
	// close database
	rows.close();
	
	self.addEventListener('click',function(e){self.close();});
	self.addEventListener('open', function() {
		setTimeout(function() {
			self.close();
		},3000);
	});
	
	return self;
};

module.exports = db3;
