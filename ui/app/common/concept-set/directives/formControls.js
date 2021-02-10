'use strict';

angular.module('bahmni.common.conceptSet')
    .directive('formControls', ['formService','observationsService', 'conceptSetService',  'spinner', '$timeout', '$translate', '$q',
        function (formService,observationsService, conceptSetService,  spinner, $timeout, $translate, $q) {
            var loadedFormDetails = {};
            var loadedFormTranslations = {};
            var dateUtil = Bahmni.Common.Util.DateUtil;
            var unMountReactContainer = function (formUuid) {
                var reactContainerElement = angular.element(document.getElementById(formUuid));
                reactContainerElement.on('$destroy', function () {
                    unMountForm(document.getElementById(formUuid));
                });
            };

            var controller = function ($scope) {
                var formUuid = $scope.form.formUuid;
                var formVersion = $scope.form.formVersion;
                var formName = $scope.form.formName;
                var formObservations = $scope.form.observations;
                var collapse = $scope.form.collapseInnerSections && $scope.form.collapseInnerSections.value;
                var validateForm = $scope.validateForm || false;
                var locale = $translate.use();
                var formDetails = {};
                var fullFormName = "";

                if (!loadedFormDetails[formUuid]) {
                    spinner.forPromise(formService.getFormDetail(formUuid, { v: "custom:(resources:(value))" })
                        .then(function (response) {
                            var formDetailsAsString = _.get(response, 'data.resources[0].value');
                            if (formDetailsAsString) {
                                var formDetails = JSON.parse(formDetailsAsString);
                                formDetails.version = formVersion;
                                loadedFormDetails[formUuid] = formDetails;
                                var formParams = { formName: formName, formVersion: formVersion, locale: locale };
                                spinner.forPromise(formService.getFormTranslations(formDetails.translationsUrl, formParams)
                                    .then(function (response) {
                                        var formTranslations = !_.isEmpty(response.data) ? response.data[0] : {};
                                        loadedFormTranslations[formUuid] = formTranslations;

// Whenever the formsObservations array is empty, load the last encounter saved for the
// following concepts: HIVTC, Adherence Date ARVs Dispensed, HIVTC, Adherence Medication
// Make an API call to the server
// Pass the result into the react component
// Else pass in the formObservations as expected
if (formObservations && !(formObservations.length > 0)) {
    spinner.forPromise($q.all([conceptSetService.getConcept({
        name: "HIVTC, Adherence Medication",
        v: "bahmni"
    }), observationsService.fetch($scope.patient.uuid, ["HIVTC, ART Regimen", "ART, Follow-up date", "HIVTC, Adherence Date ARVs Dispensed"], "latest"),
        conceptSetService.getConcept({
            name: "HIVTC, Adherence Date ARVs Dispensed",
            v: "bahmni"
        }),
        conceptSetService.getConcept({
            name: "HIVTC, Adherence Return Date",
            v: "bahmni"
        })])).then(function (response) {
            var artRegimenObs = response[1].data[0];
            var medicationConcept = response[0].data.results[0];
            var artfollowUpObs = response[1].data[1];
            var adherenceDateConcept = response[2].data.results[0];
            var artAdheranceReturnDateConcept = response[3].data.results[0];
            // Convert the ARV Regimen return value to Adherance medication
            fullFormName = $scope.form.formName.concat(
                ".", $scope.form.formVersion, "/"
            );
            var medicationObs = convertRegimenToMedication(artRegimenObs, medicationConcept);
            var adherenceDateObs = convertDateToAdherenceData(artfollowUpObs, adherenceDateConcept);
            var adherenceReturnDateObs = convertDateToAdherenceReturnDate(artfollowUpObs, artAdheranceReturnDateConcept);
            // Push into form observations
            formObservations.push(adherenceReturnDateObs);
            formObservations.push(adherenceDateObs);
            formObservations.push(medicationObs);
            $scope.form.component = renderWithControls(formDetails, formObservations,
                formUuid, collapse, $scope.patient, validateForm, locale, formTranslations);
        });
} else if (formObservations && formObservations.length > 0) {

                                        $scope.form.component = renderWithControls(formDetails, formObservations,
                                            formUuid, collapse, $scope.patient, validateForm, locale, formTranslations);
                                        }

                                    }, function () {
                                        var formTranslations = {};
                                        loadedFormTranslations[formUuid] = formTranslations;
                                        	

// Whenever the formsObservations array is empty, load the last encounter saved for the
// following concepts: HIVTC, Adherence Date ARVs Dispensed, HIVTC, Adherence Medication
// Make an API call to the server
// Pass the result into the react component
                                        $scope.form.component = renderWithControls(formDetails, formObservations,response.data,
                                            formUuid, collapse, $scope.patient, validateForm, locale, formTranslations);
                                    })
                                );
                            }
                            unMountReactContainer($scope.form.formUuid);
                        })
                    );
                } else {
                    $timeout(function () {
                        $scope.form.component = renderWithControls(loadedFormDetails[formUuid], formObservations,
                            formUuid, collapse, $scope.patient, validateForm, locale, loadedFormTranslations[formUuid]);
                        unMountReactContainer($scope.form.formUuid);
                    }, 0, false);
                }

                $scope.$watch('form.collapseInnerSections', function () {
                    var collapse = $scope.form.collapseInnerSections && $scope.form.collapseInnerSections.value;
                    if (loadedFormDetails[formUuid]) {
                        $scope.form.component = renderWithControls(loadedFormDetails[formUuid], formObservations,
                            formUuid, collapse, $scope.patient, validateForm, locale, loadedFormTranslations[formUuid]);
                    }
                });


                var convertRegimenToMedication = function (artRegimenObs, medicationConcept) {
                                        var medicationObs = JSON.parse(JSON.stringify(artRegimenObs));
                                        // Map field accordinly
                                        medicationObs.concept.name = medicationConcept.names[1].name;
                                        medicationObs.concept.shortName = medicationConcept.names[0].name;
                                        medicationObs.concept.uuid = medicationConcept.uuid;
                                        medicationObs.conceptNameToDisplay = medicationConcept.names[0].name;
                                        medicationObs.conceptUuid = medicationConcept.uuid;
                                        medicationObs.encounterDateTime = null;
                                        medicationObs.observationDateTime = null;
                                        medicationObs.visitStartDateTime = null;
                                        medicationObs.obsGroupUuid = null;
                                        medicationObs.uuid = null;
                                        medicationObs.encounterUuid = null;
                                        // var controlNumber = determineControlNumber(medicationObs.concept.name);
                                        var controlName = fullFormName;
                                        // medicationObs.formFieldPath = controlName.concat(controlNumber, "-0");
                                        medicationObs.formFieldPath = controlName.concat("2", "-0");
                                        // medicationObs.formFieldPath = "Adherence Calculator.8/2-0";
                                        medicationObs.formNamespace = "Bahmni";
                                        // return the object
                                        return medicationObs;
                                    };
                                    var determineControlNumber = function (conceptName) {
                                        var currentConcept = _.find(formDetails.controls, function (control) {
                                            return control.concept.name === conceptName;
                                        });
                                        return currentConcept.id;
                                    };
                                    var convertDateToAdherenceData = function (artfollowUpObs, adherenceDateConcept) {
                                        // Make a deep copy of the object versus a shallow copy
                                        var adherenceDateObs = JSON.parse(JSON.stringify(artfollowUpObs));
                                        var dateFollowUpObs = artfollowUpObs.observationDateTime;
                                        // Map field accordinly
                                        adherenceDateObs.concept.name = adherenceDateConcept.names[1].name;
                                        adherenceDateObs.concept.shortName = adherenceDateConcept.names[0].name;
                                        adherenceDateObs.concept.uuid = adherenceDateConcept.uuid;
                                        adherenceDateObs.conceptNameToDisplay = adherenceDateConcept.names[0].name;
                                        adherenceDateObs.conceptUuid = adherenceDateConcept.uuid;
                                        adherenceDateObs.encounterDateTime = null;
                                        adherenceDateObs.observationDateTime = null;
                                        adherenceDateObs.visitStartDateTime = null;
                                        adherenceDateObs.obsGroupUuid = null;
                                        adherenceDateObs.uuid = null;
                                        adherenceDateObs.encounterUuid = null;
                                        // var controlNumber = determineControlNumber(adherenceDateObs.concept.name);
                                        var controlName = fullFormName;
                                        // adherenceDateObs.formFieldPath = controlName.concat(controlNumber, "-0");
                                        adherenceDateObs.formFieldPath = controlName.concat("1", "-0");
                                        // adherenceDateObs.formFieldPath = "Adherence Calculator.8/1-0";
                                        adherenceDateObs.formNamespace = "Bahmni";
                                        adherenceDateObs.value = dateUtil.getDateWithoutTime(dateFollowUpObs);
                                        adherenceDateObs.valueAsString = dateUtil.getDateWithoutTime(dateFollowUpObs);
                                        // return the object
                                        return adherenceDateObs;
                                    };
                                    var convertDateToAdherenceReturnDate = function (artfollowUpObs, adherenceReturnDateConcept) {
                                        var adherenceDateObs = JSON.parse(JSON.stringify(artfollowUpObs));
                                        // Map field accordinly
                                        adherenceDateObs.concept.name = adherenceReturnDateConcept.names[1].name;
                                        adherenceDateObs.concept.shortName = adherenceReturnDateConcept.names[0].name;
                                        adherenceDateObs.concept.uuid = adherenceReturnDateConcept.uuid;
                                        adherenceDateObs.conceptNameToDisplay = adherenceReturnDateConcept.names[0].name;
                                        adherenceDateObs.conceptUuid = adherenceReturnDateConcept.uuid;
                                        adherenceDateObs.encounterDateTime = null;
                                        adherenceDateObs.observationDateTime = null;
                                        adherenceDateObs.visitStartDateTime = null;
                                        adherenceDateObs.obsGroupUuid = null;
                                        adherenceDateObs.uuid = null;
                                        adherenceDateObs.encounterUuid = null;
                                        // var controlNumber = determineControlNumber(adherenceDateObs.concept.name);
                                        var controlName = fullFormName;
                                        // adherenceDateObs.formFieldPath = controlName.concat(controlNumber, "-0");
                                        adherenceDateObs.formFieldPath = controlName.concat("5", "-0");
                                        // adherenceDateObs.formFieldPath = "Adherence Calculator.8/5-0";
                                        adherenceDateObs.formNamespace = "Bahmni";
                                        adherenceDateObs.value = dateUtil.getDateWithoutTime(Bahmni.Common.Util.DateUtil.today());
                                        adherenceDateObs.valueAsString = dateUtil.getDateWithoutTime(Bahmni.Common.Util.DateUtil.today());
                                        // return the object
                                        return adherenceDateObs;
                                    };

                $scope.$on('$destroy', function () {
                    if ($scope.$parent.consultation && $scope.$parent.consultation.observationForms) {
                        if ($scope.form.component) {
                            var formObservations = $scope.form.component.getValue();
                            $scope.form.observations = formObservations.observations;

                            var hasError = formObservations.errors;
                            if (!_.isEmpty(hasError)) {
                                $scope.form.isValid = false;
                            }
                        }
                    }
                });
            };

            return {
                restrict: 'E',
                scope: {
                    form: "=",
                    patient: "=",
                    validateForm: "="
                },
                controller: controller
            };
        }]);
