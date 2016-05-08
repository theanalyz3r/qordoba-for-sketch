// Needs to be loaded first!
@import 'framework-utils/qordoba-framework.js'
@import 'helpers/error-logging.js'
@import 'helpers/files.js'
@import 'helpers/utils.js'
@import 'helpers/manifest.js'
@import 'helpers/translate.js'
@import 'helpers/utils.js'
@import 'helpers/qordoba-api.js'
@import 'helpers/controller.js'
@import 'api.js'

/**
 *
 * Show Config window to sepicfy the organization id, project id and language id
 *
**/
function fireTranslateForm(all,context){
	var doc = context.document
	sketchLog(context,"fireTranslateForm()");

	var currentPage = [doc currentPage]
	var pageName = [currentPage name];
	var windowTitle = "Downloading Page '"+pageName+"'"
	if(all){
		translate.excludeAllTextLayers(context)
	}else{
		//windowTitle = texts.fetchCurrentWindowTitle
		var currentPage = [doc currentPage]
		// translate.excludeTextLayersFromSymbol(context,currentPage)
		if(utils.isGeneratedPage(currentPage,context)){
			fireError("Warning!", "This Page is the translated version. To fetch an updated version of the translation, please pull from the original Page.")
			return ;
		}
	}


	var width = 463;
	var height = 365;

	var windowSendArtboards = [[NSWindow alloc] init]
	[windowSendArtboards setFrame:NSMakeRect(0, 0, width, height) display:true]
	[windowSendArtboards setBackgroundColor:NSColor.whiteColor()]
	windowSendArtboards.movableByWindowBackground  = true
	[windowSendArtboards setStyleMask:NSBorderlessWindowMask];
	// Load UI from framework
	loadCoreFramework(context, gFrameworkName);
	COScript.currentCOScript().setShouldKeepAround_(true);
	var nibUI = LoadNibFromFramework(context, 'DownloadView', ['organizationDropdown', 'projectDropdown','languageDropdown', 'cancelButton', 'downloadButton','goProButton','titleLabel']);

	[[windowSendArtboards contentView] addSubview:nibUI.view];

	// Organization
	var organizations  = utils.getOrganizations()
	var organizationsCount = [organizations count]
	var organization = utils.getOrganization()
	if(!organization){
		organization = [organizations objectAtIndex:0]
	}
	var noOrganizations = (organizationsCount == 0)
	var organizationIndex = 0
	var organizationNames = []
	for (i = 0; i < organizationsCount; ++i) {
			organizationNames.push(organizations[i].name);
			if(organization.id == organizations[i].id){
				organizationIndex = i;
			}
	}

	var titleLabel = nibUI.titleLabel;
	titleLabel.stringValue = windowTitle;

	var goProButton = nibUI.goProButton;	
	var userStatus = getUserStatus(context);
	sketchLog(context,"userStatus:" + userStatus)
	if(userStatus != "free"){
		goProButton.setHidden(true);
	}
	
	nibUI.attachTargetAndAction(goProButton, function() {		
		var url = [NSURL URLWithString:@"https://www.qordoba.com/sketch-professional"];
	    if( ![[NSWorkspace sharedWorkspace] openURL:url] ){
	        sketchLog(context,"Failed to open url:" + [url description])
	    }   
	});
	

	//var progressBar = false;//nibUI.progressBar;

	
	var orgDropdown = nibUI.organizationDropdown;
	  [orgDropdown addItemsWithTitles:organizationNames]
	  [orgDropdown selectItemAtIndex:organizationIndex]
	  //var obj = this
	  [orgDropdown setCOSJSTargetFunction:function(sender) {
	    var organizationIndex = [sender indexOfSelectedItem]
	    var organization = organizations[organizationIndex]
	    var projects = getProjectsArray(organization.id,context)
		var projectNames = []
		for (i = 0; i < projects.length; ++i) {
			projectNames.push(projects[i].name);
		}
		projectIndex = 0
		[projectDropdown removeAllItems]
		[projectDropdown addItemsWithTitles:projectNames]
	    [projectDropdown selectItemAtIndex:projectIndex]

	    [languageDropdown removeAllItems]
	  }]]


	//project

	var projects = getProjectsArray(organization.id,context)
	var projectsCount = projects.length
	var project = utils.getProject()
	if(!project){
		project = projects[0]
	}
	
	var noProjects = (projectsCount == 0)
	var projectIndex = 0
	var projectNames = []
	for (i = 0; i < projectsCount; ++i) {
			projectNames.push(projects[i].name);
			if(project.id == projects[i].id){
				projectIndex = i;
				project = projects[i];
			}
	}
	
	var projectDropdown = nibUI.projectDropdown;
	  [projectDropdown addItemsWithTitles:projectNames]
	  [projectDropdown selectItemAtIndex:projectIndex]
	  [projectDropdown setCOSJSTargetFunction:function(sender) {
	   	projectIndex = [sender indexOfSelectedItem]
	   	project = projects[projectIndex]
	    [languageDropdown removeAllItems]
	    languages = project.targetLanguages
	    languageNames = utils.getNames(languages)
	    [languageDropdown addItemsWithTitles:languageNames]
	    [languageDropdown selectItemAtIndex:0]
	  }]]
	//[[windowSendArtboards contentView] addSubview:projectDropdown]

	///Language
	var languages = project.targetLanguages	
	var languagesCount = [languages count]
	var language = utils.getTargetLanguage()
	if(!language){
		language = languages[0]
	}
	var languageIndex = 0
	var languageNames = []
	for (i = 0; i < languagesCount; ++i) {
			languageNames.push(languages[i].name);
			if(language.id == languages[i].id){
				languageIndex = i;
			}
	}

	var languageDropdown = nibUI.languageDropdown;
	  [languageDropdown addItemsWithTitles:languageNames]
	  [languageDropdown selectItemAtIndex:languageIndex]
	//[[windowSendArtboards contentView] addSubview:languageDropdown]
	
	
	var sendButton = nibUI.downloadButton
	var cancelButton = nibUI.cancelButton
	
	
	nibUI.attachTargetAndAction(sendButton, function() {
		languageIndex = [languageDropdown indexOfSelectedItem]
		language = languages[languageIndex]
	   	
		utils.saveTargetLanguage(language)
		utils.saveProject(project)
		utils.saveOrganization(organization)
		getApiKeyFromServer(organization.id,context)
		//Translate
		controller.translatePages(all,organization,project,language, context)

		[cancelButton setCOSJSTargetFunction:undefined]
		[sendButton setCOSJSTargetFunction:undefined]
		[languageDropdown setCOSJSTargetFunction:undefined]
		[orgDropdown setCOSJSTargetFunction:undefined]
		[projectDropdown setCOSJSTargetFunction:undefined]
		[windowSendArtboards orderOut:nil]
		[app stopModal]	
	});

	nibUI.attachTargetAndAction(cancelButton, function() {		
		[cancelButton setCOSJSTargetFunction:undefined]
	    [sendButton setCOSJSTargetFunction:undefined]
	    [languageDropdown setCOSJSTargetFunction:undefined]
	    [orgDropdown setCOSJSTargetFunction:undefined]
	    [projectDropdown setCOSJSTargetFunction:undefined]
	    [windowSendArtboards orderOut:nil]
	    [app stopModal]
	});
	
	
	[windowSendArtboards setDefaultButtonCell:[sendButton cell]];
	[app runModalForWindow:windowSendArtboards]
}

