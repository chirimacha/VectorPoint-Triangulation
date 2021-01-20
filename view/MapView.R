MapView <- 
  div(
    div(
      class = "outer",
      tags$head(includeCSS("www/css/styles.css")), 
      leafletOutput("map", width = "100%", height = "100%")
    ),#--div
    
    absolutePanel(
      id = "logoutPanel",
      class = "panel panel-default",
      fixed = TRUE,
      draggable = TRUE,
      top = 20,
      left = "auto",
      right = 20,
      bottom = "auto",
      width = "auto",
      height = "auto",
      #actionLink("logout","Desconectar",width = 60)
    ),
    
    absolutePanel(
      id = "controls",
      class = "panel panel-default",
      fixed = TRUE,
      draggable = TRUE,
      top = 200,
      left = "auto",
      right = 20,
      bottom = "auto",
      actionButton(
        "load",
        icon = icon("refresh", "fa-.5x"),
        "",
      ),
      uiOutput('inspectButton'),
      actionButton("enterData", "Entrar Datos"),
      actionButton("quit", "Salir")
  )
)
