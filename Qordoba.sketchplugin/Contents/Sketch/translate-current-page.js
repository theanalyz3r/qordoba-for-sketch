@import 'api.js'

var onRun = function (context) {
	qordobaSDK.common.init(context);
 	if(utils.checkLastVersionChecked(context) == true){
		fireUpdate(context,false);
 	}
 	
 	if (utils.getActiveTokenFromComputer(context) == false) {
		fireLoginWindowWithContext(context)
	} else {
		fireTranslateForm(0, context)
	}
}