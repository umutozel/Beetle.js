"use strict";
var beetleCommon = {

    helper: {
        seed: function (serviceUri) {
            var deferred = Q.defer();

            $.post(serviceUri + '/Seed',
                function (data, textStatus, xhr) {
                    deferred.resolve(
                        "Seed svc returned '" + xhr.status + "' with message: " + data);
                })
                .error(function (xhr, textStatus, errorThrown) { deferred.reject(errorThrown); });

            return deferred.promise;
        },

        clear: function (serviceUri) {
            var deferred = Q.defer();

            $.post(serviceUri + '/Clear',
                function (data, textStatus, xhr) {
                    deferred.resolve(
                        "Reset svc returned '" + xhr.status + "' with message: " + data);
                })
                .error(function (xhr, textStatus, errorThrown) { deferred.reject(errorThrown); });

            return deferred.promise;
        },

        handleError: function (error) {
            if (error.handled === true) return;
            if (error.message)
                ok(false, error.message);
            else
                ok(false, "Failed: " + error.toString());
            start();
        },

        getUrlVars: function () {
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        }
    }
};
