LoginForm <- div(
  id = "login",
  class = "panel",
  draggable = FALSE,
  align="center",
  left = "auto",
  bottom = "auto",
  width = "auto",
  height = "auto",
  h3('VectorPoint\n'),
  #h4('Version 1.0\n'),
  h5(Sys.Date()),
  textInput("username", label = NULL, placeholder = "Usuario"),
  passwordInput("password", label = NULL, placeholder = "Contraseña"),
  actionButton("userLogin","Entrar")
)