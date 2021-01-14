'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var supports = true;
try { eval('"use strict"; class foo {}'); } catch (e) { supports = false; }
if ('serviceWorker' in navigator && supports) {
  var root = window.location.pathname;
  var scope = root;
  var worker =  root + 'files.js';
  navigator.serviceWorker.register(worker, {scope: scope})
  .then(function(reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

jQuery(document).ready(function () {
  var reconnected = false;
  window.themap = null;
  window.shinyShadow = null;

  if ( $(window).width()<= 767 ) {
    jQuery("div#controls").before('<div class="ver-mas"><</div>');
  
    jQuery(".ver-mas").click(function(){
      if (jQuery(this).text()==="<") {
        jQuery(this).addClass("custom-extend");
        jQuery("#controls").addClass("custom-extend");
        jQuery(this).text(">");
      }
      else {
        jQuery(this).removeClass("custom-extend");
        jQuery("#controls").removeClass("custom-extend");
        jQuery(this).text("<");
      }
      
      jQuery("#load, #gps").toggleClass( "mostrar-inline" );
    });

    /*  Menu  */
    $(".tabbable").prepend( "<div class='img-menu'></div>" );
    $(".img-menu").click(function(){
      $(this).toggleClass("close-menu");
      $(".nav-tabs > li").toggleClass("show-menu");
    });
    $(".nav-tabs > li").click(function(){
      $(".nav-tabs > li").removeClass("show-menu");
      $(".img-menu").removeClass("close-menu");
    });

    $("#buscar").click(function(){
      if ( $(".ver-mas").hasClass("custom-extend") ) {
        $(".ver-mas").removeClass("custom-extend");
        $("#controls").removeClass("custom-extend");
        $(".ver-mas").text("<");
      }
    });
    /**********/
  }

  jQuery("#networkOffline").click(function () {
    $('#buscando').css('display', 'block');
    shinyShadow.getSync(function(response) {
      if (response.status == "success") {
        $('#buscando').css('display', 'none');
        /*shinyShadow.sniffling = true;
        shinyShadow.pattern = "leaflet-calls";
        shinyShadow.stop_pattern = "addLegend";
        shinyShadow.server_offline.loading_seq = true;
        shinyShadow.server_offline.lsmethods.user.loadSeq = [];
        $('#load').click();*/
      } else {
        $('#buscando').css('display', 'none');
      }
    });
  });

  var contador = 0;
  $("#load").click(function(){
    $(".ver-mas").addClass("custom-extend");
    $("#controls").addClass("custom-extend");
    $(".ver-mas").text(">");
    //Leyenda
    $("#map").one('DOMNodeInserted DOMNodeRemoved', '.leaflet-bottom.leaflet-left', function(){
      if (contador===0) {
        $('.leaflet-bottom.leaflet-left').append('<div class="show-legend"><</div>');
        $(".show-legend").click(function(){
          //var clone_popup = $(".leaflet-popup.leaflet-zoom-animated").clone();
          $(this).toggleClass("custom-hide");
          $(".info.legend").toggleClass("custom-hide");
          if (jQuery(this).text()==="<") {
            jQuery(this).text(">");
          } else {
            jQuery(this).text("<");
          }
          //$(".leaflet-pane.leaflet-popup-pane").html(clone_popup);
        });
        if ( $(window).width()<= 767 ) {
          $(".show-legend").css("display","inline-block");    
        }
        contador++;
      }
    })
    $("#controls .selectize-control > .selectize-input > input").attr("placeholder", "Total Loc");
  });


  //Mensaje de validación
  Shiny.addCustomMessageHandler("validation-message", function (message) {
    alert(JSON.stringify(message));
  });
  
  //Mensaje para limpiar el mapa de triangulos y markadores
  Shiny.addCustomMessageHandler("clear-polygons", function (message) {
    Shiny.shinyapp.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"clearShapes","args":[]}]}}}');
    Shiny.shinyapp.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"clearMarkers","args":[]}]}}}');
    Shiny.shinyapp.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"clearControls","args":[]}]}}}');
  });

  //Mensaje de validación
  Shiny.addCustomMessageHandler("confirm-message", function (message) {
    var aux = confirm(JSON.stringify(message));
    Shiny.onInputChange("midata", aux);
  });

  //Mensaje de accion buscar
  Shiny.addCustomMessageHandler("action-message", function (message) {
    var str = message;
    if (str == "buscando_true") {
      $('#buscando').css('display', 'block');
    } else {
      $('#buscando').css('display', 'none');
    }
  });
  
  //Mensaje de click en circulo
  Shiny.addCustomMessageHandler("click-message", function (message) {
    shinyShadow.server_offline.add_coord(message);
  });

  //limpia las acciones, como el presionar de un boton
  //envia las varables de estado que necesita el servidor
  function setReconnectVariables() {
    Shiny.shinyapp.$inputValues["inputSubmit:shiny.action"] = 0;
    Shiny.shinyapp.$inputValues["inputCacheInspection:shiny.action"] = 0;
    Shiny.shinyapp.$inputValues["inputClear:shiny.action"] = 0;
    Shiny.shinyapp.$inputValues["btn_filter:shiny.action"] = 0;
    Shiny.shinyapp.$inputValues["gps:shiny.action"] = 0;

    if (Shiny.shinyapp.$inputValues["load:shiny.action"] > 0) Shiny.shinyapp.$inputValues["load:shiny.action"] = 1;

    Shiny.shinyapp.$inputValues["reconnected"] = "true";
    if (Shiny.shinyapp.$inputValues["userLogin:shiny.action"] == 0) Shiny.shinyapp.$inputValues["reconnected"] = "false";
  }

  window.setTimeout(function () {
    Shiny.shinyapp.reconnect = function () {

      clearTimeout(Shiny.shinyapp.$scheduleReconnect);
      jQuery("#shiny-notification-reconnect .shiny-notification-content-action a").text("Volver a conectar");

      /*if (Shiny.shinyapp.isConnected())
        throw "Attempted to reconnect, but already connected.";
      */

      setReconnectVariables();

      Shiny.shinyapp.$socket = Shiny.shinyapp.createSocket();
      Shiny.shinyapp.$initialInput = $.extend({}, Shiny.shinyapp.$inputValues);
      Shiny.shinyapp.$updateConditionals();

      reconnected = true;
      $('#buscando').css('display', 'none');
      console.log("reconnecting");
    };

    Shiny.shinyapp.$allowReconnect = "true";
    $("#ss-connect-dialog").remove();
    $("#ss-overlay").remove();

    //intercepta la comunicacion apenas iniciado la aplicacion
    shinyShadow = new ShinyInterceptor(Shiny.shinyapp, new Petm(Shiny.shinyapp));
    //shinyShadow.logIntercept();
    shinyShadow.intercept();
    
    var interval_id = setInterval(function() {
      if (Shiny.shinyapp.$inputValues['userLogin:shiny.action'] > 0) {
        clearInterval(interval_id);
        return;
      }
      if (!navigator.onLine || Shiny.shinyapp.$socket == null || Shiny.shinyapp.$socket.readyState == 3 || shinyShadow.state == 'offline') {
        shinyShadow.state = 'offline';
        Shiny.shinyapp.$socket = null;
        shinyShadow.autologin();
        clearInterval(interval_id);
      }
    }, 200);

    Shiny.shinyapp.onDisconnected = function () {
      shinyShadow.state = "offline";
    };
  }, 500);

  $("#reconnected").css("display", "none");

  var node = document.createElement("div");
  node.innerHTML = '<div id="buscando" style="display:none;z-index:9000;position:fixed;top:0;bottom:0;width:100%;background-color:rgba(255,255,255,0.5);"><img class="preloader" src="preloader.gif" style="display: block;margin: 0 auto;"></div>';
  document.getElementsByTagName("body")[0].appendChild(node);
  $("#browser_msg").css("display", "none");
});

