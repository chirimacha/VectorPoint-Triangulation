########## Spatial Coverage ##########
######################################

####### Socabaya Trial #############
df<-read.csv("~/VectorPoint-Triangulation/Paper Supplementary data/data/SpatialCoverageSoc.csv")

# C vs A
#normality test
shapiro.test(df$A)
shapiro.test(df$C)
# Paired t-test
t.test(df$A,
       df$C,
       data=df,
       paired = TRUE,
       conf.level = 0.95)

mean(df$A)  
mean(df$C)  

mean(df$B)  
mean(df$D)  
# C vs B
#normality test
shapiro.test(df$B)
# Paired t-test
t.test(df$B,
       df$C,
       data=df,
       paired = TRUE,
       conf.level = 0.95)
# C vs D
#normality test
shapiro.test(df$D)
shapiro.test(df$C)
# Paired t-test
t.test(df$D,
       df$C,
       data=df,
       paired = TRUE,
       conf.level = 0.95)

#comparing coverage A with B
t.test(df$A,
       df$B,
       data=df,
       paired = TRUE,
       conf.level = 0.95)


########### Cayma Trial #######
###############################

df<-read.csv("~/VectorPoint-Triangulation/Paper Supplementary data/data/SpatialCoverageCay.csv")
mean(df$A)  
mean(df$B)  


# B vs A
#normality test
shapiro.test(df$A)#not normal distribution
shapiro.test(df$B)
# Paired t-test
t.test(df$A,
       df$B,
       data=df,
       paired = TRUE,
       conf.level = 0.95)

########### JLByR Trial #######
###############################

df<-read.csv("~/VectorPoint-Triangulation/Paper Supplementary data/data/SpatialCoverageJLByR.csv")
mean(df$A)  
mean(df$B)  


# B vs A
#normality test
shapiro.test(df$A)#not normal distribution
shapiro.test(df$B)
# Paired t-test
t.test(df$A,
       df$B,
       data=df,
       paired = TRUE,
       conf.level = 0.95)


########### Miraflores Trial #######
###############################

df<-read.csv("~/VectorPoint-Triangulation/Paper Supplementary data/data/SpatialCoverageMir.csv")
mean(df$A)  
mean(df$B)  


# B vs A
#normality test
shapiro.test(df$A)#not normal distribution
shapiro.test(df$B)
# Paired t-test
t.test(df$A,
       df$B,
       data=df,
       paired = TRUE,
       conf.level = 0.95)



