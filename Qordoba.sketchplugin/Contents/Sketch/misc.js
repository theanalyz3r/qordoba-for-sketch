@import 'api_v2.js'
@import "helpers/editor.js"

var onRun = function (context) {
	excludeSymbols(context)
};

function specExport(context) {
    editor.utom.init(context);
    editor.utom.specExport();
}

var onMaxWidth = function(context){
	qutils.translate.setSelectionMaxWidth(context);
};