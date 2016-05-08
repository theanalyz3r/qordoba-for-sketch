@import "utils.js"
@import "files.js"
@import "framework-utils/MochaJSDelegate.js"

var rootAppUrl = "https://app.qordoba.com/api/"

function loginWithUsernameAndPassword(email, password, context){
	getTokenFromServer(email,password, context)
}

/**
 *
 * Get the organization list of projects with target langueas for each one
 *
**/
function getProjectsArray(organizationId,context) {
	var token = utils.getActiveTokenFromComputer(context)
	
	var url = [NSURL URLWithString:rootAppUrl + "organizations/"+organizationId+"/projects/by_type/7"];
	//log("url is: " + url)
	//log("token is: " + token)
	//var url = [NSURL URLWithString:rootAppUrl + "organizations/"+organizationId+"/projects"];
	var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
	[request setHTTPMethod:"GET"]
	[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
	[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]
	
	var response = nil;
	var error = nil;
	sketchLog(context,"NSURLConnection getProjectsArray()")
	var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
	
	if (error == nil && data != nil)
	{	    
	    var errorJson;
		var res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:errorJson]
		  if(res == nil || res.projects == nil || res.errMessage !=nil){
		  		utils.deleteActiveTokenFromComputer(context)
		  		fireError("Your token is not valid anymore, please login again.","After you are logged in again please try again.")
		  		return false
		  } else {
			  if(res.count() > 0){
			   	var projects = [];
			   	log(res.projects)
			   	for (var i = 0; i < res.projects.count(); i++) {
			   		var project = res.projects[i]
			   			projects.push({
			   				name: project.id+ " - " + project.name, 
			   				id: project.id,
			   				targetLanguages: project.target_languages
			   			})
			   	}
				utils.saveOrganizationProjects(organizationId,projects)
			   	return projects;
			   } else {
			   	var projects = [];
			   	utils.saveOrganizationProjects(organizationId,projects)
			   	return projects;
			  }
		}
	} else {
			dealWithErrors(context,data)
	}
	return false;		
}


/**
 *
 * Get the organization list of projects with target languages for each one
 *
**/
function getLanguagesArray(context) {
	var langs = utils.getLanguages(context)
	if(langs){
		return langs;
	}
	var token = utils.getActiveTokenFromComputer(context)
	var url = [NSURL URLWithString:rootAppUrl + "languages"];
	var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
	[request setHTTPMethod:"GET"]
	[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
	[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]
	
	var response = nil;
	var error = nil;
	var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
	
	if (error == nil && data != nil)
	{	    
	    var errorJson;
		var res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:errorJson]
		  if(res == nil || res.languages == nil || res.errMessage !=nil){
		  		utils.deleteActiveTokenFromComputer(context)
		  		fireError("Your token is not valid anymore, please login again.","After you are logged in again please try again.")
		  		return false
		  } else {
			  if(res.count() > 0){
			   	var languages = [];
			   	for (var i = 0; i < res.languages.count(); i++) {
			   		var language = res.languages[i]
			   		languages.push({
			   				id: language.id,
							name: language.name, 
			   				code: language.code,
			   				direction: language.direction
			   		})
			   	}
				utils.saveLanguages(context,languages)
			   	return languages;
			   } else {
			   	var languages = [];
			   	utils.saveLanguages(context,languages)
			   	return languages;
			  }
		}
	} else {
			dealWithErrors(context,data)
	}
	return false;		
}

/**
 *
 * Get the Access token from server using email and password
 *
**/

