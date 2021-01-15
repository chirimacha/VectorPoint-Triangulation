#' VectorPoint 
#' Copyright (c) 2015-2017  VectorPoint team
#' See LICENSE.TXT for details
#' 
#' Global settings
library(data.table)
library(png)

userParameters <- NULL

dbGlobalConfig = list(
  "host" = "chirimacha-main.cojvkfkjmqcg.us-west-2.rds.amazonaws.com",
  "port" = 3306,
  "user"             = "",
  "password"         = "",
  "databaseName"     = "",
  "authDatabaseName" = '',    #potentially a separate DB from the databases for data
  
  #Lista de usuario
  "userTable"        = "USERS",
  #Donde se almacenan los datos recolectados en campo
  "inspectionsTable" = 'APP_INSPECTIONS_DEMO',
  
  "simulationsTable" = 'SIM_SEARCHES'
)



