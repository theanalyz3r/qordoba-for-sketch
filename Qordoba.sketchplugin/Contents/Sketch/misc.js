//@import 'api.js'
@import "framework-utils/MochaJSDelegate.js"
@import 'helpers/qordoba-editor.js'
@import 'api.js'


var onRun = function (context) {
	qordobaSDK.common.init(context);
	excludeSymbols(context)
};

function specExport(context) {
	var result = qordobaSDK.editor.init(context).specExport();
	log("finish and the result is: ");
	log(result);
}

var onMaxWidth = function(context){
	qordobaSDK.common.init(context);
	qutils.translate.setSelectionMaxWidth(context);
};
