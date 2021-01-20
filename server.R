#' VectorPoint 
#' Copyright (c) 2015-2017  VectorPoint team
#' See LICENSE.TXT for details
#' 
#' Server
#' 

#Set the file upload limit to 30 MB (Not Applicable) Dropbox only?
options(shiny.maxRequestSize = 30 * 1024 ^ 2)
set.seed(100)

shinyServer(function(input, output, session) {
  
  #Variables globales
  usernameCheck <- 'Failure'
  #The authenatication system:
  sessionData     <- reactiveValues()
  
  #localidades total
  var_locality <- NULL
  
  observeEvent(input$userLogin,{
    #Almacena TRUE si es un usuario que existe y coincide la contraseña
    loginSuccess <- Login(input$username, input$password)
    
    if("usuario_correcto"==loginSuccess[[1]]) {
      
      usernameCheck <- 'Success'
      
      ###############
      #Leyendo el catchment area
      sessionData$searchdata <- as.data.table(read.csv(paste("catchment_area/",loginSuccess[[3]],".csv", sep = ""), stringsAsFactors = FALSE, sep = " "))
      
      sessionData$searchdata <- sessionData$searchdata[, LATITUDE:=as.double(LATITUDE)] 
      sessionData$searchdata <- sessionData$searchdata[, LONGITUDE:=as.double(LONGITUDE)] 
      sessionData$searchdata <- sessionData$searchdata[, probability:=as.double(probability)]
      
      #Obteniendo solo la columna de unicode
      catchment_area <- as.data.frame(sessionData$searchdata$UNICODE, stringsAsFactors=FALSE)
      
      sessionData$localities <- unique(sessionData$searchdata$codeLoc)
      sessionData$houseId    <- '' #set when the user selects a house
      sessionData$palForRisk <- function(probab){return('#dummy')}
      
    } else if ("clave_incorrecta"==loginSuccess[[1]]) {
      #Mensaje cuando falla la clave ingresada
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "La CLAVE no es la correcta. Por favor inténtelo nuevamente")
      })
      
    } else {
      #Mensaje cuando falla el usuario ingresado
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "El USUARIO no existe. Por favor inténtelo nuevamente")
      })
    }
    
    output$validUser <- renderText({usernameCheck})
    outputOptions(output, 'validUser', suspendWhenHidden = FALSE)  #keeps on top
    
  })
  
  #' Submit of inspection 
  observeEvent(input$inputSubmit, {
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_true")
    #Llenado campos obligatorios
    if (input$P == '' ||
        input$D == '' ||
        input$L == '' ||
        input$V == '' ) {
      observe({
        session$sendCustomMessage(type = 'confirm-message',
                                  message = "El unicode de la vivienda es obligatorio.")
        #output$out <- renderPrint(input$midata)
      })
      #Campo Obs_text de unicode equivocado  
    } else if ( input$observaciones == TRUE && input$obs_unicode == 5 && input$obs_text1=="") {
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "Ingrese el codigo correcto en la caja de texto")
      })
      #Campo Obs_text de unicode equivocado
    } else if ( input$observaciones == TRUE && input$obs_unicode == 8 && input$obs_text2=="") {
      
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "Ingrese la observación sobre el codigo en la caja de texto")
      })
      #Campo tipo de local publico es obligatorio cuando se selecciona LP
    } else if (input$caract_predio=="LP" && input$tipo_lp=="") {
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "Ingrese por favor el tipo de local publico")
      })
      #Campo motivo es obligatorio cuando se selecciona V
    } else if (input$status_inspec == 'V' && input$motivo_volver=="") {
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "Ingrese por favor el motivo por el cual se tiene que volver")
      }) 
      #Campo de texto es obligatorio cuando se selecciona Renuente R6
    } else if (input$status_inspec == 'R' && input$renuente=="R6" && input$renuente_otro=="") {
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "Explique por favor la causa de renuencia")
      }) 
    } else if (input$status_inspec == 'inspeccion' && input$lugar_inspeccion_intra==0 && input$lugar_inspeccion_peri==0) {
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "Ingrese por favor el lugar donde se realizo la inspeccion")
      })
    } else if ( (input$chiris_intra==1 || input$rastros_intra==1) && input$lugar_inspeccion_intra == 0 ) {
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "No puede marcar en chiris o rastros sin haber seleccionado el lugar de inspección adecuado ")
      })
    } else if ( (input$chiris_peri==1 || input$rastros_peri==1) && input$lugar_inspeccion_peri == 0 ) {
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "No puede marcar en chiris o rastros sin haber seleccionado el lugar de inspección adecuado ")
      })
    } else {
      #wishlist: we want to run something like https://github.com/AugustT/shiny_geolocation
      inputData <- recordInspectionFields()
      
      inputData$USER_NAME      = input$username
      inputData$GROUP_NAME     = 'SIN_GRUPO'
      inputData$DATA_ACTION    = 'INSPECTION_NEW'  
      #future: lat and lon during this operation
      
      #record the model-based probability of infestation
      patron <- "1.[0-9]+.[0-9]+[A-z]?.[0-9]+[A-z]"
      if (grepl(patron, inputData$UNI_CODE)) {
        unicode_aux <- substring(inputData$UNI_CODE, 1,nchar(inputData$UNI_CODE)-1)
        PREDICTED_PROBAB <- sessionData$searchdata[UNICODE==unicode_aux, probability]
      } else {
        PREDICTED_PROBAB <- sessionData$searchdata[UNICODE==inputData$UNI_CODE, probability]  
      }
      PREDICTED_PROBAB <- PREDICTED_PROBAB[1] #in case there are multiple matches - wishlist: raise an error
      inputData$PREDICTED_PROBAB      <- PREDICTED_PROBAB
      inputData$PREDICTED_PROBAB_MEAN <- mean(sessionData$searchdata[, probability], na.rm = T) #reference probability for this dataset
      
      inputData$PREDICTED_COLOR       <- which(sessionData$riskColors == sessionData$palForRisk(PREDICTED_PROBAB))
      inputData$PREDICTED_COLOR       <- sessionData$palForRisk(PREDICTED_PROBAB)
      
      inputData$HORA_FIN <- as.character(Sys.time())
      
      save_search_data_mysql(inputData, TABLE_NAME = dbGlobalConfig$inspectionsTable)
      
      observe({
        session$sendCustomMessage(type = 'validation-message',
                                  message = "Los datos fueron GUARDADOS con éxito. Gracias.")
      })
      
      #Cerrando modal
      toggleModal(session, "inputForm", "close")
      
      cleanData()
      
      UpdateMap()
    }
    
    #toggleModal(session, "inputForm")
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_false")
  })
  
  #' Limpiando valores
  observeEvent(input$inputClear, {
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_true")
    cleanData()
    
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_false")
  })
  
  observeEvent(input$enterData,{
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_true")
    
    #Almacena el tiempo en que se empieza a ingresar la información
    date_start <<- Sys.time()
    
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_false")
    #shows the menu ...
    
  })
  
  ## Interactive Map ##
  # Create the map
  output$map <- renderLeaflet({
   #    
   leaflet() %>%
    addTiles()%>%
     addProviderTiles(providers$CartoDB.PositronNoLabels)%>%
   
     setView(
        lng = mean(-71.55001667),
        lat = mean(-16.39249883),
        zoom = 16
      )
  })
  
  # Load the interactive map on click
  observeEvent(input$load, {
    UpdateMap()
  })
  
  observeEvent(input$map_marker_click, {
    #http://stackoverflow.com/questions/28938642/marker-mouse-click-event-in-r-leaflet-for-shiny
    #MAPID_marker_click
    click<-input$map_marker_click
    if(is.null(click)) {
      return()
    }
    sessionData$houseId <- click$id
    output$houseId <- renderText(sessionData$houseId)
    if(!is.null(sessionData$houseId)) {
      session$sendCustomMessage(type = 'click-message',
                                message = toJSON(click, auto_unbox = TRUE, digits = 10))
    }
    
  })
  
  #' when a user selects a house
  observeEvent(sessionData$houseId, {
    if(sessionData$houseId == '') {
      return()
    }
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_true")
    
    PDLV <- base::strsplit(sessionData$houseId, '\\.')[[1]]
    updateTextInput(session, "P", value = PDLV[1])
    updateTextInput(session, "D", value = PDLV[2])
    updateTextInput(session, "L", value = PDLV[3])
    updateTextInput(session, "V", value = PDLV[4])
    
    PREDICTED_PROBAB <- sessionData$searchdata$probability[sessionData$searchdata$UNICODE==sessionData$houseId]
    
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_false")
  })
  
  
  UpdateMap <- function(){
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_true")
    
    var_locality <<- input$locality
    if (is.null(var_locality)) {
      var_locality <<- sessionData$localities
    }
    
    houseinLoc <- getLocalityData()
    
    ## CAUSED PROBLEMS BEFORE, SIMPLE WORKAROUND HERE
    # display best polygon (incentives experiment)
    copy <- sessionData$searchdata#loadSearchData(tableName=groupParameters$DATA_ID)
    dataInspecciones <- findInspecciones(copy)
    sessionData$searchdata <- as.data.table(sessionData$searchdata)
    listTriangulation <- getTriangulation(copy, dataInspecciones)
    polyDF <- listTriangulation[[1]]
    polyVertices <- listTriangulation[[2]]
    
    output$houseId <- renderText({paste("")})
    
    leafletMap <- leafletProxy("map", data = houseinLoc) %>% 
      clearMarkerClusters() %>%
      addTiles() %>% 
      addProviderTiles(providers$CartoDB.PositronNoLabels)%>%
      clearShapes() %>% clearMarkers %>% clearControls() %>%
      setView(
        lng = mean(houseinLoc[, LONGITUDE]),
        lat = mean(houseinLoc[, LATITUDE]),
        
        zoom = 16
      )
    
    for (z in 1:length(polyVertices)) {
      
      leafletMap %>% addPolygons(
        polyVertices[[z]]$y,
        polyVertices[[z]]$x,
        fill=TRUE,
        fillColor="transparent",
        weight=1,
        highlightOptions = highlightOptions(color = "white", weight = 1,
                                            fill=TRUE, fillColor="white",
                                            bringToFront = FALSE, fillOpacity = .4),
        
        
        label = paste0(as.character(polyDF$nHouseUninspect[z])),
        labelOptions = labelOptions(noHide = F, textsize = "15px")
      )
    }
    
    leafletMap %>%
      addCircleMarkers(
        radius = 8
        ,color = sessionData$palForTime(houseinLoc[, time])
        ,stroke = FALSE
        ,fillOpacity = .3#ifelse(groupParameters$CERTAINTY_CLOUD == 1, .3, .0)
      ) %>%
      addCircleMarkers(
        fillColor = YlOrRd.q(houseinLoc[, probability]),
        radius = 4,
        stroke = TRUE,
        color = "black",
        weight = .4,
        fillOpacity = 1,
        layerId = ~ UNICODE,
        popup = paste(
          "<b>", houseinLoc[, UNICODE], "</b><br>",
          #Cambiando color antes era "blue" ahora es "black"
          "Ult. visita:","<b style='color: black;'>", houseinLoc[, inspectionText],"</b>"
        )
      ) %>%
      addLegend(
        "bottomleft",
        colors = sessionData$riskColors,
        labels = sessionData$riskNames,
        opacity = 1,
        title = "Riesgo de Infestacion"
      )
    
    session$sendCustomMessage(type = 'action-message',
                              message = "buscando_false")
    return(leafletMap)  
  }
  
  getLocalityData <- function(){
    
    houseinLoc <- sessionData$searchdata[codeLoc %in% (var_locality)]
    
    #Tiempo (anos) : Colores de blanco hasta gris
    sessionData$palForTime <- colorFactor(c("white","gray90","gray80","gray75","gray70","gray65","gray60","gray55","gray40", "gray30", "gray20"), 
                                          domain = c(0,1,2,3,4,5,6,7,8,9,10))  #years.  wishlist: make this data-dependent with houseinLoc[, time]
    sessionData$palForRisk <- unique_colorQuantile(palette = "YlOrRd", domain=houseinLoc[, probability], n = 5)
    
    sessionData$riskNames  <- c("Mas Bajo", "Bajo", "Medio", "Alto", "Mas Alto")
    sessionData$riskColors <- c("#FFFFB2", "#FECC5C", "#FD8D3C", "#F03B20", "#BD0026") # "#808080" #1..5, NA
    lastInspections <- read_past_inspections(databaseName=dbGlobalConfig$authDatabaseName, UNICODE=houseinLoc$UNICODE)
    lastInspections[,positive:=(TOT_INTRA>0)|(TOT_PERI>0)|(!RASTROS=='0')]
    #wishlist: protect the html from bad data in the fecha field
    
    #Completar el status a palabra entera
    lastInspections[lastInspections$STATUS_INSPECCION == "inspeccion",4] <- "inspección"
    lastInspections[lastInspections$STATUS_INSPECCION == "C",4] <- "cerrada"
    lastInspections[lastInspections$STATUS_INSPECCION == "R",4] <- "renuente"
    lastInspections[lastInspections$STATUS_INSPECCION == "V",4] <- "volver"
    
    lastInspections[, inspectionText:=paste0(FECHA, ': ', STATUS_INSPECCION)]
    #Se quito el color rojo y se puso color negro
    lastInspections[positive==T, inspectionText:=paste0('<font  color="black">', inspectionText, '</font>')]
    
    lastInspections[positive==F, inspectionText:=paste0('<font            >', inspectionText, '</font>')]
    houseinLoc <- merge(houseinLoc, lastInspections[,.(UNICODE,inspectionText)], all.x=T, by='UNICODE')
    houseinLoc[is.na(houseinLoc$inspectionText), inspectionText:='--']
    return(houseinLoc)
  }
  
  #' graba los valores de input durante o despues de inspeccion
  recordInspectionFields <- function() {
    inputData <-
      list(
        #Almacenando campos
        "UNI_CODE" = paste(input$P,input$D,toupper(input$L),toupper(input$V),sep = "."),
        "CODE_LOCALITY" = paste(input$P,input$D,toupper(input$L),sep = "."),
        "OBS_UNICODE" = ifelse(input$observaciones == TRUE,input$obs_unicode, NA),
        "OBS_TEXT" = NA,
        "FECHA" = as.character(input$fecha),
        "CARACT_PREDIO" = input$caract_predio,
        "TIPO_LP" = NA,
        "STATUS_INSPECCION" = NA,
        "ENTREVISTA" = NA,
        "MOTIVO_VOLVER" = NA,
        "RENUENTE" = NA,
        "INTRA_INSPECCION" = NA,
        "INTRA_CHIRIS" = NA,
        "INTRA_RASTROS" = NA,
        "PERI_INSPECCION" = NA,
        "PERI_CHIRIS" = NA,
        "PERI_RASTROS" = NA,
        #eliminar luego de la base de datos, por que ya no se esta usando
        "LUGAR_INSPECCION" = NA,
        #-------------------------
        #eliminar luego
        "TOT_INTRA" = NA,
        "TOT_PERI" = NA,
        "RASTROS" = NA,
        #--------------
        "PERSONAS_PREDIO" = NA,
        
        "CANT_PERROS" = NA,
        "CANT_GATOS" = NA,
        "CANT_AVES_CORRAL" = NA,
        "CANT_CUYES" = NA,
        "CANT_CONEJOS" = NA,
        "TEXT_OTROS" = NA,
        "CANT_OTROS" = NA,
        "TEST_DATA"      = ifelse(input$testData, 1, 0),
        "HORA_INICIO" = as.character(date_start)
      )
    
    #Almacenar obs_text
    if (input$observaciones == TRUE) { 
      if (input$obs_unicode==5) {
        inputData$OBS_TEXT = input$obs_text1
      }else if (input$obs_unicode==8) {
        inputData$OBS_TEXT = input$obs_text2
      }
    }
    
    if(input$caract_predio == 'casa_regular' || input$caract_predio == 'LP' || input$caract_predio == 'DES'){
      inputData$STATUS_INSPECCION <- input$status_inspec
      
      #Si es local publico se pone que tipo es
      if (input$caract_predio == 'LP') {
        inputData$TIPO_LP <- (input$tipo_lp)
      }
      
      #Campo ENTREVISTA
      if(input$status_inspec =='entrevista'){
        inputData$ENTREVISTA <- input$entrevista
      }
      
      #Campo MOTIVOS_VOLVER
      if (input$status_inspec == 'V') {
        inputData$MOTIVO_VOLVER <- input$motivo_volver
      }
      
      #Campo RENUENTE
      if (input$status_inspec == "R") { 
        if (input$renuente=="R6") {
          inputData$RENUENTE = input$renuente_otro
        }else {
          inputData$RENUENTE = input$renuente
        }
      }
      
      if(input$status_inspec == 'inspeccion') {
        #Lugar de inspeccion
        inputData$INTRA_INSPECCION <- as.integer(input$lugar_inspeccion_intra)
        inputData$PERI_INSPECCION <- as.integer(input$lugar_inspeccion_peri)
        
        #Chiris en intra o peri
        inputData$INTRA_CHIRIS <- as.integer(input$chiris_intra)
        inputData$PERI_CHIRIS <- as.integer(input$chiris_peri)
        
        #Rastros en intra o peri
        inputData$INTRA_RASTROS <- as.integer(input$rastros_intra)
        inputData$PERI_RASTROS <- as.integer(input$rastros_peri)
        
        #Personas predio
        inputData$PERSONAS_PREDIO <- (input$personas_predio)
        
        inputData$CANT_PERROS <- 0
        inputData$CANT_GATOS <- 0
        inputData$CANT_AVES_CORRAL <- 0
        inputData$CANT_CUYES <- 0
        inputData$CANT_CONEJOS <- 0
        inputData$TEXT_OTROS <- 0
        inputData$CANT_OTROS <- 0
        
        if (input$perros) {
          inputData$CANT_PERROS <- (input$cant_perros)
        }
        if (input$gatos) {
          inputData$CANT_GATOS <- (input$cant_gatos)
        }
        if (input$aves_corral) {
          inputData$CANT_AVES_CORRAL <- (input$cant_aves_corral)
        }
        if (input$cuyes) {
          inputData$CANT_CUYES <- (input$cant_cuyes)
        }
        if (input$conejos) {
          inputData$CANT_CONEJOS <- (input$cant_conejos)
        }
        if (input$otros) {
          inputData$TEXT_OTROS <- (input$text_otros)
          inputData$CANT_OTROS <- (input$cant_otros)
        }
      }
    }
    return(inputData)
  }
  
  #Funcion para limpiar datos
  cleanData <- function(){
    #Almacena el tiempo en que se empieza a ingresar la información
    date_start <<- Sys.time()
    
    updateNumericInput(session, "P", value = 1)
    updateNumericInput(session, "D", value = "")
    updateTextInput(session, "L", value = "")
    updateTextInput(session, "V", value = "")
    updateCheckboxInput(session,"observaciones", "Observaciones", FALSE)
    updateSelectInput(session, "obs_unicode", selected = "1")
    updateTextAreaInput(session, "obs_text1", value = "")
    updateTextAreaInput(session, "obs_text2", value = "")
    updateDateInput(session, "fecha", value = Sys.Date())
    updateSelectInput(session, "caract_predio", selected = "casa_regular")
    updateTextInput(session, "tipo_lp", value = "")
    updateSelectInput(session, "status_inspec", selected = "C")
    updateRadioButtons(session, "entrevista", selected = "cree_no_tiene")
    updateTextAreaInput(session, "motivo_volver", value = "")
    updateTextAreaInput(session, "renuente_otro", value = "")
    updateCheckboxInput(session,"lugar_inspeccion_intra", NULL, FALSE)
    updateCheckboxInput(session,"lugar_inspeccion_peri", NULL, FALSE)
    updateCheckboxInput(session,"chiris_intra", NULL, FALSE)
    updateCheckboxInput(session,"chiris_peri", NULL, FALSE)
    updateCheckboxInput(session,"rastros_intra", NULL, FALSE)
    updateCheckboxInput(session,"rastros_peri", NULL, FALSE)
    updateNumericInput(session, "personas_predio", value = 1)
    updateCheckboxInput(session,"perros", "Perros", FALSE)
    updateCheckboxInput(session,"gatos", "Gatos", FALSE)
    updateCheckboxInput(session,"aves_corral", "Aves de corral", FALSE)
    updateCheckboxInput(session,"cuyes", "Cuyes", FALSE)
    updateCheckboxInput(session,"conejos", "Conejos", FALSE)
    updateCheckboxInput(session,"otros", "Otros", FALSE)
    
    #Esto es para que el ingreso de datos sea mas rapido.
    updateNumericInput(session, "cant_perros", value = 1)
    updateNumericInput(session, "cant_gatos", value = 1)
    updateNumericInput(session, "cant_aves_corral", value = 1)
    updateNumericInput(session, "cant_cuyes", value = 1)
    updateNumericInput(session, "cant_conejos", value = 1)
    updateTextInput(session, "text_otros", value = "")
    updateNumericInput(session, "cant_otros", value = 1)
    #Limpiando prueba
    #updateCheckboxInput(session, "testData", "Prueba", FALSE)
  }
  
  #Desconectar
  observeEvent(input$logout,{
    
    updateTextInput(session, "username", value = "")
    updateTextInput(session, "password", value = "")
    
    cleanData()
    
    #output$map <- renderLeaflet({
    #  leaflet() %>%  clearMarkerClusters() %>%
    #    clearShapes() %>% clearMarkers %>% clearControls()
    #})
    
    session$sendCustomMessage(type = 'clear-polygons',
                              message = 'true')
    
    output$houseId <- renderText({paste("")})
    output$validUser <- renderText({""})
  })
  #Salir
  observeEvent(input$quit,{
    updateTextInput(session, "username", value = "")
    updateTextInput(session, "password", value = "")
    
    cleanData()
    
    #output$map <- renderLeaflet({
    #  leaflet() %>%  clearMarkerClusters() %>%
    #    clearShapes() %>% clearMarkers %>% clearControls()
    #})
    
    session$sendCustomMessage(type = 'clear-polygons',
                              message = 'true')
    
    output$houseId <- renderText({paste("")})
    output$validUser <- renderText({""})
  })  
  
 })