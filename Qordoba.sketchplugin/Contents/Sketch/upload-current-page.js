@import 'api_v2.js'

var onRun = function (context) {
 	
	if (utils.getActiveTokenFromComputer(context) == false) {
		fireLoginWindowWithContext(context)
	} else {
		fireUploadForm(0, context)
	}
}