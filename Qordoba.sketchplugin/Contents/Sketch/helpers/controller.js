var controller = {
	"translatePages": function(all,organization,project,language, context){
		var doc = context.document
		if(!project || !language || !organization){
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
	},
	"uploadPages": function(all, organization,project, context){
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
}