/*
 *
 *
 *
**/
function fireUploadForm(all, context){
	var doc = context.document
	sketchLog(context,"fireUploadForm()");
	
	var currentPage = [doc currentPage]
	var pageName = [currentPage name];
	var windowTitle = "Upload Page '"+pageName+"' to Qordoba"
	// Organization
	var organizations  = utils.getOrganizations()
	var organizationsCount = [organizations count]
	var organization = utils.getOrganization()
	if(!organization){
		organization = [organizations objectAtIndex:0]
	}
	var noOrganizations = (organizationsCount == 0)
	var organizationIndex = 0
	var organizationNames = []
	for (i = 0; i < organizationsCount; ++i) {
			organizationNames.push(organizations[i].name);
			if(organization.id == organizations[i].id){
				organizationIndex = i;
			}
	}

	//project
	var projects = getProjectsArray(organization.id,context)
	var projectsCount = projects.length
	var noProjects = (projectsCount == 0)
	var project = false
	if(!noProjects){
		var project = utils.getProject()
		if(!project){
			project = projects[0]
		}
	}
	var projectIndex = 0
	var projectNames = []
	for (i = 0; i < projectsCount; ++i) {
			projectNames.push(projects[i].name);
			if(project.id == projects[i].id){
				projectIndex = i;
			}
	}

	var width = 468;
	var height = 303;

	var windowSendArtboards = [[NSWindow alloc] init]
	[windowSendArtboards setFrame:NSMakeRect(0, 0, width, height) display:true]
	[windowSendArtboards setBackgroundColor:NSColor.whiteColor()]
	windowSendArtboards.movableByWindowBackground  = true
	[windowSendArtboards setStyleMask:NSBorderlessWindowMask];

	// Load UI from framework
	loadCoreFramework(context, gFrameworkName);
	COScript.currentCOScript().setShouldKeepAround_(true);
	var nibUI = LoadNibFromFramework(context, 'UploadView', ['organizationDropdown', 'projectDropdown', 'cancelButton', 'uploadButton','goProButton','titleLabel']);


	[[windowSendArtboards contentView] addSubview:nibUI.view];

	var titleLabel = nibUI.titleLabel;
	titleLabel.stringValue = windowTitle;



	var goProButton = nibUI.goProButton;	
	var userStatus = getUserStatus(context);
	sketchLog(context,"userStatus:" + userStatus)
	if(userStatus != "free"){
		goProButton.setHidden(true);
	}
	
	nibUI.attachTargetAndAction(goProButton, function() {		
		var url = [NSURL URLWithString:@"https://www.qordoba.com/sketch-professional"];
	    if( ![[NSWorkspace sharedWorkspace] openURL:url] ){
	        sketchLog(context,"Failed to open url:" + [url description])
	    }   
	});
	

	var orgDropdown = nibUI.organizationDropdown;
	[orgDropdown addItemsWithTitles:organizationNames];
	[orgDropdown selectItemAtIndex:organizationIndex];
	[orgDropdown setCOSJSTargetFunction:function(sender) {
		var organizationIndex = [sender indexOfSelectedItem]
		organization = organizations[organizationIndex]
		projects = getProjectsArray(organization.id,context)
		projectsCount = projects.length
		noProjects = (projectsCount == 0)
		projectNames = []
		for (i = 0; i < projects.length; ++i) {
			projectNames.push(projects[i].name);
		}
		projectIndex = 0
		[projectDropdown removeAllItems]
		[projectDropdown addItemsWithTitles:projectNames]
		[projectDropdown selectItemAtIndex:projectIndex]
	}]]


	var projectDropdown = nibUI.projectDropdown;
	if(noProjects){
		var noStringProject = ["No Sketch projects"]
		[projectDropdown addItemsWithTitles:noStringProject]	
	}else {
		[projectDropdown addItemsWithTitles:projectNames]	
	}
	
	[projectDropdown selectItemAtIndex:projectIndex]
 	[projectDropdown setCOSJSTargetFunction:function(sender) {
	   	projectIndex = [sender indexOfSelectedItem]
	   	project = projects[projectIndex]
	}]]


	var sendButton = nibUI.uploadButton
	var cancelButton = nibUI.cancelButton


	nibUI.attachTargetAndAction(sendButton, function() {		
		 if(noProjects){
		 	utils.fireError("No Project Selected!", " There's no project selected.. please choose another organization.")	
		 	return ;
		 }
		 [sendButton setTitle:"Uploading ..."]

		 getApiKeyFromServer(organization.id,context)
		 utils.saveProject(project)
		 utils.saveOrganization(organization)
		 //upload pages
		 controller.uploadPages(all, organization, project, context)

		[cancelButton setCOSJSTargetFunction:undefined]
		[sendButton setCOSJSTargetFunction:undefined]
		[orgDropdown setCOSJSTargetFunction:undefined]
		[projectDropdown setCOSJSTargetFunction:undefined]
		[windowSendArtboards orderOut:nil]
		[app stopModal]
		 
	});

	nibUI.attachTargetAndAction(cancelButton, function() {
	    [cancelButton setCOSJSTargetFunction:undefined]
	    [sendButton setCOSJSTargetFunction:undefined]
	    [orgDropdown setCOSJSTargetFunction:undefined]
	    [projectDropdown setCOSJSTargetFunction:undefined]
		[windowSendArtboards orderOut:nil]
	    [app stopModal]
	});

	[windowSendArtboards setDefaultButtonCell:[sendButton cell]];
	[app runModalForWindow:windowSendArtboards]

	nibUI.destroy();
}


function excludeSymbols(context){
	translate.excludeAllTextLayers(context);
	utils.excludeSymbols(context);
	fireError("Success!", "Done!")
}