function getTokenFromServer(email,password, context){
		var doc = context.document
		sketchLog(context,"getTokenFromServer()")
		var url = [NSURL URLWithString:rootAppUrl + "login"];
		var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
		[request setHTTPMethod:"PUT"]
		[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
		var remember = true;
		var tmp = [[NSDictionary alloc] initWithObjectsAndKeys:
		                     email, @"username",
		                     password, @"password",
		                     remember, @"remember",
		                     nil];
		
		var error = nil;                     
		var postData = [NSJSONSerialization dataWithJSONObject:tmp options:NSUTF8StringEncoding error:error];

		[request setHTTPBody:postData];
			
		var response = nil;
		var error = nil;
		var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];    
		if (error == nil && data != nil){	
				var res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:nil]
				if(res == nil || res.errMessage != nil){
					dealWithErrors(context,data)
				}else{
				  	var token = res.token
				  	var userName = res.loggedUser.name
				  	var userID = res.loggedUser.id
				  	var userEmail = res.loggedUser.email
				  	var organizations = res.loggedUser.organizations
				  	//Show Welcome Messages		
				  	[doc showMessage: "Welcome " + userName + "!!"]		
				  	if(token){
				  			sketchLog(context,"Token exists and gets returned") 
				  			
				  			utils.saveActiveTokenToComputer(context,token,userID,userName,userEmail)
				  			utils.saveUserOrganizations(context,organizations)
				  			fireError("Success!", "Welcome " + userName+ ". Let's get some artboards localized.")
				  			//fireConfiguration(context)	
						} else {
								dealWithErrors(context,data)
						}
				}
			    	
			} else {
				dealWithErrors(context,data)
			}
		
			return false;	
}

/**
 *
 * Get organization API Access Key from server using the organization id and access token 
 *
**/
function getApiKeyFromServer(organizationId,context) {
		//check if the org already has a local key
		var oldAPIKey = utils.getActiveApiKeyFromComputer(organizationId,context)
		if(oldAPIKey){
			return true;
		}

		var doc = context.document
		var token = utils.getActiveTokenFromComputer(context)

		sketchLog(context,"getApiKeyFromServer()")
		var url = [NSURL URLWithString:rootAppUrl + "organizations/"+organizationId];
    
        var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
		[request setHTTPMethod:"GET"]
		[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
		[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]

		var error = nil;                     
		var response = nil;
		sketchLog(context,"Fetch api key")
		var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
	
        if (error == nil && data != nil){	
				var res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:nil]
				if(res == nil || res.errMessage != nil){
					dealWithErrors(context,data)
				}else{
				  	var apiKey = res.data.api_key_value
				  	if(apiKey){
							utils.saveActiveApiKeyFromComputer(organizationId,apiKey,context)
						} else {
							//dealWithErrors(context,data)
						}
				}
			} else {
				//dealWithErrors(context,data)
			}
			return false;	
}


/**
 *
 * upload original file to the server 
 *
**/
function postFile(context, path, organizationId, projectId, filename,version) {
		var token = utils.getActiveTokenFromComputer(organizationId,context)
		if(!token) {
			utils.fireError("Invalid Token", "Please make sure you have a valid login and API access.")
			return false;
		}
		var doc = context.document
		var dataImg = [[NSFileManager defaultManager] contentsAtPath:path];
		var postLength = [dataImg length].toString()
		var task = NSTask.alloc().init()
		task.setLaunchPath("/usr/bin/curl");
		var args = NSArray.arrayWithObjects("-v", "POST", "--header", "Content-Type: multipart/form-data", "--header", "X-AUTH-TOKEN: " + token, "--header", "user_key: " + token,"-F",'file_names=[{"upload_id":"","file_name":"'+filename+'"}]', "-F", "Content-Disposition: form-data; name=file; filename=" + filename + "; Content-Type=image/png;", "-F", "file=@" + path, rootAppUrl+"projects/"+projectId+"/user_upload_files?smart-suggest=true&update=true", nil);
		log(args)
		task.setArguments(args);
		var outputPipe = [NSPipe pipe];
		[task setStandardOutput:outputPipe];
		task.launch();
		var outputData = [[outputPipe fileHandleForReading] readDataToEndOfFile];
		var classNameOfOuput = NSStringFromClass([outputData class]);
		if(classNameOfOuput != "_NSZeroData"){
			var errorJson;
			var res = [NSJSONSerialization JSONObjectWithData:outputData options:NSJSONReadingMutableLeaves error:errorJson]
			 if(errorJson == nil && res != null){
			 	if(res.file_ids != nil){
			 		var fileId = res.file_ids[0]
			 		return {fileId: fileId, version: (version + 1)}
			 	} else if(res.errMessage != nil){
			 		log("Error Message: " + res.errMessage)
			 		if(res.errMessage.indexOf("Please upload a different file") > -1){
			 			var newVersion = version + 1
			 			if(fileHelper.copyFile(path,path + " -ver " + newVersion)){
			 				return postFile(context, path +" -ver " + newVersion, organizationId, projectId,filename +" -ver " + newVersion,newVersion)	
			 			}
			 		}else {
			 			utils.fireError("Error!",res.errMessage)
			 			return false;
			 		}
			 		
			 	}
			} else {
				sketchLog(context, "JSON convert failed")
			}
		} else {
			sketchLog(context, "Empty output")
		}
	return false;
}

