'use strict';

angular.module('bahmni.clinical')
    .factory('sharedHealthRecordService', ['$http', '$rootScope', '$bahmniCookieStore', '$q', 'sharedHealthRecordServiceStrategy', 'sessionService', function ($http,
        $rootScope, $bahmniCookieStore, $q, sharedHealthRecordServiceStrategy, sessionService) {
        var search = function (patientUuid, patientIdentifier, fromDate, toDate, offset) {
            var config = {
                params: {
                    patientUuid: patientUuid,
                    patientIdentifier: patientIdentifier,
                    fromDate: fromDate,
                    toDate: toDate,
                    startIndex: offset || 0,
                    loginLocationUuid: sessionService.getLoginLocationUuid()
                },
                withCredentials: true
            };
            return sharedHealthRecordServiceStrategy.search(config);
        };

        var retriveAndImportDocument = function (documentId) {
            var config = {
                withCredentials: true
            };
            return sharedHealthRecordServiceStrategy.retriveAndImportDocument(documentId, config);
        };

        return {
            search: search,
            retriveAndImportDocument: retriveAndImportDocument
        };
    }]);