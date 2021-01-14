// When locator icon in datatable is clicked, go to that spot on the map
$(document).on("click", ".go-map", function(e) {
  e.preventDefault();
  $el = $(this);
  var lat = $el.data("Lat");
  var long = $el.data("Lon");
  var unicode = $el.data("Unicode");
  $($("#nav a")[0]).tab("show");
  Shiny.onInputChange("goto", {
    lat: lat,
    lon: long,
    unicode: unicode,
    nonce: Math.random()
  });
});
