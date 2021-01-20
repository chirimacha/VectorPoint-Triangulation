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
library(shinyjs)#Para activar funcion click

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
    source("view/DataEntryForm.R")
    source("view/MapView.R")

shinyUI(fluidPage(
  mainPanel(
    tags$head(tags$script(src="custom.js")),
    " ",
    conditionalPanel(
      "output.validUser != 'Success'",
      
      #Formulario para ingreso de usuario
      LoginForm
      
    ),
    conditionalPanel(
      "output.validUser == 'Success'",
      
      #Formulario para ingreso de usuario
      DataEntryForm,
      MapView
      
    )
  )#---mainPanel
))

