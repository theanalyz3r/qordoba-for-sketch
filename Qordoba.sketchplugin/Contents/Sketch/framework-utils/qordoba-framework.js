@import "framework-utils/SketchLibrary.js"
@import "framework-utils/sketch-nibui.js"
@import "framework-utils/MochaJSDelegate.js"

var gFrameworkName = "Sketch"
var gFrameworkBundleID = "com.qordoba.Sketch";

function loadCoreFramework(context, frameworkName) {
	sketchLog(context, "Starting to load core framework: " + frameworkName);
	var frameworkLoadResult = $.runtime.loadFramework(frameworkName, $.paths.resourcesPath);
	sketchLog(context, frameworkName + " loaded with status: " + (frameworkLoadResult == 1 ? "success" : "failure"));
	return frameworkLoadResult;
}

function loadFrameworkBundle(context, frameworkBundleID) {
	var frameworkBundle = [NSBundle bundleWithIdentifier:frameworkBundleID];
	sketchLog(context, "Framework bundle loaded: " + frameworkBundle);
	return frameworkBundle;
}

function LoadNibFromFramework(context, nibName, bindViewNames) {
	// First load framewokr bundle
	var frameworkBundle = loadFrameworkBundle(context, gFrameworkBundleID);
	// Load nib UI from loaded framework bundle
	return QordobaNibUI(frameworkBundle, nibName, bindViewNames)
}