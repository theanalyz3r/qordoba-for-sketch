@import 'helpers/error-logging.js'
@import 'helpers/files.js'
@import 'helpers/utils.js'
@import 'helpers/manifest.js'
@import 'helpers/translate.js'
@import 'helpers/utils.js'
@import 'helpers/qordoba-api.js'
@import 'api.js'

/**
 *
 * Show Config window to sepicfy the organization id, project id and language id
 *
**/
function fireTranslateForm(all,context){
	var doc = context.document
	sketchLog(context,"fireConfiguration()");

	var windowTitle = texts.fetchAllWindowTitle
	if(all){
		translate.excludeAllTextLayers(context)
	}else{
		windowTitle = texts.fetchCurrentWindowTitle
		var currentPage = [doc currentPage]
		// translate.excludeTextLayersFromSymbol(context,currentPage)
		if(utils.isGeneratedPage(currentPage,context)){
			fireError("Warning!", "This Page is the translated version. To fetch an updated version of the translation, please pull from the original Page.")
			return ;
		}
	}


	var width = 400;
	var height = 350;
	var shifX

	var yDropdowns = 220;
	var xDropPos = 79;
	var windowSendArtboards = [[NSWindow alloc] init]
	[windowSendArtboards setFrame:NSMakeRect(0, 0, width, height) display:true]
	[windowSendArtboards setBackgroundColor:NSColor.whiteColor()]
	[windowSendArtboards setTitle:windowTitle]
	
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

	
	//Logo
	var plugin = context.plugin
	if(utils.isRetinaDisplay()){
		var imageFilePath=[plugin urlForResourceNamed:"logo@2x.png"];
	} else {
		var imageFilePath=[plugin urlForResourceNamed:"logo.png"];
	}
	var imageData = [NSData dataWithContentsOfURL:imageFilePath];
	var image = NSImage.alloc().initWithData(imageData);

	var imageView = [[NSImageView alloc] initWithFrame:NSMakeRect((width - 164)/2, yDropdowns, 164, 149)];
	[imageView setImage: image];
	[[windowSendArtboards contentView] addSubview:imageView];
	

	var titleField = utils.createLabel("Choose an organization: ",NSMakeRect((width - 250)/2 - 100, yDropdowns, 250, 25))
	[[windowSendArtboards contentView] addSubview:titleField]

	var orgDropdown = [[NSPopUpButton alloc] initWithFrame:NSMakeRect(xDropPos, yDropdowns - 20 , 250, 25))]
	  [orgDropdown addItemsWithTitles:organizationNames]
	  [orgDropdown selectItemAtIndex:organizationIndex]
	  var obj = this
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
	[[windowSendArtboards contentView] addSubview:orgDropdown]


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

	var projectTitle = utils.createLabel("Choose a Project:",NSMakeRect((width - 250)/2 - 142, yDropdowns -50, 250, 25))
	[[windowSendArtboards contentView] addSubview:projectTitle]

	var projectDropdown = [[NSPopUpButton alloc] initWithFrame:NSMakeRect(xDropPos, yDropdowns - 70 , 250, 25))]
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
	[[windowSendArtboards contentView] addSubview:projectDropdown]

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
	var languageTitle = utils.createLabel("Choose a Language:",NSMakeRect((width - 250)/2 - 125, yDropdowns -100, 250, 25))
	[[windowSendArtboards contentView] addSubview:languageTitle]

	var languageDropdown = [[NSPopUpButton alloc] initWithFrame:NSMakeRect(xDropPos, yDropdowns - 120 , 250, 25))]
	  [languageDropdown addItemsWithTitles:languageNames]
	  [languageDropdown selectItemAtIndex:languageIndex]
	[[windowSendArtboards contentView] addSubview:languageDropdown]
	
	

	//Buttons
	var bottomActionsView = [[NSView alloc] initWithFrame:NSMakeRect(0, 80, 400, 1)]
	bottomActionsView.setWantsLayer(true)
	[[windowSendArtboards contentView] addSubview:bottomActionsView]	
		
	var borderLayer = [CALayer layer]
	borderLayer.frame = CGRectMake(40, 1, 800, 1)
	[borderLayer setBackgroundColor:CGColorCreateGenericRGB(220/255, 220/255, 220/255, 1.0)]
	[bottomActionsView setLayer:borderLayer];

	var yPosButtons = 20;
	
	// Buttons
	var sendButton = [[NSButton alloc] initWithFrame:NSMakeRect(185, yPosButtons, 134, 46)]
	var cancelButton = [[NSButton alloc] initWithFrame:NSMakeRect(100, yPosButtons, 76, 46)]

	[sendButton setTitle:"Translate"]
	[sendButton setBezelStyle:NSRoundedBezelStyle]
	[sendButton setCOSJSTargetFunction:function(sender) {
				languageIndex = [languageDropdown indexOfSelectedItem]
				language = languages[languageIndex]
	   	
				utils.saveTargetLanguage(language)
				utils.saveProject(project)
				utils.saveOrganization(organization)
				getApiKeyFromServer(organization.id,context)
				//Translate
				translatePages(all,organization,project,language, context)

				[cancelButton setCOSJSTargetFunction:undefined]
	    		[sendButton setCOSJSTargetFunction:undefined]
	    		[languageDropdown setCOSJSTargetFunction:undefined]
	    		[orgDropdown setCOSJSTargetFunction:undefined]
	    		[projectDropdown setCOSJSTargetFunction:undefined]
	    		[windowSendArtboards orderOut:nil]
				[app stopModal]
	}];

	[sendButton setAction:"callAction:"]
	[[windowSendArtboards contentView] addSubview:sendButton]

	[cancelButton setTitle:"Cancel"]
	[cancelButton setBezelStyle:NSRoundedBezelStyle]
	[cancelButton setCOSJSTargetFunction:function(sender) {
	    [windowSendArtboards orderOut:nil]
	    [app stopModal]
	    [cancelButton setCOSJSTargetFunction:undefined]
	    [sendButton setCOSJSTargetFunction:undefined]
	    [languageDropdown setCOSJSTargetFunction:undefined]
	    [orgDropdown setCOSJSTargetFunction:undefined]
	    [projectDropdown setCOSJSTargetFunction:undefined]
	}];
	[cancelButton setAction:"callAction:"]
	[[windowSendArtboards contentView] addSubview:cancelButton]

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
	sketchLog(context,"fireConfiguration()");

	var windowTitle = texts.uploadAllWindowTitle
	if(all){
	}else{
		windowTitle = texts.uploadCurrentWindowTitle
	}
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
	var width = 400;
	var height = 290;
	var shifX

	var yDropdowns = 160;
	var xDropPos = 79;
	var windowSendArtboards = [[NSWindow alloc] init]
	[windowSendArtboards setFrame:NSMakeRect(0, 0, width, height) display:true]
	[windowSendArtboards setBackgroundColor:NSColor.whiteColor()]
	[windowSendArtboards setTitle:windowTitle]
	
	//Logo
	var plugin = context.plugin
	if(utils.isRetinaDisplay()){
		var imageFilePath=[plugin urlForResourceNamed:"logo@2x.png"];
	} else {
		var imageFilePath=[plugin urlForResourceNamed:"logo.png"];
	}
	var imageData = [NSData dataWithContentsOfURL:imageFilePath];
	var image = NSImage.alloc().initWithData(imageData);

	var imageView = [[NSImageView alloc] initWithFrame:NSMakeRect((width - 164)/2, yDropdowns, 164, 149)];
	[imageView setImage: image];
	[[windowSendArtboards contentView] addSubview:imageView];
	

	var titleField = utils.createLabel("Choose an organization: ",NSMakeRect((width - 250)/2 - 105, yDropdowns, 250, 25))
	[[windowSendArtboards contentView] addSubview:titleField]

	var orgDropdown = [[NSPopUpButton alloc] initWithFrame:NSMakeRect(xDropPos, yDropdowns - 20 , 250, 25))]
	  [orgDropdown addItemsWithTitles:organizationNames]
	  [orgDropdown selectItemAtIndex:organizationIndex]
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
	[[windowSendArtboards contentView] addSubview:orgDropdown]


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

	var projectTitle = utils.createLabel("Choose a Project:",NSMakeRect((width - 250)/2 - 142, yDropdowns -50, 250, 25))
	[[windowSendArtboards contentView] addSubview:projectTitle]

	var projectDropdown = [[NSPopUpButton alloc] initWithFrame:NSMakeRect(xDropPos, yDropdowns - 70 , 250, 25))]
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
	[[windowSendArtboards contentView] addSubview:projectDropdown]

	//Buttons
	var bottomActionsView = [[NSView alloc] initWithFrame:NSMakeRect(0, 60, 400, 1)]
	bottomActionsView.setWantsLayer(true)
	[[windowSendArtboards contentView] addSubview:bottomActionsView]	
		
	var borderLayer = [CALayer layer]
	borderLayer.frame = CGRectMake(40, 1, 800, 1)
	[borderLayer setBackgroundColor:CGColorCreateGenericRGB(220/255, 220/255, 220/255, 1.0)]
	[bottomActionsView setLayer:borderLayer];

	var yPosButtons = 10;
	
	// Buttons
	var sendButton = [[NSButton alloc] initWithFrame:NSMakeRect(185, yPosButtons, 134, 46)]
	var cancelButton = [[NSButton alloc] initWithFrame:NSMakeRect(100, yPosButtons, 76, 46)]

	[sendButton setTitle:"Upload"]
	[sendButton setBezelStyle:NSRoundedBezelStyle]
	[sendButton setCOSJSTargetFunction:function(sender) {	   	
				if(noProjects){
					utils.fireError("No Project Selected!", " There's no project selected.. please choose another organization.")	
					return ;
				}
				getApiKeyFromServer(organization.id,context)
				utils.saveProject(project)
				utils.saveOrganization(organization)
				//upload pages
				uploadPages(all, organization,project, context)

				[windowSendArtboards orderOut:nil]
				[app stopModal]
				[cancelButton setCOSJSTargetFunction:undefined]
	    		[sendButton setCOSJSTargetFunction:undefined]
	    		[orgDropdown setCOSJSTargetFunction:undefined]
	    		[projectDropdown setCOSJSTargetFunction:undefined]
	}];

	[sendButton setAction:"callAction:"]
	[[windowSendArtboards contentView] addSubview:sendButton]

	[cancelButton setTitle:"Cancel"]
	[cancelButton setBezelStyle:NSRoundedBezelStyle]
	[cancelButton setCOSJSTargetFunction:function(sender) {
	    [windowSendArtboards orderOut:nil]
	    [app stopModal]
	    [cancelButton setCOSJSTargetFunction:undefined]
	    [sendButton setCOSJSTargetFunction:undefined]
	    [orgDropdown setCOSJSTargetFunction:undefined]
	    [projectDropdown setCOSJSTargetFunction:undefined]
	}];
	[cancelButton setAction:"callAction:"]
	[[windowSendArtboards contentView] addSubview:cancelButton]

	[windowSendArtboards setDefaultButtonCell:[sendButton cell]];
	
	[app runModalForWindow:windowSendArtboards]
}

