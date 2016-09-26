@import 'api.js'

var onRun = function(context) {
	qordobaSDK.common.init(context);
	if (utils.getActiveTokenFromComputer(context) == false) {
		fireLoginWindowWithContext(context);
	} else {
		if(!validateSession(context)){
			fireLoginWindowWithContext(context);
		}else{
			fireAlreadyLoggedInWindow(context);
		}
	}
}