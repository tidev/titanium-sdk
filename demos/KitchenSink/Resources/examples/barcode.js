var win = Titanium.UI.currentWindow;

Titanium.Barcode.scan({
  success:function(data) {
    if(data && data.barcode) {
      var label = Titanium.UI.createLabel({
        text:'Barcode: ' + data.barcode,
        textAlign:'center',
        width:'auto'
      });

      win.add(label);
    } else {
      alert(JSON.stringify(data));
    }
  },

  error:function(err) { 
    alert("Error!! " + err); 
  },

  cancel:function() { 
    alert("cancel"); 
  }
});

