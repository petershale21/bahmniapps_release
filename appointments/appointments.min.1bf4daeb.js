'use strict';

var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};

(function () {
    var hostUrl = localStorage.getItem('host') ? ("https://" + localStorage.getItem('host')) : "";
    var rootDir = localStorage.getItem('rootDir') || "";
    var RESTWS = hostUrl + "/openmrs/ws/rest";
    var RESTWS_V1 = hostUrl + "/openmrs/ws/rest/v1";
    var BAHMNI_CORE = RESTWS_V1 + "/bahmnicore";
    var EMRAPI = RESTWS + "/emrapi";
    var BACTERIOLOGY = RESTWS_V1;
    var BASE_URL = hostUrl + "/bahmni_config/openmrs/apps/";
    var CUSTOM_URL = hostUrl + "/implementation_config/openmrs/apps/";

    var serverErrorMessages = [
        {
            serverMessage: "Cannot have more than one active order for the same orderable and care setting at same time",
            clientMessage: "One or more drugs you are trying to order are already active. Please change the start date of the conflicting drug or remove them from the new prescription."
        },
        {
            serverMessage: "[Order.cannot.have.more.than.one]",
            clientMessage: "One or more drugs you are trying to order are already active. Please change the start date of the conflicting drug or remove them from the new prescription."
        }
    ];

    var representation = "custom:(uuid,name,names,conceptClass," +
        "setMembers:(uuid,name,names,conceptClass," +
        "setMembers:(uuid,name,names,conceptClass," +
        "setMembers:(uuid,name,names,conceptClass))))";

    var unAuthenticatedReferenceDataMap = {
        "/openmrs/ws/rest/v1/location?tags=Login+Location&s=byTags&v=default": "LoginLocations",
        "/openmrs/ws/rest/v1/bahmnicore/sql/globalproperty?property=locale.allowed.list": "LocaleList"
    };

    var authenticatedReferenceDataMap = {
        "/openmrs/ws/rest/v1/idgen/identifiertype": "IdentifierTypes",
        "/openmrs/module/addresshierarchy/ajax/getOrderedAddressHierarchyLevels.form": "AddressHierarchyLevels",
        "/openmrs/ws/rest/v1/bahmnicore/sql/globalproperty?property=mrs.genders": "Genders",
        "/openmrs/ws/rest/v1/bahmnicore/sql/globalproperty?property=bahmni.encountersession.duration": "encounterSessionDuration",
        "/openmrs/ws/rest/v1/bahmnicore/sql/globalproperty?property=bahmni.relationshipTypeMap": "RelationshipTypeMap",
        "/openmrs/ws/rest/v1/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS": "RegistrationConcepts",
        "/openmrs/ws/rest/v1/relationshiptype?v=custom:(aIsToB,bIsToA,uuid)": "RelationshipType",
        "/openmrs/ws/rest/v1/personattributetype?v=custom:(uuid,name,sortWeight,description,format,concept)": "PersonAttributeType",
        "/openmrs/ws/rest/v1/entitymapping?mappingType=loginlocation_visittype&s=byEntityAndMappingType": "LoginLocationToVisitTypeMapping",
        "/openmrs/ws/rest/v1/bahmnicore/config/patient": "PatientConfig",
        "/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName&name=Consultation+Note&v=custom:(uuid,name,answers)": "ConsultationNote",
        "/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName&name=Lab+Order+Notes&v=custom:(uuid,name)": "LabOrderNotes",
        "/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName&name=Impression&v=custom:(uuid,name)": "RadiologyImpressionConfig",
        "/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName&name=All_Tests_and_Panels&v=custom:(uuid,name:(uuid,name),setMembers:(uuid,name:(uuid,name)))": "AllTestsAndPanelsConcept",
        "/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName&name=Dosage+Frequency&v=custom:(uuid,name,answers)": "DosageFrequencyConfig",
        "/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName&name=Dosage+Instructions&v=custom:(uuid,name,answers)": "DosageInstructionConfig",
        "/openmrs/ws/rest/v1/bahmnicore/sql/globalproperty?property=bahmni.encounterType.default": "DefaultEncounterType",
        "/openmrs/ws/rest/v1/concept?s=byFullySpecifiedName&name=Stopped+Order+Reason&v=custom:(uuid,name,answers)": "StoppedOrderReasonConfig",
        "/openmrs/ws/rest/v1/ordertype": "OrderType",
        "/openmrs/ws/rest/v1/bahmnicore/config/drugOrders": "DrugOrderConfig",
        "/openmrs/ws/rest/v1/bahmnicore/sql/globalproperty?property=drugOrder.drugOther": "NonCodedDrugConcept"
    };

    authenticatedReferenceDataMap["/openmrs/ws/rest/v1/entitymapping?mappingType=location_encountertype&s=byEntityAndMappingType&entityUuid=" + (localStorage.getItem("LoginInformation") ? JSON.parse(localStorage.getItem("LoginInformation")).currentLocation.uuid : "")] = "LoginLocationToEncounterTypeMapping";

    Bahmni.Common.Constants = {
        hostURL: hostUrl,
        dateFormat: "dd/mm/yyyy",
        dateDisplayFormat: "DD-MMM-YYYY",
        timeDisplayFormat: "hh:mm",
        emrapiDiagnosisUrl: EMRAPI + "/diagnosis",
        bahmniDiagnosisUrl: BAHMNI_CORE + "/diagnosis/search",
        bahmniDeleteDiagnosisUrl: BAHMNI_CORE + "/diagnosis/delete",
        diseaseTemplateUrl: BAHMNI_CORE + "/diseaseTemplates",
        AllDiseaseTemplateUrl: BAHMNI_CORE + "/diseaseTemplate",
        emrapiConceptUrl: EMRAPI + "/concept",
        encounterConfigurationUrl: BAHMNI_CORE + "/config/bahmniencounter",
        patientConfigurationUrl: BAHMNI_CORE + "/config/patient",
        drugOrderConfigurationUrl: BAHMNI_CORE + "/config/drugOrders",
        emrEncounterUrl: EMRAPI + "/encounter",
        encounterUrl: RESTWS_V1 + "/encounter",
        locationUrl: RESTWS_V1 + "/location",
        bahmniVisitLocationUrl: BAHMNI_CORE + "/visitLocation",
        bahmniOrderUrl: BAHMNI_CORE + "/orders",
        bahmniDrugOrderUrl: BAHMNI_CORE + "/drugOrders",
        bahmniDispositionByVisitUrl: BAHMNI_CORE + "/disposition/visit",
        bahmniDispositionByPatientUrl: BAHMNI_CORE + "/disposition/patient",
        bahmniSearchUrl: BAHMNI_CORE + "/search",
        bahmniSharedHealthRecordUrl: BAHMNI_CORE + "/sharedhealthrecord",
        bahmniLabOrderResultsUrl: BAHMNI_CORE + "/labOrderResults",
        bahmniEncounterUrl: BAHMNI_CORE + "/bahmniencounter",
        conceptUrl: RESTWS_V1 + "/concept",
        bahmniConceptAnswerUrl: RESTWS_V1 + "/bahmniconceptanswer",
        conceptSearchByFullNameUrl: RESTWS_V1 + "/concept?s=byFullySpecifiedName",
        visitUrl: RESTWS_V1 + "/visit",
        endVisitUrl: BAHMNI_CORE + "/visit/endVisit",
        endVisitAndCreateEncounterUrl: BAHMNI_CORE + "/visit/endVisitAndCreateEncounter",
        visitTypeUrl: RESTWS_V1 + "/visittype",
        patientImageUrlByPatientUuid: RESTWS_V1 + "/patientImage?patientUuid=",
        labResultUploadedFileNameUrl: "/uploaded_results/",
        visitSummaryUrl: BAHMNI_CORE + "/visit/summary",
        encounterModifierUrl: BAHMNI_CORE + "/bahmniencountermodifier",
        openmrsUrl: hostUrl + "/openmrs",
        loggingUrl: hostUrl + "/log/",
        idgenConfigurationURL: RESTWS_V1 + "/idgen/identifiertype",
        bahmniRESTBaseURL: BAHMNI_CORE + "",
        observationsUrl: BAHMNI_CORE + "/observations",
        obsRelationshipUrl: BAHMNI_CORE + "/obsrelationships",
        encounterImportUrl: BAHMNI_CORE + "/admin/upload/encounter",
        programImportUrl: BAHMNI_CORE + "/admin/upload/program",
        conceptImportUrl: BAHMNI_CORE + "/admin/upload/concept",
        conceptSetImportUrl: BAHMNI_CORE + "/admin/upload/conceptset",
        drugImportUrl: BAHMNI_CORE + "/admin/upload/drug",
        labResultsImportUrl: BAHMNI_CORE + "/admin/upload/labResults",
        referenceTermsImportUrl: BAHMNI_CORE + "/admin/upload/referenceterms",
        relationshipImportUrl: BAHMNI_CORE + "/admin/upload/relationship",
        conceptSetExportUrl: BAHMNI_CORE + "/admin/export/conceptset?conceptName=:conceptName",
        patientImportUrl: BAHMNI_CORE + "/admin/upload/patient",
        adminImportStatusUrl: BAHMNI_CORE + "/admin/upload/status",
        programUrl: RESTWS_V1 + "/program",
        programEnrollPatientUrl: RESTWS_V1 + "/bahmniprogramenrollment",
        programStateDeletionUrl: RESTWS_V1 + "/programenrollment",
        programEnrollmentDefaultInformation: "default",
        programEnrollmentFullInformation: "full",
        programAttributeTypes: RESTWS_V1 + "/programattributetype",
        relationshipTypesUrl: RESTWS_V1 + "/relationshiptype",
        personAttributeTypeUrl: RESTWS_V1 + "/personattributetype",
        diseaseSummaryPivotUrl: BAHMNI_CORE + "/diseaseSummaryData",
        allTestsAndPanelsConceptName: 'All_Tests_and_Panels',
        dosageFrequencyConceptName: 'Dosage Frequency',
        dosageInstructionConceptName: 'Dosage Instructions',
        stoppedOrderReasonConceptName: 'Stopped Order Reason',
        consultationNoteConceptName: 'Consultation Note',
        diagnosisConceptSet: 'Diagnosis Concept Set',
        radiologyOrderType: 'Radiology Order',
        radiologyResultConceptName: "Radiology Result",
        investigationEncounterType: "INVESTIGATION",
        validationNotesEncounterType: "VALIDATION NOTES",
        labOrderNotesConcept: "Lab Order Notes",
        impressionConcept: "Impression",
        qualifiedByRelationshipType: "qualified-by",
        dispositionConcept: "Disposition",
        dispositionGroupConcept: "Disposition Set",
        dispositionNoteConcept: "Disposition Note",
        ruledOutDiagnosisConceptName: 'Ruled Out Diagnosis',
        emrapiConceptMappingSource: "org.openmrs.module.emrapi",
        abbreviationConceptMappingSource: "Abbreviation",
        includeAllObservations: false,
        openmrsObsUrl: RESTWS_V1 + "/obs",
        openmrsObsRepresentation: "custom:(uuid,obsDatetime,value:(uuid,name:(uuid,name)))",
        admissionCode: 'ADMIT',
        dischargeCode: 'DISCHARGE',
        transferCode: 'TRANSFER',
        undoDischargeCode: 'UNDO_DISCHARGE',
        vitalsConceptName: "Vitals",
        heightConceptName: "HEIGHT",
        weightConceptName: "WEIGHT",
        bmiConceptName: "BMI", // TODO : shruthi : revove this when this logic moved to server side
        bmiStatusConceptName: "BMI STATUS", // TODO : shruthi : revove this when this logic moved to server side
        abnormalObservationConceptName: "IS_ABNORMAL",
        documentsPath: '/document_images',
        documentsConceptName: 'Document',
        miscConceptClassName: 'Misc',
        abnormalConceptClassName: 'Abnormal',
        unknownConceptClassName: 'Unknown',
        durationConceptClassName: 'Duration',
        conceptDetailsClassName: 'Concept Details',
        admissionEncounterTypeName: 'ADMISSION',
        dischargeEncounterTypeName: 'DISCHARGE',
        imageClassName: 'Image',
        videoClassName: 'Video',
        locationCookieName: 'bahmni.user.location',
        retrospectiveEntryEncounterDateCookieName: 'bahmni.clinical.retrospectiveEncounterDate',
        JSESSIONID: "JSESSIONID",
        rootScopeRetrospectiveEntry: 'retrospectiveEntry.encounterDate',
        patientFileConceptName: 'Patient file',
        serverErrorMessages: serverErrorMessages,
        currentUser: 'bahmni.user',
        retrospectivePrivilege: 'app:clinical:retrospective',
        locationPickerPrivilege: 'app:clinical:locationpicker',
        onBehalfOfPrivilege: 'app:clinical:onbehalf',
        nutritionalConceptName: 'Nutritional Values',
        messageForNoObservation: "NO_OBSERVATIONS_CAPTURED",
        messageForNoDisposition: "NO_DISPOSTIONS_AVAILABLE_MESSAGE_KEY",
        messageForNoFulfillment: "NO_FULFILMENT_MESSAGE",
        reportsUrl: "/bahmnireports",
        uploadReportTemplateUrl: "/bahmnireports/upload",
        ruledOutdiagnosisStatus: "Ruled Out Diagnosis",
        registartionConsultationPrivilege: 'app:common:registration_consultation_link',
        manageIdentifierSequencePrivilege: "Manage Identifier Sequence",
        closeVisitPrivilege: 'app:common:closeVisit',
        deleteDiagnosisPrivilege: 'app:clinical:deleteDiagnosis',
        viewPatientsPrivilege: 'View Patients',
        editPatientsPrivilege: 'Edit Patients',
        addVisitsPrivilege: 'Add Visits',
        deleteVisitsPrivilege: 'Delete Visits',
        grantProviderAccess: "app:clinical:grantProviderAccess",
        grantProviderAccessDataCookieName: "app.clinical.grantProviderAccessData",
        globalPropertyUrl: BAHMNI_CORE + "/sql/globalproperty",
        passwordPolicyUrl: BAHMNI_CORE + "/globalProperty/passwordPolicyProperties",
        fulfillmentConfiguration: "fulfillment",
        fulfillmentFormSuffix: " Fulfillment Form",
        noNavigationLinksMessage: "NO_NAVIGATION_LINKS_AVAILABLE_MESSAGE",
        conceptSetRepresentationForOrderFulfillmentConfig: representation,
        entityMappingUrl: RESTWS_V1 + "/entitymapping",
        encounterTypeUrl: RESTWS_V1 + "/encountertype",
        defaultExtensionName: "default",
        orderSetMemberAttributeTypeUrl: RESTWS_V1 + "/ordersetmemberattributetype",
        orderSetUrl: RESTWS_V1 + "/bahmniorderset",
        primaryOrderSetMemberAttributeTypeName: "Primary",
        bahmniBacteriologyResultsUrl: BACTERIOLOGY + "/specimen",
        bedFromVisit: RESTWS_V1 + "/beds",
        ordersUrl: RESTWS_V1 + "/order",
        formDataUrl: RESTWS_V1 + "/obs",
        providerUrl: RESTWS_V1 + "/provider",
        drugUrl: RESTWS_V1 + "/drug",
        orderTypeUrl: RESTWS_V1 + "/ordertype",
        userUrl: RESTWS_V1 + "/user",
        passwordUrl: RESTWS_V1 + "/password",
        formUrl: RESTWS_V1 + "/form",
        allFormsUrl: RESTWS_V1 + "/bahmniie/form/allForms",
        latestPublishedForms: RESTWS_V1 + "/bahmniie/form/latestPublishedForms",
        formTranslationsUrl: RESTWS_V1 + "/bahmniie/form/translations",
        sqlUrl: BAHMNI_CORE + "/sql",
        patientAttributeDateFieldFormat: "org.openmrs.util.AttributableDate",
        platform: "user.platform",
        RESTWS_V1: RESTWS_V1,
        baseUrl: BASE_URL,
        customUrl: CUSTOM_URL,
        faviconUrl: hostUrl + "/bahmni/favicon.ico",
        platformType: {
            other: 'other'
        },
        numericDataType: "Numeric",
        encryptionType: {
            SHA3: 'SHA3'
        },
        LoginInformation: 'LoginInformation',
        // orderSetSpecialUnits:["mg/kg","mg/m2"],
        ServerDateTimeFormat: 'YYYY-MM-DDTHH:mm:ssZZ',
        calculateDose: BAHMNI_CORE + "/calculateDose",
        unAuthenticatedReferenceDataMap: unAuthenticatedReferenceDataMap,
        authenticatedReferenceDataMap: authenticatedReferenceDataMap,
        rootDir: rootDir,
        dischargeUrl: BAHMNI_CORE + "/discharge",
        uuidRegex: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        eventlogFilterUrl: hostUrl + "/openmrs/ws/rest/v1/eventlog/filter",
        bahmniConnectMetaDataDb: "metaData",
        serverDateTimeUrl: "/cgi-bin/systemdate",
        loginText: "/bahmni_config/openmrs/apps/home/whiteLabel.json",
        auditLogUrl: RESTWS_V1 + "/auditlog",
        appointmentServiceUrl: RESTWS_V1 + "/appointmentService",
        conditionUrl: EMRAPI + '/condition',
        conditionHistoryUrl: EMRAPI + '/conditionhistory',
        followUpConditionConcept: 'Follow-up Condition',
        localeLangs: "/bahmni_config/openmrs/apps/home/locale_languages.json",
        privilegeRequiredErrorMessage: "PRIVILEGE_REQUIRED",
        defaultPossibleRelativeSearchLimit: 10
    };
})();


'use strict';

angular.module('bahmni.common.routeErrorHandler', ['ui.router'])
    .run(['$rootScope', function ($rootScope) {
        $rootScope.$on('$stateChangeError', function (event) {
            event.preventDefault();
        });
    }]);

'use strict';

var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};
Bahmni.Common.Util = Bahmni.Common.Util || {};

angular.module('bahmni.common.util', [])
    .provider('$bahmniCookieStore', [function () {
        var self = this;
        self.defaultOptions = {};
        var fixedEncodeURIComponent = function (str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
                return '%' + c.charCodeAt(0).toString(16);
            });
        };

        self.setDefaultOptions = function (options) {
            self.defaultOptions = options;
        };

        self.$get = function () {
            return {
                get: function (name) {
                    var jsonCookie = $.cookie(name);
                    if (jsonCookie) {
                        return angular.fromJson(decodeURIComponent(jsonCookie));
                    }
                    return null;
                },
                put: function (name, value, options) {
                    options = $.extend({}, self.defaultOptions, options);
                    $.cookie.raw = true;
                    $.cookie(name, fixedEncodeURIComponent(angular.toJson(value)), options);
                },
                remove: function (name, options) {
                    options = $.extend({}, self.defaultOptions, options);
                    $.removeCookie(name, options);
                }
            };
        };
    }])
;

'use strict';

Bahmni.Common.Util.DateUtil = {
    diffInDays: function (dateFrom, dateTo) {
        return Math.floor((this.parse(dateTo) - this.parse(dateFrom)) / (60 * 1000 * 60 * 24));
    },

    diffInMinutes: function (dateFrom, dateTo) {
        return moment(dateTo).diff(moment(dateFrom), 'minutes');
    },

    diffInSeconds: function (dateFrom, dateTo) {
        return moment(dateFrom).diff(moment(dateTo), 'seconds');
    },

    isInvalid: function (date) {
        return date == "Invalid Date";
    },

    diffInDaysRegardlessOfTime: function (dateFrom, dateTo) {
        var from = new Date(dateFrom);
        var to = new Date(dateTo);
        from.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);
        return Math.floor((to - from) / (60 * 1000 * 60 * 24));
    },

    addSeconds: function (date, seconds) {
        return moment(date).add(seconds, 'seconds').toDate();
    },

    addMinutes: function (date, minutes) {
        return this.addSeconds(date, minutes * 60);
    },

    addDays: function (date, days) {
        return moment(date).add(days, 'day').toDate();
    },
    addMonths: function (date, months) {
        return moment(date).add(months, 'month').toDate();
    },
    addYears: function (date, years) {
        return moment(date).add(years, 'year').toDate();
    },

    subtractSeconds: function (date, seconds) {
        return moment(date).subtract(seconds, 'seconds').toDate();
    },
    subtractDays: function (date, days) {
        return this.addDays(date, -1 * days);
    },
    subtractMonths: function (date, months) {
        return this.addMonths(date, -1 * months);
    },
    subtractYears: function (date, years) {
        return this.addYears(date, -1 * years);
    },

    createDays: function (startDate, endDate) {
        var startDate = this.getDate(startDate);
        var endDate = this.getDate(endDate);
        var numberOfDays = this.diffInDays(startDate, endDate);
        var days = [];
        for (var i = 0; i <= numberOfDays; i++) {
            days.push({dayNumber: i + 1, date: this.addDays(startDate, i)});
        }
        return days;
    },

    getDayNumber: function (referenceDate, date) {
        return this.diffInDays(this.getDate(referenceDate), this.getDate(date)) + 1;
    },

    getDateWithoutTime: function (datetime) {
        return datetime ? moment(datetime).format("YYYY-MM-DD") : null;
    },

    getDateInMonthsAndYears: function (date, format) {
        var format = format || "MMM YY";
        var dateRepresentation = isNaN(Number(date)) ? date : Number(date);
        if (!moment(dateRepresentation).isValid()) {
            return date;
        }
        return dateRepresentation ? moment(dateRepresentation).format(format) : null;
    },

    formatDateWithTime: function (datetime) {
        var dateRepresentation = isNaN(Number(datetime)) ? datetime : Number(datetime);
        if (!moment(dateRepresentation).isValid()) {
            return datetime;
        }
        return dateRepresentation ? moment(dateRepresentation).format("DD MMM YY h:mm a") : null;
    },

    formatDateWithoutTime: function (date) {
        var dateRepresentation = isNaN(Number(date)) ? date : Number(date);
        if (!moment(dateRepresentation).isValid()) {
            return date;
        }
        return dateRepresentation ? moment(dateRepresentation).format("DD MMM YY") : null;
    },

    formatDateInStrictMode: function (date) {
        var dateRepresentation = isNaN(Number(date)) ? date : Number(date);
        if (moment(dateRepresentation, 'YYYY-MM-DD', true).isValid()) {
            return moment(dateRepresentation).format("DD MMM YY");
        }
        if (moment(dateRepresentation, 'YYYY-MM-DDTHH:mm:ss.SSSZZ', true).isValid()) {
            return moment(dateRepresentation).format("DD MMM YY");
        }
        return date;
    },

    formatTime: function (date) {
        var dateRepresentation = isNaN(Number(date)) ? date : Number(date);
        if (!moment(dateRepresentation).isValid()) {
            return date;
        }
        return dateRepresentation ? moment(dateRepresentation).format("h:mm a") : null;
    },

    getDate: function (dateTime) {
        return moment(this.parse(dateTime)).startOf('day').toDate();
    },

    parse: function (dateString) {
        return dateString ? moment(dateString).toDate() : null;
    },

    parseDatetime: function (dateTimeString) {
        return dateTimeString ? moment(dateTimeString) : null;
    },

    now: function () {
        return new Date();
    },

    today: function () {
        return this.getDate(this.now());
    },
    endOfToday: function () {
        return moment(this.parse(this.now())).endOf('day').toDate();
    },

    getDateWithoutHours: function (dateString) {
        return moment(dateString).toDate().setHours(0, 0, 0, 0);
    },

    getDateTimeWithoutSeconds: function (dateString) {
        return moment(dateString).toDate().setSeconds(0, 0);
    },

    isSameDateTime: function (date1, date2) {
        if (date1 == null || date2 == null) {
            return false;
        }
        var dateOne = this.parse(date1);
        var dateTwo = this.parse(date2);
        return dateOne.getTime() == dateTwo.getTime();
    },

    isBeforeDate: function (date1, date2) {
        return moment(date1).isBefore(moment(date2));
    },
    isSameDate: function (date1, date2) {
        if (date1 == null || date2 == null) {
            return false;
        }
        var dateOne = this.parse(date1);
        var dateTwo = this.parse(date2);
        return dateOne.getFullYear() === dateTwo.getFullYear() &&
            dateOne.getMonth() === dateTwo.getMonth() &&
            dateOne.getDate() === dateTwo.getDate();
    },

    diffInYearsMonthsDays: function (dateFrom, dateTo) {
        dateFrom = this.parse(dateFrom);
        dateTo = this.parse(dateTo);

        var from = {
            d: dateFrom.getDate(),
            m: dateFrom.getMonth(),
            y: dateFrom.getFullYear()
        };

        var to = {
            d: dateTo.getDate(),
            m: dateTo.getMonth(),
            y: dateTo.getFullYear()
        };

        var age = {
            d: 0,
            m: 0,
            y: 0
        };

        var daysFebruary = to.y % 4 != 0 || (to.y % 100 == 0 && to.y % 400 != 0) ? 28 : 29;
        var daysInMonths = [31, daysFebruary, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        age.y = to.y - from.y;
        age.m = to.m - from.m;

        if (from.m > to.m) {
            age.y = age.y - 1;
            age.m = to.m - from.m + 12;
        }
        age.d = to.d - from.d;

        if (from.d > to.d) {
            age.m = age.m - 1;

            if (from.m == to.m) {
                age.y = age.y - 1;
                age.m = age.m + 12;
            }
            age.d = to.d - from.d + daysInMonths[parseInt(from.m)];
        }
        return {
            days: age.d,
            months: age.m,
            years: age.y
        };
    },

    convertToUnits: function (minutes) {
        var allUnits = {"Years": 365 * 24 * 60, "Months": 30 * 24 * 60, "Weeks": 7 * 24 * 60, "Days": 24 * 60, "Hours": 60, "Minutes": 1};

        var durationRepresentation = function (value, unitName, unitValueInMinutes) {
            return {"value": value, "unitName": unitName, "unitValueInMinutes": unitValueInMinutes, "allUnits": allUnits };
        };

        for (var unitName in allUnits) {
            var unitValueInMinutes = allUnits[unitName];
            if (minutes || minutes !== 0) {
                if (minutes >= unitValueInMinutes && minutes % unitValueInMinutes === 0) {
                    return durationRepresentation(minutes / unitValueInMinutes, unitName, unitValueInMinutes);
                }
            }
        }
        return durationRepresentation(undefined, undefined, undefined);
    },

    getEndDateFromDuration: function (dateFrom, value, unit) {
        dateFrom = this.parse(dateFrom);
        var from = {
            h: dateFrom.getHours(),
            d: dateFrom.getDate(),
            m: dateFrom.getMonth(),
            y: dateFrom.getFullYear()
        };
        var to = new Date(from.y, from.m, from.d, from.h);

        if (unit === "Months") {
            to.setMonth(from.m + value);
        } else if (unit === "Weeks") {
            to.setDate(from.d + (value * 7));
        } else if (unit === "Days") {
            to.setDate(from.d + value);
        } else if (unit === "Hours") {
            to.setHours(from.h + value);
        }
        return to;
    },

    parseLongDateToServerFormat: function (longDate) {
        return longDate ? moment(longDate).format("YYYY-MM-DDTHH:mm:ss.SSS") : null;
    },

    parseServerDateToDate: function (longDate) {
        return longDate ? moment(longDate, "YYYY-MM-DDTHH:mm:ss.SSSZZ").toDate() : null;
    },
    getDateTimeInSpecifiedFormat: function (date, format) {
        return date ? moment(date).format(format) : null;
    },
    getISOString: function (date) {
        return date ? moment(date).toDate().toISOString() : null;
    },
    isBeforeTime: function (time, otherTime) {
        return moment(time, 'hh:mm a').format('YYYY-MM-DD');
    }
};

'use strict';

