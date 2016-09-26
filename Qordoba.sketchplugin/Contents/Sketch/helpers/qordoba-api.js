@import "utils.js"
@import "files.js"
@import "framework-utils/MochaJSDelegate.js"

var rootAppUrl = "https://app.qordoba.com/api/"

function loginWithUsernameAndPassword(email, password, context){
	return getTokenFromServer(email,password, context)
}

/**
 *
 * Get the organization list of projects with target langueas for each one
 *
**/
function getProjectsArray(organizationId,context) {
	var token = utils.getActiveTokenFromComputer(context)
	
	var url = [NSURL URLWithString:rootAppUrl + "organizations/"+organizationId+"/projects/by_type/7"];
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
			   	for (var i = 0; i < res.projects.count(); i++) {
			   		var project = res.projects[i]
			   			projects.push({
			   				name: project.id+ " - " + project.name, 
			   				id: project.id,
			   				targetLanguages: project.target_languages
			   			})
			   	}
				utils.saveOrganizationProjects(organizationId,projects)
				log(projects)
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
	sketchLog(context,"qordoba-api.getTokenFromServer()")
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
		if(res == nil){
			dealWithErrors(context,data)
			return false;
		} else if(res.errMessage != nil){
			fireError("Error!", res.errMessage)
			return false;
		} else{
		  	var token = res.token
		  	var userName = res.loggedUser.name
		  	var userID = res.loggedUser.id
		  	var userEmail = res.loggedUser.email
		  	var organizations = res.loggedUser.organizations
		  	//Show Welcome Messages		
		  	if(token){
	  			utils.saveActiveTokenToComputer(context,token,userID,userName,userEmail)
	  			utils.saveUserOrganizations(context,organizations)
	  			fireError("Success!", "Welcome " + userName+ ". Let's get some artboards localized.")
	  			return true;
			} else if(res.errMessage){
				fireError("Error!", res.errMessage)
				return false;
			}else {
				dealWithErrors(context,data)
				return false;
			}
		}
	} else {
		dealWithErrors(context,data)
		return false;
	}
	return false;	
}

/**
 *
 * upload original file to the server 
 *
**/
function postFile(context, path, organizationId, projectId, filename) {
	var token = utils.getActiveTokenFromComputer(organizationId,context)
	if(!token) {
		utils.fireError("Invalid Token", "Please make sure you have a valid login and API access.")
		return false;
	}
	var doc = context.document
	var task = NSTask.alloc().init()
	task.setLaunchPath("/usr/bin/curl");
	var args = NSArray.arrayWithObjects("-v",
	 "POST", 
	 "--header", "Content-Type: multipart/form-data", 
	 "--header", "X-AUTH-TOKEN: " + token, 
	 "--header", "user_key: " + token,
	 	"-F",'file_names=[{"upload_id":"","file_name":"'+filename+'"}]',
	 	"-F", "Content-Disposition: form-data; name=file; filename=" + filename + "; Content-Type=image/png;",
	 	"-F", "file=@" + path, 
	 	rootAppUrl+"projects/"+projectId+"/user_upload_files?smart-suggest=true&update=true", nil);
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
		 		return {fileId: fileId}
		 	} else if(res.errMessage != nil){
		 		log("Error Message: " + res.errMessage)
		 		utils.fireError("Error!",res.errMessage)
		 		return false;
		 	}
		} else {
			sketchLog(context, "JSON convert failed")
		}
		return false;
	} else {
		sketchLog(context, "Empty output")
		return false;
	}
}