/**
 *
 * Fire Translate Artboards
 *
**/	
function translatePages(all,organization,project,language, context){
	var doc = context.document
	var apiKey = utils.getActiveApiKeyFromComputer(organization.id, context)
	if(!project || !language || !organization || !apiKey){
		fireConfiguration(context)
		return;
	}
	var currentPage = [doc currentPage]
	var pages = []
	var pagesCount = 0
	if(all == 1){
		pages = [doc pages]
		pagesCount = [pages count]
	}else{
		pagesCount = 1
		pages = [currentPage]
	}
	var success = true
	var showError = true;
	var errors = 0;
	for (i = 0; i < pagesCount; ++i) {
		var page = pages[i]
		if(utils.isGeneratedPage(page,context)){
			fireError("Warning!", "This Page is the translated version. To fetch an updated version of the translation, please pull from the original Page.")
			showError = false;
			continue;
		}
		//translate.excludeTextLayersFromSymbol(context,page);
		var pageName = [currentPage name]
		var documentName = [doc displayName]
		var fileId = utils.getFileIdForPage(project.id,documentName,page,context)
		//var fileId = {fileId: "585851", version: 1}

		if(fileId){
			var translations = downloadFileNSUrlConnection(context,organization.id,project.id,language.id,fileId.fileId)
			if(translations){
				errors = translate.translatePageWithData(context,currentPage, language, translations)	
			}else{
				success = false;
			}
			
		}else {
			success = false;
			showError = false;
			fireError("Error!", "Your Page \""+pageName+"\" is not found in selected project")
		}
	};
	if(errors >0 ){
		fireError("Success!", "Translated Pages created successfully. "+errors+" text layers could not be found.")
	}else if(success){
		fireError("Success!", "Translated Pages created successfully")
	}else if(showError){
		fireError("Error!", "Something went wrong.")
	}
}


