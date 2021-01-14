ReportUserView <- bsModal(
  "inputReportUser",
  h3("Información del día"),
  "reportUser",
  size = "large",
  fluidRow(
    column(6,
           h4("Viviendas para volver hoy:"),
           class = "viv-volver",
           tableOutput("viv_volver")
    ),
    column(6,
           h4("Viviendas ingresadas hoy:"),
           class = "viv-ingresadas",
           tableOutput("viv_ingresadas")
    )
  )
)