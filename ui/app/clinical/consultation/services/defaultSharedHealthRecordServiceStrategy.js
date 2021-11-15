'use strict';

angular.module('bahmni.clinical')
    .service('sharedHealthRecordServiceStrategy', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
        var search = function (config) {
            var defer = $q.defer();
            var sharedHealthRecordUrl = Bahmni.Common.Constants.bahmniSharedHealthRecordUrl;

            var onResults = function (result) {
                defer.resolve(result);
            };

            $http.get(sharedHealthRecordUrl, config).success(onResults)
                .error(function (error) {
                    defer.reject(error);
                });
            return defer.promise;
        };

        var retriveAndViewObs = function (patient_id, config) {
            var defer = $q.defer();
            var importObsUrl = Bahmni.Common.Constants.bahmniSharedHealthRecordUrl + "/summary" + "?patient_identifier=" + patient_id;

            var onResults = function (result) {
                defer.resolve(result);
            };

            $http.get(importObsUrl, config).success(onResults)
                .error(function (error) {
                    defer.reject(error);
                });
            return defer.promise;
        };
		

        var retriveAndImportDocument = function (documentId, config) {
            var defer = $q.defer();
            var importDocumentUrl = Bahmni.Common.Constants.bahmniSharedHealthRecordUrl + "?documentId=" + documentId;

            var onResults = function (result) {
                defer.resolve(result);
            };

            $http.post(importDocumentUrl, config).success(onResults)
                .error(function (error) {
                    defer.reject(error);
                });
            return defer.promise;
        };

        return {
            search: search,
            retriveAndImportDocument: retriveAndImportDocument,
            retriveAndViewObs: retriveAndViewObs
        };
    }]);
