#'
#' code for color palettes
#' 
#' Code adapted from the leaflet package
#' https://github.com/rstudio/leaflet/blob/master/R/colors.R

library(binr)

#unique breaks for colorQuantile
withColorAttr = function(type, args = list(), fun) {
  structure(fun, colorType = type, colorArgs = args)
}

unique_colorQuantile = function(palette, domain, n = 5, 
                                probs = seq(0, 1, length.out = n +1), 
                                na.color = "#808080", alpha = FALSE) { 
  
  if (!is.null(domain)) {
    bins = unique(quantile(domain, probs, na.rm = TRUE, names = FALSE))
    return(withColorAttr(
      'quantile', list(probs = probs, na.color = na.color),
      colorBin(palette, domain = NULL, bins = bins, na.color = na.color,
               alpha = alpha)
    ))
  }
  colorFunc = colorFactor(palette, domain = 1:(length(probs) - 1),
                          na.color = na.color, alpha = alpha)
  withColorAttr('quantile', list(probs = probs, na.color = na.color), function(x) {
    binsToUse = unique(quantile(x, probs, na.rm = TRUE, names = FALSE))
    ints = cut(x, binsToUse, labels = FALSE, include.lowest = TRUE, right = FALSE)
    if (any(is.na(x) != is.na(ints)))
      warning("Some values were outside the color scale and will be treated as NA")
    colorFunc(ints)
  })
}

#Simple 3 level palettes for ggmap
GnYlRd <- rev(brewer.pal(10,"RdYlGn")) 
BuYlRd <- rev(brewer.pal(10,"RdYlBu"))
YlOrRd <- brewer.pal(9, "YlOrRd") 
#YlOrRd <- brewer.pal(9, "RdYlBu") justin probando
Greys  <- brewer.pal(9, "Greys") 
Reds   <- brewer.pal(9,"Reds") 

#Brewer palettes by quantile for leaflet
YlOrRd.q <- unique_colorQuantile(palette = "YlOrRd", NULL, n=5) #FIXME
Greys.q <-unique_colorQuantile(palette = "Greys", NULL, n=10) #FIXME
traffic.q <- unique_colorQuantile(palette = GnYlRd, NULL, n=10) #FIXME
traffic.blue.q <- unique_colorQuantile(palette = BuYlRd, NULL, n=10) #FIXME
Reds.q <- unique_colorQuantile(palette = "Reds", NULL, n=10) #FIXME

#vector of quantile palettes
pals.risk  <- c(YlOrRd.q, traffic.q, traffic.blue.q, Reds.q)
pals.uncertainty <- c(Greys.q, traffic.q)
str.pals.risk  <- c("YlOrRd", "traffic", "traffic.blue", "Reds")
str.pals.uncertainty <- c("Grey", "traffic")

#Brewer palettes by bins for leaflet
YlOrRd.bin <-  colorBin(palette = "YlOrRd", NULL, bins=10) #FIXME
Greys.bin <- colorBin(palette = "Greys", NULL, bins=10) #FIXME
traffic.bin <- colorBin(palette = GnYlRd, NULL, bins=10) #FIXME
traffic.blue.bin <- unique_colorQuantile(palette = BuYlRd, NULL, n=10) #FIXME
Reds.bin <- colorBin(palette = "Reds", NULL, bins=10) #FIXME

#vector of bin palettes
pals.bin.risk  <- c(YlOrRd.bin, traffic.bin, traffic.blue.bin, Reds.bin)
pals.bin.uncertainty <- c(Greys.bin, traffic.bin)
str.pals.bin.risk  <- c("YlOrRd.bin", "traffic.bin", "traffic.blue.bin", "Reds.bin")
str.pals.bin.uncertainty <- c("Greys.bin", "traffic.bin")