Bahmni.Common.Util.ArrayUtil = {
    chunk: function (array, chunkSize) {
        var chunks = [];
        for (var i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    },

    groupByPreservingOrder: function (records, groupingFunction, keyName, valueName) {
        var groups = [];
        records.forEach(function (record) {
            var recordKey = groupingFunction(record);
            var existingGroup = _.find(groups, function (group) { return group[keyName] === recordKey; });
            if (existingGroup) {
                existingGroup[valueName].push(record);
            } else {
                var newGroup = {};
                newGroup[keyName] = recordKey;
                newGroup[valueName] = [record];
                groups.push(newGroup);
            }
        });
        return groups;
    }
};

'use strict';

angular.module('httpErrorInterceptor', [])
    .config(['$httpProvider', function ($httpProvider) {
        var interceptor = ['$rootScope', '$q', function ($rootScope, $q) {
            var serverErrorMessages = Bahmni.Common.Constants.serverErrorMessages;

            var showError = function (errorMessage) {
                var result = _.find(serverErrorMessages, function (listItem) {
                    return listItem.serverMessage === errorMessage;
                });
                if (_.isEmpty(result)) {
                    $rootScope.$broadcast('event:serverError', errorMessage);
                }
            };

            function stringAfter (value, searchString) {
                var indexOfFirstColon = value.indexOf(searchString);
                return value.substr(indexOfFirstColon + 1).trim();
            }

            function getServerError (message) {
                return stringAfter(message, ':');
            }

            function success (response) {
                return response;
            }

            function shouldRedirectToLogin (response) {
                var errorMessage = response.data.error ? response.data.error.message : response.data;
                if (errorMessage.search("HTTP Status 403 - Session timed out") > 0) {
                    return true;
                }
            }

            function error (response) {
                var data = response.data;
                var unexpectedError = "There was an unexpected issue on the server. Please try again";
                if (response.status === 500) {
                    var errorMessage = data.error && data.error.message ? getServerError(data.error.message) : unexpectedError;
                    showError(errorMessage);
                } else if (response.status === 409) {
                    var errorMessage = data.error && data.error.message ? getServerError(data.error.message) : "Duplicate entry error";
                    showError(errorMessage);
                } else if (response.status === 0) {
                    showError("Could not connect to the server. Please check your connection and try again");
                } else if (response.status === 405) {
                    showError(unexpectedError);
                } else if (response.status === 400) {
                    var errorMessage = data.error && data.error.message ? data.error.message : (data.localizedMessage || "Could not connect to the server. Please check your connection and try again");
                    showError(errorMessage);
                } else if (response.status === 403) {
                    var errorMessage = data.error && data.error.message ? data.error.message : unexpectedError;
                    if (shouldRedirectToLogin(response)) {
                        $rootScope.$broadcast('event:auth-loginRequired');
                    } else {
                        showError(errorMessage);
                    }
                } else if (response.status === 404) {
                    if (!_.includes(response.config.url, "implementation_config") && !_.includes(response.config.url, "locale_")
                        && !_.includes(response.config.url, "offlineMetadata")) {
                        showError("The requested information does not exist");
                    }
                }
                return $q.reject(response);
            }

            return {
                response: success,
                responseError: error
            };
        }];
        $httpProvider.interceptors.push(interceptor);
    }]);

'use strict';

Modernizr.addTest('ios', function () {
    return navigator.userAgent.match(/(iPad|iPhone|iPod)/i) ? true : false;
});

Modernizr.addTest('windowOS', function () {
    return navigator.appVersion.indexOf("Win") != -1;
});

'use strict';

$(function () {
    if (Modernizr.ios) {
        // This fix is needed when we use fastclick.js on ipad
        $(document).on("click", "label[for]", function () {
            var $inputElement = $('input#' + $(this).attr('for'));
            var elementType = $inputElement.attr('type');
            if (elementType === 'radio') {
                $inputElement.prop('checked', true);
            } else if (elementType === 'checkbox') {
                $inputElement.prop('checked', !$inputElement.prop('checked'));
            } else {
                $inputElement.focus();
            }
        });
    }
});

'use strict';

Bahmni.Common.Util.DateTimeFormatter = {

    getDateWithoutTime: function (datetime) {
        return datetime ? moment(datetime).format("YYYY-MM-DD") : null;
    }
};

var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};
Bahmni.Common.Models = Bahmni.Common.Models || {};

angular.module('bahmni.common.models', []);

'use strict';
var Bahmni = Bahmni || {};
Bahmni.Auth = Bahmni.Auth || {};

angular.module('authentication', ['ui.router']);

'use strict';

Bahmni.Auth.User = function (user) {
    angular.extend(this, user);

    this.userProperties = user.userProperties || {};
    this.favouriteObsTemplates = this.userProperties.favouriteObsTemplates ? this.userProperties.favouriteObsTemplates.split("###") : [];
    this.favouriteWards = this.userProperties.favouriteWards ? this.userProperties.favouriteWards.split("###") : [];
    this.recentlyViewedPatients = this.userProperties.recentlyViewedPatients ? JSON.parse(this.userProperties.recentlyViewedPatients) : [];

    this.toContract = function () {
        var user = angular.copy(this);
        user.userProperties.favouriteObsTemplates = this.favouriteObsTemplates.join("###");
        user.userProperties.favouriteWards = this.favouriteWards.join("###");
        user.userProperties.recentlyViewedPatients = JSON.stringify(this.recentlyViewedPatients);
        delete user.favouriteObsTemplates;
        delete user.favouriteWards;
        delete user.recentlyViewedPatients;
        return user;
    };

    this.addDefaultLocale = function (locale) {
        this.userProperties['defaultLocale'] = locale;
    };

    this.addToRecentlyViewed = function (patient, maxPatients) {
        if (!_.some(this.recentlyViewedPatients, {'uuid': patient.uuid})) {
            this.recentlyViewedPatients.unshift({
                uuid: patient.uuid,
                name: patient.name,
                identifier: patient.identifier
            });
            if (_.size(this.recentlyViewedPatients) >= maxPatients) {
                this.recentlyViewedPatients = _.take(this.recentlyViewedPatients, maxPatients);
            }
        }
    };

    this.isFavouriteObsTemplate = function (conceptName) {
        return _.includes(this.favouriteObsTemplates, conceptName);
    };

    this.toggleFavoriteObsTemplate = function (conceptName) {
        if (this.isFavouriteObsTemplate(conceptName)) {
            this.favouriteObsTemplates = _.without(this.favouriteObsTemplates, conceptName);
        } else {
            this.favouriteObsTemplates.push(conceptName);
        }
    };

    this.isFavouriteWard = function (wardName) {
        return _.includes(this.favouriteWards, wardName);
    };

    this.toggleFavoriteWard = function (wardName) {
        if (this.isFavouriteWard(wardName)) {
            this.favouriteWards = _.without(this.favouriteWards, wardName);
        } else {
            this.favouriteWards.push(wardName);
        }
    };
};


'use strict';

angular.module('authentication')
    .service('userService', ['$rootScope', '$http', '$q', function ($rootScope, $http, $q) {
        var getUserFromServer = function (userName) {
            return $http.get(Bahmni.Common.Constants.userUrl, {
                method: "GET",
                params: {
                    username: userName,
                    v: "custom:(username,uuid,person:(uuid,),privileges:(name,retired),userProperties)"
                },
                cache: false
            });
        };

        this.getUser = function (userName) {
            var deferrable = $q.defer();
            getUserFromServer(userName).success(function (data) {
                deferrable.resolve(data);
            }).error(function () {
                deferrable.reject('Unable to get user data');
            });

            return deferrable.promise;
        };

        this.savePreferences = function () {
            var deferrable = $q.defer();
            var user = $rootScope.currentUser.toContract();
            $http.post(Bahmni.Common.Constants.userUrl + "/" + user.uuid, {"uuid": user.uuid, "userProperties": user.userProperties}, {
                withCredentials: true
            }).then(function (response) {
                $rootScope.currentUser.userProperties = response.data.userProperties;
                deferrable.resolve();
            });
            return deferrable.promise;
        };

        var getProviderFromServer = function (uuid) {
            return $http.get(Bahmni.Common.Constants.providerUrl, {
                method: "GET",
                params: {
                    user: uuid
                },
                cache: false
            });
        };

        this.getProviderForUser = function (uuid) {
            var deferrable = $q.defer();

            getProviderFromServer(uuid).success(function (data) {
                if (data.results.length > 0) {
                    var providerName = data.results[0].display.split("-")[1];
                    data.results[0].name = providerName ? providerName.trim() : providerName;
                    deferrable.resolve(data);
                } else {
                    deferrable.reject("UNABLE_TO_GET_PROVIDER_DATA");
                }
            }).error(function () {
                deferrable.reject("UNABLE_TO_GET_PROVIDER_DATA");
            });

            return deferrable.promise;
        };

        this.getPasswordPolicies = function () {
            return $http.get(Bahmni.Common.Constants.passwordPolicyUrl, {
                method: "GET",
                withCredentials: true
            });
        };
    }]);

'use strict';

angular.module('authentication')
    .config(['$httpProvider', function ($httpProvider) {
        var interceptor = ['$rootScope', '$q', function ($rootScope, $q) {
            function success (response) {
                return response;
            }

            function error (response) {
                if (response.status === 401) {
                    $rootScope.$broadcast('event:auth-loginRequired');
                }
                return $q.reject(response);
            }

            return {
                response: success,
                responseError: error
            };
        }];
        $httpProvider.interceptors.push(interceptor);
    }]).run(['$rootScope', '$window', '$timeout', function ($rootScope, $window, $timeout) {
        $rootScope.$on('event:auth-loginRequired', function () {
            $timeout(function () {
                $window.location = "../home/index.html#/login";
            });
        });
    }]).service('sessionService', ['$rootScope', '$http', '$q', '$bahmniCookieStore', 'userService', function ($rootScope, $http, $q, $bahmniCookieStore, userService) {
        var sessionResourcePath = Bahmni.Common.Constants.RESTWS_V1 + '/session?v=custom:(uuid)';

        var getAuthFromServer = function (username, password, otp) {
            var btoa = otp ? username + ':' + password + ':' + otp : username + ':' + password;
            return $http.get(sessionResourcePath, {
                headers: {'Authorization': 'Basic ' + window.btoa(btoa)},
                cache: false
            });
        };

        this.resendOTP = function (username, password) {
            var btoa = username + ':' + password;
            return $http.get(sessionResourcePath + '&resendOTP=true', {
                headers: {'Authorization': 'Basic ' + window.btoa(btoa)},
                cache: false
            });
        };

        var createSession = function (username, password, otp) {
            var deferrable = $q.defer();

            destroySessionFromServer().success(function () {
                getAuthFromServer(username, password, otp).then(function (response) {
                    if (response.status == 204) {
                        deferrable.resolve({"firstFactAuthorization": true});
                    }
                    deferrable.resolve(response.data);
                }, function (response) {
                    if (response.status == 401) {
                        deferrable.reject('LOGIN_LABEL_WRONG_OTP_MESSAGE_KEY');
                    } else if (response.status == 410) {
                        deferrable.reject('LOGIN_LABEL_OTP_EXPIRED');
                    } else if (response.status == 429) { // Too many requests
                        deferrable.reject('LOGIN_LABEL_MAX_FAILED_ATTEMPTS');
                    }
                    deferrable.reject('LOGIN_LABEL_LOGIN_ERROR_MESSAGE_KEY');
                });
            }).error(function () {
                deferrable.reject('LOGIN_LABEL_LOGIN_ERROR_MESSAGE_KEY');
            });
            return deferrable.promise;
        };

        var hasAnyActiveProvider = function (providers) {
            return _.filter(providers, function (provider) {
                return (provider.retired == undefined || provider.retired == "false");
            }).length > 0;
        };

        var self = this;

        var destroySessionFromServer = function () {
            return $http.delete(sessionResourcePath);
        };

        var sessionCleanup = function () {
            delete $.cookie(Bahmni.Common.Constants.currentUser, null, {path: "/"});
            delete $.cookie(Bahmni.Common.Constants.currentUser, null, {path: "/"});
            delete $.cookie(Bahmni.Common.Constants.retrospectiveEntryEncounterDateCookieName, null, {path: "/"});
            delete $.cookie(Bahmni.Common.Constants.grantProviderAccessDataCookieName, null, {path: "/"});
            $rootScope.currentUser = undefined;
        };

        this.destroy = function () {
            var deferrable = $q.defer();
            destroySessionFromServer().then(function () {
                sessionCleanup();
                deferrable.resolve();
            });
            return deferrable.promise;
        };

        this.loginUser = function (username, password, location, otp) {
            var deferrable = $q.defer();
            createSession(username, password, otp).then(function (data) {
                if (data.authenticated) {
                    $bahmniCookieStore.put(Bahmni.Common.Constants.currentUser, username, {path: '/', expires: 7});
                    if (location != undefined) {
                        $bahmniCookieStore.remove(Bahmni.Common.Constants.locationCookieName);
                        $bahmniCookieStore.put(Bahmni.Common.Constants.locationCookieName, {name: location.display, uuid: location.uuid}, {path: '/', expires: 7});
                    }
                    deferrable.resolve(data);
                } else if (data.firstFactAuthorization) {
                    deferrable.resolve(data);
                } else {
                    deferrable.reject('LOGIN_LABEL_LOGIN_ERROR_MESSAGE_KEY');
                }
            }, function (errorInfo) {
                deferrable.reject(errorInfo);
            });
            return deferrable.promise;
        };

        this.get = function () {
            return $http.get(sessionResourcePath, { cache: false });
        };

        this.loadCredentials = function () {
            var deferrable = $q.defer();
            var currentUser = $bahmniCookieStore.get(Bahmni.Common.Constants.currentUser);
            if (!currentUser) {
                this.destroy().finally(function () {
                    $rootScope.$broadcast('event:auth-loginRequired');
                    deferrable.reject("No User in session. Please login again.");
                });
                return deferrable.promise;
            }
            userService.getUser(currentUser).then(function (data) {
                userService.getProviderForUser(data.results[0].uuid).then(function (providers) {
                    if (!_.isEmpty(providers.results) && hasAnyActiveProvider(providers.results)) {
                        $rootScope.currentUser = new Bahmni.Auth.User(data.results[0]);
                        $rootScope.currentUser.currentLocation = $bahmniCookieStore.get(Bahmni.Common.Constants.locationCookieName).name;
                        $rootScope.$broadcast('event:user-credentialsLoaded', data.results[0]);
                        deferrable.resolve(data.results[0]);
                    } else {
                        self.destroy();
                        deferrable.reject("YOU_HAVE_NOT_BEEN_SETUP_PROVIDER");
                    }
                },
               function () {
                   self.destroy();
                   deferrable.reject("COULD_NOT_GET_PROVIDER");
               });
            }, function () {
                self.destroy();
                deferrable.reject('Could not get roles for the current user.');
            });
            return deferrable.promise;
        };

        this.getLoginLocationUuid = function () {
            return $bahmniCookieStore.get(Bahmni.Common.Constants.locationCookieName) ? $bahmniCookieStore.get(Bahmni.Common.Constants.locationCookieName).uuid : null;
        };

        this.changePassword = function (currentUserUuid, oldPassword, newPassword) {
            return $http({
                method: 'POST',
                url: Bahmni.Common.Constants.passwordUrl,
                data: {
                    "oldPassword": oldPassword,
                    "newPassword": newPassword
                },
                headers: {'Content-Type': 'application/json'}
            });
        };

        this.loadProviders = function (userInfo) {
            return $http.get(Bahmni.Common.Constants.providerUrl, {
                method: "GET",
                params: {
                    user: userInfo.uuid
                },
                cache: false
            }).success(function (data) {
                var providerUuid = (data.results.length > 0) ? data.results[0].uuid : undefined;
                $rootScope.currentProvider = { uuid: providerUuid };
            });
        };
    }]).factory('authenticator', ['$rootScope', '$q', '$window', 'sessionService', function ($rootScope, $q, $window, sessionService) {
        var authenticateUser = function () {
            var defer = $q.defer();
            var sessionDetails = sessionService.get();
            sessionDetails.then(function (response) {
                if (response.data.authenticated) {
                    defer.resolve();
                } else {
                    defer.reject('User not authenticated');
                    $rootScope.$broadcast('event:auth-loginRequired');
                }
            });
            return defer.promise;
        };

        return {
            authenticateUser: authenticateUser
        };
    }]).directive('logOut', ['sessionService', '$window', 'configurationService', 'auditLogService', function (sessionService, $window, configurationService, auditLogService) {
        return {
            link: function (scope, element) {
                element.bind('click', function () {
                    scope.$apply(function () {
                        auditLogService.log(undefined, 'USER_LOGOUT_SUCCESS', undefined, 'MODULE_LABEL_LOGOUT_KEY').then(function () {
                            sessionService.destroy().then(
                                function () {
                                    $window.location = "../home/index.html#/login";
                                });
                        });
                    });
                });
            }
        };
    }])
    .directive('btnUserInfo', [function () {
        return {
            restrict: 'CA',
            link: function (scope, elem) {
                elem.bind('click', function (event) {
                    $(this).next().toggleClass('active');
                    event.stopPropagation();
                });
                $(document).find('body').bind('click', function () {
                    $(elem).next().removeClass('active');
                });
            }
        };
    }
    ]);

angular.module('bahmni.common.appFramework', ['authentication']);

var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};
Bahmni.Common.AppFramework = Bahmni.Common.AppFramework || {};

'use strict';

angular.module('bahmni.common.appFramework')
    .config(['$compileProvider', function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|file):/);
    }])
    .service('appService', ['$http', '$q', 'sessionService', '$rootScope', 'mergeService', 'loadConfigService', 'messagingService', '$translate',
        function ($http, $q, sessionService, $rootScope, mergeService, loadConfigService, messagingService, $translate) {
            var currentUser = null;
            var baseUrl = Bahmni.Common.Constants.baseUrl;
            var customUrl = Bahmni.Common.Constants.customUrl;
            var appDescriptor = null;

            var loadConfig = function (url) {
                return loadConfigService.loadConfig(url, appDescriptor.contextPath);
            };

            var loadTemplate = function (appDescriptor) {
                var deferrable = $q.defer();
                loadConfig(baseUrl + appDescriptor.contextPath + "/appTemplate.json").then(
                function (result) {
                    if (_.keys(result.data).length > 0) {
                        appDescriptor.setTemplate(result.data);
                    }
                    deferrable.resolve(appDescriptor);
                },
                function (error) {
                    if (error.status !== 404) {
                        deferrable.reject(error);
                    } else {
                        deferrable.resolve(appDescriptor);
                    }
                }
            );
                return deferrable.promise;
            };

            var setDefinition = function (baseResultData, customResultData) {
                if (customResultData && (_.keys(baseResultData).length > 0 || _.keys(customResultData.length > 0))) {
                    appDescriptor.setDefinition(baseResultData, customResultData);
                } else if (_.keys(baseResultData).length > 0) {
                    appDescriptor.setDefinition(baseResultData);
                }
            };

            var loadDefinition = function (appDescriptor) {
                var deferrable = $q.defer();
                loadConfig(baseUrl + appDescriptor.contextPath + "/app.json").then(
                function (baseResult) {
                    if (baseResult.data.shouldOverRideConfig) {
                        loadConfig(customUrl + appDescriptor.contextPath + "/app.json").then(function (customResult) {
                            setDefinition(baseResult.data, customResult.data);
                            deferrable.resolve(appDescriptor);
                        },
                            function () {
                                setDefinition(baseResult.data);
                                deferrable.resolve(appDescriptor);
                            });
                    } else {
                        setDefinition(baseResult.data);
                        deferrable.resolve(appDescriptor);
                    }
                }, function (error) {
                    if (error.status !== 404) {
                        deferrable.reject(error);
                    } else {
                        deferrable.resolve(appDescriptor);
                    }
                });
                return deferrable.promise;
            };

            var setExtensions = function (baseResultData, customResultData) {
                if (customResultData) {
                    appDescriptor.setExtensions(baseResultData, customResultData);
                } else {
                    appDescriptor.setExtensions(baseResultData);
                }
            };
            var loadExtensions = function (appDescriptor, extensionFileName) {
                var deferrable = $q.defer();
                loadConfig(baseUrl + appDescriptor.extensionPath + extensionFileName).then(function (baseResult) {
                    if (baseResult.data.shouldOverRideConfig) {
                        loadConfig(customUrl + appDescriptor.extensionPath + extensionFileName).then(
                        function (customResult) {
                            setExtensions(baseResult.data, customResult.data);
                            deferrable.resolve(appDescriptor);
                        },
                        function () {
                            setExtensions(baseResult.data);
                            deferrable.resolve(appDescriptor);
                        });
                    } else {
                        setExtensions(baseResult.data);
                        deferrable.resolve(appDescriptor);
                    }
                }, function (error) {
                    if (error.status !== 404) {
                        deferrable.reject(error);
                    } else {
                        deferrable.resolve(appDescriptor);
                    }
                });
                return deferrable.promise;
            };

            var setDefaultPageConfig = function (pageName, baseResultData, customResultData) {
                if (customResultData && (_.keys(customResultData).length > 0 || _.keys(baseResultData).length > 0)) {
                    appDescriptor.addConfigForPage(pageName, baseResultData, customResultData);
                } else if (_.keys(baseResultData).length > 0) {
                    appDescriptor.addConfigForPage(pageName, baseResultData);
                }
            };

            var hasPrivilegeOf = function (privilegeName) {
                return _.some(currentUser.privileges, {name: privilegeName});
            };

            var loadPageConfig = function (pageName, appDescriptor) {
                var deferrable = $q.defer();
                loadConfig(baseUrl + appDescriptor.contextPath + "/" + pageName + ".json").then(
                function (baseResult) {
                    if (baseResult.data.shouldOverRideConfig) {
                        loadConfig(customUrl + appDescriptor.contextPath + "/" + pageName + ".json").then(
                            function (customResult) {
                                setDefaultPageConfig(pageName, baseResult.data, customResult.data);
                                deferrable.resolve(appDescriptor);
                            },
                            function () {
                                setDefaultPageConfig(pageName, baseResult.data);
                                deferrable.resolve(appDescriptor);
                            });
                    } else {
                        setDefaultPageConfig(pageName, baseResult.data);
                        deferrable.resolve(appDescriptor);
                    }
                }, function (error) {
                    if (error.status !== 404) {
                        messagingService.showMessage('error', "Incorrect Configuration:  " + error.message);
                        deferrable.reject(error);
                    } else {
                        deferrable.resolve(appDescriptor);
                    }
                });
                return deferrable.promise;
            };
            this.getAppDescriptor = function () {
                return appDescriptor;
            };

            this.configBaseUrl = function () {
                return baseUrl;
            };

            this.loadCsvFileFromConfig = function (name) {
                return loadConfig(baseUrl + appDescriptor.contextPath + "/" + name);
            };

            this.loadConfig = function (name, shouldMerge) {
                return loadConfig(baseUrl + appDescriptor.contextPath + "/" + name).then(
                function (baseResponse) {
                    if (baseResponse.data.shouldOverRideConfig) {
                        return loadConfig(customUrl + appDescriptor.contextPath + "/" + name).then(function (customResponse) {
                            if (shouldMerge || shouldMerge === undefined) {
                                return mergeService.merge(baseResponse.data, customResponse.data);
                            }
                            return [baseResponse.data, customResponse.data];
                        }, function () {
                            return baseResponse.data;
                        });
                    } else {
                        return baseResponse.data;
                    }
                }
            );
            };

            this.loadMandatoryConfig = function (path) {
                return $http.get(path);
            };

            this.getAppName = function () {
                return this.appName;
            };

            this.checkPrivilege = function (privilegeName) {
                if (hasPrivilegeOf(privilegeName)) {
                    return $q.when(true);
                }
                messagingService.showMessage("error", $translate.instant(Bahmni.Common.Constants.privilegeRequiredErrorMessage) + " [Privileges required: " + privilegeName + "]");
                return $q.reject();
            };

            this.initApp = function (appName, options, extensionFileSuffix, configPages) {
                this.appName = appName;
                var appLoader = $q.defer();
                var extensionFileName = (extensionFileSuffix && extensionFileSuffix.toLowerCase() !== 'default') ? "/extension-" + extensionFileSuffix + ".json" : "/extension.json";
                var promises = [];
                var opts = options || {'app': true, 'extension': true};

                var inheritAppContext = (!opts.inherit) ? true : opts.inherit;

                appDescriptor = new Bahmni.Common.AppFramework.AppDescriptor(appName, inheritAppContext, function () {
                    return currentUser;
                }, mergeService);

                var loadCredentialsPromise = sessionService.loadCredentials();
                var loadProviderPromise = loadCredentialsPromise.then(sessionService.loadProviders);

                promises.push(loadCredentialsPromise);
                promises.push(loadProviderPromise);
                if (opts.extension) {
                    promises.push(loadExtensions(appDescriptor, extensionFileName));
                }
                if (opts.template) {
                    promises.push(loadTemplate(appDescriptor));
                }
                if (opts.app) {
                    promises.push(loadDefinition(appDescriptor));
                }
                if (!_.isEmpty(configPages)) {
                    configPages.forEach(function (configPage) {
                        promises.push(loadPageConfig(configPage, appDescriptor));
                    });
                }
                $q.all(promises).then(function (results) {
                    currentUser = results[0];
                    appLoader.resolve(appDescriptor);
                    $rootScope.$broadcast('event:appExtensions-loaded');
                }, function (errors) {
                    appLoader.reject(errors);
                });
                return appLoader.promise;
            };

            // **************Function to be used to set and get flags****************
            let Regimen = '';
            let isActiveSet = false; 
            let isDeactivated = false;
            let Followupdate = '';
            let isOderhasBeenSaved = null;
            let isOrderRegimenInserted = false;
            this.setRegimen  = function (_regimen){
                Regimen = _regimen;
            }
            this.getRegimen = function()
            {
                return Regimen;
            }
            this.setActive  = function (_isActiveSet){
                isActiveSet = _isActiveSet;
            }
            this.getActive  = function()
            {
                return isActiveSet;
            }
            this.setDeactivated  = function (_isDeactivated){
                isDeactivated = _isDeactivated;
            }
            this.getDeactivated = function()
            {
                return isDeactivated;
            }
            this.setFollowupdate  = function (_Followupdate){
                Followupdate = _Followupdate ;
            }
            this.getFollowupdate  = function()
            {
                return Followupdate ;
            }
            this.setOrderstatus = function (_isOderhasBeenSaved){
                isOderhasBeenSaved= _isOderhasBeenSaved;
            }
            this.getOrderstatus  = function()
            {
                return isOderhasBeenSaved ;
            }
            this.setIsOrderRegimenInserted = function (_isOrderRegimenInserted){
                isOrderRegimenInserted= _isOrderRegimenInserted;
            }
            this.getIsOrderRegimenInserted  = function(){
                return isOrderRegimenInserted;
            }

            //---------------------------Auto fill of observations flags
            //**Setting a check field for autopopulations on forms */
            let isFormSaved = false;
            let savedFormName = '';
            this.setSavedFormCheck = function (_isFormSaved ){
                isFormSaved = _isFormSaved;
            }
            this.getSavedFormCheck   = function()
            {
                return isFormSaved;
            }
            this.setFormName   = function (_savedFormName ){
                savedFormName  = _savedFormName ;
            }
            this.getFormName   = function()
            {
                return savedFormName ;
            }
        }]);

'use strict';

angular.module('bahmni.common.appFramework')
    .service('mergeService', [function () {
        this.merge = function (base, custom) {
            var mergeResult = $.extend(true, {}, base, custom);
            return deleteNullValuedKeys(mergeResult);
        };
        var deleteNullValuedKeys = function (currentObject) {
            _.forOwn(currentObject, function (value, key) {
                if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
                    (_.isObject(value) && _.isNull(deleteNullValuedKeys(value)))) {
                    delete currentObject[key];
                }
            });
            return currentObject;
        };
    }]);

'use strict';

