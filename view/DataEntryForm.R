DataEntryForm <- bsModal(
  "inputForm",
  "Detalles de búsqueda",
  "enterData",
  size = "large",
  #HTML("Please enter the search details"),
  
  #------ Agregado por Gian --------------
  #textOutput("out"),
  fluidRow(
    column(3,
           class = "provincia",
           #Intervalo de Provincia del 1 - 8, Arequipa
           numericInput("P", "Provincia*", value = 1, min = 1, max = 8)),
    column(3,
           class = "distrito",
           #Intervalo Localidad 1- 99
           numericInput("D", "Distrito*", value = "", min = 1, max = 99)),
    column(3,
           class = "localidad",
           textInput("L", "Localidad*")),
    column(3,
           class = "vivienda",
           textInput("V", "Vivienda*"))    
  ),
  checkboxInput("observaciones", "Observaciones", FALSE),
  conditionalPanel(
    condition = "input.observaciones == true",
    selectInput("obs_unicode", NULL, 
                choices = list("1) Una casa con mas de un código" = 1,
                               "2) Una casa con un código pero dividida en departamentos" = 2,
                               "3) Vivienda sin código" = 3, 
                               "4) Dos casas distintas con el mismo código" = 4,
                               "5) Código equivocado" = 5,
                               "6) Código del mapa que no se encuentra en campo" = 6,
                               "7) Código en campo que no se encuentra en el mapa" = 7,
                               "8) Otro"=8
                ),
                selected = 1
    ),
    conditionalPanel(
      condition = "input.obs_unicode == 5",
      textAreaInput("obs_text1",NULL, placeholder = "Ingrese el código correcto ...", rows = 1)
    ),
    conditionalPanel(
      condition = "input.obs_unicode == 8",
      textAreaInput("obs_text2",NULL, placeholder = "Describa su opción ...")
    )
  ),
  hr(),
  fluidRow(
    column(6,
           class = "fecha",
           dateInput("fecha", "Fecha*")),
    column(6,
           class = "caract_predio",
           selectInput("caract_predio", "Características del predio*", 
                       choices = list("Deshabitada" = "DES","Casa regular" = "casa_regular", "Lote vacío" = "LV", "Local público" = "LP"), 
                       selected = "casa_regular"))
  ),
  conditionalPanel(
    condition = "input.caract_predio == 'LP'",
    textInput("tipo_lp", "Tipo Local Público*")
  ),
  conditionalPanel( 
    condition = "input.caract_predio == 'casa_regular' || input.caract_predio == 'LP' || input.caract_predio == 'DES'",
    selectInput("status_inspec", "Estado de la Inspeccíon*",  
                choices = list("Cerrada" = "C", "Renuente" = "R", "Volver" = "V", "Entrevista" = "entrevista", "Inspección" = "inspeccion"), 
                selected = "C"),
    conditionalPanel(
      condition = "input.status_inspec == 'entrevista'",
      radioButtons("entrevista", "Entrevista",
                   choices = list("Cree que no tiene" = "cree_no_tiene", "Cree que si tiene" = "cree_si_tiene", "No sabe" = "no_sabe"), 
                   selected = "cree_no_tiene")
    ),
    conditionalPanel(
      condition = "input.status_inspec == 'V'",
      textAreaInput("motivo_volver", "Motivo", value = "", cols = 4, placeholder = "Escribe aqui el motivo ...")
    ),
    conditionalPanel(
      condition = "input.status_inspec == 'R'",
      selectInput("renuente", NULL, 
                  choices = list("R1) No tiene tiempo trabaja" = "R1",
                                 "R2) Desconfianza" = "R2",
                                 "R3) Casa limpia" = "R3", 
                                 "R4) Inquilinos" = "R4",
                                 "R5) No da ningun motivo"="R5",
                                 "R6) Otro"="R6"
                  ),
                  selected = 1
      ),
      conditionalPanel(
        condition = "input.renuente == 'R6'",
        textAreaInput("renuente_otro",NULL, placeholder = "Describa su opción ...")
      )
    ),
    conditionalPanel(
      condition = "input.status_inspec == 'inspeccion'",
      fluidRow(
        class = "tabla",
        column(3,
               class = "opciones",
               h6("OPCIONES"),
               h5("INTRA"),
               h5("PERI")
        ),
        column(3,
               class = "lugar_inspeccion",
               h5("Lugar Inspección*"),
               checkboxInput("lugar_inspeccion_intra", NULL, FALSE),
               checkboxInput("lugar_inspeccion_peri", NULL, FALSE)
        ),
        column(3,
               class = "chiris",
               h5("Chiris"),
               checkboxInput("chiris_intra", NULL, FALSE),
               checkboxInput("chiris_peri", NULL, FALSE)
        ),
        column(3,
               class = "rastros",
               h5("Rastros"),
               checkboxInput("rastros_intra", NULL, FALSE),
               checkboxInput("rastros_peri", NULL, FALSE)
        )
      ),
      #Intervalo de 1 a 100 personas
      numericInput("personas_predio", "Cuántas personas viven en el predio?", value = 1,  min = 1, max = 100),
      
      fluidRow(
        class = "animales-opt",
        column(12,
               h5("Qué animales hay?"),
               checkboxInput("perros", "Perros", FALSE),
               checkboxInput("gatos", "Gatos", FALSE),
               checkboxInput("aves_corral", "Aves de corral", FALSE),
               checkboxInput("cuyes", "Cuyes", FALSE),
               checkboxInput("conejos", "Conejos", FALSE),
               checkboxInput("otros", "Otros", FALSE)
        )
      ),
      fluidRow(
        class = "animales-cant",
        column(2,
               conditionalPanel(
                 condition = "input.perros== true",
                 numericInput("cant_perros", NULL, value = 1, min = 1, max = 100)
               )
        ),
        column(2,
               conditionalPanel(
                 condition = "input.gatos== true",
                 numericInput("cant_gatos", NULL, value = 1, min = 1, max = 100)
               )
        ),
        column(2,
               conditionalPanel(
                 condition = "input.aves_corral== true",
                 numericInput("cant_aves_corral",NULL, value = 1, min = 1, max = 100)
               )
        ),
        column(2,
               conditionalPanel(
                 condition = "input.cuyes== true",
                 numericInput("cant_cuyes",NULL, value = 1, min = 1, max = 100)
               )
        ),
        column(2,
               conditionalPanel(
                 condition = "input.conejos== true",
                 numericInput("cant_conejos", NULL, value = 1, min = 1, max = 100)
               )
        ),
        column(2,
               conditionalPanel(
                 condition = "input.otros== true",
                 textInput("text_otros", NULL),
                 numericInput("cant_otros",NULL, value = 1, min = 1, max = 100)
               )
        )
      )
    )
  ),
  #---------------------------------------
  HTML("</b>"),
  actionButton("inputSubmit", "Enviar")#,
  #actionButton("inputCacheInspection",  "Conservar(*)"),
  #actionButton("inputClear",  "Limpiar")
)