@import 'helpers/error-logging.js'
@import 'helpers/files.js'
@import 'helpers/utils.js'
@import 'helpers/utils.js'
@import 'helpers/manifest.js'
@import 'helpers/translate.js'
@import 'helpers/utils.js'
@import 'helpers/qordoba-api.js'
@import 'helpers/texts.js'
@import 'helpers/forms.js'
var app = [NSApplication sharedApplication];
// Plugin Calls

function fireLoginWindowWithContext(context){
	// create window
	var loginWindow = [[NSWindow alloc] init]
	[loginWindow setFrame:NSMakeRect(0, 0, 540, 332) display:false]
	[loginWindow setBackgroundColor:NSColor.whiteColor()]
		
	var plugin = context.plugin

	if(utils.isRetinaDisplay()){
		var imageFilePath=[plugin urlForResourceNamed:"logo@2x.png"];
	} else {
		var imageFilePath=[plugin urlForResourceNamed:"logo.png"];
	}
	var imageData = [NSData dataWithContentsOfURL:imageFilePath];
	var image = NSImage.alloc().initWithData(imageData);

	var imageView = [[NSImageView alloc] initWithFrame:NSMakeRect(46, 124, 164, 149)];
	[imageView setImage: image];
	[[loginWindow contentView] addSubview:imageView];
	
	// create prompt text
	var titleField = [[NSTextField alloc] initWithFrame:NSMakeRect(248, 249, 243, 17)]
	[titleField setEditable:false]
	[titleField setBordered:false]
	[titleField setDrawsBackground:false]
	[titleField setFont:[NSFont boldSystemFontOfSize:15]];
	[titleField setStringValue:"Use Qordoba & Sketch"]
	[[loginWindow contentView] addSubview:titleField]
	
	// create prompt text
	var subtitleField = [[NSTextField alloc] initWithFrame:NSMakeRect(248, 224, 243, 15)]
	[subtitleField setEditable:false]
	[subtitleField setBordered:false]
	[subtitleField setFont:[NSFont systemFontOfSize:13]];
	[subtitleField setTextColor:[NSColor colorWithCalibratedRed:(93/255) green:(93/255) blue:(93/255) alpha:1]];
	[subtitleField setDrawsBackground:false]
	[subtitleField setStringValue:"Sign in and sent artboards to Qordoba!"]
	[subtitleField sizeToFit]
	[[loginWindow contentView] addSubview:subtitleField]
	
	var emailInputField = [[NSTextField alloc] initWithFrame:NSMakeRect(250, 181, 243, 23)]
	[[emailInputField cell] setPlaceholderString:"Email"]
	[[loginWindow contentView] addSubview:emailInputField]	
	  
	var passwordField = [[NSSecureTextField alloc] initWithFrame:NSMakeRect(250, 150, 243, 23)]
	[[passwordField cell] setPlaceholderString:"Password"]
	[[loginWindow contentView] addSubview:passwordField]	
	
	var yPosButtons = 102;
	
	var loginButton = [[NSButton alloc] initWithFrame:NSMakeRect(407, yPosButtons, 92, 46)]
	var cancelButton = [[NSButton alloc] initWithFrame:NSMakeRect(321, yPosButtons, 92, 46)]
	var createQordobaButton = [[NSButton alloc] initWithFrame:NSMakeRect(44, 23, 162, 32)]
	var createHelpButton = [[NSButton alloc] initWithFrame:NSMakeRect(470, 23, 32, 32)]

	[loginButton setTitle:"Sign in"]
	[loginButton setBezelStyle:NSRoundedBezelStyle]
	[loginButton setKeyEquivalent:"\r"]
	[loginButton setCOSJSTargetFunction:function(sender) {
	    [loginWindow orderOut:nil]
	    [app stopModal]
	    var email = emailInputField.stringValue()
	    var password = passwordField.stringValue()
	    loginWithUsernameAndPassword(email, password, context)
	    [cancelButton setCOSJSTargetFunction:undefined]
	    [loginButton setCOSJSTargetFunction:undefined]
	    [createQordobaButton setCOSJSTargetFunction:undefined]
	    [createHelpButton setCOSJSTargetFunction:undefined]
	}];
	[loginButton setAction:"callAction:"]
	[[loginWindow contentView] addSubview:loginButton]
	
	
	
	[cancelButton setTitle:"Cancel"]
	[cancelButton setBezelStyle:NSRoundedBezelStyle]
	[cancelButton setCOSJSTargetFunction:function(sender) {
	    [loginWindow orderOut:nil]
	    [app stopModal]
	    [cancelButton setCOSJSTargetFunction:undefined]
	    [loginButton setCOSJSTargetFunction:undefined]
	    [createQordobaButton setCOSJSTargetFunction:undefined]
	    [createHelpButton setCOSJSTargetFunction:undefined]
	}];
	[cancelButton setAction:"callAction:"]
	[[loginWindow contentView] addSubview:cancelButton]
	

	//Bottom Bar

	var bottomActionsView = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, 540, 79)];
	bottomActionsView.setWantsLayer(true);
	[[loginWindow contentView] addSubview:bottomActionsView];	
	
	var backgroundLayer = [CALayer layer];
	[backgroundLayer setBackgroundColor:CGColorCreateGenericRGB(246/255, 246/255, 246/255, 1.0)]; //RGB plus Alpha Channel
	[bottomActionsView setLayer:backgroundLayer]
	
	var borderLayer = [CALayer layer];
	borderLayer.frame = CGRectMake(0, 78, 540, 1);
	[borderLayer setBackgroundColor:CGColorCreateGenericRGB(220/255, 220/255, 220/255, 1.0)]; //RGB plus Alpha Channel
	[backgroundLayer addSublayer:borderLayer];

	//Create Marvel Button
	
	[createQordobaButton setTitle:"Create account"]
	[createQordobaButton setBezelStyle:NSRoundedBezelStyle]
	[createQordobaButton setCOSJSTargetFunction:function(sender) {
	    var url = [NSURL URLWithString:@"https://app.qordoba.com/"];
	    if( ![[NSWorkspace sharedWorkspace] openURL:url] ){
	        sketchLog(context,"Failed to open url:" + [url description])
	    }    
	}];
	[createQordobaButton setAction:"callAction:"]
	[bottomActionsView addSubview:createQordobaButton]	
	
	[createHelpButton setBezelStyle:NSHelpButtonBezelStyle]
	[createHelpButton setTitle:nil]
	[createHelpButton setCOSJSTargetFunction:function(sender) {
	    var url = [NSURL URLWithString:@"https://support.qordoba.com"];
	    if( ![[NSWorkspace sharedWorkspace] openURL:url] ){
	        sketchLog(context,"Failed to open url:" + [url description])
	    }
	}];
	[createHelpButton setAction:"callAction:"]
	[bottomActionsView addSubview:createHelpButton]
	

	[loginWindow setDefaultButtonCell:[loginButton cell]];
	
	[app runModalForWindow:loginWindow]	
}