angular.module('bahmni.common.appFramework')
    .directive('appExtensionList', ['appService', function (appService) {
        var appDescriptor = appService.getAppDescriptor();
        return {
            restrict: 'EA',
            template: '<ul><li ng-repeat="appExtn in appExtensions">' +
            '<a href="{{formatUrl(appExtn.url, extnParams)}}" class="{{appExtn.icon}}" ' +
            ' onclick="return false;" title="{{appExtn.label}}" ng-click="extnLinkClick(appExtn, extnParams)">' +
            ' <span ng-show="showLabel">{{appExtn.label}}</span>' +
            '</a></li></ul>',
            scope: {
                extnPointId: '@',
                showLabel: '@',
                onExtensionClick: '&',
                contextModel: '&'
            },
            compile: function (cElement, cAttrs) {
                var extnList = appDescriptor.getExtensions(cAttrs.extnPointId);
                return function (scope) {
                    scope.appExtensions = extnList;
                    var model = scope.contextModel();
                    scope.extnParams = model || {};
                };
            },
            controller: function ($scope, $location) {
                $scope.formatUrl = appDescriptor.formatUrl;
                $scope.extnLinkClick = function (extn, params) {
                    var proceedWithDefault = true;
                    var clickHandler = $scope.onExtensionClick();
                    var target = appDescriptor.formatUrl(extn.url, params);
                    if (clickHandler) {
                        var event = {
                            'src': extn,
                            'target': target,
                            'params': params,
                            'preventDefault': function () {
                                proceedWithDefault = false;
                            }
                        };
                        clickHandler(event);
                    }
                    if (proceedWithDefault) {
                        $location.url(target);
                    }
                };
            }
        };
    }]);

'use strict';

Bahmni.Common.AppFramework.AppDescriptor = function (context, inheritContext, retrieveUserCallback, mergeService) {
    this.id = null;
    this.instanceOf = null;
    this.description = null;
    this.contextModel = null;

    this.baseExtensionPoints = [];
    this.customExtensionPoints = [];

    this.baseExtensions = {};
    this.customExtensions = {};

    this.customConfigs = {};
    this.baseConfigs = {};

    this.extensionPath = context;
    this.contextPath = inheritContext ? context.split("/")[0] : context;

    var self = this;

    var setExtensionPointsFromExtensions = function (currentExtensions, currentExtensionPoints) {
        _.values(currentExtensions).forEach(function (extn) {
            if (extn) {
                var existing = self[currentExtensionPoints].filter(function (ep) {
                    return ep.id === extn.extensionPointId;
                });
                if (existing.length === 0) {
                    self[currentExtensionPoints].push({
                        id: extn.extensionPointId,
                        description: extn.description
                    });
                }
            }
        });
    };

    this.setExtensions = function (baseExtensions, customExtensions) {
        if (customExtensions) {
            setExtensionPointsFromExtensions(customExtensions, "customExtensionPoints");
            self.customExtensions = customExtensions;
        }
        self.baseExtensions = baseExtensions;
        setExtensionPointsFromExtensions(baseExtensions, "baseExtensionPoints");
    };

    this.setTemplate = function (template) {
        self.instanceOf = template.id;
        self.description = self.description || template.description;
        self.contextModel = self.contextModel || template.contextModel;
        if (template.configOptions) {
            _.values(template.configOptions).forEach(function (opt) {
                var existing = self.configs.filter(function (cfg) {
                    return cfg.name === opt.name;
                });
                if (existing.length > 0) {
                    existing[0].description = opt.description;
                } else {
                    self.configs.push({
                        name: opt.name,
                        description: opt.description,
                        value: opt.defaultValue
                    });
                }
            });
        }
    };

    var setConfig = function (instance, currentConfig) {
        for (var configName in instance.config) {
            var existingConfig = getConfig(self[currentConfig], configName);
            if (existingConfig) {
                existingConfig.value = instance.config[configName];
            } else {
                self[currentConfig][configName] = { name: configName, value: instance.config[configName] };
            }
        }
    };

    var setDefinitionExtensionPoints = function (extensionPoints, currentExtensionPoints) {
        if (extensionPoints) {
            extensionPoints.forEach(function (iep) {
                if (iep) {
                    var existing = self[currentExtensionPoints].filter(function (ep) {
                        return ep.id === iep.id;
                    });
                    if (existing.length === 0) {
                        self[currentExtensionPoints].push(iep);
                    }
                }
            });
        }
    };

    this.setDefinition = function (baseInstance, customInstance) {
        self.instanceOf = (customInstance && customInstance.instanceOf) ? customInstance.instanceOf : baseInstance.instanceOf;
        self.id = (customInstance && customInstance.id) ? customInstance.id : baseInstance.id;
        self.description = (customInstance && customInstance.description) ? customInstance.description : baseInstance.description;
        self.contextModel = (customInstance && customInstance.contextModel) ? customInstance.contextModel : baseInstance.contextModel;

        setDefinitionExtensionPoints(baseInstance.extensionPoints, "baseExtensionPoints");
        setConfig(baseInstance, "baseConfigs");
        if (customInstance) {
            setDefinitionExtensionPoints(customInstance.extensionPoints, "customExtensionPoints");
            setConfig(customInstance, "customConfigs");
        }
    };

    var getExtensions = function (extPointId, type, extensions) {
        var currentUser = retrieveUserCallback();
        var currentExtensions = _.values(extensions);
        if (currentUser && currentExtensions) {
            var extnType = type || 'all';
            var userPrivileges = currentUser.privileges.map(function (priv) {
                return priv.retired ? "" : priv.name;
            });
            var appsExtns = currentExtensions.filter(function (extn) {
                return ((extnType === 'all') || (extn.type === extnType)) &&
                    (extn.extensionPointId === extPointId) && (!extn.requiredPrivilege ||
                    (userPrivileges.indexOf(extn.requiredPrivilege) >= 0));
            });
            appsExtns.sort(function (extn1, extn2) {
                return extn1.order - extn2.order;
            });
            return appsExtns;
        }
    };

    this.getExtensions = function (extPointId, type, shouldMerge) {
        if (shouldMerge || shouldMerge === undefined) {
            var mergedExtensions = mergeService.merge(self.baseExtensions, self.customExtensions);
            return getExtensions(extPointId, type, mergedExtensions);
        }
        return [getExtensions(extPointId, type, self.baseExtensions), getExtensions(extPointId, type, self.customExtensions)];
    };

    this.getExtensionById = function (id, shouldMerge) {
        if (shouldMerge || shouldMerge === undefined) {
            var mergedExtensions = _.values(mergeService.merge(self.baseExtensions, self.customExtensions));
            return mergedExtensions.filter(function (extn) {
                return extn.id === id;
            })[0];
        } else {
            return [self.baseExtensions.filter(function (extn) {
                return extn.id === id;
            })[0], self.customExtensions.filter(function (extn) {
                return extn.id === id;
            })[0]];
        }
    };

    var getConfig = function (config, configName) {
        var cfgList = _.values(config).filter(function (cfg) {
            return cfg.name === configName;
        });
        return (cfgList.length > 0) ? cfgList[0] : null;
    };

    this.getConfig = function (configName, shouldMerge) {
        if (shouldMerge || shouldMerge === undefined) {
            return getConfig(mergeService.merge(self.baseConfigs, self.customConfigs), configName);
        } else {
            return [getConfig(self.baseConfigs, configName), getConfig(self.customConfigs, configName)];
        }
    };

    this.getConfigValue = function (configName, shouldMerge) {
        var config = this.getConfig(configName, shouldMerge);

        if (shouldMerge || shouldMerge === undefined) {
            return config ? config.value : null;
        }
        return config;
    };

    this.formatUrl = function (url, options, useQueryParams) {
        var pattern = /{{([^}]*)}}/g,
            matches = url.match(pattern),
            replacedString = url,
            checkQueryParams = useQueryParams || false,
            queryParameters = this.parseQueryParams();
        if (matches) {
            matches.forEach(function (el) {
                var key = el.replace("{{", '').replace("}}", '');
                var value = options[key];
                if (!value && (checkQueryParams === true)) {
                    value = queryParameters[key] || null;
                }
                replacedString = replacedString.replace(el, value);
            });
        }
        return replacedString.trim();
    };

    this.parseQueryParams = function (locationSearchString) {
        var urlParams;
        var match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            queryString = locationSearchString || window.location.search.substring(1);

        urlParams = {};
        while (match = search.exec(queryString)) {  // eslint-disable-line no-cond-assign
            urlParams[decode(match[1])] = decode(match[2]);
        }
        return urlParams;
    };

    this.addConfigForPage = function (pageName, baseConfig, customConfig) {
        self.basePageConfigs = self.basePageConfigs || {};
        self.basePageConfigs[pageName] = baseConfig;

        self.customPageConfigs = self.customPageConfigs || {};
        self.customPageConfigs[pageName] = customConfig;
    };

    this.getConfigForPage = function (pageName, shouldMerge) {
        if (shouldMerge || shouldMerge === undefined) {
            return mergeService.merge(self.basePageConfigs[pageName], self.customPageConfigs[pageName]);
        }
        return [_.values(self.basePageConfigs[pageName]), _.values(self.customPageConfigs[pageName])];
    };
};

'use strict';

angular.module('bahmni.common.appFramework')
    .service('loadConfigService', ['$http', function ($http) {
        this.loadConfig = function (url) {
            return $http.get(url, {withCredentials: true});
        };
    }]);

'use strict';
var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};
Bahmni.Common.DisplayControl = Bahmni.Common.DisplayControl || {};
Bahmni.Common.DisplayControl.PatientProfile = Bahmni.Common.DisplayControl.PatientProfile || {};

angular.module('bahmni.common.displaycontrol.patientprofile', []);

'use strict';

angular.module('bahmni.common.displaycontrol.patientprofile')
    .filter('titleCase', function () {
        return function (input) {
            input = input || '';
            return input.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };
    });

angular.module('bahmni.common.config', []);

'use strict';

angular.module('bahmni.common.config')
    .service('configurations', ['configurationService', function (configurationService) {
        this.configs = {};

        this.load = function (configNames) {
            var self = this;
            return configurationService.getConfigurations(_.difference(configNames, Object.keys(this.configs))).then(function (configurations) {
                angular.extend(self.configs, configurations);
            });
        };

        this.dosageInstructionConfig = function () {
            return this.configs.dosageInstructionConfig || [];
        };

        this.stoppedOrderReasonConfig = function () {
            return this.configs.stoppedOrderReasonConfig || [];
        };

        this.dosageFrequencyConfig = function () {
            return this.configs.dosageFrequencyConfig || [];
        };

        this.allTestsAndPanelsConcept = function () {
            return this.configs.allTestsAndPanelsConcept.results[0] || [];
        };

        this.impressionConcept = function () {
            return this.configs.radiologyImpressionConfig.results[0] || [];
        };

        this.labOrderNotesConcept = function () {
            return this.configs.labOrderNotesConfig.results[0] || [];
        };

        this.consultationNoteConcept = function () {
            return this.configs.consultationNoteConfig.results[0] || [];
        };

        this.patientConfig = function () {
            return this.configs.patientConfig || {};
        };

        this.encounterConfig = function () {
            return angular.extend(new EncounterConfig(), this.configs.encounterConfig || []);
        };

        this.patientAttributesConfig = function () {
            return this.configs.patientAttributesConfig.results;
        };

        this.identifierTypesConfig = function () {
            return this.configs.identifierTypesConfig;
        };

        this.genderMap = function () {
            return this.configs.genderMap;
        };

        this.addressLevels = function () {
            return this.configs.addressLevels;
        };

        this.relationshipTypes = function () {
            return this.configs.relationshipTypeConfig.results || [];
        };

        this.relationshipTypeMap = function () {
            return this.configs.relationshipTypeMap || {};
        };

        this.loginLocationToVisitTypeMapping = function () {
            return this.configs.loginLocationToVisitTypeMapping || {};
        };

        this.defaultEncounterType = function () {
            return this.configs.defaultEncounterType;
        };
    }]);

'use strict';

angular.module('bahmni.common.config')
    .directive('showIfPrivilege', ['$rootScope', function ($rootScope) {
        return {
            scope: {
                showIfPrivilege: "@"
            },
            link: function (scope, element) {
                var privileges = scope.showIfPrivilege.split(',');
                var requiredPrivilege = false;
                if ($rootScope.currentUser) {
                    var allTypesPrivileges = _.map($rootScope.currentUser.privileges, _.property('name'));
                    var intersect = _.intersectionWith(allTypesPrivileges, privileges, _.isEqual);
                    intersect.length > 0 ? requiredPrivilege = true : requiredPrivilege = false;
                }
                if (!requiredPrivilege) {
                    element.hide();
                }
            }
        };
    }]);


'use strict';
var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};
Bahmni.Common.Domain = Bahmni.Common.Domain || {};
Bahmni.Common.Domain.Helper = Bahmni.Common.Domain.Helper || {};

angular.module('bahmni.common.domain', []);

'use strict';

angular.module('bahmni.common.domain')
    .factory('locationService', ['$http', '$bahmniCookieStore', function ($http, $bahmniCookieStore) {
        var getAllByTag = function (tags, operator) {
            return $http.get(Bahmni.Common.Constants.locationUrl, {
                params: {s: "byTags", tags: tags || "", v: "default", operator: operator || "ALL"},
                cache: true
            });
        };

        var getByUuid = function (locationUuid) {
            return $http.get(Bahmni.Common.Constants.locationUrl + "/" + locationUuid, {
                cache: true
            }).then(function (response) {
                return response.data;
            });
        };

        var getLoggedInLocation = function () {
            var cookie = $bahmniCookieStore.get(Bahmni.Common.Constants.locationCookieName);
            return getByUuid(cookie.uuid);
        };

        var getVisitLocation = function (locationUuid) {
            return $http.get(Bahmni.Common.Constants.bahmniVisitLocationUrl + "/" + locationUuid, {
                headers: {"Accept": "application/json"}
            });
        };

        return {
            getAllByTag: getAllByTag,
            getLoggedInLocation: getLoggedInLocation,
            getByUuid: getByUuid,
            getVisitLocation: getVisitLocation
        };
    }]);

'use strict';

angular.module('bahmni.common.domain')
    .factory('configurationService', ['$http', '$q', function ($http, $q) {
        var configurationFunctions = {};

        configurationFunctions.encounterConfig = function () {
            return $http.get(Bahmni.Common.Constants.encounterConfigurationUrl, {
                params: {"callerContext": "REGISTRATION_CONCEPTS"},
                withCredentials: true
            });
        };

        configurationFunctions.patientConfig = function () {
            var patientConfig = $http.get(Bahmni.Common.Constants.patientConfigurationUrl, {
                withCredentials: true
            });
            return patientConfig;
        };

        configurationFunctions.patientAttributesConfig = function () {
            return $http.get(Bahmni.Common.Constants.personAttributeTypeUrl, {
                params: {v: 'custom:(uuid,name,sortWeight,description,format,concept)'},
                withCredentials: true
            });
        };

        configurationFunctions.dosageFrequencyConfig = function () {
            var dosageFrequencyConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name,answers)', name: Bahmni.Common.Constants.dosageFrequencyConceptName},
                withCredentials: true
            });
            return dosageFrequencyConfig;
        };

        configurationFunctions.dosageInstructionConfig = function () {
            var dosageInstructionConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name,answers)', name: Bahmni.Common.Constants.dosageInstructionConceptName},
                withCredentials: true
            });
            return dosageInstructionConfig;
        };

        configurationFunctions.stoppedOrderReasonConfig = function () {
            var stoppedOrderReasonConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name,answers)', name: Bahmni.Common.Constants.stoppedOrderReasonConceptName},
                withCredentials: true
            });
            return stoppedOrderReasonConfig;
        };

        configurationFunctions.consultationNoteConfig = function () {
            var consultationNoteConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name,answers)', name: Bahmni.Common.Constants.consultationNoteConceptName},
                withCredentials: true
            });
            return consultationNoteConfig;
        };

        configurationFunctions.radiologyObservationConfig = function () {
            var radiologyObservationConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: { v: 'custom:(uuid,name)', name: Bahmni.Common.Constants.radiologyResultConceptName },
                withCredentials: true
            });
            return radiologyObservationConfig;
        };

        configurationFunctions.labOrderNotesConfig = function () {
            var labOrderNotesConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name)', name: Bahmni.Common.Constants.labOrderNotesConcept},
                withCredentials: true
            });
            return labOrderNotesConfig;
        };

        configurationFunctions.defaultEncounterType = function () {
            return $http.get(Bahmni.Common.Constants.globalPropertyUrl, {
                params: {
                    property: 'bahmni.encounterType.default'
                },
                withCredentials: true,
                transformResponse: [function (data) {
                    return data;
                }]
            });
        };

        configurationFunctions.radiologyImpressionConfig = function () {
            var radiologyImpressionConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name)', name: Bahmni.Common.Constants.impressionConcept},
                withCredentials: true
            });
            return radiologyImpressionConfig;
        };

        configurationFunctions.addressLevels = function () {
            return $http.get(Bahmni.Common.Constants.openmrsUrl + "/module/addresshierarchy/ajax/getOrderedAddressHierarchyLevels.form", {
                withCredentials: true
            });
        };

        configurationFunctions.allTestsAndPanelsConcept = function () {
            var allTestsAndPanelsConcept = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {
                    v: 'custom:(uuid,name:(uuid,name),setMembers:(uuid,name:(uuid,name)))',
                    name: Bahmni.Common.Constants.allTestsAndPanelsConceptName
                },
                withCredentials: true
            });
            return allTestsAndPanelsConcept;
        };

        configurationFunctions.identifierTypesConfig = function () {
            return $http.get(Bahmni.Common.Constants.idgenConfigurationURL, {
                withCredentials: true
            });
        };

        configurationFunctions.genderMap = function () {
            return $http.get(Bahmni.Common.Constants.globalPropertyUrl, {
                method: "GET",
                params: {
                    property: 'mrs.genders'
                },
                withCredentials: true
            });
        };

        configurationFunctions.relationshipTypeMap = function () {
            return $http.get(Bahmni.Common.Constants.globalPropertyUrl, {
                method: "GET",
                params: {
                    property: 'bahmni.relationshipTypeMap'
                },
                withCredentials: true
            });
        };

        configurationFunctions.relationshipTypeConfig = function () {
            return $http.get(Bahmni.Common.Constants.relationshipTypesUrl, {
                withCredentials: true,
                params: {v: "custom:(aIsToB,bIsToA,uuid)"}
            });
        };

        configurationFunctions.loginLocationToVisitTypeMapping = function () {
            var url = Bahmni.Common.Constants.entityMappingUrl;
            return $http.get(url, {
                params: {
                    mappingType: 'loginlocation_visittype',
                    s: 'byEntityAndMappingType'
                }
            });
        };

        configurationFunctions.enableAuditLog = function () {
            return $http.get(Bahmni.Common.Constants.globalPropertyUrl, {
                method: "GET",
                params: {
                    property: 'bahmni.enableAuditLog'
                },
                withCredentials: true
            });
        };

        var existingPromises = {};
        var configurations = {};

        var getConfigurations = function (configurationNames) {
            var configurationsPromiseDefer = $q.defer();
            var promises = [];

            configurationNames.forEach(function (configurationName) {
                if (!existingPromises[configurationName]) {
                    existingPromises[configurationName] = configurationFunctions[configurationName]().then(function (response) {
                        configurations[configurationName] = response.data;
                    });
                    promises.push(existingPromises[configurationName]);
                }
            });

            $q.all(promises).then(function () {
                configurationsPromiseDefer.resolve(configurations);
            });

            return configurationsPromiseDefer.promise;
        };

        return {
            getConfigurations: getConfigurations
        };
    }]);

'use strict';

angular.module('bahmni.common.domain')
    .factory('providerService', ['$http', function ($http) {
        var search = function (fieldValue) {
            return $http.get(Bahmni.Common.Constants.providerUrl, {
                method: "GET",
                params: {q: fieldValue, v: "full"},
                withCredentials: true
            });
        };

        var searchByUuid = function (uuid) {
            return $http.get(Bahmni.Common.Constants.providerUrl, {
                method: "GET",
                params: {
                    user: uuid
                },
                cache: false
            });
        };

        var list = function (params) {
            return $http.get(Bahmni.Common.Constants.providerUrl, {
                method: "GET",
                cache: false,
                params: params
            });
        };

        return {
            search: search,
            searchByUuid: searchByUuid,
            list: list
        };
    }]);

angular.module('bahmni.common.uiHelper', ['ngClipboard']);

'use strict';

angular.module('bahmni.common.uiHelper')
    .factory('spinner', ['messagingService', '$timeout', function (messagingService, $timeout) {
        var tokens = [];

        var topLevelDiv = function (element) {
            return $(element).find("div").eq(0);
        };

        var showSpinnerForElement = function (element) {
            if ($(element).find(".dashboard-section-loader").length === 0) {
                topLevelDiv(element)
                    .addClass('spinnable')
                    .append('<div class="dashboard-section-loader"></div>');
            }
            return {
                element: $(element).find(".dashboard-section-loader")
            };
        };

        var showSpinnerForOverlay = function () {
            var token = Math.random();
            tokens.push(token);

            if ($('#overlay').length === 0) {
                $('body').prepend('<div id="overlay"><div></div></div>');
            }

            var spinnerElement = $('#overlay');
            spinnerElement.stop().show();

            return {
                element: spinnerElement,
                token: token
            };
        };

        var show = function (element) {
            if (element !== undefined) {
                return showSpinnerForElement(element);
            }

            return showSpinnerForOverlay();
        };

        var hide = function (spinner, parentElement) {
            var spinnerElement = spinner.element;
            if (spinner.token) {
                _.pull(tokens, spinner.token);
                if (tokens.length === 0) {
                    spinnerElement.fadeOut(300);
                }
            } else {
                topLevelDiv(parentElement).removeClass('spinnable');
                spinnerElement && spinnerElement.remove();
            }
        };

        var forPromise = function (promise, element) {
            return $timeout(function () {
                // Added timeout to push a new event into event queue. So that its callback will be invoked once DOM is completely rendered
                var spinner = show(element);                      // Don't inline this element
                promise['finally'](function () {
                    hide(spinner, element);
                });
                return promise;
            });
        };

        var forAjaxPromise = function (promise, element) {
            var spinner = show(element);
            promise.always(function () {
                hide(spinner, element);
            });
            return promise;
        };

        return {
            forPromise: forPromise,
            forAjaxPromise: forAjaxPromise,
            show: show,
            hide: hide
        };
    }]);

'use strict';

angular.module('bahmni.common.uiHelper')
    .factory('printer', ['$rootScope', '$compile', '$http', '$timeout', '$q', 'spinner',
        function ($rootScope, $compile, $http, $timeout, $q, spinner) {
            var printHtml = function (html) {
                var deferred = $q.defer();
                var hiddenFrame = $('<iframe style="visibility: hidden"></iframe>').appendTo('body')[0];
                hiddenFrame.contentWindow.printAndRemove = function () {
                    hiddenFrame.contentWindow.print();
                    $(hiddenFrame).remove();
                    deferred.resolve();
                };
                var htmlContent = "<!doctype html>" +
                        "<html>" +
                            '<body onload="printAndRemove();">' +
                                html +
                            '</body>' +
                        "</html>";
                var doc = hiddenFrame.contentWindow.document.open("text/html", "replace");
                doc.write(htmlContent);
                doc.close();
                return deferred.promise;
            };

            var openNewWindow = function (html) {
                var newWindow = window.open("printTest.html");
                newWindow.addEventListener('load', function () {
                    $(newWindow.document.body).html(html);
                }, false);
            };

            var print = function (templateUrl, data) {
                $rootScope.isBeingPrinted = true;
                $http.get(templateUrl).then(function (templateData) {
                    var template = templateData.data;
                    var printScope = $rootScope.$new();
                    angular.extend(printScope, data);
                    var element = $compile($('<div>' + template + '</div>'))(printScope);
                    var renderAndPrintPromise = $q.defer();
                    var waitForRenderAndPrint = function () {
                        if (printScope.$$phase || $http.pendingRequests.length) {
                            $timeout(waitForRenderAndPrint, 1000);
                        } else {
                        // Replace printHtml with openNewWindow for debugging
                            printHtml(element.html()).then(function () {
                                $rootScope.isBeingPrinted = false;
                                renderAndPrintPromise.resolve();
                            });
                            printScope.$destroy();
                        }
                        return renderAndPrintPromise.promise;
                    };
                    spinner.forPromise(waitForRenderAndPrint());
                });
            };

            var printFromScope = function (templateUrl, scope, afterPrint) {
                $rootScope.isBeingPrinted = true;
                $http.get(templateUrl).then(function (response) {
                    var template = response.data;
                    var printScope = scope;
                    var element = $compile($('<div>' + template + '</div>'))(printScope);
                    var renderAndPrintPromise = $q.defer();
                    var waitForRenderAndPrint = function () {
                        if (printScope.$$phase || $http.pendingRequests.length) {
                            $timeout(waitForRenderAndPrint);
                        } else {
                            printHtml(element.html()).then(function () {
                                $rootScope.isBeingPrinted = false;
                                if (afterPrint) {
                                    afterPrint();
                                }
                                renderAndPrintPromise.resolve();
                            });
                        }
                        return renderAndPrintPromise.promise;
                    };
                    spinner.forPromise(waitForRenderAndPrint());
                });
            };
            return {
                print: print,
                printFromScope: printFromScope
            };
        }]);

'use strict';

angular.module('bahmni.common.uiHelper')
    .service('backlinkService', ['$window', function ($window) {
        var self = this;

        var urls = [];
        self.reset = function () {
            urls = [];
        };

        self.setUrls = function (backLinks) {
            self.reset();
            angular.forEach(backLinks, function (backLink) {
                self.addUrl(backLink);
            });
        };

        self.addUrl = function (backLink) {
            urls.push(backLink);
        };

        self.addBackUrl = function (label) {
            var backLabel = label || "Back";
            urls.push({label: backLabel, action: $window.history.back});
        };

        self.getUrlByLabel = function (label) {
            return urls.filter(function (url) {
                return url.label === label;
            });
        };

        self.getAllUrls = function () {
            return urls;
        };
    }]);

'use strict';

angular.module('bahmni.common.uiHelper')
    .service('stateChangeSpinner', ['$rootScope', 'spinner', function ($rootScope, spinner) {
        var showSpinner = function (event, toState) { toState.spinnerToken = spinner.show(); };
        var hideSpinner = function (event, toState) { spinner.hide(toState.spinnerToken); };

        this.activate = function () {
            $rootScope.$on('$stateChangeStart', showSpinner);
            $rootScope.$on('$stateChangeSuccess', hideSpinner);
            $rootScope.$on('$stateChangeError', hideSpinner);
        };
    }]);

'use strict';

