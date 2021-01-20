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
});