function fireAlreadyLoggedInWindow(context){
	
	// create window
	var alreadyLoggedInWindow = [[NSWindow alloc] init]
	[alreadyLoggedInWindow setFrame:NSMakeRect(0, 0, 540, 332) display:false]
	[alreadyLoggedInWindow setBackgroundColor:NSColor.whiteColor()]
	    
	var userName =  utils.getUserName(context)
	var userEmail = utils.getUserEmail(context)
	
	var width = 540
	//Logo
	var plugin = context.plugin
	if(utils.isRetinaDisplay()){
		var imageFilePath=[plugin urlForResourceNamed:"logo@2x.png"];
	} else {
		var imageFilePath=[plugin urlForResourceNamed:"logo.png"];
	}
	var imageData = [NSData dataWithContentsOfURL:imageFilePath];
	var image = NSImage.alloc().initWithData(imageData);

	var imageView = [[NSImageView alloc] initWithFrame:NSMakeRect((width - 164)/2 -10, 180, 164, 149)];
	[imageView setImage: image];
	[[alreadyLoggedInWindow contentView] addSubview:imageView];
				  			
	// create prompt text
	var titleField = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 180, 540, 17)]
	[titleField setEditable:false]
	[titleField setBordered:false]
	[titleField setAlignment:2] 
	[titleField setDrawsBackground:false]
	[titleField setFont:[NSFont boldSystemFontOfSize:13]];
	[titleField setStringValue:"Welcome "+userName+"!"]
	[[alreadyLoggedInWindow contentView] addSubview:titleField]

	var title2Field  = utils.createLabel("You are logged in under " + userEmail+ ".",NSMakeRect(-110, 160, 540, 17))
	[[alreadyLoggedInWindow contentView] addSubview:title2Field]

	// create prompt text
	var subtitleField = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 120, 540, 30)]
	[subtitleField setEditable:false]
	[subtitleField setBordered:false]
	[subtitleField setAlignment:2] 
	[subtitleField setFont:[NSFont systemFontOfSize:13]];
	[subtitleField setTextColor:[NSColor colorWithCalibratedRed:(93/255) green:(93/255) blue:(93/255) alpha:1]];
	[subtitleField setDrawsBackground:false]
	[subtitleField setStringValue:texts.logout_first_text]
	[[alreadyLoggedInWindow contentView] addSubview:subtitleField]
	
	var yPosButtons = 80;
	
	// Buttons

	var logoutButton = [[NSButton alloc] initWithFrame:NSMakeRect(267, yPosButtons, 92, 46)]
	var cancelButton = [[NSButton alloc] initWithFrame:NSMakeRect(181, yPosButtons, 92, 46)]

	[logoutButton setTitle:"Sign out"]
	[logoutButton setBezelStyle:NSRoundedBezelStyle]
	[logoutButton setCOSJSTargetFunction:function(sender) {
		utils.deleteActiveTokenFromComputer(context)
	    [alreadyLoggedInWindow orderOut:nil]
	    [app stopModal]
	    [logoutButton setCOSJSTargetFunction:undefined]
	    [cancelButton setCOSJSTargetFunction:undefined]
	    fireLoginWindowWithContext(context)
	}];
	[logoutButton setAction:"callAction:"]
	[[alreadyLoggedInWindow contentView] addSubview:logoutButton]
	
	
	
	[cancelButton setTitle:"Cancel"]
	[cancelButton setBezelStyle:NSRoundedBezelStyle]
	[cancelButton setCOSJSTargetFunction:function(sender) {
	    [alreadyLoggedInWindow  orderOut:nil]
	    [app stopModal]
	    [logoutButton setCOSJSTargetFunction:undefined]
	    [cancelButton setCOSJSTargetFunction:undefined]
	}];
	[cancelButton setAction:"callAction:"]
	[[alreadyLoggedInWindow contentView] addSubview:cancelButton]

	[alreadyLoggedInWindow setDefaultButtonCell:[logoutButton cell]];
	
	[app runModalForWindow:alreadyLoggedInWindow]
}