angular.module('bahmni.common.uiHelper')
 .directive('bmBackLinks', function () {
     return {
         template: '<ul>' +
                        '<li ng-repeat="backLink in backLinks">' +
                            '<a class="back-btn" ng-if="backLink.action" accesskey="{{backLink.accessKey}}" ng-click="closeAllDialogs();backLink.action()" id="{{backLink.id}}"> <span ng-bind-html="backLink.label"></span> </a>' +
                            '<a class="back-btn" ng-class="{\'dashboard-link\':backLink.image}" ng-if="backLink.url" accesskey="{{backLink.accessKey}}" ng-href="{{backLink.url}}" ng-click="closeAllDialogs()" id="{{backLink.id}}"  title="{{backLink.title}}"> ' +
                                '<img ng-if="backLink.image" ng-src="{{backLink.image}}" onerror="this.onerror=null; this.src=\'../images/blank-user.gif\'"/>' +
                                '<i ng-if="backLink.icon && !backLink.image" class="fa {{backLink.icon}}"></i></a>' +
                            '<a class="back-btn" ng-if="backLink.state && !backLink.text" accesskey="{{backLink.accessKey}}" ui-sref="{{backLink.state}}" ng-click="closeAllDialogs()" id="{{backLink.id}}">' +
                                '<i ng-if="backLink.icon" class="fa {{backLink.icon}}"></i></a>' +
         '<a ng-if="backLink.text && backLink.requiredPrivilege" show-if-privilege="{{backLink.requiredPrivilege}}" accesskey="{{backLink.accessKey}}" ui-sref="{{backLink.state}}" id="{{backLink.id}}" class="back-btn-noIcon" ui-sref-active="active">' +
         '<span>{{backLink.text | translate}}</span>' +
         '        </a>' +
                '<a ng-if="backLink.text && !backLink.requiredPrivilege" accesskey="{{backLink.accessKey}}" ui-sref="{{backLink.state}}" id="{{backLink.id}}" class="back-btn-noIcon" ui-sref-active="active">' +
                 '<span>{{backLink.text | translate}}</span>' +
        '        </a>' +
                        '</li>' +
                    '</ul>',
         controller: function ($scope, backlinkService) {
             $scope.backLinks = backlinkService.getAllUrls();
             $scope.$on('$stateChangeSuccess', function (event, state) {
                 if (state.data && state.data.backLinks) {
                     backlinkService.setUrls(state.data.backLinks);
                     $scope.backLinks = backlinkService.getAllUrls();
                 }
             });

             $scope.$on("$destroy", function () {
                 window.onbeforeunload = undefined;
             });
         },
         restrict: 'E'
     };
 });

'use strict';

angular.module('bahmni.common.uiHelper')
    .controller('MessageController', ['$scope', 'messagingService',
        function ($scope, messagingService) {
            $scope.messages = messagingService.messages;

            $scope.getMessageText = function (level) {
                var string = "";
                $scope.messages[level].forEach(function (message) {
                    string = string.concat(message.value);
                });
                return string;
            };

            $scope.hideMessage = function (level) {
                messagingService.hideMessages(level);
            };

            $scope.isErrorMessagePresent = function () {
                return $scope.messages.error.length > 0;
            };

            $scope.isInfoMessagePresent = function () {
                return $scope.messages.info.length > 0;
            };
            	
            $scope.isReminderMessagePresent = function () {
                return $scope.messages.reminder.length > 0;
            };
        }]);

'use strict';

angular.module('bahmni.common.uiHelper')
    .service('messagingService', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
        this.messages = {error: [], info:[], reminder: []};
        var self = this;

        $rootScope.$on('event:serverError', function (event, errorMessage) {
            self.showMessage('error', errorMessage, 'serverError');
        });

        this.showMessage = function (level, message, errorEvent) {
            var messageObject = {'value': '', 'isServerError': false};
            messageObject.value = message;
            if (errorEvent) {
                messageObject.isServerError = true;
            } else if (level == 'info') {
                this.createTimeout('info', 5000);
            }

            var index = _.findIndex(this.messages[level], function (msg) {
                return msg.value == messageObject.value;
            });

            if (index >= 0) {
                this.messages[level].splice(index, 1);
            }
            this.messages[level].push(messageObject);
        };

        this.createTimeout = function (level, time) {
            $timeout(function () {
                self.messages[level] = [];
            }, time, true);
        };

        this.hideMessages = function (level) {
            self.messages[level].length = 0;
        };

        this.clearAll = function () {
            self.messages["error"] = [];
            self.messages["info"] = [];
            self.messages["reminder"] = [];
        };
    }]);

'use strict';

angular.module('bahmni.common.uiHelper')
    .service('confirmBox', ['$rootScope', 'ngDialog', function ($rootScope, ngDialog) {
        var dialog;
        var confirmBox = function (config) {
            var confirmBoxScope = $rootScope.$new();
            confirmBoxScope.close = function () {
                ngDialog.close(dialog.id);
                confirmBoxScope.$destroy();
            };
            confirmBoxScope.scope = config.scope;
            confirmBoxScope.actions = config.actions;
            dialog = ngDialog.open({
                template: '../common/ui-helper/views/confirmBox.html',
                scope: confirmBoxScope,
                className: config.className || 'ngdialog-theme-default'
            });
        };
        return confirmBox;
    }]);

'use strict';

angular.module('bahmni.common.uiHelper')
.directive('bahmniAutocomplete', ['$translate', function ($translate) {
    var link = function (scope, element, attrs, ngModelCtrl) {
        var source = scope.source();
        var responseMap = scope.responseMap && scope.responseMap();
        var onSelect = scope.onSelect();
        var onEdit = scope.onEdit && scope.onEdit();
        var minLength = scope.minLength || 2;
        var formElement = element[0];
        var validationMessage = scope.validationMessage || $translate.instant("SELECT_VALUE_FROM_AUTOCOMPLETE_DEFAULT_MESSAGE");

        var validateIfNeeded = function (value) {
            if (!scope.strictSelect) {
                return;
            }
            scope.isInvalid = (value !== scope.selectedValue);
            if (_.isEmpty(value)) {
                scope.isInvalid = false;
            }
        };

        scope.$watch('initialValue', function () {
            if (scope.initialValue) {
                scope.selectedValue = scope.initialValue;
                scope.isInvalid = false;
            }
        });

        element.autocomplete({
            autofocus: true,
            minLength: minLength,
            source: function (request, response) {
                source({elementId: attrs.id, term: request.term, elementType: attrs.type}).then(function (data) {
                    var results = responseMap ? responseMap(data) : data;
                    response(results);
                });
            },
            select: function (event, ui) {
                scope.selectedValue = ui.item.value;
                ngModelCtrl.$setViewValue(ui.item.value);
                if (onSelect != null) {
                    onSelect(ui.item);
                }
                validateIfNeeded(ui.item.value);
                if (scope.blurOnSelect) {
                    element.blur();
                }
                scope.$apply();
                scope.$eval(attrs.ngDisabled);
                scope.$apply();
                return true;
            },
            search: function (event, ui) {
                if (onEdit != null) {
                    onEdit(ui.item);
                }
                var searchTerm = $.trim(element.val());
                validateIfNeeded(searchTerm);
                if (searchTerm.length < minLength) {
                    event.preventDefault();
                }
            }
        });
        var changeHanlder = function (e) {
            validateIfNeeded(element.val());
        };

        var keyUpHandler = function (e) {
            validateIfNeeded(element.val());
            scope.$apply();
        };

        element.on('change', changeHanlder);
        element.on('keyup', keyUpHandler);

        scope.$watch('isInvalid', function () {
            ngModelCtrl.$setValidity('selection', !scope.isInvalid);
            formElement.setCustomValidity(scope.isInvalid ? validationMessage : '');
        });

        scope.$on("$destroy", function () {
            element.off('change', changeHanlder);
            element.off('keyup', keyUpHandler);
        });
    };

    return {
        link: link,
        require: 'ngModel',
        scope: {
            source: '&',
            responseMap: '&?',
            onSelect: '&',
            onEdit: '&?',
            minLength: '=?',
            blurOnSelect: '=?',
            strictSelect: '=?',
            validationMessage: '@',
            isInvalid: "=?",
            initialValue: "=?"
        }
    };
}]);

'use strict';

angular.module('bahmni.common.uiHelper')
.filter('days', function () {
    return function (startDate, endDate) {
        return Bahmni.Common.Util.DateUtil.diffInDays(startDate, endDate);
    };
}).filter('bahmniDateTime', function () {
    return function (date) {
        return Bahmni.Common.Util.DateUtil.formatDateWithTime(date);
    };
}).filter('bahmniDate', function () {
    return function (date) {
        return Bahmni.Common.Util.DateUtil.formatDateWithoutTime(date);
    };
}).filter('bahmniTime', function () {
    return function (date) {
        return Bahmni.Common.Util.DateUtil.formatTime(date);
    };
}).filter('bahmniDateInStrictMode', function () {
    return function (date) {
        return Bahmni.Common.Util.DateUtil.formatDateInStrictMode(date);
    };
});

angular.module('bahmni.common.patient', []);

'use strict';

Bahmni.PatientMapper = function (patientConfig, $rootScope, $translate) {
    this.patientConfig = patientConfig;

    this.map = function (openmrsPatient) {
        var patient = this.mapBasic(openmrsPatient);
        this.mapAttributes(patient, openmrsPatient.person.attributes);
        return patient;
    };

    this.mapBasic = function (openmrsPatient) {
        var patient = {};
        patient.uuid = openmrsPatient.uuid;
        patient.givenName = openmrsPatient.person.preferredName.givenName;
        patient.familyName = openmrsPatient.person.preferredName.familyName === null ? '' : openmrsPatient.person.preferredName.familyName;
        patient.name = patient.givenName + ' ' + patient.familyName;
        patient.age = openmrsPatient.person.age;
        patient.ageText = calculateAge(Bahmni.Common.Util.DateUtil.parseServerDateToDate(openmrsPatient.person.birthdate));
        patient.gender = openmrsPatient.person.gender;
        patient.genderText = mapGenderText(patient.gender);
        patient.address = mapAddress(openmrsPatient.person.preferredAddress);
        patient.birthdateEstimated = openmrsPatient.person.birthdateEstimated;
        patient.birthtime = Bahmni.Common.Util.DateUtil.parseServerDateToDate(openmrsPatient.person.birthtime);
        patient.bloodGroupText = getPatientBloodGroupText(openmrsPatient);

        if (openmrsPatient.identifiers) {
            var primaryIdentifier = openmrsPatient.identifiers[0].primaryIdentifier;
            patient.identifier = primaryIdentifier ? primaryIdentifier : openmrsPatient.identifiers[0].identifier;
        }

        if (openmrsPatient.person.birthdate) {
            patient.birthdate = parseDate(openmrsPatient.person.birthdate);
        }

        if (openmrsPatient.person.personDateCreated) {
            patient.registrationDate = parseDate(openmrsPatient.person.personDateCreated);
        }

        patient.image = Bahmni.Common.Constants.patientImageUrlByPatientUuid + openmrsPatient.uuid;
        return patient;
    };

    this.getPatientConfigByUuid = function (patientConfig, attributeUuid) {
        if (this.patientConfig.personAttributeTypes) {
            return patientConfig.personAttributeTypes.filter(function (item) {
                return item.uuid === attributeUuid;
            })[0];
        }
        return {};
    };

    this.mapAttributes = function (patient, attributes) {
        var self = this;
        if (this.patientConfig) {
            attributes.forEach(function (attribute) {
                var x = self.getPatientConfigByUuid(patientConfig, attribute.attributeType.uuid);
                patient[x.name] = {label: x.description, value: attribute.value, isDateField: checkIfDateField(x) };
            });
        }
    };

    var calculateAge = function (birthDate) {
        var DateUtil = Bahmni.Common.Util.DateUtil;
        var age = DateUtil.diffInYearsMonthsDays(birthDate, DateUtil.now());
        var ageInString = "";
        if (age.years) {
            ageInString += age.years + " <span> " + $translate.instant("CLINICAL_YEARS_TRANSLATION_KEY") + " </span>";
        }
        if (age.months) {
            ageInString += age.months + "<span>  " + $translate.instant("CLINICAL_MONTHS_TRANSLATION_KEY") + " </span>";
        }
        if (age.days) {
            ageInString += age.days + "<span>  " + $translate.instant("CLINICAL_DAYS_TRANSLATION_KEY") + " </span>";
        }
        return ageInString;
    };

    var mapAddress = function (preferredAddress) {
        return preferredAddress ? {
            "address1": preferredAddress.address1,
            "address2": preferredAddress.address2,
            "address3": preferredAddress.address3,
            "cityVillage": preferredAddress.cityVillage,
            "countyDistrict": preferredAddress.countyDistrict === null ? '' : preferredAddress.countyDistrict,
            "stateProvince": preferredAddress.stateProvince
        } : {};
    };

    var parseDate = function (dateStr) {
        if (dateStr) {
            return Bahmni.Common.Util.DateUtil.parse(dateStr.substr(0, 10));
        }
        return dateStr;
    };

    var mapGenderText = function (genderChar) {
        if (genderChar == null) {
            return null;
        }
        return "<span>" + $rootScope.genderMap[angular.uppercase(genderChar)] + "</span>";
    };

    var getPatientBloodGroupText = function (openmrsPatient) {
        if (openmrsPatient.person.bloodGroup) {
            return "<span>" + openmrsPatient.person.bloodGroup + "</span>";
        }
        if (openmrsPatient.person.attributes && openmrsPatient.person.attributes.length > 0) {
            var bloodGroup;
            _.forEach(openmrsPatient.person.attributes, function (attribute) {
                if (attribute.attributeType.display == "bloodGroup") {
                    bloodGroup = attribute.display;
                }
            });
            if (bloodGroup) {
                return "<span>" + bloodGroup + "</span>";
            }
        }
    };

    var checkIfDateField = function (x) {
        return x.format === Bahmni.Common.Constants.patientAttributeDateFieldFormat;
    };
};

'use strict';

angular.module('bahmni.common.patient')
    .service('patientService', ['$http', 'sessionService', function ($http, sessionService) {
        this.getPatient = function (uuid) {
            var patient = $http.get(Bahmni.Common.Constants.openmrsUrl + "/ws/rest/v1/patient/" + uuid, {
                method: "GET",
                params: {v: "full"},
                withCredentials: true
            });
            return patient;
        };
        this.generateIdentifier = function () {
            var openmrsUrl = Bahmni.Common.Constants.openmrsUrl;
            var data = {"identifierSourceName": "NewART Number MPI"};
            var url = openmrsUrl + "/ws/rest/v1/idgen";
            var config = {
                withCredentials: true,
                headers: {"Accept": "text/plain", "Content-Type": "application/json"}
            };
            return $http.post(url, data, config);
        };
    
        this.assignIdentifier = function (patientUuid, identifier, patientIdentifierType) {
            var url = Bahmni.Common.Constants.RESTWS_V1 + "/bahmnicore/patientassignid";
            var data = {"patientUuid": patientUuid , "identifier": identifier, "patientIdentifierType": patientIdentifierType};
            var config = {
                withCredentials: true,
                headers: {"Accept": "text/plain", "Content-Type": "application/json"}
            };
    
            return $http.post(url, data, config);

        };

        this.getRelationships = function (patientUuid) {
            return $http.get(Bahmni.Common.Constants.openmrsUrl + "/ws/rest/v1/relationship", {
                method: "GET",
                params: {person: patientUuid, v: "full"},
                withCredentials: true
            });
        };

        this.findPatients = function (params) {
            return $http.get(Bahmni.Common.Constants.sqlUrl, {
                method: "GET",
                params: params,
                withCredentials: true
            });
        };

        this.search = function (query, offset, identifier) {
            offset = offset || 0;
            return $http.get(Bahmni.Common.Constants.bahmniSearchUrl + "/patient", {
                method: "GET",
                params: {
                    q: query,
                    startIndex: offset,
                    identifier: identifier,
                    loginLocationUuid: sessionService.getLoginLocationUuid()
                },
                withCredentials: true
            });
        };

        this.getPatientContext = function (patientUuid, programUuid, personAttributes, programAttributes, patientIdentifiers) {
            return $http.get('/openmrs/ws/rest/v1/bahmnicore/patientcontext', {
                params: {
                    patientUuid: patientUuid,
                    programUuid: programUuid,
                    personAttributes: personAttributes,
                    programAttributes: programAttributes,
                    patientIdentifiers: patientIdentifiers
                },
                withCredentials: true
            });
        };
    }]);

'use strict';

angular.module('bahmni.common.patient')
.filter('gender', ['$rootScope', function ($rootScope) {
    return function (genderChar) {
        if (genderChar == null) {
            return "Unknown";
        }
        return $rootScope.genderMap[angular.uppercase(genderChar)];
    };
}]);

'use strict';
var Bahmni = Bahmni || {};
Bahmni.ConceptSet = Bahmni.ConceptSet || {};
Bahmni.ConceptSet.FormConditions = Bahmni.ConceptSet.FormConditions || {};

angular.module('bahmni.common.conceptSet', ['bahmni.common.uiHelper', 'ui.select2', 'pasvaz.bindonce', 'ngSanitize', 'ngTagsInput']);

var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};
Bahmni.Common.PatientSearch = Bahmni.Common.PatientSearch || {};

Bahmni.Common.PatientSearch.Constants = {
    searchExtensionTileViewType: "tile",
    searchExtensionTabularViewType: "tabular",
    tabularViewIgnoreHeadingsList: ["display", "uuid", "image", "$$hashKey", "activeVisitUuid", "hasBeenAdmitted", "forwardUrl", "programUuid", "enrollment"],
    identifierHeading: ["ID", "Id", "id", "identifier", "DQ_COLUMN_TITLE_ACTION"],
    nameHeading: ["NAME", "Name", "name"],
    patientTileHeight: 100,
    patientTileWidth: 100,
    printIgnoreHeadingsList: ["DQ_COLUMN_TITLE_ACTION"],
    tileLoadRatio: 1 / 2
};

'use strict';

Bahmni.Common.PatientSearch.Search = function (searchTypes) {
    var self = this;
    self.searchTypes = searchTypes || [];
    self.searchType = this.searchTypes[0];
    self.searchParameter = '';
    self.noResultsMessage = null;
    self.searchResults = [];
    self.activePatients = [];
    self.navigated = false;
    self.links = self.searchType && self.searchType.links ? self.searchType.links : [];
    self.searchColumns = self.searchType && self.searchType.searchColumns ? self.searchType.searchColumns : ["identifier", "name"];
    angular.forEach(searchTypes, function (searchType) {
        searchType.patientCount = "...";
    });

    self.switchSearchType = function (searchType) {
        self.noResultsMessage = null;
        if (!self.isSelectedSearch(searchType)) {
            self.searchParameter = '';
            self.navigated = true;
            self.searchType = searchType;
            self.activePatients = [];
            self.searchResults = [];
            self.links = self.searchType && self.searchType.links ? self.searchType.links : [];
            self.searchColumns = self.searchType && self.searchType.searchColumns ? self.searchType.searchColumns : ["identifier", "name"];
        }
        self.markPatientEntry();
    };

    self.markPatientEntry = function () {
        self.startPatientSearch = true;
        window.setTimeout(function () { // eslint-disable-line angular/timeout-service
            self.startPatientSearch = false;
        });
    };

    self.patientsCount = function () {
        return self.activePatients.length;
    };

    self.updatePatientList = function (patientList) {
        self.activePatients = patientList.map(mapPatient);
        self.searchResults = self.activePatients;
    };

    self.updateSearchResults = function (patientList) {
        self.updatePatientList(patientList);
        if (self.activePatients.length === 0 && self.searchParameter != '') {
            self.noResultsMessage = "NO_RESULTS_FOUND";
        } else {
            self.noResultsMessage = null;
        }
    };

    self.hasSingleActivePatient = function () {
        return self.activePatients.length === 1;
    };

    self.filterPatients = function (matchingCriteria) {
        matchingCriteria = matchingCriteria ? matchingCriteria : matchesNameOrId;
        self.searchResults = self.searchParameter ? self.activePatients.filter(matchingCriteria) : self.activePatients;
    };

    self.filterPatientsByIdentifier = function () {
        self.filterPatients(matchesId);
    };

    self.isSelectedSearch = function (searchType) {
        return self.searchType && self.searchType.id == searchType.id;
    };

    self.isCurrentSearchLookUp = function () {
        return self.searchType && self.searchType.handler;
    };

    self.isTileView = function () {
        return self.searchType && self.searchType.view === Bahmni.Common.PatientSearch.Constants.searchExtensionTileViewType;
    };

    self.isTabularView = function () {
        return self.searchType && self.searchType.view === Bahmni.Common.PatientSearch.Constants.searchExtensionTabularViewType;
    };

    self.showPatientCountOnSearchParameter = function (searchType) {
        return showPatientCount(searchType) && self.searchParameter;
    };

    function mapPatient (patient) {
        if (patient.name || patient.givenName || patient.familyName) {
            patient.name = patient.name || (patient.givenName + (patient.familyName ? ' ' + patient.familyName : ""));
        }
        patient.display = _.map(self.searchColumns, function (column) {
            return patient[column];
        }).join(" - ");

        patient.image = Bahmni.Common.Constants.patientImageUrlByPatientUuid + patient.uuid;
        return patient;
    }

    var matchesNameOrId = function (patient) {
        return patient.display.toLowerCase().indexOf(self.searchParameter.toLowerCase()) !== -1;
    };

    var matchesId = function (patient) {
        return patient.identifier.toLowerCase().indexOf(self.searchParameter.toLowerCase()) !== -1;
    };

    var showPatientCount = function (searchType) {
        return self.isSelectedSearch(searchType) && self.isCurrentSearchLookUp();
    };
};

angular.module('bahmni.common.patientSearch', ['bahmni.common.patient', 'infinite-scroll']);


'use strict';
var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};
Bahmni.Common.I18n = Bahmni.Common.I18n || {};

angular.module('bahmni.common.i18n', []);

'use strict';

angular.module('bahmni.common.i18n', ['pascalprecht.translate'])
    .provider('$bahmniTranslate', ['$translateProvider', function ($translateProvider) {
        this.init = function (options) {
            var preferredLanguage = window.localStorage["NG_TRANSLATE_LANG_KEY"] || "en";
            $translateProvider.useLoader('mergeLocaleFilesService', options);
            $translateProvider.useSanitizeValueStrategy('escaped');
            $translateProvider.preferredLanguage(preferredLanguage);
            $translateProvider.useLocalStorage();
        };
        this.$get = [function () {
            return $translateProvider;
        }];
    }
    ])
    .filter('titleTranslate', ['$translate', function ($translate) {
        return function (input) {
            if (!input) {
                return input;
            }
            if (input.translationKey) {
                return $translate.instant(input.translationKey);
            }
            if (input.dashboardName) {
                return input.dashboardName;
            }
            if (input.title) {
                return input.title;
            }
            if (input.label) {
                return input.label;
            }
            if (input.display) {
                return input.display;
            }
            return $translate.instant(input);
        };
    }]);

'use strict';

angular.module('bahmni.common.i18n')
    .service('mergeLocaleFilesService', ['$http', '$q', 'mergeService', function ($http, $q, mergeService) {
        return function (options) {
            var baseLocaleUrl = '../i18n/';
            var customLocaleUrl = Bahmni.Common.Constants.rootDir + '/bahmni_config/openmrs/i18n/';

            var loadFile = function (url) {
                return $http.get(url, {withCredentials: true});
            };

            var mergeLocaleFile = function (options) {
                var fileURL = options.app + "/locale_" + options.key + ".json";

                var loadBahmniTranslations = function () {
                    return loadFile(baseLocaleUrl + fileURL).then(function (result) {
                        return result;
                    }, function () {
                        return;
                    });
                };
                var loadCustomTranslations = function () {
                    return loadFile(customLocaleUrl + fileURL).then(function (result) {
                        return result;
                    }, function () {
                        return;
                    });
                };

                var mergeTranslations = function (result) {
                    var baseFileData = result[0] ? result[0].data : undefined;
                    var customFileData = result[1] ? result[1].data : undefined;
                    if (options.shouldMerge || options.shouldMerge === undefined) {
                        return mergeService.merge(baseFileData, customFileData);
                    }
                    return [baseFileData, customFileData];
                };

                return $q.all([loadBahmniTranslations(), loadCustomTranslations()])
                    .then(mergeTranslations);
            };
            return mergeLocaleFile(options);
        };
    }]);

'use strict';

// Tip from http://stackoverflow.com/a/20786262/69362
/* exported debugUiRouter */
var debugUiRouter = function ($rootScope) {
//    var $rootScope = angular.element(document.getElementById("debug")).injector().get('$rootScope');

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
        console.log('$stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
    });

    $rootScope.$on('$stateChangeError', function () {
        console.log('$stateChangeError - fired when an error occurs during transition.');
        console.log(arguments);
    });

    $rootScope.$on('$stateChangeSuccess', function (event, toState) {
        console.log('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');
    });

    $rootScope.$on('$viewContentLoaded', function (event) {
        console.log('$viewContentLoaded - fired after dom rendered', event);
    });

    $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
        console.log('$stateNotFound ' + unfoundState.to + '  - fired when a state cannot be found by its name.');
        console.log(unfoundState, fromState, fromParams);
    });

    // $rootScope.$on('$viewContentLoading',function(event, viewConfig){
    //   // runs on individual scopes, so putting it in "run" doesn't work.
    //   console.log('$viewContentLoading - view begins loading - dom not rendered',viewConfig);
    // });
};

'use strict';
var Bahmni = Bahmni || {};
Bahmni.Common = Bahmni.Common || {};
Bahmni.Common.Logging = Bahmni.Common.Logging || {};

angular.module('bahmni.common.logging', []);

'use strict';

angular.module('bahmni.common.logging')
.config(['$provide', function ($provide) {
    $provide.decorator("$exceptionHandler", function ($delegate, $injector, $window, $log) {
        var logError = function (exception, cause) {
            try {
                var messagingService = $injector.get('messagingService');
                var loggingService = $injector.get('loggingService');
                var errorMessage = exception.toString();
                var stackTrace = printStackTrace({ e: exception });
                var errorDetails = {
                    timestamp: new Date(),
                    browser: $window.navigator.userAgent,
                    errorUrl: $window.location.href,
                    errorMessage: errorMessage,
                    stackTrace: stackTrace,
                    cause: (cause || "")
                };
                loggingService.log(errorDetails);
                messagingService.showMessage('error', errorMessage);
                exposeException(errorDetails);
            } catch (loggingError) {
                $log.warn("Error logging failed");
                $log.log(loggingError);
            }
        };

        var exposeException = function (exceptionDetails) {
            window.angular_exception = window.angular_exception || [];
            window.angular_exception.push(exceptionDetails);
        };

        return function (exception, cause) {
            $delegate(exception, cause);
            logError(exception, cause);
        };
    });
}]);

'use strict';

angular.module('bahmni.common.logging')
    .service('loggingService', function () {
        var log = function (errorDetails) {
            $.ajax({
                type: "POST",
                url: "/log",
                contentType: "application/json",
                data: angular.toJson(errorDetails)
            });
        };

        return {
            log: log
        };
    });

'use strict';

var Bahmni = Bahmni || {};
Bahmni.Appointments = Bahmni.Appointments || {};

angular.module('bahmni.appointments', ['ui.router', 'bahmni.common.config', 'bahmni.common.uiHelper', 'bahmni.common.i18n',
    'bahmni.common.domain', 'bahmni.common.displaycontrol.patientprofile', 'authentication', 'bahmni.common.appFramework', 'bahmni.common.routeErrorHandler',
    'httpErrorInterceptor', 'pasvaz.bindonce', 'infinite-scroll', 'bahmni.common.util', 'ngSanitize', 'pascalprecht.translate',
    'ngCookies', 'bahmni.common.patient', 'bahmni.common.logging', 'ui.calendar', 'monospaced.elastic', 'ivh.treeview', 'ngTagsInput', 'ngDialog']);

'use strict';

