@import 'api.js'
@import 'helpers/utils.js'

var onRun = function(context) {
	qordobaSDK.common.init(context);
	fireUpdate(context,true);
}