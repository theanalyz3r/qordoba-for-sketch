@import 'api_v2.js'

var onRun = function (context) {
 	
	if (utils.getActiveTokenFromComputer(context) == false) {
		sketchLog(context,"Fire login window");
		fireLoginWindowWithContext(context)
	} else {
		sketchLog(context,"Transalte Current Page.......");
		fireTranslateForm(0, context)
		//var doc = context.document
		//var currentPage = [doc currentPage]
		//translate.translatePageWithFilePicker(context,currentPage)
	}
}