//Intercepta el socket hacia shiny para simular la comunicacion cuando 
//se entre en estado offline
//crea un socket adicional para comprobar el estado de la conexion

var ShinyInterceptor = function () {
  function ShinyInterceptor(_shiny, _server) {
    _classCallCheck(this, ShinyInterceptor);

    this.shiny = _shiny;
    this.server_offline = _server;
    this.state = "both";
    var self = this;
    this.sniffling = false;
    this.pattern = "";
    this.stop_pattern = "";
    this.debug = false;
    
    this.server_offline.shiny = {
          $inputValues: this.shiny.$inputValues,
          dispatchMessage: function(msg) {
            if (self.state == "offline") {
              self.shiny.dispatchMessage(msg);
            }
          }
        };
    this.shadow_socket = null;
    this.intercepted = false;

    this._timer_id = 0;
    this._trueSend = null;
    this._trueOnmessage = null;
    this._trueDispatchMessage = null;

    Shiny.addCustomMessageHandler("post-response", function (msg) {
      self._post_handler(msg);
    });
    Shiny.addCustomMessageHandler("post-response-progress", function (msg) {
      self._progress_handler(msg);
    });
    Shiny.addCustomMessageHandler("get-response", function (msg) {
      self._get_handler(msg);
    });
    this._post_callback = null;
    this._get_callback = null;
    this._progress_callback = null;
  }

  _createClass(ShinyInterceptor, [{
    key: 'autologin',
    value: function autologin() {
      var self = this;
      this.server_offline.autologinUser(function(user) {
        if (user != null) {
          self.shiny.dispatchMessage('{"inputMessages":[{"id":"username","message":{"value":"' + user.username + '"}}]}');
          self.shiny.dispatchMessage('{"inputMessages":[{"id":"password","message":{"value":"' + user.password + '"}}]}');
          $('#userLogin').click();
          self.shiny.dispatchMessage('{"values":{"networkCheck":"Success"}}');
        }
      });
    }
  }, {
    key: 'intercept',
    value: function intercept() {
      if (this.intercepted) this.deintercept();
      this._trueSend = this.shiny.sendInput;
      this._trueDispatchMessage = this.shiny.dispatchMessage;
      var self = this;
      this.shiny.sendInput = function (values) {
        self._fakeSend(values, this);
      };
      this.shiny.dispatchMessage = function (msg) {
        self._fakeDispatch(msg, this);
      };
      this._timer_id = setInterval(function () {
        self.reconnect();
      }, 200);
      this.intercepted = true;
    }
  }, {
    key: 'deintercept',
    value: function deintercept() {
      if (this.intercepted) {
        this.intercepted = false;
        this.shiny.sendInput = this._trueSend;

        if (this.shiny.$socket != null) this.shiny.$socket.onmessage = this._trueOnmessage;
        
        if (this._trueDispatchMessage!=null)
          this.shiny.dispatchMessage = this._trueDispatchMessage;

        clearInterval(this._timer_id);
        this._timer_id = 0;
      }
    }
  }, {
    key: 'logIntercept',
    value: function logIntercept() {
      if (this.intercepted) this.deintercept();

      this._trueSend = this.shiny.sendInput;
      var self = this;
      this.shiny.sendInput = function (values) {
        self._logSend(values, this);
      };

      if (this.shiny.$socket != null) {
        this._trueOnmessage = this.shiny.$socket.onmessage;
        this.shiny.$socket.onmessage = function (e) {
          self._logOnmessage(e, this);
        };
      }

      this._timer_id = setInterval(function () {
        self.reconnect();
      }, 1000);
      this.intercepted = true;
    }
  }, {
    key: '_logSend',
    value: function _logSend(values, self) {
      this._trueSend.call(self, values);
      console.log(values);
    }
  }, {
    key: '_logOnmessage',
    value: function _logOnmessage(e, self) {
      this._trueOnmessage.call(self, e);
      console.log(e.data);
    }
  }, {
    key: '_fakeDispatch',
    value: function _fakeDispatch(msg, self) {
      if(this.sniffling) {
        if(msg.includes(this.pattern))
          this.server_offline.addLoadMsg(msg);
        if(msg.includes(this.stop_pattern)) {
          this.sniffling = false;
          this.state = "offline";
          this.server_offline.loading_seq = false;
          $('#buscando').css('display', 'none');
        }
      } else {
        if (msg.includes("preferCanvas")) {
          if (msg.includes("customMap"))
            this._trueDispatchMessage.call(self, msg);
          else
            this.server_offline.map_manager.loadMap(this.server_offline.shiny);
        } else {
          this._trueDispatchMessage.call(self, msg);
        }
        if(this.debug)
          console.log(msg);
      }
    }
  }, {
    key: '_fakeSend',
    value: function _fakeSend(values, self) {
      var msg = {
        method: 'update',
        data: values
      };

      var self2 = this;
      window.setTimeout(function () {
        if(self2.state != "online")
          self2.resolveMsg(msg);
      }, 0);
      
      if (self.$socket != null && self.$socket.readyState == 1 && this.state!="offline")
        self.$sendMsg(JSON.stringify(msg));

      $.extend(self.$inputValues, values);
      self.$updateConditionals();

      if(this.debug)
        console.log(values);
    }
  }, {
    key: '_fakeOnmessage',
    value: function _fakeOnmessage(e, self) {}
  }, {
    key: 'reconnect',
    value: function reconnect() {
      if (!navigator.onLine && this._progress_callback != null) {
        this._progress_handler({status: "success"});
        this._post_handler({status: "browser_offline"});
      }
      if (navigator.onLine && (this.shadow_socket == null || this.shadow_socket.readyState == 3)) {
        
        if (this._progress_callback != null) {
          this._post_handler({status: "server_offline"});
        }
        if (this.shadow_socket != null)
          this.shadow_socket.close();
        this.shadow_socket = this.shiny.createSocket();
        if (this.shadow_socket != null) {
          var self = this;
          this.shadow_socket.onmessage = function (e) {
            if (e.data.includes("custom"))
              self.shiny.dispatchMessage(e.data);
          };
        }
      }
      /*this.postSync(function(response){
        console.log(response);
      });*/
    }
  }, {
    key: 'post',
    value: function post(method, data, callback, progress) {
      if (this.shadow_socket !== null && this.shadow_socket.readyState == 1) {
        this._post_callback = callback;
        this._progress_callback = progress;
        var msg = JSON.stringify({
          method: 'update',
          data: {
            browser_msg: {
              type: 'post',
              method: method,
              data: data
            }
          }
        });
        this.shadow_socket.send(msg);
      } else {
        window.setTimeout(function () {
          callback('offline');
        }, 0);
      }
    }
  }, {
    key: 'get',
    value: function get(method, data, callback) {
      if (this.shadow_socket !== null && this.shadow_socket.readyState == 1) {
        this._get_callback = callback;
        var msg = JSON.stringify({
          method: 'update',
          data: {
            browser_msg: {
              type: 'get',
              method: method,
              data: data
            }
          }
        });
        this.shadow_socket.send(msg);
      } else {
        window.setTimeout(function () {
          callback('offline');
        }, 0);
      }
    }
  }, {
    key: 'postSync',
    value: function postSync(callback,progress) {
      var self = this;
      if (this.server_offline.hasUpdates()) 
        this.post('sync', this.server_offline.getUpdates(), function(response) {
          callback(response);
        }, progress);
      else 
        window.setTimeout(function () {
          callback('no_changes');
        }, 0);
    }
  }, {
    key: 'getSync',
    value: function getSync(callback) {
      var user = { username: this.shiny.$inputValues.username, password: this.shiny.$inputValues['password:shiny.password'] };
      var self = this;
      this.get('sync', user, function (response) {
        if (response.status == 'success') {
          self.server_offline.fillDatabase(user, response,function(status) {
            self.server_offline.userLogin(function() {
              self.state = "offline";
              self.server_offline.map_manager.loadMap(self.server_offline.shiny);
              callback(response);
            });
          });
        } else {
          callback(response);
        }
      });
    }
  }, {
    key: 'sync',
    value: function sync(callback) {
      postSync(function (response) {
        if (response == 'success') {
          getSync(callback);
        } else {
          window.setTimeout(function () {
            callback(response);
          }, 0);
        }
      });
    }
  }, {
    key: 'emptyDatabase',
    value: function emptyDatabase() {
      this.server_offline.emptyDatabase();
    }
  }, {
    key: '_post_handler',
    value: function _post_handler(response) {
      if (this._post_callback != null) {
        this._post_callback(response.status);
        this._post_callback = null;
        this._progress_callback = null;
      }
    }
  }, {
    key: '_progress_handler',
    value: function _progress_handler(response) {
      if (this._progress_callback != null) {
        this._progress_callback(response.status);
      }
    }
  }, {
    key: '_get_handler',
    value: function _get_handler(response) {
      if (this._get_callback != null) {
        this._get_callback(response);
        this._get_callback = null;
      }
    }
  }, {
    key: 'resolveMsg',
    value: function resolveMsg(msg) {
      if (this.status == "offline");
        this.server_offline.resolve(msg);
    }
  }, {
    key: 'onSync',
    value: function onSync(callback) {
      if (this.server_offline.hasUpdates()) {
        var items = this.server_offline.getUpdates();
        if (window.confirm('Enviar '+items.length+' formularios al servidor?')) {
          var counter = 0;
          var total = items.length;
          this.postSync(function(msg) {
            if (msg=="success") {
              shinyShadow.server_offline.dropUpdates();
              alert("Se enviaron "+counter+" formularios de "+total+".");
              callback(true);
            } else if (msg=="browser_offline") {
              shinyShadow.server_offline.lsmethods.saveStore();
              alert("Se enviaron "+counter+" formularios de "+total+" antes de que el browser perdiera conexion a internet.");
              callback(false);
            } else if (msg=="server_offline") {
              shinyShadow.server_offline.lsmethods.saveStore();
              alert("Se enviaron "+counter+" formularios de "+total+" antes de que el servidor dejo de responder.");
              callback(false);
            } else if (msg=="offline") {
              if (shinyShadow.shadow_socket != null) {
                shinyShadow.shadow_socket.close();
                shinyShadow.shadow_socket = null;
              }
              alert("No hay conexion");
              callback(false);
            } else if (msg=="no_changes") {
              alert("No hay datos nuevos");
              callback(true);
            } else {
              alert("Los datos no se pudieron guardar.");
              callback(false);
            }
          }, function(msg) {
            if (msg == "success") {
              counter++;
              items.shift();
            }
          });
        } else {
          callback(false);
        }
      } else {
        callback(true);
      }
    }
  }]);

  return ShinyInterceptor;
}();
