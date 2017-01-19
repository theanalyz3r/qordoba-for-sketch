@import 'api.js'

var onRun = function(context) {
	qordobaSDK.common.init(context);
	if (qordobaSDK.common.token == false) {
		fireLoginWindowWithContext(context);
	} else {
		fireAlreadyLoggedInWindow(context);
	}
}