/*
 *
 *
 *
**/
function fireSendArtboards(all, context){
	var doc = context.document
	var yDropdowns = 170;

	var windowSendArtboards = [[NSWindow alloc] init]
	[windowSendArtboards setFrame:NSMakeRect(0, 0, 485, 333) display:false]
	[windowSendArtboards setBackgroundColor:NSColor.whiteColor()]
	
	var titleField = [[NSTextField alloc] initWithFrame:NSMakeRect(74, yDropdowns + 80, 540, 17)]
	[titleField setEditable:false]
	[titleField setBordered:false]
	[titleField setDrawsBackground:false]
	[titleField setFont:[NSFont boldSystemFontOfSize:13]];
	[titleField setStringValue:"Please choose the organization: "]
	[[windowSendArtboards contentView] addSubview:titleField]

	//Organization
	var organizationsArray = utils.getUserOrganizations(context)
	var organizationPopup = [[NSComboBox alloc] initWithFrame:NSMakeRect(74, yDropdowns + 45, 260, 26)]
	[organizationPopup removeAllItems]
	[organizationPopup setFocusRingType:NSFocusRingTypeNone]
	var lastUsedOrganizationId = utils.getLastUsedOrganization(context)
	var lastUsedOrganizationIdIndex
	var organizationNames = []

	var noOrganizations = false
	if([organizationsArray count] == 0){
		noOrganizations = true
	}

	sketchLog(context, "Find pre used organizations");
	for (i = 0; i < [organizationsArray count]; ++i) {
			organizationNames.push(organizationsArray[i].name);
			if(lastUsedOrganizationId == organizationsArray[i].id){
				lastUsedOrganizationIdIndex = i;
				sketchLog(context, "Last used organization index " + lastUsedOrganizationIdIndex + "and ID is " + organizationsArray[i].id)
			}
	}
	[organizationPopup addItemsWithObjectValues:organizationNames]

	sketchLog(context, "Set last used organization")

	if(lastUsedOrganizationIdIndex){
		[organizationPopup selectItemAtIndex:lastUsedOrganizationIdIndex]
	} else {
		if (noOrganizations == false){
			sketchLog(context, "There are organizations")
			[organizationPopup selectItemAtIndex:0]
		}
	}
	[[windowSendArtboards contentView] addSubview:organizationPopup]

	//load projects button
	var loadProjects = [[NSButton alloc] initWithFrame:NSMakeRect(330, yDropdowns + 45, 110, 26)]
	[loadProjects setTitle:"Load Projects"]
	[loadProjects setBezelStyle:NSRoundedBezelStyle]
	[loadProjects setCOSJSTargetFunction:function(sender) {
		var selectedOrganization = [organizationPopup objectValueOfSelectedItem];
		if (!selectedOrganization){
			selectedOrganization = [projectPopup stringValue];
		}
		[doc showMessage: selectedOrganization]
		var organizationId;
	    for (i = 0; i < [organizationsArray count]; ++i) {
	    if (selectedOrganization == organizationsArray[i].name){
	    	organizationId = organizationsArray[i].id;	
	    	} 			
		}
		//getApiKeyFromServer(organizationId,context)
		[doc showMessage: "Loading projects of Org: " + selectedOrganization]
		var projectsArray = getProjectsArray(organizationId,context)
		var projectNames = []
		[projectPopup removeAllItems]
		for (i = 0; i < projectsArray.length; ++i) {
			projectNames.push(projectsArray[i].name);
		}		
		[projectPopup addItemsWithObjectValues:projectNames]
		[projectPopup selectItemAtIndex:0]
	}];
	[loadProjects setAction:"callAction:"]
	[[windowSendArtboards contentView] addSubview:loadProjects]

	//Project
	var firstOrganization = [organizationsArray objectAtIndex:0]
	var projectsArray = getProjectsArray(firstOrganization.id,context)
	var titleProjectField = [[NSTextField alloc] initWithFrame:NSMakeRect(74, yDropdowns + 20, 540, 17)]
	[titleProjectField setEditable:false]
	[titleProjectField setBordered:false]
	[titleProjectField setDrawsBackground:false]
	[titleProjectField setFont:[NSFont boldSystemFontOfSize:13]];
	[titleProjectField setStringValue:"Please choose the project: "]
	[[windowSendArtboards contentView] addSubview:titleProjectField]


	var projectPopup = [[NSComboBox alloc] initWithFrame:NSMakeRect(74, yDropdowns - 10, 260, 26)]
	[projectPopup removeAllItems]
	[projectPopup setFocusRingType:NSFocusRingTypeNone]
	var lastUsedProjectId = utils.getLastUsedProject(context)
	var lastUsedProjectIdIndex
	var projectNames = []

	var noProjects = false
	if(projectsArray.length == 0){
		noProjects = true
	}

	sketchLog(context, "Find pre used projects");
	for (i = 0; i < projectsArray.length; ++i) {
			projectNames.push(projectsArray[i].name);

			if(lastUsedProjectId == projectsArray[i].id){
				lastUsedProjectIdIndex = i;
				sketchLog(context, "Last used project index " + lastUsedProjectIdIndex + "and ID is " + projectsArray[i].id)
			}
	}
	[projectPopup addItemsWithObjectValues:projectNames]

	sketchLog(context, "Set last used project")

	if(lastUsedProjectIdIndex){
		[projectPopup selectItemAtIndex:lastUsedProjectIdIndex]
	} else {
		if (noProjects == false){
			sketchLog(context, "There are projects")
			[projectPopup selectItemAtIndex:0]
		}
	}
	[[windowSendArtboards contentView] addSubview:projectPopup]
	
	
	//Buttons
	var bottomActionsView = [[NSView alloc] initWithFrame:NSMakeRect(74, 112, 348, 1)]
	bottomActionsView.setWantsLayer(true)
	[[windowSendArtboards contentView] addSubview:bottomActionsView]	
		
	var borderLayer = [CALayer layer]
	borderLayer.frame = CGRectMake(0, 1, 348, 1)
	[borderLayer setBackgroundColor:CGColorCreateGenericRGB(220/255, 220/255, 220/255, 1.0)]
	[bottomActionsView setLayer:borderLayer];

	var yPosButtons = 45;
	
	// Buttons
	var sendButton = [[NSButton alloc] initWithFrame:NSMakeRect(295, yPosButtons, 134, 46)]
	var cancelButton = [[NSButton alloc] initWithFrame:NSMakeRect(225, yPosButtons, 76, 46)]

	[sendButton setTitle:"Sync to Qordoba"]
	[sendButton setBezelStyle:NSRoundedBezelStyle]
	[sendButton setCOSJSTargetFunction:function(sender) {
				sketchLog(context,"Send Artboards");
				
				var selectedProject = [projectPopup objectValueOfSelectedItem];
				if (!selectedProject){
				    selectedProject = [projectPopup stringValue];
				}

				var projectId;

	    		for (i = 0; i < projectsArray.length; ++i) {
	    			if (selectedProject == projectsArray[i].name){
	    				projectId = projectsArray[i].id;	
	    			} 
	    		}
	    		
	    		orgIndex = [organizationPopup indexOfSelectedItem]
	    		var selectedOrganization = organizationsArray[orgIndex]	

	    		log(selectedOrganization)
	    		//selectedOrganization = {id: 1}
	    		//TODO the export
	    		if (projectId){
		    		if(all == 1){
						exportAllArtboardsAndSendTo(context,1,projectId)
					} else {
						exportArtboardsAndSendTo(context,1,projectId, context.selection)
					}
					utils.saveLastUsedProject(projectId,context)
					
					[windowSendArtboards orderOut:nil]
					[app stopModal]
					[cancelButton setCOSJSTargetFunction:undefined]
	    			[sendButton setCOSJSTargetFunction:undefined]
				}
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
function fireTranslateArtboards(all, context){
	var doc = context.document
	var project = utils.getProject()
	var language = utils.getTargetLanguage()
	var organization = utils.getOrganization()
	var apiKey = utils.getActiveApiKeyFromComputer(organization.id, context)
	if(!project || !language || !organization || !apiKey){
		fireConfiguration(context)
		return;
	}

	if(all == 1){
		translateAllArtboardsAndSendTo(context,organization,project,language)	
	}
}

/**
 *
 * Fire Support
 *
**/	
function fireSupport(context){
	
	var systemVersionDictionary = [NSDictionary dictionaryWithContentsOfFile:@"/System/Library/CoreServices/SystemVersion.plist"]
	var systemVersion = [systemVersionDictionary objectForKey:@"ProductVersion"]
	var pluginVersion = manifest.getPluginVersion(context)
	var sketchVersion = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"]
		
	var windowSendArtboards = [[NSWindow alloc] init]
	[windowSendArtboards setFrame:NSMakeRect(0, 0, 485, 333) display:false]
	[windowSendArtboards setBackgroundColor:NSColor.whiteColor()]
	var xPos = 30;
	var titleField = [[NSTextField alloc] initWithFrame:NSMakeRect(xPos, 235, 540, 17)]
	[titleField setEditable:false]
	[titleField setBordered:false]
	[titleField setDrawsBackground:false]
	[titleField setFont:[NSFont boldSystemFontOfSize:13]];
	[titleField setStringValue:"Report a bug"]
	[[windowSendArtboards contentView] addSubview:titleField]

	var step1Label = [[NSTextField alloc] initWithFrame:NSMakeRect(xPos, 200, 540, 17)]
	[step1Label setEditable:false]
	[step1Label setBordered:false]
	[step1Label setDrawsBackground:false]
	[step1Label setFont:[NSFont systemFontOfSize:12]]
	[step1Label setStringValue:"1. Make sure this checkbox is checked (it will turn on debug mode): "]
	[step1Label setTextColor:[NSColor colorWithCalibratedRed:(93/255) green:(93/255) blue:(93/255) alpha:1]]
	[[windowSendArtboards contentView] addSubview:step1Label]

	var step2Label = [[NSTextField alloc] initWithFrame:NSMakeRect(xPos, 172, 540, 17)]
	[step2Label setEditable:false]
	[step2Label setBordered:false]
	[step2Label setDrawsBackground:false]
	[step2Label setFont:[NSFont systemFontOfSize:12]]
	[step2Label setStringValue:"2. Close this window and replicate the bug."]
	[step2Label setTextColor:[NSColor colorWithCalibratedRed:(93/255) green:(93/255) blue:(93/255) alpha:1]]
	[[windowSendArtboards contentView] addSubview:step2Label]

	var step3Label = [[NSTextField alloc] initWithFrame:NSMakeRect(xPos, 144, 540, 17)]
	[step3Label setEditable:false]
	[step3Label setBordered:false]
	[step3Label setDrawsBackground:false]
	[step3Label setFont:[NSFont systemFontOfSize:12]]
	[step3Label setStringValue:"3. Come back to this window and hit send."]
	[step3Label setTextColor:[NSColor colorWithCalibratedRed:(93/255) green:(93/255) blue:(93/255) alpha:1]]
	[[windowSendArtboards contentView] addSubview:step3Label]
	
	var bottomActionsView = [[NSView alloc] initWithFrame:NSMakeRect(xPos, 112, 420, 1)]
	bottomActionsView.setWantsLayer(true)
	[[windowSendArtboards contentView] addSubview:bottomActionsView]	
		
	var borderLayer = [CALayer layer]
	borderLayer.frame = CGRectMake(0, 1, 348, 1)
	[borderLayer setBackgroundColor:CGColorCreateGenericRGB(220/255, 220/255, 220/255, 1.0)]
	[bottomActionsView setLayer:borderLayer];

	var yPosBottomElements = 45;

	var versionLabel = [[NSTextField alloc] initWithFrame:NSMakeRect(xPos, yPosBottomElements + 5, 266, 26)]
	[versionLabel setEditable:false]
	[versionLabel setBordered:false]
	[versionLabel setAlignment:0] 
	[versionLabel setFont:[NSFont systemFontOfSize:11]]
	[versionLabel setTextColor:[NSColor colorWithCalibratedRed:(93/255) green:(93/255) blue:(93/255) alpha:1]]
	[versionLabel setDrawsBackground:false]
	[versionLabel setStringValue:"OSX " + systemVersion + " Sketch " + sketchVersion + " Plugin " + pluginVersion]
	[[windowSendArtboards contentView] addSubview:versionLabel]
	

	// Buttons

	var sendButton = [[NSButton alloc] initWithFrame:NSMakeRect(353, yPosBottomElements, 76, 46)]
	var cancelButton = [[NSButton alloc] initWithFrame:NSMakeRect(283, yPosBottomElements, 76, 46)]
	var debugCheckbox = [[NSButton alloc] initWithFrame:NSMakeRect (420,195,50,25)]

    [debugCheckbox setButtonType:NSSwitchButton];
    [debugCheckbox setTitle:@""];
    if(utils.getDebugSettingFromComputer(context) == 1){
    	[debugCheckbox setState:NSOnState];
    } else {
    	[debugCheckbox setState:NSOffState];
    }
    [debugCheckbox setCOSJSTargetFunction:function(sender) {

    	var directory = errorLogging.getLogDirectory(context);
        errorLogging.removeFileOrFolder(directory + "main.txt")

		if ([sender state] == NSOnState) {
        	utils.saveDebugSetting(1,context)
    	} else {
        	utils.saveDebugSetting(0,context)
    	}
	    
	}];
    [[windowSendArtboards contentView] addSubview:debugCheckbox]

	[sendButton setTitle:"Send"]
	[sendButton setBezelStyle:NSRoundedBezelStyle]
	[sendButton setCOSJSTargetFunction:function(sender) {

			var logs = errorLogging.fetchLog(context);

			var subject = @"Sketch Plugin Support";
			var body =[NSString stringWithFormat:@"Describe your bug here: \n\n\n\n\n My Logs:\n\n Plugin Version: %@ \n System Version: %@ \n Sketch Version: %@ \n %@", pluginVersion, systemVersion, sketchVersion, logs];
			var to = @"support@qordoba.com";
			var encodedSubject = [NSString stringWithFormat:@"SUBJECT=%@", [subject stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
			var encodedBody = [NSString stringWithFormat:@"BODY=%@", [body stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
			var encodedTo = [to stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
			var encodedURLString = [NSString stringWithFormat:@"mailto:%@?%@&%@", encodedTo, encodedSubject, encodedBody];
			var mailtoURL = [NSURL URLWithString:encodedURLString];

			[[NSWorkspace sharedWorkspace] openURL:mailtoURL];

			[windowSendArtboards orderOut:nil]
			[app stopModal]
			[sendButton setCOSJSTargetFunction:undefined]
			[cancelButton setCOSJSTargetFunction:undefined]
			[debugCheckbox setCOSJSTargetFunction:undefined]
	}];
	[sendButton setAction:"callAction:"]
	[[windowSendArtboards contentView] addSubview:sendButton]
	
	
	[cancelButton setTitle:"Close"]
	[cancelButton setBezelStyle:NSRoundedBezelStyle]
	[cancelButton setCOSJSTargetFunction:function(sender) {
	    [windowSendArtboards orderOut:nil]
	    [app stopModal]
	    [cancelButton setCOSJSTargetFunction:undefined]
		[debugCheckbox setCOSJSTargetFunction:undefined]
		[sendButton setCOSJSTargetFunction:undefined]
	}];
	[cancelButton setAction:"callAction:"]
	[[windowSendArtboards contentView] addSubview:cancelButton]
	
	[windowSendArtboards setDefaultButtonCell:[sendButton cell]];
	
	[app runModalForWindow:windowSendArtboards]
}


// Api Calls
// Helpers

function dealWithErrors(context,data){

		sketchLog(context,"Received an error from the server")
		var stringRead = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];	
		
		var alert = [[NSAlert alloc] init]
		[alert setMessageText:"Something went wrong..."]
		[alert setInformativeText:"Please ensure your email and password are correct and internet isn\'t down or a firewall (e.g. Little Snitch) is not blocking any connections to qordoba.com."]

		if(stringRead != nil && stringRead != ""){
				[alert addButtonWithTitle:'Close']
				[alert addButtonWithTitle:'Show more details']
		} else {
				[alert addButtonWithTitle:'Close']
		}
		
		var responseCode = [alert runModal]
		sketchLog(context,"Return data " + stringRead)		
}

function exportArtboardsAndSendTo(context, organizationId, projectId, selection) {
				var loop = [selection objectEnumerator];
				var existing_artboards_names = [];					
				while (artboard = [loop nextObject]) {
				  	if (artboard.className() == "MSArtboardGroup") {
				  	var arrayCount = existing_artboards_names.length;
				  	for (var i = 0; i < arrayCount; i++) {
				  		if(existing_artboards_names[i] == [artboard name]){
				  				fireError("You have more than one artboard with the name '" + [artboard name]  + "', please change one of these artboard names.","Please rename one of these artboards in order to solve this issue.")
				  				return false
				  			} 
				  	}
				  	existing_artboards_names.push([artboard name]); 
				  	}					  	 					  	 
				}
				
				if(existing_artboards_names.length == 0){
				  fireError("You didn't select any artboards.","Select at least one artboard before sending.")
				  return false
				}
}

function exportAllArtboardsAndSendTo(context, organizationId, projectId) {
	var document = context.document
	var doc = context.document
	var currentPage = [doc currentPage] 
					
	//var path = NSTemporaryDirectory() + filename
	var string = translate.generateLocaleForCurrentPage(context)
	var pageName = [currentPage name]
	var filePath = fileHelper.generateFile(context,string,pageName)

					postFile(context,filePath,organizationId,projectId,pageName,0)

					sketchLog(context,"saved to this file: ")
					sketchLog(context,filePath)
					var artboards = [[document currentPage] artboards];
					var loop = [artboards objectEnumerator];
					var existing_artboards_names = [];
											
					while (artboard = [loop nextObject]) {
					  	var arrayCount = existing_artboards_names.length;
					  	for (var i = 0; i < arrayCount; i++) {
					  			if(existing_artboards_names[i] == [artboard name]){
					  				
					  				fireError("You have more than one artboard with the name '" + [artboard name]  + "', please change one of these artboard names.","Please rename one of these artboards in order to solve this issue.")
					  				return false
					  				  
					  			} 
					  	}
					  	existing_artboards_names.push([artboard name]); 					  	 					  	 
					}
}

function translateAllArtboardsAndSendTo(context,organization, project,language) {
	var doc = context.document
	var currentPage = [doc currentPage] 
	var pageName = [currentPage name]
	var documentName = [doc displayName]
	var fileId = utils.getFileIdForPage(documentName,currentPage,context)
	log("file Id: " + fileId)
	var translations = downloadFileNSUrlConnection(context,organization.id,project.id,language.id,fileId)
	translate.translatePageWithData(context,currentPage, language.name, translations)
}

function fireError(title,text){
		[app displayDialog:text withTitle:title]
}

function sketchLog(context,string){
	if(utils.getDebugSettingFromComputer(context) == 1)
	{
		NSLog(string)
		errorLogging.write(context,string)
	}
}