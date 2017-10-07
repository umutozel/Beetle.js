/**
 * Beetle module.
 * Using UMD pattern.
 * @module beetle
 */
(function (root, factory) {
    var deps = {
        jQuery: root.$,
        angularjs: root.angular,
        ko: root.ko,
        Q: root.Q
    };

    if (typeof exports === "object") {
        var node;
        try {
            var http = require("http");
            var https = require("https");
            node = { http, https };
        } catch (e) { }
        var angular;
        try {
            var aCore = require("@angular/core");
            var aHttp = require("@angular/http");

            var http = aCore.ReflectiveInjector.resolveAndCreate([
                aHttp.Http, aHttp.BrowserXhr,
                { provide: aHttp.ConnectionBackend, useClass: aHttp.XHRBackend },
                { provide: aHttp.RequestOptions, useClass: aHttp.BaseRequestOptions },
                { provide: aHttp.ResponseOptions, useClass: aHttp.BaseResponseOptions },
                { provide: aHttp.XSRFStrategy, useValue: new aHttp.CookieXSRFStrategy() }
            ]).get(aHttp.Http);
            angular = { http, Request: aHttp.Request, Headers: aHttp.Headers };
        } catch (e) { }

        module.exports = factory(root, deps.jQuery, deps.angularjs, deps.ko, deps.Q, node, angular);
        return module.exports;
    }
    else if (typeof define === "function" && define.amd) {
        var modules = [];
        for (var p in deps) {
            if (require.specified(p)) {
                modules.push(p);
            }
        }

        define(modules, function () {
            for (var i = 0; i < arguments.length; i++) {
                var mdl = arguments[i];
                if (mdl) deps[modules[i]] = mdl;
            }

            root.beetle = factory(root, deps.jQuery, deps.angularjs, deps.ko, deps.Q);
        });
    }
    else {
        root.beetle = factory(root, deps.jQuery, deps.angularjs, deps.ko, deps.Q);
        return root.beetle;
    }
})(this, function (root, $, angularjs, ko, Q, node, angular) {
    "use strict";

    /**
     * Helper functions. We are trying not to use ECMA 5, so we polyfill some methods.
     * @namespace helper
     */
    var helper = {
        /**
         * Creates an assert instance to work with, a shortcut.
         * @example
         * helper.assertPrm(prm, 'prm').isArray().check()
         * @param {any} value - The value of parameter.
         * @param {string} name - The name of the parameter.
         * @returns {Assert} Assert instance.
         */
        assertPrm: function (value, name) {
            return new Assert(value, name);
        },
        /**
         * Combines first object's properties with second object's properties on a new object.
         * @param {Object} obj1 - The first object.
         * @param {Object} obj2 - The second object.
         * @returns {Object} New object containing all properties from both objects.
         */
        combine: function (obj1, obj2) {
            if (obj1 == obj2) return obj1;
            var obj;
            if (obj1 != null) {
                obj = {};
                for (var p1 in obj1) {
                    obj[p1] = obj1[p1];
                }
            }
            if (obj2 != null) {
                obj = obj || {};
                for (var p2 in obj2) {
                    var v1 = obj[p2];
                    var v2 = obj2[p2];
                    var v = Assert.isTypeOf(v1, 'object') && Assert.isTypeOf(v2, 'object') ? helper.combine(v1, v2) : v2;
                    obj[p2] = v;
                }
            }
            return obj;
        },
        /**
         * Extends objMain with objExt's properties.
         * @param {Object} objMain - The main object.
         * @param {Object} objExt - Object to extend with.
         * @returns {Object} objMain is returned.
         */
        extend: function (objMain, objExt) {
            if (objMain != null && objExt != null) {
                for (var p in objExt) {
                    if (!objMain.hasOwnProperty(p))
                        objMain[p] = objExt[p];
                }
            }
            return objMain;
        },
        /**
         * Checks if the given two are equal. if parameters are both objects, recursively controls their properties too.
         * @param {Object} obj1 - The first object.
         * @param {Object} obj2 - The second object.
         * @returns {boolean} True when two objects are equal, otherwise false.
         */
        objEquals: function (obj1, obj2) {
            if (obj1 == obj2)
                return true;

            if (obj1 == null || obj2 == null)
                return false;

            if (Assert.isObject(obj1) && Assert.isObject(obj2)) {
                var count1 = 0;
                var count2 = 0;
                for (var p in obj1) {
                    if (!(p in obj2)) return false;
                    if (helper.getValue(obj1, p) != helper.getValue(obj2, p)) return false;
                    count1++;
                }
                for (var p2 in obj2) count2++;
                return count1 == count2;
            }

            return false;
        },
        /**
         * Returns string case option for current operation context.
         * @param {StringOptions} options - String options for the context.
         * @returns {boolean} True when given options' isCaseSensitive is true (or null and global options' isCaseSensitive is true), otherwise false.
         */
        isCaseSensitive: function (options) {
            var isCaseSensitive = options && options.isCaseSensitive;
            return isCaseSensitive == null ? settings.isCaseSensitive : isCaseSensitive;
        },
        /**
         * Returns whitespace ignore option for current operation context.
         * @param {StringOptions} options - String options for the context.
         * @returns {boolean} True when given options' ignoreWhiteSpaces is true (or null and global options' ignoreWhiteSpaces is true), otherwise false.
         */
        ignoreWhiteSpaces: function (options) {
            var ignoreWhiteSpaces = options && options.ignoreWhiteSpaces;
            return ignoreWhiteSpaces == null ? settings.ignoreWhiteSpaces : ignoreWhiteSpaces;
        },
        /**
         * Applies current operation context string options to given parameter.
         * @param {StringOptions} options - String options for the context.
         * @returns {string} Modified string (using the options).
         */
        handleStrOptions: function (str, options) {
            if (str == null || typeof str !== "string") return str;
            if (!helper.isCaseSensitive(options)) {
                str = str.replace("İ", "i");
                str = str.toLowerCase();
                str = str.replace("ı", "i");
            }
            return helper.ignoreWhiteSpaces(options) ? str.trim() : str;
        },
        /**
         * Compares two objects. Uses given options when necessary.
         * @param {Object} obj1 - The first object.
         * @param {Object} obj2 - The second object.
         * @param {bool} isStrict - Use strict comparing (===).
         * @param {StringOptions} options - String options for the context.
         * @returns {boolean} True when two values are equal (options will be used for string values).
         */
        equals: function (obj1, obj2, isStrict, options) {
            if (typeof obj1 === 'string' && typeof obj2 === 'string') {
                obj1 = helper.handleStrOptions(obj1, options);
                obj2 = helper.handleStrOptions(obj2, options);
            }

            if (obj1 != null && obj2 != null && core.dataTypes.date.isValid(obj1) && core.dataTypes.date.isValid(obj2)) {
                obj1 = obj1.valueOf();
                obj2 = obj2.valueOf();
            }

            return isStrict ? obj1 === obj2 : obj1 == obj2;
        },
        /**
         * Format string using given arguments. %1 and {1} format can be used for placeholders.
         * @param {string} string - String to format.
         * @param {...string} params - Values to replace.
         * @returns {string} Formatted string.
         */
        formatString: function (string, params) {
            var args = arguments;
            var pattern1 = RegExp("%([0-" + (arguments.length - 1) + "])", "g");
            var pattern2 = RegExp("{([0-" + (arguments.length - 2) + "])}", "g");
            return string
                .replace(pattern1, function (match, index) {
                    return args[Number(index) + 1] || '';
                })
                .replace(pattern2, function (match, index) {
                    return args[Number(index) + 1] || '';
                });
        },
        /**
         * Finds the index of the given item in the array.
         * @param {any[]} array - Array to search.
         * @param {any} item - Item to find.
         * @param {number=} index - Start index.
         * @returns {number} Found index. If the item could not be found returns '-1'.
         */
        indexOf: function (array, item, index) {
            for (var i = index || 0; i < array.length; i++)
                if (array[i] === item) return i;
            return -1;
        },
        /**
         * Calls given callback with item and current index parameters for each item in the array.
         * @param {any[]} array - Array to iterate.
         * @param {forEachCallback} callback - Method to call for each item.
         */
        forEach: function (array, callback) {
            for (var i = 0; i < array.length; i++) {
                var obj = array[i];
                callback.call(null, obj, i);
            }
        },
        /**
         * Iterate objects properties and skips ones starting with '$'.
         * @param {Object} object - Object to iterate.
         * @param {forEachPropertyCallback} callback - Method to call for each property.
         */
        forEachProperty: function (object, callback) {
            for (var p in object) {
                if (p[0] == '$') continue;
                var v = object[p];
                if (Assert.isFunction(v)) continue;
                callback(p, v);
            }
        },
        /**
         * Finds given item in the array.
         * When property is given, looks item's property value, otherwise compares item's itself.
         * @param {any[]} array - Array to search.
         * @param {any} value - Value to find.
         * @param {string=} property - Property to look for the value.
         * @returns {any} When value is found; if property is provided, the array item containing the given value, otherwise value itself. When not found, null.
         */
        findInArray: function (array, value, property) {
            for (var i = 0; i < array.length; i++)
                if (property) {
                    if (array[i][property] === value) return array[i];
                } else if (array[i] === value) return value;
            return null;
        },
        /**
         * Copies array items that match the given conditions to another array and returns the new array.
         * @param {any[]} array - The array to filter.
         * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
         * @returns {any[]} New array with filtered items.
         */
        filterArray: function (array, predicate) {
            var retVal = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (predicate(item) === true)
                    retVal.push(item);
            }
            return retVal;
        },
        /**
         * Removes the item from given array.
         * @param {any[]} array - The array to remove item from.
         * @param {any} item - Item to remove.
         * @param {string=} property - Property to look for the value.
         * @returns {number[]} Removed item indexes.
         */
        removeFromArray: function (array, item, property) {
            var indexes = [];
            this.forEach(array, function (current, index) {
                if (property) {
                    if (current[property] === item) indexes.push(index);
                } else if (current === item) indexes.push(index);
            });
            for (var i = indexes.length - 1; i >= 0; i--)
                array.splice(indexes[i], 1);
            return indexes.length;
        },
        /**
         * Creates a new array with the results of calling the provided function on every element in the given array.
         * @param {any[]} array - The array to map.
         * @param {mapCallback} callback - Function that produces new element.
         * @returns {any[]} New array with mapped values.
         */
        mapArray: function (array, callback) {
            var retVal = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                retVal.push(callback.call(item, item, i));
            }
            return retVal;
        },
        /**
         * Creates a GUID string with "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" format.
         * @returns {string} Newly generated GUID.
         */
        createGuid: function () {
            
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        },
        /**
         * Creates string representation of given function with arrow syntax.
         * @param {function} func - The function.
         * @returns {string} Arrow style code for given function.
         */
        funcToLambda: function (func) {
            helper.assertPrm(func, "func").isFunction().check();

            var f = func.toString().replace(/function(.*?){/g, "$1=>").replace(/{|}|;|return /g, "").trim();

            var l1 = f.indexOf("=>");
            var p = f.substr(0, l1).trim();
            f = f.substr(l1 + 2).trim();

            var xs = f.split(",");
            var s = [];
            for (var i = 0; i < xs.length; i++) {
                var x = xs[i];
                var ps = x.split(":");
                if (ps.length > 1) {
                    s.push(ps[1].trim() + " as " + ps[0].trim());
                }
                else s.push(x.trim());
            }
            f = s.join(", ");

            return p ? (p + " => " + f) : f;
        },
        /**
         * Finds and returns function name. Works for ES6 classes too.
         * @param {function} func - The function (or class).
         * @returns {string} Name of the given function.
         */
        getFuncName: function (func) {
            var funcNameRegex = /function (.*?)[\s|\(]|class (.*?)\s|\{/;
            var results = funcNameRegex.exec(func.toString());
            return results[1] || results[2];
        },
        /**
         * Implements prototypal inheritance. Uses a "Function" instance to avoid unnecessary instantiations.
         * @param {function} derivedClass - Deriving type.
         * @param {function} baseClass - Base type.
         */
        inherit: function (derivedClass, baseClass) {
            var f = new Function();
            f.prototype = baseClass.prototype;

            derivedClass.prototype = new f();
            derivedClass.prototype.constructor = derivedClass;
            derivedClass.baseClass = baseClass.prototype;
        },
        /**
         * Reads property of value, used when we are not sure if property is observable.
         * @param {Object} object - Deriving type.
         * @param {string} property - Property path. Can be a chain like "address.city.name".
         * @returns {any} Value of property (undefined when a property cannot be found).
         */
        getValue: function (object, propertyPath) {
            if (object == null) return undefined;
            var op = settings.getObservableProvider();
            // split propertyPath path and read every items value
            var paths = propertyPath.trim().split('.');
            var retVal = object;
            for (var i = 0; i < paths.length; i++) {
                retVal = getValue(retVal, paths[i]);
                if (retVal == null) break;
            }
            return retVal;

            function getValue(o, p) {
                // get tracker
                var tracker = o.$tracker;
                // if o is an entity, get value from its tracker
                if (tracker)
                    return tracker.getValue(p);
                if (op.isObservable(o, p)) // if o's p is observable get value from default observable provider
                    return op.getValue(o, p);
                var value = o[p];
                return value; // if its not observable get value of p
            }
        },
        /**
         * Gets localized value for given name using "settings.localizeFunc" function.
         * @param {string} resourceName - Resource name.
         * @param {string} altValue - Alternative value to use when resource cannot be found.
         * @returns {string} Value for the given resource name.
         */
        getResourceValue: function (resourceName, altValue) {
            var localizeFunc = settings.getLocalizeFunction();
            return (localizeFunc && resourceName && localizeFunc(resourceName)) || altValue;
        },
        /**
         * Creates validation error object using given parameters.
         * @param {any} entity - Entity containing invalid value.
         * @param {any} value - Invalid value itself.
         * @param {string} property - Property containing invalid value.
         * @param {string} message - Validation message.
         * @param {Validator} validator - Validator instance.
         * @returns {Object} Validation error object.
         */
        createValidationError: function (entity, value, property, message, validator) {
            return { message: message, entity: entity, validator: validator, value: value, property: property };
        },
        /**
         * Creates error object by formatting provided message and populates with given object's values.
         * @param {string} message - Error message.
         * @param {string[]} arg1 - Message format arguments.
         * @param {Object=} arg2 - Extra informations, properties will be attached to error object.
         * @returns {Error} Error object.
         */
        createError: function (message, arg1, arg2) {
            var args = null, obj = arg2;
            if (Assert.isArray(arg1)) args = arg1;
            else if (Assert.isObject(arg1)) obj = arg1;

            if (args && args.length > 0) {
                args.splice(0, 0, message);
                message = helper.formatString.apply(null, args);
            }
            var retVal = new Error(message);
            if (obj) {
                for (var p in obj)
                    retVal[p] = obj[p];
            }
            events.error.notify(retVal);
            return retVal;
        },
        /**
         * Updates foreign keys of given navigation property with new values.
         * @param {any} entity - The entity.
         * @param {NavigationProperty} navProperty - The navigation property.
         * @param {Object} newValue - Value of the navigation property.
         */
        setForeignKeys: function (entity, navProperty, newValue) {
            for (var i = 0; i < navProperty.foreignKeyNames.length; i++) {
                // We get each related foreign key for this navigation property.
                var fk = navProperty.foreignKeyNames[i];
                var tracker = entity.$tracker;
                if (newValue) {
                    // When foreign key is built with more than one column, we presume foreign key-primary key order is same
                    // Example:
                    //  When we create an association between Product and Supplier using Name and Location fields
                    //  we presume Supplier's corresponding primary keys are in exactly same order.
                    var k = newValue.$tracker.entityType.keys[i];
                    var v = newValue.$tracker.getValue(k.name);
                    tracker.setValue(fk, v);
                } else {
                    var fkp = helper.findInArray(tracker.entityType.dataProperties, fk, 'name');
                    tracker.setValue(fk, fkp.getDefaultValue());
                }
            }
        },
        /**
         * Creates an array and overrides methods to provide callbacks on array changes.
         * @param {any[]} initial - Initial values for the array.
         * @param {Object} object - Owner object of the array.
         * @param {NavigationProperty} property - Navigation property metadata.
         * @param {arrayChangeCallback} after - Array change callback.
         * @returns {TrackableArray} Trackable array, an array with change events.
         */
        createTrackableArray: function (initial, object, property, after) {
            var array = initial || [];
            array.object = object;
            array.property = property;
            array.after = after;

            array.changing = new core.Event(property + "ArrayChanging", array);
            array.changed = new core.Event(property + "ArrayChanged", array);

            array.pop = function () {
                var items = [this[this.length - 1]];
                // call base method
                this.changing.notify({ added: [], removed: items });
                var retVal = Array.prototype.pop.call(this);
                this.after(this.object, this.property, this, items, null);
                this.changed.notify({ added: [], removed: items });
                return retVal;
            };

            array.push = function (items) {
                this.changing.notify({ added: arguments, removed: [] });
                beforeAdd(arguments, this);
                var retVal = Array.prototype.push.apply(this, arguments);
                this.after(this.object, this.property, this, null, arguments);
                this.changed.notify({ added: arguments, removed: [] });
                return retVal;
            };

            array.unshift = function (items) {
                this.changing.notify({ added: arguments, removed: [] });
                beforeAdd(arguments, this);
                var retVal = Array.prototype.unshift.apply(this, arguments);
                this.after(this.object, this.property, this, null, arguments);
                this.changed.notify({ added: arguments, removed: [] });
                return retVal;
            };

            array.shift = function () {
                var items = [this[0]];
                this.changing.notify({ added: [], removed: items });
                var retVal = Array.prototype.shift.call(this);
                this.after(this.object, this.property, this, items, null);
                this.changed.notify({ added: [], removed: items });
                return retVal;
            };

            array.splice = function (start, count) {
                count = count || this.length;
                var addedItems = null;
                if (arguments.length > 2)
                    addedItems = Array.prototype.slice.call(arguments).slice(2); // convert arguments to array then slice
                var removedItems = this.slice(start, start + count);
                this.changing.notify({ added: addedItems, removed: removedItems });
                if (addedItems)
                    beforeAdd(addedItems, this);
                var retVal = Array.prototype.splice.apply(this, arguments);
                this.after(this.object, this.property, this, removedItems, addedItems);
                this.changed.notify({ added: addedItems, removed: removedItems });
                return retVal;
            };

            array.remove = function (items) {
                var removed = [];
                this.changing.notify({ added: [], removed: arguments });
                var that = this;
                helper.forEach(arguments, function (item) {
                    var index = helper.indexOf(that, item);
                    if (index >= 0) {
                        Array.prototype.splice.call(that, index, 1);
                        removed.push(item);
                    }
                });
                this.after(this.object, this.property, this, removed, null);
                this.changed.notify({ added: [], removed: removed });
                return removed;
            };

            /**
             * Loads the navigation property using EntityManager.
             * @param {string[]} expands - Expand navigations to apply when loading navigation property.
             * @param {Object} resourceName - Resource name to query entities.
             * @param {queryOptions} options - Query options.
             * @param {successCallback=} successCallback - Success callback function.
             * @param {errorCallback=} errorCallback - Error callback function.
             * @returns {Promise} A Promise when available, otherwise return value of the AjaxProvider.
             */
            array.load = function (expands, resourceName, options, successCallback, errorCallback) {
                return this.object.$tracker.loadNavigationProperty(this.property.name, expands, resourceName, options, successCallback, errorCallback);
            };

            function beforeAdd(added, instance) {
                var o = instance.object;
                var p = instance.property;
                if (p) {
                    var handleUnmappedProperties;
                    if (o.$tracker && o.$tracker.manager)
                        handleUnmappedProperties = o.$tracker.manager.handleUnmappedProperties;
                    if (handleUnmappedProperties == null) handleUnmappedProperties = settings.handleUnmappedProperties;

                    if (Assert.isInstanceOf(p, metadata.NavigationProperty))
                        helper.forEach(added, function (a) { p.checkAssign(a); });
                    else if (Assert.isInstanceOf(p, metadata.DataProperty))
                        helper.forEach(added, function (a, i) { added[i] = p.handle(a); });
                    else if (handleUnmappedProperties === true)
                        helper.forEach(added, function (a, i) { added[i] = core.dataTypes.handle(a); });
                }
            }

            return array;
        },
        /**
         * Creates a new array with the results of evaluating provided expression on every element in the given array.
         * @param {any[]} array - Array to run projection on.
         * @param {string} exp - Projection expression.
         * @param {QueryContext} queryContext - Query execution context.
         * @returns {any[]} Projected new object.
         */
        runSelectExp: function (array, exp, queryContext) {
            if (array.length == 0) return array;

            exp = libs.jsep(exp);
            var exps = exp.type === 'Compound' ? exp.body : [exp];
            var projector = helper.jsepToProjector(exps, queryContext);
            return helper.mapArray(array, projector);
        },
        /**
        * Converts parsed javascript expression (jsep) to OData format query string.
        * @param {Object} exp - Jsep expression (tokenized).
        * @param {QueryContext} queryContext - Query execution context.
        * @param {Object=} firstExp - First evaluated expression (for internal use only).
        * @returns {string} OData query string.
        */
        jsepToODataQuery: function (exp, queryContext, firstExp) {
            firstExp = firstExp || exp;
            if (!queryContext) queryContext = { aliases: [] };
            else if (!queryContext.aliases) queryContext.aliases = [];
            if (exp.type == 'LogicalExpression' || exp.type == 'BinaryExpression') {
                if (exp.operator == '=>') {
                    if (exp != firstExp)
                        throw helper.createError(i18N.odataDoesNotSupportAlias);
                    queryContext.aliases.push({ alias: exp.left.name, value: null });
                    var r = helper.jsepToODataQuery(exp.right, queryContext, firstExp);
                    if (exp != firstExp)
                        queryContext.aliases.pop();
                    return r;
                }
                var op = enums.langOperators.find(exp.operator).oData;
                if (!op) throw helper.createError(i18N.operatorNotSupportedForOData, [exp.operator], { expression: exp });
                return '(' + helper.jsepToODataQuery(exp.left, queryContext, firstExp) + ' ' + op + ' ' + helper.jsepToODataQuery(exp.right, queryContext, firstExp) + ')';
            }
            else if (exp.type == 'UnaryExpression')
                return exp.operator + helper.jsepToODataQuery(exp.argument, queryContext, firstExp);
            else if (exp.type == 'Identifier') {
                var n = exp.name;
                var val = undefined;
                var isPrm = false;
                if (n[0] == '@') {
                    isPrm = true;
                    n = n.slice(1);
                }

                if (queryContext.expVarContext && queryContext.expVarContext[n] !== undefined)
                    val = queryContext.expVarContext[n];
                else if (queryContext.varContext && queryContext.varContext[n] !== undefined)
                    val = queryContext.varContext[n];

                if (val !== undefined)
                    return core.dataTypes.toODataValue(val);
                if (isPrm)
                    throw helper.createError(i18N.unknownParameter, [n], { expression: exp, queryContext: queryContext });

                var a = helper.findInArray(queryContext.aliases, n, 'alias');
                if (a) return a.value;

                return n;
            }
            else if (exp.type == 'Literal')
                return core.dataTypes.toODataValue(exp.value);
            else if (exp.type == 'MemberExpression') {
                if (queryContext.currentAlias && exp.object.name == queryContext.currentAlias.alias)
                    return exp.property.name;
                else {
                    var ali = helper.findInArray(queryContext.aliases, exp.object.name, 'alias'), o;
                    if (ali) o = ali.value;
                    else o = helper.jsepToODataQuery(exp.object, queryContext, firstExp);

                    if (o && o[exp.property.name] !== undefined)
                        return core.dataTypes.toODataValue(o[exp.property.name]);
                    return o ? o + '/' + exp.property.name : exp.property.name;
                }
            }
            else if (exp.type == 'Compound') {
                var sts = [];
                for (var i = 0; i < exp.body.length; i++) {
                    var st = exp.body[i];
                    var s = helper.jsepToODataQuery(st, queryContext);
                    var ls = s.toLowerCase();
                    if (ls == 'desc' || ls == 'asc') {
                        if (sts.length == 0)
                            throw helper.createError(i18N.invalidStatement, { expression: exp, statement: st });
                        sts[sts.length - 1] += ' ' + s;
                    }
                    else if (ls == 'as') {
                        if (sts.length == 0 || exp.body.length < i + 1)
                            throw helper.createError(i18N.invalidStatement, { expression: exp, statement: st });
                        sts[sts.length - 1] += ' as ' + exp.body[i + 1].name;
                        i++;
                    }
                    else sts.push(s);
                }
                return sts.join(', ');
            }
            else if (exp.type == 'CallExpression') {
                var argList = exp.arguments, args = [], alias = null;
                if (argList.length == 1 && argList[0] && argList[0].type == 'BinaryExpression' && argList[0].operator == '=>') {
                    alias = { alias: argList[0].left.name };
                    alias.value = alias.alias;
                    argList = [argList[0].right];
                }
                if (alias) {
                    queryContext.currentAlias = alias;
                    queryContext.aliases.push(alias);
                }
                for (var j = 0; j < argList.length; j++) {
                    var arg = argList[j];
                    if (arg != null)
                        args.push(helper.jsepToODataQuery(arg, queryContext, firstExp));
                }
                var funcName;
                if (exp.callee.type == 'MemberExpression') {
                    args.splice(0, 0, helper.jsepToODataQuery(exp.callee.object, queryContext, firstExp));
                    funcName = exp.callee.property.name;
                }
                else funcName = exp.callee.name;
                var func = querying.queryFuncs.getFunc(funcName);
                if (func.needsAlias == true) {
                    if (alias)
                        args.splice(0, 0, alias);
                    else throw helper.createError(i18N.functionNeedsAlias, [funcName], { expression: exp });
                }
                var retVal = func.toODataFunction.apply(func, args);
                if (alias) {
                    queryContext.currentAlias = null;
                    queryContext.aliases.pop();
                }
                return retVal;
            }
            throw helper.createError(i18N.unknownExpression, { expression: exp });
        },
        /**
        * Converts parsed javascript expression (jsep) to Beetle format query string.
        * @param {Object} exp - Jsep expression (tokenized).
        * @param {QueryContext} queryContext - Query execution context.
        * @param {Object=} firstExp - First evaluated expression (for internal use only).
        * @returns {string} OData query string.
        */
        jsepToBeetleQuery: function (exp, queryContext, firstExp) {
            firstExp = firstExp || exp;
            if (!queryContext) queryContext = { aliases: [] };
            else if (!queryContext.aliases) queryContext.aliases = [];
            if (exp.type === 'LogicalExpression' || exp.type == 'BinaryExpression') {
                if (exp.operator == '=>') {
                    queryContext.aliases.push({ alias: exp.left.name, value: 'it' });
                    var r = helper.jsepToBeetleQuery(exp.right, queryContext, firstExp);
                    if (exp != firstExp)
                        queryContext.aliases.pop();
                    return r;
                }
                var op = enums.langOperators.find(exp.operator).code;
                return '(' + helper.jsepToBeetleQuery(exp.left, queryContext, firstExp) + ' ' + op + ' ' + helper.jsepToBeetleQuery(exp.right, queryContext, firstExp) + ')';
            }
            else if (exp.type === 'UnaryExpression')
                return exp.operator + helper.jsepToBeetleQuery(exp.argument, queryContext, firstExp);
            else if (exp.type === 'Identifier') {
                var n = exp.name;
                var val = undefined;
                var isPrm = false;
                if (n[0] == '@') {
                    isPrm = true;
                    n = n.slice(1);
                }

                if (queryContext.expVarContext && queryContext.expVarContext[n] !== undefined)
                    val = queryContext.expVarContext[n];
                else if (queryContext.varContext && queryContext.varContext[n] !== undefined)
                    val = queryContext.varContext[n];

                if (val !== undefined)
                    return core.dataTypes.toBeetleValue(val);
                if (isPrm)
                    throw helper.createError(i18N.unknownParameter, [n], { expression: exp, queryContext: queryContext });

                var a = helper.findInArray(queryContext.aliases, n, 'alias');
                if (a) return a.value;

                return n;
            }
            else if (exp.type === 'Literal')
                return core.dataTypes.toBeetleValue(exp.value);
            else if (exp.type === 'MemberExpression') {
                if (queryContext.currentAlias && exp.object.name == queryContext.currentAlias.alias)
                    return exp.property.name;
                else {
                    var ali = helper.findInArray(queryContext.aliases, exp.object.name, 'alias'), o;
                    if (ali) o = ali.value;
                    else o = helper.jsepToBeetleQuery(exp.object, queryContext, firstExp);

                    if (o[exp.property.name] !== undefined)
                        return core.dataTypes.toBeetleValue(o[exp.property.name]);
                    return o + '.' + exp.property.name;
                }
            }
            else if (exp.type === 'Compound') {
                var sts = [];
                for (var i = 0; i < exp.body.length; i++) {
                    var st = exp.body[i];
                    var s = helper.jsepToBeetleQuery(st, queryContext);
                    var ls = s.toLowerCase();
                    if (ls == 'desc' || ls == 'asc') {
                        if (sts.length == 0)
                            throw helper.createError(i18N.invalidStatement, { expression: exp, statement: st });
                        sts[sts.length - 1] += ' ' + s;
                    }
                    else if (ls == 'as') {
                        if (sts.length == 0 || exp.body.length < i + 1)
                            throw helper.createError(i18N.invalidStatement, { expression: exp, statement: st });
                        sts[sts.length - 1] += ' as ' + exp.body[i + 1].name;
                        i++;
                    }
                    else sts.push(s);
                }
                return sts.join(', ');
            }
            else if (exp.type === 'CallExpression') {
                var argList = exp.arguments, args = [], alias = null;
                if (argList.length == 1 && argList[0] && argList[0].type == 'BinaryExpression' && argList[0].operator == '=>') {
                    alias = { alias: argList[0].left.name };
                    alias.value = alias.alias;
                    argList = [argList[0].right];
                }
                if (alias) {
                    queryContext.currentAlias = alias;
                    queryContext.aliases.push(alias);
                }
                for (var j = 0; j < argList.length; j++) {
                    var arg = argList[j];
                    if (arg != null)
                        args.push(helper.jsepToBeetleQuery(arg, queryContext, firstExp));
                }
                var funcName;
                if (exp.callee.type == 'MemberExpression') {
                    args.splice(0, 0, helper.jsepToBeetleQuery(exp.callee.object, queryContext, firstExp));
                    funcName = exp.callee.property.name;
                }
                else funcName = exp.callee.name;
                var func = querying.queryFuncs.getFunc(funcName);
                var retVal = func.toBeetleFunction.apply(func, args);
                if (alias) {
                    queryContext.currentAlias = null;
                    queryContext.aliases.pop();
                }
                return retVal;
            }
            throw helper.createError(i18N.unknownExpression, { expression: exp });
        },
        /**
         * Converts parsed javascript expression (jsep) to Javascript function (not using evil "eval").
         * @param {Object} exp - Jsep expression (tokenized).
         * @param {QueryContext} queryContext - Query execution context.
         * @returns {Function} Javascript function.
         */
        jsepToFunction: function (exp, queryContext) {
            return function (value) {
                if (!queryContext) queryContext = { aliases: [] };
                else if (!queryContext.aliases) queryContext.aliases = [];
                if (queryContext.currentAlias)
                    queryContext.currentAlias.value = value;
                if (exp.type === undefined) return value;
                else if (exp.type == 'LogicalExpression' || exp.type == 'BinaryExpression') {
                    if (exp.operator == '=>') {
                        if (queryContext.currentAlias)
                            queryContext.aliases.push(queryContext.currentAlias);
                        queryContext.currentAlias = { alias: exp.left.name };
                        var r = helper.jsepToFunction(exp.right, queryContext)(value);
                        queryContext.currentAlias = queryContext.aliases.pop();
                        return r;
                    }
                    var op = enums.langOperators.find(exp.operator);
                    var varContext = queryContext.varContext;
                    var arg1 = function () { return helper.jsepToFunction(exp.left, queryContext)(value); };
                    var arg2 = function () { return helper.jsepToFunction(exp.right, queryContext)(value); };
                    return op.asFunc.call(varContext, arg1, arg2);
                }
                else if (exp.type == 'UnaryExpression') {
                    var arg = function () { return helper.jsepToFunction(exp.argument, queryContext)(value); };
                    var uop = enums.langOperators.find(exp.operator);
                    return uop.asFunc.call(varContext, arg);
                }
                else if (exp.type == 'Identifier') {
                    var n = exp.name;
                    if (n == 'null') return null;
                    if (n == 'true') return true;
                    if (n == 'false') return false;
                    if (n[0] == '@') {
                        var val = undefined;
                        var varName = n.slice(1);
                        if (queryContext.expVarContext && queryContext.expVarContext[varName] !== undefined)
                            val = queryContext.expVarContext[varName];
                        else if (queryContext.varContext)
                            val = queryContext.varContext[varName];
                        if (val === undefined) throw helper.createError(i18N.unknownParameter, [n], { expression: exp, queryContext: queryContext });
                        return val;
                    }
                    if (queryContext.currentAlias && queryContext.currentAlias.alias == n)
                        return value;
                    var a = helper.findInArray(queryContext.aliases, n, 'alias');
                    if (a) return a.value;
                    var v = helper.getValue(value, n);
                    if (v === undefined) return root[n];
                    return v;
                }
                else if (exp.type == 'Literal')
                    return exp.value;
                else if (exp.type == 'MemberExpression') {
                    if (exp.object.name) {
                        if (queryContext.currentAlias && exp.object.name == queryContext.currentAlias.alias)
                            return helper.getValue(value, exp.property.name);
                        var ali = helper.findInArray(queryContext.aliases, exp.object.name, 'alias');
                        if (ali) return helper.getValue(ali.value, exp.property.name);
                    }
                    return helper.getValue(helper.jsepToFunction(exp.object, queryContext)(value), exp.property.name);
                }
                else if (exp.type == 'CallExpression') {
                    var argList = exp.arguments, args = [], alias = null;
                    if (argList.length == 1 && argList[0] && argList[0].type == 'BinaryExpression' && argList[0].operator == '=>') {
                        alias = argList[0].left.name;
                        argList = [argList[0].right];
                    }
                    if (alias) {
                        if (queryContext.currentAlias)
                            queryContext.aliases.push(queryContext.currentAlias);
                        queryContext.currentAlias = { alias: alias };
                    }
                    var funcName;
                    helper.forEach(argList, function (farg) {
                        if (farg != null)
                            args.push(helper.jsepToFunction(farg, queryContext));
                    });

                    funcName = exp.callee.type == 'MemberExpression' ? exp.callee.property.name : exp.callee.name;

                    var retVal;
                    var func = querying.queryFuncs.getFunc(funcName, false);
                    if (func) {
                        if (exp.callee.type == 'MemberExpression')
                            args.splice(0, 0, helper.jsepToFunction(exp.callee.object, queryContext));
                        args.splice(0, 0, value);

                        retVal = func.impl.apply(queryContext, args);
                    }
                    else {
                        if (funcName[0] == '@') {
                            var varFuncName = funcName.slice(1);
                            if (queryContext.expVarContext && queryContext.expVarContext[varFuncName])
                                func = queryContext.expVarContext[varFuncName];
                            else if (queryContext.varContext && queryContext.varContext[varFuncName])
                                func = queryContext.varContext[varFuncName];
                            else throw helper.createError(i18N.unknownParameter, [varFuncName], { expression: exp, queryContext: queryContext });
                        } else {
                            var obj;
                            if (exp.callee.type == 'MemberExpression')
                                obj = helper.jsepToFunction(exp.callee.object, queryContext)(value);
                            else
                                obj = root;

                            if (obj == null || (func = obj[funcName]) == null)
                                throw helper.createError(i18N.unknownFunction, [funcName]);
                        }

                        args = helper.mapArray(args, function () { return this(value); });
                        retVal = func.apply(obj, args);
                    }

                    if (alias)
                        queryContext.currentAlias = queryContext.aliases.pop();
                    return retVal;
                }
                else throw helper.createError(i18N.unknownExpression, { expression: exp });
            };
        },
        /**
         * Converts parsed javascript expression (jsep) to Javascript projection function (not using evil "eval").
         * @param {Object} exp - Jsep expression (tokenized).
         * @param {QueryContext} queryContext - Query execution context.
         * @returns {Function} Javascript projector function.
         */
        jsepToProjector: function (exps, queryContext) {
            var projectExps = [];
            if (!Assert.isArray(exps)) exps = [exps];
            for (var i = 0; i < exps.length; i++) {
                var propertyName = null;
                var e = exps[i];
                // list expression property names and value evaluators
                switch (e.type) {
                    case 'Identifier':
                        propertyName = e.name;
                        break;
                    case 'MemberExpression':
                        propertyName = e.property.name;
                        break;
                }
                if (exps.length > i + 2 && exps[i + 1].name && exps[i + 1].name.toLowerCase() == 'as') {
                    i = i + 2;
                    var pExp = exps[i];
                    if (pExp.type != 'Identifier')
                        throw helper.createError(i18N.invalidPropertyAlias, { expressions: exps, aliasExpression: pExp });
                    propertyName = pExp.name;
                }
                if (exps.length > 1 && !propertyName)
                    throw helper.createError(i18N.projectionsMustHaveAlias, { expressions: exps, expression: e });

                projectExps.push({ p: propertyName, func: helper.jsepToFunction(e, queryContext) });
            }

            return function (item) {
                var projection = {};
                for (var k = 0; k < projectExps.length; k++) {
                    var pe = projectExps[k];
                    var value = pe.func(item);
                    if (exps.length == 1) return value;
                    projection[pe.p] = value;
                }
                return projection;
            };
        }
    };

    /**
     * Assertion methods. Two different usage possible, static methods and instance methods.
     * Static methods returns true or false. Instance methods can be chained and they collect errors in an array.
     * Check method throws error if there are any.
     * @class
     */
    var Assert = (function () {

        /** @constructor
         * @param {any} value - Value to check.
         * @param {string=} name - Property name representing the value (will be used in error messages).
         */
        var ctor = function (value, name) {
            this.value = value;
            this.name = name;
            this.errors = [];
        };
        var proto = ctor.prototype;

        /** Checks if value is not null or undefined. */
        proto.hasValue = function () {
            ctor.hasValue(this.value, this.errors, this.name);
            return this;
        };
        /** Checks if value is object. */
        proto.isObject = function () {
            ctor.isObject(this.value, this.errors, this.name);
            return this;
        };
        /** Checks if value is function. */
        proto.isFunction = function () {
            ctor.isFunction(this.value, this.errors, this.name);
            return this;
        };
        /** Checks if value is a non-empty string. */
        proto.isNotEmptyString = function () {
            ctor.isNotEmptyString(this.value, this.errors, this.name);
            return this;
        };
        /** 
         * Checks if value is an object of given type.
         * @param {string} typeName - Name of the javascript type.
         */
        proto.isTypeOf = function (typeName) {
            ctor.isTypeOf(this.value, typeName, this.errors, this.name);
            return this;
        };
        /** Checks if value is array. */
        proto.isArray = function () {
            ctor.isArray(this.value, this.errors, this.name);
            return this;
        };
        /** 
         * Checks if value is an symbol of given enum.
         * @param {Enum} enumType - Type of the enum.
         */
        proto.isEnum = function (enumType) {
            ctor.isEnum(this.value, enumType, this.errors, this.name);
            return this;
        };
        /** 
         * Checks if value is an instance of given type.
         * @param {any} type - Javascript function or class to check.
         */
        proto.isInstanceOf = function (type) {
            ctor.isInstanceOf(this.value, type, this.errors, this.name);
            return this;
        };

        /** If previous checks created any error, joins them with a new line and throws an Error. */
        proto.check = function () {
            if (this.errors.length > 0)
                throw helper.createError(this.errors.join('\n'), { name: this.name, value: this.value });
        };

        /** 
         * Checks if value is not null.
         * @param {any} value - Value to check.
         * @param {string[]=} errors - Previously generated error messages for the value.
         * @param {string=} name - Property name representing the value.
         */
        ctor.hasValue = function (value, errors, name) {
            if (value == null) {
                if (errors) errors.push(helper.formatString(i18N.valueCannotBeNull, name));
                return false;
            }
            return true;
        };
        /** 
         * Checks if value is object.
         * @param {any} value - Value to check.
         * @param {string[]=} errors - Previously generated error messages for the value.
         * @param {string=} name - Property name representing the value.
         */
        ctor.isObject = function (value, errors, name) {
            if (value == null || !core.dataTypes.object.isValid(value)) {
                if (errors) errors.push(helper.formatString(i18N.typeError, name, 'object'));
                return false;
            }
            return true;
        };
        /** 
         * Checks if value is function.
         * @param {any} value - Value to check.
         * @param {string[]=} errors - Previously generated error messages for the value.
         * @param {string=} name - Property name representing the value.
         */
        ctor.isFunction = function (value, errors, name) {
            if (value == null || !core.dataTypes.func.isValid(value)) {
                if (errors) errors.push(helper.formatString(i18N.typeError, name, 'function'));
                return false;
            }
            return true;
        };
        /** 
         * Checks if value is a non-empty string.
         * @param {any} value - Value to check.
         * @param {string[]=} errors - Previously generated error messages for the value.
         * @param {string=} name - Property name representing the value.
         */
        ctor.isNotEmptyString = function (value, errors, name) {
            if (value == null || value === '' || !ctor.isTypeOf(value, 'string', errors)) {
                if (errors) errors.push(helper.formatString(i18N.cannotBeEmptyString, name));
                return false;
            }
            return true;
        };
        /** 
         * Checks if value is an object of given type.
         * @param {any} value - Value to check.
         * @param {string} typeName - Name of the javascript type.
         * @param {string[]=} errors - Previously generated error messages for the value.
         * @param {string=} name - Property name representing the value.
         */
        ctor.isTypeOf = function (value, typeName, errors, name) {
            if (!ctor.hasValue(value)) return false;
            var type = core.dataTypes.byName(typeName);
            if (!type.isValid(value)) {
                if (errors) errors.push(helper.formatString(i18N.typeMismatch, name, typeName, type, value));
                return false;
            }
            return true;
        };
        /** 
         * Checks if value is array.
         * @param {any} value - Value to check.
         * @param {string[]=} errors - Previously generated error messages for the value.
         * @param {string=} name - Property name representing the value.
         */
        ctor.isArray = function (value, errors, name) {
            if (value == null || !core.dataTypes.array.isValid(value)) {
                if (errors) errors.push(helper.formatString(i18N.typeError, name, 'array'));
                return false;
            }
            return true;
        };
        /** 
         * Checks if value is an symbol of given enum.
         * @param {any} value - Value to check.
         * @param {Enum} enumType - Type of the enum.
         * @param {string[]=} errors - Previously generated error messages for the value.
         * @param {string=} name - Property name representing the value.
         */
        ctor.isEnum = function (value, enumType, errors, name) {
            if (!enumType.contains(value)) {
                if (errors) errors.push(helper.formatString(i18N.invalidEnumValue, [enumType, name], value));
                return false;
            }
            return true;
        };
        /** 
         * Checks if value is instance of given type.
         * @param {any} value - Value to check.
         * @param {any} type - Javascript function or class to check.
         * @param {string[]=} errors - Previously generated error messages for the value.
         * @param {string=} name - Property name representing the value.
         */
        ctor.isInstanceOf = function (value, type, errors, name) {
            if (value == null) {
                if (errors) errors.push(i18N.cannotCheckInstanceOnNull);
                return false;
            }
            if (!(value instanceof type)) {
                if (errors) errors.push(helper.formatString(i18N.instanceError, name, type));
                return false;
            }
            return true;
        };

        return ctor;
    })();

    /**  
     * 3rd party libraries and snippets.
     * @namespace
     */
    var libs = (function () {
        var expose = {};

        // A simple enum implementation for JavaScript
        // https://github.com/rauschma/enums
        expose.Enum = (function () {

            function copyOwnFrom(target, source) {
                for (var p in source)
                    target[p] = source[p];
                return target;
            }

            function symbol(name, props) {
                this.name = name;
                if (props)
                    copyOwnFrom(this, props);
            }

            /** We don’t want the mutable Object.prototype in the prototype chain */
            symbol.prototype = {};
            symbol.prototype.constructor = symbol;
			/**
			 * Without Object.prototype in the prototype chain, we need toString()
			 * in order to display symbols.
			 */
            symbol.prototype.toString = function () {
                return this.name;
            };

            /**
             * 3rd party code. Modified to work with old browsers.
             * For details: http://www.2ality.com/2011/10/enums.html
             */
            var x = function (obj) {
                var self = this;
                if (arguments.length === 1 && obj !== null && typeof obj === "object") {
                    for (var p in obj)
                        self[p] = new symbol(p, obj[p]);
                } else {
                    helper.forEach(arguments, function (name) {
                        self[name] = new symbol(name);
                    });
                }
            };
            x.prototype.symbols = function () {
                var retVal = [];
                for (var p in this) {
                    var v = this[p];
                    if (Assert.isFunction(v)) continue;
                    retVal.push(v);
                }
                return retVal;
            };
            x.prototype.contains = function (sym) {
                if (!(sym instanceof symbol)) return false;
                return this[sym.name] === sym;
            };
            return x;
        })();
        // JavaScript Expression Parser (JSEP) 0.2.8
        // JSEP may be freely distributed under the MIT License
        // http://jsep.from.so/
        // custom changes: 
        //      binary_ops: add "'=>': 0" for alias usage like c# lambdas
        //      isIdentifierStart: add "|| (ch === 64)" for variable usage (`@`)
        expose.jsep = (function () {
            'use strict';
            // Node Types
            // ----------

            // This is the full set of types that any JSEP node can be.
            // Store them here to save space when minified
            var COMPOUND = 'Compound',
                IDENTIFIER = 'Identifier',
                MEMBER_EXP = 'MemberExpression',
                LITERAL = 'Literal',
                THIS_EXP = 'ThisExpression',
                CALL_EXP = 'CallExpression',
                UNARY_EXP = 'UnaryExpression',
                BINARY_EXP = 'BinaryExpression',
                LOGICAL_EXP = 'LogicalExpression',
                // Operations
                // ----------

                // Set `t` to `true` to save space (when minified, not gzipped)
                t = true,
                // Use a quickly-accessible map to store all of the unary operators
                // Values are set to `true` (it really doesn't matter)
                unary_ops = { '-': t, '!': t, '~': t, '+': t },
                // Also use a map for the binary operations but set their values to their
                // binary precedence for quick reference:
                // see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
                binary_ops = {
                    '=>': 0,
                    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
                    '==': 6, '!=': 6, '===': 6, '!==': 6,
                    '<': 7, '>': 7, '<=': 7, '>=': 7,
                    '<<': 8, '>>': 8, '>>>': 8,
                    '+': 9, '-': 9,
                    '*': 10, '/': 10, '%': 10
                },
                // Get return the longest key length of any object
                getMaxKeyLen = function (obj) {
                    var max_len = 0, len;
                    for (var key in obj) {
                        if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
                            max_len = len;
                        }
                    }
                    return max_len;
                },
                max_unop_len = getMaxKeyLen(unary_ops),
                max_binop_len = getMaxKeyLen(binary_ops),
                // Literals
                // ----------
                // Store the values to return for the various literals we may encounter
                literals = {
                    'true': true,
                    'false': false,
                    'null': null
                },
                // Except for `this`, which is special. This could be changed to something like `'self'` as well
                this_str = 'this',
                // Returns the precedence of a binary operator or `0` if it isn't a binary operator
                binaryPrecedence = function (op_val) {
                    return binary_ops[op_val] || 0;
                },
                // Utility function (gets called from multiple places)
                // Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
                createBinaryExpression = function (operator, left, right) {
                    var type = (operator === '||' || operator === '&&') ? LOGICAL_EXP : BINARY_EXP;
                    return {
                        type: type,
                        operator: operator,
                        left: left,
                        right: right
                    };
                },
                // `ch` is a character code in the next three functions
                isDecimalDigit = function (ch) {
                    return (ch >= 48 && ch <= 57); // 0...9
                },
                isIdentifierStart = function (ch) {
                    return (ch === 36) || (ch === 95) || (ch === 64) || // `$`, `_` and `@`
                        (ch >= 65 && ch <= 90) || // A...Z
                        (ch >= 97 && ch <= 122); // a...z
                },
                isIdentifierPart = function (ch) {
                    return (ch === 36) || (ch === 95) || // `$` and `_`
                        (ch >= 65 && ch <= 90) || // A...Z
                        (ch >= 97 && ch <= 122) || // a...z
                        (ch >= 48 && ch <= 57); // 0...9
                },
                // Parsing
                // -------
                // `expr` is a string with the passed in expression
                jsep = function (expr) {
                    // `index` stores the character number we are currently at while `length` is a constant
                    // All of the gobbles below will modify `index` as we move along
                    var index = 0,
                        charAtFunc = expr.charAt,
                        charCodeAtFunc = expr.charCodeAt,
                        exprI = function (i) { return charAtFunc.call(expr, i); },
                        exprICode = function (i) { return charCodeAtFunc.call(expr, i); },
                        length = expr.length,
                        // Push `index` up to the next non-space character
                        gobbleSpaces = function () {
                            var ch = exprICode(index);
                            // space or tab
                            while (ch === 32 || ch === 9) {
                                ch = exprICode(++index);
                            }
                        },
                        // Search for the operation portion of the string (e.g. `+`, `===`)
                        // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
                        // and move down from 3 to 2 to 1 character until a matching binary operation is found
                        // then, return that binary operation
                        gobbleBinaryOp = function () {
                            gobbleSpaces();
                            var biop, to_check = expr.substr(index, max_binop_len), tc_len = to_check.length;
                            while (tc_len > 0) {
                                if (binary_ops.hasOwnProperty(to_check)) {
                                    index += tc_len;
                                    return to_check;
                                }
                                to_check = to_check.substr(0, --tc_len);
                            }
                            return false;
                        },
                        // This function is responsible for gobbling an individual expression,
                        // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
                        gobbleExpression = function () {
                            var ch_i, node, biop, prec, stack, biop_info, left, right, i;

                            // First, try to get the leftmost thing
                            // Then, check to see if there's a binary operator operating on that leftmost thing
                            left = gobbleToken();
                            biop = gobbleBinaryOp();

                            // If there wasn't a binary operator, just return the leftmost node
                            if (!biop) {
                                return left;
                            }

                            // Otherwise, we need to start a stack to properly place the binary operations in their
                            // precedence structure
                            biop_info = { value: biop, prec: binaryPrecedence(biop) };

                            right = gobbleToken();
                            if (!right) {
                                throw new Error("Expected expression after " + biop + " at character " + index);
                            }
                            stack = [left, biop_info, right];

                            // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
                            while ((biop = gobbleBinaryOp())) {
                                prec = binaryPrecedence(biop);

                                if (prec === 0) {
                                    break;
                                }
                                biop_info = { value: biop, prec: prec };

                                // Reduce: make a binary expression from the three topmost entries.
                                while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                                    right = stack.pop();
                                    biop = stack.pop().value;
                                    left = stack.pop();
                                    node = createBinaryExpression(biop, left, right);
                                    stack.push(node);
                                }

                                node = gobbleToken();
                                if (!node) {
                                    throw new Error("Expected expression after " + biop + " at character " + index);
                                }
                                stack.push(biop_info);
                                stack.push(node);
                            }

                            i = stack.length - 1;
                            node = stack[i];
                            while (i > 1) {
                                node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
                                i -= 2;
                            }

                            return node;
                        },
                        // An individual part of a binary expression:
                        // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
                        gobbleToken = function () {
                            var ch, curr_node, unop, to_check, tc_len;

                            gobbleSpaces();
                            ch = exprICode(index);

                            if (isDecimalDigit(ch) || ch === 46) {
                                // Char code 46 is a dot `.` which can start off a numeric literal
                                return gobbleNumericLiteral();
                            } else if (ch === 39 || ch === 34) {
                                // Single or double quotes
                                return gobbleStringLiteral();
                            } else if (isIdentifierStart(ch)) {
                                // `foo`, `bar.baz`
                                return gobbleVariable();
                            } else if (ch === 40) {
                                // Open parentheses
                                return gobbleGroup();
                            } else {
                                to_check = expr.substr(index, max_unop_len);
                                tc_len = to_check.length;
                                while (tc_len > 0) {
                                    if (unary_ops.hasOwnProperty(to_check)) {
                                        index += tc_len;
                                        return {
                                            type: UNARY_EXP,
                                            operator: to_check,
                                            argument: gobbleToken(),
                                            prefix: true
                                        };
                                    }
                                    to_check = to_check.substr(0, --tc_len);
                                }

                                return false;
                            }
                        },
                        // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
                        // keep track of everything in the numeric literal and then calling `parseFloat` on that string
                        gobbleNumericLiteral = function () {
                            var number = '';
                            while (isDecimalDigit(exprICode(index))) {
                                number += exprI(index++);
                            }

                            if (exprI(index) === '.') { // can start with a decimal marker
                                number += exprI(index++);

                                while (isDecimalDigit(exprICode(index))) {
                                    number += exprI(index++);
                                }
                            }

                            if (exprI(index) === 'e' || exprI(index) === 'E') { // exponent marker
                                number += exprI(index++);
                                if (exprI(index) === '+' || exprI(index) === '-') { // exponent sign
                                    number += exprI(index++);
                                }
                                while (isDecimalDigit(exprICode(index))) { //exponent itself
                                    number += exprI(index++);
                                }
                                if (!isDecimalDigit(exprICode(index - 1))) {
                                    throw new Error('Expected exponent (' +
                                        number + exprI(index) + ') at character ' + index);
                                }
                            }


                            // Check to make sure this isn't a variable name that start with a number (123abc)
                            if (isIdentifierStart(exprICode(index))) {
                                throw new Error('Variable names cannot start with a number (' +
                                    number + exprI(index) + ') at character ' + index);
                            }

                            return {
                                type: LITERAL,
                                value: parseFloat(number),
                                raw: number
                            };
                        },
                        // Parses a string literal, staring with single or double quotes with basic support for escape codes
                        // e.g. `"hello world"`, `'this is\nJSEP'`
                        gobbleStringLiteral = function () {
                            var str = '', quote = exprI(index++), closed = false, ch;

                            while (index < length) {
                                ch = exprI(index++);
                                if (ch === quote) {
                                    closed = true;
                                    break;
                                } else if (ch === '\\') {
                                    // Check for all of the common escape codes
                                    ch = exprI(index++);
                                    switch (ch) {
                                        case 'n': str += '\n'; break;
                                        case 'r': str += '\r'; break;
                                        case 't': str += '\t'; break;
                                        case 'b': str += '\b'; break;
                                        case 'f': str += '\f'; break;
                                        case 'v': str += '\x0B'; break;
                                    }
                                } else {
                                    str += ch;
                                }
                            }

                            if (!closed) {
                                throw new Error('Unclosed quote after "' + str + '"');
                            }

                            return {
                                type: LITERAL,
                                value: str,
                                raw: quote + str + quote
                            };
                        },
                        // Gobbles only identifiers
                        // e.g.: `foo`, `_value`, `$x1`
                        // Also, this function checks if that identifier is a literal:
                        // (e.g. `true`, `false`, `null`) or `this`
                        gobbleIdentifier = function () {
                            var ch = exprICode(index), start = index, identifier;

                            if (isIdentifierStart(ch)) {
                                index++;
                            } else {
                                throw new Error('Unexpected ' + exprI(index) + 'at character ' + index);
                            }

                            while (index < length) {
                                ch = exprICode(index);
                                if (isIdentifierPart(ch)) {
                                    index++;
                                } else {
                                    break;
                                }
                            }
                            identifier = expr.slice(start, index);

                            if (literals.hasOwnProperty(identifier)) {
                                return {
                                    type: LITERAL,
                                    value: literals[identifier],
                                    raw: identifier
                                };
                            } else if (identifier === this_str) {
                                return { type: THIS_EXP };
                            } else {
                                return {
                                    type: IDENTIFIER,
                                    name: identifier
                                };
                            }
                        },
                        // Gobbles a list of arguments within the context of a function call. This function
                        // also assumes that the `(` has already been gobbled.
                        // e.g. `foo(bar, baz)` or `my_func()`
                        gobbleArguments = function () {
                            var ch_i, args = [], node;
                            while (index < length) {
                                gobbleSpaces();
                                ch_i = exprI(index);
                                if (ch_i === ')') { // done parsing
                                    index++;
                                    break;
                                } else if (ch_i === ',') { // between expressions
                                    index++;
                                } else {
                                    node = gobbleExpression();
                                    if (!node || node.type === COMPOUND) {
                                        throw new Error('Expected comma at character ' + index);
                                    }
                                    args.push(node);
                                }
                            }
                            return args;
                        },
                        // Gobble a non-literal variable name. This variable name may include properties
                        // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
                        // It also gobbles function calls:
                        // e.g. `Math.acos(obj.angle)`
                        gobbleVariable = function () {
                            var ch_i, node, old_index;
                            node = gobbleIdentifier();
                            gobbleSpaces();
                            ch_i = exprI(index);
                            while (ch_i === '.' || ch_i === '[' || ch_i === '(') {
                                if (ch_i === '.') {
                                    index++;
                                    gobbleSpaces();
                                    node = {
                                        type: MEMBER_EXP,
                                        computed: false,
                                        object: node,
                                        property: gobbleIdentifier()
                                    };
                                } else if (ch_i === '[') {
                                    old_index = index;
                                    index++;
                                    node = {
                                        type: MEMBER_EXP,
                                        computed: true,
                                        object: node,
                                        property: gobbleExpression()
                                    };
                                    gobbleSpaces();
                                    ch_i = exprI(index);
                                    if (ch_i !== ']') {
                                        throw new Error('Unclosed [ at character ' + index);
                                    }
                                    index++;
                                    gobbleSpaces();
                                } else if (ch_i === '(') {
                                    // A function call is being made; gobble all the arguments
                                    index++;
                                    node = {
                                        type: CALL_EXP,
                                        'arguments': gobbleArguments(),
                                        callee: node
                                    };
                                }
                                gobbleSpaces();
                                ch_i = exprI(index);
                            }
                            return node;
                        },
                        // Responsible for parsing a group of things within parentheses `()`
                        // This function assumes that it needs to gobble the opening parenthesis
                        // and then tries to gobble everything within that parenthesis, assuming
                        // that the next thing it should see is the close parenthesis. If not,
                        // then the expression probably doesn't have a `)`
                        gobbleGroup = function () {
                            index++;
                            var node = gobbleExpression();
                            gobbleSpaces();
                            if (exprI(index) === ')') {
                                index++;
                                return node;
                            } else {
                                throw new Error('Unclosed ( at character ' + index);
                            }
                        },
                        nodes = [], ch_i, node;

                    while (index < length) {
                        ch_i = exprI(index);

                        // Expressions can be separated by semicolons, commas, or just inferred without any
                        // separators
                        if (ch_i === ';' || ch_i === ',') {
                            index++; // ignore separators
                        } else {
                            // Try to gobble each expression individually
                            if ((node = gobbleExpression())) {
                                nodes.push(node);
                                // If we weren't able to find a binary expression and are out of room, then
                                // the expression passed in probably has too much
                            } else if (index < length) {
                                throw new Error("Unexpected '" + exprI(index) + "' at character " + index);
                            }
                        }
                    }

                    // If there's only one expression just try returning the expression
                    if (nodes.length === 1) {
                        return nodes[0];
                    } else {
                        return {
                            type: COMPOUND,
                            body: nodes
                        };
                    }
                };

            // To be filled in by the template
            jsep.version = '0.2.8';
            jsep.toString = function () { return 'JavaScript Expression Parser (JSEP) v' + jsep.version; };

			/**
			 * @method jsep.addUnaryOp
			 * @param {string} op_name The name of the unary op to add
			 * @return jsep
			 */
            jsep.addUnaryOp = function (op_name) {
                unary_ops[op_name] = t;
                return this;
            };

			/**
			 * @method jsep.addBinaryOp
			 * @param {string} op_name The name of the binary op to add
			 * @param {number} precedence The precedence of the binary op (can be a float)
			 * @return jsep
			 */
            jsep.addBinaryOp = function (op_name, precedence) {
                max_binop_len = Math.max(op_name.length, max_binop_len);
                binary_ops[op_name] = precedence;
                return this;
            };

			/**
			 * @method jsep.removeUnaryOp
			 * @param {string} op_name The name of the unary op to remove
			 * @return jsep
			 */
            jsep.removeUnaryOp = function (op_name) {
                delete unary_ops[op_name];
                if (op_name.length === max_unop_len) {
                    max_unop_len = getMaxKeyLen(unary_ops);
                }
                return this;
            };

			/**
			 * @method jsep.removeBinaryOp
			 * @param {string} op_name The name of the binary op to remove
			 * @return jsep
			 */
            jsep.removeBinaryOp = function (op_name) {
                delete binary_ops[op_name];
                if (op_name.length === max_binop_len) {
                    max_binop_len = getMaxKeyLen(binary_ops);
                }
                return this;
            };

            return jsep;
        }());

        return expose;
    })();

    /**
     * Base types, can be considered as abstract classes.
     * This classes can be overwritten outside of the project, and later can be injected through constructors to change behaviours of core classes.
     * @namespace
     */
    var baseTypes = {
        /** 
         * Data conversion base type (interface). With this we can abstract date conversion and users can choose (or write) their implementation.
         * @class
         */
        DateConverterBase: (function () {
            /*
             * Base for Date related types.
             * @constructor
             */
            var ctor = function (name) {
                this.name = name;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.name;
            };

            /** Converts given value to date. */
            proto.parse = function (value) {
                throw helper.createError(i18N.notImplemented, ['DateConverterBase', 'parse']);
            };
            /** Converts given date to ISO string. */
            proto.toISOString = function (value) {
                throw helper.createError(i18N.notImplemented, ['DateConverterBase', 'toISOString']);
            };

            return ctor;
        })(),
        /** 
         * Base of all data types.
         * @class
         */
        DataTypeBase: (function () {

            /*
             * Base of all data types.
             * @constructor
             * @param {string} name - Name of the data type.
             */
            var ctor = function (name) {
                this.name = name || 'DataTypeBase';
                this.isComplex = false;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.name;
            };

            /** 
             * Returns raw value representing given value.
             * @param {any} value - The value to use. It must be a valid value for the type.
             * @returns {any} Portable value. i.e: Enum->number and Date->string
             */
            proto.getRawValue = function (value) {
                return value;
            };

            /** 
             * Checks if given value is valid for this type.
             * @param {any} value - The value to check.
             */
            proto.isValid = function (value) {
                return typeof value === this.name;
            };

            /** 
             * Converts given value to OData format.
             * @param {any} value - The value to use.
             * @returns {string} OData query string compatible value.
             */
            proto.toODataValue = function (value) {
                return value.toString();
            };

            /** 
             * Converts given value to Beetle format.
             * @param {any} value - The value to use.
             * @returns {string} Beetle query string compatible value.
             */
            proto.toBeetleValue = function (value) {
                return value.toString();
            };

            /** Gets default value for type. */
            proto.defaultValue = function () {
                throw helper.createError(i18N.notImplemented, [this.name, 'defaultValue']);
            };
            /** Generates a new unique value for this type. Used for auto-incremented values. */
            proto.autoValue = function () {
                throw helper.createError(i18N.notImplemented, [this.name, 'autoValue']);
            };
            /** Tries to convert given value to this type. */
            proto.handle = function (value) {
                throw helper.createError(i18N.notImplemented, [this.name, 'handle']);
            };

            return ctor;
        })(),
        /** 
         * Base of all Expressions.
         * @class
         */
        ExpressionBase: (function () {
            /**
             * Javascript expression base class -like linq expressions.
             * @constructor
             * @param {any} name - Name of the expression.
             * @param {any} order - OData order for the expression.
                ///  When an expression with 2 comes after 3 this means the query cannot be executed as OData.
                ///  eg. query.where().select().where() should not be run as OData query, result differs when it is run as beetle query or local query.
             * @param {any} onlyBeetle - Is this expression is supported only by beetle?
             * @param {any} isProjection - Is this expression alters result type.
                ///  after result type is changed, if an expression is added to query, query becomes OData incompatible.
             */
            var ctor = function (name, order, onlyBeetle, isProjection) {
                this.name = name || 'ExpressionBase';
                this.order = order;
                this.onlyBeetle = onlyBeetle;
                this.isProjection = isProjection;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.toBeetleQuery({});
            };

            /** 
             * Converts expression to OData representation.
             * @param {QueryContext} queryContext - Query execution context.
             * @returns {string} OData query string compatible expression.
             */
            proto.toODataQuery = function (queryContext) {
                if (this.onlyBeetle === true) return this.toBeetleQuery(queryContext);

                var exp = Assert.isFunction(this.exp) ? helper.funcToLambda(this.exp) : this.exp;
                return helper.jsepToODataQuery(libs.jsep(exp), queryContext);
            };

            /** 
             * Converts expression to Beetle representation.
             * @param {QueryContext} queryContext - Query execution context.
             * @returns {string} OData query string compatible expression.
             */
            proto.toBeetleQuery = function (queryContext) {
                if (!this.exp) return '';

                var exp = Assert.isFunction(this.exp) ? helper.funcToLambda(this.exp) : this.exp;
                return helper.jsepToBeetleQuery(libs.jsep(exp), queryContext);
            };

            /*
             * Clones the expression.
             * Queries are immutable like Linq;
             */
            proto.clone = function () {
                throw helper.createError(i18N.notImplemented, [this.name, 'clone']);
            };

            /*
             * Executes the expression on the provided array
             * @param {any[]} array - The array to use.
             * @returns {any} - Expression result.
             */
            proto.execute = function (array) {
                throw helper.createError(i18N.notImplemented, [this.name, 'execute']);
            };

            return ctor;
        })(),
        /** 
         * Base of all query functions.
         * @class
         */
        QueryFuncBase: (function () {
            /**
             * Query function base class
             * @constructor
             * @param {any} name - Name of the function.
             * @param {any} beetleName - Name to use for beetle queries.
             * @param {any} argCount - Argument count for method.
             */
            var ctor = function (name, beetleName, argCount) {
                this.name = name;
                this.beetleName = beetleName;
                this.argCount = argCount;
            };
            var proto = ctor.prototype;

            /** 
             * Converts function to OData representation.
             * @returns {string} OData query string compatible expression.
             */
            proto.toODataFunction = function () {
                var args = [];
                for (var i = 0; i < arguments.length; i++)
                    args.push(arguments[i]);

                return this.name + '(' + args.join(', ') + ')';
            };

            /** 
             * Converts function to Beetle representation.
             * @returns {string} Beetle query string compatible expression.
             */
            proto.toBeetleFunction = function () {
                var source = '';
                var i = 0;
                if (arguments.length == this.argCount) {
                    source = arguments[0] + '.';
                    ++i;
                }

                var args = Array.prototype.slice.call(arguments, i);
                return source + this.beetleName + '(' + args.join(', ') + ')';
            };

            /** 
             * Function's javascript implementation.
             * @returns {string} Beetle query string compatible expression.
             */
            proto.impl = function () {
                throw helper.createError(i18N.notImplemented, [this.name, 'impl']);
            };

            return ctor;
        })(),
        /** 
         * Base of all queries.
         * @class
         */
        QueryBase: (function () {
            /** 
             * Query base class. Contains common query methods.
             * @constructor
             */
            var ctor = function () {
                this.expressions = [];

                this.inlineCountEnabled = false;
                this.lastExpOrder = 0;
                this.isMultiTyped = false;
                this.lastProjection = 0;
                this.isClosed = false;
                this.hasBeetlePrm = false;
                this.options = null;
            };
            var proto = ctor.prototype;
            proto.executeAfterExecuter = false;

            proto.toString = function () {
                var params = [];
                helper.forEach(this.parameters, function (prm) {
                    params.push(prm.name + ': ' + (prm.value == null ? '' : prm.value));
                });

                if (this.inlineCountEnabled === true)
                    params.push('inlinecount: allpages');

                var qc = {};
                helper.forEach(this.expressions, function (exp) {
                    qc.expVarContext = exp.varContext;
                    params.push(exp.name + ': ' + exp.toBeetleQuery(qc));
                    qc.expVarContext = undefined;
                });

                return params.join(', ');
            };

            /**
             * Adds given expression to expression list and decides if now this query is projected and multi-typed.
             * @param {ExpressionBase} exp - Expression to add.
             */
            proto.addExpression = function (exp) {
                if (this.isClosed) throw helper.createError(i18N.queryClosed, null, { query: this });
                helper.assertPrm(exp, 'expression').isInstanceOf(baseTypes.ExpressionBase).check();
                this.expressions.push(exp);
                if (exp.isExecuter === true) {
                    var executeAfterExecuter = this.options && this.options.executeAfterExecuter;
                    if (executeAfterExecuter == null) executeAfterExecuter = this.executeAfterExecuter;
                    if (executeAfterExecuter)
                        return this.execute();
                    this.isClosed = true;
                }

                // to support both odata and beetle queries, I added an order for expressions.
                if (exp.order < this.lastExpOrder || (this.hasBeetlePrm && !exp.onlyBeetle))
                    this.isMultiTyped = true;
                if (exp.isProjection === true)
                    this.lastProjection = this.expressions.length - 1;
                if (exp.onlyBeetle)
                    this.hasBeetlePrm = true;

                return this;
            };

            /**
             * Indicates wheter or not include total count in result.
             * @param {boolean=} isEnabled - When true, total count will be included in result. Default value: true.
             */
            proto.inlineCount = function (isEnabled) {
                var q = this.clone();
                q.inlineCountEnabled = isEnabled !== false;
                return q;
            };

            /**
             * If model has inheritance, when querying base type we can tell which derived type we want to load.
             * @param {string} typeName - Derived type name.
             */
            proto.ofType = function (typeName) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.OfTypeExp(typeName));
            };

            /**
             * Filter query based on given expression.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.where = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.WhereExp(predicate, varContext));
            };

            /**
             * Sorts results based on given properties.
             * @param {string|propertySelectFunction} properties - The properties to sort by.
             * @param {boolean=} isDesc - Indicates if sorting will be descending. Default value is false.
             */
            proto.orderBy = function (properties, isDesc) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.OrderByExp(properties, isDesc));
            };

            /**
             * Sorts results based on given properties descendingly.
             * @param {string|propertySelectFunction} properties - The properties to sort by.
             */
            proto.orderByDesc = function (properties) {
                return this.orderBy(properties, true);
            };

            /**
             * Selects only given properties using projection.
             * @param {string|string[]} properties - Properties or PropertyPaths to select (project).
             */
            proto.select = function (properties) {
                var q = this.clone();
                if (arguments.length == 1) {
                    var arg = arguments[0];
                    if (Assert.isArray(arg))
                        properties = arg.join(', ');
                } else properties = Array.prototype.slice.call(arguments).join(', ');
                return q.addExpression(new querying.expressions.SelectExp(properties));
            };

            /**
             * Skips given count records and start reading.
             * @param {number} count - The number of items to skip.
             */
            proto.skip = function (count) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.SkipExp(count));
            };

            /**
             * Takes only given count records.
             * @param {number} count - The number of items to take.
             */
            proto.take = function (count) {
                return this.top(count);
            };

            /**
             * Takes only given count records .
             * @param {number} count - The number of items to take.
             */
            proto.top = function (count) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.TopExp(count));
            };

            /**
             * Groups query by given keys (projects them into a new type) and returns values (projecting into new type).
             * @param {string|string[]} keySelector - A projection to extract the key for each element.
             * @param {string|string[]} valueSelector - A projection to create a result value from each group.
             */
            proto.groupBy = function (keySelector, valueSelector) {
                var q = this.clone();
                if (Assert.isArray(keySelector))
                    keySelector = keySelector.join(', ');
                if (Assert.isArray(valueSelector))
                    valueSelector = valueSelector.join(', ');
                return q.addExpression(new querying.expressions.GroupByExp(keySelector, valueSelector));
            };

            /**
             * Gets only distinct items, when selector is given it will be used as comparer (project and compares projected objects).
             * @param {string|string[]} selector - A projection to extract the key for each element.
             */
            proto.distinct = function (selector) {
                var q = this.clone();
                if (Assert.isArray(selector))
                    selector = selector.join(', ');
                return q.addExpression(new querying.expressions.DistinctExp(selector));
            };

            /** Reverse the collection. */
            proto.reverse = function () {
                var q = this.clone();
                return q.addExpression(new querying.expressions.ReverseExp());
            };

            /**
             * Selects given collection property for each element and returns all in a new array.
             * @param {string|string[]} properties - Properties or PropertyPaths to select (project).
             */
            proto.selectMany = function (properties) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.SelectManyExp(properties));
            };

            /**
             * Gets all the items after first succesful predicate.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.skipWhile = function (predicate, varContext) {
                /// <param name="predicate"></param>
                /// <param name="varContext">Variable context for the expression.</param>
                var q = this.clone();
                return q.addExpression(new querying.expressions.SkipWhileExp(predicate, varContext));
            };

            /**
             * Gets all the items before first succesful predicate.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.takeWhile = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.TakeWhileExp(predicate, varContext));
            };

            /**
             * If all items suits given predication returns true, otherwise false.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.all = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.AllExp(predicate, varContext));
            };

            /**
             * If there is at least one item in query result (or any item suits given predication) returns true, otherwise false.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.any = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.AnyExp(predicate, varContext));
            };

            /**
             * Calculates average of items of query (or from given projection result).
             * @param {string=} selector - Property path to use on calculation.
             */
            proto.avg = function (selector) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.AvgExp(selector));
            };

            /**
             * Finds maximum value from items of query (or from given projection result).
             * @param {string=} selector - Property path to use on calculation.
             */
            proto.max = function (selector) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.MaxExp(selector));
            };

            /**
             * Finds minimum value from items of query (or from given projection result).
             * @param {string=} selector - Property path to use on calculation.
             */
            proto.min = function (selector) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.MinExp(selector));
            };

            /**
             * Finds summary value from items of query (or from given projection result).
             * @param {string=} selector - Property path to use on calculation.
             */
            proto.sum = function (selector) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.SumExp(selector));
            };

            /**
             * Gets the count of items of query.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.count = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.CountExp(predicate, varContext));
            };

            /**
             * Gets the first value from items of query (or from given predication result). When there is no item, throws exception.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.first = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.FirstExp(predicate, varContext));
            };

            /**
             * Gets the first value (or null when there is no items) from items of query (or from given predication result).
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.firstOrDefault = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.FirstOrDefaultExp(predicate, varContext));
            };

            /**
             * Gets the single value from items (or from given predication result). Where zero or more than one item exists throws exception.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.single = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.SingleExp(predicate, varContext));
            };

            /**
             * Gets the single value (or null when there is no items) from items (or from given predication result). Where more than one item exists throws exception.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.singleOrDefault = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.SingleOrDefaultExp(predicate, varContext));
            };

            /**
             * Gets the last value from items of query (or from given predication result). When there is no item, throws exception.
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.last = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.LastExp(predicate, varContext));
            };

            /**
             * Gets the last value (or null when there is no items) from items of query (or from given predication result).
             * @param {string|predicateFunction} predicate - A function to test each element for a condition (can be string expression).
             * @param {Object|any[]} varContext - Variable context for the expression.
             */
            proto.lastOrDefault = function (predicate, varContext) {
                var q = this.clone();
                return q.addExpression(new querying.expressions.LastOrDefaultExp(predicate, varContext));
            };

            /**
             * Sets options to be used at execution.
             * @param {queryOptions} options - Query options. Multiple call to this function will override previous settings.
             */
            proto.withOptions = function (options) {
                var q = this.clone();
                q.options = helper.combine(this.options, options);
                return q;
            };

            /** Executes the query. */
            proto.execute = function () {
                throw helper.createError(i18N.notImplemented, ['Query', 'execute']);
            };

            /** Executes the query. Shortcut for execute. */
            proto.x = function () {
                return this.execute.apply(this, arguments);
            };

            /** * Creates a function that can execute query operations against given array. */
            proto.toFunction = function () {
                var that = this;
                return function (array, varContext) {
                    var qc = { varContext: varContext };
                    qc.aliases = [];
                    if (that.inlineCountEnabled)
                        qc.inlineCount = array.length;
                    helper.forEach(that.expressions, function (exp) {
                        qc.expVarContext = exp.varContext;
                        array = exp.execute(array, qc);
                        if (that.inlineCountEnabled
                                && !Assert.isInstanceOf(exp, querying.expressions.TopExp)
                                && !Assert.isInstanceOf(exp, querying.expressions.SkipExp)) {
                            qc.inlineCount = array.length;
                        }
                        qc.expVarContext = undefined;
                    });
                    if (that.inlineCountEnabled)
                        array.$inlineCount = qc.inlineCount;
                    return array;
                };
            };

            /** Clones whole query. */
            proto.clone = function () {
                throw helper.createError(i18N.notImplemented, ['Query', 'clone']);
            };

            /** 
             * Copies properties to given query.
             * @param {QueryBase} query - The query to populate. Must be a subclass of QueryBase.
             */
            proto.copy = function (query) {
                helper.forEach(this.expressions, function (exp) {
                    query.expressions.push(exp.clone());
                });
                query.inlineCountEnabled = this.inlineCountEnabled;
                query.lastExpOrder = this.lastExpOrder;
                query.isMultiTyped = this.isMultiTyped;
                query.lastProjection = this.lastProjection;
                query.isClosed = this.isClosed;
                query.hasBeetlePrm = this.hasBeetlePrm;
                if (this.options)
                    query.options = helper.combine(null, this.options);
            };

            /** Finds given typed expression. */
            proto.getExpression = function (type, throwIfNotFound) {
                for (var i = this.lastProjection; i < this.expressions.length; i++) {
                    var exp = this.expressions[i];
                    if (Assert.isInstanceOf(exp, type)) return exp;
                }
                if (throwIfNotFound === true)
                    throw helper.createError(i18N.expressionCouldNotBeFound, { type: type, query: this });
                return null;
            };

            /** Removes given typed expressions. */
            proto.removeExpression = function (type) {
                for (var i = this.expressions.length - 1; i >= 0; i--) {
                    var exp = this.expressions[i];
                    if (Assert.isInstanceOf(exp, type))
                        this.expressions.splice(i, 1);
                }
                return this;
            };

            return ctor;
        })(),
        /**
         * Observable provider base class. Makes given object's properties observable.
         * @class
         */
        ObservableProviderBase: (function () {
            var ctor = function (name) {
                this.name = name || 'ObservableProviderBase';
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.name;
            };

            /**
             * When given property for given object is observable returns true, otherwise false.
             * @param {Object} object - The object.
             * @param {string} property - The property name.
             */
            proto.isObservable = function (object, property) {
                throw helper.createError(i18N.notImplemented, [this.name, 'isObservable']);
            };
            /**
             * Makes given object observable.
             * @param {Object} object - The object.
             * @param {EntityType} type - The entity type.
             * @param {ObservableProviderCallbackOptions} callbacks - Callback functions, beetle tracks entities using these callbacks..
             */
            proto.toObservable = function (object, type, callbacks) {
                throw helper.createError(i18N.notImplemented, [this.name, 'toObservable']);
            };
            /** 
             * Reads an observable property value from object.
             * @param {Object} object - The object.
             * @param {string} property - The property name.
             */
            proto.getValue = function (object, property) {
                throw helper.createError(i18N.notImplemented, [this.name, 'getValue']);
            };
            /** 
             * Sets the value of observable property of given object.
             * @param {Object} object - The object.
             * @param {string} property - The property name.
             * @param {any} value - The value to set.
             */
            proto.setValue = function (object, property, value) {
                throw helper.createError(i18N.notImplemented, [this.name, 'setValue']);
            };

            return ctor;
        })(),
        /**
         * Ajax provider base class. Operates ajax operations.
         * @class
         */
        AjaxProviderBase: (function () {
            var ctor = function (name) {
                this.name = name || 'AjaxProviderBase';
                this.syncSupported = true;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.name;
            };

            /**
             * Ajax operation function.
             * @param {string} uri - Uri to make request.
             * @param {string} type - Request type (POST, GET..)
             * @param {string} dataType - Request data type (xml, json..)
             * @param {string} contentType - Request content type (application/x-www-form-urlencoded; charset=UTF-8, application/json..)
             * @param {any} data - Request data.
             * @param {boolean} async - If set to false, request will be made synchronously.
             * @param {number} timeout - AJAX call timeout value. if call won't be completed after given time, exception will be thrown.
             * @param {Object} extra - Implementor specific arguments.
             * @param {Object} headers - Custom HTTP headers.
             * @param {successCallback} successCallback - Function to call after operation succeeded.
             * @param {errorCallback} errorCallback - Function to call when operation fails.
             */
            proto.doAjax = function (uri, method, dataType, contentType, data, async, timeout, extra, headers, successCallback, errorCallback) {
                throw helper.createError(i18N.notImplemented, [this.name, 'doAjax']);
            };

            /** 
             * Creates an error object by parsing XHR result.
             * @param {XMLHttpRequest} xhr - XML Http Request object. Can be used from implementors using Xhr.
             */
            proto.createError = function (xhr) {
                var obj = { status: xhr.status, xhr: xhr, detail: xhr.responseText };
                return helper.createError(xhr.statusText, obj);
            }

            /**
             * Returns a function that can get Http header for given key.
             * @param {XMLHttpRequest} xhr - XML Http Request object. Can be used from implementors using Xhr.
             * @returns {headerGetterFunction} Header getter function (string) => string.
             */
            proto.getHeaderGetter = function (xhr) {
                return function (header) {
                    return xhr.getResponseHeader(header);
                };
            }

            return ctor;
        })(),
        /**
         * Serialization service base class. Deserializes incoming data and serializes outgoing data.
         * @class
         */
        SerializationServiceBase: (function () {
            var ctor = function (name) {
                this.name = name || 'SerializationServiceBase';
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.name;
            };

            /**
             * Serializes given data to string.
             * @param {Object} data - Object to serialize.
             * @returns {string} Serialized string. 
             */
            proto.serialize = function (data) {
                throw helper.createError(i18N.notImplemented, [this.name, 'serialize']);
            };
            /**
             * Deserializes given string to object.
             * @param {string} string - String to deserialize.
             * @returns {string} Deserialized object.
             */
            proto.deserialize = function (string) {
                throw helper.createError(i18N.notImplemented, [this.name, 'deserialize']);
            };

            return ctor;
        })(),
        /**
         * Promise provider base class. Creates deferred promises for async operations.
         * @class
         */
        PromiseProviderBase: (function () {
            var ctor = function (name) {
                this.name = name || 'PromiseProviderBase';
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.name;
            };

            /**
             * Creates deferred object.
             * @returns {Object} Deferred object which can be resolved or rejected. 
             */
            proto.deferred = function () {
                throw helper.createError(i18N.notImplemented, [this.name, 'deferred']);
            };
            /**
             * Gets promise for deferred object.
             * @param {Object} deferred - Deferred object which can be resolved or rejected.
             * @returns {Promise} Returns a promise.
             */
            proto.getPromise = function (deferred) {
                throw helper.createError(i18N.notImplemented, [this.name, 'getPromise']);
            };
            /**
             * Resolves given promise for succesful operation.
             * @param {Object} deferred - Deferred object.
             * @param {any} data - Operation result.
             */
            proto.resolve = function (deferred, data) {
                throw helper.createError(i18N.notImplemented, [this.name, 'resolve']);
            };
            /**
             * Rejects given promise for failed operation.
             * @param {Object} deferred - Deferred object.
             * @param {Error} error - Error to pass to failed callback.
             */
            proto.reject = function (deferred, error) {
                throw helper.createError(i18N.notImplemented, [this.name, 'reject']);
            };

            return ctor;
        })(),
        /**
         * Data service base class.
         * @class
         */
        DataServiceBase: (function () {
            // cache metadata to reduce network traffic.
            var _metadataCache = [];

            /**
             *
             * @constructor
             * @param {any} uri - Service URI.
             * @param {MetadataManager|string|boolean} metadataPrm - [Metadata Manager] or [Metadata string] or [loadMetadata: when false no metadata will be used]
             * @param {ServiceOptions} injections - Injection object to change behaviour of the service,
             *      Can include these properties: ajaxProvider, serializationService, ajaxTimeout, dataType, contentType.
             *      When not given, defaults will be used.
             */
            var ctor = function (uri, metadataPrm, injections) {
                initialize(uri, metadataPrm, injections, this);
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.uri;
            };

            /** Checks if service is ready. */
            proto.isReady = function () {
                return !this._awaitingMetadata;
            };

            /**
             * Subscribe the ready callback.
             * @param {Function} callback - Function to call when the service is ready.
             */
            proto.ready = function (callback) {
                this._readyCallbacks.push(callback);

                checkReady(this);
            };

            /**
             * Gets entity type from metadata by its short name.
             * @param {string} shortName - Short name of the type.
             * @returns {metadata.EntityType} - Entity type, null if not found.
             */
            proto.getEntityType = function (shortName) {
                return this.metadataManager ? this.metadataManager.getEntityType(shortName) : null;
            };

            /**
             * Creates a query for a resource. Every data service can have their own query types.
             * @param {string} resourceName - Server resource name to combine with base uri.
             * @param {string=} shortName - Entity type's short name.
             * @param {EntityManager=} manager - Entity manager.
             * @returns {EntityQuery} Entity query. Can be build with method-chaining.
             */
            proto.createQuery = function (resourceName, shortName, manager) {
                helper.assertPrm(resourceName, 'resourceName').isNotEmptyString().check();
                if (shortName) return this.createEntityQuery(shortName, resourceName, manager);
                if (this.metadataManager) return this.metadataManager.createQuery(resourceName, null, manager);
                return new querying.EntityQuery(resourceName, null, manager);
            };

            /**
             * Creates a query for a resource. Every data service can have their own query types.
             * @param {string} shortName - Entity type's short name.
             * @param {string=} resourceName - Server resource name to combine with base uri.
             * @param {EntityManager=} manager - Entity manager.
             * @returns {EntityQuery} Entity query. Can be build with method-chaining.
             */
            proto.createEntityQuery = function (shortName, resourceName, manager) {
                if (!this.metadataManager)
                    throw helper.createError(i18N.noMetadataEntityQuery, { dataService: this });
                return this.metadataManager.createQuery(resourceName, shortName, manager);
            };

            /**
             * Register constructor and initializer (optional) for given type.
             * @param {string} shortName - Short name of the type.
             * @param {Function} constructor - Constructor function. Called right after the entity object is generated.
             * @param {Function} initializer - Initializer function. Called after entity started to being tracked (properties converted to observable).
             */
            proto.registerCtor = function (shortName, constructor, initializer) {
                if (this.metadataManager == null)
                    throw helper.createError(i18N.noMetadataEntityQuery);
                this.metadataManager.registerCtor(shortName, constructor, initializer);
            };

            /**
             * Creates an entity based on metadata information.
             * @param {string} shortName - Short name of the type.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity with observable properties. 
             */
            proto.createEntity = function (shortName, initialValues) {
                if (!this.metadataManager) throw helper.createError(i18N.noMetadataEntityQuery, { dataService: this });
                return this.metadataManager.createEntity(shortName, initialValues);
            };

            /**
             * Creates a raw entity based on metadata information.
             * @param {string} shortName - Short name of the type.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity without observable properties. 
             */
            proto.createRawEntity = function (shortName, initialValues) {
                if (!this.metadataManager) throw helper.createError(i18N.noMetadataEntityQuery, { dataService: this });
                return this.metadataManager.createRawEntity(shortName, initialValues);
            };

            /**
             * Creates an entity based on metadata information.
             * @param {Object} result - Entity initial object. This object instance will be made observable.
             * @param {string} typeName - Entity type name (full).
             * @returns {Entity} Entity with observable properties. 
             */
            proto.toEntity = function (result, typeName) {
                var type = null;
                if (this.metadataManager)
                    type = this.metadataManager.getEntityTypeByFullName(typeName);
                if (!type) type = new metadata.EntityType(typeName);
                return core.EntityTracker.toEntity(result, type, settings.getObservableProvider());
            };

            /**
             * Converts given query to a OData query string format.
             * @param {EntityQuery} query - Entity query to convert to OData parameters.
             * @param {Object} varContext - Variable context for the query.
             * @returns {Object[]} Parameter object (name|value pair) list.
             */
            proto.toODataQueryParams = function (query, varContext) {
                if (query.isMultiTyped === true)
                    throw helper.createError(i18N.oDataNotSupportMultiTyped, { query: query });

                var params = [];
                if (query.inlineCountEnabled === true)
                    params.push({ name: '$inlinecount', value: 'allpages' });

                var qc = { varContext: varContext };
                helper.forEach(query.expressions, function (exp, i) {
                    qc.expVarContext = exp.varContext;
                    var name, value;
                    if (exp.onlyBeetle === true) {
                        name = '!e' + i;
                        value = exp.toBeetleQuery(qc);
                        value = exp.name + ':' + value;
                    } else {
                        name = '$' + exp.name;
                        value = exp.toODataQuery(qc);
                    }
                    params.push({ name: name, value: value });
                    qc.expVarContext = undefined;
                });

                return params;
            };

            /**
             * Converts given query to a Beetle query string format.
             * @param {EntityQuery} query - Entity query to convert to Beetle parameters.
             * @param {Object} varContext - Variable context for the query.
             * @returns {Object[]} Parameter object (name|value pair) list.
             */
            proto.toBeetleQueryParams = function (query, varContext) {
                var params = [];
                if (query.inlineCountEnabled === true)
                    params.push({ name: '!e0', value: 'inlinecount:allpages' });

                var qc = { varContext: varContext };
                helper.forEach(query.expressions, function (exp, i) {
                    qc.expVarContext = exp.varContext;
                    params.push({ name: '!e' + (i + 1), value: exp.name + ':' + exp.toBeetleQuery(qc) });
                    qc.expVarContext = undefined;
                });

                return params;
            };
            
            /**
             * Fetch metadata from server.
             * @param {Object} options - Fetch metadata options (async: boolean).
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.fetchMetadata = function (options, successCallback, errorCallback) {
                throw helper.createError(i18N.notImplemented, ['DataServiceBase', 'fetchMetadata']);
            };
            /**
             * When there is no metadata available services may be able to create entities asynchronously (server side must be able to support this).
             * @param {string} typeName - Type name to create.
             * @param {Object} initialValues - Entity initial values.
             * @param {Object=} options - Options (makeObservable: boolean, async: boolean).
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.createEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                throw helper.createError(i18N.notImplemented, ['DataServiceBase', 'createEntityAsync']);
            };
            /**
             * Executes given query.
             * @param {EntityQuery} query 
             * @param {QueryOptions} options - Query options.
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.executeQuery = function (query, options, successCallback, errorCallback) {
                throw helper.createError(i18N.notImplemented, ['DataServiceBase', 'executeQuery']);
            };
            /**
             * Executes given query parameters.
             * @param {string} resource - Server resource to query.
             * @param {EntityQuery} queryParams - The query parameters.
             * @param {QueryOptions} options - Query options.
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.executeQueryParams = function (resource, queryParams, options, successCallback, errorCallback) {
                throw helper.createError(i18N.notImplemented, ['DataServiceBase', 'executeQueryParams']);
            };
            /**
             * Send changes to server.
             * @param {SavePackage} savePackage - An object containing entities to send to server for persistence.
             * @param {QueryOptions} options - Query options.
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.saveChanges = function (savePackage, options, successCallback, errorCallback) {
                throw helper.createError(i18N.notImplemented, ['DataServiceBase', 'saveChanges']);
            };

            var registerMetadataTypes;
            function initialize(uri, metadataPrm, injections, instance) {
                instance._awaitingMetadata = false;
                instance._readyCallbacks = [];

                if (uri == null) uri = '';
                else if (uri[uri.length - 1] !== '/') uri += '/';
                instance.uri = uri;

                injections = injections || {};
                instance.ajaxProvider = injections.ajaxProvider || settings.getAjaxProvider();
                instance.serializationService = injections.serializationService || settings.getSerializationService();

                instance.ajaxTimeout = injections.ajaxTimeout;
                instance.dataType = injections.dataType || 'json';
                instance.contentType = injections.contentType || 'application/json; charset=utf-8';

                registerMetadataTypes = injections.registerMetadataTypes;
                if (registerMetadataTypes == null)
                    registerMetadataTypes = settings.registerMetadataTypes;

                // If metadata parameter is false or undefined, it means do not use metadata
                if (metadataPrm !== false || metadataPrm === undefined) {
                    // When there is no metadata or metadata is true fetch metadata from server.
                    if (metadataPrm == null) {
                        // try to get metadata from cache
                        var cached = null;
                        if (settings.cacheMetadata === true)
                            cached = helper.findInArray(_metadataCache, uri, 'uri');
                        if (cached)
                            instance.metadataManager = cached.data;
                        else {
                            instance._awaitingMetadata = true;
                            instance.fetchMetadata(
                                null,
                                function (metadataObject) {
                                    instance._awaitingMetadata = false;
                                    instance.metadataManager = new metadata.MetadataManager(metadataObject);
                                    // cache retrieved and parsed metadata
                                    if (settings.cacheMetadata === true)
                                        _metadataCache.push({ uri: uri, data: instance.metadataManager });
                                    checkReady(instance);
                                },
                                function (e) {
                                    throw helper.createError(i18N.couldNotLoadMetadata, { exception: e, args: arguments, dataService: this });
                                });
                        }
                    } else if (Assert.isInstanceOf(metadataPrm, metadata.MetadataManager))
                        instance.metadataManager = metadataPrm;
                    else if (Assert.isObject(metadataPrm)) {
                        try {
                            instance.metadataManager = new metadata.MetadataManager(metadataPrm);
                        } catch (e) {
                            throw helper.createError(i18N.invalidArguments, { exception: e, args: arguments, dataService: this });
                        }
                    }
                }
                if (!instance._awaitingMetadata)
                    checkReady(instance);
            }

            function checkReady(instance) {
                if (instance.isReady()) {
                    var metadata = instance.metadataManager;
                    if (registerMetadataTypes && metadata) {
                        var managerName = metadata.name;
                        if (!(managerName in root))
                            root[managerName] = core.EntityManager;
                    }

                    var cs = instance._readyCallbacks.slice(0);
                    instance._readyCallbacks = [];
                    for (var i = 0; i < cs.length; i++) {
                        var c = cs[i];
                        if (c) c.call(instance);
                    }
                }
            }

            return ctor;
        })()
    };

    /**
     * Base types' implementations.
     * @namespace
     */
    var impls = {
        /** 
         * Default date converter class. Uses browser's default Date object.
         * @class
         */
        DefaultDateConverter: (function () {
            var ctor = function () {
                baseTypes.DateConverterBase.call(this, 'Default Date Converter');
            };
            helper.inherit(ctor, baseTypes.DateConverterBase);
            var proto = ctor.prototype;

            proto.parse = function (value) {
                if (typeof value != "string") return null;
                if (value.length < 10) return null;
                if (!/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value.substr(0, 10))) return null;
                if (/.\d{3}$/.test(value)) value += 'Z';
                try {
                    var d = Date.parse(value);
                    return isNaN(d) ? null : new Date(d);
                } catch (e) {
                    return null;
                }
            };

            proto.toISOString = function (value) {
                return value.toISOString();
            };

            return ctor;
        })(),
        /** 
         * Knockout observable provider class. Makes given object's properties observable.
         * @class
         */
        KoObservableProvider: (function () {

            var ctor = function (ko) {
                baseTypes.ObservableProviderBase.call(this, 'Knockout Observable Provider');
                this.ko = ko;

                /**
                 * Observable value read-write interceptor. 
                 * Because ko does not give old and new values together when notifying subscribers, I had to write this extender.
                 */
                if (ko.extenders.intercept == null) {
                    ko.extenders.intercept = function (target, interceptor) {
                        var result = ko.computed({
                            read: target,
                            write: function (newValue) {
                                var callback = interceptor && interceptor.callback;
                                if (callback)
                                    callback(interceptor.object, interceptor.property, target, newValue);
                            }
                        });

                        return result;
                    };
                }
            };
            helper.inherit(ctor, baseTypes.ObservableProviderBase);
            var proto = ctor.prototype;

            proto.isObservable = function (object, property) {
                return this.ko.isObservable(object[property]);
            };

            proto.toObservable = function (object, type, callbacks) {
                var pc = callbacks && callbacks.propertyChange;
                var ac = callbacks && callbacks.arrayChange;
                var dpc = callbacks && callbacks.dataPropertyChange;
                var snpc = callbacks && callbacks.scalarNavigationPropertyChange;
                var pnpc = callbacks && callbacks.pluralNavigationPropertyChange;
                var as = callbacks && callbacks.arraySet;
                var that = this;

                var ps = [];
                helper.forEachProperty(object, function (p, v) {
                    ps.push({ p: p, v: v });
                });
                if (type && type.hasMetadata) {
                    helper.forEach(type.dataProperties, function (dp) {
                        var v = object[dp.name];
                        if (v === undefined) v = null;
                        else v = dp.handle(v);
                        object[dp.name] = toObservableProperty(dp, v, dpc);
                        helper.removeFromArray(ps, dp.name, 'p');
                    });
                    helper.forEach(type.navigationProperties, function (np) {
                        var v = object[np.name];
                        if (v === undefined) v = null;
                        if (np.isScalar)
                            object[np.name] = toObservableProperty(np, v, snpc);
                        else
                            object[np.name] = toObservableArray(np, np.name, v, pnpc, as);
                        helper.removeFromArray(ps, np.name, 'p');
                    });
                }
                helper.forEach(ps, function (pv) {
                    var p = pv.p;
                    var v = pv.v;
                    if (Assert.isArray(v))
                        object[p] = toObservableArray(p, p, v, ac, as);
                    else
                        object[p] = toObservableProperty(p, v, pc);
                    if (!helper.findInArray(type.properties, p))
                        type.properties.push(p);
                });

                function toObservableProperty(property, value, callback) {
                    var retVal = that.ko.observable(value);
                    if (callback)
                        return that.ko.observable(value).extend({
                            intercept: {
                                object: object,
                                property: property,
                                callback: callback
                            }
                        });
                    return retVal;
                }

                function toObservableArray(property, propertyName, value, after, setCallback) {
                    var retVal;
                    value = value || [];
                    if (after)
                        value = helper.createTrackableArray(value, object, property,
                            function (o, p, i, r, a) {
                                if (retVal.$fromKo !== true)
                                    object[propertyName].valueHasMutated();
                                retVal.$fromKo = false;
                                after(o, p, i, r, a);
                            });
                    retVal = that.ko.observableArray(value);
                    retVal.subscribe(function () { retVal.$fromKo = true; }, null, "beforeChange");
                    if (setCallback)
                        retVal.equalityComparer = function (items, newItems) {
                            setCallback(object, property, items, newItems);
                        };
                    return retVal;
                }
            };

            proto.getValue = function (object, property) {
                return this.ko.utils.unwrapObservable(object[property]);
            };

            proto.setValue = function (object, property, value) {
                object[property](value);
            };

            return ctor;
        })(),
        /** 
         * Property observable provider class. Makes given object's fields properties with getter setter and tracks values.
         * @class
         */
        PropertyObservableProvider: (function () {
            var ctor = function () {
                baseTypes.ObservableProviderBase.call(this, 'Property Observable Provider');
            };
            helper.inherit(ctor, baseTypes.ObservableProviderBase);
            var proto = ctor.prototype;

            proto.isObservable = function (object, property) {
                return object['$fields'] !== undefined && object['$fields'][property] !== undefined;
            };

            proto.toObservable = function (object, type, callbacks) {
                var pc = callbacks && callbacks.propertyChange;
                var ac = callbacks && callbacks.arrayChange;
                var dpc = callbacks && callbacks.dataPropertyChange;
                var snpc = callbacks && callbacks.scalarNavigationPropertyChange;
                var pnpc = callbacks && callbacks.pluralNavigationPropertyChange;
                var as = callbacks && callbacks.arraySet;

                var fields = {};
                var ps = [];
                helper.forEachProperty(object, function (p, v) {
                    ps.push({ p: p, v: v });
                });
                if (type && type.hasMetadata) {
                    helper.forEach(type.dataProperties, function (dp) {
                        var v = object[dp.name];
                        if (v === undefined) v = null;
                        else v = dp.handle(v);
                        delete object[dp.name];
                        toObservableProperty(dp, dp.name, dpc);
                        helper.removeFromArray(ps, dp.name, 'p');
                        fields[dp.name] = v;
                    });
                    helper.forEach(type.navigationProperties, function (np) {
                        var v = object[np.name];
                        if (v === undefined) v = null;
                        delete object[np.name];
                        if (np.isScalar) {
                            toObservableProperty(np, np.name, snpc);
                            fields[np.name] = v;
                        } else
                            toObservableArray(np, np.name, v, pnpc, as);
                        helper.removeFromArray(ps, np.name, 'p');
                    });
                }
                helper.forEach(ps, function (pv) {
                    var p = pv.p;
                    var v = pv.v;
                    delete object[p];
                    if (Assert.isArray(v))
                        toObservableArray(p, p, v, ac, as);
                    else {
                        toObservableProperty(p, p, pc);
                        fields[p] = v;
                    }
                    if (!helper.findInArray(type.properties, p))
                        type.properties.push(p);
                });
                object['$fields'] = fields;
                return object;

                function toObservableProperty(property, propertyName, callback) {
                    return Object.defineProperty(object, propertyName, {
                        get: function () {
                            return object['$fields'][propertyName];
                        },
                        set: function (newValue) {
                            if (callback) {
                                var a = getAccessor(object, propertyName);
                                callback(object, property, a, newValue);
                            } else
                                object['$fields'][propertyName] = newValue;
                        },
                        enumerable: true,
                        configurable: true
                    });
                }

                function toObservableArray(property, propertyName, value, after, setCallback) {
                    value = value || [];
                    if (after)
                        value = helper.createTrackableArray(value, object, property, after);
                    fields[propertyName] = value;

                    return Object.defineProperty(object, propertyName, {
                        get: function () {
                            return object['$fields'][propertyName];
                        },
                        set: function (newItems) {
                            if (setCallback)
                                setCallback(object, property, items, newItems);
                            else
                                object['$fields'][propertyName] = newItems;
                        }
                    });
                }

                function getAccessor(o, p) {
                    return function () {
                        return arguments.length == 0 ? o['$fields'][p] : o['$fields'][p] = arguments[0];
                    };
                }
            };

            proto.getValue = function (object, property) {
                return object[property];
            };

            proto.setValue = function (object, property, value) {
                object[property] = value;
            };

            return ctor;
        })(),
        /** 
         * jQuery ajax provider class. Operates ajax operations via jQuery.
         * @class
         */
        JQueryAjaxProvider: (function () {
            var ctor = function ($) {
                baseTypes.AjaxProviderBase.call(this, 'jQuery Ajax Provider');
                this.$ = $;
            };
            helper.inherit(ctor, baseTypes.AjaxProviderBase);
            var proto = ctor.prototype;

            proto.doAjax = function (uri, method, dataType, contentType, data, async, timeout, extra, headers, successCallback, errorCallback) {
                var that = this;
                var o = {
                    url: uri,
                    accepts: {
                        json: 'application/json; odata=verbose',
                        xml: 'text/xml; application/xhtml+xml;application/xml',
                        text: 'text/xml'
                    },
                    type: method,
                    dataType: dataType,
                    contentType: contentType,
                    traditional: false,
                    data: data,
                    async: async,
                    headers: headers,
                    success: function (result, status, xhr) {
                        xhr.onreadystatechange = null;
                        xhr.abort = null;
                        if (result && result.Error) {
                            var err = that.createError(xhr);
                            err.message = result.Error;
                            errorCallback(err);
                        } else successCallback(result, that.getHeaderGetter(xhr), xhr);
                    },
                    error: function (xhr) {
                        xhr.onreadystatechange = null;
                        xhr.abort = null;
                        errorCallback(that.createError(xhr));
                    }
                };
                if (async !== false)
                    o.timeout = timeout;
                if (extra != null)
                    this.$.extend(o, extra);
                if (o.cache == null) o.cache = false;
                return this.$.ajax(o);
            };

            return ctor;
        })(),
        /** 
         * Angularjs ajax provider class. Operates ajax operations via angularjs.
         * @class
         */
        AngularjsAjaxProvider: (function () {
            var ctor = function (angularjs) {
                baseTypes.AjaxProviderBase.call(this, 'Angular.js Ajax Provider');
                this.syncSupported = false;
                this.$http = angularjs.injector(["ng"]).get('$http');
            };
            helper.inherit(ctor, baseTypes.AjaxProviderBase);
            var proto = ctor.prototype;

            proto.doAjax = function (uri, method, dataType, contentType, data, async, timeout, extra, headers, successCallback, errorCallback) {
                if (async === false)
                    throw helper.createError(i18N.syncNotSupported, [this.name]);

                var o = {
                    method: method,
                    url: uri,
                    contentType: contentType,
                    data: data,
                    timeout: timeout,
                    headers: headers,
                    responseType: dataType,
                    transformResponse: [function (data) {
                        return data;
                    }]
                };
                if (extra != null)
                    helper.extend(o, extra);
                if (o.cache == null) o.cache = false;
                return this.$http(o)
                    .then(function (resp) {
                        var headers = resp.headers();
                        return successCallback(resp.data, function (header) {
                            if (!header) return headers;
                            return headers[header.toLowerCase()];
                        });
                    }, function (error) {
                        var obj = { status: error.status, detail: error.data, error: error };
                        var e = helper.createError(error.statusText, obj);
                        errorCallback(e);
                        return e;
                    });
            };

            return ctor;
        })(),
        /** 
         * Angular ajax provider class. Operates ajax operations via angular.
         * @class
         */
        AngularAjaxProvider: (function () {
            var ctor = function (http, RequestConstructor, HeadersConstructor) {
                baseTypes.AjaxProviderBase.call(this, 'Angular Ajax Provider');
                this.syncSupported = false;
                this.http = http;
                this.RequestConstructor = RequestConstructor;
                this.HeadersConstructor = HeadersConstructor;
            };
            helper.inherit(ctor, baseTypes.AjaxProviderBase);
            var proto = ctor.prototype;

            proto.doAjax = function (uri, method, dataType, contentType, data, async, timeout, extra, headers, successCallback, errorCallback) {
                var hs = new this.HeadersConstructor();

                hs.append("Content-Type", contentType);
                if (headers != null) {
                    for (var p in headers) {
                        hs.append(p, headers[p]);
                    }
                }

                var requestOptions = {
                    url: uri,
                    method: method,
                    body: data,
                    headers: hs,
                    timeout: timeout
                };

                helper.extend(requestOptions, extra);

                var request = new this.RequestConstructor(requestOptions);

                return this.http.request(request)
                    .subscribe(resp => {
                        return successCallback(resp.text(), name => {
                            return resp.headers[name];
                        });
                    },
                    error => {
                        var obj = { status: error.status, detail: error._body, error: error };
                        var e = helper.createError(error.statusText, obj);
                        errorCallback(e);
                        return e;
                    });
            };

            return ctor;
        })(),
        /**
         * Pure javascript ajax provider class.
         * @class
         */
        VanillajsAjaxProvider: (function () {
            var ctor = function () {
                baseTypes.AjaxProviderBase.call(this, 'Vanilla-js Ajax Provider');
                this.syncSupported = true;
            };
            helper.inherit(ctor, baseTypes.AjaxProviderBase);
            var proto = ctor.prototype;

            proto.doAjax = function (uri, method, dataType, contentType, data, async, timeout, extra, headers, successCallback, errorCallback) {
                var that = this;

                var xhr = new XMLHttpRequest();
                xhr.open(method, uri, async);

                xhr.setRequestHeader("Accept", "application/json; odata=verbose, text/xml;application/xhtml+xml;application/xml");
                xhr.setRequestHeader("Content-Type", contentType);
                if (async !== false)
                    xhr.timeout = timeout;

                if (headers) {
                    for (var p in headers) {
                        xhr.setRequestHeader(p, headers[p]);
                    }
                }

                xhr.onload = function () {
                    xhr.onreadystatechange = null;
                    xhr.abort = null;

                    if (xhr.status === 200) {
                        successCallback(xhr.responseText, that.getHeaderGetter(xhr), xhr);
                    }
                    else {
                        errorCallback(that.createError(xhr));
                    }
                };

                xhr.ontimeout = function () {
                    xhr.onreadystatechange = null;
                    xhr.abort = null;

                    errorCallback(that.createError(xhr));
                };

                xhr.send(data);

                return xhr;
            }

            return ctor;
        })(),
        /**
         * Node.js ajax provider class.
         * @class
         */
        NodejsAjaxProvider: (function () {
            var ctor = function (http, https) {
                baseTypes.AjaxProviderBase.call(this, 'Node.js Ajax Provider');
                this.syncSupported = false;
                this.http = http;
                this.https = https;
            };
            helper.inherit(ctor, baseTypes.AjaxProviderBase);
            var proto = ctor.prototype;

            proto.doAjax = function (uri, method, dataType, contentType, data, async, timeout, extra, headers, successCallback, errorCallback) {
                if (async === false)
                    throw helper.createError(i18N.syncNotSupported, [this.name]);

                var reURLInformation = new RegExp([
                    '^(https?:)//', // protocol
                    '(([^:/?#]*)(?::([0-9]+))?)', // host (hostname and port)
                    '(/{0,1}[^?#]*)', // pathname
                    '(\\?[^#]*|)', // search
                    '(#.*|)$' // hash
                ].join(''));
                var uriParts = uri.match(reURLInformation),
                    protocol = uriParts[1] == "https:" ? this.https : this.http,
                    host = uriParts[3],
                    port = uriParts[4],
                    path = uriParts[5],
                    search = uriParts[6];
                path += search;

                headers = headers || {};
                headers["Content-Type"] = contentType;
                headers["Accept"] = "application/json; odata=verbose, text/xml;application/xhtml+xml;application/xml";
                headers["Content-Length"] = (data && data.length) || 0;

                var options = {
                    host: host,
                    path: path,
                    method: method,
                    headers: headers,
                    port: port || 80
                };

                var req = protocol.request(options, function (res) {
                    res.setEncoding("utf8");

                    var body = "";
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on("end", function () {
                        if (res.statusCode == 200) {
                            successCallback(body, function (name) {
                                if (!name) return res.headers;
                                return res.headers[name.toLowerCase()];
                            });
                        }
                        else {
                            var obj = { status: res.statusCode, detail: body };
                            var e = helper.createError(res.statusMessage, obj);
                            errorCallback(e);
                        }
                    });
                });

                if (data) {
                    req.write(data);
                }

                if (timeout) {
                    req.on("socket", function (socket) {
                        socket.setTimeout(timeout);
                        socket.on("timeout", function () {
                            req.abort();
                        });
                    });
                }

                req.on('error', function (e) {
                    errorCallback(e);
                });

                req.end();

                return req;
            }

            return ctor;
        })(),
        /** 
         * JSON serialization class. Deserializes incoming data and serializes outgoing data.
         * @class
         */
        JsonSerializationService: (function () {
            var ctor = function () {
                baseTypes.SerializationServiceBase.call(this, 'Json Serializer');
            };
            helper.inherit(ctor, baseTypes.SerializationServiceBase);
            var proto = ctor.prototype;

            proto.serialize = function (data) {
                return JSON.stringify(data);
            };

            proto.deserialize = function (value) {
                if (Assert.isTypeOf(value, 'string'))
                    return JSON.parse(value);
                return value;
            };

            return ctor;
        })(),
        /** 
         * Q promise provider class.
         * @class
         */
        QPromiseProvider: (function () {
            var ctor = function (Q) {
                baseTypes.PromiseProviderBase.call(this, 'Q Promise Provider');
                this.Q = Q;
            };
            helper.inherit(ctor, baseTypes.PromiseProviderBase);
            var proto = ctor.prototype;

            proto.deferred = function () {
                return this.Q.defer();
            };

            proto.getPromise = function (deferred) {
                return deferred.promise;
            };

            proto.resolve = function (deferred, data) {
                deferred.resolve(data);
            };

            proto.reject = function (deferred, error) {
                deferred.reject(error);
            };

            return ctor;
        })(),
        /** 
         * Angular.js promise provider.
         * @class
         */
        AngularjsPromiseProvider: (function () {
            var ctor = function (angularjs) {
                baseTypes.PromiseProviderBase.call(this, 'Angular.js Promise Provider');
                this.ng = angularjs.injector(['ng']);
                this.$q = this.ng.get('$q');
                this.$rootScope = this.ng.get('$rootScope');
            };
            helper.inherit(ctor, baseTypes.PromiseProviderBase);
            var proto = ctor.prototype;

            proto.deferred = function () {
                return this.$q.defer();
            };

            proto.getPromise = function (deferred) {
                return deferred.promise;
            };

            proto.resolve = function (deferred, data) {
                deferred.resolve(data);
                this.$rootScope.$apply();
            };

            proto.reject = function (deferred, error) {
                deferred.reject(error);
                this.$rootScope.$apply();
            };

            return ctor;
        })(),
        /** 
         * jQuery promise provider.
         * @class
         */
        JQueryPromiseProvider: (function () {
            var ctor = function ($) {
                baseTypes.PromiseProviderBase.call(this, 'jQuery Promise Provider');
                this.$ = $;
            };
            helper.inherit(ctor, baseTypes.PromiseProviderBase);
            var proto = ctor.prototype;

            proto.deferred = function () {
                return this.$.Deferred();
            };

            proto.getPromise = function (deferred) {
                return deferred.promise();
            };

            proto.resolve = function (deferred, data) {
                deferred.resolve(data);
            };

            proto.reject = function (deferred, error) {
                deferred.reject(error);
            };

            return ctor;
        })(),
        /** 
         * ES6 promise provider.
         * @class
         */
        Es6PromiseProvider: (function () {
            var ctor = function () {
                baseTypes.PromiseProviderBase.call(this, 'ES6 Promise Provider');
            };
            helper.inherit(ctor, baseTypes.PromiseProviderBase);
            var proto = ctor.prototype;

            proto.deferred = function () {
                var deferred = {
                    resolve: null,
                    reject: null
                };

                deferred.promise = new Promise(function (resolve, reject) {
                    deferred.resolve = resolve;
                    deferred.reject = reject;
                });

                return deferred;
            };

            proto.getPromise = function (deferred) {
                return deferred.promise;
            };

            proto.resolve = function (deferred, data) {
                deferred.resolve(data);
            };

            proto.reject = function (deferred, error) {
                deferred.reject(error);
            };

            return ctor;
        })()
    };

    /** 
     * Metadata types.
     * @namespace
     */
    var metadata = {
        /**
         * Represents a data (primitive) member.
         * @class
         */
        DataProperty: (function () {
            /**
             * @constructor
             * @param {EntityType} owner - Owner entity type.
             * @param {string} name - Name of the property.
             * @param {string} displayName - Value to use for displaying purposes.
             * @param {DataType} dataType - One of the supported Beetle data types.
             * @param {boolean} isNullable - Can be assigned with null or undefined.
             * @param {boolean} isKeyPart - Indicates if this property is one of the primary keys.
             * @param {generationPattern} genPattern - Auto generation strategy for the property (Identity, Computed, None).
             * @param {any} defaultValue - Default value for the property.
             * @param {boolean} useForConcurrency - When true, this property will be used together with keys for updates.
             */
            var ctor = function (owner, name, displayName, dataType, isNullable, isKeyPart, genPattern, defaultValue, useForConcurrency) {
                this.owner = owner;
                this.name = name;
                this.displayName = displayName || name;
                this.dataType = dataType;
                this.isNullable = isNullable;
                this.isKeyPart = isKeyPart;
                this.generationPattern = genPattern;
                this.defaultValue = defaultValue;
                this.useForConcurrency = useForConcurrency;
                this.relatedNavigationProperties = [];
                this.validators = [];
                this.isEnum = dataType instanceof core.dataTypes.enumeration;
                this.isComplex = dataType.isComplex;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.displayName;
            };

            /** Checks if given value is valid for this property. */
            proto.isValid = function (value) {
                if (value == null) return !this.isNullable;
                else return this.dataType.isValid(value, this);
            };

            /**
             * Tries to convert given value to this type.
             * @returns {any} When value is of this type returns the value, if not tries to convert the value to this type, throws an error if fails.
             */
            proto.handle = function (value) {
                if (this.dataType != core.dataTypes.string && value === "")
                    value = null;

                if (value == null) {
                    if (!this.isNullable)
                        throw helper.createError(i18N.notNullable, [this.displayName], { property: this });
                    return null;
                }
                value = this.dataType.handle(value, this);

                if (this.dataType == core.dataTypes.number && this.precision && value.toString().replace(/\./g, '').length > this.precision)
                    throw helper.createError(i18N.maxPrecisionError, [value, this.precision],
                        { dataType: dataType, value: value });
                if (this.dataType == core.dataTypes.number && this.scale != null) value = Number(value.toFixed(this.scale));

                return value;
            };

            /** Gets default value for this property. */
            proto.getDefaultValue = function () {
                if (this.defaultValue != null) return this.defaultValue;
                if (this.isNullable) return null;
                if (this.generationPattern == enums.generationPattern.Identity && this.isKeyPart === true) return this.dataType.autoValue();
                return this.dataType.defaultValue();
            };

            /**
             * Add new validation method to data property.
             * @param {string} name - Name of the validation.
             * @param {PredicateFunction} func - Validation function.
             * @param {string} message - Message to show when validation fails.
             * @param {any[]} args - Validator arguments.
             */
            proto.addValidation = function (name, func, message, args) {
                helper.assertPrm(name, 'name').isNotEmptyString().check();
                helper.assertPrm(func, 'func').isFunction().check();
                this.validators.push(new core.Validator(name, func, message, args));
            };

            /** 
             * Validates property for provided entity.
             * @param {Entity} entity - Beetle entity. Will be used in validation messages (otherwise we could have used only value).
             * @returns {ValidationError[]} Validation result array. Empty when property is valid.
             */
            proto.validate = function (entity) {
                var retVal = [];
                if (this.validators.length > 0) {
                    var that = this;
                    var value = helper.getValue(entity, this.name);
                    helper.forEach(this.validators, function (v) {
                        var result = v.validate(value, entity);
                        if (result) retVal.push(helper.createValidationError(entity, value, that, result, v));
                    });
                }
                return retVal;
            };

            return ctor;
        })(),
        /**
         * Represents a navigation (relation) member.
         * @class
         */
        NavigationProperty: (function () {
            /**
             * @constructor
             * @param {EntityType} owner - Owner entity type.
             * @param {string} name - Name of the property.
             * @param {string} displayName - Value to use for displaying purposes.
             * @param {string} entityTypeName - Related entity type name.
             * @param {boolean} isScalar - Indicates if this property is a reference or array.
             * @param {string} associationName - To be able to match two way relations. Same relations have same association name for both side.
             * @param {boolean} cascadeDelete - Indicates if deleting this related entity causes cascade deletion.
             * @param {string[]} foreignKeyNames - Foreign key names binding this relation.
             */
            var ctor = function (owner, name, displayName, entityTypeName, isScalar, associationName, cascadeDelete, foreignKeyNames) {
                this.owner = owner;
                this.name = name;
                this.displayName = displayName || name;
                this.entityTypeName = entityTypeName;
                this.entityType = null;
                this.isScalar = isScalar;
                this.isComplex = associationName === undefined;
                this.associationName = associationName;
                this.cascadeDelete = cascadeDelete === true;
                this.foreignKeyNames = foreignKeyNames || [];
                this.inverse = null;
                this.foreignKeys = [];
                this.validators = [];
                this.triggerOwnerModify = false;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.displayName;
            };

            /** Checks if given value can be assigned to this property. If not throws an error. */
            proto.checkAssign = function (value) {
                if (value == null) return;
                if (!value.$tracker) throw helper.createError(i18N.assignErrorNotEntity, [this], { property: this, value: value });
                var t = value.$tracker.entityType;
                if (!this.entityType.isAssignableWith(t)) throw helper.createError(i18N.assignError, [this.name, t.shortName], { property: this, value: value });
            };

            /**
             * Add new validation method to navigation property.
             * @param {string} name - Name of the validation.
             * @param {PredicateFunction} func - Validation function.
             * @param {string} message - Message to show when validation fails.
             * @param {any[]} args - Validator arguments.
             */
            proto.addValidation = function (name, func, message, args) {
                helper.assertPrm(name, 'name').isNotEmptyString().check();
                helper.assertPrm(func, 'func').isFunction().check();
                this.validators.push(new core.Validator(name, func, message, args));
            };

            /** 
             * Validates property for provided entity.
             * @param {Entity} entity - Beetle entity. Will be used in validation messages (otherwise we could have used only value).
             * @returns {ValidationError[]} Validation result array. Empty when property is valid.
             */
            proto.validate = function (entity) {
                var retVal = [];
                if (this.validators.length > 0) {
                    var that = this;
                    var value = helper.getValue(entity, that.name);
                    helper.forEach(this.validators, function (v) {
                        var result = v.validate(value);
                        if (result) retVal.push(helper.createValidationError(entity, value, that, result, v));
                    });
                }
                return retVal;
            };

            return ctor;
        })(),
        /**
         * Represents an entity type.
         * @class
         */
        EntityType: (function () {
            /**
             * @constructor
             * @param {string} name - Name of the property.
             * @param {string} displayName - Value to use for displaying purposes.
             * @param {string} shortName - Entity's short name.
             * @param {string[]} keyNames - Primary key names.
             * @param {string} baseTypeName - Name of the base types - if any.
             * @param {string} setName - Entity set name. If this Entity is derived from another, set name is the root entity's name.
             * @param {string} setTypeName - Entity set type name. If this Entity is derived from another, set type is the root entity's type.
             * @param {boolean} isComplexType - Indicates if this is a complex type.
             * @param {MetadataManager} metadataManager - Owner metadata manager.
             */
            var ctor = function (name, displayName, shortName, keyNames, baseTypeName, setName, setTypeName, isComplexType, metadataManager) {
                this.name = name;
                this.displayName = displayName || name;
                this.shortName = shortName;
                this.keyNames = keyNames || [];
                this.baseTypeName = baseTypeName;
                this.setName = setName;
                this.setTypeName = setTypeName;
                this.metadataManager = metadataManager;
                this.hasMetadata = metadataManager != null;
                this.properties = [];
                this.dataProperties = [];
                this.navigationProperties = [];
                this.keys = [];
                this.floorType = this;
                this.baseType = null;
                this.validators = [];
                this.isComplexType = isComplexType == true;
                this.constructor = null;
                this.initializer = null;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.name;
            };

            /**
             * Parses given string and finds property, looks recursively to navigation properties when needed.
             * @example
             *  if given path is OrderDetails.Supplier.Address.City,
             *  this method will look to related navigation properties until Address and it will retun City property as dataProperty (if exists).
             * @param {string} propertyPath - Path to desired property.
             * @returns {DataProperty|NavigationProperty} When found data or navigation property, otherwise null.
             */
            proto.getProperty = function (propertyPath) {
                return getProperty(propertyPath.split('.'), this);
            };

            /**
             * Creates a new query for this type.
             * @param {string} resourceName - Server resource name to combine with base uri.
             * @param {EntityManager=} manager - Entity manager.
             */
            proto.createQuery = function (resourceName, manager) {
                if (resourceName) return new querying.EntityQuery(resourceName, this, manager);

                var q = new querying.EntityQuery(this.setName, this, manager);
                return this.shortName == this.setTypeName ? q : q.ofType(this.shortName);
            };

            /**
             * Register constructor and initializer (optional) for the type.
             * @param {Function} constructor - Constructor function. Called right after the entity object is generated.
             * @param {Function} initializer - Initializer function. Called after entity started to being tracked (properties converted to observable).
             */
            proto.registerCtor = function (constructor, initializer) {
                if (constructor != null)
                    helper.assertPrm(constructor, 'constructor').isFunction().check();
                if (initializer != null)
                    helper.assertPrm(initializer, 'initializer').isFunction().check();
                this.constructor = constructor;
                this.initializer = initializer;
            };

            /**
             * Creates an entity for this type.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity with observable properties. 
             */
            proto.createEntity = function (initialValues) {
                var result = this.createRawEntity(initialValues);
                // make it observable
                return core.EntityTracker.toEntity(result, this, settings.getObservableProvider());
            };

            /**
             * Creates a raw entity for this type.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity without observable properties. 
             */
            proto.createRawEntity = function (initialValues) {
                var result = initialValues || {};
                // create properties with default values for each data property defined in metadata.
                helper.forEach(this.dataProperties, function (dp) {
                    if (result[dp.name] === undefined)
                        result[dp.name] = dp.getDefaultValue();
                });
                // create properties with default values for each navigation property defined in metadata.
                helper.forEach(this.navigationProperties, function (np) {
                    if (np.isComplex)
                        result[np.name] = np.entityType.createRawEntity();
                    else {
                        if (np.isScalar) result[np.name] = null;
                        else result[np.name] = [];
                    }
                });
                callCtor(this, result);
                result.$type = this.name;
                return result;
            };

            function callCtor(type, entity) {
                if (type.baseType) callCtor(type.baseType, entity);
                if (type.constructor)
                    type.constructor.call(entity, entity);
            }

            /** Checks if this type can be set with given type. */
            proto.isAssignableWith = function (otherType) {
                return isAssignableWith(this, otherType);
            };

            /** Checks if this type can be set to given type. */
            proto.isAssignableTo = function (otherType) {
                return isAssignableTo(this, otherType);
            };

            /** 
             * Checks if this type and given type has common ancestor.
             * This method is used to check key violation between different types.
             */
            proto.hasSameBaseType = function (type) {
                return this.floorType.name === type.floorType.name;
            };

            /**
             * Adds new dataProperty to this type.
             * @param {string} name - Name of the property.
             * @param {string} displayName - Display name of the property.
             * @param {DataType} dataType - Data type for the property.
             * @param {boolean} isNullable - Indicates if this property can be assigned with null.
             * @param {any} defaultValue - Default value
             */
            proto.addDataProperty = function (name, displayName, dataType, isNullable, defaultValue) {
                helper.assertPrm(name, 'name').isNotEmptyString().check();
                var dp = helper.findInArray(this.dataProperties, name, 'name');
                if (dp)
                    throw helper.createError(i18N.dataPropertyAlreadyExists, [name], { entityType: this, existing: dp });
                if (Assert.isNotEmptyString(dataType))
                    dataType = core.dataTypes.byName(dataType);
                helper.assertPrm(dataType, 'dataType').isInstanceOf(core.dataTypes.baseType).check();
                if (defaultValue != null && !dataType.isValid(defaultValue))
                    throw helper.createError(i18N.invalidDefaultValue, [defaultValue, dataType.name],
                        { entityType: this, dataType: dataType, defaultValue: defaultValue });
                var property = new metadata.DataProperty(this, name, displayName, dataType, isNullable === true, false, null, defaultValue);
                this.dataProperties.push(property);
            };

            /**
             * Add new validation method to entity type.
             * @param {string} name - Name of the validation.
             * @param {PredicateFunction} func - Validation function.
             * @param {string} message - Message to show when validation fails.
             * @param {any[]} args - Validator arguments.
             */
            proto.addValidation = function (name, func, message, args) {
                helper.assertPrm(name, 'name').isNotEmptyString().check();
                helper.assertPrm(func, 'func').isFunction().check();
                this.validators.push(new core.Validator(name, func, message, args));
            };

            /** 
             * Validates type for provided entity.
             * @param {Entity} entity - Beetle entity. Will be used in validation messages (otherwise we could have used only value).
             * @returns {ValidationError[]} Validation result array. Empty when property is valid.
             */
            proto.validate = function (entity) {
                var retVal = [];
                if (this.validators.length > 0) {
                    helper.forEach(this.validators, function (v) {
                        var result = v.validate(entity);
                        if (result) retVal.push(helper.createValidationError(entity, null, null, result, v));
                    });
                }
                helper.forEach(this.dataProperties, function (dp) {
                    var result = dp.validate(entity);
                    if (result) retVal = retVal.concat(result);
                });
                helper.forEach(this.navigationProperties, function (np) {
                    var result = np.validate(entity);
                    if (result) retVal = retVal.concat(result);
                });
                return retVal;
            };

            function getProperty(propertyPaths, type) {
                var len = propertyPaths.length;
                for (var i = 0; i < len; i++) {
                    var p = propertyPaths[i];
                    if (i == len - 1) {
                        // if it is last property path, look it in all properties.
                        var dp = helper.findInArray(type.dataProperties, p, 'name');
                        return dp ? dp : helper.findInArray(type.navigationProperties, p, 'name');
                    } else {
                        // if it is not last property path, look it in navigation properties.
                        var np = helper.findInArray(type.navigationProperties, p, 'name');
                        if (np) type = np.entityType;
                        else return null;
                    }
                }
                return null;
            }

            function isAssignableWith(type1, type2) {
                if (type1.name === type2.name)
                    return true;
                else if (type2.baseType != null)
                    return isAssignableWith(type1, type2.baseType);

                return false;
            }

            function isAssignableTo(type1, type2) {
                var name = Assert.isTypeOf(type2, 'string') ? type2 : type2.name;
                if (type1.name === name)
                    return true;
                else if (type1.baseType != null)
                    return isAssignableTo(type1.baseType, type2);

                return false;
            }

            return ctor;
        })(),
        /**
         * Metadata container.
         * @class
         */
        MetadataManager: (function () {
            /**
             * @constructor
             * @param {string|Object} metadataPrm - [Metadata Object] or [Metadata string]
             */
            var ctor = function (metadataPrm) {
                this.types = [];
                this.typesDict = {};
                this.enums = {};
                this.name = null;
                this.displayName = null;

                if (metadataPrm)
                    this.parseBeetleMetadata(metadataPrm);
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.types.join(', ');
            };

            /**
             * Finds entity type by given entity type name (fully qualified).
             * @param {string} typeName - Full type name.
             * @param {boolean=} throwIfNotFound - Throws an error if given type name could not be found in cache.
             * @returns {EntityType}
             */
            proto.getEntityTypeByFullName = function (typeName, throwIfNotFound) {
                var type = helper.findInArray(this.types, typeName, 'name');
                if (!type && throwIfNotFound === true)
                    throw helper.createError(i18N.notFoundInMetadata, [typeName], { metadataManager: this, typeName: typeName });
                return type;
            };

            /**
             * Finds entity type by given entity type short name (only class name).
             * @param {string} shortName - Short type name.
             * @param {boolean=} throwIfNotFound - Throws an error if given type name could not be found in cache.
             * @returns {EntityType}
             */
            proto.getEntityType = function (shortName, throwIfNotFound) {
                if (Assert.isFunction(shortName)) shortName = helper.getFuncName(shortName);
                var type = this.typesDict[shortName];
                if (!type && throwIfNotFound === true)
                    throw helper.createError(i18N.notFoundInMetadata, [shortName], { metadataManager: this, typeShortName: shortName });
                return type;
            };

            /**
             * Creates a new query for this type.
             * @param {string} resourceName - Server resource name to combine with base uri.
             * @param {string=} shortName - Short type name.
             * @param {EntityManager=} manager - Entity manager.
             */
            proto.createQuery = function (resourceName, shortName, manager) {
                if (Assert.isFunction(shortName)) shortName = helper.getFuncName(shortName);
                // if shortName is given find entityType and create query for it.
                if (shortName) return this.getEntityType(shortName, true).createQuery(resourceName, manager);
                // try to find entity type by its resource (set) name.
                var typeList = helper.filterArray(this.types, function (item) { return item.setName == resourceName; });
                return typeList.length == 1 ? typeList[0].createQuery(resourceName, manager) : new querying.EntityQuery(resourceName, null, manager);
            };

            /**
             * Register constructor and initializer (optional) for the type.
             * @param {string} shortName - Short type name.
             * @param {Function=} constructor - Constructor function. Called right after the entity object is generated.
             * @param {Function=} initializer - Initializer function. Called after entity started to being tracked (properties converted to observable).
             */
            proto.registerCtor = function (shortName, constructor, initializer) {
                if (Assert.isFunction(shortName)) shortName = helper.getFuncName(shortName);
                var type = this.getEntityType(shortName, true);
                type.registerCtor(constructor, initializer);
            };

            /**
             * Creates an entity for this type.
             * @param {string} shortName - Short type name.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity with observable properties. 
             */
            proto.createEntity = function (shortName, initialValues) {
                if (Assert.isFunction(shortName)) shortName = helper.getFuncName(shortName);
                // find entity type.
                var type = this.getEntityType(shortName, true);
                // create entity for this type
                return type.createEntity(initialValues);
            };

            /**
             * Creates a raw entity for this type.
             * @param {string} shortName - Short type name.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity without observable properties. 
             */
            proto.createRawEntity = function (shortName, initialValues) {
                if (Assert.isFunction(shortName)) shortName = helper.getFuncName(shortName);
                // find entity type.
                var type = this.getEntityType(shortName, true);
                // create entity for this type
                return type.createRawEntity(initialValues);
            };

            /**
             * Imports metadata from given parameter.
             * @param {string|Object} metadataPrm - [Metadata Object] or [Metadata string]
             */
            proto.parseBeetleMetadata = function (metadataPrm) {
                if (Assert.isTypeOf(metadataPrm, 'string'))
                    metadataPrm = JSON.parse(metadataPrm);

                this.types = [];
                this.typesDict = {};
                this.enums = {};
                this.name = metadataPrm.n;
                this.displayName = helper.getResourceValue(metadataPrm.r, metadataPrm.l || metadataPrm.n);

                var es = metadataPrm.e;
                var enumTypes = {};
                if (es) {
                    for (var i = 0; i < es.length; i++) {
                        var e = es[i];
                        var enumObj = {};
                        helper.forEach(e.m, function (m) {
                            enumObj[m.n] = { name: m.n, value: m.v, displayName: helper.getResourceValue(m.r, m.l || m.n) };
                        });
                        var enm = new libs.Enum(enumObj);
                        this.enums[e.n] = enm;
                        enumTypes[e.n] = new core.dataTypes.enumeration(enm, e.n, helper.getResourceValue(e.r, e.l || e.n));
                    }
                }

                var that = this;
                var maps = metadataPrm.m;
                // first create an entityType for each entity.
                for (var j = 0; j < maps.length; j++) {
                    var map = maps[j];
                    var t = new metadata.EntityType(map.n, helper.getResourceValue(map.rn, map.s), map.s, map.k, map.b, map.q, map.t, map.c, this);
                    // create data properties
                    helper.forEach(map.d, function (dp) {
                        var dataType;
                        if (dp.e)
                            dataType = enumTypes[dp.t];
                        else
                            dataType = core.dataTypes.byName(dp.t);
                        var dn = helper.getResourceValue(dp.r, dp.l || dp.n);
                        var property = new metadata.DataProperty(t, dp.n, dn, dataType, dp.i === true, map.k && helper.findInArray(map.k, dp.n) != null,
                            dp.g ? (dp.g == "I" ? enums.generationPattern.Identity : enums.generationPattern.Computed) : null,
                            dp.d ? dataType.handle(dp.d) : null, dp.c);
                        if (dp.v)
                            helper.forEach(dp.v, function (v) {
                                property.validators.push(core.Validator.byCode(v.t, v.a, v.m, v.r, property.displayName, dp.r));
                            });
                        if (dp.p) property.precision = Number(dp.p);
                        if (dp.s) property.scale = Number(dp.s);
                        t.dataProperties.push(property);
                    });
                    // create navigation properties
                    var relations = map.r;
                    if (relations)
                        helper.forEach(relations, function (np) {
                            var navProp = new metadata.NavigationProperty(t, np.n, helper.getResourceValue(np.r, np.l || np.n), np.t, np.s === true, np.a, np.c);
                            if (np.f)
                                helper.forEach(np.f, function (fk) {
                                    navProp.foreignKeyNames.push(fk);
                                });
                            if (np.v)
                                helper.forEach(np.v, function (v) {
                                    navProp.validators.push(core.Validator.byCode(v.t, v.a, v.m, v.r, navProp.displayName, np.r));
                                });
                            t.navigationProperties.push(navProp);
                        });
                    var complex = map.x;
                    if (complex)
                        helper.forEach(complex, function (cp) {
                            var property = new metadata.NavigationProperty(t, cp.n, helper.getResourceValue(cp.r, cp.l || cp.n), cp.t, true);
                            t.navigationProperties.push(property);
                        });
                    this.types.push(t);
                    this.typesDict[t.shortName] = t;
                }

                // then create relation between inherited entities.
                helper.forEach(this.types, function (type) {
                    if (type.baseTypeName)
                        type.baseType = that.getEntityType(type.baseTypeName, true);
                    delete type.baseTypeName;
                });
                // fill inherited properties using base type informations.
                helper.forEach(this.types, function (type) {
                    var base = type.baseType;
                    while (base) {
                        type.floorType = base;
                        helper.forEach(base.dataProperties, function (dp) {
                            if (!helper.findInArray(type.dataProperties, dp.name, "name")) {
                                type.dataProperties.push(dp);
                            }
                        });
                        helper.forEach(base.navigationProperties, function (np) {
                            if (!helper.findInArray(type.navigationProperties, np.name, "name")) {
                                type.navigationProperties.push(np);
                            }
                        });
                        base = base.baseType;
                    }
                    // populate navigation properties inverse and create relation between data property and navigation property
                    helper.forEach(type.navigationProperties, function (np) {
                        if (!np.entityType) {
                            np.entityType = that.getEntityType(np.entityTypeName, true);
                            for (var k = 0; k < np.entityType.navigationProperties.length; k++) {
                                var tnp = np.entityType.navigationProperties[k];
                                if (tnp.associationName === np.associationName && np !== tnp) {
                                    np.inverse = tnp;
                                    break;
                                }
                            }
                        }
                        helper.forEach(np.foreignKeyNames, function (fkName) {
                            if (!helper.findInArray(np.foreignKeys, fkName, 'name')) {
                                var dp = helper.findInArray(type.dataProperties, fkName, 'name');
                                if (dp) {
                                    dp.relatedNavigationProperties.push(np);
                                    np.foreignKeys.push(dp);
                                }
                            }
                        });
                    });
                    // find keys from data properties. When using inheritance key property lives in base (floor) entity.
                    // so we could not find that until we fill inherited properties.
                    helper.forEach(type.keyNames, function (keyName) {
                        type.keys.push(helper.findInArray(type.dataProperties, keyName, 'name'));
                    });
                });
            };

            return ctor;
        })()
    };

    /** 
     * Querying related types.
     * @namespace
     */
    var querying = (function () {

        (function queryFuncExtensions() {
            /** add missing query functions */
            if (!String.prototype.hasOwnProperty("substringOf")) {
                String.prototype.substringOf = function (source) {
                    return Assert.isNotEmptyString(source) && source.indexOf(this) >= 0;
                }
            }
            if (!String.prototype.hasOwnProperty("startsWith")) {
                String.prototype.startsWith = function (other) {
                    return this.indexOf(other) == 0;
                }
            }
            if (!String.prototype.hasOwnProperty("endsWith")) {
                String.prototype.endsWith = function (other) {
                    return this.indexOf(other) == (this.length - other.length);
                }
            }
            if (!Number.prototype.hasOwnProperty("round")) {
                Number.prototype.round = function () {
                    return Math.round(this);
                }
            }
            if (!Number.prototype.hasOwnProperty("ceiling")) {
                Number.prototype.ceiling = function () {
                    return Math.ceil(this);
                }
            }
            if (!Number.prototype.hasOwnProperty("floor")) {
                Number.prototype.floor = function () {
                    return Math.floor(this);
                }
            }
        })();

        /** 
         * Supported query expressions.
         * Each query call will be collected as expressions and will be evaluated later.
         */
        return {
            /** 
             * Linq like expressions to filter, order etc. arrays and server resources. Used by queries.
             * @namespace
             */
            expressions: {
                OfTypeExp: (function () {
                    var ctor = function (typeName) {
                        if (Assert.isFunction(typeName)) typeName = helper.getFuncName(typeName);
                        baseTypes.ExpressionBase.call(this, 'oftype', -1, true, true);
                        this.typeName = typeName;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.toBeetleQuery = function () {
                        return this.typeName;
                    };

                    proto.clone = function () {
                        return new ctor(this.typeName);
                    };

                    proto.execute = function (array) {
                        var that = this;
                        return helper.filterArray(array, function (item) {
                            return item && ((item.$tracker && item.$tracker.entityType.isAssignableTo(that.typeName)) || (typeof item === that.typeName));
                        });
                    };

                    return ctor;
                })(),
                WhereExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'filter', 2, false, false);

                        this.exp = exp;
                        this.varContext = varContext;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                        return helper.filterArray(array, predicate);
                    };

                    return ctor;
                })(),
                OrderByExp: (function () {
                    var defaultExp = 'x => x';
                    var ctor = function (exp, isDesc) {
                        baseTypes.ExpressionBase.call(this, 'orderby', 1, false, false);

                        this.exp = exp || defaultExp;
                        this.isDesc = isDesc || false;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.isDesc);
                    };

                    proto.toODataQuery = function (queryContext) {
                        var exp = Assert.isFunction(this.exp) ? helper.funcToLambda(this.exp).replace(" as ", " ") : this.exp;
                        if (this.isDesc) exp = invertExp(exp);

                        return helper.jsepToODataQuery(libs.jsep(exp), queryContext);
                    };

                    proto.toBeetleQuery = function (queryContext) {
                        if (!this.exp) return '';

                        var exp = Assert.isFunction(this.exp) ? helper.funcToLambda(this.exp).replace(" as ", " ") : this.exp;
                        if (this.isDesc) exp = invertExp(exp);

                        return helper.jsepToBeetleQuery(libs.jsep(exp), queryContext);
                    };

                    proto.execute = function (array, queryContext) {
                        var expStr;
                        if (Assert.isFunction(this.exp)) {
                            var that = this;
                            if (this.exp.length == 2) {
                                return array.sort(function (a, b) {
                                    var r = that.exp(a, b);
                                    return that.isDesc ? (-1 * r) : r;
                                });
                            }
                            else expStr = helper.funcToLambda(this.exp).replace(/ as /g, " ");
                        } else expStr = this.exp;

                        var comparers = [];
                        var expr = libs.jsep(expStr);
                        var exps = expr.type == 'Compound' ? expr.body : [expr];
                        var alias;
                        if (exps[0].operator == '=>') {
                            alias = {};
                            alias.alias = exps[0].left.name;
                            queryContext.aliases = [alias];
                            exps[0] = exps[0].right;
                        }
                        for (var i = 0; i < exps.length; i++) {
                            var isDesc = false;
                            var exp = exps[i];
                            var nexp = exps[i + 1];
                            if (nexp && nexp.type == 'Identifier') {
                                var ls = nexp.name.toLowerCase();
                                if (ls == 'desc') {
                                    isDesc = true;
                                    i++;
                                } else if (ls == 'asc') i++;
                            }
                            isDesc = isDesc != this.isDesc;
                            var comparer = (function (e, desc) {
                                return function (object1, object2) {
                                    var f = helper.jsepToFunction(e, queryContext);
                                    if (alias) alias.value = object1;
                                    var value1 = f(object1);
                                    if (alias) alias.value = object2;
                                    var value2 = f(object2);

                                    if (typeof value1 === "string" && typeof value2 === "string") {
                                        var cmp = value1.localeCompare(value2);
                                        return desc ? (cmp * -1) : cmp;
                                    }

                                    if (value1 == value2)
                                        return 0;
                                    else if (value1 > value2)
                                        return desc ? -1 : 1;
                                    else
                                        return desc ? 1 : -1;
                                };
                            })(exp, isDesc);
                            comparers.push(comparer);
                        }
                        var retVal = new Array();
                        retVal.push.apply(retVal, array);
                        return retVal.sort(function (object1, object2) {
                            for (var j = 0; j < comparers.length; j++) {
                                var result = comparers[j](object1, object2);
                                if (result != 0)
                                    return result;
                            }
                            return 0;
                        });
                    };

                    function invertExp(exp) {
                        exp += ',';
                        exp = exp.replace(/\,/, ' ,').replace(/ desc.*?\,/g, ' x,')
                            .replace(/ \,/g, ' desc,').replace(/ x\,/g, ',');
                        return exp.substr(0, exp.length - 1);
                    }

                    return ctor;
                })(),
                ExpandExp: (function () {
                    var ctor = function (exp) {
                        baseTypes.ExpressionBase.call(this, 'expand', 1, false, false);
                        this.exp = exp;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp);
                    };

                    proto.execute = function (array, queryContext) {
                        return array; // do nothing for local queries.
                    };

                    return ctor;
                })(),
                SelectExp: (function () {
                    var ctor = function (exp) {
                        baseTypes.ExpressionBase.call(this, 'select', 2, false, true);
                        this.exp = exp;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp);
                    };

                    proto.execute = function (array, queryContext) {
                        if (Assert.isFunction(this.exp)) return helper.mapArray(array, this.exp);
                        return helper.runSelectExp(array, this.exp, queryContext);
                    };

                    return ctor;
                })(),
                SkipExp: (function () {
                    var ctor = function (count) {
                        baseTypes.ExpressionBase.call(this, 'skip', 2, false, false);
                        this.count = count;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.toODataQuery = function () {
                        return this.count;
                    };

                    proto.toBeetleQuery = function () {
                        return this.count;
                    };

                    proto.clone = function () {
                        return new ctor(this.count);
                    };

                    proto.execute = function (array) {
                        return array.slice(this.count);
                    };

                    return ctor;
                })(),
                TopExp: (function () {
                    var ctor = function (count) {
                        baseTypes.ExpressionBase.call(this, 'top', 2, false, false);
                        this.count = count;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.toODataQuery = function () {
                        return this.count;
                    };

                    proto.toBeetleQuery = function () {
                        return this.count;
                    };

                    proto.clone = function () {
                        return new ctor(this.count);
                    };

                    proto.execute = function (array) {
                        return array.slice(0, this.count);
                    };

                    return ctor;
                })(),
                GroupByExp: (function () {
                    var ctor = function (keySelector, elementSelector) {
                        baseTypes.ExpressionBase.call(this, 'groupby', 3, true, true);

                        this.keySelector = keySelector;
                        this.elementSelector = elementSelector;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.toBeetleQuery = function (queryContext) {
                        var retVal = '';
                        if (this.keySelector) {
                            var ks = Assert.isFunction(this.keySelector) ? helper.funcToLambda(this.keySelector) : this.keySelector;
                            retVal += helper.jsepToBeetleQuery(libs.jsep(ks), queryContext);
                        }
                        if (this.elementSelector) {
                            var es = Assert.isFunction(this.elementSelector) ? helper.funcToLambda(this.elementSelector) : this.elementSelector;
                            retVal += ';' + helper.jsepToBeetleQuery(libs.jsep(es), queryContext);
                        }
                        return retVal;
                    };

                    proto.clone = function () {
                        return new ctor(this.keySelector, this.elementSelector);
                    };

                    proto.execute = function (array, queryContext) {
                        var groups = [];
                        if (this.keySelector) {
                            // project keys
                            var keys = Assert.isFunction(this.keySelector)
                                ? helper.mapArray(array, this.keySelector)
                                : helper.runSelectExp(array, this.keySelector, queryContext);

                            for (var i = 0; i < keys.length; i++) {
                                var keyGroup = null;
                                var key = keys[i];
                                for (var j = 0; j < groups.length; j++) {
                                    // find if there is already a key with same values
                                    var group = groups[j];
                                    if (helper.objEquals(group.Key, key)) {
                                        keyGroup = group;
                                        break;
                                    }
                                }
                                // if key not found create one group for this key
                                if (!keyGroup) {
                                    keyGroup = { Key: key, Items: [] };
                                    groups.push(keyGroup);
                                }
                                keyGroup.Items.push(array[i]);
                            }
                        }
                        else groups.push({ Key: null, Items: array });

                        if (this.elementSelector) {
                            var projector;
                            if (Assert.isFunction(this.elementSelector))
                                projector = this.elementSelector;
                            else {
                                var es = libs.jsep(this.elementSelector);
                                var exps = es.type == 'Compound' ? es.body : [es];
                                projector = helper.jsepToProjector(exps, queryContext);
                            }
                            helper.forEach(groups, function (g, k) {
                                var items = g.Items;
                                items.Key = g.Key;
                                var result = projector(g.Items);
                                groups[k] = result;
                            });
                        }

                        return groups;
                    };

                    return ctor;
                })(),
                DistinctExp: (function () {
                    var ctor = function (exp) {
                        baseTypes.ExpressionBase.call(this, 'distinct', 3, true, true);
                        this.exp = exp;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp);
                    };

                    proto.execute = function (array, queryContext) {
                        if (!this.exp) return getDistincts(array);
                        if (Assert.isFunction(this.exp)) return getDistincts(helper.mapArray(array, this.exp));
                        return getDistincts(helper.runSelectExp(array, this.exp, queryContext));
                    };

                    function getDistincts(array) {
                        var distincts = [];
                        helper.forEach(array, function (item) {
                            var found = false;
                            for (var i = 0; i < distincts.length; i++) {
                                if (helper.objEquals(distincts[i], item)) {
                                    found = true;
                                    break;
                                }
                            }
                            if (found === false)
                                distincts.push(item);
                        });
                        return distincts;
                    }

                    return ctor;
                })(),
                ReverseExp: (function () {
                    var ctor = function () {
                        baseTypes.ExpressionBase.call(this, 'reverse', 3, true, false);
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.toBeetleQuery = function () {
                        return '';
                    };

                    proto.clone = function () {
                        return new ctor();
                    };

                    proto.execute = function (array) {
                        return array.reverse();
                    };

                    return ctor;
                })(),
                SelectManyExp: (function () {
                    var ctor = function (exp) {
                        baseTypes.ExpressionBase.call(this, 'selectMany', 3, true, true);
                        this.exp = exp;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp);
                    };

                    proto.execute = function (array, queryContext) {
                        if (array.length == 0) return array;

                        if (Assert.isFunction(this.exp)) return getMany(array, this.exp);
                        return getMany(array, helper.jsepToFunction(libs.jsep(this.exp), queryContext));
                    };

                    function getMany(array, projector) {
                        if (array.length == 0) return array;
                        var projections = [];
                        for (var j = 0; j < array.length; j++) {
                            var arr = projector(array[j]);
                            projections = projections.concat.apply(projections, arr);
                        }
                        return projections;
                    };

                    return ctor;
                })(),
                SkipWhileExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'skipWhile', 3, true, false);
                        this.exp = exp;
                        this.varContext = varContext;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);

                        var i = 0;
                        while (predicate(array[i]) == true) i++;
                        return array.slice(i + 1);
                    };

                    return ctor;
                })(),
                TakeWhileExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'takeWhile', 3, true, false);
                        this.exp = exp;
                        this.varContext = varContext;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);

                        var i = 0;
                        while (predicate(array[i]) == true) i++;
                        return array.slice(0, i);
                    };

                    return ctor;
                })(),
                AllExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;all', 3, true, true);
                        this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                        return querying.queryFuncs.all.impl(array, function () { return array; }, predicate);
                    };

                    return ctor;
                })(),
                AnyExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;any', 3, true, true);
                        if (exp)
                            this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        if (this.exp) {
                            var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                            return querying.queryFuncs.any.impl(array, function () { return array; }, predicate);
                        }
                        return array.length > 0;
                    };

                    return ctor;
                })(),
                AvgExp: (function () {
                    var ctor = function (exp) {
                        baseTypes.ExpressionBase.call(this, 'exec;avg', 3, true, true);
                        if (exp)
                            this.exp = exp;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp);
                    };

                    proto.execute = function (array, queryContext) {
                        var selector;
                        if (this.exp) {
                            selector = Assert.isFunction(this.exp)
                                ? this.exp
                                : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                        } else {
                            selector = function (v) { return v; };
                        }
                        return querying.queryFuncs.avg.impl(array, function () { return array; }, selector);
                    };

                    return ctor;
                })(),
                MaxExp: (function () {
                    var ctor = function (exp) {
                        baseTypes.ExpressionBase.call(this, 'exec;max', 3, true, true);
                        if (exp)
                            this.exp = exp;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp);
                    };

                    proto.execute = function (array, queryContext) {
                        var selector;
                        if (this.exp) {
                            selector = Assert.isFunction(this.exp)
                                ? this.exp
                                : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                        } else {
                            selector = function (v) { return v; };
                        }
                        return querying.queryFuncs.max.impl(array, function () { return array; }, selector);
                    };

                    return ctor;
                })(),
                MinExp: (function () {
                    var ctor = function (exp) {
                        baseTypes.ExpressionBase.call(this, 'exec;min', 3, true, true);
                        if (exp)
                            this.exp = exp;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp);
                    };

                    proto.execute = function (array, queryContext) {
                        var selector;
                        if (this.exp) {
                            selector = Assert.isFunction(this.exp)
                                ? this.exp
                                : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                        } else {
                            selector = function (v) { return v; };
                        }
                        return querying.queryFuncs.min.impl(array, function () { return array; }, selector);
                    };

                    return ctor;
                })(),
                SumExp: (function () {
                    var ctor = function (exp) {
                        baseTypes.ExpressionBase.call(this, 'exec;sum', 3, true, true);
                        if (exp)
                            this.exp = exp;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp);
                    };

                    proto.execute = function (array, queryContext) {
                        var selector;
                        if (this.exp) {
                            selector = Assert.isFunction(this.exp)
                                ? this.exp
                                : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                        } else {
                            selector = function (v) { return v; };
                        }
                        return querying.queryFuncs.sum.impl(array, function () { return array; }, selector);
                    };

                    return ctor;
                })(),
                CountExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;count', 3, true, true);
                        if (exp)
                            this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        if (this.exp) {
                            var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                            return helper.filterArray(array, predicate).length
                        }
                        return array.length;
                    };

                    return ctor;
                })(),
                FirstExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;first', 3, true, false);
                        if (exp)
                            this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        if (this.exp) {
                            var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                            array = helper.filterArray(array, predicate);
                        }
                        if (array.length == 0) throw helper.createError(i18N.arrayEmpty, { array: array, expression: this });
                        return array[0];
                    };

                    return ctor;
                })(),
                FirstOrDefaultExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;firstOD', 3, true, false);
                        if (exp)
                            this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        if (this.exp) {
                            var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                            array = helper.filterArray(array, predicate);
                        }
                        return array.length == 0 ? null : array[0];
                    };

                    return ctor;
                })(),
                SingleExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;single', 3, true, false);
                        if (exp)
                            this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        if (this.exp) {
                            var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                            array = helper.filterArray(array, predicate);
                        }
                        if (array.length != 1) throw helper.createError(i18N.arrayNotSingle, { array: array, expression: this });
                        return array[0];
                    };

                    return ctor;
                })(),
                SingleOrDefaultExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;singleOD', 3, true, false);
                        if (exp)
                            this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        if (this.exp) {
                            var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                            array = helper.filterArray(array, predicate);
                        }
                        if (array.length > 1) throw helper.createError(i18N.arrayNotSingleOrEmpty, { array: array, expression: this });
                        return array.length == 0 ? null : array[0];
                    };

                    return ctor;
                })(),
                LastExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;last', 3, true, false);
                        if (exp)
                            this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        if (this.exp) {
                            var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                            array = helper.filterArray(array, predicate);
                        }
                        if (array.length == 0) throw helper.createError(i18N.arrayEmpty, { array: array, expression: this });
                        return array[array.length - 1];
                    };

                    return ctor;
                })(),
                LastOrDefaultExp: (function () {
                    var ctor = function (exp, varContext) {
                        baseTypes.ExpressionBase.call(this, 'exec;lastOD', 3, true, false);
                        if (exp)
                            this.exp = exp;
                        this.varContext = varContext;
                        this.isExecuter = true;
                    };
                    helper.inherit(ctor, baseTypes.ExpressionBase);
                    var proto = ctor.prototype;

                    proto.clone = function () {
                        return new ctor(this.exp, this.varContext);
                    };

                    proto.execute = function (array, queryContext) {
                        if (this.exp) {
                            var predicate = Assert.isFunction(this.exp) ? this.exp : helper.jsepToFunction(libs.jsep(this.exp), queryContext);
                            array = helper.filterArray(array, predicate);
                        }
                        return array.length == 0 ? null : array[array.length - 1];
                    };

                    return ctor;
                })()
            },
            /** 
             * Supported query functions. When a query has one of these in an expression, functions will be executed dynamically for local queries.
             * @namespace
             */
            queryFuncs: (function () {

                var expose = {};

                /** Returns uppercase value. */
                expose.toupper = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'toupper', 'ToUpper', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source) {
                        return (source ? source(value) : value).toUpperCase();
                    };

                    return new ctor();
                })();
                expose.touppercase = expose.toupper;
                /** Returns lowercase value. */
                expose.tolower = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'tolower', 'ToLower', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source) {
                        return (source ? source(value) : value).toLowerCase();
                    };

                    return new ctor();
                })();
                expose.tolowercase = expose.tolower;
                /** Returns substring of given string. */
                expose.substring = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'substring', 'Substring', 3);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source, pos, length) {
                        if (arguments.length == 3) {
                            length = pos;
                            pos = source;
                            source = value;
                        } else source = source(value);
                        pos = pos(value);
                        length = length(value);
                        var end = Number(pos) + Number(length);
                        return source && source.substring(pos, end);
                    };

                    return new ctor();
                })();
                /** When given value contains given find string returns true, otherwise returns false. */
                expose.substringof = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'substringof', 'Contains', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (find, source) {
                        source = source ? source + '.' : '';
                        return source + 'Contains(' + find + ')';
                    };

                    proto.impl = function (value, find, source) {
                        source = (source ? source(value) : value);
                        source = helper.handleStrOptions(source, this.varContext);
                        find = helper.handleStrOptions(find(value), this.varContext);
                        return source ? source.indexOf(find) >= 0 : false;
                    };

                    return new ctor();
                })();
                /** Returns length of string. */
                expose.length = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'length', 'Length', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        source = source ? source + '.' : '';
                        return source + 'Length';
                    };

                    proto.impl = function (value, source) {
                        return (source ? source(value) : value).length;
                    };

                    return new ctor();
                })();
                /** Returns trimmed string. */
                expose.trim = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'trim', 'Trim', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source) {
                        return (source ? source(value) : value).trim();
                    };

                    return new ctor();
                })();
                /** Returns concatenated string. */
                expose.concat = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'concat', 'Concat', null);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function () {
                        return 'string.Concat(' + Array.prototype.slice.call(arguments).join(', ') + ')';
                    };

                    proto.impl = function (value) {
                        var s1 = arguments[1](value).toString();
                        var argList = Array.prototype.slice.call(arguments, 2);
                        var args = [];
                        for (var i = 0; i < argList.length; i++) {
                            args.push(argList[i](value));
                        }
                        return s1.concat.apply(s1, args);
                    };

                    return new ctor();
                })();
                /**  Replace string from source with given value. */
                expose.replace = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'replace', 'Replace', 3);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source, find, replace) {
                        if (arguments.length == 3) {
                            replace = find;
                            find = source;
                            source = value;
                        } else source = source(value);
                        find = find(value);

                        if (helper.ignoreWhiteSpaces(this.varContext))
                            find = find.trim();
                        if (!helper.isCaseSensitive(this.varContext))
                            find = new RegExp(find, 'gi');
                        return source.replace(find, replace(value));
                    };

                    return new ctor();
                })();
                /** if source string starts with given parameter returns true, otherwise false. */
                expose.startswith = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'startswith', 'StartsWith', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source, find) {
                        if (arguments.length == 2) {
                            find = source;
                            source = value;
                        } else source = source(value);
                        source = helper.handleStrOptions(source, this.varContext);
                        find = helper.handleStrOptions(find(value), this.varContext);
                        return source ? source.indexOf(find, 0) === 0 : false;
                    };

                    return new ctor();
                })();
                /** if source string ends with given parameter returns true, otherwise false. */
                expose.endswith = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'endswith', 'EndsWith', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source, find) {
                        if (arguments.length == 2) {
                            find = source;
                            source = value;
                        } else source = source(value);
                        source = helper.handleStrOptions(source, this.varContext);
                        find = helper.handleStrOptions(find(value), this.varContext);
                        var index = source.length - find.length;
                        return source ? source.indexOf(find, index) !== -1 : false;
                    };

                    return new ctor();
                })();
                /** Returns indexof find string in source string. */
                expose.indexof = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'indexof', 'IndexOf', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source, find) {
                        if (arguments.length == 2) {
                            find = source;
                            source = value;
                        } else source = source(value);
                        if (source && !source.indexOf) source = source.toString();
                        source = helper.handleStrOptions(source, this.varContext);
                        find = helper.handleStrOptions(find(value), this.varContext);
                        return source ? source.indexOf(find) : -1;
                    };

                    return new ctor();
                })();
                /** if items contains given item returns true, otherwise false. Supports arrays and strings as items parameter.. */
                expose.contains = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'contains', 'Contains', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (items, item) {
                        if (Assert.isTypeOf(items, 'string'))
                            return expose.substringof.toODataFunction(item, items);
                        var args = [];
                        helper.forEach(items, function (i) {
                            args.push(item + ' eq ' + core.dataTypes.toODataValue(i));
                        });
                        return '(' + args.join(' or ') + ')';
                    };

                    proto.toBeetleFunction = function (items, item) {
                        if (Assert.isTypeOf(items, 'string'))
                            return expose.substringof.toBeetleFunction(item, items);
                        var args = [];
                        helper.forEach(items, function (i) {
                            args.push(item + ' == ' + core.dataTypes.toBeetleValue(i));
                        });
                        return '(' + args.join(' || ') + ')';
                    };

                    proto.impl = function (value, items, item) {
                        if (arguments.length == 1)
                            items = value;
                        else if (arguments.length == 2) {
                            item = items;
                            items = value;
                        }
                        else
                            items = items(value);
                        item = (item ? item(value) : value);
                        if (Assert.isArray(items)) {
                            for (var i = 0; i < items.length; i++) {
                                var v = items[i];
                                if (v == item) return true;
                            }
                            return false;
                        }
                        items = helper.handleStrOptions(items, this.varContext);
                        item = helper.handleStrOptions(item, this.varContext);
                        return items ? items.indexOf(item) >= 0 : -1;
                    };

                    return new ctor();
                })();
                /** Rounds given value to nearest integer. */
                expose.round = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'round', 'Math.Round', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        return 'Math.Round(' + source + ')';
                    };

                    proto.impl = function (value, source) {
                        return Math.round(source ? source(value) : value);
                    };

                    return new ctor();
                })();
                /** Returns smallest integer value that is greater than given value. */
                expose.ceiling = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'ceiling', 'Math.Ceiling(%1)', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        return 'Math.Ceiling(' + source + ')';
                    };

                    proto.impl = function (value, source) {
                        return Math.ceil(source ? source(value) : value);
                    };

                    return new ctor();
                })();
                /** Returns biggest integer value that is smaller than given value. */
                expose.floor = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'floor', 'Math.Floor', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        return 'Math.Floor(' + source + ')';
                    };

                    proto.impl = function (value, source) {
                        return Math.floor(source ? source(value) : value);
                    };

                    return new ctor();
                })();

                /** Returns second of date. */
                expose.second = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'second', 'Second', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        source = source ? source + '.' : '';
                        return source + 'Second';
                    };

                    proto.impl = function (value, source) {
                        source = core.dataTypes.date.handle(source ? source(value) : value);
                        return source.getSeconds();
                    };

                    return new ctor();
                })();
                expose.getseconds = expose.second;
                /** Returns minute of date. */
                expose.minute = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'minute', 'Minute', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        source = source ? source + '.' : '';
                        return source + 'Minute';
                    };

                    proto.impl = function (value, source) {
                        source = core.dataTypes.date.handle(source ? source(value) : value);
                        return source.getMinutes();
                    };

                    return new ctor();
                })();
                expose.getminutes = expose.minute;
                /** Returns hour of date. */
                expose.hour = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'hour', 'Hour', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        source = source ? source + '.' : '';
                        return source + 'Hour';
                    };

                    proto.impl = function (value, source) {
                        source = core.dataTypes.date.handle(source ? source(value) : value);
                        return source.getHours();
                    };

                    return new ctor();
                })();
                expose.gethours = expose.hour;
                /** Returns day of date. */
                expose.day = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'day', 'Day', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        source = source ? source + '.' : '';
                        return source + 'Day';
                    };

                    proto.impl = function (value, source) {
                        source = core.dataTypes.date.handle(source ? source(value) : value);
                        return source.getDate();
                    };

                    return new ctor();
                })();
                expose.getdate = expose.day;
                /** Returns month of date. */
                expose.month = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'month', 'Month', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        source = source ? source + '.' : '';
                        return source + 'Month';
                    };

                    proto.impl = function (value, source) {
                        source = core.dataTypes.date.handle(source ? source(value) : value);
                        return source.getMonth() + 1;
                    };

                    return new ctor();
                })();
                expose.getmonth = expose.month;
                /** Returns year of date. */
                expose.year = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'year', 'Year', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        source = source ? source + '.' : '';
                        return source + 'Year';
                    };

                    proto.impl = function (value, source) {
                        source = core.dataTypes.date.handle(source ? source(value) : value);
                        return source.getFullYear();
                    };

                    return new ctor();
                })();
                expose.getfullyear = expose.year;

                /** Returns max value in the array. */
                expose.max = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'max', 'Max', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (items, item) {
                        throw helper.createError(i18N.functionNotSupportedForOData, ['Max']);
                    };

                    proto.impl = function (value, items, item) {
                        if (arguments.length == 1)
                            items = value;
                        else if (arguments.length == 2) {
                            item = items;
                            items = value;
                        }
                        else
                            items = items(value);
                        if (items.length == 0) return null;

                        var max = item ? item(items[0]) : items[0];
                        for (var i = 1; i < items.length; i++) {
                            var v = item ? item(items[i]) : items[i];
                            if (v > max) max = v;
                        }
                        return max;
                    };

                    return new ctor();
                })();
                /** Returns min value in the array. */
                expose.min = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'min', 'Min', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (items, item) {
                        throw helper.createError(i18N.functionNotSupportedForOData, ['Min']);
                    };

                    proto.impl = function (value, items, item) {
                        if (arguments.length == 1)
                            items = value;
                        else if (arguments.length == 2) {
                            item = items;
                            items = value;
                        }
                        else
                            items = items(value);
                        if (items.length == 0) return null;

                        var min = item ? item(items[0]) : items[0];
                        for (var i = 1; i < items.length; i++) {
                            var v = item ? item(items[i]) : items[i];
                            if (v < min) min = v;
                        }
                        return min;
                    };

                    return new ctor();
                })();
                /** Returns sum value from the array. */
                expose.sum = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'sum', 'Sum', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (items, item) {
                        throw helper.createError(i18N.functionNotSupportedForOData, ['Sum']);
                    };

                    proto.impl = function (value, items, item) {
                        if (arguments.length == 1)
                            items = value;
                        else if (arguments.length == 2) {
                            item = items;
                            items = value;
                        }
                        else
                            items = items(value);
                        var sum = 0;
                        for (var i = 0; i < items.length; i++) {
                            var v = items[i];
                            sum += item ? item(v) : v;
                        }
                        return sum;
                    };

                    return new ctor();
                })();
                /** Returns count of the array. */
                expose.count = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'count', 'Count', 1);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (items) {
                        throw helper.createError(i18N.functionNotSupportedForOData, ['Count']);
                    };

                    proto.impl = function (value, items) {
                        return (items ? items(value) : value).length;
                    };

                    return new ctor();
                })();
                /** Returns average value from the array. */
                expose.avg = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'avg', 'Average', 2);
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (items, item) {
                        throw helper.createError(i18N.functionNotSupportedForOData, ['Avg']);
                    };

                    proto.impl = function (value, items, item) {
                        if (arguments.length == 1)
                            items = value;
                        else if (arguments.length == 2) {
                            item = items;
                            items = value;
                        }
                        else
                            items = items(value);
                        if (items.length == 0) return null;

                        return expose.sum.impl(value, function () { return items; }, item) / items.length;
                    };

                    return new ctor();
                })();
                /** if any item from the array provides given predicate returns true, otherwise false. */
                expose.any = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'any', 'Any', 2);
                        this.needsAlias = true;
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (alias, items, predicate) {
                        return items + '/any(' + alias + ': ' + predicate + ')';
                    };

                    proto.impl = function (value, items, predicate) {
                        if (arguments.length == 1)
                            items = value;
                        else if (arguments.length == 2) {
                            predicate = items;
                            items = value;
                        }
                        else
                            items = items(value);
                        if (!predicate) return items.length > 0;

                        for (var i = 0; i < items.length; i++) {
                            var v = items[i];
                            if (predicate(v) === true) return true;
                        }
                        return false;
                    };

                    return new ctor();
                })();
                /** if all items of the array provides given predicate returns true, otherwise false. */
                expose.all = (function () {
                    var ctor = function () {
                        baseTypes.QueryFuncBase.call(this, 'all', 'All', 2);
                        this.needsAlias = true;
                    };
                    helper.inherit(ctor, baseTypes.QueryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (alias, items, predicate) {
                        return items + '/all(' + alias + ': ' + predicate + ')';
                    };

                    proto.impl = function (value, items, predicate) {
                        if (arguments.length == 1)
                            items = value;
                        else if (arguments.length == 2) {
                            predicate = items;
                            items = value;
                        }
                        else
                            items = items(value);

                        for (var i = 0; i < items.length; i++) {
                            var v = items[i];
                            if (predicate(v) !== true) return false;
                        }
                        return true;
                    };

                    return new ctor();
                })();

                /** Finds the function */
                expose.getFunc = function (funcName, throwIfNotFound) {
                    var func = expose[funcName.toLowerCase()];
                    if (func == null && throwIfNotFound !== false) throw helper.createError(i18N.unknownFunction, [funcName]);
                    return func;
                };

                return expose;
            })(),
            /** 
             * Array query, executes against an array. Similar to Linq to Objects.
             * @example
             *  var array = [{name: 'Test', age: 15}, {name: 'Test2', age: 25}];
             *  var query = array.asQueryable().where('name == "Test"');
             *  var result = query.execute();
             * @class
             */
            ArrayQuery: (function () {
                /** Creates ArrayQuery for the current array */
                Array.prototype.asQueryable = function () {
                    return new querying.ArrayQuery(this);
                };
                /** Register "q" as a shortcut for "asQueryable" if possible. */
                if (!Array.hasOwnProperty('q')) {
                    Array.prototype.q = function () {
                        return this.asQueryable();
                    };
                }

                /**
                 * @constructor
                 * @param {any} array - Array to create query for.
                 */
                var ctor = function (array) {
                    this.array = array;
                    baseTypes.QueryBase.call(this);
                };
                helper.inherit(ctor, baseTypes.QueryBase);
                var proto = ctor.prototype;
                proto.executeAfterExecuter = true;

                /**
                 * Executes this query against the related array.
                 * @param {Object} varContext - Variable context and query options.
                 */
                proto.execute = function (varContext) {
                    if (this.options)
                        varContext = helper.combine(this.options.varContext, varContext);
                    return this.toFunction()(this.array, varContext);
                };

                proto.clone = function () {
                    var q = new querying.ArrayQuery(this.array);
                    this.copy(q);
                    return q;
                };

                proto.copy = function (query) {
                    baseTypes.QueryBase.prototype.copy.call(this, query);
                };

                return ctor;
            })(),
            /** 
             * Entity query, executes against a service. Similar to Linq to Entities.
             * @class
             */
            EntityQuery: (function () {
                /**
                 * @constructor
                 * @param {string} resource - Server resource name to query.
                 * @param {EntityType|string} type - Entity type or short name.
                 * @param {EntityManager=} manager - Entity manager.
                 */
                var ctor = function (resource, type, manager) {
                    this.resource = resource;
                    this.entityType = handleEntityType(type, manager);
                    this.manager = manager;
                    this.liveValidate = manager && manager.liveValidate;
                    this.parameters = [];
                    this.bodyParameter = null;

                    baseTypes.QueryBase.call(this);
                };
                helper.inherit(ctor, baseTypes.QueryBase);
                var proto = ctor.prototype;

                proto.toString = function () {
                    var retVal = [];
                    retVal.push('resource: (' + this.resource + ')');
                    if (this.entityType)
                        retVal.push('entityType: (' + this.entityType.shortName + ')');
                    if (this.manager)
                        retVal.push('manager: (' + this.manager.toString() + ')');
                    retVal.push(baseTypes.QueryBase.prototype.toString.call(this));

                    return retVal.join(', ');
                };

                /**
                 * Expand query with given properties.
                 * @param {string} propertyPath - Path to desired property.
                 * @example
                 *  This query takes Orders and OrderDetails for each order in one query:
                 *    var query = manager.createQuery('Order');
                 *    query = query.expand('OrderDetails');
                 */
                proto.expand = function (propertyPath) {
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.ExpandExp(propertyPath));
                };

                /** @see expand */
                proto.include = function (propertyPath) {
                    return this.expand.apply(this, arguments);
                };

                /** Sets given name-value pair as parameter. Parameters will be passed server method. */
                proto.setParameter = function (name, value) {
                    var q = this.clone();
                    var prm = helper.findInArray(q.parameters, name, 'name');
                    if (prm) prm.value = value;
                    else q.parameters.push({ name: name, value: value });
                    return q;
                };

                /** Adds properties of given value to the body of the request. */
                proto.setBodyParameter = function (value) {
                    var q = this.clone();
                    q.bodyParameter = helper.combine(this.bodyParameter, value);
                    return q;
                };

                /** Sets entity type for query (used when executing locally). */
                proto.setEntityType = function (type) {
                    type = handleEntityType(type, this.manager);
                    var q = this.clone();
                    q.entityType = type;
                    return q;
                };

                /**
                 * Executes this query using related entity manager.
                 * @param {QueryOptions=} options - Query options.
                 * @param {successCallback=} successCallback - Success callback function.
                 * @param {errorCallback=} errorCallback - Error callback function.
                 * @returns {Promise}
                 */
                proto.execute = function (options, successCallback, errorCallback) {
                    if (!this.manager) throw helper.createError(i18N.onlyManagerCreatedCanBeExecuted, { query: this, options: options });
                    return this.manager.executeQuery(this, options, successCallback, errorCallback);
                };

                /** 
                 * Executes this query against related manager's local cache.
                 * @param {Object} varContext - Variable context for query.
                 * @returns {any[]}
                 */
                proto.executeLocally = function (varContext) {
                    if (!this.manager) throw helper.createError(i18N.onlyManagerCreatedCanBeExecuted, { query: this, options: options });
                    return this.manager.executeQueryLocally(this, varContext);
                };

                proto.clone = function () {
                    var q = new querying.EntityQuery(this.resource, this.entityType, this.manager);
                    this.copy(q);
                    return q;
                };

                proto.copy = function (query) {
                    baseTypes.QueryBase.prototype.copy.call(this, query);
                    helper.forEach(this.parameters, function (prm) {
                        query.parameters.push(prm);
                    });
                    query.bodyParameter = this.bodyParameter;
                };

                /** When using promises, this shortcut can be used instead of "execute().then()" syntax. */
                proto.then = function (callback, failCallback, options) {
                    var p = this.execute(options);
                    if (failCallback) {
                        if (p["fail"])
                            return p.then(callback).fail(failCallback);
                        return p.then(callback, failCallback);
                    }
                    return p.then(callback);
                }

                function handleEntityType(type, manager) {
                    if (type == null) return null;
                    if (Assert.isTypeOf(type, 'string')) {
                        if (manager == null) throw helper.createError(i18N.onlyManagerCreatedCanAcceptEntityShortName);
                        return manager.getEntityType(type, true);
                    }
                    helper.assertPrm(type, 'type').isInstanceOf(metadata.EntityType).check();
                    return type;
                }

                return ctor;
            })()
        };
    })();

    /** 
     * Core types.
     * @namespace
     */
    var core = {
        /**
         * This class wraps given value to allow skipping callbacks.
         * @class
         * @param {any} value - Value to wrap.
         * @param {any} fromBeetle - Indicates if Beetle triggered the change.
         */
        ValueNotifyWrapper: function (value, fromBeetle) {
            this.value = value;
            this.fromBeetle = fromBeetle === true;
        },
        /**
         * Beetle event class.
         * @class
         */
        Event: (function () {
            /**
             * @constructor
             * @param {string} name - Name of the event.
             * @param {any} publisher - Event's owner.
             */
            var ctor = function (name, publisher) {
                this.name = name;
                this.subscribers = [];
                this.publisher = publisher;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.name;
            };

            /**
             * Adds given function to subscribe list. Will be notified when this event triggered.
             * @param {Function} subscriber - Subscriber function.
             */
            proto.subscribe = function (subscriber) {
                if (!helper.findInArray(this.subscribers, subscriber))
                    this.subscribers.push(subscriber);
            };

            /**
             * Removes given function from subscriber list.
             * @param {Function} subscriber - Subscriber function.
             */
            proto.unsubscribe = function (subscriber) {
                helper.removeFromArray(this.subscribers, subscriber);
            };

            /**
             * Notifies all subscribers.
             * @param {any} data - Data to pass to subscribe functions.
             */
            proto.notify = function (data) {
                var args = arguments;
                helper.forEach(this.subscribers, function (subscriber) {
                    subscriber.apply(subscriber, args);
                });
            };

            return ctor;
        })(),
        /**
         * Beetle supported data types.
         * @namespace
         */
        dataTypes: (function () {

            /**
             * Date base type.
             * @class
             */
            var dateBase = (function () {
                var ctor = function (name) {
                    baseTypes.DataTypeBase.call(this, 'dateBase');
                    this.name = name;
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                /** Default value: 01/01/1753 */
                proto.defaultValue = function () {
                    return new Date(Date.UTC(1753, 1, 1));
                };

                proto.isValid = function (value) {
                    return Object.prototype.toString.call(value) === '[object Date]';
                };

                proto.handle = function (value) {
                    if (!this.isValid(value)) {
                        var v = value;
                        value = this.tryParse(v);
                        if (!value) throwAssignError(this, v);
                    }
                    return value;
                };

                proto.autoValue = function () {
                    return new Date();
                };

                proto.getRawValue = function (value) {
                    return value == null ? null : settings.getDateConverter().toISOString(value);
                };

                /** Tries to parse given value to date. Returns null when data cannot be parsed. */
                proto.tryParse = function (value) {
                    return settings.getDateConverter().parse(value);
                };

                proto.toODataValue = function (value) {
                    value = this.handle(value);
                    return "datetime'" + settings.getDateConverter().toISOString(value) + "'";
                };

                proto.toBeetleValue = function (value) {
                    value = this.handle(value);
                    return '"' + settings.getDateConverter().toISOString(value) + '"';
                };

                return ctor;
            })();

            var expose = {};

            /** Object type. */
            expose.object = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'object');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.toODataValue = function (value) {
                    return value;
                };

                proto.toBeetleValue = function (value) {
                    return value;
                };

                return new ctor();
            })();
            /** Array type. */
            expose.array = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'array');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.isValid = function (value) {
                    return value instanceof Array;
                };

                proto.defaultValue = function () {
                    return [];
                };

                proto.handle = function (value) {
                    if (!this.isValid(value)) value = value.split(',');
                    return value;
                };

                proto.autoValue = function () {
                    throw helper.createError(i18N.notImplemented, [this.name, 'defaultValue']);
                };

                proto.toODataValue = function (value) {
                    return value;
                };

                proto.toBeetleValue = function (value) {
                    return value;
                };

                return new ctor();
            })();
            /** Function type. */
            expose.func = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'function');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);

                return new ctor();
            })();
            /** String type. */
            expose.string = (function () {
                var i = 0;

                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'string');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return '';
                };

                proto.handle = function (value) {
                    if (!this.isValid(value)) value = value.toString();
                    return value;
                };

                proto.autoValue = function () {
                    return 'key_' + (--i);
                };

                proto.toODataValue = function (value) {
                    return "'" + value.replace(/'/g, "''") + "'";
                };

                proto.toBeetleValue = function (value) {
                    return '"' + value.replace(/"/g, '""') + '"';
                };

                return new ctor();
            })();
            /** Guid type. */
            expose.guid = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'guid');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return '00000000-0000-0000-0000-000000000000';
                };

                proto.isValid = function (value) {
                    return typeof value === 'string' && value.match(/^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i);
                };

                proto.handle = function (value) {
                    if (!this.isValid(value)) throwAssignError(this, value);
                    return value;
                };

                proto.autoValue = function () {
                    return helper.createGuid();
                };

                proto.toODataValue = function (value) {
                    return "guid'" + value + "'";
                };

                proto.toBeetleValue = function (value) {
                    return '"' + value + '"';
                };

                return new ctor();
            })();
            /** Date type. */
            expose.date = (function () {
                var ctor = function () {
                    dateBase.call(this, 'date');
                };
                helper.inherit(ctor, dateBase);

                return new ctor();
            })();
            /** DateTimeOffset type. */
            expose.dateTimeOffset = (function () {
                var ctor = function () {
                    dateBase.call(this, 'dateTimeOffset');
                };
                helper.inherit(ctor, dateBase);
                var proto = ctor.prototype;

                proto.toODataValue = function (value) {
                    value = this.handle(value);
                    return "datetimeoffset'" + settings.getDateConverter().toISOString(value) + "'";
                };

                return new ctor();
            })();
            /** Time type. */
            expose.time = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'time');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return '00:00:00';
                };

                proto.isValid = function (value) {
                    return /^([01]?\d|2[0-3])(((:[0-5]?\d){2}(\.\d{1,3}){0,1})|(:[0-5]?\d){0,2})?$/.test(value);
                };

                proto.handle = function (value) {
                    if (!this.isValid(value))
                        throwAssignError(this, value);
                    return value;
                };

                proto.autoValue = function () {
                    return '00:00:00';
                };

                proto.toODataValue = function (value) {
                    return "time'" + value + "'";
                };

                proto.toBeetleValue = function (value) {
                    return '"' + value + '"';
                };

                return new ctor();
            })();
            /** Boolean type. */
            expose.boolean = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'boolean');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return false;
                };

                proto.handle = function (value) {
                    if (!this.isValid(value)) {
                        if (expose.string.isValid(value)) {
                            // try to convert string values to boolean
                            var v = value.toLowerCase();
                            if (v == 'true' || v == '1')
                                return true;
                            else if (v == 'false' || v == '0')
                                return false;
                        }
                        throw throwAssignError(this, value);
                    }
                    return value;
                };

                return new ctor();
            })();
            /** Integer type. Int16, Int32, Int64 etc. */
            expose.int = (function () {
                var i = 0;

                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'int');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return 0;
                };

                proto.isValid = function (value) {
                    return typeof value === 'number' && value % 1 === 0;
                };

                proto.handle = function (value) {
                    var v = value;
                    if (typeof value !== 'number') value = Number(value);
                    if (!this.isValid(value)) throwAssignError(this, v);
                    return value;
                };

                proto.autoValue = function () {
                    return --i;
                };

                return new ctor();
            })();
            /** Number type. Float, decimal etc. */
            expose.number = (function () {
                var i = 0;

                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'number');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return 0;
                };

                proto.isValid = function (value) {
                    return !isNaN(value) && typeof value === 'number';
                };

                proto.handle = function (value) {
                    var v = value;
                    if (typeof value !== 'number') value = Number(value);
                    if (!this.isValid(value)) throwAssignError(this, v);
                    return value;
                };

                proto.autoValue = function () {
                    return --i;
                };

                return new ctor();
            })();
            /** Byte type. Value must be between 0 and 256. */
            expose.byte = (function () {
                var i = 0;

                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'byte');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return 0;
                };

                proto.isValid = function (value) {
                    return typeof value === 'number' && value % 1 === 0 && value >= 0 && value < 256;
                };

                proto.handle = function (value) {
                    var v = value;
                    if (typeof value !== 'number') value = Number(value);
                    if (!this.isValid(value)) throwAssignError(this, v);
                    return value;
                };

                proto.autoValue = function () {
                    return --i;
                };

                return new ctor();
            })();
            /** Binary type. */
            expose.binary = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'binary');
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return "\"AAAAAAAAAAA=\"";
                };

                proto.isValid = function () {
                    return true;
                };

                proto.handle = function (value) {
                    return value;
                };

                proto.toODataValue = function (value) {
                    value = this.handle(value);
                    return "X'" + settings.getDateConverter().toISOString(value) + "'";
                };

                proto.toBeetleValue = function (value) {
                    return '"' + value + '"';
                };

                return new ctor();
            })();
            /** Enum type. */
            expose.enumeration = (function () {
                var ctor = function (enumType, enumTypeName, displayName) {
                    baseTypes.DataTypeBase.call(this, 'enum');
                    this.enumType = enumType;
                    this.enumTypeName = enumTypeName;
                    this.displayName = displayName || enumTypeName;
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return 0;
                };

                proto.isValid = function (value) {
                    return getMember(value, this.enumType) != null;
                };

                proto.handle = function (value) {
                    var member = getMember(value, this.enumType);
                    if (member == null)
                        throw helper.createError(i18N.invalidEnumValue, [value, this.enumTypeName], { enumType: this.enumType, value: value });
                    return member;
                };

                proto.getRawValue = function (value) {
                    if (Assert.isEnum(value, this.enumType))
                        return value.value;
                    return value;
                };

                proto.toODataValue = function (value) {
                    return this.getRawValue(value);
                };

                proto.toBeetleValue = function (value) {
                    return this.getRawValue(value);
                };

                function getMember(value, enumType) {
                    if (Assert.isArray(value)) {
                        var flags = 0;
                        helper.forEach(value, function (v) {
                            flags |= v.value;
                        });
                        return flags;
                    }

                    var n = Number(value);
                    if (!isNaN(n)) value = n;

                    if (Assert.isTypeOf(value, 'string')) {
                        var values = value.split(',');

                        value = 0;
                        for (var i = 0; i < values.length; i++) {
                            var v = enumType[values[i]];
                            if (v != null) value |= v.value;
                            else return null;
                        }

                        return value;
                    }

                    if (Assert.isTypeOf(value, 'number'))
                        return value;

                    return Assert.isEnum(value, enumType) ? value.value : null;
                }

                return ctor;
            })();
            /** Geometry spatial type. */
            expose.geometry = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'geometry');
                    this.isComplex = true;
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return { $type: 'System.Data.Spatial.DbGeometry', CoordinateSystemId: null, WellKnownText: '', WellKnownBinary: null };
                };

                proto.isValid = function (value) {
                    return value.$tracker && value.$tracker.getValue('WellKnownText');
                };

                proto.handle = function (value) {
                    if (value.$tracker)
                        value.$tracker.entityType.isComplexType = true;
                    return value;
                };

                return new ctor();
            })();
            /** Geography spatial type. */
            expose.geography = (function () {
                var ctor = function () {
                    baseTypes.DataTypeBase.call(this, 'geography');
                    this.isComplex = true;
                };
                helper.inherit(ctor, baseTypes.DataTypeBase);
                var proto = ctor.prototype;

                proto.defaultValue = function () {
                    return { $type: 'System.Data.Spatial.DbGeography', CoordinateSystemId: null, WellKnownText: '', WellKnownBinary: null };
                };

                proto.isValid = function (value) {
                    return value.$tracker && value.$tracker.getValue('WellKnownText');
                };

                proto.handle = function (value) {
                    if (value.$tracker)
                        value.$tracker.entityType.isComplexType = true;
                    return value;
                };

                return new ctor();
            })();

            /** Finds data type by its name. */
            expose.byName = function (name) {
                var type = expose[name];
                if (!type) throw helper.createError(i18N.unknownDataType, [name]);
                return type;
            };
            /** Finds proper data type for given value. */
            expose.byValue = function (value) {
                if (expose.string.isValid(value)) {
                    if (expose.guid.isValid(value))
                        return expose.guid;
                    else if (expose.date.tryParse(value))
                        return expose.date;
                    return expose.string;
                }
                if (expose.date.isValid(value))
                    return expose.date;
                if (expose.boolean.isValid(value))
                    return expose.boolean;
                if (expose.int.isValid(value))
                    return expose.int;
                if (expose.number.isValid(value))
                    return expose.number;
                if (expose.array.isValid(value))
                    return expose.array;
                if (Assert.isObject(value))
                    return expose.object;
                return expose.binary;
            };
            /** 
             * Finds proper data type for given value and converts it to that type.
             * @example
             *  Json dates are strings, we use this method to auto-convert them to Javascript date.
             */
            expose.handle = function (value) {
                var v = expose.date.tryParse(value);
                if (v != null) return v;
                return value;
            };

            /** Converts given value to OData filter format value. */
            expose.toODataValue = function (value) {
                if (value == null) return 'null';
                return expose.byValue(value).toODataValue(value);
            };
            /** Converts given value to OData filter format value. */
            expose.toBeetleValue = function (value) {
                if (value == null) return 'null';
                return expose.byValue(value).toBeetleValue(value);
            };

            function throwAssignError(dataType, value) {
                throw helper.createError(i18N.assignError, [dataType.name, value], { dataType: dataType, value: value });
            }

            return expose;
        })(),
        /**
         * Beetle data and navigation property validators.
         * @namespace
         */
        Validator: (function () {
            /**
             * Creates a new validator.
             * @constructor
             * @param {string} name - Validator name.
             * @param {Function} func - Validator javascript implementation.
             * @param {string} message - Error message.
             * @param {any[]} args - Validator specific arguments.
             */
            var ctor = function (name, func, message, args) {
                this.name = name;
                this.func = func;
                this.message = message;
                this.args = args;
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                var args = [];
                if (this.args)
                    for (var p in this.args) {
                        args.push(p + ': ' + this.args[p]);
                    }
                return args.length > 0 ? this.name + ' (' + args.join(', ') + ')' : this.name;
            };

            /**
             * Validates given parameters against validation function.
             * @param {any} value - Value to validate.
             * @param {Entity} entity - Value's owner entity. Might be used for some validations (i.e. compare).
             */
            proto.validate = function (value, entity) {
                return this.func(value, entity) == true ? null : this.message;
            };

            /**
             * Finds the validator by given code and initializes it with given arguments.
             * @param {string} code - Validator short code.
             * @param {any[]} args - Validator specific arguments.
             * @param {string} message - Error message.
             * @param {string=} messageResourceName - Error message's resource name for dynamic translation.
             * @param {string=} displayName - Validator owner's display name.
             * @param {string=} displayNameResourceName - Validator owner's display name's resource name for dynamic translation.
             */
            ctor.byCode = function (code, args, message, messageResourceName, displayName, displayNameResourceName) {
                var localizeFunc = settings.getLocalizeFunction();
                if (localizeFunc) {
                    message = (messageResourceName && localizeFunc(messageResourceName)) || message;
                    displayName = (displayNameResourceName && localizeFunc(displayNameResourceName)) || displayName;
                }
                args = args || [];
                args.push(message);
                args.push(displayName);
                switch (code) {
                    case 're':
                        return ctor.required.apply(null, args);
                    case 'sl':
                        return ctor.stringLength.apply(null, args);
                    case 'ma':
                        return ctor.maxLength.apply(null, args);
                    case 'mi':
                        return ctor.minLength.apply(null, args);
                    case 'ra':
                        return ctor.range.apply(null, args);
                    case 'rx':
                        return ctor.regularExpression.apply(null, args);
                    case 'ea':
                        return ctor.emailAddress.apply(null, args);
                    case 'cc':
                        return ctor.creditCard.apply(null, args);
                    case 'ur':
                        return ctor.url.apply(null, args);
                    case 'ph':
                        return ctor.phone.apply(null, args);
                    case 'po':
                        return ctor.postalCode.apply(null, args);
                    case 'ti':
                        return ctor.time.apply(null, args);
                    case 'co':
                        return ctor.compare.apply(null, args);
                    default:
                        throw helper.createError(i18N.unknownValidator, [code]);
                }
            };

            ctor.required = function (allowEmptyStrings, message, displayName) {
                var func = function (value) {
                    if (value == null) return false;
                    if (Assert.isTypeOf(value, 'string') && !allowEmptyStrings && value == '') return false;
                    return true;
                };
                message = helper.formatString(message || i18N.requiredError, displayName);
                return new ctor('Required', func, message, { allowEmptyStrings: allowEmptyStrings });
            };
            ctor.stringLength = function (min, max, message, displayName) {
                var func = function (value) {
                    if (!min && !max) return true;
                    if (!Assert.isNotEmptyString(value)) return false;
                    if (min && value.length < min) return false;
                    if (max && value.length > max) return false;
                    return true;
                };
                message = helper.formatString(message || i18N.stringLengthError, displayName, min, max);
                return new ctor('StringLength', func, message, { min: min, max: max });
            };
            ctor.maxLength = function (length, message, displayName) {
                var func = function (value) {
                    if (value == null) return true;
                    if (length && value.length > length) return false;
                    return true;
                };
                message = helper.formatString(message || i18N.maxLenError, displayName, length);
                return new ctor('MaxLength', func, message, { length: length });
            };
            ctor.minLength = function (length, message, displayName) {
                var func = function (value) {
                    if (value == null) return false;
                    if (length && value.length < length) return false;
                    return true;
                };
                message = helper.formatString(message || i18N.minLenError, displayName, length);
                return new ctor('MinLength', func, message, { length: length });
            };
            ctor.range = function (min, max, message, displayName) {
                var func = function (value) {
                    if (!min && !max) return true;
                    if (min && value < min) return false;
                    if (max && value > max) return false;
                    return true;
                };
                message = helper.formatString(message || i18N.rangeError, displayName, min, max);
                return new ctor('Range', func, message, { min: min, max: max });
            };
            ctor.regularExpression = function (pattern, message, displayName) {
                if (Assert.isTypeOf(pattern, 'string')) pattern = new RegExp(pattern);
                return regex('RegularExpression', pattern, message, displayName);
            };
            ctor.emailAddress = function (message, displayName) {
                return regex('EmailAddress', /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/, message, displayName);
            };
            ctor.creditCard = function (message, displayName) {
                return regex('CreditCard', /^((4\d{3})|(5[1-5]\d{2})|(6011)|(3[68]\d{2})|(30[012345]\d))[ -]?(\d{4})[ -]?(\d{4})[ -]?(\d{4}|3[4,7]\d{13})$/, message, displayName);
            };
            ctor.url = function (message, displayName) {
                return regex('Url', /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/, message, displayName);
            };
            ctor.phone = function (message, displayName) {
                return regex('Phone', /^(?!.*-.*-.*-)(?=(?:\d{8,10}$)|(?:(?=.{9,11}$)[^-]*-[^-]*$)|(?:(?=.{10,12}$)[^-]*-[^-]*-[^-]*$)  )[\d-]+$/, message, displayName);
            };
            ctor.postalCode = function (message, displayName) {
                return regex('PostalCode', /^\d{5}([\-]?\d{4})?$/, message, displayName);
            };
            ctor.time = function (message, displayName) {
                return regex('Time', /^([01]?\d|2[0-3])(((:[0-5]?\d){2}(\.\d{1,3}){0,1})|(:[0-5]?\d){0,2})?$/, message, displayName);
            };

            function regex(name, pattern, message, displayName) {
                var func = function (value) {
                    if (value == null) return false;
                    return pattern.test(value);
                };
                message = helper.formatString(message || i18N.invalidValue, displayName);
                return new ctor(name, func, message, { pattern: pattern });
            }

            /** Compares value with given property, both must be equal. */
            ctor.compare = function (property, message, displayName) {
                var func = function (value, entity) {
                    var other = helper.getValue(entity, property);
                    return value == other;
                };
                var localizeFunc = settings.getLocalizeFunction();
                var propertyDisplayName = (localizeFunc && localizeFunc(property)) || property;
                message = helper.formatString(message || i18N.compareError, displayName, propertyDisplayName);
                return new ctor("Compare", func, message, { property: property });
            };

            return ctor;
        })(),
        /**
         * Entity container holds entity sets.
         * @class
         */
        EntityContainer: (function () {
            /**
             * Entity Set holds entity references
             * @class
             */
            var entitySet = (function () {
                /**
                 * We hold every entity type (which has key) in seperate list.
                 * But for a derived type we create entries for each base type increase performance for inheritance scenarios.
                 * @constructor
                 * @example
                 *  Lets say we have this hierarchy;
                 *  Customer -> Company -> Entity -> EntityBase
                 *  When we add a customer three more entries will ve created (for Company, Entity and EntityBase)
                 *  So when we search a Company this Customer will be in the list.@param {any} type
                 * @param {any} type - Entity type for the set.
                 */
                var c = function (type) {
                    this.typeName = type.name;
                    this.keyIndex = [];
                };
                var p = c.prototype;

                p.toString = function () {
                    return this.typeName + ': ' + this.keyIndex.length;
                };

                /**
                 * Adds given entity to proper location in the index table using its key.
                 * @param {string} key - The key.
                 * @param {Entity} entity - The entity.
                 */
                p.push = function (key, entity) {
                    // find proper location
                    var location = findLocation(key, this.keyIndex);
                    // insert new index
                    this.keyIndex.splice(location, 0, { key: key, entity: entity });
                };

                /**
                 * Removes item with given key from index table.
                 * @param {string} key - The key.
                 */
                p.remove = function (key) {
                    // find the index entry.
                    var index = getIndex(key, this.keyIndex);
                    this.keyIndex.splice(index, 1);
                };

                /**
                 * Finds entity with given key.
                 * @param {string} key - The key.
                 * @returns {Entity} Entity if found, otherwise null.
                 */
                p.getEntity = function (key) {
                    // find the index entry
                    var entry = getEntry(key, this.keyIndex);
                    if (entry) return entry.entity;
                    return null;
                };

                /**
                 * Gets entities which has given foreign key for given navigation property.
                 * @param {string} fk - The foreign key.
                 * @param {NavigationProperty} navProperty - The navigation property.
                 */
                p.getRelations = function (fk, navProperty) {
                    var retVal = [];
                    // copy all items has same foreign key for given navigation propery to a new array.
                    for (var i = 0; i < this.keyIndex.length; i++) {
                        var ki = this.keyIndex[i];
                        if (ki.entity.$tracker.foreignKey(navProperty) === fk)
                            retVal.push(ki.entity);
                    }
                    return retVal;
                };

                /**
                 * After an entity's key changed we need to rebuild the index table.
                 * @param {Entity} entity - The entity.
                 * @param {string} oldKey - The old key.
                 * @param {string} newKey - The new key.
                 */
                p.relocateKey = function (entity, oldKey, newKey) {
                    // if there is an old index, remove it.
                    this.remove(oldKey);
                    // if new key has a value, add it to index tables.
                    if (newKey)
                        this.push(newKey, entity);
                };

                /**
                 * Returns entity collection of the set.
                 * @returns {Entity[]} Entries of entity set.
                 */
                p.getEntities = function () {
                    var retVal = [];
                    helper.forEach(this.keyIndex, function (ki) {
                        retVal.push(ki.entity);
                    });
                    return retVal;
                };

                function getEntry(key, keyIndex) {
                    var index = getIndex(key, keyIndex);
                    return index > -1 ? keyIndex[index] : null;
                }

                function getIndex(key, keyIndex) {
                    // find given key with binary search.
                    var len = keyIndex.length;
                    if (len > 0) {
                        var low = 0, high = len - 1, i;
                        while (low <= high) {
                            i = Math.floor((low + high) / 2);
                            if (keyIndex[i].key < key) {
                                low = i + 1;
                                continue;
                            }
                            if (keyIndex[i].key > key) {
                                high = i - 1;
                                continue;
                            }
                            return i;
                        }
                    }
                    return -1;
                }

                function findLocation(key, keyIndex) {
                    var i = 0;
                    while (i < keyIndex.length && key > keyIndex[i].key) i++;
                    return i;
                }

                return c;
            })();

            /**
             * Holds entity list and key-entity mappings for types.
             * Seperate key-entity lists are generated for every type and an entity stored in list of every type in its inheritance chain.
             */
            var ctor = function () {
                // To hold keyed entities.
                this.entitySets = [];
                // To hold all entities.
                this.allEntities = [];
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.allEntities.length;
            };

            /** Adds given entity to each entity set in the inheritance hierarchy. */
            proto.push = function (entity) {
                // add entity to entities array.
                this.allEntities.push(entity);
                var tracker = entity.$tracker;
                var type = tracker.entityType;
                // get entity key
                var key = tracker.key;
                if (key) {
                    while (type) {
                        // add this key index entry to all sets for inheritance hierarchy
                        var es = this.getEntitySet(type);
                        es.push(key, entity);
                        type = type.baseType;
                    }
                }
            };

            /** Removes given entity from each entity set in the inheritance hierarchy. */
            proto.remove = function (entity) {
                // remove entity from entities array.
                helper.removeFromArray(this.allEntities, entity);
                var tracker = entity.$tracker;
                var type = tracker.entityType;
                var key = tracker.key;
                if (!key) return;
                // if key has value.
                while (type) {
                    // remove this key index entry from all sets for inheritance hierarchy
                    var es = this.findEntitySet(type);
                    if (es) {
                        es.remove(key);
                        type = type.baseType;
                    }
                }
            };

            /** Gets cached entity list. */
            proto.getEntities = function () {
                return this.allEntities;
            };

            /** 
             * Finds entity with given key by searching entity type's entity set.
             * @param {string} key - The key.
             * @param {EntityType} type - Entity type object.
             */
            proto.getEntityByKey = function (key, type) {
                if (!key) return null;
                // get entity set for type
                var es = this.findEntitySet(type);
                if (!es) return null;
                return es.getEntity(key);
            };

            /** Gets entities which has given foreign key for given navigation property by searching navigation's entity type's set. */
            proto.getRelations = function (entity, navProperty) {
                var type = navProperty.entityType;
                var key = entity.$tracker.key;
                if (!key) return null;
                // find related entity set
                var es = this.findEntitySet(type);
                // request relation from entity set
                if (es) return es.getRelations(key, navProperty);
                return null;
            };

            /** After an entity's key changed we need to rebuild the index tables for each entity set in the inheritance hiearachy. */
            proto.relocateKey = function (entity, oldKey, newKey) {
                // get entity type
                var type = entity.$tracker.entityType;
                // create index entry for each type in inheritance hierarachy
                while (type) {
                    var es = this.findEntitySet(type);
                    if (!es) {
                        es = createEntitySet(type, this.entitySets);
                        es.push(newKey, entity);
                    } else
                        es.relocateKey(entity, oldKey, newKey);
                    type = type.baseType;
                }
            };

            /** Gets all changed entities from cache (Modified, Added, Deleted). */
            proto.getChanges = function () {
                return helper.filterArray(this.allEntities, function (item) {
                    return !(item.$tracker.entityType.isComplexType && item.$tracker.owners.length > 0) && item.$tracker.isChanged();
                });
            };

            /** Returns cached entity count. */
            proto.count = function () {
                return this.allEntities.length;
            };

            /** 
             * Finds entity set for given type in the cache.
             * @param {EntityType} type - Entity type object.
             * @returns {EntitySet} Entity set if found, otherwise null.
             */
            proto.findEntitySet = function (type) {
                return helper.findInArray(this.entitySets, type.name, 'typeName');
            };

            /** 
             * Search entity set for given type in the cache, creates if there isn't any.
             * @param {EntityType} type - Entity type object.
             * @returns {EntitySet} Found or newly created entity set.
             */
            proto.getEntitySet = function (type) {
                var es = this.findEntitySet(type);
                if (!es) es = createEntitySet(type, this.entitySets);
                return es;
            };

            function createEntitySet(type, entitySets) {
                var es = new entitySet(type);
                entitySets.push(es);
                return es;
            }

            return ctor;
        })(),
        /**
         * Entity set works like a repository.
         * @class
         */
        EntitySet: (function () {
            /**
             * @constructor
             * @param {EntityType} type - Entity type object.
             * @param {EntityManager} manager - Owner entity manager instance.
             */
            var ctor = function (type, manager) {
                this.local = manager.entities.getEntitySet(type);

                querying.EntityQuery.call(this, type.setName, type, manager);
            };
            helper.inherit(ctor, querying.EntityQuery);
            var proto = ctor.prototype;

            proto.toString = function () {
                return 'EntitySet: ' + this.entityType.shortName;
            };

            /** Creates a new entity with Added state. */
            proto.create = function (initialValues) {
                var entity = this.entityType.createEntity(initialValues);
                this.manager.addEntity(entity);
                return entity;
            };

            /** Creates a new detached entity. */
            proto.createDetached = function (initialValues) {
                return this.entityType.createEntity(initialValues);
            };

            /** Creates a new raw detached entity. */
            proto.createRaw = function (initialValues) {
                return this.entityType.createRawEntity(initialValues);
            };

            /** Adds the given entity to the manager in the Added state. */
            proto.add = function (entity) {
                checkType(entity, this);
                this.manager.addEntity(entity);
            };

            /** Attaches the given entity to the manager in the Unchanged state. */
            proto.attach = function (entity) {
                checkType(entity, this);
                this.manager.attachEntity(entity);
            };

            /** Marks the given entity as Deleted. */
            proto.remove = function (entity) {
                checkType(entity, this);
                this.manager.deleteEntity(entity);
            };

            function checkType(entity, that) {
                if (entity == null)
                    throw helper.createError(i18N.cannotCheckInstanceOnNull);
                var t = that.entityType;
                if (!t.isAssignableWith(entity)) {
                    var ot = entity.$tracker && entity.$tracker.entityType;
                    var otn = (ot && ot.shortName) || 'Object';
                    if (!ot || !t.isAssignableWith(ot))
                        throw helper.createError(i18N.typeError, [otn, t.shortName]);
                }
            }

            return ctor;
        })(),
        /**
         * Entity tracker class. Tracks changes made on entities.
         * @class
         */
        EntityTracker: (function () {
            var ctor = function (entity, type, op) {
                delete entity.$type;
                delete entity.$id;
                initialize(entity, type, op || settings.getObservableProvider(), this);
                // Convert raw entity to observable.
                toObservable(entity, type, this);
                callIzer(type, entity);
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return 'EntityTracker: ' + this.entityType.shortName + ', key: ' + this.key;
            };

            /** Manager setter, it can only be set with entityManager derived object and because of this class is internal it cannot be set from outside. */
            proto.setManagerInfo = function (manager) {
                if (this.manager) throw helper.createError(i18N.entityAlreadyBeingTracked, { otherManager: this.manager });
                // Check if argument is an instance of entityManager.
                helper.assertPrm(manager, 'manager').isInstanceOf(core.EntityManager).check();
                this.manager = manager;
            };

            /** Gets if entity is changed. */
            proto.isChanged = function () {
                return this.entityState === enums.entityStates.Added || this.entityState === enums.entityStates.Deleted
                    || this.entityState === enums.entityStates.Modified;
            };

            /** Deletes entity from manager. */
            proto.delete = function () {
                checkManager(this);
                this.manager.deleteEntity(this.entity);
            };

            /** Detaches entity from manager. */
            proto.detach = function () {
                checkManager(this);
                this.manager.detachEntity(this.entity);
            };

            /** Change entity's state to Added. */
            proto.toAdded = function () {
                if (this.entityState == enums.entityStates.Added) return;
                var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Added, newChanged: !this.isChanged() };
                this.entityState = enums.entityStates.Added;
                this.entityStateChanged.notify(obj);
            };

            /** Change entity's state to Modified. */
            proto.toModified = function () {
                if (this.entityState == enums.entityStates.Modified) return;
                var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Modified, newChanged: !this.isChanged() };
                this.entityState = enums.entityStates.Modified;
                this.entityStateChanged.notify(obj);
            };

            /** Change entity's state to Deleted. */
            proto.toDeleted = function () {
                if (this.entityState == enums.entityStates.Deleted) return;
                var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Deleted, newChanged: !this.isChanged() };
                this.entityState = enums.entityStates.Deleted;
                this.entityStateChanged.notify(obj);
            };

            /** Change entity's state to Unchanged. */
            proto.toUnchanged = function () {
                if (this.entityState == enums.entityStates.Unchanged) return;
                var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Unchanged, newUnchanged: this.isChanged() };
                this.originalValues.length = 0;
                this.changedValues.length = 0;
                this.entityState = enums.entityStates.Unchanged;
                this.entityStateChanged.notify(obj);
            };

            /** Change entity's state to Detached. */
            proto.toDetached = function () {
                if (this.entityState == enums.entityStates.Detached) return;
                var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Detached, newUnchanged: this.isChanged() };
                this.entityState = enums.entityStates.Detached;
                this.entityStateChanged.notify(obj);
            };

            /** Resets all changes to initial values. */
            proto.rejectChanges = function () {
                var that = this;
                helper.forEach(this.originalValues, function (ov) {
                    that.setValue(ov.p, ov.v);
                });
                this.originalValues.length = 0;
            };

            /** Resets all changes to last accepted values. */
            proto.undoChanges = function () {
                var that = this;
                helper.forEach(this.changedValues, function (cv) {
                    that.setValue(cv.p, cv.v);
                });
                this.changedValues.length = 0;
            };

            /** Accept all changes. */
            proto.acceptChanges = function () {
                this.changedValues.length = 0;
            };

            /** 
             * Gets internal value of the property from observable entity.
             * @param {string} property - Name of the property.
             */
            proto.getValue = function (property) {
                return this.observableProvider.getValue(this.entity, property);
            };

            /** 
             * Sets internal value of the property of observable entity.
             * @param {string} property - Name of the property.
             * @param {any} value - Value to set.
             */
            proto.setValue = function (property, value) {
                this.observableProvider.setValue(this.entity, property, value);
            };

            /** Gets original value for property. */
            proto.getOriginalValue = function (property) {
                var ov = helper.findInArray(this.originalValues, property, 'p');
                return ov ? ov.v : this.getValue(property);
            };

            /**
             * Get foreign key value for this navigation property.
             * @param {NavigationProperty} navProperty - The navigation property object.
             * @returns {string} Comma separated foreign keys.
             */
            proto.foreignKey = function (navProperty) {
                var type = navProperty.entityType;
                if (type.keys.length == 0) return null;
                var retVal = [];
                for (var i = 0; i < type.keys.length; i++) {
                    var key = type.keys[i];
                    var fkName = navProperty.foreignKeyNames[i];
                    var value = this.getValue(fkName);
                    if (value == null) return null;
                    if (key.dataType.name == 'guid')
                        value = value.toLowerCase();
                    retVal.push(value);
                }
                return retVal.join(',');
            };

            /**
             * Creates a query that can load this navigation property.
             * @param {string} navPropName - The navigation property name.
             * @param {string} resourceName - The resource (query name) for entity type.
             * @returns {EntityQuery} Created entity query.
             */
            proto.createLoadQuery = function (navPropName, resourceName) {
                var navProp = helper.findInArray(this.entityType.navigationProperties, navPropName, 'name');
                return createLoadQuery(navProp, navPropName, resourceName, this);
            };

            /**
             * Loads given navigation property of the entity.
             * @param {string} navPropName - The navigation property name.
             * @param {string[]} expands - Expand navigations to apply when loading navigation property.
             * @param {string} resourceName - Resource name to query entities.
             * @param {QueryOptions} options - Query options.
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.loadNavigationProperty = function (navPropName, expands, resourceName, options, successCallback, errorCallback) {
                if (this.manager == null) throw helper.createError(i18N.entityNotBeingTracked, { entity: this.entity });
                var navProp = helper.findInArray(this.entityType.navigationProperties, navPropName, 'name');
                var query = createLoadQuery(navProp, navPropName, resourceName, this);
                // apply given expands
                if (expands) {
                    helper.forEach(expands, function (expand) {
                        query = query.expand(expand);
                    });
                }
                var that = this;
                // execute query on the manager.
                options = options || {};
                if (options.merge == null) options.merge = enums.mergeStrategy.Preserve;
                if (options.autoFixScalar == null) options.autoFixScalar = true;
                if (options.autoFixPlural == null) options.autoFixPlural = true;
                return this.manager.executeQuery(query, options,
                    function () {
                        if (!navProp.inverse)
                            that.manager.fixNavigations(entity);
                        if (successCallback)
                            successCallback.apply(null, arguments);
                    },
                    errorCallback);
            };

            /** Validates entity against metadata data annotation validations. */
            proto.validate = function () {
                if (this.entityState == enums.entityStates.Deleted)
                    this.validationErrors = [];
                else
                    mergeErrors(this.entityType.validate(this.entity), this);
                return this.validationErrors;
            };

            /** Creates a raw javascript object representing this entity. */
            proto.toRaw = function (includeNavigations, handledList) {
                // get entity information.
                handledList = handledList || [];
                handledList.push(this.entity);

                var type = this.entityType;
                var data = {};
                var that = this;
                if (type.hasMetadata) {
                    helper.forEach(type.dataProperties, function (dp) {
                        var v = that.getValue(dp.name);
                        if (v == null || !v.$tracker)
                            data[dp.name] = dp.dataType.getRawValue(v);
                        else if (includeNavigations == true || v.$tracker.entityType.isComplexType)
                            data[dp.name] = v.$tracker.toRaw(includeNavigations, handledList);
                    });
                    if (includeNavigations == true) {
                        helper.forEach(type.navigationProperties, function (np) {
                            var v = that.getValue(np.name);
                            if (v == null)
                                data[np.name] = null;
                            else {
                                if (Assert.isArray(v)) {
                                    data[np.name] = [];
                                    helper.forEach(v, function (item) {
                                        if (item == null || handledList.indexOf(item) >= 0) return;

                                        if (!item.$tracker)
                                            data[np.name].push(item);
                                        else
                                            data[np.name].push(item.$tracker.toRaw(true, handledList));
                                    });
                                }
                                else {
                                    data[np.name] = handledList.indexOf(v) >= 0 ? null : v.$tracker.toRaw(true, handledList);
                                }
                            }
                        });
                    }
                }
                // process unmapped properties
                helper.forEach(type.properties, function (p) {
                    var v = that.getValue(p);
                    // if value is array enumerate each item
                    if (Assert.isArray(v)) {
                        // create new array property in return data.
                        data[p] = [];
                        helper.forEach(v, function (item) {
                            if (item == null || handledList.indexOf(v) >= 0) return;

                            if (!item.$tracker)
                                data[p].push(item);
                            else if (includeNavigations == true)
                                data[p].push(item.$tracker.toRaw(true, handledList));
                        });
                    } else {
                        if (v == null || !v.$tracker)
                            data[p] = v;
                        else if (includeNavigations == true || v.$tracker.entityType.isComplexType)
                            data[p] = handledList.indexOf(v) >= 0 ? null : v.$tracker.toRaw(includeNavigations, handledList);
                    }
                });
                return data;
            };

            /** 
             * Starts tracking the entity, this is a static method.
             * @param {Object} result - The raw result.
             * @param {EntityType} result - The entity type.
             * @param {ObservableProvider} result - Observable provider instance.
             */
            ctor.toEntity = function (result, type, op) {
                // Crate entity tracker with this static method.
                return new core.EntityTracker(result, type, op).entity;
            };

            function initialize(entity, type, op, instance) {
                instance.entity = entity;
                entity.$tracker = instance;
                instance.entityType = type;
                instance.entityState = enums.entityStates.Detached;
                instance.observableProvider = op;
                instance.forceUpdate = false;
                instance.originalValues = [];
                instance.changedValues = [];
                instance.manager = null;
                instance.owners = [];
                instance.validationErrors = [];
                instance.validationErrorsChanged = new core.Event('validationErrorsChanged', instance);
                instance.entityStateChanged = new core.Event('entityStateChanged', instance);
                instance.propertyChanged = new core.Event('propertyChanged', instance);
                instance.arrayChanged = new core.Event('arrayChanged', instance);
                // get key's initial value.
                if (type.hasMetadata)
                    instance.key = getKey(instance);
            }

            function toObservable(entity, type, tracker) {
                // if we have only one callback, we need to write lots of if, to avoid this we send all callbacks seperately.
                var callbacks = {
                    propertyChange: propertyChange,
                    arrayChange: arrayChange,
                    dataPropertyChange: dataPropertyChange,
                    scalarNavigationPropertyChange: scalarNavigationPropertyChange,
                    pluralNavigationPropertyChange: pluralNavigationPropertyChange,
                    arraySet: arraySet
                };
                return tracker.observableProvider.toObservable(entity, type, callbacks);
            }

            function callIzer(type, entity) {
                if (type.baseType) callIzer(type.baseType, entity);
                if (type.initializer)
                    type.initializer.call(entity, entity);
            }

            function getKey(tracker, p, v) {
                var type = tracker.entityType;
                if (type.keys.length == 0) return null;
                var retVal = [];
                // Get every key value and join them with ','.
                for (var i = 0; i < type.keys.length; i++) {
                    var key = type.keys[i];
                    var value;
                    // if property and value is given this means key is about to change so we need to check existing entities with new key.
                    if (key === p) value = v;
                    else
                        value = tracker.getValue(key.name);
                    if (key.dataType.name == 'guid')
                        value = value.toLowerCase();
                    retVal.push(value);
                }
                return retVal.join(',');
            }

            function createLoadQuery(navProp, navPropName, resourceName, tracker) {
                if (!navProp)
                    throw helper.createError(i18N.propertyNotFound, [navPropName],
                        { propertyName: navPropName, entity: tracker.entity, manager: tracker.manager });
                // create query for entity type
                var query = navProp.entityType.createQuery(resourceName, tracker.manager);
                // if navigation is scalar use foreign key to filter via primary key
                if (navProp.isScalar) {
                    helper.forEach(navProp.foreignKeys, function (fk, i) {
                        var property = navProp.entityType.keys[i];
                        var value = tracker.getValue(fk.name);
                        query = query.where(property.name + " == @0", [value]);
                    });
                } else { // if navigation is plural use the entity's key to load related entities via foreign key
                    helper.forEach(navProp.foreignKeyNames, function (fk, i) {
                        var value = tracker.getValue(tracker.entityType.keys[i]);
                        query = query.where(fk + " == @0", [value]);
                    });
                }
                return query;
            }

            function propertyChange(entity, property, accessor, newValue) {
                var noCallbackExternal = false;
                if (Assert.isInstanceOf(newValue, core.ValueNotifyWrapper)) {
                    noCallbackExternal = !newValue.fromBeetle;
                    newValue = newValue.value;
                }

                var oldValue = accessor();
                if (oldValue === newValue) return;

                var tracker = entity.$tracker;
                var handleUnmappedProperties;
                if (tracker.manager) handleUnmappedProperties = tracker.manager.handleUnmappedProperties;
                if (handleUnmappedProperties == null) handleUnmappedProperties = settings.handleUnmappedProperties;
                if (handleUnmappedProperties === true) {
                    newValue = core.dataTypes.handle(newValue);
                    if (oldValue === newValue) return;
                }

                accessor(newValue);

                // mark this entity as modified.
                if (tracker.manager)
                    setModified(entity, property, oldValue, tracker);
                if (!noCallbackExternal)
                    tracker.propertyChanged.notify({ entity: entity, property: property, oldValue: oldValue, newValue: newValue });
            }

            function arrayChange(entity, property, items, removedItems, addedItems) {
                var tracker = entity.$tracker;
                if (tracker.manager)
                    setModified(entity, null, null, tracker);
                tracker.arrayChanged.notify({ entity: entity, property: property, items: items, removedItems: removedItems, addedItems: addedItems });
            }

            function dataPropertyChange(entity, property, accessor, newValue) {
                var noCallbackBeetle = false;
                var noCallbackExternal = false;
                if (Assert.isInstanceOf(newValue, core.ValueNotifyWrapper)) {
                    noCallbackBeetle = newValue.fromBeetle;
                    noCallbackExternal = !newValue.fromBeetle;
                    newValue = newValue.value;
                }

                var oldValue = accessor();
                if (oldValue === newValue) return;

                // check new value's type and convert if necessary.
                newValue = property.handle(newValue);

                if (oldValue === newValue) return;
                if (property.dataType === core.dataTypes.date || property.dataType === core.dataTypes.dateTimeOffset) {
                    if (oldValue != null && newValue != null && oldValue.valueOf() === newValue.valueOf())
                        return;
                }

                var tracker = entity.$tracker;
                var oldKey = null, newKey = null;
                if (property.isKeyPart) {
                    oldKey = tracker.key;
                    newKey = getKey(tracker, property, newValue);
                    // if this property is primary key check if this key already exists.
                    if (tracker.manager) {
                        var e = tracker.manager.getEntityByKey(newKey, tracker.entityType.floorType);
                        if (e && e !== entity)
                            throw helper.createError(i18N.sameKeyExists, { key: newKey, entity: e });
                    }
                    tracker.key = newKey;
                }

                var liveValidate = tracker.liveValidate;
                // mark this entity as modified.
                if (tracker.manager) {
                    setModified(entity, property.name, property.dataType.getRawValue(oldValue), tracker);
                    if (liveValidate == null) liveValidate = tracker.manager.liveValidate;
                }
                else if (tracker.entityType.isComplexType)
                    helper.forEach(tracker.owners, function (owner) {
                        setModified(owner.entity, owner.property.name + '.' + property.name, newValue, owner.entity.$tracker);
                    });

                // set new value
                accessor(newValue);

                if (liveValidate == null) liveValidate = settings.liveValidate;
                // validate data property.
                if (liveValidate === true)
                    mergeErrors(property.validate(entity), tracker, property);
                if (!noCallbackExternal)
                    tracker.propertyChanged.notify({ entity: entity, property: property, oldValue: oldValue, newValue: newValue });

                // if this property is primary key fix index tables.
                if (property.isKeyPart) {
                    if (tracker.manager) // After a pk changed, tell entity container to update its index tables.
                        tracker.manager.entities.relocateKey(entity, oldKey, newKey);
                    // Update navigations' foreign keys to match with new key.
                    updateForeignKeys(entity);
                }
                if (property.isComplex) {
                    var oldOwners = oldValue.$tracker.owners;
                    for (var i = oldOwners.length - 1; i >= 0; i--) {
                        var owner = oldOwners[i];
                        if (owner.entity == entity && owner.property == property)
                            oldOwners.splice(i, 1);
                    }
                    if (oldOwners.length == 0 && oldValue.$tracker.manager)
                        oldValue.$tracker.manager.detachEntity(oldValue);
                    newValue.$tracker.owners.push({ entity: entity, property: property });
                }
                if (tracker.manager) {
                    var autoFixScalar = tracker.manager.autoFixScalar;
                    if (autoFixScalar == null) autoFixScalar = settings.autoFixScalar;
                    // if this property is foreign key fix related navigation properties.
                    helper.forEach(property.relatedNavigationProperties, function (np) {
                        if (np.isScalar === true) {
                            var fk = tracker.foreignKey(np);
                            if (fk) {
                                // get old navigation property related to this foreign key.
                                var oldFkEntity = tracker.getValue(np.name);
                                // if old entity has same key there is nothing to do.
                                if (oldFkEntity && oldFkEntity.$tracker.key === fk) return;
                                // find new entity from cache.
                                var fkEntity = null;
                                if (autoFixScalar)
                                    fkEntity = tracker.manager.getEntityByKey(fk, np.entityType);

                                if (fkEntity)
                                    tracker.setValue(np.name, fkEntity); // if found set as new value.
                                else if (oldFkEntity)
                                    tracker.setValue(np.name, new core.ValueNotifyWrapper(null, true)); // if not found set navigation to null but preserve foreign key.
                            } else
                                tracker.setValue(np.name, null); // if foreign key is null set navigation to null.
                        }
                    });
                }
            }

            function scalarNavigationPropertyChange(entity, property, accessor, newValue) {
                var noCallbackBeetle = false;
                var noCallbackExternal = false;
                if (Assert.isInstanceOf(newValue, core.ValueNotifyWrapper)) {
                    noCallbackBeetle = newValue.fromBeetle;
                    noCallbackExternal = !newValue.fromBeetle;
                    newValue = newValue.value;
                }

                var oldValue = accessor();
                if (oldValue === newValue) return;

                // check if this navigation property can be set with newValue.
                property.checkAssign(newValue);

                accessor(newValue);

                // validate navigation property.
                var tracker = entity.$tracker;
                var liveValidate = tracker.liveValidate;
                if (liveValidate == null && tracker.manager)
                    liveValidate = tracker.manager.liveValidate;
                if (liveValidate == null) liveValidate = settings.liveValidate;
                if (liveValidate === true)
                    mergeErrors(property.validate(entity), tracker, property);
                if (!noCallbackExternal)
                    tracker.propertyChanged.notify({ entity: entity, property: property, oldValue: oldValue, newValue: newValue });

                // Check if newValue is in the manager, if not attach it.
                processEntity(newValue, tracker.manager);
                // arrange owners of this entity.
                if (property.isComplex) {
                    if (newValue == null)
                        throw helper.createError(i18N.complexCannotBeNull, [property.displayName], { entity: entity, property: property });
                    var owners = oldValue.$tracker.owners;
                    for (var i = owners.length - 1; i >= 0; i--) {
                        var owner = owners[i];
                        if (owner.entity == entity && owner.property == property)
                            owners.splice(i, 1);
                    }
                    if (oldValue.$tracker.owners.length == 0 && oldValue.$tracker.manager)
                        oldValue.$tracker.manager.detachEntity(oldValue);
                    newValue.$tracker.owners.push({ entity: entity, property: property });
                    setModified(entity, property.name, newValue.$tracker.toRaw(), tracker);
                } else {
                    // Set related foreign key properties (unless preserving fks wanted).
                    if (!noCallbackBeetle) {
                        if (property.triggerOwnerModify && property.foreignKeys.length == 0)
                            setModified(entity, null, null, tracker);
                        helper.setForeignKeys(entity, property, newValue);
                    }

                    var inverse = property.inverse;
                    if (inverse) {
                        if (inverse.isScalar) {
                            // If other side of the navigation is also scalar (1-1) set the value.
                            if (oldValue) oldValue.$tracker.setValue(inverse.name, null);
                            if (newValue) newValue.$tracker.setValue(inverse.name, entity);
                        } else {
                            // If there were an old value remove it from other side's array.
                            if (oldValue) oldValue.$tracker.getValue(inverse.name).remove(entity);
                            // Add new value to array
                            if (newValue) {
                                var array = newValue.$tracker.getValue(inverse.name);
                                if (!helper.findInArray(array, entity))
                                    array.push(entity);
                            }
                        }
                    }
                }
            }

            function pluralNavigationPropertyChange(entity, property, items, removedItems, addedItems) {
                var tracker = entity.$tracker;
                // validate navigation property.
                var liveValidate = tracker.liveValidate;
                if (liveValidate == null && tracker.manager)
                    liveValidate = tracker.manager.liveValidate;
                if (liveValidate == null) liveValidate = settings.liveValidate;
                if (liveValidate === true)
                    mergeErrors(property.validate(entity), tracker, property);
                if (property.triggerOwnerModify)
                    setModified(entity, null, null, tracker);
                tracker.arrayChanged.notify({ entity: entity, property: property, items: items, removedItems: removedItems, addedItems: addedItems });

                var inverse = property.inverse;
                if (inverse) {
                    // Set removed items's scalar navigation properties to null.
                    if (removedItems)
                        helper.forEach(removedItems, function (removedEntity) {
                            if (removedEntity.$tracker.getValue(inverse.name) == entity)
                                removedEntity.$tracker.setValue(inverse.name, null);
                        });
                    // Set added items's scalar properties to this entity.
                    if (addedItems)
                        helper.forEach(addedItems, function (newEntity) {
                            processEntity(newEntity, tracker.manager);
                            newEntity.$tracker.setValue(inverse.name, entity);
                        });
                }
                else {
                    // Set removed items's foreign key to null.
                    if (removedItems)
                        helper.forEach(removedItems, function (removedEntity) {
                            helper.setForeignKeys(removedEntity, property, null);
                        });
                    // Set added items's foreign key.
                    if (addedItems)
                        helper.forEach(addedItems, function (newEntity) {
                            processEntity(newEntity, tracker.manager);
                            helper.setForeignKeys(newEntity, property, entity);
                        });
                }
            }

            function arraySet(entity, property, items, newItems) {
                if (items === newItems) return;

                var behaviour = settings.getArraySetBehaviour();
                if (behaviour == enums.arraySetBehaviour.NotAllowed)
                    throw helper.createError(i18N.settingArrayNotAllowed,
                        { entity: entity, property: property });

                var toRemove = [];
                var toAdd = helper.filterArray(newItems, function () { return true; });
                if (behaviour == enums.arraySetBehaviour.Replace) {
                    helper.forEach(items, function (item) {
                        if (helper.findInArray(toAdd, item))
                            helper.removeFromArray(toAdd, item);
                        else
                            toRemove.push(item);
                    });
                }
                else if (behaviour == enums.arraySetBehaviour.Append) {
                    helper.forEach(newItems, function (item) {
                        if (helper.findInArray(items, item))
                            helper.removeFromArray(toAdd, item);
                    });
                }
                if (toRemove.length > 0)
                    for (var i = toRemove.length - 1; i >= 0; i--)
                        items.splice(helper.indexOf(items, toRemove[i]), 1);
                if (toAdd.length > 0) items.push.apply(items, toAdd);
            }

            function updateForeignKeys(entity) {
                var tracker = entity.$tracker;
                // For each navigation property.
                helper.forEach(tracker.entityType.navigationProperties, function (np) {
                    // If property has inverse navigation defined.
                    if (np.isScalar) {
                        var inverse = np.inverse;
                        if (inverse && inverse.isScalar) {
                            var value = tracker.getValue(np.name);
                            if (value)
                                helper.setForeignKeys(value, inverse, entity);
                        }
                    } else {
                        // Get the current items.
                        var array = tracker.getValue(np.name);
                        if (array && array.length > 0) {
                            // Set foreign keys to new value.
                            helper.forEach(array, function (item) {
                                helper.setForeignKeys(item, np, entity);
                            });
                        }
                    }
                });
            }

            function processEntity(entity, manager) {
                if (!entity || !manager) return;
                if (entity.$tracker.entityType.isComplexType || manager.isInManager(entity)) return;
                if (entity.$tracker.manager == manager) return;
                if (entity.$tracker.manager)
                    throw helper.createError(i18N.entityAlreadyBeingTracked, null, { entity: entity, manager: manager });
                // add to the manager.
                manager.addEntity(entity);
            }

            function setModified(entity, property, value, tracker) {
                var state = tracker.entityState;
                // mark this entity as modified.
                if (state == enums.entityStates.Unchanged) {
                    helper.forEach(tracker.entityType.navigationProperties, function (np) {
                        var inverse = np.inverse;
                        if (inverse && inverse.triggerOwnerModify) {
                            var val = tracker.getValue(np.name);
                            if (val) {
                                if (np.isScalar)
                                    setModified(val, null, null, val.$tracker);
                                else
                                    helper.forEach(val, function (v) {
                                        setModified(v, null, null, v.$tracker);
                                    });
                            }
                        }
                    });
                    tracker.toModified();
                }
                // set original value
                setOriginalValue(property, value, tracker.originalValues, tracker.changedValues);
            }

            function setOriginalValue(property, value, originalValues, changedValues) {
                // Create new original value if property is changing for first time.
                if (property == null) return;
                if (value != null && value.$tracker != null)
                    if (!value.$tracker.entityType.isComplexType) return;

                var oi = helper.findInArray(originalValues, property, 'p');
                if (!oi)
                    originalValues.push({ p: property, v: value });
                var ci = helper.findInArray(changedValues, property, 'p');
                if (!ci)
                    changedValues.push({ p: property, v: value });
            }

            function mergeErrors(newErrors, instance, property) {
                var removed = [];
                // copy existing errors to a new array.
                var oldErrors = property
                    ? helper.filterArray(instance.validationErrors, function (ve) { return ve.property === property; })
                    : helper.filterArray(instance.validationErrors, function () { return true; });
                helper.forEach(oldErrors, function (ve) {
                    // if error already exists remove it from result list.
                    if (helper.findInArray(newErrors, ve.validator, 'validator'))
                        helper.removeFromArray(newErrors, ve.validator, 'validator');
                    else {
                        helper.removeFromArray(instance.validationErrors, ve);
                        removed.push(ve);
                    }
                });
                instance.validationErrors = instance.validationErrors.concat(newErrors);
                if (removed.length > 0 || newErrors.length > 0)
                    instance.validationErrorsChanged.notify({ errors: instance.validationErrors, added: newErrors, removed: removed });
            }

            function checkManager(instance) {
                if (instance.manager == null)
                    throw helper.createError(i18N.entityNotBeingTracked, { entity: entity, manager: instance });
            }

            return ctor;
        })(),
        /**
         * Entity manager class. All operations must be made using manager to be properly tracked.
         * @class
         */
        EntityManager: (function () {
            /**
             * @constructor
             * @param {string|DataService} service - Service url (default service from settings will be used) or service instance.
             * @param {MetadataManager|string|boolean} metadataPrm - [Metadata Manager] or [Metadata string] or [loadMetadata: when false no metadata will be used]
             * @param {Object} injections - Injection object to change behaviour of the manager.
             */
            var ctor = function (service, metadataPrm, injections) {
                initialize(arguments, this);
            };
            var proto = ctor.prototype;

            proto.toString = function () {
                return this.dataService.toString() + ', ' +
                    i18N.pendingChanges + ': ' + this.pendingChangeCount + ', ' +
                    i18N.validationErrors + ': ' + this.validationErrors.length;
            };

            /** Checks if manager is ready. */
            proto.isReady = function () {
                return this.dataService.isReady();
            };

            /** Subscribe ready callback, returns promise when available. */
            proto.ready = function (callback) {
                this._readyCallbacks.push(callback);

                var pp = this.promiseProvider;
                var p = null;
                if (pp) {
                    var d = pp.deferred();
                    this._readyPromises.push(d);
                    p = pp.getPromise(d);
                }

                var that = this;
                setTimeout(function () {
                    checkReady(that);
                }, 10);
                return p;
            };

            /** 
             * Gets entity type by its short name from data service.
             * @param {string} shortName - Entity type short name.
             * @returns {EntityType} Entity type object if found, otherwise null.
             */
            proto.getEntityType = function (shortName) {
                return this.dataService.getEntityType(shortName);
            };

            /**
             * Creates a query for a resource. Every data service can have their own query types.
             * @param {string} resourceName - Server resource name to combine with base uri.
             * @param {string=} shortName - Entity type's short name.
             * @returns {EntityQuery} Entity query. Can be build with method-chaining.
             */
            proto.createQuery = function (resourceName, shortName) {
                return this.dataService.createQuery(resourceName, shortName, this);
            };

            /**
             * Creates a query for a resource. Every data service can have their own query types.
             * @param {string} shortName - Entity type's short name.
             * @param {string=} resourceName - Server resource name to combine with base uri.
             * @returns {EntityQuery} Entity query. Can be build with method-chaining.
             */
            proto.createEntityQuery = function (shortName, resourceName) {
                return this.dataService.createEntityQuery(shortName, resourceName, this);
            };

            /**
             * Register constructor and initializer (optional) for given type.
             * @param {string} shortName - Short name of the type.
             * @param {Function} constructor - Constructor function. Called right after the entity object is generated.
             * @param {Function} initializer - Initializer function. Called after entity started to being tracked (properties converted to observable).
             */
            proto.registerCtor = function (shortName, constructor, initializer) {
                this.dataService.registerCtor(shortName, constructor, initializer);
            };

            /**
             * Creates an entity based on metadata information.
             * @param {string} shortName - Short name of the type.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity with observable properties. 
             */
            proto.createEntity = function (shortName, initialValues) {
                var result = this.dataService.createEntity(shortName, initialValues);
                var results = [result];
                mergeEntities(results, null, enums.mergeStrategy.ThrowError, enums.entityStates.Added, this);
                return result;
            };

            /**
             * Creates an entity based on metadata information but doesn't attach to manager.
             * @param {string} shortName - Short name of the type.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity with observable properties. 
             */
            proto.createDetachedEntity = function (shortName, initialValues) {
                return this.dataService.createEntity(shortName, initialValues);
            };

            /**
             * Creates a raw entity based on metadata information.
             * @param {string} shortName - Short name of the type.
             * @param {Object} initialValues - Entity initial values.
             * @returns {Entity} Entity without observable properties. 
             */
            proto.createRawEntity = function (shortName, initialValues) {
                return this.dataService.createRawEntity(shortName, initialValues);
            };

            /**
             * Request server to create entity.
             * @param {string} shortName - Short name of the type.
             * @param {Object} initialValues - Entity initial values.
             * @param {successCallback=} successCallback - Success callback function.
             * @param {errorCallback=} errorCallback - Error callback function.
             * @returns {Promise} Returns promise if possible.
             */
            proto.createEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                return createAsync(typeName, initialValues, options, successCallback, errorCallback, this);
            };

            /**
             * Request server to create entity. Entity won't be attached to manager.
             * @param {string} shortName - Short name of the type.
             * @param {Object} initialValues - Entity initial values.
             * @param {successCallback=} successCallback - Success callback function.
             * @param {errorCallback=} errorCallback - Error callback function.
             * @returns {Promise} Returns promise if possible.
             */
            proto.createDetachedEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                if (!options) options = { state: enums.entityStates.Detached };
                else options.state = enums.entityStates.Detached;
                return createAsync(typeName, initialValues, options, successCallback, errorCallback, this);
            };

            /**
             * Request server to create entity. Entity won't be attached to manager and won't be made observable.
             * @param {string} shortName - Short name of the type.
             * @param {Object} initialValues - Entity initial values.
             * @param {successCallback=} successCallback - Success callback function.
             * @param {errorCallback=} errorCallback - Error callback function.
             * @returns {Promise} Returns promise if possible.
             */
            proto.createRawEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                if (!options) options = { makeObservable: false };
                else options.makeObservable = false;
                return createAsync(typeName, initialValues, options, successCallback, errorCallback, this);
            };

            function createAsync(typeName, initialValues, options, successCallback, errorCallback, instance) {
                // Create promise if possible.
                options = options || {};
                var async = options.async;
                if (async == null) async = instance.workAsync;
                if (async == null) async = settings.workAsync;
                options.async = async;
                var pp = !async ? null : instance.promiseProvider;
                var d = null;
                if (pp) d = pp.deferred();

                var makeObservable = options.makeObservable;
                if (makeObservable == null) makeObservable = true;
                var detached = options.state == enums.entityStates.Detached;
                var retVal = instance.dataService.createEntityAsync(
                    typeName, initialValues, options,
                    function (entity, allEntities, headerGetter, xhr) {
                        try {
                            var isSingle = false;
                            if (!Assert.isArray(entity)) {
                                entity = [entity];
                                isSingle = true;
                            }
                            if (makeObservable && !detached) // Merge incoming entities.
                                mergeEntities(entity, allEntities, enums.mergeStrategy.ThrowError, enums.entityStates.Added, instance);
                            // If only one entity returned (most likely) return it, otherwise return the array.
                            if (isSingle)
                                entity = entity[0];

                            var extra = {};
                            extra.userData = headerGetter("X-UserData");
                            var extraNeeded = extra.userData != null;
                            if (options.includeHeaderGetter === true) {
                                extra.headerGetter = headerGetter;
                                extraNeeded = true;
                            }
                            if (options.includeXhr === true) {
                                extra.xhr = xhr;
                                extraNeeded = true;
                            }

                            if (extraNeeded)
                                entity.$extra = extra;

                            onSuccess(successCallback, pp, d, entity);
                        } catch (e) {
                            onError(errorCallback, pp, d, entity, instance);
                        }
                    },
                    function (error) {
                        error.typeName = typeName;
                        onError(errorCallback, pp, d, error, instance);
                    }
                );

                if (pp) return pp.getPromise(d);
                return retVal;
            }

            /**
             * Executes given query.
             * @param {EntityQuery} query 
             * @param {QueryOptions} options - Query options.
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             * @returns {Promise} Returns promise if possible.
             */
            proto.executeQuery = function (query, options, successCallback, errorCallback) {
                if (query.options)
                    options = helper.combine(query.options, options);
                var modifiedArgs = notifyExecuting(this, query, options);
                query = modifiedArgs.query;
                options = modifiedArgs.options;
                options = options || {};

                // Create promise if possible.
                var async = options.async;
                if (async == null) async = this.workAsync;
                if (async == null) async = settings.workAsync;
                var pp = !async ? null : this.promiseProvider;
                var d = null;
                if (pp) d = pp.deferred();

                // get execute options from parameters.
                var merge = enums.mergeStrategy.Preserve, execution = enums.executionStrategy.Server, locals = null;
                if (Assert.isEnum(options, enums.mergeStrategy)) {
                    merge = options;
                    options = { makeObservable: merge != enums.mergeStrategy.NoTrackingRaw };
                } else if (Assert.isEnum(options, enums.executionStrategy))
                    execution = options;
                else {
                    if (options.merge) merge = options.merge;
                    if (options.execution) execution = options.execution;
                    options.async = async;
                    options.makeObservable = merge != enums.mergeStrategy.NoTrackingRaw;
                    if (options.handleUnmappedProperties == null) options.handleUnmappedProperties = this.handleUnmappedProperties;
                }

                var noTracking = merge == enums.mergeStrategy.NoTracking || merge == enums.mergeStrategy.NoTrackingRaw;
                if (noTracking && execution == enums.executionStrategy.Both)
                    throw helper.createError(i18N.executionBothNotAllowedForNoTracking,
                        { executionStrategy: execution, mergeStrategy: merge });

                // execute locally if needed.
                if (execution == enums.executionStrategy.Local || execution == enums.executionStrategy.LocalIfEmptyServer)
                    locals = this.executeQueryLocally(query, options.varContext);

                var retVal = null;
                // if there is no need for server query, return
                if (execution == enums.executionStrategy.Local || (execution == enums.executionStrategy.LocalIfEmptyServer && locals && (locals.length == null || locals.length > 0))) {
                    locals = notifyExecuted(this, query, options, locals);
                    onSuccess(successCallback, pp, d, locals);
                } else {
                    var that = this;
                    retVal = this.dataService.executeQuery(
                        query, options,
                        function (newEntities, allEntities, headerGetter, xhr) {
                            try {
                                // merge results.
                                var isSingle = false;
                                // read inline count header.
                                var inlineCount = headerGetter("X-InlineCount");
                                if (inlineCount != null) inlineCount = Number(inlineCount);

                                if (newEntities) {
                                    if (!noTracking) {
                                        // we convert result to array to get modified result (replaced with cached by manager when necessary).
                                        if (!Assert.isArray(newEntities)) {
                                            newEntities = [newEntities];
                                            isSingle = true;
                                        }
                                        mergeEntities(newEntities, allEntities, merge, enums.entityStates.Unchanged, that, options.autoFixScalar, options.autoFixPlural);
                                        if (isSingle)
                                            newEntities = newEntities[0];
                                    }
                                }
                                // if option need local and server results both, after server query re-run same query on local.
                                if (execution == enums.executionStrategy.Both) {
                                    newEntities = that.executeQueryLocally(query, options.varContext, true);
                                    if (newEntities.$inlineCountDiff != null) {
                                        if (inlineCount != null)
                                            inlineCount += newEntities.$inlineCountDiff;
                                        delete newEntities.$inlineCountDiff;
                                    }
                                }
                                if (newEntities && Assert.isObject(newEntities)) {
                                    if (query.inlineCountEnabled && inlineCount != null)
                                        newEntities.$inlineCount = inlineCount;

                                    var extra = {};
                                    extra.userData = headerGetter("X-UserData");
                                    var extraNeeded = extra.userData != null;
                                    if (options.includeHeaderGetter === true) {
                                        extra.headerGetter = headerGetter;
                                        extraNeeded = true;
                                    }
                                    if (options.includeXhr === true) {
                                        extra.xhr = xhr;
                                        extraNeeded = true;
                                    }

                                    if (extraNeeded)
                                        newEntities.$extra = extra;
                                }
                                newEntities = notifyExecuted(that, query, options, newEntities);
                                onSuccess(successCallback, pp, d, newEntities);
                            } catch (e) {
                                onError(errorCallback, pp, d, e, that);
                            }
                        },
                        function (error) {
                            error.query = query;
                            onError(errorCallback, pp, d, error, that);
                        }
                    );
                }

                if (pp) return pp.getPromise(d);
                return retVal;
            };

            /**
             * Executes given query against local cache.
             * @param {EntityQuery} query 
             * @param {Object|any[]} varContext - Variable context for the query.
             * @param {boolean} calculateInlineCountDiff - When true, effect of the local entities to server entities will be calculated.
             */
            proto.executeQueryLocally = function (query, varContext, calculateInlineCountDiff) {
                // get entity type of the query
                var et = query.entityType;
                var entities;
                if (et) {
                    // find entity set for the entity type.
                    var entitySet = this.entities.findEntitySet(et);
                    // get entities from entity set (container)
                    if (entitySet)
                        entities = entitySet.getEntities();
                    else return [];
                } else
                    throw helper.createError(i18N.typeRequiredForLocalQueries);

                if (calculateInlineCountDiff && query.getExpression(querying.expressions.GroupByExp, false)) {
                    events.warning.notify({ message: i18N.countDiffCantBeCalculatedForGrouped, query: query, options: varContext });
                    calculateInlineCountDiff = false;
                }

                var array = [], addeds = [], deleteds = [];
                helper.forEach(entities, function (entity) {
                    if (entity.$tracker.entityState == enums.entityStates.Added) {
                        if (calculateInlineCountDiff)
                            addeds.push(entity);
                        array.push(entity);
                    }
                    else if (entity.$tracker.entityState == enums.entityStates.Deleted) {
                        if (calculateInlineCountDiff)
                            deleteds.push(entity);
                    }
                    else
                        array.push(entity);
                });
                // get array handling function for query
                var func = query.toFunction();
                // run function against entities
                array = func(array, varContext);
                if (calculateInlineCountDiff && array.$inlineCount != null) {
                    var addedEffect = addeds.length > 0 ? func(addeds, varContext).$inlineCount : 0;
                    var deletedEffect = deleteds.length > 0 ? func(deleteds, varContext).$inlineCount : 0;
                    array.$inlineCountDiff = addedEffect - deletedEffect;
                }
                return array;
            };

            /** 
             * Finds entity with given key by searching entity type's entity set.
             * @param {string} key - Entity key as a string. When entity has more than one key, the key is keys joined with a ','.
             * @param {EntityType} type - Entity type or type short name.
             */
            proto.getEntityByKey = function (key, type) {
                var t = Assert.isInstanceOf(type, metadata.EntityType) ? type : this.getEntityType(type, true);
                return this.entities.getEntityByKey(key, t);
            };

            /** Marks entity as deleted and clear all navigations. */
            proto.deleteEntity = function (entity) {
                // check if given entity is being tracked by this manager.
                checkEntity(entity, this);
                // do cascade deletes.
                var that = this;
                var toDelete = [];
                helper.forEach(entity.$tracker.entityType.navigationProperties, function (np) {
                    if (np.cascadeDelete) {
                        if (np.inverse && np.inverse.cascadeDelete)
                            throw helper.createError(i18N.twoEndCascadeDeleteNotAllowed, { entity: entity, property: np });

                        var value = entity.$tracker.getValue(np.name);
                        if (value) {
                            if (np.isScalar) {
                                if (np.foreignKeys != null && np.foreignKeys.length > 0)
                                    toDelete.push(value);
                                else
                                    that.deleteEntity(value);
                            }
                            else {
                                var items = helper.filterArray(value, function () { return true; });
                                helper.forEach(items, function (item) {
                                    that.deleteEntity(item);
                                });
                            }
                        }
                    }
                });
                // If entity is in Added state, we can remove it from manager.
                if (entity.$tracker.entityState === enums.entityStates.Added)
                    // Clear navigations.
                    this.detachEntity(entity);
                else {
                    // Clear navigations.
                    clearNavigations(entity, true);
                    // Mark entity as deleted.
                    entity.$tracker.toDeleted();
                }
                for (var i = 0; i < toDelete.length; i++) {
                    that.deleteEntity(toDelete[i]);
                }
            };

            /**
             * Adds given entity to manager's entity container. State will be 'Added'.
             * @param {Entity} detachedEntity - The detached entity.
             * @param {MergeOptions} options - Entity merge options.
             */
            proto.addEntity = function (detachedEntity, options) {
                mergeEntity(detachedEntity, options, enums.entityStates.Added, this);
            };

            /**
             * Attaches given entity to manager's entity container. State will be 'Unchanged'.
             * @param {Entity} detachedEntity - The detached entity.
             * @param {MergeOptions} options - Entity merge options.
             */
            proto.attachEntity = function (detachedEntity, options) {
                mergeEntity(detachedEntity, options, enums.entityStates.Unchanged, this);
            };

            function mergeEntity(detachedEntity, options, defaultState, instance) {
                // get merge options
                var merge = enums.mergeStrategy.ThrowError, state = defaultState;
                if (options) {
                    if (options.merge != null) merge = options.merge;
                    if (options.state != null) state = options.state;
                }
                else options = {};
                // Merge entities to cache.
                if (!Assert.isArray(detachedEntity)) detachedEntity = [detachedEntity];
                mergeEntities(detachedEntity, null, merge, state, instance, options.autoFixScalar, options.autoFixPlural);
            }

            /** Detaches entity from manager and stops tracking. */
            proto.detachEntity = function (entity, includeRelations) {
                var manager = this;
                if (!Assert.isArray(entity)) entity = [entity];
                var detachList = includeRelations === true ? this.flatEntities(entity) : entity;

                helper.forEach(detachList, function (toDetach) {
                    if (toDetach.$tracker.entityType.isComplexType && toDetach.$tracker.owners.length > 0)
                        throw helper.createError(i18N.cannotDetachComplexTypeWithOwners);

                    // check if given entity is being tracked by this manager.
                    checkEntity(toDetach, manager);
                    // Clear navigations.
                    clearNavigations(toDetach, true);
                    // remove subscriptions for this entity.
                    unsubscribeFromEntity(toDetach, manager);
                    // Set entity state to detached.
                    toDetach.$tracker.toDetached();
                    toDetach.$tracker.manager = null;
                    // Remove from cache.
                    manager.entities.remove(toDetach);
                });
            };

            /** 
             * Reject all changes made to this entity to initial values and detach from context if its newly added.
             * @param {Entity} entity - The entity.
             * @param {boolean} includeRelations - If set to true, rejectChanges will be called for all navigation properties too.
             */
            proto.rejectChanges = function (entity, includeRelations) {
                var manager = this;
                if (!Assert.isArray(entity)) entity = [entity];
                var rejectList = includeRelations === true ? this.flatEntities(entity) : entity;
                helper.forEach(rejectList, function (toReject) {
                    var tracker = toReject.$tracker;
                    // if entity is in Added state, detach it
                    if (tracker.entityState == enums.entityStates.Added)
                        manager.detachEntity(toReject);
                    else if (tracker.entityState != enums.entityStates.Detached) {
                        tracker.rejectChanges();
                        tracker.toUnchanged();
                    }
                });
            };

            /** 
             * Resets all changes to last accepted values.
             * @param {Entity} entity - The entity.
             * @param {boolean} includeRelations - If set to true, undoChanges will be called for all navigation properties too.
             */
            proto.undoChanges = function (entity, includeRelations) {
                if (!Assert.isArray(entity)) entity = [entity];
                var undoList = includeRelations === true ? this.flatEntities(entity) : entity;
                helper.forEach(undoList, function (toUndo) {
                    toUndo.$tracker.undoChanges();
                });
            };

            /** 
             * Accept all changes made to this entity (clear changed values).
             * @param {Entity} entity - The entity.
             * @param {boolean} includeRelations - If set to true, acceptChanges will be called for all navigation properties too.
             */
            proto.acceptChanges = function (entity, includeRelations) {
                if (!Assert.isArray(entity)) entity = [entity];
                var acceptList = includeRelations === true ? this.flatEntities(entity) : entity;
                helper.forEach(acceptList, function (toAccept) {
                    toAccept.$tracker.acceptChanges();
                });
            };

            /**
             * Creates save package with entity raw values and user data.
             * @param {Entity[]=} entities - Save options.
             * @param {SaveOptions=} options - Save options.
             */
            proto.createSavePackage = function (entities, options) {
                entities = entities || this.getChanges();
                options = options || {};

                var validationErrors = [];
                var validateOnSave = options.validateOnSave;
                if (validateOnSave == null) validateOnSave = this.validateOnSave;
                if (validateOnSave == null) validateOnSave = settings.validateOnSave;
                if (validateOnSave === true) {
                    helper.forEach(entities, function (entity) {
                        if (entity.$tracker.entityState != enums.entityStates.Deleted) {
                            var result = entity.$tracker.validate();
                            if (result && result.length > 0)
                                validationErrors.push({ entity: entity, validationErrors: result });
                        }
                    });
                }
                if (validationErrors.length > 0)
                    throw helper.createError(i18N.validationFailed, { entities: entities, entitiesInError: validationErrors });

                var userData = options.userData || null;
                var forceUpdate = options.forceUpdate;
                if (forceUpdate == null) forceUpdate = this.forceUpdate;
                if (forceUpdate == null) forceUpdate = settings.forceUpdate;
                var data = { userData: userData, forceUpdate: forceUpdate };

                var entityList = this.exportEntities(entities, options);
                data.entities = entityList;
                return data;
            };

            /**
             * Exports entities from manager to raw list.
             * @param {Entity[]=} entities - Entities to export. 
             * @param {ExportOptions=} options - Export options.
             */
            proto.exportEntities = function (entities, options) {
                options = options || {};
                var entityList = [];
                entities = entities || this.entities.getEntities();
                var minimizePackage = options.minimizePackage;
                if (minimizePackage == null) minimizePackage = this.minimizePackage;
                if (minimizePackage == null) minimizePackage = settings.minimizePackage;

                helper.forEach(entities, function (entity, id) {
                    // get entity information.
                    var tracker = entity.$tracker;
                    var type = tracker.entityType;
                    var state = tracker.entityState;
                    var fu = tracker.forceUpdate;
                    var originalValues = {};
                    var e;

                    if (minimizePackage === true) {
                        if (state == enums.entityStates.Modified) {
                            if (tracker.originalValues.length > 0) {
                                e = {};
                                // generate object with minimum properties
                                helper.forEach(tracker.originalValues, function (ov) {
                                    var lastProperty;
                                    var propertyPaths = ov.p.split('.');
                                    if (propertyPaths.length > 1) {
                                        for (var i = 0; i < propertyPaths.length - 1; i++) {
                                            var p = propertyPaths[i];
                                            entity = entity.$tracker.getValue(p);
                                            if (e[p] == null)
                                                e[p] = {};
                                            e = e[p];
                                        }
                                        lastProperty = propertyPaths[propertyPaths.length - 1];
                                    } else lastProperty = ov.p;

                                    var v = tracker.getValue(lastProperty);
                                    if (v && v.$tracker)
                                        v = v.$tracker.toRaw();
                                    e[lastProperty] = v;
                                });
                                // get key values
                                helper.forEach(tracker.entityType.dataProperties, function (dp) {
                                    if (dp.isKeyPart === true || dp.useForConcurrency === true)
                                        e[dp.name] = tracker.getValue(dp.name);
                                });
                            } else if (fu === true)
                                e = tracker.toRaw(entity);
                            else return;
                        } else if (state == enums.entityStates.Deleted) {
                            e = {};
                            // get key values
                            helper.forEach(tracker.entityType.dataProperties, function (dp) {
                                if (dp.isKeyPart === true || dp.useForConcurrency === true)
                                    e[dp.name] = tracker.getValue(dp.name);
                            });
                        } else if (state == enums.entityStates.Added)
                            e = tracker.toRaw(entity);
                        else
                            return;
                    } else
                        e = tracker.toRaw(entity);

                    // populate originalValues for modified entities.
                    if (state == enums.entityStates.Modified)
                        helper.forEach(tracker.originalValues, function (ov) {
                            var v = ov.v;
                            if (v && v.$tracker)
                                v = v.$tracker.toRaw();
                            originalValues[ov.p] = v;
                        });

                    // create an object with type, state and original values.
                    var t = {
                        t: type.name,
                        s: state.toString(),
                        o: originalValues,
                        i: id,
                        f: fu
                    };

                    // set entity index in array to use after save.
                    e.$t = t;
                    entityList.push(e);
                });
                return entityList;
            };

            /**
             * Imports exported entities and starts tracking them.
             * @param {Entity[]} exportedEntities - Previously exported entities to import.
             * @param {MergeStrategy} merge - Merge strategy to apply when importing.
             */
            proto.importEntities = function (exportedEntities, merge) {
                var that = this;
                if (!Assert.isArray(exportedEntities)) exportedEntities = [exportedEntities];
                helper.forEach(exportedEntities, function (exportedEntity) {
                    var tracker = exportedEntity.$t;
                    var state;
                    switch (tracker.s) {
                        case 'Unchanged':
                            state = enums.entityStates.Unchanged;
                            break;
                        case 'Added':
                            state = enums.entityStates.Added;
                            break;
                        case 'Deleted':
                            state = enums.entityStates.Deleted;
                            break;
                        case 'Modified':
                            state = enums.entityStates.Modified;
                            break;
                        default:
                            throw helper.createError(i18N.unsoppertedState, [tracker.s], { entity: exportedEntity });
                    }
                    var entity = that.toEntity(exportedEntity, tracker.t);
                    mergeEntities(entity, [entity], merge || enums.mergeStrategy.Preserve, state, that, true, true);
                    if (tracker.o)
                        for (var p in tracker.o) {
                            var v = tracker.o[p];
                            entity.$tracker.originalValues.push({ p: p, v: v });
                        }
                    entity.$tracker.forceUpdate = tracker.forceUpdate;

                    delete entity.$t;
                });
            };

            /** Check if there is any pending changes. */
            proto.hasChanges = function () {
                return this.pendingChangeCount > 0;
            };

            /** 
             * Gets changes made in this manager's cache.
             * @returns {Entity[]}
             */
            proto.getChanges = function () {
                return this.entities.getChanges();
            };

            /**
             * Saves all changes made in this manager to server via Data Service instance.
             * @param {SaveOptions} options - Options to modify saving behaviour.
             * @param {successCallback} successCallback - Function to call after operation succeeded.
             * @param {errorCallback} errorCallback - Function to call when operation fails.
             * @returns {Promise} Returns promise if supported.
             */
            proto.saveChanges = function (options, successCallback, errorCallback) {
                return this.savePackage(null, options, successCallback, errorCallback)
            }

            /**
             * Saves all changes made in this manager to server via Data Service instance.
             * @param {SavePackage} savePackage - Save package. When provided, this package will be used (no package will be created).
             * @param {successCallback} successCallback - Function to call after operation succeeded.
             * @param {errorCallback} errorCallback - Function to call when operation fails.
             * @returns {Promise} Returns promise if supported.
             */
            proto.savePackage = function (savePackage, options, successCallback, errorCallback) {
                options = options || {};

                // Create promise if possible.
                var async = options.async;
                if (async == null) async = this.workAsync;
                if (async == null) async = settings.workAsync;
                options.async = async;
                var pp = !async ? null : this.promiseProvider;
                var d = null;
                if (pp) d = pp.deferred();

                var changes;
                if (!savePackage) {
                    if (options.entities) {
                        changes = options.entities
                        if (!Assert.isArray(changes)) changes = [changes];
                    }
                    else changes = this.getChanges();

                    if (!changes.length) {
                        onSuccess(successCallback, pp, d, { AffectedCount: 0, GeneratedValues: [] });
                    }
                    else {
                        try {
                            savePackage = this.createSavePackage(changes, options);
                        }
                        catch (error) {
                            onError(errorCallback, pp, d, error, this);
                        }
                    }
                }

                var retVal = null;
                if (savePackage) {
                    options = notifySaving(this, changes, savePackage, options);

                    try {
                        var that = this;
                        retVal = this.dataService.saveChanges(
                            savePackage,
                            options,
                            function (result, headerGetter, xhr) {
                                try {
                                    // merge generated entities
                                    if (result.GeneratedEntities != null && result.GeneratedEntities.length > 0)
                                        mergeEntities(result.GeneratedEntities, null, enums.mergeStrategy.Preserve, enums.entityStates.Unchanged, that, options.autoFixScalar, options.autoFixPlural);

                                    // set returned generated value to existing entity.
                                    if (result.GeneratedValues) {
                                        helper.forEach(result.GeneratedValues, function (g) {
                                            if (g.Index < 0) return;

                                            var entity = changes[g.Index];
                                            var lastProperty;
                                            var propertyPaths = g.Property.split('.');
                                            if (propertyPaths.length > 1) {
                                                for (var i = 0; i < propertyPaths.length - 1; i++)
                                                    entity = entity.$tracker.getValue(propertyPaths[i]);
                                                lastProperty = propertyPaths[propertyPaths.length - 1];
                                            } else lastProperty = g.Property;

                                            var tracker = entity.$tracker;
                                            if (g.Value != null && g.Value.$type) {
                                                var value = [g.Value];
                                                mergeEntities(value, null, enums.mergeStrategy.Preserve, enums.entityStates.Unchanged, that, options.autoFixScalar, options.autoFixPlural);
                                                // with this hack, when value is entity and another entity with same key is already in cache, we get cache item
                                                g.Value = value[0];
                                            }
                                            tracker.setValue(lastProperty, g.Value);
                                        });
                                    }

                                    // Accept all changes, means Added -> Unchanged; Modified -> Unchanged, Clear Original Values; Deleted -> Remove from cache.
                                    acceptSaves(changes, that.entities, that);

                                    result.userData = headerGetter("X-UserData");
                                    if (options.includeHeaderGetter === true)
                                        result.headerGetter = headerGetter;
                                    if (options.includeXhr === true)
                                        result.xhr = xhr;

                                    notifySaved(that, changes, savePackage, options);
                                    onSuccess(successCallback, pp, d, result);
                                }
                                catch (error) {
                                    error.changes = changes;
                                    error.savePackage = savePackage;
                                    onError(errorCallback, pp, d, error, that);
                                }
                            },
                            function (error) {
                                error.changes = changes;
                                error.savePackage = savePackage;
                                onError(errorCallback, pp, d, error, that);
                            }
                        );
                    }
                    catch (error) {
                        onError(errorCallback, pp, d, error, this);
                    }
                }

                if (pp) return pp.getPromise(d);
                return retVal;
            };

            /**
             * Creates an entity based on metadata information.
             * @param {Object} result - Entity initial object. This object instance will be made observable.
             * @param {string} typeName - Entity type name (full).
             * @returns {Entity} Entity with observable properties. 
             */
            proto.toEntity = function (result, typeName) {
                if (result.$type && !typeName)
                    typeName = result.$type;
                return this.dataService.toEntity(result, typeName);
            };

            /** Fix scalar and plural navigations for entity from cache. */
            proto.fixNavigations = function (entity) {
                if (!this.isInManager(entity))
                    throw helper.createError(i18N.entityNotBeingTracked, null, { entity: entity });
                entityAttached(entity, true, true, this);
            };

            /** Checks if given entity is being tracked by this manager. */
            proto.isInManager = function (entity) {
                return entity.$tracker.manager == this;
            };

            /**
             * Flat relation to a single array. With this we can merge entities with complex navigations.
             * @example
             *  Lets say we have an Order with 3 OrderDetails and that OrderDetails have Supplier assigned,
             *  with flatting this entity, we can merge Order, OrderDetails and Suppliers with one call.
             * @param {Entity[]} entities - Entities to flat.
             * @returns {Entity[]} All entities from all relations.
             */
            proto.flatEntities = function (entities) {
                var that = this;
                var flatList = arguments[1] || [];
                if (!Assert.isArray(entities)) entities = [entities];
                helper.forEach(entities, function (entity) {
                    if (entity == null) return;

                    if (Assert.isArray(entity)) {
                        that.flatEntities(entity, flatList);
                        return;
                    }

                    if (helper.findInArray(flatList, entity)) return;
                    // If property is entity, push it to the list.
                    var tracker = entity.$tracker;
                    var type = entity.$type;

                    if (tracker) {
                        flatList.push(entity);
                        if (tracker.entityType.hasMetadata) {
                            helper.forEach(tracker.entityType.dataProperties, function (dp) {
                                if (dp.isComplex) {
                                    var dv = tracker.getValue(dp.name);
                                    if (dv) {
                                        // If property is array, flat each item.
                                        if (Assert.isArray(dv))
                                            that.flatEntities(dv, flatList);
                                        // If property is entity, flat it.
                                        else if (dv.$tracker || dv.$type)
                                            that.flatEntities([dv], flatList);
                                    }
                                }
                            });
                            helper.forEach(tracker.entityType.navigationProperties, function (np) {
                                var nv = tracker.getValue(np.name);
                                if (nv) {
                                    // If property is array, flat each item.
                                    if (Assert.isArray(nv))
                                        that.flatEntities(nv, flatList);
                                    // If property is entity, flat it.
                                    else if (nv.$tracker || nv.$type)
                                        that.flatEntities([nv], flatList);
                                }
                            });
                        } else {
                            helper.forEach(tracker.entityType.properties, function (up) {
                                var uv = tracker.getValue(up);
                                if (uv) {
                                    // If property is array, flat each item.
                                    if (Assert.isArray(uv))
                                        that.flatEntities(uv, flatList);
                                    // If property is entity, flat it.
                                    else if (uv.$tracker || uv.$type)
                                        that.flatEntities([uv], flatList);
                                }
                            });
                        }
                    } else if (type) {
                        flatList.push(entity);
                        for (var p in entity) {
                            // If property is tracker information skip it.
                            if (p === '$type') continue;
                            var v = entity[p];
                            if (v) {
                                // If property is array, flat each item.
                                if (Assert.isArray(v))
                                    that.flatEntities(v, flatList);
                                // If property is entity, flat it.
                                else if (v.$tracker || v.$type)
                                    that.flatEntities([v], flatList);
                            }
                        }
                    }
                });
                return flatList;
            };

            /** 
             * Returns tracking info for given entity.
             * @param {Entity} entity - The entity.
             * @returns {EntityTracker} Entity tracking object.
             */
            proto.entry = function (entity) {
                return entity.$tracker;
            };

            /**
             * Creates entity set for given type.
             * @param {EntityType|string|Function} - Entity type.
             * @returns {EntitySet}
             */
            proto.createSet = function (type) {
                if (!Assert.isInstanceOf(type, metadata.EntityType)) {
                    if (Assert.isFunction(type)) type = helper.getFuncName(type);
                    type = this.getEntityType(type, true);
                }
                return new core.EntitySet(type, this);
            }

            /**
             * Finds entity set for given type name.
             * @param {string|Function} - Entity type.
             * @returns {EntitySet}
             */
            proto.set = function (shortName) {
                if (Assert.isFunction(shortName)) shortName = helper.getFuncName(shortName);
                return this.entitySets && this.entitySets[shortName];
            }

            /** Clears local cache, validation errors and resets change counter to 0.*/
            proto.clear = function () {
                helper.forEach(this.entities.allEntities, function (e) {
                    e.$tracker.manager = null;
                });

                this.pendingChangeCount = 0;
                this.entities = new core.EntityContainer();
                this.validationErrors = [];
            }

            /** Initialize instance with provided arguments. */
            function initialize(args, instance) {
                instance._readyCallbacks = [];
                instance._readyPromises = [];

                // Entity manager can take 1 to 3 arguments.
                if (args.length < 1 || args.length > 3)
                    throw helper.createError(i18N.managerInvalidArgs, { entityManager: instance });
                var service = args[0], metadataPrm = args[1], injections = args[2];
                // If first parameter is data service instance use it
                if (Assert.isInstanceOf(service, baseTypes.DataServiceBase)) {
                    instance.dataService = service;
                    injections = args[1];
                }
                else if (Assert.isTypeOf(service, 'string')) {
                    if (args.length === 2) {
                        if (Assert.isObject(metadataPrm) && !Assert.isInstanceOf(metadataPrm, metadata.MetadataManager)) {
                            injections = metadataPrm;
                            metadataPrm = undefined;
                        }
                    }

                    // If first parameter is string, use it as an Uri and create the default service.
                    var dst = settings.getDefaultServiceType();
                    var serviceType = dst === enums.serviceTypes.OData ? services.ODataService : services.BeetleService;
                    instance.dataService = new serviceType(service, metadataPrm, injections);
                }
                else throw helper.createError(i18N.managerInvalidArgs, { entityManager: this, arguments: args });

                injections = injections || {};
                instance.promiseProvider = injections.promiseProvider || settings.getPromiseProvider();
                instance.autoFixScalar = injections.autoFixScalar;
                instance.autoFixPlural = injections.autoFixPlural;
                instance.validateOnMerge = injections.validateOnMerge;
                instance.validateOnSave = injections.validateOnSave;
                instance.liveValidate = injections.liveValidate;
                instance.handleUnmappedProperties = injections.handleUnmappedProperties;
                instance.forceUpdate = injections.forceUpdate;
                instance.workAsync = injections.workAsync;
                instance.minimizePackage = injections.minimizePackage;

                // Create a integer value to hold change count. This value will be updated after every entity state change.
                instance.pendingChangeCount = 0;
                // Create the entity container.
                instance.entities = new core.EntityContainer();
                instance.validationErrors = [];
                // Events.
                instance.entityStateChanged = new core.Event('entityStateChanged', instance);
                instance.validationErrorsChanged = new core.Event('validationErrorsChanged', instance);
                instance.hasChangesChanged = new core.Event('hasChangesChanged', instance);
                instance.queryExecuting = new core.Event('queryExecuting', instance);
                instance.queryExecuted = new core.Event('queryExecuted', instance);
                instance.saving = new core.Event('saving', instance);
                instance.saved = new core.Event('saved', instance);

                var registerMetadataTypes = injections.registerMetadataTypes;
                if (registerMetadataTypes == null)
                    registerMetadataTypes = settings.registerMetadataTypes;
                instance.dataService.ready(function () {
                    var metadata = instance.dataService.metadataManager;
                    if (metadata) {
                        var types = metadata.types;
                        if (types) {
                            instance.entitySets = {};
                            for (var i = 0; i < types.length; i++) {
                                var type = types[i];
                                var shortName = type.shortName;
                                if (registerMetadataTypes) {
                                    if (!(shortName in instance))
                                        instance[shortName] = getManagerEntityClass(shortName, instance);

                                    if (!(shortName in root))
                                        root[shortName] = getGlobalEntityClass(type);
                                }

                                var setName = type.setName;
                                if (setName && !instance.entitySets.hasOwnProperty(setName)) {
                                    var set = instance.createSet(type);
                                    if (registerMetadataTypes) instance[setName] = set;
                                    instance.entitySets[shortName] = set;
                                }
                            }
                        }
                        var enums = metadata.enums;
                        if (enums) {
                            for (var enumName in enums) {
                                if (!(enumName in root))
                                    root[enumName] = enums[enumName];
                            }
                        }
                    }

                    checkReady(instance);
                });

                function getManagerEntityClass(shortName, manager) {
                    return function (initialValues) {
                        helper.extend(this, initialValues);
                        manager.createEntity(shortName, this);
                    };
                }

                function getGlobalEntityClass(type) {
                    return function (initialValues, createRaw) {
                        helper.extend(this, initialValues);
                        if (createRaw == true)
                            type.createRawEntity(this);
                        else
                            type.createEntity(this);
                    };
                }
            }

            /** Checks if manager is ready, if so calls callbacks. */
            function checkReady(instance) {
                if (instance.isReady()) {
                    var cs = instance._readyCallbacks.slice(0);
                    var ps = instance._readyPromises.slice(0);
                    instance._readyCallbacks = [];
                    instance._readyPromises = [];

                    for (var i = 0; i < cs.length; i++) {
                        var c = cs[i];
                        if (c) c.call(instance);

                        var d = ps[i];
                        if (d) {
                            var pp = instance.promiseProvider;
                            if (pp) pp.resolve(d);
                        }
                    }
                }
            }

            /**
             * Merges entities to local cache.
             * @param {Entity[]} newEntities - Entities to merge.
             * @param {Entity[]} flatList - If entities were flatten before we re-use it, otherwise they will be flattened.
             * @param {MergeStrategy} merge - Merge strategy option.
             * @param {EntityState} state - Entity state to use while merging.
             * @param {EntityManager} instance - Entity manager instance.
             * @param {boolean} autoFixScalar - Automatically fix scalar navigations using foreign keys (fast).
             * @param {boolean} autoFixPlural - Automatically fix plural navigations looking for foreign references (slow).
             */
            function mergeEntities(newEntities, flatList, merge, state, instance, autoFixScalar, autoFixPlural) {
                if (!state) state = enums.entityStates.Added;
                else if (state === enums.entityStates.Detached) return;

                if (!merge) merge = enums.mergeStrategy.Preserve;
                if (autoFixScalar == null) autoFixScalar = instance.autoFixScalar;
                if (autoFixScalar == null) autoFixScalar = settings.autoFixScalar;
                if (autoFixPlural == null) autoFixPlural = instance.autoFixPlural;
                if (autoFixPlural == null) autoFixPlural = settings.autoFixPlural;
                var validateOnMerge = instance.validateOnMerge;
                if (validateOnMerge == null) validateOnMerge = settings.validateOnMerge;

                // Flat list, means merge navigations also.
                flatList = flatList || instance.flatEntities(Assert.isArray(newEntities) ? newEntities : [newEntities]);
                var added = [], toOverwrite = [], toReplace = [];
                var that = instance;
                helper.forEach(flatList, function (e) {
                    if (e == null) return;

                    var tracker = e.$tracker;
                    // if entity is not made observable yet, convert it
                    if (!tracker && e.$type)
                        tracker = that.toEntity(e, e.$type).$tracker;
                    else if (tracker.entityType.isComplexType || instance.isInManager(e)) return;
                    var type = tracker.entityType;

                    // Get entity key.
                    var key = tracker.key;
                    var existingEntity = null;
                    // Try to find same entity in manager.
                    if (key) existingEntity = that.entities.getEntityByKey(key, type.floorType);
                    // If there is already an entity with same base type and key.
                    if (existingEntity) {
                        // Self explanatory.
                        if (type.name !== existingEntity.$tracker.entityType.name)
                            throw helper.createError(i18N.sameKeyOnDifferentTypesError, [existingEntity.$tracker.entityType.shortName, type.shortName],
                                { existingEntity: existingEntity, entity: e, manager: that });
                        if (merge === enums.mergeStrategy.ThrowError)
                            throw helper.createError(i18N.sameKeyExists,
                                { existingEntity: existingEntity, entity: e, manager: that });
                        else if (merge === enums.mergeStrategy.Preserve)
                            toReplace.push({ o: e, n: existingEntity }); // Add to replace temp list.
                        else {
                            toReplace.push({ o: e, n: existingEntity }); // Add to replace temp list.
                            toOverwrite.push({ o: existingEntity, n: e }); // Add to overwrite temp list.
                        }
                    } else {
                        // Add entity to cache.
                        that.entities.push(e);
                        // Start tracking.
                        e.$tracker.setManagerInfo(that);
                        // Add to added temp list.
                        added.push(e);
                    }
                });

                // Fix entitys navigations and check existing items.
                helper.forEach(added, function (a) {
                    // Fix navigations.
                    entityAttached(a, autoFixScalar, autoFixPlural, that);
                    // subscribe to entity events.
                    subscribeToEntity(a, that);
                    setEntityState(a, state);
                    // validate newly added entity.
                    if (validateOnMerge === true)
                        a.$tracker.validate();
                });
                // Overwrite all existing entities (If mergeStrategy said so).
                helper.forEach(toOverwrite, function (ow) {
                    // overwrite entity properties
                    overwriteEntity(ow.o, ow.n);
                    setEntityState(ow.o, state);
                });
                // If an existing entity is found in cache, we don't add new entity to the cache, so we need to fix returning array.
                // This could create strange behaviour when adding or attaching a single entity because even if we change given array, 
                // developer still works with discarded entity. So we do not allow adding or attaching an existing entity (like most ORMs).
                helper.forEach(toReplace, function (tr) {
                    var index = helper.indexOf(newEntities, tr.o);
                    if (index >= 0) newEntities[index] = tr.n;
                    resultReplaced(tr.o, tr.n, autoFixScalar, autoFixPlural, that);
                });
            }

            /** If given entity is not being tracked by this manager, throws an error. */
            function checkEntity(entity, instance) {
                if (!instance.isInManager(entity))
                    throw helper.createError(i18N.entityNotBeingTracked, { entity: entity, manager: instance });
            }

            /** Changes entity's state. */
            function setEntityState(entity, state) {
                if (state === enums.entityStates.Unchanged)
                    entity.$tracker.toUnchanged();
                else if (state === enums.entityStates.Modified)
                    entity.$tracker.toModified();
                else if (state === enums.entityStates.Added)
                    entity.$tracker.toAdded();
                else if (state === enums.entityStates.Deleted)
                    entity.$tracker.toDeleted();
                else throw helper.createError(i18N.mergeStateError, [state], { entity: entity, state: state });
            }

            /** Overwrites oldEntity's all properties with newEntity property values. */
            function overwriteEntity(oldEntity, newEntity) {
                var tracker = newEntity.$tracker;
                // Overwrite all properties.
                helper.forEach(tracker.entityType.dataProperties, function (dp) {
                    oldEntity.$tracker.setValue(dp.name, tracker.getValue(dp.name));
                });
            }

            /** Finds navigation and fixes navigation properties for given attached entity. */
            function entityAttached(entity, autoFixScalar, autoFixPlural, instance) {
                if (autoFixScalar != true && autoFixPlural != true) return;
                var tracker = entity.$tracker;
                var type = tracker.entityType;

                helper.forEach(type.navigationProperties, function (np) {
                    var value = tracker.getValue(np.name);
                    if (np.isComplex) {
                        var owners = value.$tracker.owners;
                        var found = false;
                        for (var i = 0; i < owners.length; i++) {
                            var owner = owners[i];
                            if (owner.entity == entity && owner.property == np) {
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                            owners.push({ entity: entity, property: np });
                    } else {
                        if (np.isScalar) // fix replaced entity
                            handleScalar(tracker, value, np, np.name, autoFixScalar, instance);
                        else {
                            // fix replaced entities
                            handlePlural(value, instance);
                            if (autoFixPlural)
                                fixPlural(entity, np, value, instance);
                        }
                    }
                });
                helper.forEach(type.dataProperties, function (dp) {
                    if (dp.isComplex) {
                        var value = tracker.getValue(dp.name);
                        value.$tracker.entityType.isComplexType = true;
                        var owners = value.$tracker.owners;
                        var found = false;
                        for (var i = 0; i < owners.length; i++) {
                            var owner = owners[i];
                            if (owner.entity == entity && owner.property == dp) {
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                            owners.push({ entity: entity, property: dp });
                    }
                });
                helper.forEach(tracker.entityType.properties, function (p) {
                    var value = tracker.getValue(p);
                    if (Assert.isArray(value))
                        handlePlural(value, instance);
                    else
                        handleScalar(tracker, value, null, p, false, instance);
                });
            }

            /** If scalar navigation value is replaced with existing entity, fixes it. */
            function handleScalar(tracker, value, np, npName, autoFix, instance) {
                if (value) {
                    if (value.$tracker && value.$tracker.manager != instance) {
                        value = instance.getEntityByKey(value.$tracker.key, value.$tracker.entityType);
                    }
                    tracker.setValue(npName, value);
                }
                else if (np && autoFix)
                    fixScalar(tracker, np, instance);
            }

            /** If plural navigation items is replaced with existing entities, fixes them. */
            function handlePlural(array, instance) {
                for (var i = array.length - 1; i >= 0; i--) {
                    var item = array[i];
                    if (item && item.$tracker && item.$tracker.manager != instance) {
                        item = instance.getEntityByKey(item.$tracker.key, item.$tracker.entityType);
                    }
                    if (!item) array.splice(i, 1);
                    else array.splice(i, 1, item);
                }
            }

            /** When a query result entity already exists in cache existing entity will be returned as result. This method fixes missing navigations. */
            function resultReplaced(result, existing, autoFixScalar, autoFixPlural, instance) {
                var te = existing.$tracker;
                if (te.entityState == enums.entityStates.Deleted) return;

                var tr = result.$tracker, vr, ve;
                var type = tr.entityType;
                helper.forEach(type.navigationProperties, function (np) {
                    if (np.isComplex) return;

                    vr = tr.getValue(np.name);
                    ve = te.getValue(np.name);
                    if (np.isScalar) {
                        if (!ve) {
                            if (autoFixScalar == true)
                                fixScalar(te, np, instance);
                            else if (!((np.inverse && np.inverse.isScalar) || (autoFixPlural === true && np.inverse && !np.inverse.isScalar))) {
                                // when auto fix is not enabled, try to get items from query result
                                var fkr = tr.foreignKey(np);
                                var fke = te.foreignKey(np);
                                if (fkr == fke && vr != null) {
                                    handleScalar(te, vr, np, np.name, false, instance);
                                }
                            }
                        }
                    }
                    else {
                        if (autoFixPlural)
                            fixPlural(existing, np, ve, instance);
                        else if (!(autoFixScalar === true && np.inverse)) {
                            // copy plural values from result to existing entity
                            helper.forEach(vr, function (vri) {
                                if (!instance.isInManager(vri)) {
                                    vri = instance.getEntityByKey(vri.$tracker.key, vri.$tracker.entityType);
                                }
                                if (vri && !helper.findInArray(ve, vri)) {
                                    ve.push(vri);
                                }
                            });
                        }
                    }
                });
            }

            /** Fixes scalar navigation property. */
            function fixScalar(tracker, np, instance) {
                var fk = tracker.foreignKey(np);
                var found = instance.entities.getEntityByKey(fk, np.entityType);
                if (found && found.$tracker.entityState == enums.entityStates.Deleted) found = null;
                tracker.setValue(np.name, found);
            }

            /** Fixes plural navigation property. */
            function fixPlural(entity, np, array, instance) {
                // get related items from entity container.
                var relations = instance.entities.getRelations(entity, np);
                if (relations)
                    helper.forEach(relations, function (item) {
                        if (item.$tracker.entityState != enums.entityStates.Deleted && !helper.findInArray(array, item))
                            array.push(item);
                    });
            }

            /** 
             * Clears navigation properties of given entity.
             * @param {boolean} preserveFK - When true, we can keep beetle from emptying related foreign key properties.
             */
            function clearNavigations(entity, preserveFK) {
                var tracker = entity.$tracker;
                var type = tracker.entityType;
                var nullValue = preserveFK ? new core.ValueNotifyWrapper(null, true) : null;
                if (type.hasMetadata) {
                    // If type has metadata clear all navigation properties.
                    helper.forEach(type.navigationProperties, function (np) {
                        if (np.isScalar)
                            tracker.setValue(np.name, nullValue);
                        else
                            tracker.getValue(np.name).splice(0);
                    });
                }
            }

            /** Accept all changes made via this entity manager, remove deleted from cache, change state of Added and Modified to Unchanged. */
            function acceptSaves(changes, entities, instance) {
                helper.forEach(changes, function (entity) {
                    if (entity.$tracker.entityState == enums.entityStates.Deleted) {
                        entity.$tracker.toDetached();
                        // remove subscriptions for this entity.
                        unsubscribeFromEntity(entity, instance);
                        // remove from cache.
                        entities.remove(entity);
                    } else
                        entity.$tracker.toUnchanged();
                });
            }

            /**
             * Merges old and new errors and make callback.
             * @param {Entity} entity - The entity.
             * @param {Object} changes - Validation error changes.
             * @param {EntityManager} instance - Entity manager instance.
             */
            function mergeErrors(entity, changes, instance) {
                if (changes.removed.length > 0)
                    for (var i = changes.removed.length - 1; i >= 0; i--)
                        instance.validationErrors.splice(helper.indexOf(instance.validationErrors, changes.removed[i]), 1);
                if (changes.added.length > 0)
                    instance.validationErrors.push.apply(instance.validationErrors, changes.added);
                if (changes.removed.length > 0 || changes.added.length > 0)
                    instance.validationErrorsChanged.notify({ errors: instance.validationErrors, added: changes.added, removed: changes.removed });
            }

            /** Subscribe to entity events. */
            function subscribeToEntity(entity, instance) {
                entity.$tracker.entityStateChanged.subscribe(function (change) {
                    var oldCount = instance.pendingChangeCount;
                    if (change.newChanged === true) instance.pendingChangeCount++;
                    else if (change.newUnchanged === true) instance.pendingChangeCount--;
                    instance.entityStateChanged.notify(change);
                    if (oldCount == 0 && instance.pendingChangeCount > 0)
                        instance.hasChangesChanged.notify({ hasChanges: true });
                    else if (oldCount > 0 && instance.pendingChangeCount == 0)
                        instance.hasChangesChanged.notify({ hasChanges: false });
                });
                entity.$tracker.validationErrorsChanged.subscribe(function (result) {
                    mergeErrors(entity, result, instance);
                });
            }

            /** Unsubscribe from entity events. */
            function unsubscribeFromEntity(entity, instance) {
                // unsubscribe from entity events.
                entity.$tracker.entityStateChanged.unsubscribe(instance.entityStateChanged.notify);
                entity.$tracker.validationErrorsChanged.unsubscribe(instance.validationErrorsChanged.notify);
                // remove existing validation errors
                var errors = helper.filterArray(instance.validationErrors, function (ve) { return ve.entity == entity; });
                helper.removeFromArray(instance.validationErrors, entity, 'entity');
                instance.validationErrorsChanged.notify({ errors: instance.validationErrors, removed: errors, added: [] });
            }

            /** Notifies subscribers about executing query. */
            function notifyExecuting(manager, query, options) {
                var obj = { manager: manager, query: query, options: options };
                manager.queryExecuting.notify(obj);
                events.queryExecuting.notify(obj);
                return obj;
            }

            /** Notifies subscribers about executed query. */
            function notifyExecuted(manager, query, options, result) {
                var obj = { manager: manager, query: query, options: options, result: result };
                manager.queryExecuted.notify(obj);
                events.queryExecuted.notify(obj);
                return obj.result;
            }

            /** Notifies subscribers about save operation. */
            function notifySaving(manager, changes, pkg, options) {
                var obj = { manager: manager, changes: changes, savePackage: pkg, options: options };
                manager.saving.notify(obj);
                events.saving.notify(obj);
                return obj.options;
            }

            /** Notifies subscribers about save completion. */
            function notifySaved(manager, changes, pkg, options) {
                var obj = { manager: manager, changes: changes, savePackage: pkg, options: options };
                manager.saved.notify(obj);
                events.saved.notify(obj);
            }

            /** Called when a operation is completed succesfully. */
            function onSuccess(successCallback, promiseProvider, deferred, data) {
                if (successCallback) successCallback(data);
                if (promiseProvider) promiseProvider.resolve(deferred, data);
            }

            /** Called when a operation is failed. */
            function onError(errorCallback, promiseProvider, deferred, error, manager) {
                error.manager = manager;
                if (errorCallback) errorCallback(error);
                if (promiseProvider) promiseProvider.reject(deferred, error);
                if (!errorCallback && !promiseProvider)
                    throw error;
            }

            return ctor;
        })(),
        /**
         * Base entity class.
         * @constructor
         * @param {EntityType} type - Entity type object.
         * @param {EntityManager=} manager - Entity manager.
         * @param {Object=} initialValues - Entity's initial values.
         * @returns {Entity} 
         */
        EntityBase: function (type, manager, initialValues) {
            if (initialValues)
                helper.extend(this, initialValues);

            type.createEntity(this);

            if (manager != null)
                manager.addEntity(this);
        }
    };

    /** 
     * Data service implementations like ODataService, BeetleService etc..
     * @namespace
     */
    var services = (function () {
        var expose = {};

        /**
         * Beetle Service class.
         * @class
         */
        expose.BeetleService = (function () {
            /**
             * @constructor
             * @param {any} uri - Service URI.
             * @param {MetadataManager|string|boolean} metadataPrm - [Metadata Manager] or [Metadata string] or [loadMetadata: when false no metadata will be used]
             * @param {Object} injections - Injection object to change behaviour of the service.
             */
            var ctor = function (uri, metadataPrm, injections) {
                baseTypes.DataServiceBase.call(this, uri, metadataPrm, injections);
            };
            helper.inherit(ctor, baseTypes.DataServiceBase);
            var proto = ctor.prototype;

            /**
             * Fetch metadata from server.
             * @param {Object} options - Fetch metadata options (async: boolean).
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.fetchMetadata = function (options, successCallback, errorCallback) {
                var retVal = null;
                var that = this;
                options = options || {};
                var async = options.async;
                if (async == null) async = !this.ajaxProvider.syncSupported;
                var timeout = options.timeout || this.ajaxTimeout || settings.ajaxTimeout;
                var extra = options.extra;
                var call = this.ajaxProvider.doAjax(
                    this.uri + 'Metadata',
                    'GET', this.dataType, this.contentType, null, async, timeout, extra, null,
                    function (data, headerGetter, xhr) {
                        // deserialize return value to object.
                        retVal = that.serializationService.deserialize(data); // parse string
                        successCallback(retVal, headerGetter, xhr);
                        return retVal;
                    },
                    errorCallback
                );
                return async ? call : retVal;
            };

            /**
             * When there is no metadata available services may be able to create entities asynchronously (server side must be able to support this).
             * @param {string} typeName - Type name to create.
             * @param {Object} initialValues - Entity initial values.
             * @param {Object=} options - Options (makeObservable: boolean, async: boolean).
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.createEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                if (Assert.isFunction(typeName)) typeName = helper.getFuncName(typeName);
                var that = this;
                options = options || {};
                var makeObservable = options.makeObservable;
                if (makeObservable == null) makeObservable = true;
                var async = options.async;
                if (async == null) async = settings.workAsync;
                var timeout = options.timeout || this.ajaxTimeout || settings.ajaxTimeout;
                var extra = options.extra;
                // if type could not be found in metadata request it from server.
                var uri = that.uri + "CreateType?";
                var queryString = "typeName=" + typeName;
                if (initialValues != null)
                    queryString += "&initialValues=" + that.serializationService.serialize(initialValues);
                uri += queryString;
                var retVal;
                var call = this.ajaxProvider.doAjax(
                    uri,
                    'GET', this.dataType, this.contentType, null, async, timeout, extra, options.headers,
                    function (data, headerGetter, xhr) {
                        // deserialize return value to object.
                        data = that.serializationService.deserialize(data);
                        // Fix the relations between object (using $ref and $id values)
                        var allEntities = that.fixResults(data, makeObservable);
                        retVal = data;
                        successCallback(data, allEntities, headerGetter, xhr);
                        return retVal;
                    },
                    function (error) {
                        errorCallback(error);
                    }
                );
                return async ? call : retVal;
            };

            /**
             * Executes given query.
             * @param {EntityQuery} query 
             * @param {QueryOptions} options - Query options.
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.executeQuery = function (query, options, successCallback, errorCallback) {
                var qp = this.toBeetleQueryParams(query, options && options.varContext);
                return this.executeQueryParams(query.resource, query.parameters, query.bodyParameter, qp, options, successCallback, errorCallback);
            };

            /**
             * Executes given query parameters.
             * @param {string} resource - Server resource to query.
             * @param {EntityQuery} queryParams - The query parameters.
             * @param {QueryOptions} options - Query options.
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.executeQueryParams = function (resource, parameters, bodyParameter, queryParams, options, successCallback, errorCallback) {
                options = options || {};
                var makeObservable = options.makeObservable;
                var handleUnmappedProperties = options.handleUnmappedProperties;

                var method = options.method || ((options.useBody || bodyParameter) && "POST") || "GET";
                var dataType = options.dataType || this.dataType;
                var contentType = options.contentType || this.contentType;

                var async = options.async;
                if (async == null) async = settings.workAsync;
                var timeout = options.timeout || this.ajaxTimeout || settings.ajaxTimeout;

                var uri = options.uri || this.uri || "";
                if (uri && uri[uri.length - 1] != "/") uri += "/";
                uri = uri + resource;

                var prmsArr = [];
                helper.forEach(parameters, function (prm) {
                    prmsArr.push(prm.name + "=" + encodeURIComponent(prm.value));
                });

                if (options.useBody) {
                    bodyParameter = helper.extend({}, bodyParameter);
                    helper.forEach(queryParams, function (qp) {
                        bodyParameter[qp.name] = qp.value;
                    });
                }
                else {
                    helper.forEach(queryParams, function (qp) {
                        prmsArr.push(qp.name + "=" + encodeURIComponent(qp.value));
                    });
                }
                
                var queryString = prmsArr.join("&");
                uri += "?" + queryString;
                var data = bodyParameter == null ? null : this.serializationService.serialize(bodyParameter);

                var that = this;
                // execute query using ajax provider
                var retVal;
                var call = this.ajaxProvider.doAjax(
                    uri,
                    method, dataType, contentType, data, async, timeout, options.extra, options.headers,
                    function (data, headerGetter, xhr) {
                        // deserialize returned data (if deserializable).
                        try {
                            data = that.serializationService.deserialize(data);
                        } catch (e) {
                        }
                        if (data != null && data.$d != null)
                            data = data.$d;
                        // fix relations and convert to entities.
                        var allEntities = null;
                        if (data) {
                            var isSingle = false;
                            if (!Assert.isArray(data)) {
                                data = [data];
                                isSingle = true;
                            }
                            allEntities = that.fixResults(data, makeObservable, handleUnmappedProperties);
                            if (isSingle) data = data[0];
                        }
                        retVal = data;
                        successCallback(data, allEntities, headerGetter, xhr);
                        return retVal;
                    },
                    function (error) {
                        errorCallback(error);
                    }
                );
                return async ? call : retVal;
            };

            /**
             * Saves all changes using AjaxProvider.
             * @param {SavePackage} savePackage - Save package. When provided, this package will be used (no package will be created).
             * @param {successCallback} successCallback - Function to call after operation succeeded.
             * @param {errorCallback} errorCallback - Function to call when operation fails.
             * @returns {Promise} Returns promise if supported.
             */
            proto.saveChanges = function (savePackage, options, successCallback, errorCallback) {
                var that = this;
                options = options || {};
                var async = options.async;
                if (async == null) async = settings.workAsync;
                var timeout = options.timeout || this.ajaxTimeout || settings.ajaxTimeout;
                var extra = options.extra;
                var uri = options.uri || this.uri || '';
                if (uri && uri[uri.length - 1] != '/') uri += '/';
                var saveAction = options.saveAction || 'SaveChanges';
                uri = uri + saveAction;
                var saveData = this.serializationService.serialize(savePackage);
                var type = options.method || 'POST';
                var retVal;
                var call = this.ajaxProvider.doAjax(
                    uri,
                    type, this.dataType, this.contentType, saveData, async, timeout, extra, options.headers,
                    function (result, headerGetter, xhr) {
                        // deserialize returned data (if deserializable).
                        try {
                            result = that.serializationService.deserialize(result);
                        } catch (e) {
                        }
                        // fix relations.
                        if (result) {
                            that.fixResults(result, false, null);
                            delete result.$id;
                            delete result.$type;
                        }
                        retVal = result;
                        successCallback(result, headerGetter, xhr);
                        return retVal;
                    },
                    function (error) {
                        errorCallback(error);
                    }
                );
                return async ? call : retVal;
            };

            /**
             * Fix the relations (like $ref links for circular references) between loaded raw data.
             * @param {Object[]} results - Raw entity objects.
             * @param {boolean} makeObservable - When not false entities will be converted to observables.
             * @param {boolean} handleUnmappedProperties - When true, all values will be handled by their value (i.e. some type changes, string->Date).
             */
            proto.fixResults = function (results, makeObservable, handleUnmappedProperties) {
                var that = this;
                var flatList = arguments[3] || [];
                if (!Assert.isArray(results)) results = [results];
                if (handleUnmappedProperties == null) handleUnmappedProperties = settings.handleUnmappedProperties;
                // Push results id's.
                helper.forEach(results, function (result, i) {
                    if (result == null) return;

                    if (result.$ref)
                        results[i] = flatList[result.$ref - 1];
                    else if (result.$id)
                        fixSingle(result);
                    else if (Assert.isArray(result))
                        that.fixResults(result, makeObservable, handleUnmappedProperties, flatList);
                    else if (handleUnmappedProperties !== false)
                        results[i] = core.dataTypes.handle(result);
                });
                return flatList;

                /** Create navigation fixes for single raw result. */
                function fixSingle(result) {
                    var id = result.$id;
                    delete result.$id;

                    // insert entity to it's id position, so we can get it by id later.
                    flatList[id - 1] = result;

                    for (var property in result) {
                        if (property === '$type') continue;
                        var value = result[property];

                        if (value != null) {
                            // if its a reference add it to fixup list.
                            if (value.$ref)
                                result[property] = flatList[value.$ref - 1];
                            else if (value.$id)
                                fixSingle(value); // if its a entity, fix it.
                            else if (Assert.isArray(value))  // if its array
                                that.fixResults(value, makeObservable, handleUnmappedProperties, flatList);
                            else if (handleUnmappedProperties !== false)
                                result[property] = core.dataTypes.handle(value);
                        }
                    }

                    if (makeObservable !== false) {
                        // make observable
                        var typeName = result.$type;
                        that.toEntity(result, typeName);
                    }
                }
            };

            return ctor;
        })();

        /**
         * OData Service class.
         * Derives from Beetle Service, so supports beetle queries.
         * OData service tries to use OData query structure but can fallback to beetle way.
         * @class
         */
        expose.ODataService = (function () {

            /**
             * @constructor
             * @param {any} uri - Service URI.
             * @param {MetadataManager|string|boolean} metadataPrm - [Metadata Manager] or [Metadata string] or [loadMetadata: when false no metadata will be used]
             * @param {Object} injections - Injection object to change behaviour of the service.
             */
            var ctor = function (uri, metadataPrm, injections) {
                services.BeetleService.call(this, uri, metadataPrm, injections);
                this.useBeetleQueryStrings = false;
            };
            helper.inherit(ctor, expose.BeetleService);
            var proto = ctor.prototype;

            /**
             * Executes given query.
             * Try to use OData, but might fallback to beetle way.
             * @param {EntityQuery} query 
             * @param {QueryOptions} options - Query options.
             * @param {Function} successCallback - Function to call after operation succeeded.
             * @param {Function} errorCallback - Function to call when operation fails.
             */
            proto.executeQuery = function (query, options, successCallback, errorCallback) {
                var qp;
                options = options || {};
                var varContext = options.varContext;
                var useBeetleQueryStrings;
                if (options.useBeetleQueryStrings != null)
                    useBeetleQueryStrings = options.useBeetleQueryStrings;
                else useBeetleQueryStrings = this.useBeetleQueryStrings;
                if (useBeetleQueryStrings === true)
                    qp = this.toBeetleQueryParams(query, varContext);
                else if (query.isMultiTyped === true) {
                    qp = this.toBeetleQueryParams(query, varContext);
                    events.warning.notify({ message: i18N.beetleQueryChosenMultiTyped, query: query, options: options });
                } else if (options.useBody) {
                    qp = this.toBeetleQueryParams(query, varContext);
                    events.warning.notify({ message: i18N.beetleQueryChosenPost, query: query, options: options });
                } else
                    qp = this.toODataQueryParams(query, varContext);
                return this.executeQueryParams(query.resource, query.parameters, query.bodyParameter, qp, options, successCallback, errorCallback);
            };

            return ctor;
        })();

        return expose;
    })();

    /** 
     * Beetle enums.
     * @namespace
     */
    var enums = {
        /**
         * Entity states.
         * Possible values: Detached, Unchanged, Added, Deleted, Modified
         */
        entityStates: new libs.Enum('Detached', 'Unchanged', 'Added', 'Deleted', 'Modified'),
        /**
         * Language operators.
         * Possible values: !, - (unary), &&, ||, ==, ===, !=, !==, >, <, >=, <=, +, -, *, /, %, &, |, <<, >>
         */
        langOperators: (function () {
            var ctor = function (name, code, func, oData, js) {
                this.name = name;
                this.code = code;
                this.asFunc = func;
                this.oData = oData,
                    this.js = js || code;
            };

            var ops = [];
            // unary
            ops.push(new ctor('Not', '!', function (obj) { return !obj(); }, 'not '));
            ops.push(new ctor('Negative', '-', function (obj) { return -1 * obj(); }));
            // logical
            ops.push(new ctor('And', '&&', function (obj1, obj2) { return obj1() && obj2(); }, 'and'));
            ops.push(new ctor('Or', '||', function (obj1, obj2) { return obj1() || obj2(); }, 'or'));
            ops.push(new ctor('Equals', '==', function (obj1, obj2) { return helper.equals(obj1(), obj2(), false, this); }, 'eq'));
            ops.push(new ctor('StrictEquals', '==', function (obj1, obj2) { return helper.equals(obj1(), obj2(), true, this); }, 'eq', '==='));
            ops.push(new ctor('NotEqual', '!=', function (obj1, obj2) { return !helper.equals(obj1(), obj2(), false, this); }, 'ne'));
            ops.push(new ctor('StrictNotEqual', '!=', function (obj1, obj2) { return !helper.equals(obj1(), obj2(), true, this); }, 'ne', '!=='));
            ops.push(new ctor('Greater', '>', function (obj1, obj2) {
                return obj1() > obj2();
            }, 'gt'));
            ops.push(new ctor('Lesser', '<', function (obj1, obj2) {
                return obj1() < obj2();
            }, 'lt'));
            ops.push(new ctor('GreaterEqual', '>=', function (obj1, obj2) {
                var o1 = obj1(), o2 = obj2();
                return o1 == o2 || o1 > o2;
            }, 'ge'));
            ops.push(new ctor('LesserEqual', '<=', function (obj1, obj2) {
                var o1 = obj1(), o2 = obj2();
                return o1 == o2 || o1 < o2;
            }, 'le'));
            // arithmetic
            ops.push(new ctor('Sum', '+', function (obj1, obj2) { return obj1() + obj2(); }, 'add'));
            ops.push(new ctor('Subtract', '-', function (obj1, obj2) { return obj1() - obj2(); }, 'sub'));
            ops.push(new ctor('Multiply', '*', function (obj1, obj2) { return obj1() * obj2(); }, 'mul'));
            ops.push(new ctor('Divide', '/', function (obj1, obj2) { return obj1() / obj2(); }, 'div'));
            ops.push(new ctor('Modulo', '%', function (obj1, obj2) { return obj1() % obj2(); }, 'mod'));
            // bitwise
            ops.push(new ctor('BitAnd', '&', function (obj1, obj2) { return obj1() & obj2(); }));
            ops.push(new ctor('BitOr', '|', function (obj1, obj2) { return obj1() | obj2(); }));
            ops.push(new ctor('BitShiftLeft', '<<', function (obj1, obj2) { return obj1() << obj2(); }));
            ops.push(new ctor('BitShiftRight', '>>', function (obj1, obj2) { return obj1() >> obj2(); }));

            ctor.find = function (code) {
                var a = helper.filterArray(ops, function (op) {
                    return op.code == code || op.oData == code || op.js == code;
                });
                return a.length > 0 ? a[0] : null;
            };

            return ctor;
        })(),
        /**
         * Merge strategies. Can be passed to execute query method of entity manager.
         * Possible values:
         *  Preserve: Cached entities are preserved and will be returned as query result (when entity with same key found).
         *  Overwrite: Cached entity values will be overwritten and cached entity will be returned as query result (when entity with same key found).
         *  ThrowError: Error will be thrown (when entity with same key found).
         *  NoTracking: Query result will not be merged into the cache.
         *  NoTrackingRaw: Query results will not be merged into the cache and will not be converted to entities (raw objects will be returned).
         */
        mergeStrategy: new libs.Enum('Preserve', 'Overwrite', 'ThrowError', 'NoTracking', 'NoTrackingRaw'),
        /**
         * Query execution strategies. Can be passed to execute query method of entity manager.
         * Possible values:
         *  Server: Get entities only from server.
         *  Local: Get entities only from local cache.
         *  Both: Get entities from local cache then from server and then mix them up.
         *  LocalIfEmptyServer: Get entities from local cache if no result is found get them from server.
         */
        executionStrategy: new libs.Enum('Server', 'Local', 'Both', 'LocalIfEmptyServer'),
        /**
         * Property value auto generation type.
         * Possible values:
         *  Identity: Auto-Increment identity column.
         *  Server: Calculated column.
         */
        generationPattern: new libs.Enum('Identity', 'Computed'),
        /**
         * What to do when user sets an observable array's value with a new array.
         * Possible values:
         *  NotAllowed: An exception will be thrown.
         *  Replace: Old items will be replaced with next array items.
         *  Append: New array items will be appended to existing array.
         */
        arraySetBehaviour: new libs.Enum('NotAllowed', 'Replace', 'Append'),
        /**
         * Supported service types.
         * Possible values: OData, Beetle
         */
        serviceTypes: new libs.Enum('OData', 'Beetle')
    };

    /** 
     * Manager independent static events.
     * @namespace
     */
    var events = {
        /** Notifies before a query is being executed. You can modify query and options from the args. */
        queryExecuting: new core.Event('beetleQueryExecuting', this),
        /** Notifies after a query is executed. You can modify result from the args. */
        queryExecuted: new core.Event('beetleQueryExecuted', this),
        /** Notifies before save call started. You can modify options from the args. */
        saving: new core.Event('beetleSaving', this),
        /** Notifies after save call completed. */
        saved: new core.Event('beetleSaved', this),
        /** Notifies when a information level event is occurred. */
        info: new core.Event('beetleInfo', this),
        /** Notifies when a warning level event is occurred. */
        warning: new core.Event('beetleWarning', this),
        /** Notifies when a error level event is occurred. */
        error: new core.Event('beetleError', this)
    };

    /** 
     * Beetle settings.
     * @namespace
     */
    var settings = (function () {
        // set default values with backing fields
        var _observableProvider;
        if (ko)
            _observableProvider = new impls.KoObservableProvider(ko);
        else
            _observableProvider = new impls.PropertyObservableProvider();

        var _promiseProvider;
        if (Q)
            _promiseProvider = new impls.QPromiseProvider(Q);
        else if (angularjs)
            _promiseProvider = new impls.AngularjsPromiseProvider(angularjs);
        else if (Promise)
            _promiseProvider = new impls.Es6PromiseProvider();
        else if ($)
            _promiseProvider = new impls.JQueryPromiseProvider($);

        var _ajaxProvider;
        if (angularjs)
            _ajaxProvider = new impls.AngularjsAjaxProvider(angularjs);
        else if (angular)
            _ajaxProvider = new impls.AngularAjaxProvider(angular.http, angular.Request, angular.Headers);
        else if ($)
            _ajaxProvider = new impls.JQueryAjaxProvider($);
        else if (node)
            _ajaxProvider = new impls.NodejsAjaxProvider(node.http, node.https);
        else
            _ajaxProvider = new impls.VanillajsAjaxProvider();

        var _serializationService = new impls.JsonSerializationService();

        var _arraySetBehaviour = enums.arraySetBehaviour.NotAllowed;
        var _defaultServiceType = enums.serviceTypes.Beetle;
        var _dateConverter = new impls.DefaultDateConverter();

        var _localizeFunction;

        var expose = {};

        /** When an entity loaded into manager, navigation fixer tries to fix all navigation properties.
         * But fixing plural navigations may take time (getting cached entities by their foreign keys).
         * These are the default settings, these settings also can be given by query options,
         * example: manager.executeQuery(query, {merge: mergeStrategy.Preserve, autoFixScalar: false})
         */

        /** Auto fix scalar navigation properties (after merge and after foreign key change). */
        expose.autoFixScalar = true;
        /** Auto fix plural navigation properties (after merge). */
        expose.autoFixPlural = false;
        /** Validate entities before adding to manager cache. */
        expose.validateOnMerge = true;
        /** Validate entities before saving to server. */
        expose.validateOnSave = true;
        /** Validate entities on every property change. */
        expose.liveValidate = true;
        /** When a value is set, try to change its type by its data property or value (for anon types). */
        expose.handleUnmappedProperties = true;
        /** for local queries use case sensitive string comparisons. */
        expose.isCaseSensitive = false;
        /** for local queries trim values before string comparisons. */
        expose.ignoreWhiteSpaces = false;
        /** when true, each entity will be updated -even there is no modified property. */
        expose.forceUpdate = false;
        /** when true, loaded meta-data will be cached for url. */
        expose.cacheMetadata = true;
        /** when true, metadata entities will be registered as classes to manager (tracked entity) and global scope (detached entity). Also, enums will be registered to global scope. */
        expose.registerMetadataTypes = false;
        /** 
         * when not equals to false all Ajax calls will be made asynchronously, 
         * when false createEntityAsync, executeQuery, saveChanges will returns results immediately (when supported).
         */
        expose.workAsync = true;
        /** default timeout for AJAX calls. this value is used when not given with options argument. */
        expose.ajaxTimeout = null;
        /** 
         * when true, while creating save package, for modified only changed and key properties, for deleted only key properties will be used.
         * entities will be created with only sent properties filled, other properties will have default values, please use carefully.
         */
        expose.minimizePackage = false;

        /** 
         * Gets default observable provider instance.
         * @returns {baseTypes.ObservableProviderBase} Current observable provider instance.
         */
        expose.getObservableProvider = function () {
            return _observableProvider;
        };

        /** 
         * Sets default observable provider instance. Will be used when another instance is not injected.
         * @param {ObservableProviderBase} provider - Observable provider instance.
         */
        expose.setObservableProvider = function (provider) {
            _observableProvider = getValue(provider, baseTypes.ObservableProviderBase);
        };

        /** 
         * Gets default promise provider instance.
         * @returns {baseTypes.PromiseProviderBase} Current promise provider instance.
         */
        expose.getPromiseProvider = function () {
            return _promiseProvider;
        };

        /** 
         * Sets default promise provider instance. Will be used when another instance is not injected.
         * @param {PromiseProviderBase} provider - Promise provider instance.
         */
        expose.setPromiseProvider = function (provider) {
            _promiseProvider = provider != null ? getValue(provider, baseTypes.PromiseProviderBase) : null;
        };

        /** 
         * Gets default ajax provider instance.
         * @returns {baseTypes.AjaxProviderBase} Current ajax provider instance.
         */
        expose.getAjaxProvider = function () {
            return _ajaxProvider;
        };

        /** 
         * Sets default ajax provider instance. Will be used when another instance is not injected.
         * @param {AjaxProviderBase} provider - Ajax provider instance.
         */
        expose.setAjaxProvider = function (provider) {
            _ajaxProvider = getValue(provider, baseTypes.AjaxProviderBase);
        };

        /** 
         * Gets default serialization service instance.
         * @returns {baseTypes.SerializationServiceBase} Current serialization service instance.
         */
        expose.getSerializationService = function () {
            return _serializationService;
        };

        /**
         * Sets default serialization service instance. Will be used when another instance is not injected.
         * @param {SerializationServiceBase} service - Serialization service instance.
         */
        expose.setSerializationService = function (service) {
            _serializationService = getValue(service, baseTypes.SerializationServiceBase);
        };

        /** 
         * Gets array set behaviour.
         * @returns {enums.arraySetBehaviour} Current array set behaviour enum value.
         */
        expose.getArraySetBehaviour = function () {
            return _arraySetBehaviour;
        };

        /**
         * Sets array set behaviour.
         * @param {arraySetBehaviour} behaviour - Array set behaviour enum value.
         */
        expose.setArraySetBehaviour = function (behaviour) {
            /// <param name="provider">Array set behaviour.</param>
            _arraySetBehaviour = getValue(behaviour, null, enums.arraySetBehaviour);
        };

        /** 
         * Gets default service type.
         * @returns {enums.serviceTypes} Current service type enum value.
         */
        expose.getDefaultServiceType = function () {
            return _defaultServiceType;
        };

        /**
         * Sets default service type.
         * @param {serviceTypes} serviceType - Service type enum value.
         */
        expose.setDefaultServiceType = function (serviceType) {
            /// <param name="serviceType">Service type enum value.</param>
            _defaultServiceType = getValue(serviceType, null, enums.serviceTypes);
        };

        /**
         * Gets date converter.
         * @returns {baseTypes.SerializationServiceBase} Current date converter instance.
         */
        expose.getDateConverter = function () {
            return _dateConverter;
        };

        /**
         * Sets date converter.
         * @param {SerializationServiceBase} service - Date converter instance.
         */
        expose.setDateConverter = function (converter) {
            _dateConverter = getValue(converter, baseTypes.DateConverterBase);
        };

        /**
         * Gets the localization function.
         * @returns {Function} Current localization function: (string) => string.
         */
        expose.getLocalizeFunction = function () {
            return _localizeFunction;
        };

        /**
         * Sets the localization function.
         * @param {Function} func - Localization function: (string) => string.
         */
        expose.setLocalizeFunction = function (func) {
            helper.assertPrm(func, 'func').isFunction().check();
            _localizeFunction = func;
        };

        function getValue(value, type, typeEnum) {
            if (type && Assert.isInstanceOf(value, type))
                return value;
            else if (typeEnum != null) {
                if (Assert.isNotEmptyString(value)) {
                    var symbols = typeEnum.symbols();
                    for (var i = 0; i < symbols.length; i++) {
                        var sym = symbols[i];
                        if (helper.equals(sym.name, value, false, { isCaseSensitive: false, ignoreWhiteSpaces: false })) {
                            value = sym;
                            break;
                        }
                    }
                }
                if (Assert.isEnum(value, typeEnum)) return value.instance;
            }
            throw helper.createError(i18N.invalidArguments, null, { args: arguments });
        }

        return expose;
    })();

    /** localization */
    var i18N = {
        argCountMismatch: 'Argument count mismatch for "%0".',
        arrayEmpty: 'The array does not contain any element.',
        arrayNotSingle: 'The array does not contain exactly one element.',
        arrayNotSingleOrEmpty: 'The array does not contain zero or one element.',
        assignError: 'Cannot set %0 property with %1.',
        assignErrorNotEntity: 'Cannot set %0 property, value is not an entity.',
        autoGeneratedCannotBeModified: 'Auto generated properties cannot be modified.',
        beetleQueryChosenMultiTyped: 'Beetle query string is used because query is multi-typed.',
        beetleQueryChosenPost: 'Beetle query string is used because query method is POST.',
        beetleQueryNotSupported: 'Beetle queries are not supported, you may use only OData query parameters (where, orderBy, select, expand, top, skip).',
        cannotBeEmptyString: '%0 value can not be empty string.',
        cannotCheckInstanceOnNull: 'Cannot check instance on null value.',
        cannotDetachComplexTypeWithOwners: 'Complex types with owners cannot be detached.',
        compareError: '%0 property value must be equal with %1.',
        complexCannotBeNull: '%0 complex property can not be null.',
        couldNotLoadMetadata: 'Could not load metadata.',
        couldNotLocateNavFixer: 'Could not locate any observable provider.',
        couldNotLocatePromiseProvider: 'Could not locate any promise provider.',
        couldNotParseToken: 'Could not parse %0.',
        countDiffCantBeCalculatedForGrouped: 'In-line count difference can not be calculated when query contains a "groupBy" expression',
        dataPropertyAlreadyExists: 'Data property already exists: %0.',
        entityAlreadyBeingTracked: 'Entity is already being tracked by another manager.',
        entityNotBeingTracked: 'Entity is not being tracked by a manager.',
        executionBothNotAllowedForNoTracking: 'Execution strategy cannot be Both when merge strategy is NoTracking or NoTrackingRaw.',
        expressionCouldNotBeFound: 'Expression could not be found.',
        functionNeedsAlias: '%0 function needs alias to work properly. You can set alias like Linq, p => p.Name.',
        functionNotSupportedForOData: 'OData does not support %0 function.',
        instanceError: '%0 is not an instance of %1.',
        invalidArguments: 'Invalid arguments.',
        invalidDefaultValue: '%0 is not a valid default value for %0.',
        invalidEnumValue: 'Invalid enum value, %0 cannot be found in %1.',
        invalidExpression: '%0 can only have %1 type expressions.',
        invalidPropertyAlias: 'Invalid property alias.',
        invalidStatement: 'Invalid statement.',
        invalidValue: 'Invalid value for %0 property.',
        managerInvalidArgs: 'Invalid arguments. Valid args are: {DataService, [Injections]} or {Uri, [Metadata], [Injections]}.',
        maxLenError: '%0 property length cannot exceed %1.',
        maxPrecisionError: 'Value %0 exceeded maximum precision of %1.',
        mergeStateError: 'Cannot merge entities with %0 state.',
        minLenError: '%0 property length must be greater than %1.',
        noMetadataEntityQuery: 'Cannot create entity query when no metadata is available.',
        noMetadataRegisterCtor: 'Cannot register constructor when no metadata is available.',
        noOpenGroup: 'Could not find any open group.',
        notFoundInMetadata: 'Could not find %0 in metadata.',
        notImplemented: '%0 %1 is not implemented.',
        notNullable: 'Cannot set %0 with null, property is not nullable.',
        oDataNotSupportMultiTyped: 'Multi-Typed queries cannot be used for OData services.',
        odataDoesNotSupportAlias: 'OData services does not support query alias and primitive typed resources.',
        onlyManagerCreatedCanBeExecuted: 'Only queries which are created from a manager can be directly executed.',
        onlyManagerCreatedCanAcceptEntityShortName: 'Only queries which are created from a manager can accept entity type short name parameter.',
        pendingChanges: 'Pending changes',
        pluralNeedsInverse: 'To load plural relations, navigation property must have inverse.',
        projectionsMustHaveAlias: 'All projected values must have a property name or alias.',
        propertyNotFound: 'Could not find property: %0.',
        queryClosed: 'Query is closed, expression cannot be added. Queries must be executed after some expressions like first, single, any, all etc..',
        rangeError: '%0 property value must be between %1 and %2.',
        requiredError: '%0 property is required.',
        sameKeyExists: 'There is already an entity with same key in the manager.',
        sameKeyOnDifferentTypesError: 'Two different types of entities cannot have same keys when they are from same inheritance root (%0, %1).',
        settingArrayNotAllowed: 'Setting array property is not allowed, you may change this via beetle.settings.setArraySetBehaviour(behaviour).',
        stringLengthError: '%0 property length must be between %1 and %2.',
        syncNotSupported: '%0 does not support sync ajax calls.',
        twoEndCascadeDeleteNotAllowed: 'Two-end cascade deletes are not supported.',
        typeError: '%0 type is not %1.',
        typeMismatch: '%0 value type mismatch. expected type: %1, given type: %2, value: %3',
        typeRequiredForLocalQueries: 'To execute queries locally, entity type must be provided (createQuery("Entities", "Entity") or createEntityQuery("Entity")).',
        unclosedQuote: 'Unclosed quote in "%0".',
        unclosedToken: 'Unclosed "%0".',
        unexpectedProperty: 'Unexpected property "%0".',
        unexpectedToken: 'Unexpected %0.',
        unknownDataType: 'Unknown data type: %0.',
        unknownExpression: 'Unknown expression.',
        unknownFunction: 'Unknown function: %0.',
        unknownParameter: 'Unknown parameter: %0.',
        unknownValidator: 'Unknown validator type: %0.',
        unsoppertedState: 'Unsupported entity state: %0.',
        validationErrors: 'Validation errors',
        validationFailed: 'Validation failed.',
        valueCannotBeNull: 'Value cannot be null: %0.',
        operatorNotSupportedForOData: 'Operator is not supported for OData: %0.'
    };
    var i18Ns = { en: i18N };

    /** Export types */
    return {
        version: '2.3.1',
        /** 
         * Register localization
         * @param {string} code - Language code.
         * @param {Object} i18n - Localization object.
         * @param {boolean} active - Make this the current localization.
         */
        registerI18N: function (code, i18n, active) {
            i18Ns[code] = i18n;
            if (active) i18N = i18n;
        },
        /** 
         * Change current localization. Code must be registered before.
         * @param {string} code - Language code.
         */
        setI18N: function (code) {
            var i18n = i18Ns[code];
            if (!i18n)
                throw new Error("Beetle could not find translation for " + code);

            i18N = i18n;
        },

        helper: helper,
        Assert: Assert,
        libs: libs,

        // namespaces
        baseTypes: baseTypes,
        impls: impls,
        metadata: metadata,
        querying: querying,
        core: core,
        services: services,
        enums: enums,
        events: events,
        settings: settings,

        // shortcuts
        MetadataManager: metadata.MetadataManager,
        EntityManager: core.EntityManager,
        EntityBase: core.EntityBase,
        EntitySet: core.EntitySet,
        ODataService: services.ODataService,
        BeetleService: services.BeetleService,
        Event: core.Event,
        Validator: core.Validator,
        ValueNotifyWrapper: core.ValueNotifyWrapper,

        // enums
        entityStates: enums.entityStates,
        mergeStrategy: enums.mergeStrategy,
        executionStrategy: enums.executionStrategy,
        arraySetBehaviour: enums.arraySetBehaviour,
        serviceTypes: enums.serviceTypes
    };
});
