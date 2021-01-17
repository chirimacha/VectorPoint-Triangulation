############# Risk Utilization##########
########################################
library(data.table)
library(MASS)

######## Socabaya Trial ################

df<-read.csv("~/VectorPoint-Triangulation/Paper Supplementary data/data/SocabayaTrialInspecciones.csv")
df$HouseRiskLevel = factor(df$HouseRiskLevel,
                       ordered = TRUE)
df$Inspector<-as.factor(df$Inspector)
df$Arm <- factor(df$Arm,levels = c("C", "A", "B", "D"))
df$TotalInspections<-as.numeric(df$TotalInspections)

model.polr.soc<-polr(HouseRiskLevel~Arm,
                   data = df,
                   weights =TotalInspections , Hess = TRUE)
summary(model.polr.soc)
model.polr.soc$coefficients
model.polr.soc$zeta
ctable<-glm_coef(model.polr.soc)

######## Cayma Trial ##############
df<-read.csv("~/VectorPoint-Triangulation/Paper Supplementary data/data/CaymaTrialInspecciones.csv")
df$HouseRiskLevel = factor(df$HouseRiskLevel,
                           ordered = TRUE)
df$Inspector<-as.factor(df$Inspector)
df$Arm <- factor(df$Arm,levels = c("B", "A"))
df$TotalInspections<-as.numeric(df$TotalInspections)

model.polr.cay<-polr(HouseRiskLevel~Arm,
                     data = df,
                     weights =TotalInspections , Hess = TRUE)
summary(model.polr.cay)
model.polr.cay$coefficients
model.polr.cay$zeta
ctable<-glm_coef(model.polr.cay)

######## JLByR Trial ##############
df<-read.csv("~/VectorPoint-Triangulation/Paper Supplementary data/data/JLByRTrialInspecciones.csv")
df$HouseRiskLevel = factor(df$HouseRiskLevel,
                           ordered = TRUE)
df$Inspector<-as.factor(df$Inspector)
df$Arm <- factor(df$Arm,levels = c("B", "A"))
df$TotalInspections<-as.numeric(df$TotalInspections)

model.polr.jlb<-polr(HouseRiskLevel~Arm,
                     data = df,
                     weights =TotalInspections , Hess = TRUE)
summary(model.polr.jlb)
model.polr.jlb$coefficients
model.polr.jlb$zeta
ctable<-glm_coef(model.polr.jlb)

######## Miraflores Trial ##############
df<-read.csv("~/VectorPoint-Triangulation/Paper Supplementary data/data/MirafloresTrialInspecciones.csv")
df$HouseRiskLevel = factor(df$HouseRiskLevel,
                           ordered = TRUE)
df$Inspector<-as.factor(df$Inspector)
df$Arm <- factor(df$Arm,levels = c("B", "A"))
df$TotalInspections<-as.numeric(df$TotalInspections)

model.polr.mir<-polr(HouseRiskLevel~Arm,
                     data = df,
                     weights =TotalInspections, Hess = TRUE)
summary(model.polr.mir)
model.polr.mir$coefficients
model.polr.mir$zeta
ctable<-glm_coef(model.polr.mir)


