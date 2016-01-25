@import 'api.js'

var updatesChecker = {

	"getNewestVersionNumber": function(context){
       
       	sketchLog(context,"updatesChecker.getNewestVersionNumber()")
       	       	
       	var url = [NSURL URLWithString:"https://raw.githubusercontent.com/qordobaapp/qordoba-sketch/master/qordoba.sketchplugin/Contents/Sketch/manifest.json"];

       	var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:30]
       	[request setHTTPMethod:"GET"]
       	
       	var response = nil;
       	var error = nil;
       	sketchLog(context,"NSURLConnection updatesChecker.getNewestVersionNumber()")
       	var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
       	
       	if (error == nil && data != nil)
       	{	    
       	  var errorJson;
       	    		
       		var res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:errorJson]
       		
       		if(errorJson == nil){
            if(res.version){
       			  return res.version
            }
       		} else {
       			sketchLog(context,"NSURLConnection updatesChecker.getNewestVersionNumber() Convert to JSON failed")
       			return false
       		}

       	} 

       	sketchLog(context,"updatesChecker.getNewestVersionNumber() failed")
        [app displayDialog:"Try again later..." withTitle:"Could not contact GitHub properly."]
       	return false

    }

       
}

var onRun = function(context) {
	
	var newestVersion = updatesChecker.getNewestVersionNumber(context)
	var pluginVersion = manifest.getPluginVersion(context)

  if (newestVersion != pluginVersion) {
    [app displayDialog:"Sketch " + newestVersion + " is currently the newest version available." withTitle:"You’re up-to-date!"]
  } else {
    var alert = [[NSAlert alloc] init]
    [alert setMessageText:"A new version of qordoba Sketch is available."]
    [alert setInformativeText:"Download the new plugin on GitHub"]
    [alert addButtonWithTitle:'Close']
    [alert addButtonWithTitle:'Download our update']
  }  

  var responseCode = [alert runModal]
  if(responseCode == "1001"){
      var url = [NSURL URLWithString:@"https://github.com/qordobaapp/qordoba-sketch"];
      if( ![[NSWorkspace sharedWorkspace] openURL:url] ){
          sketchLog(context,"Failed to open url:" + [url description])
      } 
  }


}