angular
    .module('bahmni.appointments')
    .config(['$urlRouterProvider', '$stateProvider', '$httpProvider', '$bahmniTranslateProvider', '$compileProvider',
        function ($urlRouterProvider, $stateProvider, $httpProvider, $bahmniTranslateProvider, $compileProvider) {
            $httpProvider.defaults.headers.common['Disable-WWW-Authenticate'] = true;
            $urlRouterProvider.otherwise('/home/manage/summary');
            $urlRouterProvider.when('/home/manage', '/home/manage/summary');
            $compileProvider.debugInfoEnabled(false);

            $stateProvider
            .state('home', {
                url: '/home',
                abstract: true,
                views: {
                    'additional-header': {
                        templateUrl: 'views/appointmentsHeader.html',
                        controller: 'AppointmentsHeaderController'
                    },
                    'mainContent': {
                        template: '<div class="opd-wrapper appointments-page-wrapper">' +
                        '<div ui-view="content" class="opd-content-wrapper appointments-content-wrapper"></div>' +
                        '</div>'
                    }
                },
                data: {
                    backLinks: []
                },
                resolve: {
                    initializeConfig: function (initialization, $stateParams) {
                        return initialization($stateParams.appName);
                    }
                }
            }).state('home.manage', {
                url: '/manage',
                views: {
                    'content': {
                        templateUrl: 'views/manage/appointmentsManage.html',
                        controller: 'AppointmentsManageController'
                    }
                }
            }).state('home.manage.summary', {
                url: '/summary',
                tabName: 'summary',
                params: {
                    viewDate: null
                },
                views: {
                    'content@manage': {
                        templateUrl: 'views/manage/appointmentsSummary.html',
                        controller: 'AppointmentsSummaryController'
                    }
                }
            }).state('home.manage.appointments', {
                url: '/appointments',
                params: {
                    filterParams: {},
                    isFilterOpen: true,
                    isSearchEnabled: false
                },
                views: {
                    'filter': {
                        templateUrl: 'views/manage/appointmentFilter.html',
                        controller: 'AppointmentsFilterController'
                    },
                    'content@manage': {
                        templateUrl: 'views/manage/allAppointments.html',
                        controller: 'AllAppointmentsController'
                    }

                }
            }).state('home.manage.appointments.calendar', {
                url: '/calendar',
                tabName: 'calendar',
                params: {
                    viewDate: null,
                    doFetchAppointmentsData: true,
                    appointmentsData: null
                },
                views: {
                    'content@viewAppointments': {
                        templateUrl: 'views/manage/calendar/calendarView.html',
                        controller: 'AppointmentsCalendarViewController'
                    }
                }
            }).state('home.manage.appointments.calendar.new', {
                url: '/new',
                params: {
                    appointment: null
                },
                views: {
                    'content@appointment': {
                        templateUrl: 'views/manage/newAppointment.html',
                        controller: 'AppointmentsCreateController'
                    }
                },
                resolve: {
                    appointmentContext: function (appointmentInitialization, $stateParams) {
                        return appointmentInitialization($stateParams);
                    },
                    appointmentCreateConfig: function (initializeConfig, appointmentConfigInitialization, appointmentContext) {
                        return appointmentConfigInitialization(appointmentContext);
                    }
                }
            }).state('home.manage.appointments.calendar.edit', {
                url: '/:uuid',
                views: {
                    'content@appointment': {
                        templateUrl: 'views/manage/newAppointment.html',
                        controller: 'AppointmentsCreateController'
                    }
                },
                resolve: {
                    appointmentContext: function (appointmentInitialization, $stateParams) {
                        return appointmentInitialization($stateParams);
                    },
                    appointmentCreateConfig: function (initializeConfig, appointmentConfigInitialization, appointmentContext) {
                        return appointmentConfigInitialization(appointmentContext);
                    }
                }
            }).state('home.manage.appointments.list', {
                url: '/list',
                tabName: 'list',
                params: {
                    viewDate: null,
                    patient: null,
                    doFetchAppointmentsData: true,
                    appointmentsData: null
                },
                views: {
                    'content@viewAppointments': {
                        templateUrl: 'views/manage/list/listView.html',
                        controller: 'AppointmentsListViewController'
                    }
                }
            }).state('home.manage.appointments.list.new', {
                url: '/new',
                views: {
                    'content@appointment': {
                        templateUrl: 'views/manage/newAppointment.html',
                        controller: 'AppointmentsCreateController'
                    }
                },
                resolve: {
                    appointmentContext: function (appointmentInitialization, $stateParams) {
                        return appointmentInitialization($stateParams);
                    },
                    appointmentCreateConfig: function (initializeConfig, appointmentConfigInitialization, appointmentContext) {
                        return appointmentConfigInitialization(appointmentContext);
                    }
                }
            }).state('home.manage.appointments.list.edit', {
                url: '/:uuid',
                views: {
                    'content@appointment': {
                        templateUrl: 'views/manage/newAppointment.html',
                        controller: 'AppointmentsCreateController'
                    }
                },
                resolve: {
                    appointmentContext: function (appointmentInitialization, $stateParams) {
                        return appointmentInitialization($stateParams);
                    },
                    appointmentCreateConfig: function (initializeConfig, appointmentConfigInitialization, appointmentContext) {
                        return appointmentConfigInitialization(appointmentContext);
                    }
                }
            }).state('home.admin', {
                url: '/admin',
                abstract: true,
                views: {
                    'content': {
                        templateUrl: 'views/admin/appointmentsAdmin.html'
                    }
                }
            }).state('home.admin.service', {
                url: '/service',
                views: {
                    'content@admin': {
                        templateUrl: 'views/admin/allAppointmentServices.html',
                        controller: 'AllAppointmentServicesController'
                    }
                }
            }).state('home.admin.service.edit', {
                url: '/:uuid',
                views: {
                    'content@admin': {
                        templateUrl: 'views/admin/appointmentService.html',
                        controller: 'AppointmentServiceController'
                    }
                },
                resolve: {
                    appointmentServiceContext: function (appointmentServiceInitialization, $stateParams) {
                        return appointmentServiceInitialization($stateParams.uuid);
                    }
                }
            });

            $bahmniTranslateProvider.init({app: 'appointments', shouldMerge: true});
        }]).run(['$window', function ($window) {
            moment.locale($window.localStorage["NG_TRANSLATE_LANG_KEY"] || "en");
        }]);

'use strict';

angular.module('bahmni.appointments').factory('initialization',
    ['authenticator', 'appService', 'spinner', 'configurations',
        function (authenticator, appService, spinner, configurations) {
            return function () {
                var loadConfigPromise = function () {
                    return configurations.load([]);
                };
                var initApp = function () {
                    return appService.initApp('appointments', {'app': true, 'extension': true});
                };

                return spinner.forPromise(authenticator.authenticateUser()
                    .then(initApp)
                    .then(loadConfigPromise));
            };
        }
    ]
);

'use strict';

angular.module('bahmni.appointments').factory('appointmentServiceInitialization',
    ['appointmentsServiceService',
        function (appointmentsServiceService) {
            return function (serviceUuid) {
                var getAppointmentService = function () {
                    if (serviceUuid !== 'new') {
                        return appointmentsServiceService.getService(serviceUuid).then(function (response) {
                            return {service: response.data};
                        });
                    }
                };

                return getAppointmentService();
            };
        }]
);

'use strict';

angular.module('bahmni.appointments').factory('appointmentInitialization',
    ['appointmentsService', function (appointmentsService) {
        return function ($stateParams) {
            if ($stateParams.appointment) {
                return {appointment: $stateParams.appointment};
            }
            if ($stateParams.uuid) {
                return appointmentsService.getAppointmentByUuid($stateParams.uuid).then(function (response) {
                    return {appointment: response.data};
                });
            }
            return {};
        };
    }]
);

'use strict';

angular.module('bahmni.appointments').factory('appointmentConfigInitialization',
    ['locationService', 'specialityService', 'appointmentsServiceService', 'providerService', 'appService', 'spinner', '$q',
        function (locationService, specialityService, appointmentsServiceService, providerService, appService, spinner, $q) {
            return function (appointmentContext) {
                var init = function () {
                    var promises = [];
                    var config = {};
                    promises.push(getAppointmentLocations(), getAllServices(), getAllProviders());

                    var enableSpecialities = appService.getAppDescriptor().getConfigValue('enableSpecialities');
                    if (enableSpecialities) {
                        promises.push(getAllSpecialities().then(function (response) {
                            config.specialities = response.data;
                        }));
                    }
                    if (appointmentContext.appointment && appointmentContext.appointment.service) {
                        promises.push(getAppointmentService(appointmentContext.appointment.service.uuid).then(function (response) {
                            config.selectedService = response.data;
                        }));
                    }

                    return spinner.forPromise($q.all(promises).then(function (results) {
                        config.locations = results[0].data.results;
                        config.services = results[1].data;
                        config.providers = results[2];
                        return config;
                    }));
                };

                var getAppointmentLocations = function () {
                    return locationService.getAllByTag('Appointment Location');
                };

                var getAllSpecialities = function () {
                    return specialityService.getAllSpecialities();
                };

                var getAllServices = function () {
                    return appointmentsServiceService.getAllServices();
                };

                var getAllProviders = function () {
                    var params = {v: "custom:(display,person,uuid,retired,attributes:(attributeType:(display),value,voided))"};
                    return providerService.list(params).then(function (response) {
                        return _.filter(response.data.results, function (provider) {
                            return _.find(provider.attributes, function (attribute) {
                                return !attribute.voided && !provider.retired && attribute.value && attribute.attributeType.display === Bahmni.Appointments.Constants.availableForAppointments;
                            });
                        });
                    });
                };

                var getAppointmentService = function (uuid) {
                    return appointmentsServiceService.getService(uuid);
                };

                return init();
            };
        }]
);

'use strict';

var Bahmni = Bahmni || {};
Bahmni.Appointments = Bahmni.Appointments || {};

Bahmni.Appointments.Constants = (function () {
    var hostURL = Bahmni.Common.Constants.hostURL + Bahmni.Common.Constants.RESTWS_V1;
    return {
        createServiceUrl: hostURL + '/appointmentService',
        getServiceLoad: hostURL + '/appointmentService/load',
        getAllSpecialitiesUrl: hostURL + '/speciality/all',
        createAppointmentUrl: hostURL + '/appointment',
        getAppointmentsForServiceTypeUrl: hostURL + '/appointment/futureAppointmentsForServiceType/',
        changeAppointmentStatusUrl: hostURL + '/appointment/{{appointmentUuid}}/changeStatus',
        undoCheckInUrl: hostURL + '/appointment/undoStatusChange/',
        getAppointmentByUuid: hostURL + '/appointment/',
        getAllAppointmentsUrl: hostURL + '/appointment/all',
        searchAppointmentUrl: hostURL + '/appointment/search',
        getAppointmentsSummaryUrl: hostURL + '/appointment/appointmentSummary',
        defaultServiceTypeDuration: 15,
        defaultCalendarSlotLabelInterval: "01:00",
        defaultCalendarSlotDuration: "00:30",
        defaultCalendarStartTime: "08:00",
        defaultCalendarEndTime: "19:00",
        minDurationForAppointment: 30,
        appointmentStatusList: [ "Scheduled", "CheckedIn", "Completed", "Cancelled", "Missed" ],
        regexForTime: /^(?:(?:1[0-2]|0?[1-9]):[0-5]\d\s*[AaPp][Mm])?$/,
        privilegeManageAppointments: 'app:appointments:manageAppointmentsTab',
        privilegeForAdmin: 'app:appointments:adminTab',
        availableForAppointments: 'Available for appointments'
    };
})();


'use strict';

Bahmni.Appointments.Appointment = (function () {
    var Appointment = function (appointmentDetails) {
        angular.extend(this, appointmentDetails);
    };

    Appointment.create = function (appointmentDetails) {
        var dateUtil = Bahmni.Common.Util.DateUtil;
        var getDateTime = function (appointmentDate, givenTime) {
            if (!appointmentDate && !givenTime) return appointmentDate;
            var formattedTime = moment(givenTime, ["hh:mm a"]).format("HH:mm");
            return dateUtil.parseServerDateToDate(dateUtil.getDateWithoutTime(appointmentDate) + ' ' + formattedTime);
        };
        var appointment = new Appointment({
            uuid: appointmentDetails.uuid,
            patientUuid: appointmentDetails.patient.uuid,
            serviceUuid: appointmentDetails.service.uuid,
            serviceTypeUuid: appointmentDetails.serviceType && appointmentDetails.serviceType.uuid,
            startDateTime: getDateTime(appointmentDetails.date, appointmentDetails.startTime),
            endDateTime: getDateTime(appointmentDetails.date, appointmentDetails.endTime),
            providerUuid: appointmentDetails.provider && appointmentDetails.provider.uuid,
            locationUuid: appointmentDetails.location && appointmentDetails.location.uuid,
            appointmentKind: appointmentDetails.appointmentKind,
            comments: appointmentDetails.comments
        });
        return appointment;
    };

    return Appointment;
})();


'use strict';

Bahmni.Appointments.AppointmentService = (function () {
    var timeFormat = 'HH:mm:ss';
    var Service = function (serviceDetails) {
        angular.extend(this, serviceDetails);
    };

    Service.createFromUIObject = function (serviceDetails) {
        var dateUtil = Bahmni.Common.Util.DateUtil;

        var getTime = function (dateTime) {
            return dateTime ? dateUtil.getDateTimeInSpecifiedFormat(dateTime, timeFormat) : undefined;
        };

        var constructAvailabilityPerDay = function (result, availability) {
            var selectedDays = availability.days.filter(function (day) {
                return day.isSelected || day.uuid;
            });

            result = result.concat(selectedDays.map(function (day) {
                return { dayOfWeek: day.dayOfWeek,
                    uuid: day.uuid,
                    startTime: getTime(availability.startTime),
                    endTime: getTime(availability.endTime),
                    maxAppointmentsLimit: availability.maxAppointmentsLimit,
                    voided: !day.isSelected };
            }));
            return result;
        };

        var parse = function (availabilities) {
            return availabilities ? availabilities.reduce(constructAvailabilityPerDay, []) : [];
        };

        var service = new Service({
            name: serviceDetails.name,
            uuid: serviceDetails.uuid,
            description: serviceDetails.description,
            durationMins: serviceDetails.durationMins,
            maxAppointmentsLimit: serviceDetails.maxAppointmentsLimit,
            color: serviceDetails.color,
            startTime: getTime(serviceDetails.startTime),
            endTime: getTime(serviceDetails.endTime),
            specialityUuid: serviceDetails.specialityUuid,
            locationUuid: serviceDetails.locationUuid,
            weeklyAvailability: parse(serviceDetails.weeklyAvailability),
            serviceTypes: serviceDetails.serviceTypes || []
        });
        return service;
    };

    return Service;
})();


'use strict';

Bahmni.Appointments.AppointmentServiceViewModel = (function () {
    var Service = function (serviceDetails) {
        angular.extend(this, serviceDetails);
    };

    var constDays = [{
        dayOfWeek: 'SUNDAY',
        isSelected: false
    }, {
        dayOfWeek: 'MONDAY',
        isSelected: false
    }, {
        dayOfWeek: 'TUESDAY',
        isSelected: false
    }, {
        dayOfWeek: 'WEDNESDAY',
        isSelected: false
    }, {
        dayOfWeek: 'THURSDAY',
        isSelected: false
    }, {
        dayOfWeek: 'FRIDAY',
        isSelected: false
    }, {
        dayOfWeek: 'SATURDAY',
        isSelected: false
    }];

    Service.createFromResponse = function (serviceDetails) {
        var getDateTime = function (time) {
            return time ? new Date("January 01, 1970 " + time) : undefined;
        };

        var parseAvailability = function (avbsByDay) {
            var groupedAvbs = _.groupBy(avbsByDay, function (avb) {
                return avb.startTime + '#' + avb.endTime + '#' + avb.maxAppointmentsLimit;
            });

            return Object.keys(groupedAvbs).map(function (key) {
                var result = {};
                result.startTime = getDateTime(groupedAvbs[key][0].startTime);
                result.endTime = getDateTime(groupedAvbs[key][0].endTime);
                result.maxAppointmentsLimit = groupedAvbs[key][0].maxAppointmentsLimit;
                var selectedDays = groupedAvbs[key];
                var days = angular.copy(constDays);
                selectedDays.map(function (day) {
                    var d = _.find(days, {dayOfWeek: day.dayOfWeek});
                    d.uuid = day.uuid;
                    d.isSelected = true;
                });
                result.days = days;
                return result;
            });
        };

        var service = new Service({
            name: serviceDetails.name,
            uuid: serviceDetails.uuid,
            description: serviceDetails.description,
            durationMins: serviceDetails.durationMins,
            maxAppointmentsLimit: serviceDetails.maxAppointmentsLimit,
            color: serviceDetails.color,
            startTime: getDateTime(serviceDetails.startTime),
            endTime: getDateTime(serviceDetails.endTime),
            specialityUuid: serviceDetails.speciality ? serviceDetails.speciality.uuid : undefined,
            locationUuid: serviceDetails.location ? serviceDetails.location.uuid : undefined,
            weeklyAvailability: parseAvailability(serviceDetails.weeklyAvailability) || [],
            serviceTypes: serviceDetails.serviceTypes || []
        });
        return service;
    };

    return Service;
})();


'use strict';

Bahmni.Appointments.AppointmentViewModel = (function () {
    var Appointment = function (appointmentDetails) {
        angular.extend(this, appointmentDetails);
    };

    Appointment.create = function (appointmentDetails, config) {
        var getDateWithoutTime = function (dateTime) {
            return dateTime ? new Date(moment(dateTime)) : undefined;
        };

        var getTimeWithoutDate = function (dateTime) {
            return dateTime ? moment(dateTime).format('hh:mm a') : undefined;
        };

        var parsePatient = function (patientInfo) {
            var patient = {};
            patient.label = patientInfo.name + " (" + patientInfo.identifier + ")";
            patient.uuid = patientInfo.uuid;
            return patient;
        };

        var getSpecialityFromConfig = function (selectedSpeciality, config) {
            var specialities = config.specialities;
            return _.find(specialities, function (speciality) {
                return selectedSpeciality.uuid === speciality.uuid;
            });
        };

        var getProviderFromConfig = function (selectedProvider, config) {
            var providers = config.providers;
            return _.find(providers, function (provider) {
                return selectedProvider.uuid === provider.uuid;
            });
        };

        var getLocationFromConfig = function (selectedLoc, config) {
            var locations = config.locations;
            return _.find(locations, function (location) {
                return location.uuid === selectedLoc.uuid;
            });
        };

        var getServiceFromConfig = function (selectedService, config) {
            var services = config.services;
            return _.find(services, function (service) {
                return selectedService.uuid === service.uuid;
            });
        };

        var getServiceTypeFromConfig = function (selectedServiceType, config) {
            var serviceTypes = config.selectedService.serviceTypes;
            return _.find(serviceTypes, function (serviceType) {
                return serviceType.uuid === selectedServiceType.uuid;
            });
        };

        var appointment = new Appointment({
            uuid: appointmentDetails.uuid,
            patient: appointmentDetails.patient && parsePatient(appointmentDetails.patient),
            speciality: appointmentDetails.service && getSpecialityFromConfig(appointmentDetails.service.speciality, config),
            service: appointmentDetails.service && getServiceFromConfig(appointmentDetails.service, config),
            serviceType: appointmentDetails.serviceType && getServiceTypeFromConfig(appointmentDetails.serviceType, config),
            provider: appointmentDetails.provider && getProviderFromConfig(appointmentDetails.provider, config),
            location: appointmentDetails.location && getLocationFromConfig(appointmentDetails.location, config),
            date: getDateWithoutTime(appointmentDetails.startDateTime),
            startTime: getTimeWithoutDate(appointmentDetails.startDateTime),
            endTime: getTimeWithoutDate(appointmentDetails.endDateTime),
            appointmentKind: appointmentDetails.appointmentKind,
            status: appointmentDetails.status,
            comments: appointmentDetails.comments
        });
        return appointment;
    };

    return Appointment;
})();

'use strict';

angular.module('bahmni.appointments')
    .directive('timeValidator', function () {
        var DateUtil = Bahmni.Common.Util.DateUtil;

        var isStartTimeBeforeEndTime = function (model) {
            if (!model.startTime || !model.endTime) {
                return true;
            }
            var timeFormat = 'THH:mm:ss';
            var startTime = DateUtil.getDateTimeInSpecifiedFormat(model.startTime, timeFormat);
            var endTime = DateUtil.getDateTimeInSpecifiedFormat(model.endTime, timeFormat);
            return (startTime < endTime);
        };

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                function validate () {
                    ctrl.$setValidity("timeSequence", isStartTimeBeforeEndTime(ctrl.$viewValue));
                }
                scope.$watch(attrs.ngModel + '.startTime', validate);
                scope.$watch(attrs.ngModel + '.endTime', validate);
            }
        };
    });


'use strict';

angular.module('bahmni.appointments')
    .directive('dayCalendar', [function () {
        return {
            restrict: 'E',
            controller: "AppointmentsDayCalendarController",
            scope: {
                appointments: "=",
                date: "="
            },
            templateUrl: "../appointments/views/manage/calendar/dayCalendar.html"
        };
    }]);

'use strict';

angular.module('bahmni.appointments')
    .directive('weekdaySelector', function () {
        var constDays = [{
            dayOfWeek: 'SUNDAY',
            isSelected: false
        }, {
            dayOfWeek: 'MONDAY',
            isSelected: false
        }, {
            dayOfWeek: 'TUESDAY',
            isSelected: false
        }, {
            dayOfWeek: 'WEDNESDAY',
            isSelected: false
        }, {
            dayOfWeek: 'THURSDAY',
            isSelected: false
        }, {
            dayOfWeek: 'FRIDAY',
            isSelected: false
        }, {
            dayOfWeek: 'SATURDAY',
            isSelected: false
        }];

        var template = "<p class='service-ava-days' ng-class='{\"disabled\": ngDisabled===true}'>" +
            "<span id='day-0' ng-class='{\"is-selected\": ngModel[(0 + weekStartsIndex -1)%7].isSelected}' ng-click='onDayClicked((0 + weekStartsIndex -1)%7)'>{{constDays[(0 + weekStartsIndex -1)%7].dayOfWeek | translate}}</span>" +
            "<span id='day-1' ng-class='{\"is-selected\": ngModel[(1 + weekStartsIndex -1)%7].isSelected}' ng-click='onDayClicked((1 + weekStartsIndex -1)%7)'>{{constDays[(1 + weekStartsIndex -1)%7].dayOfWeek | translate}}</span>" +
            "<span id='day-2' ng-class='{\"is-selected\": ngModel[(2 + weekStartsIndex -1)%7].isSelected}' ng-click='onDayClicked((2 + weekStartsIndex -1)%7)'>{{constDays[(2 + weekStartsIndex -1)%7].dayOfWeek | translate}}</span>" +
            "<span id='day-3' ng-class='{\"is-selected\": ngModel[(3 + weekStartsIndex -1)%7].isSelected}' ng-click='onDayClicked((3 + weekStartsIndex -1)%7)'>{{constDays[(3 + weekStartsIndex -1)%7].dayOfWeek | translate}}</span>" +
            "<span id='day-4' ng-class='{\"is-selected\": ngModel[(4 + weekStartsIndex -1)%7].isSelected}' ng-click='onDayClicked((4 + weekStartsIndex -1)%7)'>{{constDays[(4 + weekStartsIndex -1)%7].dayOfWeek | translate}}</span>" +
            "<span id='day-5' ng-class='{\"is-selected\": ngModel[(5 + weekStartsIndex -1)%7].isSelected}' ng-click='onDayClicked((5 + weekStartsIndex -1)%7)'>{{constDays[(5 + weekStartsIndex -1)%7].dayOfWeek | translate}}</span>" +
            "<span id='day-6' ng-class='{\"is-selected\": ngModel[(6 + weekStartsIndex -1)%7].isSelected}' ng-click='onDayClicked((6 + weekStartsIndex -1)%7)'>{{constDays[(6 + weekStartsIndex -1)%7].dayOfWeek | translate}}</span>" +
            "</p>";

        var link = function (scope) {
            var init = function () {
                scope.constDays = constDays;
                scope.weekStartsIndex = scope.weekStartsIndex || 1;
                initDays();
            };

            var initDays = function () {
                scope.ngModel = scope.ngModel || angular.copy(scope.constDays);
            };

            scope.onDayClicked = function (dayIndex) {
                initDays();
                if (!scope.ngDisabled) {
                    scope.ngModel[dayIndex].isSelected = !scope.ngModel[dayIndex].isSelected;
                    if (scope.ngChange) {
                        scope.ngChange({newValue: {index: dayIndex, item: scope.ngModel[dayIndex]}});
                    }
                }
            };

            init();
        };

        return {
            restrict: 'AE',
            scope: {
                ngModel: '=?',
                ngChange: '&',
                weekStartsIndex: '=',
                ngDisabled: '=?'
            },
            link: link,
            template: template
        };
    });

'use strict';

angular.module('bahmni.appointments')
    .directive('serviceAvailability', ['appService', 'confirmBox', function (appService, confirmBox) {
        var states = {NEW: 0, EDIT: 1, READONLY: 2};

        var constDays = [{
            dayOfWeek: 'SUNDAY',
            isSelected: false
        }, {
            dayOfWeek: 'MONDAY',
            isSelected: false
        }, {
            dayOfWeek: 'TUESDAY',
            isSelected: false
        }, {
            dayOfWeek: 'WEDNESDAY',
            isSelected: false
        }, {
            dayOfWeek: 'THURSDAY',
            isSelected: false
        }, {
            dayOfWeek: 'FRIDAY',
            isSelected: false
        }, {
            dayOfWeek: 'SATURDAY',
            isSelected: false
        }];

        var link = function (scope) {
            var init = function () {
                scope.availability = scope.availability || {};
                scope.startOfWeek = appService.getAppDescriptor().getConfigValue('startOfWeek') || 2;
            };

            scope.add = function () {
                if (addOrUpdateToIndex(scope.availabilityList.length)) {
                    scope.availability = {days: angular.copy(constDays)};
                }
            };

            scope.clearValueIfInvalid = function () {
                if (scope.availability.maxAppointmentsLimit < 0) {
                    scope.availability.maxAppointmentsLimit = '';
                }
            };

            scope.update = function () {
                var index = scope.availabilityList.indexOf(scope.backUpAvailability);
                if (addOrUpdateToIndex(index)) {
                    scope.state = states.READONLY;
                }
            };

            var addOrUpdateToIndex = function (index) {
                scope.doesOverlap = overlapsWithExisting(index);
                if (!scope.doesOverlap) {
                    scope.availabilityList[index] = scope.availability;
                }
                return !scope.doesOverlap;
            };

            scope.isValid = function () {
                var startTime = scope.availability.startTime;
                var endTime = scope.availability.endTime;
                return startTime &&
                       endTime && startTime < endTime &&
                        convertDaysToBinary(scope.availability.days);
            };

            var overlapsWithExisting = function (index) {
                var avb = scope.availability;
                return !_.isEmpty(scope.availabilityList) && _.some(scope.availabilityList, function (currAvb, currIndex) {
                    if (index !== currIndex) {
                        return hasCommonDays(avb, currAvb) && hasOverlappingTimes(avb, currAvb);
                    }
                });
            };

            var convertDaysToBinary = function (days) {
                return parseInt(days.map(function (day) {
                    return day.isSelected ? 1 : 0;
                }).reverse().join(''), 2);
            };

            var hasCommonDays = function (avb1, avb2) {
                var days1InBinary = convertDaysToBinary(avb1.days);
                var days2InBinary = convertDaysToBinary(avb2.days);
                return (days1InBinary & days2InBinary) !== 0;
            };

            var hasOverlappingTimes = function (avb1, avb2) {
                return (avb1.startTime < avb2.endTime) && (avb2.startTime < avb1.endTime);
            };

            scope.confirmDelete = function () {
                var childScope = {};
                childScope.message = 'CONFIRM_DELETE_AVAILABILITY';
                childScope.ok = deleteAvailability;
                childScope.cancel = cancelDelete;
                confirmBox({
                    scope: childScope,
                    actions: [{name: 'cancel', display: 'CANCEL_KEY'}, {name: 'ok', display: 'OK_KEY'}],
                    className: "ngdialog-theme-default delete-program-popup"
                });
            };

            var deleteAvailability = function (closeDialog) {
                var index = scope.availabilityList.indexOf(scope.availability);
                scope.availabilityList.splice(index, 1);
                closeDialog();
            };

            var cancelDelete = function (closeDialog) {
                closeDialog();
            };

            scope.cancel = function () {
                scope.availability = scope.backUpAvailability;
                scope.doesOverlap = false;
                scope.state = states.READONLY;
            };

            scope.enableEdit = function () {
                scope.backUpAvailability = scope.availability;
                scope.availability = angular.copy(scope.availability);
                scope.state = states.EDIT;
            };

            scope.isNew = function () {
                return scope.state === states.NEW;
            };

            scope.isEdit = function () {
                return scope.state === states.EDIT;
            };

            scope.isReadOnly = function () {
                return scope.state === states.READONLY;
            };

            init();
        };

        return {
            restrict: 'AE',
            scope: {
                availability: '=?',
                availabilityList: '=',
                state: '=',
                disableMaxLoad: '='
            },
            link: link,
            templateUrl: '../appointments/views/admin/appointmentServiceAvailability.html'
        };
    }]);

