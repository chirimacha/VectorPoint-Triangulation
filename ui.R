#' VectorPoint 
#' Copyright (c) 2015-2017  VectorPoint team
#' See LICENSE.TXT for details
#' 
#' User Interface

#Paquetes utilizados en la aplicacion
library(shiny)
library(datasets)
library(RColorBrewer)
library(leaflet)
library(htmltools)
library(lattice)
library(dplyr)
#library(rgdal)
library(rdrop2)
library(data.table)
library(RMySQL)
library(shinyjs)
library(deldir)
library(sp)
library(data.table)
library(DBI)
library(shinyBS)
library(shinythemes)
library(jsonlite)

#Codigo externo utilizado
  #Server.R
    #Funciones utilizadas
    source("controller/loadSaveMethods.R")
    #Colores
    source("controller/palettes.R")
    #Triangulacion
    source("controller/delaunayTriangulationFunctions.R")
  #Ui.R
    source("view/LoginForm.R")
    source("view/ConnectionNetworkView.R")
    source("view/DataEntryForm.R")
    source("view/MapView.R")
    source("view/ReportUserView.R")
    source("view/ReportAdminView.R")

shinyUI(fluidPage(
  mainPanel(
    tags$head(tags$script(src="custom.js")),
    tags$head(tags$script(src="gomap.js")),
    tags$head(tags$script(src="leaflet-offline.js")),
    tags$head(tags$script(src="localforage.js")),
    tags$head(tags$script(src="localforage-startswith.js")),
    tags$head(tags$script(src="delaunator.js")),
    tags$head(tags$script(src="petm_offline.js")),
    " ",
    conditionalPanel(
      "output.validUser != 'Success'",
      
      #Formulario para ingreso de usuario
      LoginForm
      
    ),
    conditionalPanel(
      "output.validUser == 'Success'",
      
      #Formulario para ingreso de usuario
      ConnectionNetworkView
      
    ),
    conditionalPanel(
      #"output.validUser == 'Success' & output.adminUser != 'Success'",
      "output.networkCheck == 'Success'",
      
      #Formulario para el ingreso de datos
      DataEntryForm,
      
      #Reporte que puede ver el usuario
      ReportUserView,
      
      conditionalPanel(
        "output.validUser == 'Success' & output.adminUser != 'Success'",
        
        #La vista del mapa y botones que interactuan con él
        #MapView
        # Vista general
        tabsetPanel(
          tabPanel(
            h4("Mapa de viviendas"),
            MapView
          ),
          # Administrador
          tabPanel(
            h4("Consolidado")#, 
            #source("view/ConsolidatedView.R")$value       
          ),#----- tabpanel
          #Administrador
          tabPanel(
            h4("Viviendas Volver")#, 
            #Muesta lista de viviendas pendientes para volver
            #source("view/HousesListReturnView.R")$value
          ),#----- tabpanel
          # Administrador
          tabPanel(
            h4("Nombre Localidad")#,
            #source("view/NameLocalityView.R")$value
          ) #----- tabpanel
        )
      )
    ),#---conditionalPanel
    
    #Administrador
    conditionalPanel(
      "output.adminUser == 'Success'",
      ReportAdminView
    ),#---conditionalPanel
    
    textInput("reconnected",NULL),
    textInput("browser_msg",NULL)
    
  )#---mainPanel
))

