'use strict';

angular.module('bahmni.common.conceptSet')
    .directive('conceptSet', ['$rootScope', 'contextChangeHandler', 'appService', 'observationsService', 'messagingService', 'conceptSetService', 'conceptSetUiConfigService', 'spinner', '$q',
        function ($timeout,contextChangeHandler, appService, observationsService, messagingService, conceptSetService, conceptSetUiConfigService, spinner, $q) {
            var controller = function ($scope) {
                var conceptSetName = $scope.conceptSetName;
                var ObservationUtil = Bahmni.Common.Obs.ObservationUtil;
                var conceptSetUIConfig = conceptSetUiConfigService.getConfig();
                var observationMapper = new Bahmni.ConceptSet.ObservationMapper();
                var validationHandler = $scope.validationHandler() || contextChangeHandler;
                var id = "#" + $scope.sectionId;
                var dateUtil = Bahmni.Common.Util.DateUtil;

                $scope.atLeastOneValueIsSet = $scope.atLeastOneValueIsSet || false;
                $scope.conceptSetRequired = false;
                $scope.initialRegimen = "";
                $scope.regimenSwitchSubstitute = [];
                $scope.showTitleValue = $scope.showTitle();
                $scope.numberOfVisits = conceptSetUIConfig[conceptSetName] && conceptSetUIConfig[conceptSetName].numberOfVisits ? conceptSetUIConfig[conceptSetName].numberOfVisits : null;
                $scope.hideAbnormalButton = conceptSetUIConfig[conceptSetName] && conceptSetUIConfig[conceptSetName].hideAbnormalButton;
       
               
               
                var focusFirstObs = function () {
                    if ($scope.conceptSetFocused && $scope.rootObservation.groupMembers && $scope.rootObservation.groupMembers.length > 0) {
                        var firstObs = _.find($scope.rootObservation.groupMembers, function (obs) {
                            return obs.isFormElement && obs.isFormElement();
                        });
                        if (firstObs) {
                            firstObs.isFocused = true;
                        }
                    }
                };

                var updateObservationsOnRootScope = function () {
                    if ($scope.rootObservation) {
                        for (var i = 0; i < $scope.observations.length; i++) {
                            if ($scope.observations[i].concept.uuid === $scope.rootObservation.concept.uuid) {
                                $scope.observations[i] = $scope.rootObservation;
                                return;
                            }
                        }
                        $scope.observations.push($scope.rootObservation);
                    }
                };

                var getObservationsOfCurrentTemplate = function () {
                    return _.filter($scope.observations, function (observation) {
                        return _.toLower(observation.conceptSetName) === _.toLower($scope.rootObservation.concept.name);
                    });
                };

                var getDefaults = function () {
                    var conceptSetUI = appService.getAppDescriptor().getConfigValue("conceptSetUI");

                    if (!conceptSetUI || !conceptSetUI.defaults) {
                        return;
                    }
                    return conceptSetUI.defaults || {};
                };

                var getCodedAnswerWithDefaultAnswerStringRegimen = function (defaults, groupMember, currentRegimen) {
                    var possibleAnswers = groupMember.possibleAnswers;
                    var defaultAnswer = defaults[groupMember.concept.name];
                    var defaultCodedAnswer;
                    if (defaultAnswer instanceof Array) {
                        defaultCodedAnswer = [];
                        _.each(defaultAnswer, function (answer) {
                            defaultCodedAnswer.push(_.find(possibleAnswers, {displayString: answer}));
                        });
                    } else {
                        defaultCodedAnswer = _.find(possibleAnswers, {displayString: currentRegimen});
                    }
                    return defaultCodedAnswer;
                };

                var getCodedAnswerWithDefaultAnswerString = function (defaults, groupMember) {
                    var possibleAnswers = groupMember.possibleAnswers;
                    var defaultAnswer = defaults[groupMember.concept.name];
                    var defaultCodedAnswer;
                    if (defaultAnswer instanceof Array) {
                        defaultCodedAnswer = [];
                        _.each(defaultAnswer, function (answer) {
                            defaultCodedAnswer.push(_.find(possibleAnswers, {displayString: answer}));
                        });
                    } else {
                        defaultCodedAnswer = _.find(possibleAnswers, {displayString: defaultAnswer});
                    }
                    return defaultCodedAnswer;
                };

                var setDefaultsForGroupMembers = function (groupMembers, defaults) {
                    if (defaults) {
                        _.each(groupMembers, function (groupMember) {
                            var conceptFullName = groupMember.concept.name;
                            var present = _.includes(_.keys(defaults), conceptFullName);

                            if (present && groupMember.value == undefined) {
                                if (groupMember.concept.dataType == "Coded") {
                                    setDefaultsForCodedObservations(groupMember, defaults);
                                } else {
                                    groupMember.value = defaults[conceptFullName];
                                }
                            }
                            if (groupMember.groupMembers && groupMember.groupMembers.length > 0) {
                                setDefaultsForGroupMembers(groupMember.groupMembers, defaults);
                                if (groupMember instanceof Bahmni.ConceptSet.ObservationNode && defaults[groupMember.label] && groupMember.abnormalObs && groupMember.abnormalObs.value == undefined) {
                                    groupMember.onValueChanged(groupMember.value);
                                }
                            }
                        });
                    }
                };

                var setDefaultsForCodedObservations = function (observation, defaults) {
                    var defaultCodedAnswer = getCodedAnswerWithDefaultAnswerString(defaults, observation);

                    // TODO : Hack to include functionality for pre-populating ART Regimens - Teboho
                    // Will refactor accordingly
                    var defaultCodedAnswerRegimen = getCodedAnswerWithDefaultAnswerStringRegimen(defaults, observation, $scope.initialRegimen);
                    var defaultCodedAnswerSubsRegimen = "";
                    var regimenSubstitutionValues = { observationDate: "" }, regimenSwitchValues = { observationDate: "" };

                    if ($scope.regimenSwitchSubstitute && $scope.regimenSwitchSubstitute.length > 0) {
                        _.each($scope.regimenSwitchSubstitute, function (treatmentAction) {
                            if (treatmentAction.name == "HIVTC, Name of Substituted Regimen") {
                                regimenSubstitutionValues = {
                                    name: treatmentAction.name,
                                    value: treatmentAction.value,
                                    observationDate: treatmentAction.observationDateTime
                                };
                            } else { // Treatment switch date
                                regimenSwitchValues = {
                                    name: treatmentAction.name,
                                    value: treatmentAction.value,
                                    observationDate: treatmentAction.observationDateTime
                                };
                            }
                        });

                        if (regimenSubstitutionValues.observationDate && regimenSwitchValues.observationDate) {
                            if (dateUtil.isBeforeDate(dateUtil.parseServerDateToDate(regimenSwitchValues.observationDate)
                                , dateUtil.parseServerDateToDate(regimenSubstitutionValues.observationDate))) {
                                defaultCodedAnswerSubsRegimen = getCodedAnswerWithDefaultAnswerStringRegimen(defaults, observation, regimenSubstitutionValues.value);
                            } else {
                                defaultCodedAnswerSubsRegimen = getCodedAnswerWithDefaultAnswerStringRegimen(defaults, observation, regimenSwitchValues.value);
                            }
                        } else if (regimenSubstitutionValues.observationDate && !regimenSwitchValues.observationDate) {
                            defaultCodedAnswerSubsRegimen = getCodedAnswerWithDefaultAnswerStringRegimen(defaults, observation, regimenSubstitutionValues.value);
                        } else if (regimenSwitchValues.observationDate && !regimenSubstitutionValues.observationDate) {
                            defaultCodedAnswerSubsRegimen = getCodedAnswerWithDefaultAnswerStringRegimen(defaults, observation, regimenSwitchValues.value);
                        }
                    }

                    if (observation.isMultiSelect) {
                        if (!observation.hasValue()) {
                            _.each(defaultCodedAnswer, function (answer) {
                                observation.selectAnswer(answer);
                            });
                        }
                    } else if (!(defaultCodedAnswer instanceof Array)) {
                        // TODO : Hack to include functionality for pre-populating ART Regimens - Teboho
                        if (defaultCodedAnswerRegimen && !defaultCodedAnswerSubsRegimen) {
                            observation.value = defaultCodedAnswerRegimen;
                        } else if (defaultCodedAnswerSubsRegimen) {
                            observation.value = defaultCodedAnswerSubsRegimen;
                        } else {
                            observation.value = defaultCodedAnswer;
                        }
                    }
                };

                var getFlattenedObsValues = function (flattenedObs) {
                    return _.reduce(flattenedObs, function (flattenedObsValues, obs) {
                        if (flattenedObsValues[obs.concept.name + '|' + obs.uniqueId] == undefined) {
                            if (obs.isMultiSelect) {
                                var selectedObsConceptNames = [];
                                _.each(obs.selectedObs, function (observation) {
                                    if (!observation.voided) {
                                        selectedObsConceptNames.push(observation.value.name);
                                    }
                                    if (!observation.voided) {
                                        selectedObsConceptNames.push(observation.value.name);
                                    }
                                });
                                flattenedObsValues[obs.concept.name + '|' + obs.uniqueId] = selectedObsConceptNames;
                            } else if (obs.conceptUIConfig.multiSelect) {
                                var alreadyProcessedMultiSelect = [];
                                _.each(_.keys(flattenedObsValues), function (eachObsKey) {
                                    eachObsKey.split('|')[0] == obs.concept.name && alreadyProcessedMultiSelect.push(eachObsKey);
                                });
                                if (alreadyProcessedMultiSelect.length < 2) {
                                    flattenedObsValues[obs.concept.name + '|' + obs.uniqueId] = flattenedObsValues[obs.concept.name + '|' + undefined];
                                    // Set the individual Observation of Multi Select to be the MultiSelect Obs
                                }
                            } else if (obs.value instanceof Object) {
                                flattenedObsValues[obs.concept.name + '|' + obs.uniqueId] = (obs.value.name instanceof Object) ? obs.value.name.name : obs.value.name;
                            } else {
                                flattenedObsValues[obs.concept.name + '|' + obs.uniqueId] = obs.value;
                            }
                        }
                        return flattenedObsValues;
                    }, {});
                };

                var clearFieldValuesOnDisabling = function (obs) {
                    obs.comment = undefined;
                    if (obs.value || obs.isBoolean) {
                        // Make ART Regimen an exception since we are pre-populating it to avoid data quality issues
                        if (!(obs.concept.name == "HIVTC, ART Regimen")) {
                            obs.value = undefined;
                        }
                    } else if (obs.isMultiSelect) {
                        for (var key in obs.selectedObs) {
                            if (!obs.selectedObs[key].voided) {
                                obs.toggleSelection(obs.selectedObs[key].value);
                            }
                        }
                    }
                };

                var setObservationState = function (obsArray, disable, error, hide, obsValue) {
                    if (!_.isEmpty(obsArray)) {
                        _.each(obsArray, function (obs) {
                            // TODO: If initial regimen is not present for ART Regimen, always enable - Teboho
                            obs.disabled = disable || hide;
                            if (obs.concept.name == "HIVTC, ART Regimen" && !$scope.initialRegimen) {
                                obs.disabled = false;
                            }
                            obs.error = error;
                            obs.hide = hide;
                            if (hide || obs.disabled) {
                                clearFieldValuesOnDisabling(obs);
                            }
                            
                            // TODO : Hack for assigning values to an obs - Teboho
                            // Have generalize this code and remove explicit mention of the concept name i.e. HIVTC, ARV drugs supply duration maybe load obsValue with conceptName
                            // NB: Currently only works for "Drug Supply duration" and "ARV drugs No. of days dispensed"
                            if (obsValue && obs.concept.dataType == "Numeric" && obs.concept.name == "ARV drugs No. of days dispensed") {
                                obs.value = obsValue;
                            } else if (obsValue && obs.concept.dataType == "Coded" && obs.concept.name == "HIVTC, ARV drugs supply duration") {
                                obs.value = _.find(obs.possibleAnswers, { displayString: obsValue });
                            } else if (!obsValue && obs.concept.dataType == "Coded" && obs.concept.name == "HIVTC, ARV drugs supply duration") {
                                obs.value = undefined;
                            }
                            if (obs.groupMembers) {
                                _.each(obs.groupMembers, function (groupMember) {
                                    // TODO : Hack to fix issue with formconditions on multiselect - Swathi
                                    groupMember && setObservationState([groupMember], disable, error, hide);
                                });
                            }
                        });
                    }
                };

        

                var processConditions = function (flattenedObs, fields, disable, error, hide, assingvalue) {

                    _.each(fields, function (field) {
                        var matchingObsArray = [];
                        var obsValue;
                        var clonedObsInSameGroup;
                        flattenedObs.forEach(function (obs) {
                            if (clonedObsInSameGroup != false && obs.concept.name == field || (field.field && obs.concept.name == field.field)) {
                                matchingObsArray.push(obs);
                                
                                clonedObsInSameGroup = true;
                                if (field.field) {
                                    obsValue = field.fieldValue;
                                }
                            } else if (clonedObsInSameGroup && obs.concept.name != field || (field.field && obs.concept.name == field.field)) {
                                clonedObsInSameGroup = false;
                            }
                        });

                        if (!_.isEmpty(matchingObsArray)) {
                            setObservationState(matchingObsArray, disable, error, hide, obsValue);
                            var obsTreatment = $scope.observations[0].groupMembers[0].groupMembers;

                            //hack to check changes on ART treatment followup form to autopopulate medication from obs to medication tab --pheko---phenduka
                            $scope.$watch(function() { 
                                matchingObsArray.forEach(switchRegimen => {
                                    if(switchRegimen.label =="Name of Regimen Switched to") 
                                    {
                                        if(switchRegimen.value != undefined)
                                        {
                                            appService.setRegimen(switchRegimen.value.displayString);
                                        }
    
                                    }
                                    else if(switchRegimen.label =="Treatment Substitution") 
                                    {
                                        if(switchRegimen.groupMembers[1].value != undefined)
                                        {
                                            appService.setRegimen(switchRegimen.groupMembers[1].value.displayString);
                                        }
                                    }
                                    else if(switchRegimen.label == "ART Regimen"){
                                        if(switchRegimen.value != undefined)
                                        {
                                            appService.setRegimen(switchRegimen.value.value);
                                            appService.setIsOrderRegimenInserted(true); 
                                        }
                                        else appService.setIsOrderRegimenInserted(false); 
                                    }
                                });
                                obsTreatment.forEach(element => {

                                   
                                    if(element.label == "Follow-up date")
                                    {
                                        if(element.value != undefined )
                                        {
                                            appService.setFollowupdate(element.value);
                                            var isNotEmpty = appService.getDeactivated();
                                            var isDeactivated = isNotEmpty == null ?  false : isNotEmpty;
                                            if (isDeactivated == false)
                                            {
                                                appService.setActive(true);
                                            }
                                            else
                                            {
                                                isDeactivated == false;
                                            }
                                        }
                                    }
                                })



                            });
                            
                        } else {
                            messagingService.showMessage("error", "No element found with name : " + field);
                        }
                    });
                };

                var runFormConditionForObs = function (enableCase, formName, formCondition, conceptName, flattenedObs) {
                    var conceptSetObsValues = getFlattenedObsValues(flattenedObs);
                    _.each(_.keys(conceptSetObsValues), function (eachObsKey) {
                        if (eachObsKey.split('|')[0] == conceptName && eachObsKey.split('|')[1] != 'undefined') {
                            var valueMap = _.reduce(conceptSetObsValues, function (conceptSetValueMap, obsValue, conceptName) {
                                conceptSetValueMap[conceptName.split('|')[0]] = obsValue;
                                return conceptSetValueMap;
                            }, {});
                            var conditions = formCondition(formName, valueMap, $scope.patient);
                            if (!_.isUndefined(conditions)) {
                                if (conditions.error && !_.isEmpty(conditions.error)) {
                                    messagingService.showMessage('error', conditions.error);
                                    processConditions(flattenedObs, [conceptName], false, true, false);
                                } else {
                                    enableCase && processConditions(flattenedObs, [conceptName], false, false, false);
                                }
                                processConditions(flattenedObs, conditions.disable, true);
                                processConditions(flattenedObs, conditions.enable, false);
                                processConditions(flattenedObs, conditions.show, false, undefined, false);
                                processConditions(flattenedObs, conditions.hide, false, undefined, true);
                                processConditions(flattenedObs, conditions.assignedValues, false, undefined, false, true);
                                _.each(conditions.enable, function (subConditionConceptName) {
                                    var conditionFn = Bahmni.ConceptSet.FormConditions.rules && Bahmni.ConceptSet.FormConditions.rules[subConditionConceptName];
                                    if (conditionFn != null) {
                                        runFormConditionForObs(true, formName, conditionFn, subConditionConceptName, flattenedObs);
                                    }
                                });
                                _.each(conditions.disable, function (subConditionConceptName) {
                                    var conditionFn = Bahmni.ConceptSet.FormConditions.rules && Bahmni.ConceptSet.FormConditions.rules[subConditionConceptName];
                                    if (conditionFn != null) {
                                        _.each(flattenedObs, function (obs) {
                                            if (obs.concept.name == subConditionConceptName) {
                                                runFormConditionForObs(false, formName, conditionFn, subConditionConceptName, flattenedObs);
                                            }
                                        });
                                    }
                                });
                                _.each(conditions.show, function (subConditionConceptName) {
                                    var conditionFn = Bahmni.ConceptSet.FormConditions.rules && Bahmni.ConceptSet.FormConditions.rules[subConditionConceptName];
                                    if (conditionFn) {
                                        runFormConditionForObs(true, formName, conditionFn, subConditionConceptName, flattenedObs);
                                    }
                                });
                                _.each(conditions.hide, function (subConditionConceptName) {
                                    var conditionFn = Bahmni.ConceptSet.FormConditions.rules && Bahmni.ConceptSet.FormConditions.rules[subConditionConceptName];
                                    if (conditionFn) {
                                        _.each(flattenedObs, function (obs) {
                                            if (obs.concept.name == subConditionConceptName) {
                                                runFormConditionForObs(false, formName, conditionFn, subConditionConceptName, flattenedObs);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                };

                var updateFormConditions = function (observationsOfCurrentTemplate, rootObservation) {
                    if (Bahmni.ConceptSet.FormConditions.rules) {
                        runFormConditionForAllObsRecursively(rootObservation.concept.name, rootObservation);
                    }
                };

                var runFormConditionForAllObsRecursively = function (formName, rootObservation) {
                    _.each(rootObservation.groupMembers, function (observation) {
                        var conditionFn = Bahmni.ConceptSet.FormConditions.rules && Bahmni.ConceptSet.FormConditions.rules[observation.concept.name];
                        if (conditionFn != null) {
                            var flattenedObs = ObservationUtil.flattenObsToArray([rootObservation]);
                            runFormConditionForObs(false, formName, conditionFn, observation.concept.name, flattenedObs);
                        }
                        if (observation.groupMembers && observation.groupMembers.length > 0) {
                            runFormConditionForAllObsRecursively(formName, observation);
                        }
                    });
                };
                var addDummyImage = function () {
                    _.each($scope.rootObservation.groupMembers, function (observation) {
                        addDummyImageObservationForSavedObs(observation, $scope.rootObservation);
                    });
                };
                var addDummyImageObservationForSavedObs = function (observation, rootObservation) {
                    _.each(observation.groupMembers, function (childObservation) {
                        addDummyImageObservationForSavedObs(childObservation, observation);
                    });
                    if (observation.getControlType() === 'image' && observation.value && rootObservation.groupMembers.indexOf(observation) === rootObservation.groupMembers.length - 1) {
                        rootObservation.groupMembers.push(observation.cloneNew());
                        return;
                    }
                };
                var init = function () {
                    appService.setActive(false);

                            // Hack to autocalculate estimated date of delivery (EDD) once last menstrual period entered --- Pheko
                            var edd;
                            if($scope.conceptSetName=="ANC, ANC Program"){
                                $scope.$watch(function() { 
                                try {
                                    if($scope.observations[0].label != undefined){ 
                                        $scope.observations[0].groupMembers.forEach((element) => {
                                             element.groupMembers.forEach((element) => {
                                                 if(element.label== "Obstetric History"){
                                                     if(element.groupMembers[4].value != undefined){
                                                         edd=element.groupMembers[4].value;
                                                         var dt = new Date(edd);
                                                         dt.setMonth( dt.getMonth() + 9);
                                                         var day= '' + dt.getDate();
                                                         var month='' + (dt.getMonth()+1);
                                                         var year='' + dt.getFullYear();
                                                         if (month.length < 2) {
                                                            month = '0' + month;
                                                         }
                                                         if (day.length < 2){
                                                            day = '0' + day;
                                                         }
                                                        
                                                         var finaldate= year+"-"+month+"-"+day;
                                                         element.groupMembers[5].value=finaldate;
                                                     }
                                                }
                                                 
                                             });
                                        });
                                    }
                                 } catch (error) { }
                            });}

                    // TODO : Hack to include functionality for pre-populating ART Regimens - Teboho
                    // Will refactor accordingly
                    if (conceptSetName == "HIV Treatment and Care Progress Template") {
                        return $q.all([conceptSetService.getConcept({
                            name: conceptSetName,
                            v: "bahmni"
                        }), observationsService.fetch($scope.patient.uuid, "HIVTC, ART Regimen", "initial"),
                            observationsService.fetch($scope.patient.uuid, ["HIVTC, Name of Substituted Regimen",
                                "HIVTC, Name of Switched Regimen"], "latest")]).then(function (response) {
                                    if (response[1] && response[1].data.length > 0) {
                                        $scope.initialRegimen = response[1].data[0].valueAsString;
                                    }

                                    _.each(response[2].data, function (regimen) {
                                        $scope.regimenSwitchSubstitute.push({
                                            name: regimen.concept.name,
                                            value: regimen.valueAsString,
                                            encounterDate: regimen.encounterDateTime,
                                            observationDateTime: regimen.observationDateTime
                                        });
                                    });
                                    

                                    $scope.conceptSet = response[0].data.results[0];
                                    $scope.rootObservation = $scope.conceptSet ? observationMapper.map($scope.observations, $scope.conceptSet, conceptSetUIConfig) : null;

                                    if ($scope.rootObservation) {
                                        $scope.rootObservation.conceptSetName = $scope.conceptSetName;
                                        focusFirstObs();
                                        updateObservationsOnRootScope();
                                        var groupMembers = getObservationsOfCurrentTemplate()[0].groupMembers;
                                        var defaults = getDefaults();
                                        addDummyImage();

                                        setDefaultsForGroupMembers(groupMembers, defaults);

                                        var observationsOfCurrentTemplate = getObservationsOfCurrentTemplate();
                                        updateFormConditions(observationsOfCurrentTemplate, $scope.rootObservation);
                                    } else {
                                        $scope.showEmptyConceptSetMessage = true;
                                    }
                                }).catch(function (error) {
                                    messagingService.showMessage('error', error.message);
                                });
                    } else {
                        // Original function
                        $scope.$watch(function() { 
                            if($scope.conceptSetName === "Tuberculosis Followup Template"){
                                 try {
                                    if($scope.observations[0].label != undefined){
                                                                                   
                                        if($scope.observations[0].groupMembers[6].label == "Next appointment/refill date"){
                                            if($scope.observations[0].groupMembers[6].value != undefined){
                                            appService.setFollowupdate($scope.observations[0].groupMembers[6].value);
                                            var isNotEmpty = appService.getDeactivated();
                                            var isDeactivated = isNotEmpty == null ?  false : isNotEmpty;
                                                if (isDeactivated == false)
                                                   appService.setActive(true);
                                                else isDeactivated == false;
                                            }}
                                        $scope.observations[0].groupMembers.forEach((element) => {
                                                 if(element.label ==  "TB Regimen"){
                                                     
                                                    if(element.selectedObs.Isoniazid){
                                                        appService.setRegimen("Isoniazid");
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    }
                                                    if(element.selectedObs.Rifampicin){
                                                        appService.setRegimen("Rifampicin");
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    }
                                                    if(element.selectedObs.Ethambutol){
                                                        appService.setRegimen("Ethambutol");
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    } 
                                                    if(element.selectedObs.Pyrazinamide){
                                                        appService.setRegimen("Pyrazinamide");
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    }
                                                    if(element.selectedObs.Streptomycin){
                                                        appService.setRegimen("Streptomycin");
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    }
                                                    if(element.selectedObs.RHZE){
                                                        appService.setRegimen("RHZE");
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    }
                                                    if(element.selectedObs.RH){
                                                        appService.setRegimen("RH-");
                                                        console.log(element.selectedObs);
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    }
                                                    if(element.selectedObs.RHZ){
                                                        appService.setRegimen("RHZ");
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    }
                                                    if(element.selectedObs.RHE){
                                                        appService.setRegimen("RHE");
                                                        appService.setIsOrderRegimenInserted(true); 
                                                    }
                                                }else{
                                                        appService.setIsOrderRegimenInserted(false);
                                                    }
                                        });
                                    }
                                 } catch (error) { }
                            }
                            if($scope.conceptSetName === "HIV Treatment and Care Intake Template"){
                                try {
                                   if($scope.observations[0].label != undefined){ 
                                       $scope.observations[0].groupMembers.forEach((element) => {
                                            element.groupMembers.forEach((element) => {
                                            if(element.label ==  "ART Regimen"){
                                                if(element.value != undefined){
                                                    appService.setRegimen(element.value.label);
                                                    appService.setIsOrderRegimenInserted(true);
                                                }else appService.setIsOrderRegimenInserted(true);
                                            }else  appService.setIsOrderRegimenInserted(false);
                                            if(element.label == "Follow-up date"){
                                                if(element.value != undefined){
                                                appService.setFollowupdate(element.value);
                                                var isNotEmpty = appService.getDeactivated();
                                                var isDeactivated = isNotEmpty == null ?  false : isNotEmpty;
                                                    if (isDeactivated == false)
                                                       appService.setActive(true);
                                                    else isDeactivated == false;
                                                }}
                                            });
                                       });
                                   }
                                } catch (error) { }
                           }
                        });
                        return conceptSetService.getConcept({
                            name: conceptSetName,
                            v: "bahmni"
                        }).then(function (response) {
                            $scope.conceptSet = response.data.results[0];
                            $scope.rootObservation = $scope.conceptSet ? observationMapper.map($scope.observations, $scope.conceptSet, conceptSetUIConfig) : null;

                            if ($scope.rootObservation) {
                                $scope.rootObservation.conceptSetName = $scope.conceptSetName;
                                focusFirstObs();
                                updateObservationsOnRootScope();
                                var groupMembers = getObservationsOfCurrentTemplate()[0].groupMembers;
                                var defaults = getDefaults();
                                addDummyImage();

                                setDefaultsForGroupMembers(groupMembers, defaults);

                                var observationsOfCurrentTemplate = getObservationsOfCurrentTemplate();
                                updateFormConditions(observationsOfCurrentTemplate, $scope.rootObservation);
                            } else {
                                $scope.showEmptyConceptSetMessage = true;
                            }
                        }).catch(function (error) {
                            messagingService.showMessage('error', error.message);
                        });
                    }
                };
                spinner.forPromise(init(), id);

                var validateObservationTree = function () {
                    if (typeof $scope.rootObservation === "undefined" || $scope.rootObservation === null) {
                        return {allow: true, errorMessage: null };
                    }
                    $scope.atLeastOneValueIsSet = $scope.rootObservation && $scope.rootObservation.atLeastOneValueSet();
                    $scope.conceptSetRequired = $scope.required ? $scope.required : true;
                    var nodes = $scope.rootObservation && findInvalidNodes($scope.rootObservation.groupMembers, $scope.rootObservation);
                    return {allow: !nodes.status, errorMessage: nodes.message};
                }; // TODO: Write unit test for this function

                var findInvalidNodes = function (members, parentNode) {
                    var errorMessage = null;
                    var status = members.some(function (childNode) {
                        if (childNode.voided) {
                            return false;
                        }
                        var groupMembers = childNode.groupMembers || [];
                        for (var index in groupMembers) {
                            var information = groupMembers[index].groupMembers && groupMembers[index].groupMembers.length ? findInvalidNodes(groupMembers[index].groupMembers, groupMembers[index]) : validateChildNode(groupMembers[index], childNode);
                            if (information.status) {
                                errorMessage = information.message;
                                return true;
                            }
                        }
                        information = validateChildNode(childNode, parentNode);
                        if (information.status) {
                            errorMessage = information.message;
                            return true;
                        }
                        return !childNode.isValid($scope.atLeastOneValueIsSet, $scope.conceptSetRequired);
                    });
                    return {message: errorMessage, status: status};
                };
                var validateChildNode = function (childNode, parentNode) {
                    var errorMessage;
                    if (childNode.possibleAnswers && !childNode.possibleAnswers.length) {
                        if (typeof childNode.isValueInAbsoluteRange == 'function' && !childNode.isValueInAbsoluteRange()) {
                            errorMessage = "The value you entered (red field) is outside the range of allowable values for that record. Please check the value.";
                            return {message: errorMessage, status: true};
                        }

                        if (childNode.isNumeric()) {
                            if (!childNode.isValidNumeric()) {
                                errorMessage = "Please enter Integer value, decimal value is not allowed";
                                return {message: errorMessage, status: true};
                            }
                            if (parentNode) {
                                if (!childNode.isValidNumericValue() || !parentNode.isValidNumericValue()) {
                                    errorMessage = "Please enter Numeric values";
                                    return {message: errorMessage, status: true};
                                }
                            } else {
                                if (!childNode.isValidNumericValue()) {
                                    errorMessage = "Please enter Numeric values";
                                    return {message: errorMessage, status: true};
                                }
                            }
                        }
                    }
                    return {status: false};
                };

                validationHandler.add(validateObservationTree);

                var cleanUpListenerShowPrevious = $scope.$on('event:showPrevious' + conceptSetName, function () {
                    return spinner.forPromise(observationsService.fetch($scope.patient.uuid, $scope.conceptSetName, null, $scope.numberOfVisits, null, true), id).then(function (response) {
                        var recentObservations = ObservationUtil.flattenObsToArray(response.data);
                        var conceptSetObservation = $scope.observations.filter(function (observation) {
                            return observation.conceptSetName === $scope.conceptSetName;
                        });
                        ObservationUtil.flattenObsToArray(conceptSetObservation).forEach(function (obs) {
                            var correspondingRecentObs = _.filter(recentObservations, function (recentObs) {
                                return obs.concept.uuid === recentObs.concept.uuid;
                            });
                            if (correspondingRecentObs != null && correspondingRecentObs.length > 0) {
                                correspondingRecentObs.sort(function (obs1, obs2) {
                                    return new Date(obs2.encounterDateTime) - new Date(obs1.encounterDateTime);
                                });
                                obs.previous = correspondingRecentObs.map(function (previousObs) {
                                    return {
                                        value: Bahmni.Common.Domain.ObservationValueMapper.map(previousObs),
                                        date: previousObs.observationDateTime
                                    };
                                });
                            }
                        });
                    });
                });

                var deregisterAddMore = $scope.$root.$on("event:addMore", function (event, observation) {
                    updateFormConditions([observation], observation);
                });

                var deregisterObservationUpdated = $scope.$root.$on("event:observationUpdated-" + conceptSetName, function (event, conceptName, rootObservation) {
                    var formName = rootObservation.concept.name;
                    var formCondition = Bahmni.ConceptSet.FormConditions.rules && Bahmni.ConceptSet.FormConditions.rules[conceptName];
                    if (formCondition) {
                        var flattenedObs = ObservationUtil.flattenObsToArray([rootObservation]);
                        runFormConditionForObs(true, formName, formCondition, conceptName, flattenedObs);
                    }
                });

                $scope.$on('$destroy', function () {
                    deregisterObservationUpdated();
                    deregisterAddMore();
                    cleanUpListenerShowPrevious();
                });
            };

            return {
                restrict: 'E',
                scope: {
                    conceptSetName: "=",
                    observations: "=?",
                    required: "=?",
                    showTitle: "&",
                    validationHandler: "&",
                    patient: "=",
                    conceptSetFocused: "=?",
                    collapseInnerSections: "=?",
                    atLeastOneValueIsSet: "=?",
                    sectionId: "="
                },
                templateUrl: '../common/concept-set/views/conceptSet.html',
                controller: controller
            };
        }]);
