@import 'api.js'

var onRun = function (context) {
	if(utils.checkLastVersionChecked(context) == true){
		fireUpdate(context,false);
 	}

 	if (utils.getActiveTokenFromComputer(context) == false) {
		sketchLog(context,"Fire login window");
		fireLoginWindowWithContext(context)
	} else {
		sketchLog(context,"Get project names array");
		fireSendArtboards(1, context)
	}
}