'use strict';

angular.module('bahmni.appointments')
    .directive('serviceTypes', ['ngDialog', 'messagingService', 'appointmentsService', function (ngDialog, messagingService, appointmentsService) {
        var controller = function ($scope) {
            $scope.serviceType = {};

            $scope.updateServiceTypeDuration = function () {
                if (!_.isEmpty($scope.serviceType.name)) {
                    $scope.serviceType.duration = $scope.serviceType.duration || Bahmni.Appointments.Constants.defaultServiceTypeDuration;
                } else {
                    $scope.serviceType.duration = undefined;
                    $scope.serviceTypesForm.serviceTypeName.$setValidity('uniqueServiceTypeName', true);
                }
            };

            var validateServiceType = function (serviceType) {
                var nonVoidedServiceTypes = _.filter($scope.service.serviceTypes, function (serviceType) {
                    return !serviceType.voided;
                });
                return (!_.find(nonVoidedServiceTypes, serviceType));
            };

            $scope.addServiceType = function (serviceType) {
                if (validateServiceType(serviceType)) {
                    $scope.service.serviceTypes.push({name: serviceType.name, duration: serviceType.duration ? serviceType.duration : 0});
                    $scope.serviceType = {name: undefined, duration: undefined};
                    $scope.serviceTypesForm.serviceTypeName.$setValidity('uniqueServiceTypeName', true);
                } else {
                    $scope.serviceTypesForm.serviceTypeName.$setValidity('uniqueServiceTypeName', false);
                }
            };

            var openConfirmationDialog = function (serviceType) {
                ngDialog.openConfirm({
                    template: 'views/admin/serviceTypeDeleteConfirmation.html',
                    scope: $scope,
                    data: {serviceType: serviceType},
                    closeByEscape: true
                });
            };

            $scope.deleteServiceType = function (serviceType) {
                if (_.isEmpty(serviceType.uuid)) {
                    openConfirmationDialog(serviceType);
                } else {
                    appointmentsService.getAppointmentsForServiceType(serviceType.uuid).then(function (response) {
                        if (response.data.length) {
                            messagingService.showMessage('error', "APPOINTMENT_SERVICE_TYPE_DELETE_CONFIRMATION_DIALOG_MESSAGE_KEY");
                        } else {
                            openConfirmationDialog(serviceType);
                        }
                    });
                }
            };

            $scope.deleteServiceTypeOnConfirmation = function (serviceType) {
                if (_.isEmpty(serviceType.uuid)) {
                    _.remove($scope.service.serviceTypes, serviceType);
                } else {
                    serviceType.voided = true;
                }
                ngDialog.close();
            };

            $scope.cancelTransition = function () {
                ngDialog.close();
            };
        };

        return {
            restrict: 'E',
            scope: {
                service: '='
            },
            templateUrl: "../appointments/views/admin/serviceTypes.html",
            controller: controller
        };
    }]);


'use strict';

angular.module('bahmni.appointments')
    .directive('colorPicker', ['$document', function ($document) {
        return {
            restrict: "E",
            scope: {
                colors: "=",
                selectedColor: '='
            },
            templateUrl: "../appointments/views/admin/colorPicker.html",
            link: function (scope) {
                scope.showTheColorPicker = function (event) {
                    scope.showColorPicker = !scope.showColorPicker;
                    event.stopPropagation();
                };

                scope.setColor = function (color, event) {
                    scope.selectedColor = color;
                    scope.showColorPicker = false;
                    event.stopPropagation();
                };

                $document.bind("click", function (ev) {
                    scope.showColorPicker = false;
                    scope.$digest();
                });
            }
        };
    }]);

'use strict';

angular.module('bahmni.appointments')
    .directive('datePicker', function () {
        var controller = function ($scope) {
            var dateUtil = Bahmni.Common.Util.DateUtil;
            var init = function () {
                if (!$scope.viewDate) {
                    $scope.goToCurrent();
                }
                viewDateChange();
            };

            var viewDateChange = function () {
                if (!$scope.lastValidDate || ($scope.lastValidDate && $scope.viewDate && $scope.lastValidDate.getTime() !== $scope.viewDate.getTime())) {
                    $scope.lastValidDate = $scope.viewDate;
                    $scope.onChange($scope.viewDate);
                }
            };

            $scope.goToPrevious = function () {
                $scope.viewDate = $scope.viewDate && dateUtil.subtractDays($scope.viewDate, 1);
                viewDateChange();
            };

            $scope.goToCurrent = function () {
                $scope.viewDate = moment().startOf('day').toDate();
                viewDateChange();
            };

            $scope.goToNext = function () {
                $scope.viewDate = $scope.viewDate && dateUtil.addDays($scope.viewDate, 1);
                viewDateChange();
            };

            $scope.keydownEvent = function () {
                var keyCode;
                if (event) {
                    keyCode = (event.keyCode ? event.keyCode : event.which);
                }
                if (keyCode && (keyCode === 46 || keyCode === 8)) { // delete and backspace keys resp.
                    event.preventDefault();
                } else if (keyCode && keyCode === 13) { // Enter key
                    viewDateChange();
                }
            };

            $scope.dateChanged = function () {
                viewDateChange();
            };
            init();
        };
        return {
            restrict: "E",
            scope: {
                viewDate: "=",
                onChange: "=",
                lastValidDate: "="
            },
            templateUrl: "../appointments/views/manage/datePicker.html",
            controller: controller
        };
    });

'use strict';

angular.module('bahmni.appointments')
    .directive('weekPicker', function () {
        var controller = function ($scope) {
            var dateUtil = Bahmni.Common.Util.DateUtil;
            var init = function () {
                if (!$scope.viewDate) {
                    $scope.setViewDateToToday();
                }
            };

            $scope.goToPreviousWeek = function () {
                $scope.viewDate = $scope.viewDate && dateUtil.subtractDays($scope.viewDate, 7);
            };

            $scope.setViewDateToToday = function () {
                $scope.viewDate = moment().startOf('day').toDate();
            };

            $scope.goToNextWeek = function () {
                $scope.viewDate = $scope.viewDate && dateUtil.addDays($scope.viewDate, 7);
            };

            var setWeekStartDate = function (date) {
                var weekStartDayStandard = $scope.weekStart ? $scope.weekStart : 'isoWeek';
                $scope.weekStartDate = moment(date).startOf(weekStartDayStandard).toDate();
            };

            var setWeekEndDate = function (date) {
                var weekStartDayStandard = $scope.weekStart ? $scope.weekStart : 'isoWeek';
                $scope.weekEndDate = moment(date).endOf(weekStartDayStandard).toDate();
            };

            $scope.$watch("viewDate", function (viewDate) {
                setWeekStartDate(viewDate);
                setWeekEndDate(viewDate);
                $scope.onChange($scope.weekStartDate, $scope.weekEndDate);
            });

            init();
        };
        return {
            restrict: "E",
            scope: {
                viewDate: "=",
                onChange: "=",
                weekStart: "=?"
            },
            templateUrl: "../appointments/views/manage/weekPicker.html",
            controller: controller
        };
    });


'use strict';

angular.module('bahmni.appointments')
    .directive('multiSelectAutocomplete', [function () {
        var link = function ($scope, element) {
            $scope.focusOnTheTest = function () {
                var autoselectInput = $("input.input");
                autoselectInput[0].focus();
                $scope.selectedValues = $scope.selectedValues || [];
            };

            $scope.addItem = function (item) {
                item[item.name] = true;
                $scope.selectedValues = _.union($scope.selectedValues, item, $scope.keyProperty);
            };
            $scope.removeItem = function (item) {
                $scope.selectedValues = _.filter($scope.selectedValues, function (value) {
                    return value[$scope.keyProperty] !== item[$scope.keyProperty];
                });
            };

            $scope.search = function (query) {
                var matchingAnswers = [];
                var unselectedValues = _.xorBy($scope.inputItems, $scope.selectedValues, $scope.keyProperty);
                _.forEach(unselectedValues, function (answer) {
                    if (typeof answer.name != "object" && answer.name.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                        matchingAnswers.push(answer);
                    }
                });
                return _.uniqBy(matchingAnswers, $scope.keyProperty);
            };
        };
        return {
            restrict: 'E',
            link: link,
            scope: {
                inputItems: "=",
                selectedValues: "=",
                displayProperty: "=",
                keyProperty: "=",
                placeholder: "=",
                loadOnDownArrow: "=",
                autoCompleteMinLength: "="
            },
            templateUrl: "../appointments/views/manage/multiSelectAutocomplete.html"
        };
    }]);

'use strict';

angular.module('bahmni.appointments')
    .directive('patientSearch', ['patientService', 'appointmentsService', 'spinner', '$state', function (patientService, appointmentsService, spinner, $state) {
        return {
            restrict: "E",
            scope: {
                onSearch: "="
            },
            templateUrl: "../appointments/views/manage/patientSearch.html",
            link: {
                pre: function ($scope) {
                    $scope.search = function () {
                        return spinner.forPromise(patientService.search($scope.patient).then(function (response) {
                            return response.data.pageOfResults;
                        }));
                    };

                    $scope.responseMap = function (data) {
                        return _.map(data, function (patientInfo) {
                            patientInfo.label = patientInfo.givenName + " " + patientInfo.familyName + " " + "(" + patientInfo.identifier + ")";
                            return patientInfo;
                        });
                    };

                    $scope.onSelectPatient = function (data) {
                        $state.params.patient = data;
                        spinner.forPromise(appointmentsService.search({patientUuid: data.uuid}).then(function (oldAppointments) {
                            var appointmentInDESCOrderBasedOnStartDateTime = _.sortBy(oldAppointments.data, "startDateTime").reverse();
                            $scope.onSearch(appointmentInDESCOrderBasedOnStartDateTime);
                        }));
                    };

                    if ($state.params.isSearchEnabled && $state.params.patient) {
                        $scope.patient = $scope.responseMap([$state.params.patient])[0].label;
                        $scope.onSelectPatient($state.params.patient);
                    }

                    $scope.$watch(function () {
                        return $state.params.isSearchEnabled;
                    }, function (isSearchEnabled) {
                        if (isSearchEnabled == false) {
                            $scope.patient = null;
                        }
                    }, true);
                }
            }
        };
    }]);

'use strict';

