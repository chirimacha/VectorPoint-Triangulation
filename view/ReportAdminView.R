ReportAdminView <- tabsetPanel(
  tabPanel(h4("Información de la base de datos"), 
    fluidRow(
      class= "content-filter",
      column(2,
        class = "filter-start",
        dateInput("filter_start", "Fecha",value = "")
      ),
      column(2,
        class = "btn-filter",
        actionButton("btn_filter", "Filtro")
      ),
      column(2,
        class = "group-1",
        textOutput("casa_regular"),
        textOutput("des")
      ),
      column(2,
        class = "group-2",
        textOutput("lp"),
        textOutput("lv")
      ),
      column(2,
        class = "group-3",
        textOutput("c"),
        textOutput("inspeccion")
      ),
      column(2,
        class = "group-4",
        textOutput("r"),
        textOutput("v")
      )
    ),
    fluidRow(
      class= "num-elements",
      column(12,
        textOutput("num_elements")
      )
    ),
    dataTableOutput("valores")
  )#,#----- tabpanel
  #tabPanel(
  #  h4("Información por localidades"), 
  #  fluidRow(
  #    class= "content-filter",
  #    column(2,
  #      class = "filter-start",
  #      selectizeInput(
  #        "locality2",
  #        "",
  #        choices = NULL,
  #        options = list(placeholder = 'Code Loc')
  #      )
  #    )
  #  )
  #)#----- tabpanel
)#----tabsetpanel