function uploadPages(all, organization,project, context) {
	log("Upload pages for project: " + project.id)
	var document = context.document
	var doc = context.document
	var documentName = [doc displayName]
	var currentPage = [doc currentPage]
	var pages = []
	var pagesCount = 0
	if(all == 1){
		pages = [doc pages]
		pagesCount = [pages count]
	}else{
		pagesCount = 1
		pages = [currentPage]
	}
	var result = true
	for (i = 0; i < pagesCount; ++i) {
		var page = pages[i]
		//log("process page " + i)
		var stringsAsJson = translate.generateLocaleForPage(page)
		var pageName = [page name]

		oldFileId = utils.getFileIdForPage(project.id,documentName,page,context)	
		var filePath
		var newVersion = 0;
		if(oldFileId && oldFileId.version > 0){
			newVersion = oldFileId.version //+ 1
			filePath = fileHelper.generateFile(context,stringsAsJson,pageName + " -ver " + newVersion)
		}else{
			log("new version is" + newVersion)
			newVersion = 0
			filePath = fileHelper.generateFile(context,stringsAsJson,pageName)
		}
		var fileId = postFile(context,filePath,organization.id,project.id,pageName, newVersion)

		if(fileId){
			//translate.excludeTextLayersFromSymbol(context,page)
			utils.saveFileIdForPage(project.id,documentName,page,fileId,context)		
		}


		result = fileId && result
	};

	if(result && all == 1){
		fireError("Success!", "Your pages has been uploaded to Qordoba.")
	}else if(result){
		var pageName = [currentPage name]
		fireError("Success!", "Your page \""+pageName+"\" has been uploaded to Qordoba.")	
	}

}

function excludeSymbols(context){
	translate.excludeAllTextLayers(context);
	utils.excludeSymbols(context);
	fireError("Success!", "Done!")
}