/**
 *
 * upload original file to the server 
 *
**/
function postReference(context, screenshotPath, geometryPath, organizationId, projectId, fileId, filename) {
	var token = utils.getActiveTokenFromComputer(organizationId,context)
	if(!token) {
		utils.fireError("Invalid Token", "Please make sure you have a valid login and API access.")
		return false;
	}
	var doc = context.document
	var task = NSTask.alloc().init()
	task.setLaunchPath("/usr/bin/curl");
	var args = NSArray.arrayWithObjects("-v", 
		"POST", 
		"--header", "Content-Type: multipart/form-data", 
		"--header", "X-AUTH-TOKEN: " + token, 
		"--header", "user_key: " + token,
			"-F",'file_names=[{"upload_id":"","file_name":"'+filename+'"}]', 
			"-F", "Content-Disposition: form-data; name=screenshot; filename=" + filename + "; Content-Type=image/png;", 
			"-F", "screenshot=@" + screenshotPath, 
			"-F", "Content-Disposition: form-data; name=geometry; filename=" + filename + "; Content-Type=text/html;", 
			"-F", "geometry=@" + geometryPath, 
			rootAppUrl+"projects/"+projectId+"/pages/"+fileId+"/reference", nil);
	log('upload reference file')
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
		log(res)
		 if(errorJson == nil && res != null){
		 	/*if(res.file_ids != nil){
		 		var fileId = res.file_ids[0]
		 		return {fileId: fileId}
		 	} else if(res.errMessage != nil){
		 		log("Error Message: " + res.errMessage)
		 		utils.fireError("Error!",res.errMessage)
		 		return false;
		 	}
		 	*/
		 	return true;
		} else {
			sketchLog(context, "JSON convert failed")
		}
		return false;
	} else {
		sketchLog(context, "Empty output")
		return false;
	}
}
/**
 *
 * download translated file from the server, json files only
 *
**/
function downloadFileNSUrlConnection(context, organizationId, projectId, languageId, fileId) {
	var token = utils.getActiveTokenFromComputer(context)
	var url = [NSURL URLWithString:rootAppUrl + "projects/" + projectId + "/languages/"+ languageId + "/files/" + fileId];
	var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
	[request setHTTPMethod:"GET"]
	[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
	[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]

	var tempPostData = [NSMutableData data]; 
	var response = nil;
	var error = nil;
	var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
	if (error == nil && data != nil)
	{	
		theResponseText = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
		jsonObject = fileHelper.csvToJson(theResponseText)
		return jsonObject;
	} else {
		dealWithErrors(context,data)
	}
	return false;
}

/**
 *
 * download translated file from the server, json files only
 *
**/
function downloadFileByName(context, organizationId, projectId, languageId, file_name) {
	var token = utils.getActiveTokenFromComputer(context)
	var url = [NSURL URLWithString:rootAppUrl + "projects/" + projectId + "/languages/"+ languageId +"/download_file" ];
	var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
	[request setHTTPMethod:"POST"]
	[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
	[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]

	var tmp = [[NSDictionary alloc] initWithObjectsAndKeys:
	                     file_name, @"file_name",
	                     nil];
		var postData = [NSJSONSerialization dataWithJSONObject:tmp options:NSUTF8StringEncoding error:error];
	[request setHTTPBody:postData];
	
	var tempPostData = [NSMutableData data]; 
	var response = nil;
	var error = nil;
	var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
	if (error == nil && data != nil)
	{
		var res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:nil]
		if(res!=nil && res.errMessage != nil){
			fireError("Error!", res.errMessage)
			return false;
		}
		theResponseText = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
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
	var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
	[request setHTTPMethod:"GET"]
	[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
	[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]
	[request setValue:token forHTTPHeaderField:"user_key"]

	COScript.currentCOScript().setShouldKeepAround_(true);
	var delegate = new MochaJSDelegate(null);
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



/**
 *
 * Get User Status 
 *
**/
function validateSession(context) {
		var token = utils.getActiveTokenFromComputer(context)
		var url = [NSURL URLWithString:rootAppUrl + "session"];
        var request=[NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60]
		[request setHTTPMethod:"GET"]
		[request setValue:"application/json" forHTTPHeaderField:"Content-Type"]
		[request setValue:token forHTTPHeaderField:"X-AUTH-TOKEN"]

		var error = nil;                     
		var response = nil;
		var data = [NSURLConnection sendSynchronousRequest:request returningResponse:response error:error];
        if (error == nil && data != nil){	
				var res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:nil]
				return true;
				if(res == nil || res.errMessage != nil){
					return false;
				}else if(res.token){
				  	return true;
				} else {
					return false;
				}
		}
		return false;	
}



