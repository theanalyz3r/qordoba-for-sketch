var QForms = {
	"configForm": function(context){

	},
	"createDialog": function(context,title,message){
		var alert = COSAlertWindow.new();
		var pluginPath = context.scriptPath.substring(0, context.scriptPath.lastIndexOf('/'));
		//var icon = NSImage.alloc().initByReferencingFile(pluginPath + '/Resources/logo.icns');
		//alert.setIcon(icon);
		//alert setIcon:icon
		alert.setMessageText(title);
		alert.setInformativeText(message);
		// Name
		//this.createTextFieldWithDefaultValue(context,alert,"Name:","");
		// Interator
		//this.createTextFieldWithDefaultValue(context,alert,"Starts Number Sequence From:","1");
		var types = ['calm', 'gray', 'crazy'];
  		var typeSelect = this.createSelect(context,alert,"Arabic: ", types, 0);
		// Actions buttons.

		alert.addButtonWithTitle('Save');
		alert.addButtonWithTitle('Cancel');

		return alert;
	},
	"handleAlertResponse": function(context,alert,responseCode){
		if (responseCode == "1000") {
					function valAtIndex (view, index) {
							return parseInt(view.viewAtIndex(index).stringValue());
					}

					return {
							basename: alert.viewAtIndex(1).stringValue(),
							startsFrom: valAtIndex(alert,3)
					}
			}
			return null;
	},
	"createTextFieldWithDefaultValue": function(context,alert,label,defaultValue){
		alert.addTextLabelWithValue(label);
		alert.addTextFieldWithValue(defaultValue);
		return alert;
	},
	"createSelect": function(context,alert,title,items, selectedItemIndex) {
		  selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0);
		  var comboBox = NSComboBox.alloc().initWithFrame(NSMakeRect(0, 0, 150, 25));
		  comboBox.addItemsWithObjectValues(items);
		  comboBox.selectItemAtIndex(selectedItemIndex);
		  alert.addTextLabelWithValue(title);
		  alert.addAccessoryView(comboBox);
		  return comboBox;
	}
}