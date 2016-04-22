@import 'api.js'

var onRun = function(context) {
	if (utils.getActiveTokenFromComputer(context) == false) {
		fireLoginWindowWithContext(context)
	} else {
		fireAlreadyLoggedInWindow(context)
	}
}