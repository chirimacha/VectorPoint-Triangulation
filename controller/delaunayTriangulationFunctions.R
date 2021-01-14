# Delaunay triangulation functions
# Justin Sheen December 7, 2017

# Find inspecciones
findInspecciones <- function(data) {
  
  cutoff <- Sys.Date()-365
  
  # Inspecciones
  insp <- read.csv("files/inspections_AQP_ALL_DISTRICTS.csv")
  insp <- data.frame(lapply(insp, as.character), stringsAsFactors=FALSE)
  insp <- as.data.table(insp)
  insp$UNICODE <- as.character(insp$UNICODE)
  insp$UNICODE <- gsub(' ', '', insp$UNICODE)
  insp$FECHA <- as.character(insp$FECHA)
  insp$FECHA <- gsub(' ', '', insp$FECHA)
  insp$INSP_COMPLETA <- as.character(insp$INSP_COMPLETA)
  insp$INSP_COMPLETA <- gsub(' ', '', insp$INSP_COMPLETA)
  
  # Encuestas
  encuestas <- read.csv("files/TODO LOS DISTRITOS ENCUESTAS MINSA.csv")
  encuestas <- as.data.table(encuestas)
  encuestas$UNICODE <- as.character(encuestas$UNICODE)
  encuestas$UNICODE <- gsub(' ', '', encuestas$UNICODE)
  encuestas$FECHA <- as.character(encuestas$FECHA)
  encuestas$FECHA <- gsub(' ', '', encuestas$FECHA)
  encuestas$INSP_COMPLETA <- as.character(encuestas$INSP_COMPLETA)
  encuestas$INSP_COMPLETA <- gsub(' ', '', encuestas$INSP_COMPLETA)
  
  # Inspecciones nuevas
  inspN <- read.csv("files/Inspecciones 2017 - INSPECCIONES.csv")
  inspN <- as.data.table(inspN)
  inspN$UNICODE <- as.character(inspN$UNICODE)
  inspN$UNICODE <- gsub(' ', '', inspN$UNICODE)
  inspN$FECHA <- as.character(inspN$FECHA)
  inspN$FECHA <- gsub(' ', '', inspN$FECHA)
  inspN$INSP_COMPLETA <- as.character(inspN$INSP_COMPLETA)
  inspN$INSP_COMPLETA <- gsub(' ', '', inspN$INSP_COMPLETA)
  
  # Active data
  LoadDataAPP <- function(databaseName = "Demo", tableName="APP_INSPECTIONS_DEMO") {
    #Esta funcion retorna un los datos que se ingresaron en el APP
    #
    #ARGS
    # databaseName = Nombre de la base de datos
    # tableName = Nombre de la tabla
    #
    #RETURNS
    # datos_app = datos ingresados por los usuarios en campo al APP
    #
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
    #Desconectarnos de la base de datos
    on.exit(dbDisconnect(db))
    # Construct the fetching query
    query <- sprintf("SELECT * FROM %s", tableName)
    # Submit the fetch query and disconnect
    datos_app <- dbGetQuery(db, query)
    
    return(datos_app)
  }
  activedata <- LoadDataAPP()
  activedata$FECHA <- as.character(activedata$FECHA)
  activedata$FECHA <- gsub(' ', '', activedata$FECHA)
  activedata$UNI_CODE <- as.character(activedata$UNI_CODE)
  activedata$UNI_CODE <- gsub(' ', '', activedata$UNI_CODE)
  activedata$STATUS_INSPECCION <- as.character(activedata$STATUS_INSPECCION)
  activedata$STATUS_INSPECCION <- gsub(' ', '', activedata$STATUS_INSPECCION)
  activedata$TEST_DATA <- as.character(activedata$TEST_DATA)
  activedata$TEST_DATA <- gsub(' ', '', activedata$TEST_DATA)
  
  setDF(data) # for avoiding error of subsetting below
  
  keep <- c("UNICODE", "LATITUDE", "LONGITUDE")
  data <- data[keep]
  data$UNICODE <- as.character(data$UNICODE)
  data$UNICODE <- gsub(' ', '', data$UNICODE)
  
  data$inspected <- FALSE
  
  for (i in 1:nrow(data)) {
    toCheck <- which(data$UNICODE[i] == insp$UNICODE)
    if (length(toCheck) != 0) {
      for (j in 1:length(toCheck)) {
        if (!is.na(insp$FECHA[toCheck[j]]) & insp$FECHA[toCheck[j]] != "" &
            !is.na(insp$INSP_COMPLETA[toCheck[j]]) & insp$INSP_COMPLETA[toCheck[j]] == "1") {
          
          date <- as.Date(insp$FECHA[toCheck[j]], '%m/%d/%y')
       
          if (!is.na(date) & date > as.Date(cutoff,'%m/%d/%Y')) {

            data$inspected[i] <- TRUE
          }
        }
      }
    }
  }
  
  for (k in 1:nrow(data)) {
    toCheck <- which(data$UNICODE[k] == encuestas$UNICODE)
    if (length(toCheck) != 0) {
      for (l in 1:length(toCheck)) {
        if (!is.na(encuestas$FECHA[toCheck[l]]) & encuestas$FECHA[toCheck[l]] != "" & 
            !is.na(encuestas$INSP_COMPLETA[toCheck[l]]) & encuestas$INSP_COMPLETA[toCheck[l]] == "1") {
          
          date <- as.Date(encuestas$FECHA[toCheck[l]], '%m/%d/%y')

          if (!is.na(date) & date > as.Date(cutoff,'%m/%d/%Y')) {

            data$inspected[k] <- TRUE
          }
        }
      }
    }
  }
  
  for (m in 1:nrow(data)) {
    toCheck <- which(data$UNICODE[m] == inspN$UNICODE)
    if (length(toCheck) != 0) {
      for (n in 1:length(toCheck)) {
        if (!is.na(inspN$FECHA[toCheck[n]]) & inspN$FECHA[toCheck[n]] != "" & 
            !is.na(inspN$INSP_COMPLETA[toCheck[n]]) & inspN$INSP_COMPLETA[toCheck[n]] == "1") {
          
          date <- as.Date(inspN$FECHA[toCheck[n]], '%m/%d/%y')
          
          if (!is.na(date) & date > as.Date(cutoff,'%m/%d/%Y')) {

            data$inspected[m] <- TRUE
          }
        }
      }
    }
  }
  
  for (o in 1:nrow(data)) {
    toCheck <- which(data$UNICODE[o] == activedata$UNI_CODE)
    if (length(toCheck) != 0) {
      for (p in 1:length(toCheck)) {
        if (activedata$TEST_DATA[toCheck[p]] != "1" &
            !is.na(activedata$FECHA[toCheck[p]]) & activedata$FECHA[toCheck[p]] != "" & 
            !is.na(activedata$STATUS_INSPECCION[toCheck[p]]) & (as.character(activedata$STATUS_INSPECCION[toCheck[p]]) == "inspeccion" | as.character(activedata$STATUS_INSPECCION[toCheck[p]]) == "I") 
            ) {
          
          date <- as.Date(activedata$FECHA[toCheck[p]], '%Y-%m-%d')
          
          if (is.na(date)) {
            date <- as.Date(activedata$FECHA[toCheck[p]], '%m/%d/%Y')
          }
          
          if (!is.na(date) & date > as.Date(cutoff,'%m/%d/%Y')) {

            data$inspected[o] <- TRUE
          }
        }
      }
    }
  }

  data <- data[which(data$inspected == TRUE),]
  
  return(data)
}

