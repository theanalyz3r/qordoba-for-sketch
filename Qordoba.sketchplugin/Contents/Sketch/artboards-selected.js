@import 'api.js'

var onRun = function (context) {
 	
	if (utils.getActiveTokenFromComputer(context) == false) {

		sketchLog(context,"Fire login window");
		fireLoginWindowWithContext(context)
	} else {
		sketchLog(context,"Get project names array");
		fireSendArtboards(0, context)
	}
}