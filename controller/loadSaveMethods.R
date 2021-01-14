#' VectorPoint 
#' Copyright (c) 2015-2017 VectorPoint team
#' See LICENSE.TXT for details
#' 
#' Methods to get and put data
#' - MySQL
#' - csv

# Sources
#homeDir <- path.expand('~')
#source(file.path(homeDir, "PETM-shiny/shiny/controller/global.R"))
source('controller/global.R')

#------
#-Funcion que nos sirve para realizar la coneccion a la base de datos
ConnectionDB <- function(query) {
  db <-
    dbConnect(
      MySQL(),
      host = dbGlobalConfig$host,
      port = dbGlobalConfig$port,
      user = dbGlobalConfig$user,
      password = dbGlobalConfig$password,
      dbname = dbGlobalConfig$databaseName
    )
  #Elimina la coneccion
  on.exit(dbDisconnect(db))
  
  #Se realiza la consulta a la base de datos
  queryResult <- dbGetQuery(db, query)
  
  return(queryResult)
}
#--------

#---------
#- Funcion que nos permite ingresar a la aplicacion
#Login <- function(username, password) {
Login <- function(username, password) {
  
  # Construct the fetching query
  cadena <- sprintf("SELECT * FROM %s WHERE UPPER(NAME_USER) COLLATE latin1_general_cs LIKE UPPER(?id)", dbGlobalConfig$userTable)
  userQuery <- sqlInterpolate(ANSI(), cadena, id=username)
  
  userResult <- ConnectionDB(userQuery)
  
  opcion <- "usuario_incorrecto"
  privileges <- NULL
  catchment_area <- NULL
  sim_searches <- NULL
  
  if(nrow(userResult) > 0) {
    if (userResult$PASSWORD_USER == password) {
      opcion <- "usuario_correcto"
      privileges <- userResult$PRIVILEGES_USER
      catchment_area <- userResult$CATCHMENT_AREA_USER
      sim_searches <- userResult$SIM_SEARCHES_USER
      
    } else {
      opcion <- "clave_incorrecta"
    }
    
  } 
  
  #return(opcion)
  return(list(opcion, privileges, catchment_area, sim_searches))
}

#' Read the time of the last inspection for every house, if any, and the results
#' results are guaranteed not to be NA
read_past_inspections <- function(databaseName=dbGlobalConfig$databaseName, 
                                  UNICODE=NULL, 
                                  TABLE_NAME=dbGlobalConfig$inspectionsTable){
  
  #query <-sprintf("SELECT * FROM %s", TABLE_NAME)
  query <-sprintf("SELECT FECHA, UNI_CODE, USER_NAME, STATUS_INSPECCION, TOT_INTRA, TOT_PERI, RASTROS, PREDICTED_PROBAB, PREDICTED_PROBAB_MEAN FROM %s WHERE TEST_DATA = '0' ORDER BY DATETIME DESC", TABLE_NAME)
  queryResult <- data.table(ConnectionDB(query))
  
  #Ordenando en forma descendente
  queryResult <- queryResult[order(-queryResult$FECHA),]
  
  #Obteniendo uno por cada unicode
  queryResult <- queryResult[which(!duplicated(queryResult$UNI_CODE)),]
  
  queryResult <- queryResult[,.(UNICODE=UNI_CODE, FECHA, USER_NAME, STATUS_INSPECCION, TOT_INTRA=as.numeric(TOT_INTRA), TOT_PERI=as.numeric(TOT_PERI), RASTROS, PREDICTED_PROBAB, PREDICTED_PROBAB_MEAN)]
  
  if(!is.null(UNICODE)) {
    lastInspections <- merge(data.table(UNICODE=UNICODE), queryResult, all.x=T)
    lastInspections[is.na(lastInspections$FECHA), FECHA:='--']
    lastInspections[is.na(lastInspections$TOT_INTRA), TOT_INTRA:=0]
    lastInspections[is.na(lastInspections$TOT_PERI), TOT_PERI:=0]
    lastInspections[is.na(lastInspections$RASTROS), RASTROS:='0']
    return(lastInspections)
  } else {
    return(queryResult)
  }
}

#--------

#' Saves data from the 'Search Details Form' into a table of inspections
save_search_data_mysql <- function(data
                                   , DB_NAME=dbGlobalConfig$databaseName
                                   , TABLE_NAME=dbGlobalConfig$inspectionsTable) {
  
  query <-
    sprintf(
      "INSERT INTO %s (%s) VALUES ('%s')",
      TABLE_NAME,
      paste(names(data), collapse = ", "),
      paste(data, collapse = "', '")
    )
  queryResult <- ConnectionDB(query)
}

#ADMINISTRADOR
#Funcion que me mostrara informacion que existe en la base de datos
load_data_mysql <- function(databaseName, tableName, filterStart=NULL) {
  
  # Connect to the database
  db <-
    dbConnect(
      MySQL(),
      dbname = databaseName,
      host = dbGlobalConfig$host,
      port = dbGlobalConfig$port,
      user = dbGlobalConfig$user,
      password = dbGlobalConfig$password
    )
  on.exit(dbDisconnect(db))
  
  if (is.null(filterStart)){
    # Construct the fetching query
    query <- sprintf("SELECT ID, USER_NAME, UNI_CODE, CODE_LOCALITY, OBS_UNICODE, OBS_TEXT, FECHA, 
                     CARACT_PREDIO, TIPO_LP, STATUS_INSPECCION, ENTREVISTA, MOTIVO_VOLVER, 
                     RENUENTE, INTRA_INSPECCION, INTRA_CHIRIS, INTRA_RASTROS, PERI_INSPECCION, 
                     PERI_CHIRIS, PERI_RASTROS, PERSONAS_PREDIO, CANT_PERROS, CANT_GATOS, 
                     CANT_AVES_CORRAL, CANT_CUYES, CANT_CONEJOS, TEXT_OTROS, CANT_OTROS, 
                     HORA_INICIO, HORA_FIN FROM %s WHERE TEST_DATA=0 order by UNI_CODE", tableName)
  } else {
    query <- sprintf("SELECT ID, USER_NAME, UNI_CODE, CODE_LOCALITY, OBS_UNICODE, OBS_TEXT, FECHA, 
                     CARACT_PREDIO, TIPO_LP, STATUS_INSPECCION, ENTREVISTA, MOTIVO_VOLVER, 
                     RENUENTE, INTRA_INSPECCION, INTRA_CHIRIS, INTRA_RASTROS, PERI_INSPECCION, 
                     PERI_CHIRIS, PERI_RASTROS, PERSONAS_PREDIO, CANT_PERROS, CANT_GATOS, 
                     CANT_AVES_CORRAL, CANT_CUYES, CANT_CONEJOS, TEXT_OTROS, CANT_OTROS, 
                     HORA_INICIO, HORA_FIN FROM %s WHERE TEST_DATA=0 and FECHA='%s' order by UNI_CODE", tableName, filterStart)
  }
  
  # Submit the fetch query and disconnect
  data <- dbGetQuery(db, query)
  
  #data
  return(data)
}