# Get tessellation
getTessellation <- function(SZ, SZ_inspected) {
  # Extend tessellation tiles to the edges of the graph by getting max lat and long
  maxLat <- max(as.numeric(SZ$LATITUDE))
  maxLong <- max(as.numeric(SZ$LONGITUDE))
  minLat <- min(as.numeric(SZ$LATITUDE))
  minLong <- min(as.numeric(SZ$LONGITUDE))
  
  if (nrow(SZ_inspected) == 0) { # if there are no inspecciones
    
    SZ_inspected <- data.frame(matrix(ncol = 4, nrow = 1))
    colnames(SZ_inspected) <- c("UNICODE", "LATITUDE", "LONGITUDE", "inspected")
    SZ_inspected$UNICODE[1] <- "maxLatmaxLong"
    SZ_inspected$LATITUDE[1] <- maxLat
    SZ_inspected$LONGITUDE[1] <- maxLong
    SZ_inspected$inspected[1] <- TRUE
    
    SZ_inspected <- rbind(SZ_inspected, list("maxLatminLong", maxLat, minLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("minLatmaxLong", minLat, maxLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("minLatminLong", minLat, minLong, TRUE))
    
  } else { # if there are inspecciones
    
    SZ_inspected <- rbind(SZ_inspected, list("maxLatmaxLong", maxLat, maxLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("maxLatminLong", maxLat, minLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("minLatmaxLong", minLat, maxLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("minLatminLong", minLat, minLong, TRUE))
    
  }
  
  # Tessellation
  vtess <- deldir(SZ_inspected$LATITUDE, SZ_inspected$LONGITUDE)
  tilel <- tile.list(vtess)
  
  # Assign each house to a polygon
  df <- data.frame(matrix(ncol = 2, nrow = length(tilel)))
  colnames(df) <- c("polyNum", "nHouseUninspect")
  for (j in 1:length(tilel)) {
    df$polyNum[j] <- tilel[[j]][1] 
    polyVertices <- tilel[[j]][3:4]
    count <- 0
    for (k in 1:nrow(SZ)) {
      if (as.character(SZ$UNICODE[k]) %in% as.character(SZ_inspected$UNICODE)) {
        # do nothing
      } else {
        if (point.in.polygon(SZ$LATITUDE[k], SZ$LONGITUDE[k], polyVertices$x, polyVertices$y)) {
          count <- count + 1
        }
      }
    }
    df$nHouseUninspect[j] <- count
  }
  
  # Return dataframe and polygon list
  toReturn <- list(df, tilel)
  
  return(toReturn)
}


# Get triangulation
getTriangulation <- function(SZ, SZ_inspected) {

  # Extend triangulation tiles to the edges of the graph by getting max lat and long
  maxLat <- max(as.numeric(SZ$LATITUDE)) + 0.00001
  maxLong <- max(as.numeric(SZ$LONGITUDE)) + 0.00001
  minLat <- min(as.numeric(SZ$LATITUDE)) - 0.00001
  minLong <- min(as.numeric(SZ$LONGITUDE)) - 0.00001
  
  if (nrow(SZ_inspected) == 0) { # if there are no inspecciones

    SZ_inspected <- data.frame(matrix(ncol = 4, nrow = 1))
    colnames(SZ_inspected) <- c("UNICODE", "LATITUDE", "LONGITUDE", "inspected")
    SZ_inspected$UNICODE[1] <- "maxLatmaxLong"
    SZ_inspected$LATITUDE[1] <- maxLat
    SZ_inspected$LONGITUDE[1] <- maxLong
    SZ_inspected$inspected[1] <- TRUE

    SZ_inspected <- rbind(SZ_inspected, list("maxLatminLong", maxLat, minLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("minLatmaxLong", minLat, maxLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("minLatminLong", minLat, minLong, TRUE))

  } else { # if there are inspecciones

    SZ_inspected <- rbind(SZ_inspected, list("maxLatmaxLong", maxLat, maxLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("maxLatminLong", maxLat, minLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("minLatmaxLong", minLat, maxLong, TRUE))
    SZ_inspected <- rbind(SZ_inspected, list("minLatminLong", minLat, minLong, TRUE))

  }
  
  # Triangulation
  vtess <- deldir(SZ_inspected$LATITUDE, SZ_inspected$LONGITUDE)
  triangl <- triang.list(vtess)
  
  # Assign each house to a polygon
  df <- data.frame(matrix(ncol = 2, nrow = length(triangl)))
  colnames(df) <- c("polyNum", "nHouseUninspect")
  for (j in 1:length(triangl)) {
    df$polyNum[j] <- triangl[[j]][1] 
    polyVertices <- triangl[[j]][2:3]
    count <- 0
    for (k in 1:nrow(SZ)) {
      if (as.character(SZ$UNICODE[k]) %in% as.character(SZ_inspected$UNICODE)) {
        # do nothing
      } else {
        if (point.in.polygon(SZ$LATITUDE[k], SZ$LONGITUDE[k], polyVertices$x, polyVertices$y)) {
          count <- count + 1
        }
      }
    }
    df$nHouseUninspect[j] <- count
  }
  
  # Return dataframe and polygon list
  toReturn <- list(df, triangl)
  
  return(toReturn)
}