angular.module('bahmni.appointments')
    .service('appointmentsServiceService', ['$http',
        function ($http) {
            this.save = function (service) {
                return $http.post(Bahmni.Appointments.Constants.createServiceUrl, service, {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.getAllServices = function () {
                return $http.get(Bahmni.Common.Constants.appointmentServiceUrl + "/all/default", {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.getAllServicesWithServiceTypes = function () {
                return $http.get(Bahmni.Common.Constants.appointmentServiceUrl + "/all/full", {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.getServiceLoad = function (serviceUuid, startDateTime, endDateTime) {
                var params = {uuid: serviceUuid, startDateTime: startDateTime, endDateTime: endDateTime};
                return $http.get(Bahmni.Appointments.Constants.getServiceLoad, {
                    params: params,
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.getService = function (uuid) {
                return $http.get(Bahmni.Common.Constants.appointmentServiceUrl + "?uuid=" + uuid, {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.deleteAppointmentService = function (serviceUuid) {
                var params = {uuid: serviceUuid};
                return $http.delete(Bahmni.Common.Constants.appointmentServiceUrl, {
                    params: params,
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };
        }]);

'use strict';

angular.module('bahmni.appointments')
    .service('specialityService', ['$http',
        function ($http) {
            this.getAllSpecialities = function () {
                return $http.get(Bahmni.Appointments.Constants.getAllSpecialitiesUrl, {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };
        }]);


'use strict';

angular.module('bahmni.appointments')
    .service('appointmentsService', ['$http', 'appService',
        function ($http, appService) {
            this.save = function (appointment) {
                return $http.post(Bahmni.Appointments.Constants.createAppointmentUrl, appointment, {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };
            this.search = function (appointment) {
                return $http.post(Bahmni.Appointments.Constants.searchAppointmentUrl, appointment, {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.getAppointmentsForServiceType = function (serviceTypeUuid) {
                var params = {"appointmentServiceTypeUuid": serviceTypeUuid};
                return $http.get(Bahmni.Appointments.Constants.getAppointmentsForServiceTypeUrl, {
                    params: params,
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.getAllAppointments = function (params) {
                return $http.get(Bahmni.Appointments.Constants.getAllAppointmentsUrl, {
                    params: params,
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.getAppointmentByUuid = function (appointmentUuid) {
                var params = {uuid: appointmentUuid};
                return $http.get(Bahmni.Appointments.Constants.getAppointmentByUuid, {
                    params: params,
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.getAppointmentsSummary = function (params) {
                return $http.get(Bahmni.Appointments.Constants.getAppointmentsSummaryUrl, {
                    params: params,
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.changeStatus = function (appointmentUuid, toStatus, onDate) {
                var params = {toStatus: toStatus, onDate: onDate};
                var changeStatusUrl = appService.getAppDescriptor().formatUrl(Bahmni.Appointments.Constants.changeAppointmentStatusUrl, {appointmentUuid: appointmentUuid});
                return $http.post(changeStatusUrl, params, {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };

            this.undoCheckIn = function (appointmentUuid) {
                return $http.post(Bahmni.Appointments.Constants.undoCheckInUrl + appointmentUuid, {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                });
            };
        }]);

'use strict';

angular.module('bahmni.appointments')
    .service('calendarViewPopUp', ['$rootScope', 'ngDialog', '$state', '$translate', 'appointmentsService',
        'confirmBox', 'checkinPopUp', 'appService', 'messagingService',
        function ($rootScope, ngDialog, $state, $translate, appointmentsService, confirmBox, checkinPopUp, appService, messagingService) {
            var calendarViewPopUp = function (config) {
                var popUpScope = $rootScope.$new();
                var dialog;
                var scope = config.scope;
                scope.patientList = scope.appointments.map(function (appt) {
                    return appt.patient;
                });

                scope.patientAppointmentMap = scope.appointments.reduce(function (result, appt) {
                    result[appt.patient.uuid] = appt;
                    return result;
                }, {});

                popUpScope.scope = scope;
                popUpScope.patient = scope.patientList.length === 1 ? scope.patientList[0] : undefined;
                popUpScope.manageAppointmentPrivilege = Bahmni.Appointments.Constants.privilegeManageAppointments;
                popUpScope.allowedActions = appService.getAppDescriptor().getConfigValue('allowedActions') || [];
                popUpScope.allowedActionsByStatus = appService.getAppDescriptor().getConfigValue('allowedActionsByStatus') || {};

                popUpScope.navigateTo = function (state, appointment) {
                    var params = $state.params;
                    if (state === 'edit') {
                        ngDialog.close(dialog.id, false);
                        params.uuid = appointment.uuid;
                        $state.go('home.manage.appointments.calendar.edit', params, {reload: false});
                    } else if (state === 'new') {
                        ngDialog.close(dialog.id, false);
                        params.appointment = { startDateTime: scope.appointments[0].startDateTime,
                            endDateTime: scope.appointments[0].endDateTime,
                            provider: scope.appointments[0].provider,
                            appointmentKind: 'Scheduled'
                        };
                        $state.go('home.manage.appointments.calendar.new', params, {reload: false});
                    } else {
                        $state.go($state.current, $state.params, {reload: true});
                    }
                    popUpScope.$destroy();
                };

                var closeConfirmBox = function (closeConfirmBox) {
                    closeConfirmBox();
                };

                var changeStatus = function (appointment, toStatus, onDate, closeConfirmBox) {
                    var message = $translate.instant('APPOINTMENT_STATUS_CHANGE_SUCCESS_MESSAGE', {
                        toStatus: toStatus
                    });
                    return appointmentsService.changeStatus(appointment.uuid, toStatus, onDate).then(function () {
                        appointment.status = toStatus;
                        closeConfirmBox();
                        messagingService.showMessage('info', message);
                    });
                };

                popUpScope.checkinAppointment = function (patientAppointment) {
                    var scope = $rootScope.$new();
                    scope.message = $translate.instant('APPOINTMENT_STATUS_CHANGE_CONFIRM_MESSAGE', {
                        toStatus: 'CheckedIn'
                    });
                    scope.action = _.partial(changeStatus, patientAppointment, 'CheckedIn', _);
                    checkinPopUp({
                        scope: scope,
                        className: "ngdialog-theme-default app-dialog-container"
                    });
                };

                popUpScope.confirmAction = function (appointment, toStatus) {
                    var scope = {};
                    scope.message = $translate.instant('APPOINTMENT_STATUS_CHANGE_CONFIRM_MESSAGE', {
                        toStatus: toStatus
                    });
                    scope.no = closeConfirmBox;
                    scope.yes = _.partial(changeStatus, appointment, toStatus, undefined, _);
                    confirmBox({
                        scope: scope,
                        actions: [{name: 'yes', display: 'YES_KEY'}, {name: 'no', display: 'NO_KEY'}],
                        className: "ngdialog-theme-default"
                    });
                };

                popUpScope.isAllowedAction = function (action) {
                    return _.includes(popUpScope.allowedActions, action);
                };

                popUpScope.isValidAction = function (appointment, action) {
                    if (!appointment) {
                        return false;
                    }
                    var allowedActions = popUpScope.allowedActionsByStatus.hasOwnProperty(appointment.status) ? popUpScope.allowedActionsByStatus[appointment.status] : [];
                    return _.includes(allowedActions, action);
                };

                dialog = ngDialog.open({
                    template: '../appointments/views/manage/calendar/popUp.html',
                    scope: popUpScope,
                    className: config.className || 'ngdialog-theme-default'
                });

                dialog.closePromise.then(function (data) {
                    if (data.value !== false) {
                        popUpScope.navigateTo('calendar');
                    }
                });
            };
            return calendarViewPopUp;
        }]);

'use strict';

angular.module('bahmni.common.uiHelper')
    .service('checkinPopUp', ['$rootScope', 'ngDialog', function ($rootScope, ngDialog) {
        var confirmBox = function (config) {
            var dialog;
            var scope = config.scope;
            scope.time = moment().seconds(0).milliseconds(0).toDate();
            scope.close = function () {
                ngDialog.close(dialog.id);
                scope.$destroy();
            };
            dialog = ngDialog.open({
                template: '../appointments/views/checkInPopUp.html',
                scope: scope,
                className: config.className || 'ngdialog-theme-default'
            });

            scope.performAction = function (close) {
                scope.action(scope.time, close);
            };
        };
        return confirmBox;
    }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('deleteAppointmentServiceController', ['$scope', 'appointmentsServiceService', 'messagingService', 'ngDialog', '$state',
        function ($scope, appointmentsServiceService, messagingService, ngDialog, $state) {
            $scope.service = $scope.ngDialogData.service;

            $scope.deleteServiceConfirmation = function () {
                return appointmentsServiceService.deleteAppointmentService($scope.service.uuid).then(function () {
                    messagingService.showMessage('info', "{{'APPOINTMENT_SERVICE_DELETE_SUCCESS_MESSAGE_KEY' | translate}}");
                    ngDialog.close();
                    $state.reload();
                }, function () {
                    ngDialog.close();
                });
            };

            $scope.cancelDeleteService = function () {
                ngDialog.close();
            };
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentsHeaderController', ['$scope', '$state', 'appService',
        function ($scope, $state, appService) {
            var setBackLinks = function () {
                var backLinks = [{label: "Home", url: "../home/", accessKey: "h", icon: "fa-home"}];

                // TODO:permissions for admin
                backLinks.push({text: "APPOINTMENTS_MANAGE", state: "home.manage", accessKey: "M"});
                var enableAdminPage = appService.getAppDescriptor().getExtensionById('bahmni.appointments.admin', true);
                if (enableAdminPage) {
                    backLinks.push({text: "APPOINTMENTS_ADMIN", state: "home.admin.service", accessKey: "A", requiredPrivilege: Bahmni.Appointments.Constants.privilegeForAdmin});
                }
                $state.get('home').data.backLinks = backLinks;
            };
            var init = function () {
                setBackLinks();
            };
            return init();
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentsManageController', ['$scope', '$state', 'appService',
        function ($scope, $state, appService) {
            $scope.enableCalendarView = appService.getAppDescriptor().getConfigValue('enableCalendarView');

            $scope.navigateTo = function (viewName) {
                var stateName = 'home.manage.' + ((viewName === 'appointments') ? getAppointmentsTab() : viewName);
                $state.go(stateName, $state.params, {reload: false});
            };
            var getAppointmentsTab = function () {
                return 'appointments.' + ($scope.enableCalendarView ? 'calendar' : 'list');
            };

            $scope.getCurrentTabName = function () {
                return $state.current.tabName;
            };
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AllAppointmentServicesController', ['$scope', '$state', '$location', 'spinner',
        'appointmentsServiceService', 'appService', 'ngDialog',
        function ($scope, $state, $location, spinner, appointmentsServiceService, appService, ngDialog) {
            $scope.enableSpecialities = appService.getAppDescriptor().getConfigValue('enableSpecialities');
            $scope.createService = function () {
                $state.go('home.admin.service.edit', {uuid: 'new'});
            };

            $scope.editService = function (uuid) {
                $state.go('home.admin.service.edit', {uuid: uuid});
            };

            $scope.deleteAppointmentService = function (service) {
                ngDialog.open({
                    template: 'views/admin/deleteAppointmentService.html',
                    className: 'ngdialog-theme-default',
                    data: {service: service},
                    controller: 'deleteAppointmentServiceController'
                });
            };

            var init = function () {
                return appointmentsServiceService.getAllServices().then(function (response) {
                    $scope.appointmentServices = response.data;
                });
            };

            return spinner.forPromise(init());
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentsCreateController', ['$scope', '$q', '$window', '$state', '$translate', 'spinner', 'patientService',
        'appointmentsService', 'appointmentsServiceService', 'messagingService',
        'ngDialog', 'appService', '$stateParams', 'appointmentCreateConfig', 'appointmentContext', '$http', 'sessionService',
        function ($scope, $q, $window, $state, $translate, spinner, patientService, appointmentsService, appointmentsServiceService,
                  messagingService, ngDialog, appService, $stateParams, appointmentCreateConfig, appointmentContext, $http, sessionService) {
            $scope.isFilterOpen = $stateParams.isFilterOpen;
            $scope.showConfirmationPopUp = true;
            $scope.enableSpecialities = appService.getAppDescriptor().getConfigValue('enableSpecialities');
            $scope.enableServiceTypes = appService.getAppDescriptor().getConfigValue('enableServiceTypes');
            $scope.today = Bahmni.Common.Util.DateUtil.getDateWithoutTime(Bahmni.Common.Util.DateUtil.now());
            $scope.timeRegex = Bahmni.Appointments.Constants.regexForTime;
            $scope.warning = {};
            $scope.minDuration = Bahmni.Appointments.Constants.minDurationForAppointment;
            $scope.appointmentCreateConfig = appointmentCreateConfig;
            $scope.enableEditService = appService.getAppDescriptor().getConfigValue('isServiceOnAppointmentEditable');
            $scope.showStartTimes = [];
            $scope.showEndTimes = [];
            var patientSearchURL = appService.getAppDescriptor().getConfigValue('patientSearchUrl');
            var loginLocationUuid = sessionService.getLoginLocationUuid();
            $scope.minCharLengthToTriggerPatientSearch = appService.getAppDescriptor().getConfigValue('minCharLengthToTriggerPatientSearch') || 3;

            var isProviderNotAvailableForAppointments = function (selectedProvider) {
                var providers = appointmentCreateConfig.providers;
                return _.isUndefined(_.find(providers, function (provider) {
                    return selectedProvider.uuid === provider.uuid;
                }));
            };
            var init = function () {
                wireAutocompleteEvents();
                if (!_.isEmpty(appointmentContext) && !_.isEmpty(appointmentContext.appointment) && !_.isEmpty(appointmentContext.appointment.provider)) {
                    var isProviderNotAvailable = isProviderNotAvailableForAppointments(appointmentContext.appointment.provider);
                    if (isProviderNotAvailable) {
                        appointmentContext.appointment.provider.person = {display: appointmentContext.appointment.provider.name};
                        appointmentCreateConfig.providers.push(appointmentContext.appointment.provider);
                    }
                }
                $scope.appointment = Bahmni.Appointments.AppointmentViewModel.create(appointmentContext.appointment || {appointmentKind: 'Scheduled'}, appointmentCreateConfig);
                $scope.selectedService = appointmentCreateConfig.selectedService;
                $scope.isPastAppointment = $scope.isEditMode() ? Bahmni.Common.Util.DateUtil.isBeforeDate($scope.appointment.date, moment().startOf('day')) : false;
                if ($scope.appointment.patient) {
                    $scope.onSelectPatient($scope.appointment.patient);
                }
            };

            $scope.save = function () {
                var message;
                if ($scope.createAppointmentForm.$invalid) {
                    message = $scope.createAppointmentForm.$error.pattern
                        ? 'INVALID_TIME_ERROR_MESSAGE' : 'INVALID_SERVICE_FORM_ERROR_MESSAGE';
                } else if (!moment($scope.appointment.startTime, 'hh:mm a')
                        .isBefore(moment($scope.appointment.endTime, 'hh:mm a'), 'minutes')) {
                    message = 'TIME_SEQUENCE_ERROR_MESSAGE';
                }
                if (message) {
                    messagingService.showMessage('error', message);
                    return;
                }

                $scope.validatedAppointment = Bahmni.Appointments.Appointment.create($scope.appointment);
                var conflictingAppointments = getConflictingAppointments($scope.validatedAppointment);
                if (conflictingAppointments.length === 0) {
                    return saveAppointment($scope.validatedAppointment);
                } else {
                    $scope.displayConflictConfirmationDialog();
                }
            };

            $scope.search = function () {
                var formattedUrl;
                if (patientSearchURL && !_.isEmpty(patientSearchURL)) {
                    var params = {
                        'loginLocationUuid': loginLocationUuid,
                        'searchValue': $scope.appointment.patient.label
                    };
                    formattedUrl = appService.getAppDescriptor().formatUrl(patientSearchURL, params);
                }
                return (spinner.forPromise(formattedUrl ? $http.get(Bahmni.Common.Constants.RESTWS_V1 + formattedUrl) : patientService.search($scope.appointment.patient.label)).then(function (response) {
                    return response.data.pageOfResults;
                }));
            };

            $scope.timeSource = function () {
                return $q(function (resolve) {
                    resolve($scope.showStartTimes);
                });
            };

            $scope.endTimeSlots = function () {
                return $q(function (resolve) {
                    resolve($scope.showEndTimes);
                });
            };

            $scope.onSelectPatient = function (data) {
                $scope.appointment.patient = data;
                return spinner.forPromise(appointmentsService.search({patientUuid: data.uuid}).then(function (oldAppointments) {
                    $scope.patientAppointments = oldAppointments.data;
                }));
            };

            var clearSlotsInfo = function () {
                delete $scope.currentLoad;
                delete $scope.maxAppointmentsLimit;
            };

            var getSlotsInfo = function () {
                var daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                var selectedService = $scope.selectedService;
                var appointment = $scope.appointment;
                var startDateTime, endDateTime;
                var availabilityObject;
                clearSlotsInfo();
                if (!_.isEmpty(selectedService.weeklyAvailability)) {
                    var availability = _.find(selectedService.weeklyAvailability, function (avb) {
                        return daysOfWeek[appointment.date.getDay()] === avb.dayOfWeek &&
                            moment(avb.startTime, 'hh:mm a') <= moment(appointment.startTime, 'hh:mm a') &&
                            moment(appointment.endTime, 'hh:mm a') <= moment(avb.endTime, 'hh:mm a');
                    });
                    if (availability) {
                        availabilityObject = availability;
                        availabilityObject.durationMins = selectedService.durationMins || $scope.minDuration;
                    }
                } else {
                    if (moment(selectedService.startTime || "00:00", 'hh:mm a') <= moment(appointment.startTime, 'hh:mm a') &&
                        moment(appointment.endTime, 'hh:mm a') <= moment(selectedService.endTime || "23:59", 'hh:mm a')) {
                        availabilityObject = selectedService;
                    }
                }
                if (availabilityObject) {
                    $scope.maxAppointmentsLimit = availabilityObject.maxAppointmentsLimit || calculateMaxLoadFromDuration(availabilityObject);
                    startDateTime = getDateTime(appointment.date, availabilityObject.startTime || "00:00");
                    endDateTime = getDateTime(appointment.date, availabilityObject.endTime || "23:59");
                    appointmentsServiceService.getServiceLoad(selectedService.uuid, startDateTime, endDateTime).then(function (response) {
                        $scope.currentLoad = response.data;
                    });
                }
            };

            var dateUtil = Bahmni.Common.Util.DateUtil;
            var calculateMaxLoadFromDuration = function (avb) {
                if (avb.durationMins && avb.startTime && avb.endTime) {
                    var startTime = moment(avb.startTime, ["hh:mm a"]);
                    var endTime = moment(avb.endTime, ["hh:mm a"]);
                    return Math.round((dateUtil.diffInMinutes(startTime, endTime)) / avb.durationMins);
                }
            };

            var getDateTime = function (date, time) {
                var formattedTime = moment(time, ["hh:mm a"]).format("HH:mm");
                return dateUtil.parseServerDateToDate(dateUtil.getDateWithoutTime(date) + ' ' + formattedTime);
            };

            var isAppointmentTimeWithinServiceAvailability = function (appointmentTime) {
                if ($scope.weeklyAvailabilityOnSelectedDate && $scope.weeklyAvailabilityOnSelectedDate.length) {
                    return _.find($scope.weeklyAvailabilityOnSelectedDate, function (availability) {
                        return !(moment(appointmentTime, 'hh:mm a').isBefore(moment(availability.startTime, 'hh:mm a')) ||
                        moment(availability.endTime, 'hh:mm a').isBefore(moment(appointmentTime, 'hh:mm a')));
                    });
                } else if ($scope.allowedStartTime || $scope.allowedEndTime) {
                    return !(moment(appointmentTime, 'hh:mm a').isBefore(moment($scope.allowedStartTime, 'hh:mm a')) ||
                    moment($scope.allowedEndTime, 'hh:mm a').isBefore(moment(appointmentTime, 'hh:mm a')));
                }
                return true;
            };

            var isAppointmentStartTimeAndEndTimeWithinServiceAvailability = function () {
                var appointmentStartTime = $scope.appointment.startTime;
                var appointmentEndTime = $scope.appointment.endTime;

                if ($scope.weeklyAvailabilityOnSelectedDate && $scope.weeklyAvailabilityOnSelectedDate.length) {
                    return _.find($scope.weeklyAvailabilityOnSelectedDate, function (availability) {
                        return (moment(availability.startTime, 'hh:mm a') <= moment(appointmentStartTime, 'hh:mm a')) &&
                        (moment(appointmentEndTime, 'hh:mm a') <= moment(availability.endTime, 'hh:mm a'));
                    });
                }
                return true;
            };

            var filterTimingsBasedOnInput = function (enteredNumber, allowedList) {
                var showTimes = [];

                _.each(allowedList, function (time) {
                    (time.startsWith(enteredNumber) || (time.indexOf(enteredNumber) === 1 && (time.indexOf(0) === 0))) && showTimes.push(time);
                });

                return showTimes.length === 0 ? allowedList : showTimes;
            };

            $scope.onKeyDownOnStartTime = function () {
                $scope.showStartTimes = filterTimingsBasedOnInput($scope.appointment.startTime, $scope.startTimes);
            };

            $scope.onKeyDownOnEndTime = function () {
                $scope.showEndTimes = filterTimingsBasedOnInput($scope.appointment.endTime, $scope.endTimes);
            };

            $scope.onSelectStartTime = function (data) {
                setMinDuration();
                $scope.warning.startTime = !isAppointmentTimeWithinServiceAvailability($scope.appointment.startTime);
                if (moment($scope.appointment.startTime, 'hh:mm a', true).isValid()) {
                    $scope.appointment.endTime = moment($scope.appointment.startTime, 'hh:mm a').add($scope.minDuration, 'm').format('hh:mm a');
                    $scope.onSelectEndTime();
                }
            };

            var isSelectedSlotOutOfRange = function () {
                if ($scope.appointment.startTime && !($scope.warning.appointmentDate || $scope.warning.startTime || $scope.warning.endTime)) {
                    return !isAppointmentStartTimeAndEndTimeWithinServiceAvailability();
                }
                return false;
            };

            $scope.onSelectEndTime = function (data) {
                $scope.warning.endTime = false;
                $scope.checkAvailability();
                $scope.warning.endTime = !isAppointmentTimeWithinServiceAvailability($scope.appointment.endTime);
                $scope.warning.outOfRange = isSelectedSlotOutOfRange();
            };

            var triggerSlotCalculation = function () {
                if ($scope.appointment &&
                    $scope.appointment.service &&
                    $scope.appointment.date &&
                    $scope.appointment.startTime &&
                    $scope.appointment.endTime &&
                    _.isEmpty($scope.selectedService.serviceTypes)
                ) {
                    getSlotsInfo();
                }
            };

            $scope.responseMap = function (data) {
                return _.map(data, function (patientInfo) {
                    patientInfo.label = patientInfo.givenName + (patientInfo.familyName ? " " + patientInfo.familyName : "") + " " + "(" + patientInfo.identifier + ")";
                    return patientInfo;
                });
            };

            var clearAvailabilityInfo = function () {
                $scope.warning.appointmentDate = false;
                $scope.warning.startTime = false;
                $scope.warning.endTime = false;
                $scope.warning.outOfRange = false;
                clearSlotsInfo();
            };

            $scope.onSpecialityChange = function () {
                if (!$scope.appointment.specialityUuid) {
                    delete $scope.appointment.specialityUuid;
                }
                delete $scope.selectedService;
                delete $scope.appointment.service;
                delete $scope.appointment.serviceType;
                delete $scope.appointment.location;
                clearAvailabilityInfo();
            };

            $scope.onServiceChange = function () {
                clearAvailabilityInfo();
                delete $scope.appointment.serviceType;
                delete $scope.weeklyAvailabilityOnSelectedDate;
                if ($scope.appointment.service) {
                    setServiceDetails($scope.appointment.service).then(function () {
                        $scope.onSelectStartTime();
                    });
                }
            };

            function setMinDuration () {
                $scope.minDuration = Bahmni.Appointments.Constants.minDurationForAppointment;
                $scope.minDuration = $scope.appointment.serviceType ? $scope.appointment.serviceType.duration || $scope.minDuration
                    : $scope.appointment.service ? $scope.appointment.service.durationMins || $scope.minDuration : $scope.minDuration;
            }

            $scope.onServiceTypeChange = function () {
                if ($scope.appointment.serviceType) {
                    setMinDuration();
                    clearAvailabilityInfo();
                    $scope.onSelectStartTime();
                }
            };

            var getWeeklyAvailabilityOnADate = function (date, weeklyAvailability) {
                var dayOfWeek = moment(date).format('dddd').toUpperCase();
                return _.filter(weeklyAvailability, function (o) {
                    return o.dayOfWeek === dayOfWeek;
                });
            };

            var setServiceAvailableTimesForADate = function (date) {
                $scope.allowedStartTime = $scope.selectedService.startTime || '12:00 am';
                $scope.allowedEndTime = $scope.selectedService.endTime || '11:59 pm';

                if ($scope.selectedService.weeklyAvailability && $scope.selectedService.weeklyAvailability.length > 0) {
                    $scope.weeklyAvailabilityOnSelectedDate = getWeeklyAvailabilityOnADate(date, $scope.selectedService.weeklyAvailability);
                    if ($scope.weeklyAvailabilityOnSelectedDate && $scope.weeklyAvailabilityOnSelectedDate.length === 0) {
                        $scope.allowedStartTime = undefined;
                        $scope.allowedEndTime = undefined;
                    }
                }
            };

            var isServiceAvailableOnWeekDate = function (dayOfWeek, weeklyAvailability) {
                return _.find(weeklyAvailability, function (wA) {
                    return wA.dayOfWeek === dayOfWeek;
                });
            };

            $scope.checkAvailability = function () {
                $scope.warning.appointmentDate = false;
                if (!$scope.isPastAppointment && $scope.selectedService && $scope.appointment.date) {
                    setServiceAvailableTimesForADate($scope.appointment.date);
                    var dayOfWeek = moment($scope.appointment.date).format('dddd').toUpperCase();
                    var allSlots;
                    if (!_.isEmpty($scope.selectedService.weeklyAvailability)) {
                        allSlots = getSlotsForWeeklyAvailability(dayOfWeek, $scope.selectedService.weeklyAvailability, $scope.minDuration);
                        $scope.warning.appointmentDate = !isServiceAvailableOnWeekDate(dayOfWeek, $scope.selectedService.weeklyAvailability);
                    } else {
                        allSlots = getAllSlots($scope.selectedService.startTime, $scope.selectedService.endTime, $scope.minDuration);
                    }
                    $scope.startTimes = allSlots.startTime;
                    $scope.endTimes = allSlots.endTime;
                    $scope.warning.endTime = !isAppointmentTimeWithinServiceAvailability($scope.appointment.endTime);
                    $scope.warning.startTime = !isAppointmentTimeWithinServiceAvailability($scope.appointment.startTime);
                    $scope.warning.outOfRange = isSelectedSlotOutOfRange();
                    triggerSlotCalculation();
                }
            };

            var setServiceDetails = function (service) {
                return appointmentsServiceService.getService(service.uuid).then(
                    function (response) {
                        $scope.selectedService = response.data;
                        $scope.appointment.location = _.find(appointmentCreateConfig.locations, {uuid: $scope.selectedService.location.uuid});
                        $scope.minDuration = response.data.durationMins || Bahmni.Appointments.Constants.minDurationForAppointment;
                    });
            };

            $scope.continueWithoutSaving = function () {
                $scope.showConfirmationPopUp = false;
                $state.go($scope.toStateConfig.toState, $scope.toStateConfig.toParams, {reload: true});
                ngDialog.close();
            };

            $scope.continueWithSaving = function () {
                saveAppointment($scope.validatedAppointment);
                ngDialog.close();
            };

            $scope.cancelTransition = function () {
                $scope.showConfirmationPopUp = true;
                ngDialog.close();
            };

            $scope.displayConfirmationDialog = function () {
                ngDialog.openConfirm({
                    template: 'views/admin/appointmentServiceNavigationConfirmation.html',
                    scope: $scope,
                    closeByEscape: true
                });
            };

            $scope.displayConflictConfirmationDialog = function () {
                ngDialog.openConfirm({
                    template: 'views/manage/appointmentConflictConfirmation.html',
                    scope: $scope,
                    closeByEscape: true
                });
            };

            $scope.$on("$destroy", function () {
                cleanUpListenerStateChangeStart();
            });

            var getSlotsForWeeklyAvailability = function (dayOfWeek, weeklyAvailability, durationInMin) {
                var slots = { startTime: [], endTime: [] };
                var dayAvailability = _.filter(weeklyAvailability, function (o) {
                    return o.dayOfWeek === dayOfWeek;
                });
                dayAvailability = _.sortBy(dayAvailability, 'startTime');
                _.each(dayAvailability, function (day) {
                    var allSlots = getAllSlots(day.startTime, day.endTime, durationInMin);

                    slots.startTime = _.concat(slots.startTime, allSlots.startTime);
                    slots.endTime = _.concat(slots.endTime, allSlots.endTime);
                });
                return slots;
            };

            var getAllSlots = function (startTimeString, endTimeString, durationInMin) {
                startTimeString = _.isEmpty(startTimeString) ? '00:00' : startTimeString;
                endTimeString = _.isEmpty(endTimeString) ? '23:59' : endTimeString;

                var startTime = getFormattedTime(startTimeString);
                var endTime = getFormattedTime(endTimeString);

                var result = [];
                var slots = { startTime: [], endTime: [] };
                var current = moment(startTime);

                while (current.valueOf() <= endTime.valueOf()) {
                    result.push(current.format('hh:mm a'));
                    current.add(durationInMin, 'minutes');
                }

                slots.startTime = _.slice(result, 0, result.length - 1);
                slots.endTime = _.slice(result, 1);

                return slots;
            };

            var getFormattedTime = function (time) {
                return moment(time, 'hh:mm a');
            };

            var isFormFilled = function () {
                return !_.every(_.values($scope.appointment), function (value) {
                    return !value;
                });
            };

            var cleanUpListenerStateChangeStart = $scope.$on('$stateChangeStart',
                function (event, toState, toParams, fromState, fromParams) {
                    if (isFormFilled() && $scope.showConfirmationPopUp) {
                        event.preventDefault();
                        ngDialog.close();
                        $scope.toStateConfig = {toState: toState, toParams: toParams};
                        $scope.displayConfirmationDialog();
                    }
                }
            );

            var newAppointmentStartingEndingBeforeExistingAppointment = function (existingStart, newStart, newEnd) {
                return newEnd <= existingStart;
            };

            var newAppointmentStartingEndingAfterExistingAppointment = function (newStart, existingStart, existingEnd) {
                return newStart >= existingEnd;
            };

            var isNewAppointmentConflictingWithExistingAppointment = function (existingAppointment, newAppointment) {
                var existingStart = moment(existingAppointment.startDateTime),
                    existingEnd = moment(existingAppointment.endDateTime);
                var newStart = moment(newAppointment.startDateTime),
                    newEnd = moment(newAppointment.endDateTime);
                return !(newAppointmentStartingEndingBeforeExistingAppointment(existingStart, newStart, newEnd) ||
                    newAppointmentStartingEndingAfterExistingAppointment(newStart, existingStart, existingEnd));
            };

            var checkForConflict = function (existingAppointment, newAppointment) {
                var isOnSameDay = moment(existingAppointment.startDateTime).diff(moment(newAppointment.startDateTime), 'days') === 0;
                var isAppointmentTimingConflicted = isNewAppointmentConflictingWithExistingAppointment(existingAppointment, newAppointment);
                return existingAppointment.uuid !== newAppointment.uuid &&
                    existingAppointment.status !== 'Cancelled' &&
                    isOnSameDay && isAppointmentTimingConflicted;
            };

            var getConflictingAppointments = function (appointment) {
                return _.filter($scope.patientAppointments, function (bookedAppointment) {
                    return checkForConflict(bookedAppointment, appointment);
                });
            };

            var saveAppointment = function (appointment) {
                return spinner.forPromise(appointmentsService.save(appointment).then(function () {
                    messagingService.showMessage('info', 'APPOINTMENT_SAVE_SUCCESS');
                    $scope.showConfirmationPopUp = false;
                    var params = $state.params;
                    params.viewDate = moment($scope.appointment.date).startOf('day').toDate();
                    params.isFilterOpen = true;
                    params.isSearchEnabled = params.isSearchEnabled && $scope.isEditMode();
                    $state.go('^', params, {reload: true});
                }));
            };

            var wireAutocompleteEvents = function () {
                $("#endTimeID").bind('focus', function () {
                    $("#endTimeID").autocomplete("search");
                });
                var $startTimeID = $("#startTimeID");
                $startTimeID.bind('focus', function () {
                    $("#startTimeID").autocomplete("search");
                });
                $startTimeID.bind('focusout', function () {
                    $scope.onSelectStartTime();
                });
            };

            $scope.isEditMode = function () {
                return $scope.appointment.uuid;
            };

            $scope.isEditAllowed = function () {
                return $scope.isPastAppointment ? false : ($scope.appointment.status === 'Scheduled' || $scope.appointment.status === 'CheckedIn');
            };

            $scope.navigateToPreviousState = function () {
                $state.go('^', $state.params, {reload: true});
            };

            return init();
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentServiceController', ['$scope', '$q', 'spinner', '$state', 'appointmentsServiceService',
        'locationService', 'messagingService', 'specialityService', 'ngDialog', 'appService', 'appointmentServiceContext',
        'confirmBox',
        function ($scope, $q, spinner, $state, appointmentsServiceService, locationService,
                  messagingService, specialityService, ngDialog, appService, appointmentServiceContext, confirmBox) {
            $scope.showConfirmationPopUp = true;
            $scope.enableSpecialities = appService.getAppDescriptor().getConfigValue('enableSpecialities');
            $scope.enableServiceTypes = appService.getAppDescriptor().getConfigValue('enableServiceTypes');
            $scope.enableCalendarView = appService.getAppDescriptor().getConfigValue('enableCalendarView');
            $scope.colorsForAppointmentService = appService.getAppDescriptor().getConfigValue('colorsForAppointmentService');
            var serviceDetails = appointmentServiceContext ? appointmentServiceContext.service : {};
            $scope.service = Bahmni.Appointments.AppointmentServiceViewModel.createFromResponse(serviceDetails);
            $scope.service.color = $scope.service.color || $scope.colorsForAppointmentService && $scope.colorsForAppointmentService[0] || "#008000";

            var save = function () {
                clearValuesIfDisabledAndInvalid();
                if ($scope.createServiceForm.$invalid) {
                    messagingService.showMessage('error', 'INVALID_SERVICE_FORM_ERROR_MESSAGE');
                    return;
                }
                var service = Bahmni.Appointments.AppointmentService.createFromUIObject($scope.service);
                appointmentsServiceService.save(service).then(function () {
                    messagingService.showMessage('info', 'APPOINTMENT_SERVICE_SAVE_SUCCESS');
                    $scope.showConfirmationPopUp = false;
                    $state.go('home.admin.service');
                });
                ngDialog.close();
            };

            var clearValuesIfDisabledAndInvalid = function () {
                var form = $scope.createServiceForm;
                if (form.serviceTime.$invalid && $scope.hasWeeklyAvailability()) {
                    delete $scope.service.startTime;
                    delete $scope.service.endTime;
                    form.serviceTime.$setValidity('timeSequence', true);
                }
                if (form.serviceMaxLoad.$invalid && ($scope.hasWeeklyAvailability() || $scope.hasServiceTypes())) {
                    delete $scope.service.maxAppointmentsLimit;
                    form.serviceMaxLoad.$setValidity('min', true);
                }
                if (form.serviceMaxLoad.$invalid && ($scope.hasServiceTypes())) {
                    delete $scope.service.maxAppointmentsLimit;
                    form.serviceMaxLoad.$setValidity('min', true);
                }
            };

            $scope.hasWeeklyAvailability = function () {
                return ($scope.service.weeklyAvailability.length > 0);
            };

            $scope.hasServiceTypes = function () {
                return ($scope.service.serviceTypes.length > 0);
            };

            var isNew = function () {
                return !$scope.service.uuid;
            };

            $scope.confirmSave = function () {
                if (isNew()) {
                    save();
                    return;
                }
                var childScope = {};
                childScope.message = 'CONFIRM_EDIT_SERVICE_MESSAGE_KEY';
                childScope.cancel = cancelSave;
                childScope.ok = save;
                confirmBox({
                    scope: childScope,
                    actions: [{name: 'cancel', display: 'CANCEL_KEY'}, {name: 'ok', display: 'OK_KEY'}],
                    className: "ngdialog-theme-default delete-program-popup"
                });
            };

            var cancelSave = function (closeDialog) {
                closeDialog();
            };

            $scope.validateServiceName = function () {
                $scope.createServiceForm.name.$setValidity('uniqueServiceName', isServiceNameUnique($scope.service));
            };

            var isServiceNameUnique = function (service) {
                if (!service.name) {
                    return true;
                }
                return !$scope.services.some(function (existingService) {
                    var isConflictingName = existingService.name.toLowerCase() === service.name.toLowerCase();
                    return service.uuid ? isConflictingName && (service.uuid !== existingService.uuid) : isConflictingName;
                });
            };

            var initAppointmentLocations = function () {
                return locationService.getAllByTag('Appointment Location').then(function (response) {
                    $scope.locations = response.data.results;
                }
                );
            };

            var initSpecialities = function () {
                return specialityService.getAllSpecialities().then(function (response) {
                    $scope.specialities = response.data;
                });
            };

            var initServices = function () {
                return appointmentsServiceService.getAllServices().then(function (response) {
                    $scope.services = response.data;
                });
            };

            var init = function () {
                var promises = [];
                promises.push(initAppointmentLocations());
                promises.push(initServices());
                if ($scope.enableSpecialities) {
                    promises.push(initSpecialities());
                }
                return spinner.forPromise($q.all(promises));
            };

            $scope.continueWithoutSaving = function () {
                $scope.showConfirmationPopUp = false;
                $state.go($scope.toStateConfig.toState, $scope.toStateConfig.toParams);
                ngDialog.close();
            };

            $scope.cancelTransition = function () {
                $scope.showConfirmationPopUp = true;
                ngDialog.close();
            };

            $scope.displayConfirmationDialog = function () {
                ngDialog.openConfirm({
                    template: 'views/admin/appointmentServiceNavigationConfirmation.html',
                    scope: $scope,
                    closeByEscape: true
                });
            };

            var cleanUpListenerStateChangeStart = $scope.$on('$stateChangeStart',
                function (event, toState, toParams) {
                    if ($scope.showConfirmationPopUp) {
                        event.preventDefault();
                        ngDialog.close();
                        $scope.toStateConfig = {toState: toState, toParams: toParams};
                        $scope.displayConfirmationDialog();
                    }
                }
            );

            $scope.$on("$destroy", function () {
                cleanUpListenerStateChangeStart();
            });

            return init();
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentsDayCalendarController', ['$scope', '$rootScope', '$state', 'uiCalendarConfig', 'appService', 'calendarViewPopUp', 'checkinPopUp',
        function ($scope, $rootScope, $state, uiCalendarConfig, appService, calendarViewPopUp, checkinPopUp) {
            $scope.eventSources = [];
            var init = function () {
                $scope.events = $scope.appointments.events;
                $scope.alertOnEventClick = function (event, jsEvent, view) {
                    var checkinAppointment = function (patient, patientAppointment) {
                        checkinPopUp({
                            scope: {
                                patientAppointment: patientAppointment
                            },
                            className: "ngdialog-theme-default app-dialog-container"
                        });
                    };
                    calendarViewPopUp({
                        scope: {
                            appointments: event.appointments,
                            checkinAppointment: checkinAppointment,
                            enableCreateAppointment: isSelectable()
                        },
                        className: "ngdialog-theme-default delete-program-popup app-dialog-container"
                    });
                };

                $scope.alertOnDrop = function (event, delta, revertFunc, jsEvent, ui, view) {
                    $scope.alertMessage = ('Event Dropped to make dayDelta ' + delta);
                };

                $scope.alertOnResize = function (event, delta, revertFunc, jsEvent, ui, view) {
                    $scope.alertMessage = ('Event Resized to make dayDelta ' + delta);
                };

                $scope.addRemoveEventSource = function (sources, source) {
                    var canAdd = 0;
                    angular.forEach(sources, function (value, key) {
                        if (sources[key] === source) {
                            sources.splice(key, 1);
                            canAdd = 1;
                        }
                    });
                    if (canAdd === 0) {
                        sources.push(source);
                    }
                };

                $scope.remove = function (index) {
                    $scope.events.splice(index, 1);
                };

                $scope.changeView = function (view, calendar) {
                    uiCalendarConfig.calendars[calendar].fullCalendar('changeView', view);
                };

                var isUserPrivilegedToCreateAppointment = function () {
                    return _.find($rootScope.currentUser.privileges, function (privilege) {
                        return privilege.name === Bahmni.Appointments.Constants.privilegeManageAppointments;
                    });
                };

                $scope.createAppointment = function (start, end, jsEvent, view, resource) {
                    if (!isUserPrivilegedToCreateAppointment()) {
                        return;
                    }
                    var params = $state.params;
                    params.appointment = {startDateTime: start,
                        endDateTime: end,
                        appointmentKind: 'Scheduled',
                        provider: resource && resource.provider
                    };
                    $state.go('home.manage.appointments.calendar.new', params, {reload: false});
                };

                var isSelectable = function () {
                    return !(Bahmni.Common.Util.DateUtil.isBeforeDate($scope.date, moment().startOf('day')));
                };

                $scope.uiConfig = {
                    calendar: {
                        height: document.getElementsByClassName('app-calendar-container')[0].clientHeight,
                        editable: false,
                        defaultDate: $scope.date,
                        header: false,
                        timezone: 'local',
                        defaultView: 'agendaDay',
                        resources: $scope.appointments.resources,
                        businessHours: {
                            start: appService.getAppDescriptor().getConfigValue('startOfDay') || Bahmni.Appointments.Constants.defaultCalendarStartTime,
                            end: appService.getAppDescriptor().getConfigValue('endOfDay') || Bahmni.Appointments.Constants.defaultCalendarEndTime
                        },
                        scrollTime: appService.getAppDescriptor().getConfigValue('startOfDay') || Bahmni.Appointments.Constants.defaultCalendarStartTime,
                        groupByResource: true,
                        selectable: isSelectable(),
                        select: $scope.createAppointment,
                        slotLabelInterval: appService.getAppDescriptor().getConfigValue('calendarSlotLabelInterval') || Bahmni.Appointments.Constants.defaultCalendarSlotLabelInterval,
                        slotDuration: appService.getAppDescriptor().getConfigValue('calendarSlotDuration') || Bahmni.Appointments.Constants.defaultCalendarSlotDuration,
                        eventLimit: true,
                        allDaySlot: false,
                        allDayDefault: false,
                        eventClick: $scope.alertOnEventClick,
                        eventDrop: $scope.alertOnDrop,
                        eventResize: $scope.alertOnResize,
                        eventRender: $scope.eventRender,
                        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source'
                    }
                };

                $scope.eventSources = [$scope.events];
            };

            var resetEvents = function () {
                if (!_.isEmpty($scope.eventSources)) {
                    $scope.eventSources.splice(0, $scope.eventSources.length);
                }
                if (!_.isEmpty($scope.appointments.events)) {
                    $scope.eventSources.push($scope.appointments.events);
                }
                $scope.uiConfig.calendar.resources = $scope.appointments.resources;
            };

            $scope.$watch("appointments", function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    resetEvents();
                }
            });
            init();
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AllAppointmentsController', ['$scope', '$state', 'appService', '$rootScope',
        function ($scope, $state, appService, $rootScope) {
            $scope.enableCalendarView = appService.getAppDescriptor().getConfigValue('enableCalendarView');
            $scope.isSearchEnabled = false;
            $scope.manageAppointmentPrivilege = Bahmni.Appointments.Constants.privilegeManageAppointments;

            $scope.navigateTo = function (viewName) {
                $scope.currentTab = viewName;
                var path = 'home.manage.appointments.' + viewName;
                $state.params.appointmentsData = $rootScope.appointmentsData;
                $state.go(path, $state.params, {reload: false});
            };

            $scope.getCurrentAppointmentTabName = function () {
                return $state.current.tabName;
            };

            $scope.$watch(function () {
                return $state.params.isSearchEnabled;
            }, function (isSearchEnabled) {
                $scope.isSearchEnabled = isSearchEnabled;
            }, true);
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentsCalendarViewController', ['$scope', '$state', '$translate', 'spinner', 'appointmentsService', 'appointmentsFilter', '$rootScope',
        function ($scope, $state, $translate, spinner, appointmentsService, appointmentsFilter, $rootScope) {
            var init = function () {
                $scope.startDate = $state.params.viewDate || moment().startOf('day').toDate();
                $scope.$on('filterClosedOpen', function (event, args) {
                    $scope.isFilterOpen = args.filterViewStatus;
                });
                $scope.isFilterOpen = $state.params.isFilterOpen;
            };

            var parseAppointments = function (allAppointments) {
                if (allAppointments) {
                    var appointments = allAppointments.filter(function (appointment) {
                        return appointment.status !== 'Cancelled';
                    });
                    var resources = _.chain(appointments)
                        .filter(function (appointment) {
                            return !_.isEmpty(appointment.provider);
                        }).map(function (appointment) {
                            return appointment.provider;
                        }).uniqBy('name')
                        .map(function (provider) {
                            return {id: provider.name, title: provider.name, provider: provider};
                        }).sortBy(function (provider) {
                            return provider.id && provider.id.toLowerCase();
                        })
                        .value();

                    var hasAppointmentsWithNoProvidersSpecified = _.find(appointments, function (appointment) {
                        return _.isEmpty(appointment.provider);
                    });

                    if (hasAppointmentsWithNoProvidersSpecified) {
                        resources.push({
                            id: $translate.instant("NO_PROVIDER_COLUMN_KEY"),
                            title: $translate.instant("NO_PROVIDER_COLUMN_KEY"),
                            provider: {name: $translate.instant("NO_PROVIDER_COLUMN_KEY"), display: $translate.instant("NO_PROVIDER_COLUMN_KEY"), uuid: 'no-provider-uuid'}
                        });
                    }

                    var events = [];
                    appointments.reduce(function (result, appointment) {
                        var event = {};
                        event.resourceId = appointment.provider ? appointment.provider.name : $translate.instant("NO_PROVIDER_COLUMN_KEY");
                        event.start = appointment.startDateTime;
                        event.end = appointment.endDateTime;
                        event.color = appointment.service.color;
                        event.serviceName = appointment.service.name;
                        var existingEvent = _.find(result, event);
                        var patientName = appointment.patient.name + " (" + appointment.patient.identifier + ")";
                        var isBedAssigned = appointment.additionalInfo && appointment.additionalInfo.BED_NUMBER_KEY;
                        if (existingEvent) {
                            existingEvent.title = [existingEvent.title, patientName].join(', ');
                            existingEvent.className = 'appointmentIcons multiplePatients' + (isBedAssigned ? ' bed-accom' : '');
                            existingEvent.appointments.push(appointment);
                        } else {
                            event.title = patientName;
                            event.className = 'appointmentIcons ' + appointment.status + (isBedAssigned ? ' bed-accom' : '');
                            event.appointments = [];
                            event.appointments.push(appointment);
                            result.push(event);
                        }
                        return result;
                    }, events);

                    $scope.providerAppointments = {resources: resources, events: events};
                    $scope.shouldReload = true;
                }
            };

            $scope.$watch(function () {
                return $state.params.filterParams;
            }, function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    var filteredAppointments = appointmentsFilter($scope.allAppointmentsForDay || $state.params.appointmentsData, $state.params.filterParams);
                    if (filteredAppointments) {
                        parseAppointments(filteredAppointments);
                    }
                }
            }, true);

            $scope.getAppointmentsForDate = function (viewDate) {
                $state.params.viewDate = viewDate;
                $scope.shouldReload = false;
                var params = {forDate: viewDate};
                $scope.$on('$stateChangeStart', function (event, toState, toParams) {
                    if (toState.tabName == 'list') {
                        toParams.doFetchAppointmentsData = false;
                    }
                });
                if ($state.params.doFetchAppointmentsData) {
                    return spinner.forPromise(appointmentsService.getAllAppointments(params).then(function (response) {
                        $scope.allAppointmentsForDay = response.data;
                        var filteredAppointments = appointmentsFilter($scope.allAppointmentsForDay, $state.params.filterParams);
                        $rootScope.appointmentsData = filteredAppointments;
                        return parseAppointments(filteredAppointments);
                    }));
                } else {
                    var filteredAppointments = appointmentsFilter($state.params.appointmentsData, $state.params.filterParams);
                    $state.params.doFetchAppointmentsData = true;
                    return parseAppointments(filteredAppointments);
                }
            };

            $scope.hasNoAppointments = function () {
                return _.isEmpty($scope.providerAppointments) || _.isEmpty($scope.providerAppointments.events);
            };
            return init();
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentsListViewController', ['$scope', '$state', '$rootScope', '$translate', '$stateParams', 'spinner',
        'appointmentsService', 'appService', 'appointmentsFilter', 'printer', 'checkinPopUp', 'confirmBox', 'ngDialog', 'messagingService',
        function ($scope, $state, $rootScope, $translate, $stateParams, spinner, appointmentsService, appService,
                  appointmentsFilter, printer, checkinPopUp, confirmBox, ngDialog, messagingService) {
            $scope.enableSpecialities = appService.getAppDescriptor().getConfigValue('enableSpecialities');
            $scope.enableServiceTypes = appService.getAppDescriptor().getConfigValue('enableServiceTypes');
            $scope.allowedActions = appService.getAppDescriptor().getConfigValue('allowedActions') || [];
            $scope.allowedActionsByStatus = appService.getAppDescriptor().getConfigValue('allowedActionsByStatus') || {};
            $scope.colorsForListView = appService.getAppDescriptor().getConfigValue('colorsForListView') || {};
            $scope.manageAppointmentPrivilege = Bahmni.Appointments.Constants.privilegeManageAppointments;
            $scope.searchedPatient = false;
            var oldPatientData = [];
            $scope.$on('filterClosedOpen', function (event, args) {
                $scope.isFilterOpen = args.filterViewStatus;
            });
            $scope.tableInfo = [{heading: 'APPOINTMENT_PATIENT_ID', sortInfo: 'patient.identifier', enable: true},
                {heading: 'APPOINTMENT_PATIENT_NAME', sortInfo: 'patient.name', class: true, enable: true},
                {heading: 'APPOINTMENT_DATE', sortInfo: 'date', enable: true},
                {heading: 'APPOINTMENT_START_TIME_KEY', sortInfo: 'startDateTime', enable: true},
                {heading: 'APPOINTMENT_END_TIME_KEY', sortInfo: 'endDateTime', enable: true},
                {heading: 'APPOINTMENT_PROVIDER', sortInfo: 'provider.name', class: true, enable: true},
                {heading: 'APPOINTMENT_SERVICE_SPECIALITY_KEY', sortInfo: 'service.speciality.name', enable: $scope.enableSpecialities},
                {heading: 'APPOINTMENT_SERVICE', sortInfo: 'service.name', class: true, enable: true},
                {heading: 'APPOINTMENT_SERVICE_TYPE_FULL', sortInfo: 'serviceType.name', class: true, enable: $scope.enableServiceTypes},
                {heading: 'APPOINTMENT_STATUS', sortInfo: 'status', enable: true},
                {heading: 'APPOINTMENT_WALK_IN', sortInfo: 'appointmentKind', enable: true},
                {heading: 'APPOINTMENT_SERVICE_LOCATION_KEY', sortInfo: 'location.name', class: true, enable: true},
                {heading: 'APPOINTMENT_ADDITIONAL_INFO', sortInfo: 'additionalInfo', class: true, enable: true},
                {heading: 'APPOINTMENT_CREATE_NOTES', sortInfo: 'comments', enable: true}];
            var init = function () {
                $scope.searchedPatient = $stateParams.isSearchEnabled && $stateParams.patient;
                $scope.startDate = $stateParams.viewDate || moment().startOf('day').toDate();
                $scope.isFilterOpen = $stateParams.isFilterOpen;
            };

            $scope.getAppointmentsForDate = function (viewDate) {
                $stateParams.viewDate = viewDate;
                $scope.selectedAppointment = undefined;
                var params = {forDate: viewDate};
                $scope.$on('$stateChangeStart', function (event, toState, toParams) {
                    if (toState.tabName == 'calendar') {
                        toParams.doFetchAppointmentsData = false;
                    }
                });
                if ($state.params.doFetchAppointmentsData) {
                    spinner.forPromise(appointmentsService.getAllAppointments(params).then(function (response) {
                        $scope.appointments = response.data;
                        $scope.filteredAppointments = appointmentsFilter($scope.appointments, $stateParams.filterParams);
                        $rootScope.appointmentsData = $scope.filteredAppointments;
                    }));
                } else {
                    $scope.filteredAppointments = appointmentsFilter($state.params.appointmentsData, $stateParams.filterParams);
                    $state.params.doFetchAppointmentsData = true;
                }
            };

            $scope.displaySearchedPatient = function (appointments) {
                oldPatientData = $scope.filteredAppointments;
                $scope.filteredAppointments = appointments.map(function (appointmet) {
                    appointmet.date = appointmet.startDateTime;
                    return appointmet;
                });
                $scope.searchedPatient = true;
                $stateParams.isFilterOpen = false;
                $scope.isFilterOpen = false;
                $stateParams.isSearchEnabled = true;
            };

            $scope.hasNoAppointments = function () {
                return _.isEmpty($scope.filteredAppointments);
            };

            $scope.goBackToPreviousView = function () {
                $scope.searchedPatient = false;
                $scope.filteredAppointments = oldPatientData;
                $stateParams.isFilterOpen = true;
                $scope.isFilterOpen = true;
                $stateParams.isSearchEnabled = false;
            };

            $scope.isSelected = function (appointment) {
                return $scope.selectedAppointment === appointment;
            };

            $scope.select = function (appointment) {
                if ($scope.isSelected(appointment)) {
                    $scope.selectedAppointment = undefined;
                    return;
                }
                $scope.selectedAppointment = appointment;
            };

            $scope.isWalkIn = function (appointmentType) {
                return appointmentType === 'WalkIn' ? 'Yes' : 'No';
            };

            $scope.editAppointment = function () {
                var params = $stateParams;
                params.uuid = $scope.selectedAppointment.uuid;
                $state.go('home.manage.appointments.list.edit', params);
            };

            $scope.checkinAppointment = function () {
                var scope = $rootScope.$new();
                scope.message = $translate.instant('APPOINTMENT_STATUS_CHANGE_CONFIRM_MESSAGE', {
                    toStatus: 'CheckedIn'
                });
                scope.action = _.partial(changeStatus, 'CheckedIn', _);
                checkinPopUp({
                    scope: scope,
                    className: "ngdialog-theme-default app-dialog-container"
                });
            };

            $scope.$watch(function () {
                return $stateParams.filterParams;
            }, function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $scope.filteredAppointments = appointmentsFilter($scope.appointments || $state.params.appointmentsData, $stateParams.filterParams);
                }
            }, true);

            $scope.sortAppointmentsBy = function (sortColumn) {
                if (sortColumn === 'additionalInfo') {
                    $scope.filteredAppointments = $scope.filteredAppointments.map(function (appointment) {
                        appointment.additionalInformation = $scope.display(_.get(appointment, sortColumn));
                        return appointment;
                    });
                    sortColumn = "additionalInformation";
                }
                var emptyObjects = _.filter($scope.filteredAppointments, function (appointment) {
                    return !_.property(sortColumn)(appointment);
                });
                var nonEmptyObjects = _.difference($scope.filteredAppointments, emptyObjects);
                var sortedNonEmptyObjects = _.sortBy(nonEmptyObjects, function (appointment) {
                    if (angular.isNumber(_.get(appointment, sortColumn))) {
                        return _.get(appointment, sortColumn);
                    }
                    return _.get(appointment, sortColumn).toLowerCase();
                });
                if ($scope.reverseSort) {
                    sortedNonEmptyObjects.reverse();
                }
                $scope.filteredAppointments = sortedNonEmptyObjects.concat(emptyObjects);
                $scope.sortColumn = sortColumn;
                $scope.reverseSort = !$scope.reverseSort;
            };

            $scope.printPage = function () {
                var printTemplateUrl = appService.getAppDescriptor().getConfigValue("printListViewTemplateUrl") || 'views/manage/list/listView.html';
                printer.print(printTemplateUrl, {
                    searchedPatient: $scope.searchedPatient,
                    filteredAppointments: $scope.filteredAppointments,
                    startDate: $stateParams.viewDate,
                    enableServiceTypes: $scope.enableServiceTypes,
                    enableSpecialities: $scope.enableSpecialities
                });
            };

            $scope.undoCheckIn = function () {
                var undoCheckIn = function (closeConfirmBox) {
                    return appointmentsService.undoCheckIn($scope.selectedAppointment.uuid).then(function (response) {
                        ngDialog.close();
                        $scope.selectedAppointment.status = response.data.status;
                        var message = $translate.instant('APPOINTMENT_STATUS_CHANGE_SUCCESS_MESSAGE', {
                            toStatus: response.data.status
                        });
                        closeConfirmBox();
                        messagingService.showMessage('info', message);
                    });
                };

                var scope = {};
                scope.message = $translate.instant('APPOINTMENT_UNDO_CHECKIN_CONFIRM_MESSAGE');
                scope.yes = undoCheckIn;
                showPopUp(scope);
            };

            var changeStatus = function (toStatus, onDate, closeConfirmBox) {
                var message = $translate.instant('APPOINTMENT_STATUS_CHANGE_SUCCESS_MESSAGE', {
                    toStatus: toStatus
                });
                return appointmentsService.changeStatus($scope.selectedAppointment.uuid, toStatus, onDate).then(function (response) {
                    ngDialog.close();
                    $scope.selectedAppointment.status = response.data.status;
                    closeConfirmBox();
                    messagingService.showMessage('info', message);
                });
            };

            $scope.confirmAction = function (toStatus) {
                var scope = {};
                scope.message = $translate.instant('APPOINTMENT_STATUS_CHANGE_CONFIRM_MESSAGE', {
                    toStatus: toStatus
                });
                scope.yes = _.partial(changeStatus, toStatus, undefined, _);
                showPopUp(scope);
            };

            $scope.display = function (jsonObj) {
                jsonObj = _.mapKeys(jsonObj, function (value, key) {
                    return $translate.instant(key);
                });
                return JSON.stringify(jsonObj || '').replace(/[{\"}]/g, "").replace(/[,]/g, ",\t");
            };

            var showPopUp = function (popUpScope) {
                popUpScope.no = function (closeConfirmBox) {
                    closeConfirmBox();
                };
                confirmBox({
                    scope: popUpScope,
                    actions: [{name: 'yes', display: 'YES_KEY'}, {name: 'no', display: 'NO_KEY'}],
                    className: "ngdialog-theme-default"
                });
            };

            $scope.isAllowedAction = function (action) {
                return _.includes($scope.allowedActions, action);
            };

            $scope.isValidAction = function (action) {
                if (!$scope.selectedAppointment) {
                    return false;
                }
                var status = $scope.selectedAppointment.status;
                var allowedActions = $scope.allowedActionsByStatus.hasOwnProperty(status) ? $scope.allowedActionsByStatus[status] : [];
                return _.includes(allowedActions, action);
            };

            init();
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentsSummaryController', ['$scope', '$state', '$window', 'spinner', 'appointmentsService', 'appService',
        function ($scope, $state, $window, spinner, appointmentsService, appService) {
            var init = function () {
                $scope.viewDate = $state.params.viewDate || moment().startOf('day').toDate();
                $scope.weekStartDate = moment($scope.viewDate).startOf('week').toDate();
                $scope.weekEndDate = moment($scope.viewDate).endOf('week').toDate();
                $scope.weekStart = appService.getAppDescriptor().getConfigValue('weekStart');
                $scope.getAppointmentsSummaryForAWeek($scope.weekStartDate, $scope.weekEndDate);
            };

            $scope.getAppointmentsSummaryForAWeek = function (startDate, endDate) {
                $scope.weekStartDate = startDate;
                $scope.weekEndDate = endDate;
                var params = {
                    startDate: startDate,
                    endDate: endDate
                };
                spinner.forPromise(appointmentsService.getAppointmentsSummary(params).then(function (response) {
                    $scope.appointments = response.data;
                    setWeekDatesInfo();
                }));
            };

            $scope.goToListView = function (date, service) {
                var params = {
                    viewDate: moment(date).toDate(),
                    filterParams: {statusList: _.without(Bahmni.Appointments.Constants.appointmentStatusList, "Cancelled")}
                };
                if (!_.isUndefined(service)) {
                    params.filterParams.serviceUuids = [service.uuid];
                }
                $state.go('home.manage.appointments.list', params);
            };

            $scope.isCurrentDate = function (date) {
                return moment(date).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD');
            };

            var setWeekDatesInfo = function () {
                $scope.weekDatesInfo = [];
                for (var i = $scope.weekStartDate;
                     Bahmni.Common.Util.DateUtil.isBeforeDate(i, $scope.weekEndDate);
                     i = Bahmni.Common.Util.DateUtil.addDays(i, 1)) {
                    var weekDate = {date: moment(i).format("YYYY-MM-DD")};
                    weekDate.total = _.reduce($scope.appointments, function (total, appointment) {
                        var appointmentCount = appointment.appointmentCountMap[weekDate.date];
                        if (!appointmentCount) {
                            return total;
                        }
                        return {
                            all: appointmentCount.allAppointmentsCount + total.all,
                            missed: appointmentCount.missedAppointmentsCount + total.missed
                        };
                    }, {all: 0, missed: 0});
                    $scope.weekDatesInfo.push(weekDate);
                }
            };

            return init();
        }]);

'use strict';

angular.module('bahmni.appointments')
    .controller('AppointmentsFilterController', ['$scope', '$state', '$rootScope', '$q', '$translate', 'appointmentsServiceService', 'spinner', 'ivhTreeviewMgr', 'providerService', 'appService',
        function ($scope, $state, $rootScope, $q, $translate, appointmentsServiceService, spinner, ivhTreeviewMgr, providerService, appService) {
            var init = function () {
                $scope.isSpecialityEnabled = appService.getAppDescriptor().getConfigValue('enableSpecialities');
                $scope.isServiceTypeEnabled = appService.getAppDescriptor().getConfigValue('enableServiceTypes');
                $scope.isFilterOpen = $state.params.isFilterOpen;
                $scope.isSearchEnabled = $state.params.isSearchEnabled;
                $scope.statusList = _.map(Bahmni.Appointments.Constants.appointmentStatusList, function (status) {
                    return {name: status, value: status};
                });
                $scope.selectedStatusList = _.filter($scope.statusList, function (status) {
                    return _.includes($state.params.filterParams.statusList, status.value);
                });

                if ($state.current.tabName === "calendar") {
                    $scope.statusList = _.filter($scope.statusList, function (status) {
                        return status.name !== "Cancelled";
                    });
                }
                var params = {v: "custom:(display,person,uuid,retired,attributes:(attributeType:(display),value,voided))"};

                spinner.forPromise($q.all([appointmentsServiceService.getAllServicesWithServiceTypes(), providerService.list(params)]).then(function (response) {
                    $scope.providers = _.filter(response[1].data.results, function (provider) {
                        return _.find(provider.attributes, function (attribute) {
                            return !attribute.voided && !provider.retired && attribute.value && attribute.attributeType.display === Bahmni.Appointments.Constants.availableForAppointments;
                        });
                    }).map(function (provider) {
                        provider.name = provider.person.display;
                        return provider;
                    });
                    $scope.providers.push({
                        name: $translate.instant("NO_PROVIDER_COLUMN_KEY"),
                        display: $translate.instant("NO_PROVIDER_COLUMN_KEY"),
                        uuid: 'no-provider-uuid'
                    });

                    if ($scope.isSpecialityEnabled) {
                        $scope.specialities = _.groupBy(response[0].data, function (service) {
                            return service.speciality.name || $translate.instant("NO_SPECIALITY_KEY");
                        });
                        $scope.selectedSpecialities = _.map($scope.specialities, function (speciality, key) {
                            return {
                                label: key,
                                id: speciality[0].speciality.uuid || "",
                                children: _.map(speciality, function (service) {
                                    return {
                                        label: service.name, id: service.uuid, color: service.color,
                                        children: !$scope.isServiceTypeEnabled ? [] : _.map(service.serviceTypes, function (serviceType) {
                                            return {
                                                label: serviceType.name + ' [' + serviceType.duration + ' ' + $translate.instant("PLACEHOLDER_SERVICE_TYPE_DURATION_MIN") + ']',
                                                id: serviceType.uuid
                                            };
                                        })
                                    };
                                })
                            };
                        });
                    } else {
                        $scope.selectedSpecialities = _.map(response[0].data, function (service) {
                            return {
                                label: service.name, id: service.uuid, color: service.color,
                                children: !$scope.isServiceTypeEnabled ? [] : _.map(service.serviceTypes, function (serviceType) {
                                    return {
                                        label: serviceType.name + ' [' + serviceType.duration + ' ' + $translate.instant("PLACEHOLDER_SERVICE_TYPE_DURATION_MIN") + ']',
                                        id: serviceType.uuid
                                    };
                                })
                            };
                        });
                    }

                    $scope.selectedProviders = _.filter($scope.providers, function (provider) {
                        return _.includes($state.params.filterParams.providerUuids, provider.uuid);
                    });

                    if (!_.isEmpty($state.params.filterParams)) {
                        ivhTreeviewMgr.selectEach($scope.selectedSpecialities, $state.params.filterParams.serviceUuids);
                    }
                }));
            };

            $scope.filterSelected = function () {
                $scope.filterSelectedValues = $scope.showSelected ? {selected: true} : undefined;
            };

            $scope.expandFilter = function () {
                $state.params.isFilterOpen = true;
                $scope.isFilterOpen = $state.params.isFilterOpen;
                $rootScope.$broadcast("filterClosedOpen", {filterViewStatus: $scope.isFilterOpen});
            };

            $scope.minimizeFilter = function () {
                $state.params.isFilterOpen = false;
                $scope.isFilterOpen = $state.params.isFilterOpen;
                $rootScope.$broadcast("filterClosedOpen", {filterViewStatus: $scope.isFilterOpen});
            };
            var resetFilterParams = function () {
                $state.params.filterParams = {
                    serviceUuids: [],
                    serviceTypeUuids: [],
                    providerUuids: [],
                    statusList: []
                };
            };
            $scope.setSelectedSpecialities = function (selectedSpecialities) {
                $scope.selectedSpecialities = selectedSpecialities;
            };

            $scope.getCurrentAppointmentTabName = function () {
                return $state.current.tabName;
            };

            $scope.resetFilter = function () {
                if ($scope.selectedSpecialities) {
                    ivhTreeviewMgr.deselectAll($scope.selectedSpecialities, false);
                }
                $scope.selectedProviders = [];
                $scope.selectedStatusList = [];
                $scope.showSelected = false;
                $scope.filterSelectedValues = undefined;
                $scope.searchText = undefined;
                resetFilterParams();
            };

            $scope.resetSearchText = function () {
                $scope.searchText = undefined;
            };

            $scope.applyFilter = function () {
                resetFilterParams();
                if ($scope.isSpecialityEnabled) {
                    $state.params.filterParams.serviceUuids = _.reduce($scope.selectedSpecialities, function (accumulator, speciality) {
                        var serviceUuids = _.chain(speciality.children)
                            .filter(function (service) {
                                return service.selected;
                            }).map(function (service) {
                                return service.id;
                            }).value();
                        return serviceUuids.concat(accumulator);
                    }, []);

                    if ($scope.isServiceTypeEnabled) {
                        $state.params.filterParams.serviceTypeUuids = _.reduce($scope.selectedSpecialities, function (accumulator, speciality) {
                            var selectedServiceTypes = _.reduce(speciality.children, function (accumulator, service) {
                                var serviceTypesForService = [];
                                if (!service.selected) {
                                    serviceTypesForService = _.filter(service.children, function (serviceType) {
                                        return serviceType.selected;
                                    }).map(function (serviceType) {
                                        return serviceType.id;
                                    });
                                }
                                return serviceTypesForService.concat(accumulator);
                            }, []);
                            return selectedServiceTypes.concat(accumulator);
                        }, []);
                    } else {
                        $state.params.filterParams.serviceTypeUuids = [];
                    }
                } else {
                    $state.params.filterParams.serviceUuids = _.chain($scope.selectedSpecialities).filter(function (service) {
                        return service.selected;
                    }).map(function (service) {
                        return service.id;
                    }).value();

                    if ($scope.isServiceTypeEnabled) {
                        $state.params.filterParams.serviceTypeUuids = $scope.selectedSpecialities.filter(function (service) {
                            return !service.selected;
                        }).reduce(function (accumulator, service) {
                            return accumulator.concat(service.children);
                        }, []).filter(function (serviceType) {
                            return serviceType.selected;
                        }).reduce(function (accumulator, serviceType) {
                            return accumulator.concat(serviceType.id);
                        }, []);
                    } else {
                        $state.params.filterParams.serviceTypeUuids = [];
                    }
                }

                $state.params.filterParams.providerUuids = _.map($scope.selectedProviders, function (provider) {
                    return provider.uuid;
                });

                $state.params.filterParams.statusList = _.map($scope.selectedStatusList, function (status) {
                    return status.value;
                });
            };

            $scope.isFilterApplied = function () {
                return _.find($state.params.filterParams, function (filterParam) {
                    return !_.isEmpty(filterParam);
                });
            };
            $scope.$watch(function () {
                return $state.params.isFilterOpen;
            }, function (isFilterHidden) {
                $scope.isFilterOpen = isFilterHidden;
                $scope.isSearchEnabled = isFilterHidden;
            }, true);

            $scope.$watch(function () {
                return $state.params.isSearchEnabled;
            }, function (isSearchEnabled) {
                $scope.isSearchEnabled = isSearchEnabled;
            }, true);

            $scope.$watch(function () {
                return $state.current.tabName;
            }, function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if (newValue === "calendar") {
                        $scope.statusList = _.filter($scope.statusList, function (status) {
                            return status.name !== "Cancelled";
                        });
                        $scope.selectedStatusList = _.filter($scope.selectedStatusList, function (status) {
                            return status.name !== "Cancelled";
                        });
                    } else {
                        $scope.statusList = _.map(Bahmni.Appointments.Constants.appointmentStatusList, function (status) {
                            return {name: status, value: status};
                        });
                    }
                }
            }, true);
            init();
        }]);

'use strict';

angular.module('bahmni.appointments')
    .filter('appointments', [function () {
        var filterAppointmentsByService = function (appointments, serviceUuids) {
            return _.filter(appointments, function (appointment) {
                return appointment.service && _.includes(serviceUuids, appointment.service.uuid);
            });
        };

        var filterAppointmentsByServiceType = function (appointments, serviceTypeUuids) {
            return _.filter(appointments, function (appointment) {
                return appointment.serviceType && _.includes(serviceTypeUuids, appointment.serviceType.uuid);
            });
        };

        var filterAppointmentsByProviders = function (appointments, providerUuids) {
            if (_.isEmpty(providerUuids)) {
                return appointments;
            }
            return _.filter(appointments, function (appointment) {
                if (!appointment.provider) return _.includes(providerUuids, 'no-provider-uuid');
                return appointment.provider && _.includes(providerUuids, appointment.provider.uuid);
            });
        };

        var filterAppointmentsByStatus = function (appointments, statusList) {
            if (_.isEmpty(statusList)) {
                return appointments;
            }
            return _.filter(appointments, function (appointment) {
                return _.includes(statusList, appointment.status);
            });
        };

        return function (appointments, filters) {
            if (_.isEmpty(filters)) {
                return appointments;
            }
            if ((_.isEmpty(filters.serviceUuids) && _.isEmpty(filters.serviceTypeUuids))) {
                var appointmentsFilteredByProviders = filterAppointmentsByProviders(appointments, filters.providerUuids);
                return filterAppointmentsByStatus(appointmentsFilteredByProviders, filters.statusList);
            }
            var appointmentsFilteredByService = filterAppointmentsByService(appointments, filters.serviceUuids);
            var appointmentsFilteredByServiceType = filterAppointmentsByServiceType(appointments, filters.serviceTypeUuids);
            var appointmentsFilteredBySpeciality = appointmentsFilteredByService.concat(appointmentsFilteredByServiceType);
            var appointmentsFilteredByProviders = filterAppointmentsByProviders(appointmentsFilteredBySpeciality, filters.providerUuids);
            return filterAppointmentsByStatus(appointmentsFilteredByProviders, filters.statusList);
        };
    }]);