/**
 *
 * download translated file from the server, json files only
 *
**/
function downloadFileNSUrlConnection(context, organizationId, projectId, languageId, fileId) {
	var token = utils.getActiveTokenFromComputer(context)
	var url = [NSURL URLWithString:rootAppUrl + "projects/" + projectId + "/languages/"+ languageId + "/files/" + fileId];
	NSLog("token is: " + token)
	var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
	[request setHTTPMethod:"GET"]
	[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
	[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]
	[request setValue:token forHTTPHeaderField:"user_key"]

	var tempPostData = [NSMutableData data]; 
	var response = nil;
	var error = nil;
	var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
	if (error == nil && data != nil)
	{	
		theResponseText = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
		//sketchLog(context, "CSV Response is: ")
		//sketchLog(context, theResponseText)
		jsonObject = fileHelper.csvToJson(theResponseText)
		return jsonObject;
	} else {
		dealWithErrors(context,data)
	}
	return false;
}


function downloadFileNSUrlConnectionAsync(context, organizationId, projectId, languageId, fileId, downloadCallback) {
	var token = utils.getActiveTokenFromComputer(context)
	var url = [NSURL URLWithString:rootAppUrl + "projects/" + projectId + "/languages/"+ languageId + "/files/" + fileId];
	NSLog("token is: " + token)
	var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
	[request setHTTPMethod:"GET"]
	[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
	[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]
	[request setValue:token forHTTPHeaderField:"user_key"]

	COScript.currentCOScript().setShouldKeepAround_(true);
	var delegate = new MochaJSDelegate(null);

	// delegate.setHandlerForSelector("connectionDidFinishLoading:", function(connection){
	// });

	// delegate.setHandlerForSelector("connection:didReceiveResponse:", function(connection, response){
	// });

	delegate.setHandlerForSelector("connection:didReceiveData:", function(connection, data) {
		theResponseText = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
		jsonObject = fileHelper.csvToJson(theResponseText)
		downloadCallback(jsonObject)
	});

	delegate.setHandlerForSelector("connection:didFailWithError:", function(connection, error){
		downloadCallback(error)
	});

	var conne = [NSURLConnection connectionWithRequest:request delegate:delegate.getClassInstance()];
	[conne start];
}


/**
 *
 * Get User Status 
 *
**/
function getUserStatus(context) {
		var doc = context.document
		var token = utils.getActiveTokenFromComputer(context)

		sketchLog(context,"getUserStatus()")
		var url = [NSURL URLWithString:rootAppUrl + "user/status"];
    
        var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
		[request setHTTPMethod:"GET"]
		[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
		[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]

		var error = nil;                     
		var response = nil;
		var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
	
        if (error == nil && data != nil){	
				var res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:nil]
				if(res == nil || res.errMessage != nil){
					//dealWithErrors(context,data)
					return "free";
				}else{
				  	var userStatus = res.user_status
				  	if(userStatus){
							userStatus;
						} else {
							"free";
						}
				}
		}
		return "free";	
}
