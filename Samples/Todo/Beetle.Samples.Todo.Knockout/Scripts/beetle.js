(function (exports) {
    'use strict';

    var helper = (function () {
        /// <summary>Helper class for common codes. We are not using ECMA 5, so we must write these helper methods.</summary>

        return {
            assertPrm: function (value, name) {
                /// <summary>Creates an assert instance to work with, a shortcut.  Usage: assertPrm(prm, 'prm').isArray().check(). (adapted from breezejs)</summary>
                /// <param name="value">The value.</param>
                /// <param name="name">Name of the parameter.</param>
                return new assert(value, name);
            },
            combine: function (obj1, obj2) {
                /// <summary>Combines first object's properties with second object's properties on a new object.</summary>
                /// <param name="obj1">First object.</param>
                /// <param name="obj2">Second object.</param>
                if (obj1 == obj2) return obj1;
                var obj = {};
                if (obj1 != null) {
                    for (var p1 in obj1) {
                        obj[p1] = obj1[p1];
                    }
                }
                if (obj2 != null) {
                    for (var p2 in obj2) {
                        var v1 = obj[p2];
                        var v2 = obj2[p2];
                        var v = assert.isTypeOf(v1, 'object') && assert.isTypeOf(v2, 'object') ? helper.combine(v1, v2) : v2;
                        obj[p2] = v;
                    }
                }
                return obj;
            },
            objEquals: function (obj1, obj2) {
                /// <summary>Checks if two objects are equal. if parameters are both objects, recursively controls their properties too.</summary>
                /// <param name="obj1">First object.</param>
                /// <param name="obj2">Second object.</param>
                if (obj1 == obj2)
                    return true;

                if (obj1 == null || obj2 == null)
                    return false;
                if (assert.isObject(obj1) && assert.isObject(obj2)) {
                    var count1 = 0;
                    var count2 = 0;
                    for (var p in obj1) {
                        if (!obj2.hasOwnProperty(p)) return false;
                        if (!helper.objEquals(helper.getValue(obj1, p), helper.getValue(obj2, p))) return false;
                        count1++;
                    }
                    for (var p2 in obj2) count2++;
                    return count1 == count2;
                }

                return false;
            },
            isCaseSensitive: function (options) {
                /// <summary>Returns string case option for current operation context.</summary>
                /// <param name="options">Options for the context.</param>
                var isCaseSensitive = options && options.isCaseSensitive;
                return isCaseSensitive == null ? settings.isCaseSensitive : isCaseSensitive;
            },
            ignoreWhiteSpaces: function (options) {
                /// <summary>Returns whitespace ignore option for current operation context.</summary>
                /// <param name="options">Options for the context.</param>
                var ignoreWhiteSpaces = options && options.ignoreWhiteSpaces;
                return ignoreWhiteSpaces == null ? settings.ignoreWhiteSpaces : ignoreWhiteSpaces;
            },
            handleStrOptions: function (str, options) {
                /// <summary>Applies current operation context string options to given parameter.</summary>
                /// <param name="options">Options for the context.</param>
                if (str == null) return str;
                if (!helper.isCaseSensitive(options)) str = str.toLowerCase();
                if (helper.ignoreWhiteSpaces(options)) str = str.trim();
                return str;
            },
            equals: function (obj1, obj2, isStrict, options) {
                /// <summary>Compares two objects. Uses given options when necessary.</summary>
                /// <param name="obj1">First object.</param>
                /// <param name="obj2">Second object.</param>
                /// <param name="isStrict">Use strict comparing (===).</param>
                /// <param name="options">Comparing options: isCaseSensitive, ignoreWhiteSpaces.</param>
                if (typeof obj1 === 'string' && typeof obj2 === 'string') {
                    obj1 = helper.handleStrOptions(obj1, options);
                    obj2 = helper.handleStrOptions(obj2, options);
                }
                return isStrict ? obj1 === obj2 : obj1 == obj2;
            },
            formatString: function (string, params) {
                /// <summary>Works like c#'s string.Format. First paramater is message, other paramaters are replace arguments.</summary>
                /// <param name="string">Message string.</param>
                /// <param name="params">Arguments to replace.</param>
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
            tryFreeze: function (obj, withChildren) {
                /// <summary>Calls Object.freeze() method if available. Old browsers does not support this.</summary>
                /// <param name="obj">Object to freeze.</param>
                /// <param name="withChildren">When 'true', all object parameters, and all items of array parameters will be freezed also.</param>
                if (!obj || !Object.freeze) return obj;
                Object.freeze(obj);
                if (withChildren === true) {
                    for (var p in obj) {
                        var v = obj[p];
                        if (assert.isArray(v))
                            this.tryFreezeArray(v, withChildren);
                        else if (assert.isObject(v))
                            this.tryFreeze(v, withChildren);
                    }
                }
                return obj;
            },
            tryFreezeArray: function (array, withChildren) {
                /// <summary>Tries to freeze all items of an array.</summary>
                /// <param name="array">Array to freeze.</param>
                /// <param name="withChildren">When 'true', all object parameters, and all items of array parameters will be freezed also.</param>
                if (!array || !Object.freeze) return;
                for (var i = 0; i < array.length; i++)
                    this.tryFreeze(array[i], withChildren);
            },
            indexOf: function (array, item, index) {
                /// <summary>Finds the index of the given item in the array.</summary>
                /// <param name="array">Array to search.</param>
                /// <param name="item">Item to find.</param>
                /// <returns type="Number">Index. If the item could not be found returns '-1'.</returns>
                for (var i = index || 0; i < array.length; i++)
                    if (array[i] === item) return i;
                return -1;
            },
            forEach: function (array, callback) {
                /// <summary>Calls given callback with item and current index paramaters for each item in the array, can be used like iterators.</summary>
                /// <param name="array">Array to iterate.</param>
                /// <param name="callback">Method to call for each item.</param>
                for (var i = 0; i < array.length; i++) {
                    var obj = array[i];
                    callback.call(obj, obj, i);
                }
            },
            forEachProperty: function (object, callback) {
                /// <summary>Iterate objects properties but does not make callbacks for functions.</summary>
                /// <param name="object">Object to iterate.</param>
                /// <param name="callback">Method to call for each property.</param>
                for (var p in object) {
                    if (p[0] == '$') continue;
                    var v = object[p];
                    if (assert.isFunction(v)) continue;
                    callback(p, v);
                }
            },
            findInArray: function (array, value, property) {
                /// <summary>Finds given item in the array. When property is given, looks item's given property, otherwise compares items' itself. if item could not be found returns null.</summary>
                /// <param name="array">Array to search.</param>
                /// <param name="value">Value to find.</param>
                /// <param name="property">Property that holds the item. Optional.</param>
                for (var i = 0; i < array.length; i++)
                    if (property) {
                        if (array[i][property] === value) return array[i];
                    } else if (array[i] === value) return value;
                return null;
            },
            filterArray: function (array, predicate) {
                /// <summary>Copies array items that match the given conditions to another array and returns the new array.</summary>
                /// <param name="array">Array to filter.</param>
                /// <param name="predicate">Select conditions.</param>
                var retVal = [];
                for (var i = 0; i < array.length; i++) {
                    var item = array[i];
                    if (predicate(item) === true)
                        retVal.push(item);
                }
                return retVal;
            },
            removeFromArray: function (array, item, property) {
                /// <summary>Removes the item from given array.</summary>
                /// <param name="array">The array.</param>
                /// <param name="item">The item to remove.</param>
                /// <param name="property">The property that holds the value (item).</param>
                /// <returns type="Number">Returns how many item removed.</returns>
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
            mapArray: function (array, callback) {
                var retVal = [];
                for (var i = 0; i < array.length; i++) {
                    var item = array[i];
                    retVal.push(callback.call(item, item, i));
                }
                return retVal;
            },
            createGuid: function () {
                /// <summary>Creates a guid.</summary>

                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                }

                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            },
            inherit: function (derivedClass, baseClass) {
                /// <summary>
                /// Inherits given derivedClass from baseClass.
                /// Generates prototypal relation, sets constructor 
                /// and creates a 'baseClass' property on derived type points to base type.
                /// </summary>
                /// <param name="derivedClass">Derived class.</param>
                /// <param name="baseClass">Base class.</param>
                var f = new Function();
                f.prototype = baseClass.prototype;

                derivedClass.prototype = new f();
                derivedClass.prototype.constructor = derivedClass;
                derivedClass.baseClass = baseClass.prototype;
            },
            getValue: function (object, propertyPath) {
                /// <summary>Reads property of value, used when we are not sure if property is observable.</summary>
                /// <param name="object">The object.</param>
                /// <param name="property">The property.</param>
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
            getResourceValue: function (resourceName, altValue) {
                var localizeFunc = settings.getLocalizeFunction();
                return (localizeFunc && resourceName && localizeFunc(resourceName)) || altValue;
            },
            createValidationError: function (entity, value, property, message, validatorObj) {
                /// <summary>Creates validation error object using given parameters.</summary>
                /// <param name="entity">The entity.</param>
                /// <param name="value">Current value.</param>
                /// <param name="property">The property.</param>
                /// <param name="message">Validation message.</param>
                /// <param name="validatorObj">Validator instance.</param>
                var retVal = { entity: entity, message: message, validator: validatorObj };
                if (value) retVal.value = value;
                if (property) retVal.property = property;

                helper.tryFreeze(retVal);
                return retVal;
            },
            createError: function (message, arg1, arg2) {
                /// <summary>Creates error object with given message and populates with given object's values.</summary>
                /// <param name="message">Error message.</param>
                /// <param name="arg1">Message format arguments.</param>
                /// <param name="arg2">Extra informations, will be attached to error object.</param>
                var args = null, obj = null;
                if (assert.isArray(arg1)) {
                    args = arg1;
                    obj = arg2;
                } else if (assert.isObject(arg1)) obj = arg1;

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
            setForeignKeys: function (entity, navProperty, newValue) {
                /// <summary>Updates foreign keys of given navigation property with new values.</summary>
                /// <param name="entity">The entity.</param>
                /// <param name="navProperty">The navigation property.</param>
                /// <param name="newValue">New value.</param>
                for (var i = 0; i < navProperty.foreignKeys.length; i++) {
                    // We get each related foreign key for this navigation property.
                    var fk = navProperty.foreignKeys[i];
                    var tracker = entity.$tracker;
                    if (newValue) {
                        // When foreign key is built with more than one column, we presume foreign key-primary key order is same
                        // Example:
                        //  When we create an association between Product and Supplier using Name and Location fields
                        //  we presume Supplier's corresponding primary keys are in exactly same order.
                        var k = navProperty.entityType.keys[i];
                        var v = newValue.$tracker.getValue(k.name);
                        tracker.setValue(fk.name, v);
                    } else
                        tracker.setValue(fk.name, fk.getDefaultValue());
                }
            },
            jsepToODataQuery: function (exp, queryContext) {
                /// <summary>Converts parsed javascript expression (jsep) to OData format query string.</summary>
                /// <param name="exp">Jsep expression.</param>
                /// <param name="queryContext">Query execution context, query options, variable context etc.</param>
                if (!queryContext) queryContext = { aliases: [] };
                else if (!queryContext.aliases) queryContext.aliases = [];
                if (exp.type == 'LogicalExpression' || exp.type == 'BinaryExpression') {
                    if (exp.operator == '=>')
                        throw helper.createError(i18N.odataDoesNotSupportAlias);
                    var op = enums.langOperators.find(exp.operator).oData;
                    if (!op) throw helper.createError(i18N.operatorNotSupportedForOData, [exp.operator], { expression: exp });
                    return '(' + helper.jsepToODataQuery(exp.left, queryContext) + ' ' + op + ' ' + helper.jsepToODataQuery(exp.right, queryContext) + ')';
                } else if (exp.type == 'UnaryExpression')
                    return exp.operator + helper.jsepToODataQuery(exp.argument, queryContext);
                else if (exp.type == 'Identifier') {
                    var n = exp.name;
                    if (n[0] == '@') {
                        var val = undefined;
                        var varName = n.slice(1);
                        if (queryContext.expVarContext && queryContext.expVarContext[varName] !== undefined)
                            val = queryContext.expVarContext[varName];
                        else if (queryContext.varContext)
                            val = queryContext.varContext[varName];
                        if (val === undefined) throw helper.createError(i18N.unknownParameter, [n], { expression: exp, queryContext: queryContext });
                        return core.dataTypes.toODataValue(val);
                    } else {
                        var a = helper.findInArray(queryContext.aliases, n, 'alias');
                        if (a) return a.value;
                    }
                    return n;
                } else if (exp.type == 'Literal')
                    return core.dataTypes.toODataValue(exp.value);
                else if (exp.type == 'MemberExpression') {
                    if (queryContext.currentAlias && exp.object.name == queryContext.currentAlias.alias)
                        return exp.property.name;
                    else {
                        var ali = helper.findInArray(queryContext.aliases, exp.object.name, 'alias'), o;
                        if (ali) o = ali.value;
                        else o = helper.jsepToODataQuery(exp.object, queryContext);
                        return o + '/' + exp.property.name;
                    }
                } else if (exp.type == 'Compound') {
                    var sts = [];
                    for (var i = 0; i < exp.body.length; i++) {
                        var st = exp.body[i];
                        var s = helper.jsepToODataQuery(st, queryContext);
                        var ls = s.toLowerCase();
                        if (ls == 'desc' || ls == 'asc') {
                            if (sts.length == 0)
                                throw helper.createError(i18N.invalidStatement, { expression: exp, statement: st });
                            sts[sts.length - 1] += ' ' + s;
                        } else if (ls == 'as') {
                            if (sts.length == 0 || exp.body.length < i + 1)
                                throw helper.createError(i18N.invalidStatement, { expression: exp, statement: st });
                            sts[sts.length - 1] += ' as ' + exp.body[i + 1].name;
                            i++;
                        } else sts.push(s);
                    }
                    return sts.join(', ');
                } else if (exp.type == 'CallExpression') {
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
                            args.push(helper.jsepToODataQuery(arg, queryContext));
                    }
                    var funcName;
                    if (exp.callee.type == 'MemberExpression') {
                        args.splice(0, 0, helper.jsepToODataQuery(exp.callee.object, queryContext));
                        funcName = exp.callee.property.name;
                    } else funcName = exp.callee.name;
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
            jsepToBeetleQuery: function (exp, queryContext) {
                /// <summary>Converts parsed javascript expression (jsep) to Beetle format query string.</summary>
                /// <param name="exp">Jsep expression.</param>
                /// <param name="queryContext">Query execution context, query options, variable context etc.</param>
                if (!queryContext) queryContext = { aliases: [] };
                else if (!queryContext.aliases) queryContext.aliases = [];
                if (exp.type == 'LogicalExpression' || exp.type == 'BinaryExpression') {
                    if (exp.operator == '=>') {
                        queryContext.aliases.push({ alias: exp.left.name, value: 'it' });
                        var r = helper.jsepToBeetleQuery(exp.right, queryContext);
                        queryContext.aliases.pop();
                        return r;
                    }
                    var op = enums.langOperators.find(exp.operator).code;
                    return '(' + helper.jsepToBeetleQuery(exp.left, queryContext) + ' ' + op + ' ' + helper.jsepToBeetleQuery(exp.right, queryContext) + ')';
                } else if (exp.type == 'UnaryExpression')
                    return exp.operator + helper.jsepToBeetleQuery(exp.argument, queryContext);
                else if (exp.type == 'Identifier') {
                    var n = exp.name;
                    if (n[0] == '@') {
                        var val = undefined;
                        var varName = n.slice(1);
                        if (queryContext.expVarContext && queryContext.expVarContext[varName] !== undefined)
                            val = queryContext.expVarContext[varName];
                        else if (queryContext.varContext)
                            val = queryContext.varContext[varName];
                        if (val === undefined) throw helper.createError(i18N.unknownParameter, [n], { expression: exp, queryContext: queryContext });
                        return core.dataTypes.toBeetleValue(val);
                    } else {
                        var a = helper.findInArray(queryContext.aliases, n, 'alias');
                        if (a) return a.value;
                    }
                    return n;
                } else if (exp.type == 'Literal')
                    return core.dataTypes.toBeetleValue(exp.value);
                else if (exp.type == 'MemberExpression') {
                    if (queryContext.currentAlias && exp.object.name == queryContext.currentAlias.alias)
                        return exp.property.name;
                    else {
                        var ali = helper.findInArray(queryContext.aliases, exp.object.name, 'alias'), o;
                        if (ali) o = ali.value;
                        else o = helper.jsepToBeetleQuery(exp.object, queryContext);
                        return o + '.' + exp.property.name;
                    }
                } else if (exp.type == 'Compound') {
                    var sts = [];
                    for (var i = 0; i < exp.body.length; i++) {
                        var st = exp.body[i];
                        var s = helper.jsepToBeetleQuery(st, queryContext);
                        var ls = s.toLowerCase();
                        if (ls == 'desc' || ls == 'asc') {
                            if (sts.length == 0)
                                throw helper.createError(i18N.invalidStatement, { expression: exp, statement: st });
                            sts[sts.length - 1] += ' ' + s;
                        } else if (ls == 'as') {
                            if (sts.length == 0 || exp.body.length < i + 1)
                                throw helper.createError(i18N.invalidStatement, { expression: exp, statement: st });
                            sts[sts.length - 1] += ' as ' + exp.body[i + 1].name;
                            i++;
                        } else sts.push(s);
                    }
                    return sts.join(', ');
                } else if (exp.type == 'CallExpression') {
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
                            args.push(helper.jsepToBeetleQuery(arg, queryContext));
                    }
                    var funcName;
                    if (exp.callee.type == 'MemberExpression') {
                        args.splice(0, 0, helper.jsepToBeetleQuery(exp.callee.object, queryContext));
                        funcName = exp.callee.property.name;
                    } else funcName = exp.callee.name;
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
            jsepToFunction: function (exp, queryContext) {
                /// <summary>Converts parsed javascript expression (jsep) to Javascript function.</summary>
                /// <param name="exp">Jsep expression.</param>
                /// <param name="queryContext">Query execution context, query options, variable context etc.</param>
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
                    } else if (exp.type == 'UnaryExpression') {
                        var arg = function () { return helper.jsepToFunction(exp.argument, queryContext)(value); };
                        var uop = enums.langOperators.find(exp.operator);
                        return uop.asFunc.call(varContext, arg);
                    } else if (exp.type == 'Identifier') {
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
                        if (v === undefined) return window[n];
                        return v;
                    } else if (exp.type == 'Literal')
                        return exp.value;
                    else if (exp.type == 'MemberExpression') {
                        if (exp.object.name) {
                            if (queryContext.currentAlias && exp.object.name == queryContext.currentAlias.alias)
                                return helper.getValue(value, exp.property.name);
                            var ali = helper.findInArray(queryContext.aliases, exp.object.name, 'alias');
                            if (ali) return helper.getValue(ali.value, exp.property.name);
                        }
                        return helper.getValue(helper.jsepToFunction(exp.object, queryContext)(value), exp.property.name);
                    } else if (exp.type == 'CallExpression') {
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
                        } else {
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
                                    obj = window;

                                if (obj == null || (func = obj[funcName]) == null)
                                    throw helper.createError(i18N.unknownFunction, [funcName]);
                            }

                            args = helper.mapArray(args, function () { return this(value); });
                            retVal = func.apply(queryContext, args);
                        }

                        if (alias)
                            queryContext.currentAlias = queryContext.aliases.pop();
                        return retVal;
                    } else throw helper.createError(i18N.unknownExpression, { expression: exp });
                };
            },
            jsepToProjector: function (exps, queryContext) {
                /// <summary>Converts parsed javascript expression (jsep) to Javascript projection selector (creates new projected object).</summary>
                /// <param name="exps">Jsep expressions.</param>
                /// <param name="queryContext">Query execution context, query options, variable context etc.</param>
                var projectExps = [];
                if (!assert.isArray(exps)) exps = [exps];
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
    })();
    var assert = (function () {
        var ctor = function (value, name) {
            /// <summary>
            /// Assertion methods. Two different usage possible, static methods and instance methods. 
            /// Static methods returns true or false.Instance methods can be chained and they collect errors in an array, 
            /// after all assertions check methods throws error if there is any.(adapted from breezejs)
            /// </summary>
            /// <param name="value">Value to check.</param>
            /// <param name="name">Property or field name represanting the value (will be used in error messages).</param>
            this.value = value;
            this.name = name;
            this.errors = [];
            helper.tryFreeze(this);
        };
        var proto = ctor.prototype;

        proto.hasValue = function () {
            /// <summary>
            /// Checks if value is not null.
            /// </summary>
            ctor.hasValue(this.value, this.errors, this.name);
            return this;
        };
        proto.isObject = function () {
            /// <summary>
            /// Checks if value is object.
            /// </summary>
            ctor.isObject(this.value, this.errors, this.name);
            return this;
        };
        proto.isFunction = function () {
            /// <summary>
            /// Checks if value is function.
            /// </summary>
            ctor.isFunction(this.value, this.errors, this.name);
            return this;
        };
        proto.isNotEmptyString = function () {
            /// <summary>
            /// Checks if value is a non-empty string.
            /// </summary>
            ctor.isNotEmptyString(this.value, this.errors, this.name);
            return this;
        };
        proto.isTypeOf = function (typeName) {
            /// <summary>
            /// Checks if value is an object of given type.
            /// </summary>
            /// <param name="typeName">Name of the javascript type.</param>
            ctor.isTypeOf(this.value, typeName, this.errors, this.name);
            return this;
        };
        proto.isArray = function () {
            /// <summary>
            /// Checks if value is array.
            /// </summary>
            ctor.isArray(this.value, this.errors, this.name);
            return this;
        };
        proto.isEnum = function (enumType) {
            /// <summary>
            /// Checks if value is an symbol of given enum.
            /// </summary>
            /// <param name="typeName">Type of the enum.</param>
            ctor.isEnum(this.value, enumType, this.errors, this.name);
            return this;
        };
        proto.isInstanceOf = function (type) {
            /// <summary>
            /// Checks if value is instance of given type.
            /// </summary>
            /// <param name="type">Type of the javascript class.</param>
            ctor.isInstanceOf(this.value, type, this.errors, this.name);
            return this;
        };

        proto.check = function () {
            /// <summary>
            /// If previous checks created any error, joins them with ',' and throws an Error.
            /// </summary>
            if (this.errors.length > 0)
                throw helper.createError(this.errors.join('\n'), { name: this.name, value: this.value });
        };

        ctor.hasValue = function (value, errors, name) {
            /// <summary>
            /// Checks if value is not null.
            /// </summary>
            if (value == null) {
                if (errors) errors.push(helper.formatString(i18N.valueCannotBeNull, name));
                return false;
            }
            return true;
        };
        ctor.isObject = function (value, errors, name) {
            /// <summary>
            /// Checks if value is object.
            /// </summary>
            if (value == null || !core.dataTypes.object.isValid(value)) {
                if (errors) errors.push(helper.formatString(i18N.typeError, name, 'object'));
                return false;
            }
            return true;
        };
        ctor.isFunction = function (value, errors, name) {
            /// <summary>
            /// Checks if value is function.
            /// </summary>
            if (value == null || !core.dataTypes.function.isValid(value)) {
                if (errors) errors.push(helper.formatString(i18N.typeError, name, 'function'));
                return false;
            }
            return true;
        };
        ctor.isNotEmptyString = function (value, errors, name) {
            /// <summary>
            /// Checks if value is a non-empty string.
            /// </summary>
            if (value == null || value === '' || !ctor.isTypeOf(value, 'string', errors)) {
                if (errors) errors.push(helper.formatString(i18N.cannotBeEmptyString, name));
                return false;
            }
            return true;
        };
        ctor.isTypeOf = function (value, typeName, errors, name) {
            /// <summary>
            /// Checks if value is an object of given type.
            /// </summary>
            if (!ctor.hasValue(value)) return false;
            var type = core.dataTypes.byName(typeName);
            if (!type.isValid(value)) {
                if (errors) errors.push(helper.formatString(i18N.typeMismatch, name, typeName, type, value));
                return false;
            }
            return true;
        };
        ctor.isArray = function (value, errors, name) {
            /// <summary>
            /// Checks if value is array.
            /// </summary>
            if (value == null || !core.dataTypes.array.isValid(value)) {
                if (errors) errors.push(helper.formatString(i18N.typeError, name, 'array'));
                return false;
            }
            return true;
        };
        ctor.isEnum = function (value, enumType, errors, name) {
            /// <summary>
            /// Checks if value is an symbol of given enum.
            /// </summary>
            if (!enumType.contains(value)) {
                if (errors) errors.push(helper.formatString(i18N.invalidEnumValue, enumType, value));
                return false;
            }
            return true;
        };
        ctor.isInstanceOf = function (value, type, errors, name) {
            /// <summary>
            /// Checks if value is instance of given type.
            /// </summary>
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
    var libs = (function () {
        /// <summary>3rd party libraries and snippets.</summary>
        var expose = {};

        // A simple enum implementation for JavaScript
        // https://github.com/rauschma/enums
        expose.enums = (function () {

            function copyOwnFrom(target, source) {
                for (var p in source)
                    target[p] = source[p];
                return target;
            }

            function symbol(name, props) {
                this.name = name;
                if (props)
                    copyOwnFrom(this, props);
                helper.tryFreeze(this);
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
            helper.tryFreeze(symbol.prototype);

            var x = function (obj) {
                /// <summary>
                /// 3rd party code. Modified to work with old browsers.
                /// For details: http://www.2ality.com/2011/10/enums.html
                /// </summary>
                var self = this;
                if (arguments.length === 1 && obj !== null && typeof obj === "object") {
                    for (var p in obj)
                        self[p] = new symbol(p, obj[p]);
                } else {
                    helper.forEach(arguments, function (name) {
                        self[name] = new symbol(name);
                    });
                }
                helper.tryFreeze(this);
            };
            x.prototype.symbols = function () {
                var retVal = [];
                for (var p in this) {
                    var v = this[p];
                    if (assert.isFunction(v)) continue;
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
        expose.jsep = (function (root) {
            /*global module: true, exports: true, console: true */
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

            // In desktop environments, have a way to restore the old value for `jsep`
            if (typeof exports === 'undefined') {
                var old_jsep = root.jsep;
                // The star of the show! It's a function!
                root.jsep = jsep;
                // And a courteous function willing to move out of the way for other similarly-named objects!
                jsep.noConflict = function () {
                    if (root.jsep === jsep) {
                        root.jsep = old_jsep;
                    }
                    return jsep;
                };
            } else {
                // In Node.JS environments
                if (typeof module !== 'undefined' && module.exports) {
                    exports = module.exports = jsep;
                } else {
                    exports.parse = jsep;
                }
            }

            return jsep;
        }(exports));

        return expose;
    })();
    var baseTypes = (function () {
        /// <summary>
        /// Base types, can be considered as abstract classes.
        /// This classes can be overwritten outside of the project, and later can be injected through constructors to change behaviors of core classes.
        /// </summary>
        return {
            dateConverterBase: (function () {
                var ctor = function (name) {
                    /// <summary>
                    /// Data conversion base type (interface). With this we can abstract date conversion and users can choose (or write) their implementation.
                    /// </summary>
                    this.name = name;
                };
                var proto = ctor.prototype;

                proto.parse = function (value) {
                    /// <summary>
                    /// Converts given value to date.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, ['dateConverterBase', 'parse']);
                };
                proto.toISOString = function (value) {
                    /// <summary>
                    /// Converts given date to ISO string.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, ['dateConverterBase', 'toISOString']);
                };

                return ctor;
            })(),
            dataTypeBase: (function () {
                var ctor = function (name) {
                    /// <summary>
                    /// Base of all types.
                    /// </summary>
                    /// <param name="name">Name of the type.</param>
                    this.name = name || 'dataTypeBase';
                    this.isComplex = false;
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// Returns string representation of the type.
                    /// </summary>
                    return this.name;
                };

                proto.getRawValue = function (value) {
                    /// <summary>
                    /// Returns raw value represanting given value.
                    /// </summary>
                    return value;
                };

                proto.isValid = function (value) {
                    /// <summary>
                    /// Checks if given value is valid for this type.
                    /// </summary>
                    return typeof value === this.name;
                };

                proto.toODataValue = function (value) {
                    /// <summary>
                    /// Converts given value to OData format.
                    /// </summary>
                    return value.toString();
                };

                proto.toBeetleValue = function (value) {
                    /// <summary>
                    /// Converts given value to Beetle format.
                    /// </summary>
                    return value.toString();
                };

                proto.defaultValue = function () {
                    /// <summary>
                    /// Gets default value for type.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'defaultValue']);
                };
                proto.autoValue = function () {
                    /// <summary>
                    /// Generates a new unique value for this type. Used for auto-incremented values.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'autoValue']);
                };
                proto.handle = function (value) {
                    /// <summary>
                    /// Tries to convert given value to this type.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'handle']);
                };

                return ctor;
            })(),
            expressionBase: (function () {
                var ctor = function (name, order, onlyBeetle, isProjection) {
                    /// <summary>
                    /// Javascript expression base class -like linq expressions.
                    /// </summary>
                    /// <param name="name">Name of the expression.</param>
                    /// <param name="order">
                    /// OData order for the expression. 
                    ///  When an expression with 2 comes after 3 this means the query cannot be executed as OData.
                    ///  eg. query.where().select().where() should not be run as OData query, result differs when it is run as beetle query or local query.
                    /// </param>
                    /// <param name="onlyBeetle">Is this expression is supported only by beetle?</param>
                    /// <param name="isProjection">
                    /// Is this expression alters result type.
                    ///  after result type is changed, if an expression is added to query, query becomes OData incompatible.
                    /// </param>
                    this.name = name || 'expressionBase';
                    this.order = order;
                    this.onlyBeetle = onlyBeetle;
                    this.isProjection = isProjection;
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.toBeetleQuery({});
                };

                proto.combine = function () {
                    /// <summary>
                    /// Combines two expression to one. Not all expressions support this.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'combine']);
                };

                proto.toODataQuery = function (queryContext) {
                    /// <summary>
                    /// Converts expression to OData representation.
                    /// </summary>
                    if (this.onlyBeetle === true) return this.toBeetleQuery(queryContext);
                    throw helper.createError(i18N.notImplemented, [this.name, 'toODataQuery']);
                };

                proto.toBeetleQuery = function () {
                    /// <summary>
                    /// Converts expression to Beetle representation.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'toBeetleQuery']);
                };
                proto.clone = function () {
                    /// <summary>
                    /// Clones the expression.
                    /// </summary> 
                    throw helper.createError(i18N.notImplemented, [this.name, 'clone']);
                };
                proto.execute = function (array) {
                    /// <summary>
                    /// Executes expression.
                    /// </summary> 
                    throw helper.createError(i18N.notImplemented, [this.name, 'execute']);
                };

                return ctor;
            })(),
            queryFuncBase: (function () {
                var ctor = function (name, beetleName, argCount) {
                    /// <summary>
                    /// Query function base class
                    /// </summary>
                    /// <param name="name">Name of the function.</param>
                    /// <param name="beetleName">Name to use for beetle queries.</param>
                    /// <param name="argCount">Argument count for method.</param>
                    this.name = name;
                    this.beetleName = beetleName;
                    this.argCount = argCount;
                };
                var proto = ctor.prototype;

                proto.toODataFunction = function () {
                    /// <summary>
                    /// function's OData representation 
                    /// </summary>
                    var args = [];
                    for (var i = 0; i < arguments.length; i++)
                        args.push(arguments[i]);

                    return this.name + '(' + args.join(', ') + ')';
                };

                proto.toBeetleFunction = function () {
                    /// <summary>
                    /// function's Beetle representation 
                    /// </summary>
                    var source = '';
                    var i = 0;
                    if (arguments.length == this.argCount) {
                        source = arguments[0] + '.';
                        ++i;
                    }

                    var args = [];
                    for (i; i < arguments.length; i++)
                        args.push(arguments[i]);

                    return source + this.beetleName + '(' + args.join(', ') + ')';
                };

                proto.impl = function () {
                    /// <summary>
                    /// function's javascript implementation
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'impl']);
                };

                return ctor;
            })(),
            queryBase: (function () {
                var ctor = function () {
                    /// <summary>
                    /// Query base class. Contains common query methods. 
                    /// </summary>
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
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    var params = [];
                    helper.forEach(this.parameters, function (prm) {
                        params.push(prm.name + ': ' + (prm.value == null ? '' : prm.value));
                    });

                    if (this.inlineCountEnabled === true)
                        params.push('inlinecount: allpages');

                    var qc = {};
                    helper.forEach(this.expressions, function (exp) {
                        params.push(exp.name + ': ' + exp.toBeetleQuery(qc));
                    });

                    return params.join(', ');
                };

                proto.addExpression = function (exp) {
                    /// <summary>
                    /// Adds given expression to expression list and decides if now this query is projected and multi-typed.
                    /// </summary>
                    /// <param name="exp">Expression to add.</param>
                    if (this.isClosed) throw helper.createError(i18N.queryClosed, null, { query: this });
                    helper.assertPrm(exp, 'expression').isInstanceOf(baseTypes.expressionBase).check();
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

                proto.inlineCount = function (isEnabled) {
                    /// <summary>
                    /// Indicates wheter or not include total count in result.
                    /// </summary>
                    /// <param name="isEnabled">When true, total count will be included in result. Default value: true.</param>
                    var q = this.clone();
                    q.inlineCountEnabled = isEnabled !== false;
                    return q;
                };

                proto.ofType = function (type) {
                    /// <summary>
                    /// if model has inheritance, when querying base type we can tell which derived type we want to load.
                    /// </summary>
                    /// <param name="type">Derived type.</param>
                    var q = this.clone();
                    var ofType = q.getExpression(querying.expressions.ofTypeExp);
                    if (ofType) {
                        ofType.combine(type);
                        return q;
                    }
                    return q.addExpression(new querying.expressions.ofTypeExp(type));
                };

                proto.clearWhere = function () {
                    /// <summary>
                    /// Clear where filters.
                    /// </summary>
                    var q = this.clone();
                    return q.removeExpression(querying.expressions.whereExp);
                };

                proto.where = function (property, filterOp, value) {
                    /// <summary>
                    /// Filter query based on given parameters.
                    /// </summary>
                    /// <param name="property">Property to filter. This parameter must be string for single parameter calls, eg. Name == "Alan".</param>
                    /// <param name="filterOp">Filter operation: [Equals, NotEqual, Greater, Lesser, GreaterEqual, LesserEqual, Contains, StartsWith, EndsWith].</param>
                    /// <param name="value">Filter value.</param>
                    var q = this.clone();
                    var where = q.getExpression(querying.expressions.whereExp);
                    if (where == null) q.addExpression(new querying.expressions.whereExp(arguments));
                    else where.and(arguments);
                    return q;
                };

                proto.and = function (args) {
                    /// <summary>
                    /// Combines given predication with previous filters using 'and'.
                    /// </summary>
                    /// <param name="args">Filter arguments. Can be [Property], [FilterOps], [Value] or expression.</param>
                    var q = this.clone();
                    q.getExpression(querying.expressions.whereExp, true).and(arguments);
                    return q;
                };

                proto.or = function (args) {
                    /// <summary>
                    /// Combines given predication with previous filters using 'or'.
                    /// </summary>
                    /// <param name="args">Filter arguments. Can be [Property], [FilterOps], [Value] or expression.</param>
                    var q = this.clone();
                    q.getExpression(querying.expressions.whereExp, true).or(arguments);
                    return q;
                };

                proto.andGroup = function (args) {
                    /// <summary>
                    /// Creates new filter group with given initial filter and combines it with previous group using 'and'.
                    /// </summary>
                    /// <param name="args">Filter arguments. Can be [Property], [FilterOps], [Value] or expression.</param>
                    var q = this.clone();
                    var where = q.getExpression(querying.expressions.whereExp);
                    if (where) where.andGroup.apply(where, arguments);
                    else q = q.where.apply(q, arguments);
                    return q;
                };

                proto.orGroup = function (args) {
                    /// <summary>
                    /// Creates new filter group with given initial filter and combines it with previous group using 'or'.
                    /// </summary>
                    /// <param name="args">Filter arguments. Can be [Property], [FilterOps], [Value] or expression.</param>
                    var q = this.clone();
                    var where = q.getExpression(querying.expressions.whereExp);
                    if (where) where.orGroup.apply(where, arguments);
                    else q = q.where.apply(q, arguments);
                    return q;
                };

                proto.closeGroup = function () {
                    /// <summary>
                    /// gets lastly opened filter group from stack and sets the last item as current. 
                    /// </summary>
                    /// <param name="args">Filter arguments. Can be [Property], [FilterOps], [Value] or expression.</param>
                    var q = this.clone();
                    q.getExpression(querying.expressions.whereExp, true).closeGroup();
                    return q;
                };

                proto.clearOrderBy = function () {
                    /// <summary>
                    /// Clear orderBy parameters.
                    /// </summary>
                    var q = this.clone();
                    return q.removeExpression(querying.expressions.orderByExp);
                };

                proto.orderBy = function (properties, isDesc) {
                    /// <summary>
                    /// Sorts results based on given properties.
                    /// </summary>
                    /// <param name="properties">The properties to sort by.</param>
                    /// <param name="desc">Is it descending?</param>
                    var q = this.clone();
                    var orderBy = q.getExpression(querying.expressions.orderByExp);
                    if (orderBy) {
                        orderBy.combine(properties, isDesc);
                        return q;
                    }
                    return q.addExpression(new querying.expressions.orderByExp(properties, isDesc));
                };

                proto.orderByDesc = function (properties) {
                    /// <summary>
                    /// Sorts descendingly results based on given properties.
                    /// </summary>
                    /// <param name="properties">Properties to order.</param>
                    return this.orderBy(properties, true);
                };

                proto.select = function (properties) {
                    /// <summary>
                    /// Selects only given properties using projection.
                    /// </summary>
                    /// <param name="properties">Properties or PropertyPaths to select (project).
                    /// Can be string arguments (eg. ('Name', 'Surname', 'Customer.Name'))
                    ///  or single strings seperated with comma (eg. ('Name, Surname, Customer.Name'))
                    ///  or array of strings (eg. (['Name', 'Surname', 'Customer.Name']))
                    /// </param>
                    var q = this.clone();
                    if (arguments.length == 1) {
                        var arg = arguments[0];
                        if (assert.isArray(arg))
                            properties = arg.join(', ');
                    } else properties = Array.prototype.slice.call(arguments).join(', ');
                    return q.addExpression(new querying.expressions.selectExp(properties));
                };

                proto.skip = function (count) {
                    /// <summary>
                    /// Skips given count records and start reading.
                    /// </summary>
                    var q = this.clone();
                    var skip = q.getExpression(querying.expressions.skipExp);
                    if (skip) {
                        skip.combine(count);
                        return q;
                    }
                    return q.addExpression(new querying.expressions.skipExp(count));
                };

                proto.take = function (count) {
                    /// <summary>
                    /// Takes only given count records .
                    /// </summary>
                    return this.top(count);
                };

                proto.top = function (count) {
                    /// <summary>
                    /// Takes only first given count records.
                    /// </summary>
                    var q = this.clone();
                    var top = q.getExpression(querying.expressions.topExp);
                    if (top) {
                        top.combine(count);
                        return q;
                    }
                    return q.addExpression(new querying.expressions.topExp(count));
                };

                proto.groupBy = function (keySelector, valueSelector) {
                    /// <summary>
                    /// Groups query by given keys (projects them into a new type) and returns values (projecting into new type).
                    /// </summary>
                    /// <param name="keySelector">A projection to extract the key for each element.</param>
                    /// <param name="valueSelector">A projection to create a result value from each group.</param>
                    var q = this.clone();
                    if (assert.isArray(keySelector))
                        keySelector = keySelector.join(', ');
                    if (assert.isArray(valueSelector))
                        valueSelector = valueSelector.join(', ');
                    return q.addExpression(new querying.expressions.groupByExp(keySelector, valueSelector));
                };

                proto.distinct = function (selector) {
                    /// <summary>
                    /// Gets only distinct items, when selector is given it will be used as comparer (project and compares projected objects).
                    /// </summary>
                    /// <param name="selector">A projection to extract the key for each element.</param>
                    var q = this.clone();
                    if (assert.isArray(selector))
                        selector = selector.join(', ');
                    return q.addExpression(new querying.expressions.distinctExp(selector));
                };

                proto.reverse = function () {
                    /// <summary>
                    /// Reverse the collection.
                    /// </summary>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.reverseExp());
                };

                proto.selectMany = function (properties) {
                    /// <summary>
                    /// Selects given collection property for each element and returns all in a new array.
                    /// </summary>
                    /// <param name="properties">Collection property path.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.selectManyExp(properties));
                };

                proto.skipWhile = function (predicate, varContext) {
                    /// <summary>
                    /// Gets all the items after first succesfull predicate.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.skipWhileExp(predicate, varContext));
                };

                proto.takeWhile = function (predicate, varContext) {
                    /// <summary>
                    /// Gets all the items before first succesfull predicate.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.takeWhileExp(predicate, varContext));
                };

                proto.all = function (predicate, varContext) {
                    /// <summary>
                    /// If all items suits given predication returns true, otherwise false.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.allExp(predicate, varContext));
                };

                proto.any = function (predicate, varContext) {
                    /// <summary>
                    /// If there is at least one item in query result (or any item suits given predication) returns true, otherwise false.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.anyExp(predicate, varContext));
                };

                proto.avg = function (selector) {
                    /// <summary>
                    /// Calculates average of items of query (or from given projection result).
                    /// </summary>
                    /// <param name="selector">A sequence of Number values to calculate the average of.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.avgExp(selector));
                };

                proto.max = function (selector) {
                    /// <summary>
                    /// Finds maximum value from items of query (or from given projection result).
                    /// </summary>
                    /// <param name="selector">A sequence of Number values to calculate the maximum of.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.maxExp(selector));
                };

                proto.min = function (selector) {
                    /// <summary>
                    /// Finds minimum value from items of query (or from given projection result).
                    /// </summary>
                    /// <param name="selector">A sequence of Number values to calculate the minimum of.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.minExp(selector));
                };

                proto.sum = function (selector) {
                    /// <summary>
                    /// Finds summary value from items of query (or from given projection result).
                    /// </summary>
                    /// <param name="selector">A sequence of Number values to calculate the sum of.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.sumExp(selector));
                };

                proto.count = function (predicate, varContext) {
                    /// <summary>
                    /// Gets the count of items of query.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.countExp(predicate, varContext));
                };

                proto.first = function (predicate, varContext) {
                    /// <summary>
                    /// Gets the first value from items of query (or from given predication result). When there is no item, throws exception.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.firstExp(predicate, varContext));
                };

                proto.firstOrDefault = function (predicate, varContext) {
                    /// <summary>
                    /// Gets the first value (or null when there is no items) from items of query (or from given predication result).
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.firstOrDefaultExp(predicate, varContext));
                };

                proto.single = function (predicate, varContext) {
                    /// <summary>
                    /// Gets the single value from items (or from given predication result). Where zero or more than one item exists throws exception.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.singleExp(predicate, varContext));
                };

                proto.singleOrDefault = function (predicate, varContext) {
                    /// <summary>
                    /// Gets the single value (or null when there is no items) from items (or from given predication result). Where more than one item exists throws exception.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.singleOrDefaultExp(predicate, varContext));
                };

                proto.last = function (predicate, varContext) {
                    /// <summary>
                    /// Gets the last value from items of query (or from given predication result). When there is no item, throws exception.
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.lastExp(predicate, varContext));
                };

                proto.lastOrDefault = function (predicate, varContext) {
                    /// <summary>
                    /// Gets the last value (or null when there is no items) from items of query (or from given predication result).
                    /// </summary>
                    /// <param name="predicate">A function to test each element for a condition.</param>
                    /// <param name="varContext">Variable context for the expression.</param>
                    var q = this.clone();
                    return q.addExpression(new querying.expressions.lastOrDefaultExp(predicate, varContext));
                };

                proto.withOptions = function (options) {
                    /// <summary>
                    /// Sets options to be used at execution
                    /// </summary>
                    /// <param name="options">Query options.</param>
                    var q = this.clone();
                    q.options = helper.combine(this.options, options);
                    return q;
                };

                proto.execute = function () {
                    /// <summary>
                    /// Executes the query.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, ['Query', 'execute']);
                };

                proto.x = function () {
                    /// <summary>
                    /// Executes the query.
                    /// </summary>
                    return this.execute.apply(this, arguments);
                };

                proto.toFunction = function () {
                    /// <summary>
                    /// Creates a function that can execute query operations against given array.
                    /// </summary>
                    var that = this;
                    return function (array, varContext) {
                        var qc = { varContext: varContext };
                        qc.aliases = [];
                        if (that.inlineCountEnabled)
                            qc.inlineCount = array.length;
                        helper.forEach(that.expressions, function (exp) {
                            qc.expVarContext = exp.varContext;
                            array = exp.execute(array, qc);
                            if (that.inlineCountEnabled && !assert.isInstanceOf(exp, querying.expressions.topExp) && !assert.isInstanceOf(exp, querying.expressions.skipExp))
                                qc.inlineCount = array.length;
                            qc.expVarContext = undefined;
                        });
                        if (that.inlineCountEnabled)
                            array.$inlineCount = qc.inlineCount;
                        return array;
                    };
                };

                proto.clone = function () {
                    /// <summary>
                    /// Clones whole query.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, ['Query', 'clone']);
                };

                proto.copy = function (query) {
                    /// <summary>
                    /// Copies properties to given query.
                    /// </summary>
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

                proto.getExpression = function (type, throwIfNotFound) {
                    /// <summary>
                    /// Finds given typed expression.
                    /// </summary>
                    for (var i = this.lastProjection; i < this.expressions.length; i++) {
                        var exp = this.expressions[i];
                        if (assert.isInstanceOf(exp, type)) return exp;
                    }
                    if (throwIfNotFound === true)
                        throw helper.createError(i18N.expressionCouldNotBeFound, { type: type, query: this });
                    return null;
                };

                proto.removeExpression = function (type) {
                    /// <summary>
                    /// Removes given typed expressions.
                    /// </summary>
                    for (var i = this.expressions.length - 1; i >= 0; i--) {
                        var exp = this.expressions[i];
                        if (assert.isInstanceOf(exp, type))
                            this.expressions.splice(i, 1);
                    }
                    return this;
                };

                return ctor;
            })(),
            observableProviderBase: (function () {
                var ctor = function (name) {
                    /// <summary>
                    /// Observable provider base class. Makes given object's properties observable.
                    /// </summary>
                    /// <param name="name">Name of the provider.</param>
                    this.name = name || 'observableProviderBase';
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.name;
                };

                proto.isObservable = function (object, property) {
                    /// <summary>
                    /// When given property for given object is observable returns true, otherwise false.
                    /// </summary>
                    /// <param name="object">The object.</param>
                    /// <param name="property">The property to check.</param>
                    throw helper.createError(i18N.notImplemented, [this.name, 'isObservable']);
                };
                proto.toObservable = function (object, type, callbacks) {
                    /// <summary>
                    /// Makes given object observable.
                    /// </summary>
                    /// <param name="object">The obect.</param>
                    /// <param name="type">The entity type.</param>
                    /// <param name="callbacks">The callbacks, beetle tracks entities using these callbacks.</param>
                    throw helper.createError(i18N.notImplemented, [this.name, 'toObservable']);
                };
                proto.getValue = function (object, property) {
                    /// <summary>
                    /// Reads an observable property value from object.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'getValue']);
                };
                proto.setValue = function (object, property, value) {
                    /// <summary>
                    /// Sets the value of observable property of given object.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'setValue']);
                };

                return ctor;
            })(),
            ajaxProviderBase: (function () {
                var ctor = function (name) {
                    /// <summary>
                    /// Ajax provider base class. Operates ajax operations.
                    /// </summary>
                    /// <param name="name">Name of the provider.</param>
                    this.name = name || 'ajaxProviderBase';
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.name;
                };

                proto.doAjax = function (uri, type, dataType, contentType, data, async, timeout, extra, successCallback, errorCallback) {
                    /// <summary>
                    /// Ajax operation virtual method.
                    /// </summary>
                    /// <param name="uri">Uri to make request.</param>
                    /// <param name="type">Request type (POST, GET..)</param>
                    /// <param name="dataType">Request data type (xml, json..)</param>
                    /// <param name="contentType">Request content type (application/x-www-form-urlencoded; charset=UTF-8, application/json..)</param>
                    /// <param name="data">Request data.</param>
                    /// <param name="async">If set to false, request will be made synchronously.</param>
                    /// <param name="timeout">AJAX call timeout value. if call won't be completed after given time, exception will be thrown.</param>
                    /// <param name="extra">implementor specific arguments.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    throw helper.createError(i18N.notImplemented, [this.name, 'doAjax']);
                };

                return ctor;
            })(),
            serializationServiceBase: (function () {
                var ctor = function (name) {
                    /// <summary>
                    /// Serialization service base class. Deserializes incoming data and serializes outgoing data.
                    /// </summary>
                    /// <param name="name">Name of the service.</param>
                    this.name = name || 'serializationServiceBase';
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.name;
                };

                proto.serialize = function (data) {
                    /// <summary>
                    /// Serializes given data to string.
                    /// </summary>
                    /// <param name="data">Serialized string.</param>
                    throw helper.createError(i18N.notImplemented, [this.name, 'serialize']);
                };
                proto.deserialize = function (string) {
                    /// <summary>
                    /// Deserializes given string to object.
                    /// </summary>
                    /// <param name="string">Deserialized object.</param>
                    throw helper.createError(i18N.notImplemented, [this.name, 'deserialize']);
                };

                return ctor;
            })(),
            promiseProviderBase: (function () {
                var ctor = function (name) {
                    /// <summary>
                    /// Promise provider base class. Creates deferred promises for async operations..
                    /// </summary>
                    /// <param name="name">Name of the provider.</param>
                    this.name = name || 'promiseProviderBase';
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.name;
                };

                proto.deferred = function () {
                    /// <summary>
                    /// Creates deferred object.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'deferred']);
                };
                proto.getPromise = function (deferred) {
                    /// <summary>
                    /// Gets promise for deferred object.
                    /// </summary>
                    throw helper.createError(i18N.notImplemented, [this.name, 'getPromise']);
                };
                proto.resolve = function (deferred, data, extra) {
                    /// <summary>
                    /// Resolves given promise for succesfull operation.
                    /// </summary>
                    /// <param name="deferred">Promise object.</param>
                    /// <param name="data">Data to pass success callback.</param>
                    /// <param name="extra">Extra data for operation.</param>
                    throw helper.createError(i18N.notImplemented, [this.name, 'resolve']);
                };
                proto.reject = function (deferred, error) {
                    /// <summary>
                    /// Rejects given promise for failed operation.
                    /// </summary>
                    /// <param name="deferred">Promise object.</param>
                    /// <param name="error">Error to pass failed callback.</param>
                    throw helper.createError(i18N.notImplemented, [this.name, 'reject']);
                };

                return ctor;
            })(),
            dataServiceBase: (function () {
                // cache metadata to reduce network traffic.
                var _metadataCache = [];
                var ctor = function (uri, metadataPrm, injections) {
                    /// <summary>
                    /// Data service base class.
                    /// </summary>
                    /// <param name="uri">Service URI.</param>
                    /// <param name="metadataPrm">Metadata info, can be metadataManager instance, metadata string, true-false (true means do not use any metadata).</param>
                    /// <param name="injections">
                    /// Injection object to change behavior of the service, can include these properties: ajaxProvider, serializationService, dataType, contentType. 
                    ///  When not given, defaults will be used.
                    /// </param>
                    initialize(uri, metadataPrm, injections, this);
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.uri;
                };

                proto.getEntityType = function (shortName) {
                    /// <summary>
                    /// Gets entity type from metadata by its short name.
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    return this.metadataManager ? this.metadataManager.getEntityTypeByShortName(shortName) : null;
                };

                proto.createQuery = function (resourceName, shortName, manager) {
                    /// <summary>
                    /// Creates a query for a resource. Every data service can have their own query types.
                    /// </summary>
                    /// <param name="resourceName">Resource to query (mandatory).</param>
                    /// <param name="shortName">Short name of the entity type.</param>
                    /// <param name="manager">Entity manager.</param>
                    helper.assertPrm(resourceName, 'resourceName').isNotEmptyString().check();
                    if (shortName) return this.createEntityQuery(shortName, resourceName, manager);
                    if (this.metadataManager) this.metadataManager.createQuery(resourceName, null, manager);
                    return new querying.entityQuery(resourceName, null, manager);
                };

                proto.createEntityQuery = function (shortName, resourceName, manager) {
                    /// <summary>
                    /// Creates a query for a resource. Every data service can have their own query types.
                    /// </summary>
                    /// <param name="shortName">Short name of the entity type (mandatory).</param>
                    /// <param name="resourceName">Resource to query.</param>
                    helper.assertPrm(shortName, 'shortName').isNotEmptyString().check();
                    if (!this.metadataManager)
                        throw helper.createError(i18N.noMetadataEntityQuery, { dataService: this });
                    return this.metadataManager.createQuery(resourceName, shortName, manager);
                };

                proto.registerCtor = function (shortName, constructor, initializer) {
                    /// <summary>
                    /// Register constructor and initializer (optional) for given type.
                    ///  Constructor is called right after the entity object is generated.
                    ///  Initializer is called after entity started to being tracked (properties converted to observable).
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    /// <param name="constructor">Constructor function.</param>
                    /// <param name="initializer">Initializer function.</param>
                    if (this.metadataManager == null)
                        throw helper.createError(i18N.noMetadataEntityQuery);
                    this.metadataManager.registerCtor(shortName, constructor, initializer);
                };

                proto.createEntity = function (shortName, initialValues) {
                    /// <summary>
                    /// Creates an entity based on metadata information.
                    /// </summary>
                    /// <param name="shortName">Short name of the entity type.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    if (!this.metadataManager) throw helper.createError(i18N.noMetadataEntityQuery, { dataService: this });
                    return this.metadataManager.createEntity(shortName, initialValues);
                };

                proto.createRawEntity = function (shortName, initialValues) {
                    /// <summary>
                    /// Create the entity by its type's short name but do not convert to observable and do not add to manager.
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    if (!this.metadataManager) throw helper.createError(i18N.noMetadataEntityQuery, { dataService: this });
                    return this.metadataManager.createRawEntity(shortName, initialValues);
                };

                proto.toEntity = function (result, typeName) {
                    /// <summary>
                    /// Creates an entity based on metadata information.
                    /// </summary>
                    /// <param name="result">Raw result to make entity (observable).</param>
                    /// <param name="typeName">Entity type name.</param>
                    var type = null;
                    if (this.metadataManager)
                        type = this.metadataManager.getEntityType(typeName);
                    if (!type) type = new metadata.entityType(typeName);
                    return core.entityTracker.toEntity(result, type, settings.getObservableProvider());
                };

                proto.toODataQueryParams = function (query, varContext) {
                    /// <summary>
                    /// Converts given query to a OData query string format.
                    /// </summary>
                    /// <param name="query">The query..</param>
                    /// <param name="varContext">Variable context for the query.</param>
                    if (query.isMultiTyped === true)
                        throw helper.createError(i18N.oDataNotSupportMultiTyped, { query: query });

                    var qc = { varContext: varContext };
                    var params = [];
                    helper.forEach(query.parameters, function (prm) {
                        params.push({ name: prm.name, value: prm.value == null ? '' : prm.value });
                    });

                    if (query.inlineCountEnabled === true)
                        params.push({ name: '$inlinecount', value: 'allpages' });

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

                proto.toBeetleQueryParams = function (query, varContext) {
                    /// <summary>
                    /// Converts given query to a Beetle query string format.
                    /// </summary>
                    /// <param name="query">The query..</param>
                    /// <param name="varContext">Variable context for the query.</param>
                    var qc = { varContext: varContext };
                    var params = [];
                    helper.forEach(query.parameters, function (prm) {
                        params.push({ name: prm.name, value: prm.value == null ? '' : prm.value });
                    });

                    if (query.inlineCountEnabled === true)
                        params.push({ name: '!e0', value: 'inlinecount:allpages' });

                    helper.forEach(query.expressions, function (exp, i) {
                        qc.expVarContext = exp.varContext;
                        params.push({ name: '!e' + (i + 1), value: exp.name + ':' + exp.toBeetleQuery(qc) });
                        qc.expVarContext = undefined;
                    });

                    return params;
                };

                proto.fetchMetadata = function (options) {
                    /// <summary>
                    /// Fetch metadata from server.
                    ///  Fetch metadata options;
                    ///  async: When false, ajax call will be made synchronously (default: true).
                    /// </summary>
                    /// <param name="options">Fetch metadata options, for details read summary.</param>
                    throw helper.createError(i18N.notImplemented, ['dataServiceBase', 'fetchMetadata']);
                };
                proto.createEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                    /// <summary>
                    /// When there is no metadata available services may be able to create entities asynchronously (server side must be able to support this).
                    ///  Asynchronous entity creation options;
                    ///  makeObservable: When true raw entity will be converted to observable.
                    ///  async: When false, ajax call will be made synchronously (default: true).
                    /// </summary>
                    /// <param name="typeName">Type name to create.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    /// <param name="options">Asynchronous entity creation options, for details read summary.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    throw helper.createError(i18N.notImplemented, ['dataServiceBase', 'createEntityAsync']);
                };
                proto.executeQuery = function (query, options, successCallback, errorCallback) {
                    /// <summary>
                    /// Executes given query.
                    /// 
                    ///  Query options;
                    ///  merge: Merge strategy
                    ///  execution: Execution strategy
                    ///  autoFixScalar: Scalar navigations will be fixed for queried entities (e.g: if OrderDetail has OrderId, Order will be searched in cache)
                    ///  autoFixPlural: Plural navigations will be fixed for queried entities (e.g: Order's OrderDetails will be searched in cache)
                    ///  varContext: Variables used in the query (e.g: manager.executeQuery(query.where(Age > @age), {varContext: {age: 20}}))
                    ///  isCaseSensitive: When true string comparisons will be case sensitive
                    ///  ignoreWhiteSpaces: When true before comparison strings will be trimmed
                    ///  handleUnmappedProperties: If a property is not found in metadata, try to convert this value (e.g: '2013-01-01 will be converted to Date')
                    ///  uri: Overrides dataService's uri.
                    ///  
                    ///  -Options will be passed to services also, so we can pass service specific options too, these are available for WebApi and Mvc services;
                    ///  useBeetleQueryStrings: Beetle query strings will be used instead of OData query strings (only WebApi)
                    ///  usePost: Post verb will be used for queries, when query string is too large we need to use this option
                    ///  dataType: We can set ajax call's dataType with this option
                    ///  contentType: We can set ajax call's contentType with this option
                    ///  async: When false, ajax call will be made synchronously (default: true).
                    /// </summary>
                    /// <param name="query">The query.</param>
                    /// <param name="options">Query options, for detail read summary.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    throw helper.createError(i18N.notImplemented, ['dataServiceBase', 'executeQuery']);
                };
                proto.executeQueryParams = function (resource, queryParams, options, successCallback, errorCallback) {
                    /// <summary>
                    /// Executes given query string.
                    /// </summary>
                    /// <param name="resource">The resource.</param>
                    /// <param name="queryParams">The query parameters.</param>
                    /// <param name="options">makeObservable, usePost etc. query execution parameters.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    throw helper.createError(i18N.notImplemented, ['dataServiceBase', 'executeQueryParams']);
                };
                proto.saveChanges = function (savePackage, options, successCallback, errorCallback) {
                    /// <summary>
                    /// Posts all changes to server.
                    ///  Save options,
                    ///  async: When false, ajax call will be made synchronously (default: true).
                    ///  uri: Overrides dataService's uri.
                    ///  saveAction: Custom save action on server side (default is SaveChanges).
                    /// </summary>
                    /// <param name="savePackage">Save package to send to server.</param>
                    /// <param name="options">Save options, for details read summary.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    throw helper.createError(i18N.notImplemented, ['dataServiceBase', 'saveChanges']);
                };

                function initialize(uri, metadataPrm, injections, instance) {
                    if (uri == null) uri = '';
                    else if (uri[uri.length - 1] != '/') uri += '/';
                    instance.uri = uri;
                    var ajaxProvider = null, serializationService = null, dataType = null, contentType = null;
                    if (injections) {
                        ajaxProvider = injections.ajaxProvider;
                        serializationService = injections.serializationService;
                        dataType = injections.dataType;
                        contentType = injections.dataType;
                    }
                    // If ajax provider injected via constructor use it
                    if (ajaxProvider && assert.isInstanceOf(ajaxProvider, baseTypes.ajaxProviderBase))
                        instance.ajaxProvider = ajaxProvider;
                    else
                        instance.ajaxProvider = impls.jQueryAjaxProviderInstance;

                    // If serialization service injected via constructor use it
                    if (serializationService && assert.isInstanceOf(serializationService, baseTypes.SerializationService))
                        instance.serializationService = serializationService;
                    else
                        instance.serializationService = impls.jsonSerializationServiceInstance;

                    // If metadata parameter is true, it means DoNotUseMetadata = true.
                    if (!(metadataPrm === true)) {
                        // When there is no metadata or metadata is true fetch metadata from server.
                        if (!metadataPrm) {
                            // try to get metadata from cache
                            var cached = helper.findInArray(_metadataCache, uri, 'uri');
                            if (cached)
                                instance.metadataManager = cached.data;
                            else {
                                var metadataObject = instance.fetchMetadata();
                                instance.metadataManager = new metadata.metadataManager(metadataObject);
                                // cache retrieved and parsed metadata
                                _metadataCache.push({ uri: uri, data: instance.metadataManager });
                            }
                        } else if (assert.isInstanceOf(metadataPrm, metadata.metadataManager))
                            instance.metadataManager = metadataPrm;
                        else if (assert.isObject(metadataPrm)) {
                            try {
                                instance.metadataManager = new metadata.metadataManager(metadataPrm);
                            } catch (e) {
                                throw helper.createError(i18N.invalidArguments, { exception: e, args: arguments, dataService: this });
                            }
                        }
                    }
                    instance.dataType = dataType || 'json';
                    instance.contentType = contentType || 'application/json; charset=utf-8';
                }

                return ctor;
            })()
        };
    })();
    var impls = (function () {
        /// <summary>Base type implementation instances.</summary>

        return {
            /// <field>Default date converter class. Uses browser's default Date object.</field>
            defaultDateConverterInstance: (function () {
                var ctor = function () {
                    baseTypes.dateConverterBase.call(this, 'Default Date Converter');
                };
                helper.inherit(ctor, baseTypes.dateConverterBase);
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

                return new ctor();
            })(),
            /// <field>Knockout observable provider class. Makes given object's properties observable.</field>
            koObservableProviderInstance: (function (ko) {

                if (ko) {
                    /// <summary>
                    /// Observable value read-write interceptor. 
                    /// Because ko does not give old and new values together when notifying subscribers, I had to write this extender.
                    /// </summary>
                    /// <param name="target">Observable to extend.</param>
                    /// <param name="interceptor">Extender parameter. We pass before and after callbacks with this.</param>
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

                var ctor = function () {
                    baseTypes.observableProviderBase.call(this, 'Knockout Observable Provider');
                    helper.tryFreeze(this);
                };
                helper.inherit(ctor, baseTypes.observableProviderBase);
                var proto = ctor.prototype;

                proto.isObservable = function (object, property) {
                    return ko.isObservable(object[property]);
                };

                proto.toObservable = function (object, type, callbacks) {
                    var pc = callbacks && callbacks.propertyChange;
                    var ac = callbacks && callbacks.arrayChange;
                    var dpc = callbacks && callbacks.dataPropertyChange;
                    var snpc = callbacks && callbacks.scalarNavigationPropertyChange;
                    var pnpc = callbacks && callbacks.pluralNavigationPropertyChange;
                    var as = callbacks && callbacks.arraySet;

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
                        if (assert.isArray(v))
                            object[p] = toObservableArray(p, p, v, ac, as);
                        else
                            object[p] = toObservableProperty(p, v, pc);
                        if (!helper.findInArray(type.properties, p))
                            type.properties.push(p);
                    });

                    function toObservableProperty(property, value, callback) {
                        var retVal = ko.observable(value);
                        if (callback)
                            return ko.observable(value).extend({
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
                            value = new core.trackableArray(value, object, property,
                                function (o, p, i, r, a) {
                                    if (retVal.$fromKo !== true)
                                        object[propertyName].valueHasMutated();
                                    retVal.$fromKo = false;
                                    after(o, p, i, r, a);
                                });
                        retVal = ko.observableArray(value);
                        retVal.subscribe(function () { retVal.$fromKo = true; }, null, "beforeChange");
                        if (setCallback)
                            retVal.equalityComparer = function (items, newItems) {
                                setCallback(object, property, items, newItems);
                            };
                        return retVal;
                    }
                };

                proto.getValue = function (object, property) {
                    return ko.utils.unwrapObservable(object[property]);
                };

                proto.setValue = function (object, property, value) {
                    object[property](value);
                };

                return new ctor();
            })(exports.ko),
            /// <field>Property observable provider class. Makes given object's fields properties with getter setter and tracks values.</field>
            propertyObservableProviderInstance: (function () {
                var ctor = function () {
                    baseTypes.observableProviderBase.call(this, 'Property Observable Provider');
                    helper.tryFreeze(this);
                };
                helper.inherit(ctor, baseTypes.observableProviderBase);
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
                        if (assert.isArray(v))
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
                            value = new core.trackableArray(value, object, property, after);
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

                return new ctor();
            })(),
            backboneObservableProviderInstance: (function () {
                // not implemented yet
                var ctor = function () {
                    baseTypes.observableProviderBase.call(this, 'Backbone Observable Provider');
                    helper.tryFreeze(this);
                };
                helper.inherit(ctor, baseTypes.observableProviderBase);
                return new ctor();
            })(),
            /// <field>jQuery ajax provider class. Operates ajax operations via jQuery.</field>
            jQueryAjaxProviderInstance: (function (jQuery) {
                var ctor = function () {
                    baseTypes.ajaxProviderBase.call(this, 'jQuery Ajax Provider');
                    helper.tryFreeze(this);
                };
                helper.inherit(ctor, baseTypes.ajaxProviderBase);
                var proto = ctor.prototype;

                proto.doAjax = function (uri, type, dataType, contentType, data, async, timeout, extra, successCallback, errorCallback) {
                    var o = {
                        url: uri,
                        accepts: {
                            json: 'application/json; odata=verbose',
                            xml: 'text/xml; application/xhtml+xml;application/xml',
                            text: 'text/xml'
                        },
                        type: type,
                        dataType: dataType,
                        contentType: contentType,
                        traditional: false,
                        data: data,
                        cache: false,
                        async: async,
                        timeout: timeout,
                        success: function (result, status, xhr) {
                            xhr.onreadystatechange = null;
                            xhr.abort = null;
                            if (result && result.Error) {
                                var err = createError(xhr);
                                err.message = result.Error;
                                errorCallback(err);
                            } else successCallback(result, xhr);
                        },
                        error: function (xhr) {
                            xhr.onreadystatechange = null;
                            xhr.abort = null;
                            errorCallback(createError(xhr));
                        }
                    };
                    if (extra != null)
                        jQuery.extend(o, extra);
                    return jQuery.ajax(o);
                };

                function createError(xhr) {
                    /// <summary>
                    /// Creates an error object by parsing XHR result.
                    /// </summary>
                    /// <param name="xhr">XML Http Request object.</param>
                    var obj = { status: xhr.status, xhr: xhr };
                    if (xhr.responseText) {
                        try {
                            obj.detail = JSON.parse(xhr.responseText);
                        } catch (e) {
                        }
                    }
                    return helper.createError(xhr.statusText, obj);
                }

                return new ctor();
            })(exports.$),
            /// <field>JSON serialization class. Deserializes incoming data and serializes outgoing data.</field>
            jsonSerializationServiceInstance: (function () {
                var ctor = function () {
                    baseTypes.serializationServiceBase.call(this, 'Json Serializer');
                    helper.tryFreeze(this);
                };
                helper.inherit(ctor, baseTypes.serializationServiceBase);
                var proto = ctor.prototype;

                proto.serialize = function (data) {
                    return JSON.stringify(data);
                };

                proto.deserialize = function (value) {
                    if (assert.isTypeOf(value, 'string'))
                        return JSON.parse(value);
                    return value;
                };

                return new ctor();
            })(),
            /// <field>Q promise provider instance.</field>
            qPromiseProviderInstance: (function (q) {
                var ctor = function () {
                    baseTypes.promiseProviderBase.call(this, 'Q Promise Provider');
                    helper.tryFreeze(this);
                };
                helper.inherit(ctor, baseTypes.promiseProviderBase);
                var proto = ctor.prototype;

                proto.toString = function () {
                    return this.name;
                };

                proto.deferred = function () {
                    return q.defer();
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

                return new ctor();
            })(exports.Q),
            /// <field>jQuery promise provider instance.</field>
            jQueryPromiseProviderInstance: (function (jQuery) {
                var ctor = function () {
                    baseTypes.promiseProviderBase.call(this, 'jQuery Promise Provider');
                    helper.tryFreeze(this);
                };
                helper.inherit(ctor, baseTypes.promiseProviderBase);
                var proto = ctor.prototype;

                proto.toString = function () {
                    return this.name;
                };

                proto.deferred = function () {
                    return jQuery.Deferred();
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

                return new ctor();
            })(exports.$)
        };
    })();
    var metadata = (function () {
        /// <summary>Metadata related types.</summary>

        return {
            dataProperty: (function () {
                var ctor = function (owner, name, displayName, dataType, isNullable, isKeyPart, genPattern, defaultValue, useForConcurrency) {
                    /// <summary>
                    /// Data property default implementation.
                    /// </summary>
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
                    this.isEnum = dataType instanceof core.dataTypes.enum;
                    this.isComplex = dataType.isComplex;
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// toString override. Returns name.
                    /// </summary>
                    return this.displayName;
                };

                proto.isValid = function (value) {
                    /// <summary>
                    /// Checks if given value is valid for this property.
                    /// </summary>
                    /// <param name="value">Value to check.</param>
                    if (value == null) return !this.isNullable;
                    else return this.dataType.isValid(value, this);
                };

                proto.handle = function (value) {
                    /// <summary>
                    /// Tries to convert given value to this type.
                    /// </summary>
                    /// <param name="value">Value to check.</param>
                    /// <returns type="">When value is of this type returns the value, if not tries to convert the value to this type, throws an error if fails.</returns>
                    if (value == null) {
                        if (!this.isNullable)
                            throw helper.createError(i18N.notNullable, [this.displayName], { property: this });
                        return null;
                    }
                    value = this.dataType.handle(value, this);

                    // todo: consider moving precision and scale check to validator (it's not ok to put number specific code here).
                    if (this.dataType == core.dataTypes.number && this.precision && value.toString().replace(/\./g, '').length > this.precision)
                        throw helper.createError(i18N.maxPrecisionError, [value, this.precision],
                            { dataType: dataType, value: value });
                    if (this.dataType == core.dataTypes.number && this.scale != null) value = Number(value.toFixed(this.scale));

                    return value;
                };

                proto.getDefaultValue = function () {
                    /// <summary>
                    /// Gets default value for this type.
                    /// </summary>
                    if (this.defaultValue) return this.defaultValue;
                    if (this.isNullable) return null;
                    if (this.generationPattern == enums.generationPattern.Identity && this.isKeyPart === true) return this.dataType.autoValue();
                    return this.dataType.defaultValue();
                };

                proto.addValidation = function (name, func, message, args) {
                    /// <summary>
                    /// Add new validation method to data property.
                    /// </summary>
                    /// <param name="name">Name of the validation.</param>
                    /// <param name="func">Validation function.</param>
                    /// <param name="message">Message to show when validation fails.</param>
                    /// <param name="args">Validator arguments.</param>
                    helper.assertPrm(name, 'name').isNotEmptyString().check();
                    helper.assertPrm(func, 'func').isFunction().check();
                    this.validators.push(new core.validator(name, func, message, args));
                };

                proto.validate = function (entity) {
                    /// <summary>
                    /// Validates entity agains entity, data property and navigation property validations.
                    /// </summary>
                    /// <param name="entity">Entity to validate.</param>
                    var retVal = [];
                    if (this.validators.length > 0) {
                        var that = this;
                        var value = helper.getValue(entity, that.name);
                        helper.forEach(this.validators, function (v) {
                            var result = v.validate(value, entity);
                            if (result) retVal.push(helper.createValidationError(entity, value, that, result, v));
                        });
                    }
                    return retVal;
                };

                return ctor;
            })(),
            navigationProperty: (function () {
                var ctor = function (owner, name, displayName, entityTypeName, isScalar, associationName, cascadeDelete, foreignKeyNames) {
                    /// <summary>
                    /// Navigation property default implemantation.
                    /// </summary>
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
                    /// <summary>
                    /// toString override. Returns name.
                    /// </summary>
                    return this.displayName;
                };

                proto.checkAssign = function (value) {
                    /// <summary>
                    /// Checks if given value can be assigned to this property. If not throws an error.
                    /// </summary>
                    /// <param name="value">Value to check.</param>
                    if (value == null) return;
                    if (!value.$tracker) throw helper.createError(i18N.assignErrorNotEntity, [this], { property: this, value: value });
                    var t = value.$tracker.entityType;
                    if (!this.entityType.isAssignableWith(t)) throw helper.createError(i18N.assignError, [this.name, t.shortName], { property: this, value: value });
                };

                proto.addValidation = function (name, func, message, args) {
                    /// <summary>
                    /// Add new validation method to navigation property.
                    /// </summary>
                    /// <param name="name">Name of the validation.</param>
                    /// <param name="func">Validation function.</param>
                    /// <param name="message">Message to show when validation fails.</param>
                    /// <param name="args">Validator arguments.</param>
                    helper.assertPrm(name, 'name').isNotEmptyString().check();
                    helper.assertPrm(func, 'func').isFunction().check();
                    this.validators.push(new core.validator(name, func, message, args));
                };

                proto.validate = function (entity) {
                    /// <summary>
                    /// Validates entity agains entity, data property and navigation property validations.
                    /// </summary>
                    /// <param name="entity">Entity to validate.</param>
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
            entityType: (function () {
                var ctor = function (name, displayName, shortName, keyNames, baseTypeName, setName, setTypeName, isComplexType, metadataManager) {
                    /// <summary>
                    /// Entity type class. Defines an entity type. When there is no metadata for type, holds only the type name.
                    /// </summary>
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
                    /// <summary>
                    /// toString override. Returns name.
                    /// </summary>
                    return this.name;
                };

                proto.getProperty = function (propertyPath) {
                    /// <summary>
                    /// Parses given string and finds property, looks recursively to navigation properties when needed.
                    /// Example: if given path is OrderDetails.Supplier.Address.City, 
                    /// this method will look to related navigation properties until Address and it will retun City property as dataProperty (if exists).
                    /// </summary>
                    /// <param name="propertyPath">Property path to navigate.</param>
                    return getProperty(propertyPath.split('.'), this);
                };

                proto.createQuery = function (resourceName, manager) {
                    /// <summary>
                    /// Creates a new query for this type.
                    /// </summary>
                    /// <param name="resourceName">WebApi query resource name (Service controller action).</param>
                    /// <param name="manager">The entity manager.</param>
                    if (resourceName) return new querying.entityQuery(resourceName, this, manager);

                    var q = new querying.entityQuery(this.setName, this, manager);
                    return this.shortName == this.setTypeName ? q : q.ofType(this.shortName);
                };

                proto.registerCtor = function (constructor, initializer) {
                    /// <summary>
                    /// Register constructor and initializer (optional) for given type.
                    ///  Constructor is called right after the entity object is generated.
                    ///  Initializer is called after entity started to being tracked (properties converted to observable).
                    /// </summary>
                    /// <param name="constructor">Constructor function.</param>
                    /// <param name="initializer">Initializer function.</param>
                    if (constructor != null)
                        helper.assertPrm(constructor, 'constructor').isFunction().check();
                    if (initializer != null)
                        helper.assertPrm(initializer, 'initializer').isFunction().check();
                    this.constructor = constructor;
                    this.initializer = initializer;
                };

                proto.createEntity = function (initialValues) {
                    /// <summary>
                    /// Creates a new entity for this type.
                    /// </summary>
                    /// <param name="initialValues">Entity initial values.</param>
                    var result = this.createRawEntity(initialValues);
                    // make it observable
                    return core.entityTracker.toEntity(result, this, settings.getObservableProvider());
                };

                proto.createRawEntity = function (initialValues) {
                    /// <summary>
                    /// Creates a new entity for this type but do not convert it to observable.
                    /// </summary>
                    /// <param name="initialValues">Entity initial values.</param>
                    var result = initialValues || {};
                    // create properties with default values for each data property defined in metadata.
                    helper.forEach(this.dataProperties, function (dp) {
                        if (!result[dp.name])
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
                    /// <summary>
                    /// Called after entity object is created.
                    /// </summary>
                    /// <param name="type">Type of the entity.</param>
                    /// <param name="entity">The entity.</param>
                    if (type.baseType) callCtor(type.baseType, entity);
                    if (type.constructor)
                        type.constructor.call(entity, entity);
                }

                proto.isAssignableWith = function (otherType) {
                    /// <summary>
                    /// Checks if this type can be set with given type.
                    /// </summary>
                    /// <param name="otherType">Type to assign.</param>
                    return isAssignableWith(this, otherType);
                };

                proto.isAssignableTo = function (otherType) {
                    /// <summary>
                    /// Checks if this type can be set to given type.
                    /// </summary>
                    /// <param name="otherType">Type to check.</param>
                    return isAssignableTo(this, otherType);
                };

                proto.hasSameBaseType = function (type) {
                    /// <summary>
                    /// Checks if this type and given type has common ancestor.
                    /// This method is used to check key violation between different types.
                    /// </summary>
                    /// <param name="type">Other type.</param>
                    return this.floorType.name === type.floorType.name;
                };

                proto.addDataProperty = function (name, displayName, dataType, isNullable, defaultValue) {
                    /// <summary>
                    /// Adds new dataProperty to this type.
                    /// </summary>
                    /// <param name="name">Name of the property.</param>
                    /// <param name="name">Display name of the property.</param>
                    /// <param name="dataType">Type of the property.</param>
                    /// <param name="isNullable">Indicates if this property can be set with null.</param>
                    /// <param name="defaultValue">Default value for the property.</param>
                    helper.assertPrm(name, 'name').isNotEmptyString().check();
                    var dp = helper.findInArray(this.dataProperties, name, 'name');
                    if (dp)
                        throw helper.createError(i18N.dataPropertyAlreadyExists, [name], { entityType: this, existing: dp });
                    if (assert.isNotEmptyString(dataType))
                        dataType = core.dataTypes.byName(dataType);
                    helper.assertPrm(dataType, 'dataType').isInstanceOf(core.dataTypes.baseType).check();
                    if (defaultValue != null && !dataType.isValid(defaultValue))
                        throw helper.createError(i18N.invalidDefaultValue, [defaultValue, dataType.name],
                            { entityType: this, dataType: dataType, defaultValue: defaultValue });
                    var property = new metadata.dataProperty(this, name, displayName, dataType, isNullable === true, false, null, defaultValue);
                    this.dataProperties.push(property);
                };

                proto.addValidation = function (name, func, message, args) {
                    /// <summary>
                    /// Add new validation method to entity type.
                    /// </summary>
                    /// <param name="name">Name of the validation.</param>
                    /// <param name="func">Validation function.</param>
                    /// <param name="message">Message to show when validation fails.</param>
                    /// <param name="args">Validator arguments.</param>
                    helper.assertPrm(name, 'name').isNotEmptyString().check();
                    helper.assertPrm(func, 'func').isFunction().check();
                    this.validators.push(new core.validator(name, func, message, args));
                };

                proto.validate = function (entity) {
                    /// <summary>
                    /// Validates entity agains entity, data property and navigation property validations.
                    /// </summary>
                    /// <param name="entity">Entity to validate.</param>
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
                    /// <summary>
                    /// Finds given property paths one by one, looks recursively to navigation properties when needed.
                    /// </summary>
                    /// <param name="propertyPath">Property path array.</param>
                    /// <param name="type">The type of the entity.</param>
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
                    /// <summary>
                    /// Checks if this type can be set with given type.
                    /// </summary>
                    /// <param name="type1">Type to be assigned.</param>
                    /// <param name="type2">Type to assign.</param>
                    if (type1.name === type2.name)
                        return true;
                    else if (type2.baseType != null)
                        return isAssignableWith(type1, type2.baseType);

                    return false;
                }

                function isAssignableTo(type1, type2) {
                    /// <summary>
                    /// Checks if this type can be set to given type.
                    /// </summary>
                    /// <param name="type1">Type to set.</param>
                    /// <param name="type2">Type to check.</param>
                    var name = assert.isTypeOf(type2, 'string') ? type2 : type2.name;
                    if (type1.name === name)
                        return true;
                    else if (type1.baseType != null)
                        return isAssignableTo(type1.baseType, type2);

                    return false;
                }

                return ctor;
            })(),
            metadataManager: (function () {
                var ctor = function (metadataPrm) {
                    /// <summary>
                    /// Metadata manager default implementation.
                    /// </summary>
                    this.types = [];
                    this.enums = {};
                    this.name = null;
                    this.displayName = null;

                    if (metadataPrm)
                        this.parseBeetleMetadata(metadataPrm);
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.types.join(', ');
                };

                proto.getEntityType = function (typeName, throwIfNotFound) {
                    /// <summary>
                    /// Finds entity type by given entity type name (fully qualified).
                    /// </summary>
                    /// <param name="typeName">Type name</param>
                    /// <param name="throwIfNotFound">Throws an error if given type name could not be found in cache.</param>
                    var type = helper.findInArray(this.types, typeName, 'name');
                    if (!type && throwIfNotFound === true)
                        throw helper.createError(i18N.notFoundInMetadata, [typeName], { metadataManager: this, typeName: typeName });
                    return type;
                };

                proto.getEntityTypeByShortName = function (shortName, throwIfNotFound) {
                    /// <summary>
                    /// Finds entity type by given entity type short name (only class name).
                    /// </summary>
                    /// <param name="shortName">Type name</param>
                    /// <param name="throwIfNotFound">Throws an error if given type name could not be found in cache.</param>
                    var type = helper.findInArray(this.types, shortName, 'shortName');
                    if (!type && throwIfNotFound === true)
                        throw helper.createError(i18N.notFoundInMetadata, [shortName], { metadataManager: this, typeShortName: shortName });
                    return type;
                };

                proto.createQuery = function (resourceName, shortName, manager) {
                    /// <summary>
                    /// Creates a new query for this type.
                    /// </summary>
                    /// <param name="resourceName">Query resource name.</param>
                    /// <param name="shortName">Type name</param>
                    /// <param name="manager">Entity manager</param>
                    // if shortName is given find entityType and create query for it.
                    if (shortName) return this.getEntityTypeByShortName(shortName, true).createQuery(resourceName, manager);
                    // try to find entity type by its resource (set) name.
                    var typeList = helper.filterArray(this.types, function (item) { return item.setName == resourceName; });
                    return typeList.length == 1 ? typeList[0].createQuery(resourceName, manager) : new querying.entityQuery(resourceName, null, manager);
                };

                proto.registerCtor = function (shortName, constructor, initializer) {
                    /// <summary>
                    /// Register constructor and initializer (optional) for given type.
                    ///  Constructor is called right after the entity object is generated.
                    ///  Initializer is called after entity started to being tracked (properties converted to observable).
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    /// <param name="constructor">Constructor function.</param>
                    /// <param name="initializer">Initializer function.</param>
                    var type = this.getEntityTypeByShortName(shortName, true);
                    type.registerCtor(constructor, initializer);
                };

                proto.createEntity = function (shortName, initialValues) {
                    /// <summary>
                    /// Creates an entity using the type that has given entity type short name (only class name).
                    /// </summary>
                    /// <param name="shortName">Type name</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    // find entity type.
                    var type = this.getEntityTypeByShortName(shortName, true);
                    // create entity for this type
                    return type.createEntity(initialValues);
                };

                proto.createRawEntity = function (shortName, initialValues) {
                    /// <summary>
                    /// Create the entity by its type's short name but do not convert to observable and do not add to manager.
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    // find entity type.
                    var type = this.getEntityTypeByShortName(shortName, true);
                    // create entity for this type
                    return type.createRawEntity(initialValues);
                };

                proto.parseBeetleMetadata = function (metadataPrm) {
                    /// <summary>
                    /// Imports metadata from given object.
                    /// </summary>
                    /// <param name="metadataPrm">Metadata object.</param>
                    /// <param name="types">Type list to hold imported data.</param>
                    /// <param name="instance">Metadata manager instance.</param>
                    this.types = [];
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
                            var enm = new libs.enums(enumObj);
                            this.enums[e.n] = enm;
                            enumTypes[e.n] = new core.dataTypes.enum(enm, e.n, helper.getResourceValue(e.r, e.l || e.n));
                        }
                    }

                    var that = this;
                    var maps = metadataPrm.m;
                    // first create an entityType for each entity.
                    for (var j = 0; j < maps.length; j++) {
                        var map = maps[j];
                        var t = new metadata.entityType(map.n, helper.getResourceValue(map.rn, map.s), map.s, map.k, map.b, map.q, map.t, map.c, this);
                        // create data properties
                        helper.forEach(map.d, function (dp) {
                            var dataType;
                            if (dp.e)
                                dataType = enumTypes[dp.t];
                            else
                                dataType = core.dataTypes.byName(dp.t);
                            var dn = helper.getResourceValue(dp.r, dp.l || dp.n);
                            var property = new metadata.dataProperty(t, dp.n, dn, dataType, dp.i === true, map.k && helper.findInArray(map.k, dp.n) != null,
                                dp.g ? (dp.g == "I" ? enums.generationPattern.Identity : enums.generationPattern.Computed) : null,
                                dp.d ? dataType.handle(dp.d) : null, dp.c);
                            if (dp.v)
                                helper.forEach(dp.v, function (v) {
                                    property.validators.push(core.validator.byCode(v.t, v.a, v.m, v.r, property.displayName, dp.r));
                                });
                            if (dp.p) property.precision = Number(dp.p);
                            if (dp.s) property.scale = Number(dp.s);
                            t.dataProperties.push(property);
                        });
                        // create navigation properties
                        var relations = map.r;
                        if (relations)
                            helper.forEach(relations, function (np) {
                                var navProp = new metadata.navigationProperty(t, np.n, helper.getResourceValue(np.r, np.l || np.n), np.t, np.s === true, np.a, np.c);
                                if (np.f)
                                    helper.forEach(np.f, function (fk) {
                                        navProp.foreignKeyNames.push(fk);
                                    });
                                if (np.v)
                                    helper.forEach(np.v, function (v) {
                                        navProp.validators.push(core.validator.byCode(v.t, v.a, v.m, v.r, navProp.displayName, np.r));
                                    });
                                t.navigationProperties.push(navProp);
                            });
                        var complex = map.x;
                        if (complex)
                            helper.forEach(complex, function (cp) {
                                var property = new metadata.navigationProperty(t, cp.n, helper.getResourceValue(cp.r, cp.l || cp.n), cp.t, true);
                                t.navigationProperties.push(property);
                            });
                        this.types.push(t);
                    }

                    // then create relation between inherited entities.
                    helper.forEach(this.types, function (type) {
                        if (type.baseTypeName)
                            type.baseType = that.getEntityTypeByShortName(type.baseTypeName, true);
                        delete type.baseTypeName;
                    });
                    // fill inherited properties using base type informations.
                    helper.forEach(this.types, function (type) {
                        var base = type.baseType;
                        while (base) {
                            type.floorType = base;
                            helper.forEach(base.dataProperties, function (dp) {
                                if (!helper.findInArray(type.dataProperties, dp)) {
                                    type.dataProperties.push(dp);
                                }
                            });
                            helper.forEach(base.navigationProperties, function (np) {
                                if (!helper.findInArray(type.navigationProperties, np)) {
                                    type.navigationProperties.push(np);
                                }
                            });
                            base = base.baseType;
                        }
                        // populate navigation properties inverse and create relation between data property and navigation property
                        helper.forEach(type.navigationProperties, function (np) {
                            if (!np.entityType) {
                                np.entityType = that.getEntityTypeByShortName(np.entityTypeName, true);
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
                                    dp.relatedNavigationProperties.push(np);
                                    np.foreignKeys.push(dp);
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
    })();
    var querying = (function () {
        /// <summary>Querying related types.</summary>

        return {
            expressions: (function () {
                /// <summary>Linq like expressions to filter, order etc. arrays and server resources. Used by queries.</summary>

                return {
                    ofTypeExp: (function () {
                        var ctor = function (typeName) {
                            /// <summary>
                            /// Holds query concrete type name.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'oftype', -1, true, true);
                            this.typeName = typeName;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.combine = function (typeName) {
                            this.typeName = typeName;
                        };

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
                    whereExp: (function () {
                        var filterItem = (function () {
                            var c = function (expStr, isOr, varContext) {
                                /// <summary>
                                /// Represents a single predication.
                                /// </summary>
                                // filter expression.
                                this.expStr = expStr;
                                this.exp = libs.jsep(expStr);
                                // tells if we should append this filter with 'and' or 'or' with previous filter. 
                                this.isOr = isOr === true;
                                this.varContext = varContext;
                            };
                            var p = c.prototype;

                            p.toString = function () {
                                return this.exp.toString();
                            };

                            p.toODataQuery = function (queryContext) {
                                queryContext = queryContext || {};
                                queryContext.expVarContext = this.varContext;
                                var retVal = helper.jsepToODataQuery(this.exp, queryContext);
                                queryContext.expVarContext = undefined;
                                return retVal;
                            };

                            p.toBeetleQuery = function (queryContext) {
                                queryContext = queryContext || {};
                                queryContext.expVarContext = this.varContext;
                                var retVal = helper.jsepToBeetleQuery(this.exp, queryContext);
                                queryContext.expVarContext = undefined;
                                return retVal;
                            };

                            p.clone = function () {
                                return new filterItem(this.expStr, this.isOr, this.varContext);
                            };

                            p.toFunction = function (queryContext) {
                                // build a filter function
                                var that = this;
                                return function (object) {
                                    queryContext = queryContext || {};
                                    queryContext.expVarContext = that.varContext;
                                    var retVal = helper.jsepToFunction(that.exp, queryContext)(object);
                                    queryContext.expVarContext = undefined;
                                    return retVal;
                                };
                            };

                            return c;
                        })();
                        var filterGroup = (function () {
                            var c = function (isOr) {
                                /// <summary>
                                /// represent a group of predications.
                                /// </summary>
                                // tells if we should append this group with 'and' or 'or' with previous group. 
                                this.isOr = isOr === true;
                                // single predications.
                                this.filterItems = [];
                            };
                            var p = c.prototype;

                            p.toString = function () {
                                var retVal = [];
                                var last = null;
                                helper.forEach(this.filterItems, function (fi) {
                                    if (last != null) retVal.push(last.isOr ? ' or ' : ' and ');
                                    retVal.push(fi.toString());
                                    last = fi;
                                });
                                return retVal.join('');
                            };

                            p.toODataQuery = function (queryContext) {
                                var groupStr = '';
                                helper.forEach(this.filterItems, function (fi) {
                                    // get filter item's properties.
                                    var predicate = fi.toODataQuery(queryContext);
                                    // combine filter with previous filters with filter's operator.
                                    if (groupStr) groupStr += (fi.isOr ? ' or ' : ' and ') + predicate;
                                    else groupStr = predicate;
                                });
                                return '(' + groupStr + ')';
                            };

                            p.toBeetleQuery = function (queryContext) {
                                var groupStr = '';
                                helper.forEach(this.filterItems, function (fi) {
                                    // get filter item's properties.
                                    var predicate = fi.toBeetleQuery(queryContext);
                                    // combine filter with previous filters with filter's operator.
                                    if (groupStr) groupStr += (fi.isOr ? ' or ' : ' and ') + predicate;
                                    else groupStr = predicate;
                                });
                                return '(' + groupStr + ')';
                            };

                            p.clone = function (cloneList) {
                                var pg = new filterGroup(this.isOr);
                                helper.forEach(this.filterItems, function (item) {
                                    pg.filterItems.push(item.clone(cloneList));
                                });
                                if (cloneList) cloneList.push({ o: this, n: pg });
                                return pg;
                            };

                            p.toFunction = function (queryContext) {
                                var that = this;
                                // build a filter function
                                return function (object) {
                                    var b = null;
                                    for (var j = 0; j < that.filterItems.length; j++) {
                                        var f = that.filterItems[j];
                                        if (f.isOr)
                                            b = (b == null ? false : b) || f.toFunction(queryContext)(object);
                                        else
                                            b = (b == null ? true : b) && f.toFunction(queryContext)(object);
                                    }
                                    return b;
                                };
                            };

                            return c;
                        })();

                        var ctor = function (initial) {
                            /// <summary>
                            /// Builds complex queries with filter items, can use and, or and groups (to group filter items with parentheses).
                            /// Example:
                            ///     query.Where('Name', op.Equal, 'Old').and('Age', op.Greater, 30).closeGroup()
                            ///          .orGroup('Name', op.Equal, 'Young').and('Age', op.Lesser, 30);
                            /// 
                            /// Note: When there is no open group left, 'and' or 'or' call will also open a group.
                            /// Example: This query is same with the previous one.
                            ///     query.Where('Name', op.Equal, 'Old').and('Age', op.Greater, 30).closeGroup()
                            ///          .orGroup('Name', op.Equal, 'Young').and('Age', op.Lesser, 30);
                            ///     (Name == 'Old' and Age > 30) or (Name == 'TooOld' and Age > 100)
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'filter', 2, false, false);
                            // active group, all and, or calls will be added to this groups as filters.
                            this.currentGroup = null;
                            // all root groups, query will be build using these.
                            this.groups = [];
                            // open group stacks, when group is closed we pop current group from this list.
                            this.openGroups = [];

                            // create a default group for initial filter.
                            if (initial)
                                this.andGroup.apply(this, initial);
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.and = function (args) {
                            /// <summary>
                            /// Combines given predication with previous filters using 'and'.
                            /// </summary>
                            /// <param name="args">Filter arguments. Can be expression or [Property], [FilterOps], [Value].</param>
                            // add this filter to current group's filter list.
                            if (!this.currentGroup) createGroup(args, false, this);
                            else parseFilterArgs(args, false, this.currentGroup);
                            return this;
                        };

                        proto.or = function (args) {
                            /// <summary>
                            /// Combines given predication with previous filters using 'or'.
                            /// </summary>
                            /// <param name="args">Filter arguments. Can be expression or [Property], [FilterOps], [Value].</param>
                            if (!this.currentGroup) createGroup(args, true, this);
                            else parseFilterArgs(args, true, this.currentGroup);
                            return this;
                        };

                        proto.andGroup = function (args) {
                            /// <summary>
                            /// Creates new group with given initial filter and combines it with previous group using 'and'.
                            /// </summary>
                            /// <param name="args">Filter arguments. Can be expression or [Property], [FilterOps], [Value].</param>
                            // create new group with initial filter and false (to say it is not an 'or').
                            createGroup(arguments, false, this);
                            return this;
                        };

                        proto.orGroup = function (args) {
                            /// <summary>
                            /// Creates new group with given initial filter and combines it with previous group using 'or'.
                            /// </summary>
                            /// <param name="args">Filter arguments. Can be expression or [Property], [FilterOps], [Value].</param>
                            createGroup(arguments, true, this);
                            return this;
                        };

                        proto.closeGroup = function () {
                            /// <summary>
                            /// gets lastly opened group from stack and sets the last item as current. 
                            /// </summary>
                            /// <param name="args">Filter arguments. Can be expression or [Property], [FilterOps], [Value].</param>
                            // get last opened group.
                            var og = this.openGroups.pop();
                            // if there is no open group, throw an error.
                            if (!og) throw helper.createError(i18N.noOpenGroup, { expression: this });
                            // set the current group.
                            this.currentGroup = this.openGroups[this.openGroups.length - 1];
                            return this;
                        };

                        proto.combine = function (args) {
                            /// <summary>
                            /// Converts given arguments to filter item and combines (and) it with this expression.
                            /// </summary>
                            this.and(args);
                        };

                        proto.toODataQuery = function (queryContext) {
                            var retVal = null;
                            helper.forEach(this.groups, function (group) {
                                // create query string for group
                                var groupStr = group.toODataQuery(queryContext);
                                // combine whole group with filter with group's operator.
                                if (retVal) retVal += (group.isOr ? ' or ' : ' and ') + groupStr;
                                else retVal = groupStr;
                            });
                            return retVal;
                        };

                        proto.toBeetleQuery = function (queryContext) {
                            var retVal = null;
                            helper.forEach(this.groups, function (group) {
                                // create query string for group
                                var groupStr = group.toBeetleQuery(queryContext);
                                // combine whole group with filter with group's operator.
                                if (retVal) retVal += (group.isOr ? ' or ' : ' and ') + groupStr;
                                else retVal = groupStr;
                            });
                            return retVal;
                        };

                        proto.clone = function () {
                            var pb = new ctor();
                            var cloneList = [];
                            // create all groups for new predicate builder.
                            helper.forEach(this.groups, function (item) {
                                pb.groups.push(item.clone(cloneList));
                            });
                            // create all open groups and current group, so it works correctly
                            helper.forEach(this.openGroups, function (item) {
                                pb.openGroups.push(helper.findInArray(cloneList, item, 'o').n);
                            });
                            if (this.currentGroup)
                                pb.currentGroup = helper.findInArray(cloneList, this.currentGroup, 'o').n;
                            return pb;
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.groups, queryContext);
                        };

                        ctor.execute = function (array, groups, queryContext) {
                            var predicate = function (object) {
                                var b = null;
                                for (var i = 0; i < groups.length; i++) {
                                    var g = groups[i];
                                    if (g.isOr) b = (b == null ? false : b) || g.toFunction(queryContext)(object);
                                    else b = (b == null ? true : b) && g.toFunction(queryContext)(object);
                                }
                                return b;
                            };
                            return helper.filterArray(array, predicate);
                        };

                        function createGroup(args, isOr, instance) {
                            /// <summary>
                            /// creates a new group. if this is a inner group, adds it to current group's inner groups, otherwise adds it to root groups.
                            /// now this is the active group, so set it as currentGroup and add this group to openGroups.
                            /// </summary>
                            /// <param name="args">Filter arguments. Can be [Property], [FilterOps], [Value] for now.</param>
                            // new group object.
                            var group = new filterGroup(isOr);
                            if (args.length > 0)
                                parseFilterArgs(args, isOr, group);
                            // add this group to proper list.
                            if (!instance.currentGroup)
                                instance.groups.push(group);
                            else
                                instance.currentGroup.filterItems.push(group);
                            // set as current.
                            instance.currentGroup = group;
                            // add to open group list.
                            instance.openGroups.push(group);
                        }

                        function parseFilterArgs(args, isOr, currentGroup) {
                            /// <summary>
                            /// creates filterItem for given arguments.
                            /// </summary>
                            /// <param name="args">filter parameters.</param>
                            /// <param name="isOr">whether this filter needs to be connected to its predecessor with or.</param>
                            /// <param name="currentGroup">active group to add created filterItem.</param>
                            if (args.length == 3 || args.length == 4) {
                                var op = args[1];
                                // if operation filter is given as string, try to find enum value
                                if (assert.isTypeOf(op, 'string')) {
                                    op = op.toLowerCase();
                                    var symbols = enums.filterOps.symbols();
                                    for (var i = 0; i < symbols.length; i++) {
                                        var sym = symbols[i];
                                        if (sym.oData == op || sym.code == op || sym.name == op) {
                                            op = sym;
                                            break;
                                        }
                                    }
                                }
                                helper.assertPrm(op, 'filterOperation').isEnum(enums.filterOps).check();

                                var prop = args[0];
                                var val = args[2];
                                if (core.dataTypes.date.isValid(val))
                                    val = '"' + settings.getDateConverter().toISOString(val) + '"';
                                else if (assert.isTypeOf(val, 'string') && !(args.length == 4 && val[0] == "@"))
                                    val = '"' + val + '"';
                                var expStr;
                                if (op.isFunc) {
                                    if (op === enums.filterOps.Contains)
                                        expStr = 'substringof(' + val + ', ' + prop + ')';
                                    else
                                        expStr = op.code + '(' + prop + ', ' + val + ')';
                                } else
                                    expStr = prop + op.code + val;

                                currentGroup.filterItems.push(new filterItem(expStr, isOr, args[3]));
                                return;
                            } else if (args.length == 1 || args.length == 2)
                                currentGroup.filterItems.push(new filterItem(args[0], isOr, args[1]));
                            else throw helper.createError(i18N.argCountMismatch, ['where'], { args: args });
                        }

                        return ctor;
                    })(),
                    orderByExp: (function () {
                        var defaultExp = 'x => x';
                        var ctor = function (expStr, isDesc) {
                            /// <summary>
                            /// Holds query order by parameters.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'orderby', 1, false, false);
                            expStr = expStr || defaultExp;
                            if (isDesc === true) expStr += ' desc';
                            this.expStr = expStr;
                            this.exp = libs.jsep(expStr);
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.combine = function (expStr, isDesc) {
                            helper.assertPrm(expStr, 'expStr').isNotEmptyString().check();
                            expStr = expStr || defaultExp;
                            if (isDesc === true) expStr += ' desc';
                            this.expStr += ', ' + expStr;
                            this.exp = libs.jsep(this.expStr);
                        };

                        proto.toODataQuery = function (queryContext) {
                            return helper.jsepToODataQuery(this.exp, queryContext);
                        };

                        proto.toBeetleQuery = function (queryContext) {
                            return helper.jsepToBeetleQuery(this.exp, queryContext);
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, expr, queryContext) {
                            var comparers = [];
                            var exps = expr.type == 'Compound' ? expr.body : [expr];
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
                                var comparer = (function (e, desc) {
                                    return function (object1, object2) {
                                        var f = helper.jsepToFunction(e, queryContext);
                                        var value1 = f(object1);
                                        var value2 = f(object2);
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
                            retVal = retVal.sort(function (object1, object2) {
                                for (var j = 0; j < comparers.length; j++) {
                                    var result = comparers[j](object1, object2);
                                    if (result != 0)
                                        return result;
                                }
                                return 0;
                            });
                            return retVal;
                        };

                        return ctor;
                    })(),
                    expandExp: (function () {
                        var ctor = function (expStr) {
                            /// <summary>
                            /// Holds query expand list.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'expand', 1, false, false);
                            this.expStr = expStr;
                            this.exp = libs.jsep(expStr);
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.combine = function (expStr) {
                            this.expStr += ', ' + expStr;
                            this.exp = libs.jsep(this.expStr);
                        };

                        proto.toODataQuery = function (queryContext) {
                            return helper.jsepToODataQuery(this.exp, queryContext);
                        };

                        proto.toBeetleQuery = function (queryContext) {
                            return helper.jsepToBeetleQuery(this.exp, queryContext);
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return array; // do nothing for local queries.
                        };

                        return ctor;
                    })(),
                    selectExp: (function () {
                        var ctor = function (expStr) {
                            /// <summary>
                            /// Holds query projection parameters.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'select', 2, false, true);
                            this.expStr = expStr;
                            this.exp = libs.jsep(expStr);
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.combine = function (expStr) {
                            this.expStr += ', ' + expStr;
                            this.exp = libs.jsep(this.expStr);
                        };

                        proto.toODataQuery = function (queryContext) {
                            return helper.jsepToODataQuery(this.exp, queryContext);
                        };

                        proto.toBeetleQuery = function (queryContext) {
                            return helper.jsepToBeetleQuery(this.exp, queryContext);
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (array.length == 0) return array;

                            // arrange expressions
                            var exps = exp.type == 'Compound' ? exp.body : [exp];
                            var projector = helper.jsepToProjector(exps, queryContext);

                            // execute projection expression on array items
                            var projections = [];
                            for (var j = 0; j < array.length; j++)
                                projections.push(projector(array[j]));
                            return projections;
                        };

                        return ctor;
                    })(),
                    skipExp: (function () {
                        var ctor = function (count) {
                            /// <summary>
                            /// Holds query skip count.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'skip', 2, false, false);
                            this.count = count;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.combine = function (count) {
                            if (count < this.count) this.count = count;
                        };

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
                    topExp: (function () {
                        var ctor = function (count) {
                            /// <summary>
                            /// Holds query top information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'top', 2, false, false);
                            this.count = count;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.combine = function (count) {
                            if (count < this.count) this.count = count;
                        };

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
                    groupByExp: (function () {
                        var ctor = function (keySelectorStr, elementSelectorStr) {
                            /// <summary>
                            /// Holds query groupBy information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'groupby', 3, true, true);
                            this.keySelectorStr = keySelectorStr;
                            this.elementSelectorStr = elementSelectorStr;

                            this.keySelectorExp = null;
                            if (keySelectorStr)
                                this.keySelectorExp = libs.jsep(keySelectorStr);
                            this.elementSelectorExp = null;
                            if (elementSelectorStr)
                                this.elementSelectorExp = libs.jsep(elementSelectorStr);
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            var retVal = '';
                            if (this.keySelectorExp)
                                retVal += helper.jsepToBeetleQuery(this.keySelectorExp, queryContext);
                            if (this.elementSelectorExp)
                                retVal += ';' + helper.jsepToBeetleQuery(this.elementSelectorExp, queryContext);
                            return retVal;
                        };

                        proto.clone = function () {
                            return new ctor(this.keySelectorStr, this.elementSelectorStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.keySelectorExp, this.elementSelectorExp, queryContext);
                        };

                        ctor.execute = function (array, keySelectorExp, elementSelectorExp, queryContext) {
                            var groups = [];
                            // project keys
                            if (keySelectorExp) {
                                var keys = querying.expressions.selectExp.execute(array, keySelectorExp, queryContext);
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
                            } else groups.push({ Key: null, Items: array });

                            if (elementSelectorExp) {
                                var exps = elementSelectorExp.type == 'Compound' ? elementSelectorExp.body : [elementSelectorExp];
                                var projector = helper.jsepToProjector(exps, queryContext);
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
                    distinctExp: (function () {
                        var ctor = function (expStr) {
                            /// <summary>
                            /// Holds query distinct information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'distinct', 3, true, true);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp)
                                array = querying.expressions.selectExp.execute(array, exp, queryContext);
                            return getDistincts(array);
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
                    reverseExp: (function () {
                        var ctor = function () {
                            /// <summary>
                            /// Holds query reverse information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'reverse', 3, true, false);
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function () {
                            return '';
                        };

                        proto.clone = function () {
                            return new ctor();
                        };

                        proto.execute = function (array) {
                            return ctor.execute(array);
                        };

                        ctor.execute = function (array) {
                            return array.reverse();
                        };

                        return ctor;
                    })(),
                    selectManyExp: (function () {
                        var ctor = function (expStr) {
                            /// <summary>
                            /// Holds query distinct information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'selectMany', 3, true, true);
                            this.expStr = expStr;
                            this.exp = libs.jsep(expStr);
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return helper.jsepToBeetleQuery(this.exp, queryContext);
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (array.length == 0) return array;

                            // arrange expressions
                            var projector = helper.jsepToFunction(exp, queryContext);

                            // execute projection expression on array items
                            var projections = [];
                            for (var j = 0; j < array.length; j++) {
                                var arr = projector(array[j]);
                                projections = projections.concat.apply(projections, arr);
                            }
                            return projections;
                        };

                        return ctor;
                    })(),
                    skipWhileExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query skipWhile information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'skipWhile', 3, true, false);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return helper.jsepToBeetleQuery(this.exp, queryContext);
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            var predicate = helper.jsepToFunction(exp, queryContext);
                            var i = 0;
                            while (predicate(array[i]) == true) i++;
                            return array.slice(i + 1);
                        };

                        return ctor;
                    })(),
                    takeWhileExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query takeWhile information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'takeWhile', 3, true, false);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return helper.jsepToBeetleQuery(this.exp, queryContext);
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            var predicate = helper.jsepToFunction(exp, queryContext);
                            var i = 0;
                            while (predicate(array[i]) == true) i++;
                            return array.slice(0, i);
                        };

                        return ctor;
                    })(),
                    allExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query all information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;all', 3, true, true);
                            this.expStr = expStr;
                            this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return helper.jsepToBeetleQuery(this.exp, queryContext);
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            var predicate = helper.jsepToFunction(exp, queryContext);
                            return querying.queryFuncs.all.impl(array, function () { return array; }, predicate);
                        };

                        return ctor;
                    })(),
                    anyExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query any information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;any', 3, true, true);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp) {
                                var predicate = helper.jsepToFunction(exp, queryContext);
                                return querying.queryFuncs.any.impl(array, function () { return array; }, predicate);
                            }
                            return array.length > 0;
                        };

                        return ctor;
                    })(),
                    avgExp: (function () {
                        var ctor = function (expStr) {
                            /// <summary>
                            /// Holds query average information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;avg', 3, true, true);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            var selector = exp ? helper.jsepToFunction(exp, queryContext) : function (value) { return value; };
                            return querying.queryFuncs.avg.impl(array, function () { return array; }, selector);
                        };

                        return ctor;
                    })(),
                    maxExp: (function () {
                        var ctor = function (expStr) {
                            /// <summary>
                            /// Holds query maximum information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;max', 3, true, true);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            var selector = exp ? helper.jsepToFunction(exp, queryContext) : function (value) { return value; };
                            return querying.queryFuncs.max.impl(array, function () { return array; }, selector);
                        };

                        return ctor;
                    })(),
                    minExp: (function () {
                        var ctor = function (expStr) {
                            /// <summary>
                            /// Holds query minimum information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;min', 3, true, true);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            var selector = exp ? helper.jsepToFunction(exp, queryContext) : function (value) { return value; };
                            return querying.queryFuncs.min.impl(array, function () { return array; }, selector);
                        };

                        return ctor;
                    })(),
                    sumExp: (function () {
                        var ctor = function (expStr) {
                            /// <summary>
                            /// Holds query sum information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;sum', 3, true, true);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            var selector = exp ? helper.jsepToFunction(exp, queryContext) : function (value) { return value; };
                            return querying.queryFuncs.sum.impl(array, function () { return array; }, selector);
                        };

                        return ctor;
                    })(),
                    countExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query count information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;count', 3, true, true);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp) array = helper.filterArray(array, helper.jsepToFunction(exp, queryContext));
                            return array.length;
                        };

                        return ctor;
                    })(),
                    firstExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query first information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;first', 3, true, false);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp) array = helper.filterArray(array, helper.jsepToFunction(exp, queryContext));
                            if (array.length == 0) throw helper.createError(i18N.arrayEmpty, { array: array, expression: this });
                            return array[0];
                        };

                        return ctor;
                    })(),
                    firstOrDefaultExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query firstOrDefault information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;firstOD', 3, true, false);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp) array = helper.filterArray(array, helper.jsepToFunction(exp, queryContext));
                            return array.length == 0 ? null : array[0];
                        };

                        return ctor;
                    })(),
                    singleExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query single information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;single', 3, true, false);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp) array = helper.filterArray(array, helper.jsepToFunction(exp, queryContext));
                            if (array.length != 1) throw helper.createError(i18N.arrayNotSingle, { array: array, expression: this });
                            return array[0];
                        };

                        return ctor;
                    })(),
                    singleOrDefaultExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query singleOrDefault information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;singleOD', 3, true, false);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp) array = helper.filterArray(array, helper.jsepToFunction(exp, queryContext));
                            if (array.length > 1) throw helper.createError(i18N.arrayNotSingleOrEmpty, { array: array, expression: this });
                            return array.length == 0 ? null : array[0];
                        };

                        return ctor;
                    })(),
                    lastExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query last information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;last', 3, true, false);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp) array = helper.filterArray(array, helper.jsepToFunction(exp, queryContext));
                            if (array.length == 0) throw helper.createError(i18N.arrayEmpty, { array: array, expression: this });
                            return array[array.length - 1];
                        };

                        return ctor;
                    })(),
                    lastOrDefaultExp: (function () {
                        var ctor = function (expStr, varContext) {
                            /// <summary>
                            /// Holds query lastOrDefault information.
                            /// </summary>
                            baseTypes.expressionBase.call(this, 'exec;lastOD', 3, true, false);
                            this.expStr = expStr;
                            if (expStr)
                                this.exp = libs.jsep(expStr);
                            this.varContext = varContext;
                            this.isExecuter = true;
                        };
                        helper.inherit(ctor, baseTypes.expressionBase);
                        var proto = ctor.prototype;

                        proto.toBeetleQuery = function (queryContext) {
                            return this.exp ? helper.jsepToBeetleQuery(this.exp, queryContext) : '';
                        };

                        proto.clone = function () {
                            return new ctor(this.expStr, this.varContext);
                        };

                        proto.execute = function (array, queryContext) {
                            return ctor.execute(array, this.exp, queryContext);
                        };

                        ctor.execute = function (array, exp, queryContext) {
                            if (exp) array = helper.filterArray(array, helper.jsepToFunction(exp, queryContext));
                            return array.length == 0 ? null : array[array.length - 1];
                        };

                        return ctor;
                    })()
                };
            })(),
            queryFuncs: (function () {
                /// <summary>Supported query functions. When a query has one of these in filter, functions will be executed dynamically for local queries.</summary>

                var expose = {};

                /// <field>Returns uppercase value</field>
                expose.toupper = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'toupper', 'ToUpper', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source) {
                        return (source ? source(value) : value).toUpperCase();
                    };

                    return new ctor();
                })();
                /// <field>Returns lowercase value</field>
                expose.tolower = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'tolower', 'ToLower', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source) {
                        return (source ? source(value) : value).toLowerCase();
                    };

                    return new ctor();
                })();
                /// <field>Returns substring of given string</field>
                expose.substring = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'substring', 'Substring', 3);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>When given value contains given find string returns true, otherwise returns false</field>
                expose.substringof = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'substringof', 'Contains', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (find, source) {
                        source = source ? source + '.' : '';
                        return source + 'Contains(' + find + ')';
                    };

                    proto.impl = function (value, find, source) {
                        source = (source ? source(value) : value);
                        source = helper.handleStrOptions(source, this.varContext);
                        find = helper.handleStrOptions(find(value), this.varContext);
                        return source && source.indexOf(find) >= 0;
                    };

                    return new ctor();
                })();
                /// <field>Returns length of string</field>
                expose.length = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'length', 'Length', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns trimmed string</field>
                expose.trim = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'trim', 'Trim', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source) {
                        return (source ? source(value) : value).trim();
                    };

                    return new ctor();
                })();
                /// <field>Returns concatenated string</field>
                expose.concat = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'concat', 'Concat', null);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field> Replace string from source with given value</field>
                expose.replace = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'replace', 'Replace', 3);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>if source string starts with given parameter returns true, otherwise false</field>
                expose.startswith = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'startswith', 'StartsWith', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source, find) {
                        if (arguments.length == 2) {
                            find = source;
                            source = value;
                        } else source = source(value);
                        source = helper.handleStrOptions(source, this.varContext);
                        find = helper.handleStrOptions(find(value), this.varContext);
                        return source && source.indexOf(find, 0) === 0;
                    };

                    return new ctor();
                })();
                /// <field>if source string ends with given parameter returns true, otherwise false</field>
                expose.endswith = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'endswith', 'EndsWith', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source, find) {
                        if (arguments.length == 2) {
                            find = source;
                            source = value;
                        } else source = source(value);
                        source = helper.handleStrOptions(source, this.varContext);
                        find = helper.handleStrOptions(find(value), this.varContext);
                        var index = source.length - find.length;
                        return source && source.indexOf(find, index) !== -1;
                    };

                    return new ctor();
                })();
                /// <field>Returns indexof find string in source string</field>
                expose.indexof = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'indexof', 'IndexOf', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.impl = function (value, source, find) {
                        if (arguments.length == 2) {
                            find = source;
                            source = value;
                        } else source = source(value);
                        source = helper.handleStrOptions(source, this.varContext);
                        find = helper.handleStrOptions(find(value), this.varContext);
                        return source && source.indexOf(find);
                    };

                    return new ctor();
                })();
                /// <field>if items contains given item returns true, otherwise false. Supports arrays and strings as items parameter.</field>
                expose.contains = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'contains', 'Contains', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (items, item) {
                        if (assert.isTypeOf(items, 'string'))
                            return expose.substringof.toODataFunction(item, items);
                        var args = [];
                        helper.forEach(items, function (i) {
                            args.push(item + ' eq ' + core.dataTypes.toODataValue(i));
                        });
                        return '(' + args.join(' or ') + ')';
                    };

                    proto.toBeetleFunction = function (items, item) {
                        if (assert.isTypeOf(items, 'string'))
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
                        if (assert.isArray(items)) {
                            for (var i = 0; i < items.length; i++) {
                                var v = items[i];
                                if (v == item) return true;
                            }
                            return false;
                        }
                        items = helper.handleStrOptions(items, this.varContext);
                        item = helper.handleStrOptions(item, this.varContext);
                        return items && items.indexOf(item) >= 0;
                    };

                    return new ctor();
                })();

                /// <field>Rounds given value to nearest integer</field>
                expose.round = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'round', 'Math.Round', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        return 'Math.Round(' + source + ')';
                    };

                    proto.impl = function (value, source) {
                        return Math.round(source ? source(value) : value);
                    };

                    return new ctor();
                })();
                /// <field>Returns smallest integer value that is greater than given value</field>
                expose.ceiling = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'ceiling', 'Math.Ceiling(%1)', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        return 'Math.Ceiling(' + source + ')';
                    };

                    proto.impl = function (value, source) {
                        return Math.ceil(source ? source(value) : value);
                    };

                    return new ctor();
                })();
                /// <field>Returns biggest integer value that is smaller than given value</field>
                expose.floor = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'floor', 'Math.Floor', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.toBeetleFunction = function (source) {
                        return 'Math.Floor(' + source + ')';
                    };

                    proto.impl = function (value, source) {
                        return Math.floor(source ? source(value) : value);
                    };

                    return new ctor();
                })();

                /// <field>Returns second of date</field>
                expose.second = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'second', 'Second', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns minute of date</field>
                expose.minute = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'minute', 'Minute', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns hour of date</field>
                expose.hour = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'hour', 'Hour', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns day of date</field>
                expose.day = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'day', 'Day', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns month of date</field>
                expose.month = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'month', 'Month', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns year of date</field>
                expose.year = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'year', 'Year', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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

                /// <field>Returns max value in the array</field>
                expose.max = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'max', 'Max', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns min value in the array</field>
                expose.min = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'min', 'Min', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns sum value from the array</field>
                expose.sum = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'sum', 'Sum', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>Returns count of the array</field>
                expose.count = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'count', 'Count', 1);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
                    var proto = ctor.prototype;

                    proto.toODataFunction = function (items) {
                        throw helper.createError(i18N.functionNotSupportedForOData, ['Count']);
                    };

                    proto.impl = function (value, items) {
                        return (items ? items(value) : value).length;
                    };

                    return new ctor();
                })();
                /// <field>Returns average value from the array</field>
                expose.avg = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'avg', 'Average', 2);
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>if any item from the array provides given predicate returns true, otherwise false</field>
                expose.any = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'any', 'Any', 2);
                        this.needsAlias = true;
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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
                /// <field>if all items of the array provides given predicate returns true, otherwise false</field>
                expose.all = (function () {
                    var ctor = function () {
                        baseTypes.queryFuncBase.call(this, 'all', 'All', 2);
                        this.needsAlias = true;
                    };
                    helper.inherit(ctor, baseTypes.queryFuncBase);
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

                expose.getFunc = function (funcName, throwIfNotFound) {
                    /// <summary>
                    /// Finds the function
                    /// </summary>
                    var func = expose[funcName.toLowerCase()];
                    if (func == null && throwIfNotFound !== false) throw helper.createError(i18N.unknownFunction, [funcName]);
                    return func;
                };

                return expose;
            })(),
            arrayQuery: (function () {
                Array.prototype.asQueryable = function () {
                    /// <summary>
                    /// Creates query for this array.
                    /// </summary>
                    return new querying.arrayQuery(this);
                };
                if (!Array.hasOwnProperty('q')) {
                    Array.prototype.q = function () {
                        /// <summary>
                        /// Creates query for this array.
                        /// </summary>
                        return this.asQueryable();
                    };
                }

                var ctor = function (array) {
                    /// <summary>
                    /// Array query, can be used like Linq to object.
                    /// Example:
                    ///     var array = [{name: 'Test', age: 15}, {name: 'Test2', age: 25}];
                    ///     var query = array.asQueryable().where('name == "Test"');
                    ///     var result = query.execute();
                    /// </summary>
                    this.array = array;
                    baseTypes.queryBase.call(this);
                };
                helper.inherit(ctor, baseTypes.queryBase);
                var proto = ctor.prototype;
                proto.executeAfterExecuter = true;

                proto.execute = function (varContext) {
                    /// <summary>
                    /// Executes this query against the related array.
                    /// 
                    ///  varContext;
                    ///  isCaseSensitive: When true string comparisons will be case sensitive
                    ///  ignoreWhiteSpaces: When true before comparison strings will be trimmed
                    ///  and variables used in query 
                    ///   (no separate varContext object like entityQueries, parameters needs to be given in this object)
                    /// </summary>
                    /// <param name="varContext">Variable context and query options.</param>
                    if (this.options)
                        varContext = helper.combine(this.options.varContext, varContext);
                    return this.toFunction()(this.array, varContext);
                };

                proto.clone = function () {
                    var q = new querying.arrayQuery(this.array);
                    this.copy(q);
                    return q;
                };

                proto.copy = function (query) {
                    baseTypes.queryBase.prototype.copy.call(this, query);
                };

                return ctor;
            })(),
            entityQuery: (function () {
                var ctor = function (resource, type, manager) {
                    /// <summary>
                    /// Entity query class. It can collect informations like where, orderBy etc.. 
                    /// </summary>
                    this.resource = resource;
                    this.entityType = handleEntityType(type, manager);
                    this.manager = manager;
                    this.parameters = [];

                    baseTypes.queryBase.call(this);
                };
                helper.inherit(ctor, baseTypes.queryBase);
                var proto = ctor.prototype;

                proto.toString = function () {
                    var retVal = [];
                    retVal.push('resource: (' + this.resource + ')');
                    if (this.entityType)
                        retVal.push('entityType: (' + this.entityType.shortName + ')');
                    if (this.manager)
                        retVal.push('manager: (' + this.manager.toString() + ')');
                    retVal.push(baseTypes.queryBase.prototype.toString.call(this));

                    return retVal.join(', ');
                };

                proto.expand = function (propertyPath) {
                    /// <summary>
                    /// Expand query with given properties.
                    /// Example: 
                    ///     var query = manager.createQuery('Order');
                    ///     query = query.expand('OrderDetails');
                    ///     
                    ///     This query takes Orders and OrderDetails for each order in one query.
                    /// </summary>
                    var q = this.clone();
                    var expand = q.getExpression(querying.expressions.expandExp);
                    if (expand) expand.combine(propertyPath);
                    else q.addExpression(new querying.expressions.expandExp(propertyPath));
                    return q;
                };

                proto.include = function (propertyPath) {
                    /// <summary>
                    /// <reference path="expand"/>
                    /// </summary>
                    /// <param name="propertyPath"></param>
                    return this.expand.apply(this, arguments);
                };

                proto.setParameter = function (name, value) {
                    /// <summary>
                    /// Sets given name-value pair as parameter. Parameters will be passed server method. 
                    /// </summary>
                    /// <param name="name">Name of parameter.</param>
                    /// <param name="value">Value of parameter.</param>
                    var q = this.clone();
                    var prm = helper.findInArray(q.parameters, name, 'name');
                    if (prm) prm.value = value;
                    else q.parameters.push({ name: name, value: value });
                    return q;
                };

                proto.setEntityType = function (type) {
                    /// <summary>
                    /// Sets entity type for query (used when executing locally).
                    /// </summary>
                    type = handleEntityType(type, this.manager);
                    var q = this.clone();
                    q.entityType = type;
                    return q;
                };

                proto.execute = function (options, successCallback, errorCallback) {
                    /// <summary>
                    /// Executes this query using related entity manager.
                    /// </summary>
                    /// <param name="options">Query options.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    if (!this.manager) throw helper.createError(i18N.onlyManagerCreatedCanBeExecuted, { query: this, options: options });
                    return this.manager.executeQuery(this, options, successCallback, errorCallback);
                };

                proto.executeLocally = function (varContext) {
                    /// <summary>
                    /// Executes this query against related manager's local cache.
                    /// </summary>
                    if (!this.manager) throw helper.createError(i18N.onlyManagerCreatedCanBeExecuted, { query: this, options: options });
                    return this.manager.executeQueryLocally(this, varContext);
                };

                proto.clone = function () {
                    var q = new querying.entityQuery(this.resource, this.entityType, this.manager);
                    this.copy(q);
                    return q;
                };

                proto.copy = function (query) {
                    baseTypes.queryBase.prototype.copy.call(this, query);
                    helper.forEach(this.parameters, function (prm) {
                        query.parameters.push(prm);
                    });
                };

                function handleEntityType(type, manager) {
                    if (type == null) return null;
                    if (assert.isTypeOf(type, 'string')) {
                        if (manager == null) throw helper.createError(i18N.onlyManagerCreatedCanAcceptEntityShortName);
                        return manager.getEntityType(type, true);
                    }
                    helper.assertPrm(type, 'type').isInstanceOf(metadata.entityType).check();
                    return type;
                }

                return ctor;
            })()
        };
    })();
    var core = (function () {
        /// <summary>Core types.</summary>

        return {
            valueNotifyWrapper: (function () {
                var ctor = function (value) {
                    /// <summary>
                    /// This class wraps given value to allow skipping callbacks.
                    /// </summary>
                    this.value = value;
                    helper.tryFreeze(this);
                };

                return ctor;
            })(),
            trackableArray: (function () {
                var ctor = function (initial, object, property, after) {
                    /// <summary>
                    /// Trackable array interceptor. Inherits from Array and can notify beetle core when array changes.
                    /// </summary>
                    /// <param name="target">Initial array.</param>
                    /// <param name="object">Array's owner object.</param>
                    /// <param name="property">Property that holds this array on the object.</param>
                    /// <param name="after">Callback to call after array changed.</param>
                    this.object = object;
                    this.property = property;
                    this.after = after;

                    this.changing = new core.event(property + "ArrayChanging", this);
                    this.changed = new core.event(property + "ArrayChanged", this);

                    initialize(initial, this);
                };
                helper.inherit(ctor, Array);
                var proto = ctor.prototype;

                // we change pop behavior. Now we have the full control.
                // the technique is same for other methods.
                proto.pop = function () {
                    var items = [this[this.length - 1]];
                    // call base method
                    this.changing.notify({ added: [], removed: items });
                    var retVal = Array.prototype.pop.call(this);
                    this.after(this.object, this.property, this, items, null);
                    this.changed.notify({ added: [], removed: items });
                    return retVal;
                };

                proto.push = function (items) {
                    this.changing.notify({ added: arguments, removed: [] });
                    beforeAdd(arguments, this);
                    var retVal = Array.prototype.push.apply(this, arguments);
                    this.after(this.object, this.property, this, null, arguments);
                    this.changed.notify({ added: arguments, removed: [] });
                    return retVal;
                };

                proto.unshift = function (items) {
                    this.changing.notify({ added: arguments, removed: [] });
                    beforeAdd(arguments, this);
                    var retVal = Array.prototype.unshift.apply(this, arguments);
                    this.after(this.object, this.property, this, null, arguments);
                    this.changed.notify({ added: arguments, removed: [] });
                    return retVal;
                };

                proto.shift = function () {
                    var items = [this[0]];
                    this.changing.notify({ added: [], removed: items });
                    var retVal = Array.prototype.shift.call(this);
                    this.after(this.object, this.property, this, items, null);
                    this.changed.notify({ added: [], removed: items });
                    return retVal;
                };

                proto.splice = function (start, count) {
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

                proto.remove = function (items) {
                    var removed = [];
                    var that = this;
                    this.changing.notify({ added: [], removed: arguments });
                    helper.forEach(arguments, function (item) {
                        var index = helper.indexOf(that, item);
                        if (index >= 0) {
                            Array.prototype.splice.call(that, index, 1);
                            removed.push(item);
                        }
                    });
                    this.after(this.object, this.property, this, removed, null);
                    this.changed.notify({ added: [], removed: arguments });
                    return removed;
                };

                proto.load = function (expands, resourceName, options, successCallback, errorCallback) {
                    /// <summary>
                    /// Loads the navigation property.
                    /// </summary>
                    /// <param name="expands">Expand navigations to apply when loading navigation property.</param>
                    /// <param name="resourceName">Resource name to query entities.</param>
                    /// <param name="options">Query options.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    return this.entity.$tracker.loadNavigationProperty(this.propertyName, expands, resourceName, options, successCallback, errorCallback);
                };

                function initialize(initial, instance) {
                    // I couldn't call base constructor with parameter so I pushed all one by one.
                    if (initial)
                        helper.forEach(initial, function (item) {
                            Array.prototype.push.call(instance, item);
                        });
                }

                function beforeAdd(added, instance) {
                    var p = instance.property;
                    if (p) {
                        if (assert.isInstanceOf(p, metadata.navigationProperty))
                            helper.forEach(added, function (a) { p.checkAssign(a); });
                        else if (assert.isInstanceOf(p, metadata.dataProperty))
                            helper.forEach(added, function (a, i) { a[i] = p.handle(a); });
                        else if (settings.handleUnmappedProperties === true)
                            helper.forEach(added, function (a, i) { a[i] = core.dataTypes.handle(a); });
                    }
                }

                return ctor;
            })(),
            event: (function () {
                var ctor = function (name, publisher) {
                    /// <summary>
                    /// Event, notification and callback object.
                    /// </summary>
                    /// <param name="name">Name of the event.</param>
                    /// <param name="publisher">Event's owner.</param>
                    this.name = name;
                    this.subscribers = [];
                    this.publisher = publisher;
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    return this.name;
                };

                proto.subscribe = function (subscriber) {
                    /// <summary>
                    /// Adds given function to subscribe list. will be notified when this event triggered.
                    /// </summary>
                    /// <param name="subscriber">Subscriber function.</param>
                    if (!helper.findInArray(this.subscribers, subscriber))
                        this.subscribers.push(subscriber);
                };

                proto.unsubscribe = function (subscriber) {
                    /// <summary>
                    /// Removes given function from subscriber list.
                    /// </summary>
                    /// <param name="subscriber">Subscribed function.</param>
                    helper.removeFromArray(this.subscribers, subscriber);
                };

                proto.notify = function (data) {
                    /// <summary>
                    /// Notifies all subscribers.
                    /// </summary>
                    /// <param name="data">Data to pass to subscribe functions.</param>
                    var args = arguments;
                    helper.forEach(this.subscribers, function (subscriber) {
                        subscriber.apply(subscriber, args);
                    });
                };

                return ctor;
            })(),
            dataTypes: (function () {
                /// <summary>Defines javascript data types.</summary>

                var dateBase = (function () {
                    var ctor = function (name) {
                        /// <summary>Date base type.</summary>
                        baseTypes.dataTypeBase.call(this, 'dateBase');
                        this.name = name;
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
                    var proto = ctor.prototype;

                    proto.defaultValue = function () {
                        /// <summary>
                        /// Gets default value for type.
                        /// </summary>
                        /// <returns type="string">Default value: new Date(-6847812000000) - 01/01/1753</returns>
                        return new Date(-6847812000000);
                    };

                    proto.isValid = function (value) {
                        /// <summary>
                        /// Checks if given value is date.
                        /// </summary>
                        return Object.prototype.toString.call(value) === '[object Date]';
                    };

                    proto.handle = function (value) {
                        /// <summary>
                        /// Tries to convert given value to date.
                        /// </summary>
                        /// <returns type="">When value is of this type returns the value, if not tries to convert the value to this type, throws an error if fails.</returns>
                        if (!this.isValid(value)) {
                            var v = value;
                            value = this.tryParse(v);
                            if (!value) throwAssignError(this, v);
                        }
                        return value;
                    };

                    proto.autoValue = function () {
                        /// <summary>
                        /// Generates a new unique value for this type. Used for auto-incremented values.
                        /// </summary>
                        /// <returns type="">Unique value (Unique for this script instance).</returns>
                        return new Date();
                    };

                    proto.getRawValue = function (value) {
                        /// <summary>
                        /// Returns raw value represanting given value.
                        /// </summary>
                        return value == null ? null : settings.getDateConverter().toISOString(value);
                    };

                    proto.tryParse = function (value) {
                        /// <summary>
                        /// Tries to parse given value to date.
                        /// </summary>
                        /// <returns type="">When given value is proper Date object, otherwise null.</returns>
                        return settings.getDateConverter().parse(value);
                    };

                    proto.toODataValue = function (value) {
                        /// <summary>
                        /// Converts given value to OData format.
                        /// </summary>
                        value = this.handle(value);
                        return "datetime'" + settings.getDateConverter().toISOString(value) + "'";
                    };

                    proto.toBeetleValue = function (value) {
                        /// <summary>
                        /// Converts given value to Beetle format.
                        /// </summary>
                        value = this.handle(value);
                        return '"' + settings.getDateConverter().toISOString(value) + '"';
                    };

                    return ctor;
                })();

                var expose = {};

                /// <field>Object type.</field>
                expose.object = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'object');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);

                    return new ctor();
                })();
                /// <field>Object type.</field>
                expose.array = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'array');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
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
                /// <field>Function type.</field>
                expose.function = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'function');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);

                    return new ctor();
                })();
                /// <field>String type.</field>
                expose.string = (function () {
                    var i = 0;

                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'string');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
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
                /// <field>Guid type.</field>
                expose.guid = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'guid');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
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
                /// <field>Date type.</field>
                expose.date = (function () {
                    var ctor = function () {
                        dateBase.call(this, 'date');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, dateBase);

                    return new ctor();
                })();
                /// <field>DateTimeOffset type.</field>
                expose.dateTimeOffset = (function () {
                    var ctor = function () {
                        dateBase.call(this, 'dateTimeOffset');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, dateBase);
                    var proto = ctor.prototype;

                    proto.toODataValue = function (value) {
                        value = this.handle(value);
                        return "datetimeoffset'" + settings.getDateConverter().toISOString(value) + "'";
                    };

                    return new ctor();
                })();
                /// <field>Time type.</field>
                expose.time = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'time');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
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
                /// <field>Boolean type.</field>
                expose.boolean = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'boolean');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
                    var proto = ctor.prototype;

                    proto.defaultValue = function () {
                        return false;
                    };

                    proto.handle = function (value) {
                        if (!this.isValid(value)) {
                            if (expose.String.isValid(value)) {
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
                /// <field>Integer type. Int16, Int32, Int64 etc.</field>
                expose.int = (function () {
                    var i = 0;

                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'int');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
                    var proto = ctor.prototype;

                    proto.defaultValue = function () {
                        return 0;
                    };

                    proto.isValid = function (value) {
                        return typeof value === 'number' && value % 1 === 0;
                    };

                    proto.handle = function (value) {
                        if (typeof value !== 'number') value = Number(value);
                        if (!this.isValid(value)) throwAssignError(this, value);
                        return value;
                    };

                    proto.autoValue = function () {
                        return --i;
                    };

                    return new ctor();
                })();
                /// <field>Number type. Float, decimal etc.</field>
                expose.number = (function () {
                    var i = 0;

                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'number');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
                    var proto = ctor.prototype;

                    proto.defaultValue = function () {
                        return 0;
                    };

                    proto.isValid = function (value) {
                        return !isNaN(value) && typeof value === 'number';
                    };

                    proto.handle = function (value) {
                        if (typeof value !== 'number') value = Number(value);
                        if (!this.isValid(value)) throwAssignError(this, value);
                        return value;
                    };

                    proto.autoValue = function () {
                        return --i;
                    };

                    return new ctor();
                })();
                /// <field>Byte type. Value must be between 0 and 256.</field>
                expose.byte = (function () {
                    var i = 0;

                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'byte');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
                    var proto = ctor.prototype;

                    proto.defaultValue = function () {
                        return 0;
                    };

                    proto.isValid = function (value) {
                        return typeof value === 'number' && value % 1 === 0 && value >= 0 && value < 256;
                    };

                    proto.handle = function (value) {
                        if (typeof value !== 'number') value = Number(value);
                        if (!this.isValid(value)) throwAssignError(this, value);
                        return value;
                    };

                    proto.autoValue = function () {
                        return --i;
                    };

                    return new ctor();
                })();
                /// <field>Binary type.</field>
                expose.binary = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'binary');
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
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
                /// <field>Enum type.</field>
                expose.enum = (function () {
                    var ctor = function (enumType, enumTypeName, displayName) {
                        baseTypes.dataTypeBase.call(this, 'enum');
                        this.enumType = enumType;
                        this.enumTypeName = enumTypeName;
                        this.displayName = displayName || enumTypeName;
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
                    var proto = ctor.prototype;

                    proto.defaultValue = function () {
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
                        if (assert.isEnum(value, this.enumType))
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
                        if (assert.isArray(value)) {
                            var flags = 0;
                            helper.forEach(value, function (v) {
                                flags |= v.value;
                            });
                            return flags;
                        }
                        if (assert.isTypeOf(value, 'string')) {
                            var values = value.split(', ');
                            if (values.length == 1)
                                return enumType[value];
                            for (var i = 0; i < values.length; i++)
                                if (enumType[values[i]] == null) return null;
                            return value;
                        }
                        if (assert.isTypeOf(value, 'number')) {
                            var member = value;
                            helper.forEach(enumType.symbols(), function (s) {
                                if (s.value == value) {
                                    member = s;
                                    return;
                                }
                            });
                            return member;
                        }
                        return assert.isEnum(value, enumType) ? value : null;
                    }

                    return ctor;
                })();
                /// <field>Geometry spatial type.</field>
                expose.geometry = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'geometry');
                        this.isComplex = true;
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
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
                /// <field>Geography spatial type.</field>
                expose.geography = (function () {
                    var ctor = function () {
                        baseTypes.dataTypeBase.call(this, 'geography');
                        this.isComplex = true;
                        helper.tryFreeze(this);
                    };
                    helper.inherit(ctor, baseTypes.dataTypeBase);
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

                expose.byName = function (name) {
                    /// <summary>
                    /// Finds and returns data type by its name.
                    /// </summary>
                    var type = expose[name];
                    if (!type) throw helper.createError(i18N.unknownDataType, [name]);
                    return type;
                };
                expose.byValue = function (value) {
                    /// <summary>
                    /// Finds and returns data type for given value.
                    /// </summary>
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
                    return expose.binary;
                };
                expose.handle = function (value) {
                    /// <summary>
                    /// Finds and returns data type for given value.
                    /// </summary>
                    var v = expose.date.tryParse(value);
                    if (v != null) return v;
                    return value;
                };

                expose.toODataValue = function (value) {
                    /// <summary>
                    /// Converts given value to OData filter format value.
                    /// </summary>
                    /// <param name="value">The value.</param>
                    if (value == null) return 'null';
                    return expose.byValue(value).toODataValue(value);
                };
                expose.toBeetleValue = function (value) {
                    /// <summary>
                    /// Converts given value to OData filter format value.
                    /// </summary>
                    /// <param name="value">The value.</param>
                    if (value == null) return 'null';
                    return expose.byValue(value).toBeetleValue(value);
                };

                function throwAssignError(dataType, value) {
                    /// <summary>
                    /// Throws invalid assignment exception.
                    /// </summary>
                    throw helper.createError(i18N.assignError, [dataType.name, value], { dataType: dataType, value: value });
                }

                return expose;
            })(),
            validator: (function () {
                var ctor = function (name, func, message, args) {
                    /// <summary>
                    /// Data and navigation property validators.
                    /// </summary>
                    /// <param name="name">Validator name.</param>
                    /// <param name="func">Validator javascript implementation.</param>
                    /// <param name="message">Error message.</param>
                    /// <param name="args">Validator specific arguments.</param>
                    this.name = name;
                    this.func = func;
                    this.message = message;
                    this.args = args;
                    helper.tryFreeze(this);
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    var args = [];
                    if (this.args)
                        for (var p in this.args) {
                            args.push(p + ': ' + this.args[p]);
                        }
                    return args.length > 0 ? this.name + ' (' + args.join(', ') + ')' : this.name;
                };

                proto.validate = function (value, entity) {
                    /// <summary>
                    /// Validates given parameters against validation function.
                    /// </summary>
                    /// <param name="value">Value to validate.</param>
                    return this.func(value, entity) == true ? null : this.message;
                };

                ctor.byCode = function (code, args, message, messageResourceName, displayName, displayNameResourceName) {
                    /// <summary>
                    /// Finds the validator by given code and initializes it with given arguments.
                    /// </summary>
                    /// <param name="code">Validator code.</param>
                    /// <param name="args">Validator arguments.</param>
                    /// <param name="message">Validation message.</param>
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
                    /// <summary>
                    /// Required validator, value must be provided to pass its test.
                    /// </summary>
                    /// <param name="allowEmptyStrings">Should we treat empty strings as 'no value' or not.</param>
                    var func = function (value) {
                        if (value == null) return false;
                        if (assert.isTypeOf(value, 'string') && !allowEmptyStrings && value == '') return false;
                        return true;
                    };
                    message = helper.formatString(message || i18N.requiredError, displayName);
                    return new ctor('Required', func, message, { allowEmptyStrings: allowEmptyStrings });
                };
                ctor.stringLength = function (min, max, message, displayName) {
                    /// <summary>
                    /// String Length validator.
                    /// </summary>
                    /// <param name="min">Minimum required string length.</param>
                    /// <param name="max">Maximum allowed string length.</param>
                    var func = function (value) {
                        if (!min && !max) return true;
                        if (!assert.isNotEmptyString(value)) return false;
                        if (min && value.length < min) return false;
                        if (max && value.length > max) return false;
                        return true;
                    };
                    message = helper.formatString(message || i18N.stringLengthError, displayName, min, max);
                    return new ctor('StringLength', func, message, { min: min, max: max });
                };
                ctor.maxLength = function (length, message, displayName) {
                    /// <summary>
                    /// Maximum length validator, can be used with strings and arrays.
                    /// </summary>
                    /// <param name="length">Maximum length.</param>
                    var func = function (value) {
                        if (value == null) return true;
                        if (length && value.length > length) return false;
                        return true;
                    };
                    message = helper.formatString(message || i18N.maxLenError, displayName, length);
                    return new ctor('MaxLength', func, message, { length: length });
                };
                ctor.minLength = function (length, message, displayName) {
                    /// <summary>
                    /// Minimum length validator, can be used with strings and arrays.
                    /// </summary>
                    /// <param name="length">Minimum length.</param>
                    var func = function (value) {
                        if (value == null) return false;
                        if (length && value.length < length) return false;
                        return true;
                    };
                    message = helper.formatString(message || i18N.minLenError, displayName, length);
                    return new ctor('MinLength', func, message, { length: length });
                };
                ctor.range = function (min, max, message, displayName) {
                    /// <summary>
                    /// Number range validator.
                    /// </summary>
                    /// <param name="min">Minimum value.</param>
                    /// <param name="max">Maximum value.</param>
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
                    /// <summary>
                    /// Checks if given value is a valid time.
                    /// </summary>
                    if (assert.isTypeOf(pattern, 'string')) pattern = new RegExp(pattern);
                    return regex('RegularExpression', pattern, message, displayName);
                };
                ctor.emailAddress = function (message, displayName) {
                    /// <summary>
                    /// Checks if given value is a valid email address.
                    /// </summary>
                    return regex('EmailAddress', /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/, message, displayName);
                };
                ctor.creditCard = function (message, displayName) {
                    /// <summary>
                    /// Checks if given value is a valid email adress.
                    /// </summary>
                    return regex('CreditCard', /^((4\d{3})|(5[1-5]\d{2})|(6011)|(3[68]\d{2})|(30[012345]\d))[ -]?(\d{4})[ -]?(\d{4})[ -]?(\d{4}|3[4,7]\d{13})$/, message, displayName);
                };
                ctor.url = function (message, displayName) {
                    /// <summary>
                    /// Checks if given value is a valid url.
                    /// </summary>
                    return regex('Url', /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/, message, displayName);
                };
                ctor.phone = function (message, displayName) {
                    /// <summary>
                    /// Checks if given value is a valid phone number.
                    /// </summary>
                    return regex('Phone', /^(?!.*-.*-.*-)(?=(?:\d{8,10}$)|(?:(?=.{9,11}$)[^-]*-[^-]*$)|(?:(?=.{10,12}$)[^-]*-[^-]*-[^-]*$)  )[\d-]+$/, message, displayName);
                };
                ctor.postalCode = function (message, displayName) {
                    /// <summary>
                    /// Checks if given value is a valid postal code (U.S and Canada only).
                    /// </summary>
                    return regex('PostalCode', /^\d{5}([\-]?\d{4})?$/, message, displayName);
                };
                ctor.time = function (message, displayName) {
                    /// <summary>
                    /// Checks if given value is a valid time.
                    /// </summary>
                    return regex('Time', /^([01]?\d|2[0-3])(((:[0-5]?\d){2}(\.\d{1,3}){0,1})|(:[0-5]?\d){0,2})?$/, message, displayName);
                };

                function regex(name, pattern, message, displayName) {
                    /// <summary>
                    /// Helper method to create regex validators.
                    /// </summary>
                    /// <param name="name">Validator name.</param>
                    /// <param name="pattern">Regex pattern.</param>
                    var func = function (value) {
                        if (value == null) return false;
                        return pattern.test(value);
                    };
                    message = helper.formatString(message || i18N.invalidValue, displayName);
                    return new ctor(name, func, message, { pattern: pattern });
                }

                ctor.compare = function (property, message, displayName) {
                    /// <summary>
                    /// Compares value with given property, both must be equal.
                    /// </summary>
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
            entityContainer: (function () {
                var entitySet = (function () {
                    var c = function (type) {
                        /// <summary>
                        /// We hold every entity type (which has key) in seperate list.
                        /// But for a derived type we create entries for each base type increase performance for inheritance scenarios.
                        /// Example:
                        ///     Lets say we have this hierarchy;
                        ///     Customer -> Company -> Entity -> EntityBase
                        ///     When we add a customer three more entries will ve created (for Company, Entity and EntityBase)
                        ///     So when we search a Company this Customer will be in the list.
                        /// </summary>
                        /// <param name="type">Entity type for the set.</param>
                        this.typeName = type.name;
                        this.keyIndex = [];
                        helper.tryFreeze(this);
                    };
                    var p = c.prototype;

                    p.toString = function () {
                        /// <summary>
                        /// String representation of the object.
                        /// </summary>
                        return this.typeName + ': ' + this.keyIndex.length;
                    };

                    p.push = function (key, entity) {
                        /// <summary>
                        /// Adds given entity to proper location in the index table using its key.
                        /// </summary>
                        /// <param name="key">The key.</param>
                        /// <param name="entity">The entity.</param>
                        // find proper location
                        var location = findLocation(key, this.keyIndex);
                        // insert new index
                        this.keyIndex.splice(location, 0, { key: key, entity: entity });
                    };

                    p.remove = function (key) {
                        /// <summary>
                        /// Removes item with given key from index table.
                        /// </summary>
                        /// <param name="key">The key.</param>
                        // find the index entry.
                        var index = getIndex(key, this.keyIndex);
                        this.keyIndex.splice(index, 1);
                    };

                    p.getEntity = function (key) {
                        /// <summary>
                        /// Finds entity with given key.
                        /// </summary>
                        /// <param name="key">The key.</param>
                        /// <returns type="">Entity if found, otherwise null.</returns>
                        // find the index entry
                        var entry = getEntry(key, this.keyIndex);
                        if (entry) return entry.entity;
                        return null;
                    };

                    p.getRelations = function (fk, navProperty) {
                        /// <summary>
                        /// Gets entities which has given foreign key for given navigation property.
                        /// </summary>
                        /// <param name="fk">The foreign key.</param>
                        /// <param name="navProperty">The navigation property.</param>
                        // get other side of the navigation property.
                        var inverse = navProperty.inverse;
                        // if there is no other side, return null.
                        if (!inverse) return null;
                        var retVal = [];
                        // copy all items has same foreign key for given navigation propery to a new array.
                        for (var i = 0; i < this.keyIndex.length; i++) {
                            var ki = this.keyIndex[i];
                            if (ki.entity.$tracker.foreignKey(inverse) === fk)
                                retVal.push(ki.entity);
                        }
                        return retVal;
                    };

                    p.relocateKey = function (entity, oldKey, newKey) {
                        /// <summary>
                        /// After an entity's key changed we need to rebuild the index table.
                        /// </summary>
                        /// <param name="entity">The entity.</param>
                        /// <param name="oldKey">The old key.</param>
                        /// <param name="newKey">The new key.</param>
                        // if there is an old index, remove it.
                        this.remove(oldKey);
                        // if new key has a value, add it to index tables.
                        if (newKey)
                            this.push(newKey, entity);
                    };

                    p.getEntities = function () {
                        /// <summary>
                        /// Returns entity collection of the set.
                        /// </summary>
                        var retVal = [];
                        helper.forEach(this.keyIndex, function (ki) {
                            retVal.push(ki.entity);
                        });
                        return retVal;
                    };

                    function getEntry(key, keyIndex) {
                        /// <summary>
                        /// Finds given key in the index table.
                        /// </summary>
                        /// <param name="key">The index.</param>
                        /// <param name="keyIndex">The key index table.</param>
                        /// <returns type="">Key index entry if found, otherwise null.</returns>
                        var index = getIndex(key, keyIndex);
                        return index > -1 ? keyIndex[index] : null;
                    }

                    function getIndex(key, keyIndex) {
                        /// <summary>
                        /// Finds given key's index in the index table.
                        /// </summary>
                        /// <param name="key">The index.</param>
                        /// <param name="keyIndex">The key index table.</param>
                        /// <returns type="">Key index entry if found, otherwise null.</returns>
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
                        /// <summary>
                        /// Finds proper location to insert the new key index entry.
                        /// </summary>
                        /// <param name="key">The key.</param>
                        /// <param name="keyIndex">The key index table.</param>
                        var i = 0;
                        while (i < keyIndex.length && key > keyIndex[i].key) i++;
                        return i;
                    }

                    return c;
                })();

                var ctor = function () {
                    /// <summary>
                    /// Holds entity list and key-entity mappings for types.
                    /// Seperate key-entity lists are generated for every type and an entity stored in list of every type in its inheritance chain.
                    /// </summary>
                    // To hold keyed entities.
                    this.entitySets = [];
                    // To hold all entities.
                    this.allEntities = [];
                    helper.tryFreeze(this);
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.allEntities.length;
                };

                proto.push = function (entity) {
                    /// <summary>
                    /// Adds given entity to each entity set in the inheritance hierarchy.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    // add entity to entities array.
                    this.allEntities.push(entity);
                    var tracker = entity.$tracker;
                    var type = tracker.entityType;
                    // get entity key
                    var key = tracker.key;
                    if (key) {
                        while (type) {
                            // add this key index entry to all sets for inheritance hierarchy
                            var es = this.findEntitySet(type);
                            if (!es) es = createEntitySet(type, this.entitySets);
                            es.push(key, entity);
                            type = type.baseType;
                        }
                    }
                };

                proto.remove = function (entity) {
                    /// <summary>
                    /// Removes given entity from each entity set in the inheritance hierarchy.
                    /// </summary>
                    /// <param name="key">The key.</param>
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

                proto.getEntities = function () {
                    /// <summary>
                    /// Gets cached entity list.
                    /// </summary>
                    return this.allEntities;
                };

                proto.getEntityByKey = function (key, type) {
                    /// <summary>
                    /// Finds entity with given key by searching entity type's entity set.
                    /// </summary>
                    /// <param name="key">The key.</param>
                    /// <param name="type">The entity type.</param>
                    if (!key) return null;
                    // get entity set for type
                    var es = this.findEntitySet(type);
                    if (!es) return null;
                    return es.getEntity(key);
                };

                proto.getRelations = function (entity, navProperty) {
                    /// <summary>
                    /// Gets entities which has given foreign key for given navigation property by searching navigation's entity type's set.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="navProperty">The navigation property.</param>
                    // Example: We may want OrderDetails for Order
                    //  So entity: Order, navProperty: npOrderDetails
                    //  Other side: npOrder (from OrderDetail's side)
                    //  key: OrderId
                    //  es: OrderDetailEntitySet
                    //  fk: OrderDetail's OrderId
                    //  result: entity set tries to find all OrderDetails with given OrderId

                    // get other side of navigation
                    var np = navProperty.inverse;
                    if (!np) return null;
                    var type = navProperty.entityType;
                    var key = entity.$tracker.key;
                    if (!key) return null;
                    // find related entity set
                    var es = this.findEntitySet(type);
                    // request relation from entity set
                    if (es) return es.getRelations(key, navProperty);
                    return null;
                };

                proto.relocateKey = function (entity, oldKey, newKey) {
                    /// <summary>
                    /// After an entity's key changed we need to rebuild the index tables for each entity set in the inheritance hiearachy.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="oldKey">The old key.</param>
                    /// <param name="newKey">The new key.</param>
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

                proto.getChanges = function () {
                    /// <summary>
                    /// Gets all changed entities from cache (Modified, Added, Deleted)
                    /// </summary>
                    return helper.filterArray(this.allEntities, function (item) {
                        return !(item.$tracker.entityType.isComplexType && item.$tracker.owners.length > 0) && item.$tracker.isChanged();
                    });
                };

                proto.count = function () {
                    /// <summary>
                    /// Returns cached entity count.
                    /// </summary>
                    return this.allEntities.length;
                };

                proto.findEntitySet = function (type) {
                    /// <summary>
                    /// Finds entity set for given type in the cache.
                    /// </summary>
                    /// <param name="type">The entity type.</param>
                    /// <returns type="">Entity set if found, otherwise null.</returns>
                    return helper.findInArray(this.entitySets, type.name, 'typeName');
                };

                function createEntitySet(type, entitySets) {
                    /// <summary>
                    /// Creates entity set for given type.
                    /// </summary>
                    /// <param name="type">The entity type.</param>
                    /// <param name="entitySets">Cached entity sets.</param>
                    var es = new entitySet(type);
                    entitySets.push(es);
                    return es;
                }

                return ctor;
            })(),
            entityTracker: (function () {
                var ctor = function (entity, type, op) {
                    /// <summary>
                    /// Entity tracker class. Tracks changes made on entities.
                    /// When it starts to track an entity first thing it converts entity to observable.
                    /// </summary>
                    delete entity.$type;
                    delete entity.$id;
                    initialize(entity, type, op || settings.getObservableProvider(), this);
                    // Convert raw entity to observable.
                    toObservable(entity, type, this);
                    callIzer(type, entity);
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return 'EntityTracker: ' + this.entityType.shortName + ', key: ' + this.key;
                };

                proto.setManagerInfo = function (manager) {
                    /// <summary>
                    /// Manager setter, it can only be set with entityManager derived object and because of this class is internal, 
                    /// it cannot be set from outside. 
                    /// </summary>
                    /// <param name="manager">Entity manager.</param>
                    if (this.manager) throw helper.createError(i18N.entityAlreadyBeingTracked, { otherManager: this.manager });
                    // Check if argument is an instance of entityManager.
                    helper.assertPrm(manager, 'manager').isInstanceOf(core.entityManager).check();
                    this.manager = manager;
                };

                proto.isChanged = function () {
                    /// <summary>
                    /// Gets if entity is changed.
                    /// </summary>
                    return this.entityState === enums.entityStates.Added || this.entityState === enums.entityStates.Deleted || this.entityState === enums.entityStates.Modified;
                };

                proto.toAdded = function () {
                    /// <summary>
                    /// Change entity's state to 'Added'
                    /// </summary>
                    if (this.entityState == enums.entityStates.Added) return;
                    var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Added, newChanged: !this.isChanged() };
                    this.entityState = enums.entityStates.Added;
                    this.entityStateChanged.notify(obj);
                };

                proto.toModified = function () {
                    /// <summary>
                    /// Change entity's state to 'Modified'
                    /// </summary>
                    if (this.entityState == enums.entityStates.Modified) return;
                    var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Modified, newChanged: !this.isChanged() };
                    this.entityState = enums.entityStates.Modified;
                    this.entityStateChanged.notify(obj);
                };

                proto.toDeleted = function () {
                    /// <summary>
                    /// Change entity's state to 'Deleted'
                    /// </summary>
                    if (this.entityState == enums.entityStates.Deleted) return;
                    var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Deleted, newChanged: !this.isChanged() };
                    this.entityState = enums.entityStates.Deleted;
                    this.entityStateChanged.notify(obj);
                };

                proto.toUnchanged = function () {
                    /// <summary>
                    /// Change entity's state to 'Unchanged'
                    /// </summary>
                    if (this.entityState == enums.entityStates.Unchanged) return;
                    var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Unchanged, newUnchanged: this.isChanged() };
                    this.originalValues.length = 0;
                    this.changedValues.length = 0;
                    this.entityState = enums.entityStates.Unchanged;
                    this.entityStateChanged.notify(obj);
                };

                proto.toDetached = function () {
                    /// <summary>
                    /// Change entity's state to 'Detached'
                    /// </summary>
                    if (this.entityState == enums.entityStates.Detached) return;
                    var obj = { entity: this.entity, oldState: this.entityState, newState: enums.entityStates.Detached, newUnchanged: this.isChanged() };
                    this.entityState = enums.entityStates.Detached;
                    this.entityStateChanged.notify(obj);
                };

                proto.undoChanges = function () {
                    /// <summary>
                    /// Returns entity's values to last accepted state.
                    /// </summary>
                    // Undo every property change.
                    var that = this;
                    helper.forEach(this.changedValues, function (cv) {
                        that.setValue(cv.p, cv.v);
                    });
                    this.changedValues.length = 0;
                };

                proto.acceptChanges = function () {
                    /// <summary>
                    /// Accept all changes made to this entity.
                    /// </summary>
                    this.changedValues.length = 0;
                };

                proto.getValue = function (property) {
                    /// <summary>
                    /// Gets internal value of the property from observable entity
                    /// </summary>
                    /// <param name="property">The property</param>
                    return this.observableProvider.getValue(this.entity, property);
                };

                proto.setValue = function (property, value) {
                    /// <summary>
                    /// Sets internal value of the property of observable entity
                    /// </summary>
                    /// <param name="property">The property</param>
                    /// <param name="value">The value</param>
                    this.observableProvider.setValue(this.entity, property, value);
                };

                proto.getOriginalValue = function(property) {
                    /// <summary>
                    /// Gets original value for property.
                    /// </summary>
                    /// <param name="property">The property</param>
                    var ov = helper.findInArray(this.originalValues, property, 'p');
                    return ov ? ov.v : this.getValue(property);
                };

                proto.foreignKey = function (navProperty) {
                    /// <summary>
                    /// Get foreign key value for this navigation property.
                    /// </summary>
                    /// <param name="navProperty">The navigation property.</param>
                    /// <returns type="">Comma separated foreign keys.</returns>
                    var type = navProperty.entityType;
                    if (type.keys.length == 0) return null;
                    var retVal = [];
                    for (var i = 0; i < type.keys.length; i++) {
                        var key = type.keys[i];
                        var fk = navProperty.foreignKeys[i];
                        if (fk == null) return null;
                        var fkName = fk.name;
                        var value = this.getValue(fkName);
                        if (value == null) return null;
                        if (key.dataType.name == 'guid')
                            value = value.toLowerCase();
                        retVal.push(value);
                    }
                    return retVal.join(',');
                };

                proto.createLoadQuery = function (navPropName, resourceName) {
                    /// <summary>
                    /// Creates a query that can load this navigation property.
                    /// </summary>
                    /// <param name="navPropName">The navigation property name.</param>
                    /// <param name="resourceName">The resource (query name) for entity type.</param>
                    var navProp = helper.findInArray(this.entityType.navigationProperties, navPropName, 'name');
                    return createLoadQuery(navProp, navPropName, resourceName, this);
                };

                proto.loadNavigationProperty = function (navPropName, expands, resourceName, options, successCallback, errorCallback) {
                    /// <summary>
                    /// Loads given navigation property of the entity.
                    /// </summary>
                    /// <param name="navPropName">The navigation property name.</param>
                    /// <param name="expands">Expand navigations to apply when loading navigation property.</param>
                    /// <param name="resourceName">Resource name to query entities.</param>
                    /// <param name="options">Query options.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
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

                proto.validate = function () {
                    /// <summary>
                    /// Validates entity against metadata data annotation validations.
                    /// </summary>
                    if (this.entityState == enums.entityStates.Deleted)
                        this.validationErrors = [];
                    else
                        mergeErrors(this.entityType.validate(this.entity), this);
                    return this.validationErrors;
                };

                proto.toRaw = function (includeNavigations) {
                    /// <summary>
                    /// Creates a raw javascript object representing this entity.
                    /// </summary>
                    // get entity information.
                    var type = this.entityType;
                    var data = {};
                    var that = this;
                    if (type.hasMetadata) {
                        helper.forEach(type.dataProperties, function (dp) {
                            var v = that.getValue(dp.name);
                            if (v == null || !v.$tracker)
                                data[dp.name] = dp.dataType.getRawValue(v);
                            else if (includeNavigations == true || v.$tracker.entityType.isComplexType)
                                data[dp.name] = v.$tracker.toRaw(includeNavigations);
                        });
                        if (includeNavigations == true) {
                            helper.forEach(type.navigationProperties, function (np) {
                                var v = that.getValue(np.name);
                                if (v == null)
                                    data[np.name] = null;
                                else if (assert.isArray(v))
                                    helper.forEach(v, function (item) {
                                        if (item == null || !item.$tracker)
                                            data[p].push(item);
                                        else
                                            data[p].push(item.$tracker.toRaw(true));
                                    });
                                else
                                    data[np.name] = v.$tracker.toRaw(true);
                            });
                        }
                    }
                    // process unmapped properties
                    helper.forEach(type.properties, function (p) {
                        var v = that.getValue(p);
                        // if value is array enumerate each item
                        if (assert.isArray(v)) {
                            // create new array property in return data.
                            data[p] = [];
                            helper.forEach(v, function (item) {
                                if (item == null || !item.$tracker)
                                    data[p].push(item);
                                else if (includeNavigations == true)
                                    data[p].push(item.$tracker.toRaw(true));
                            });
                        } else {
                            if (v == null || !v.$tracker)
                                data[p] = v;
                            else if (includeNavigations == true || v.$tracker.entityType.isComplexType)
                                data[p] = v.$tracker.toRaw(includeNavigations);
                        }
                    });
                    return data;
                };

                ctor.toEntity = function (result, type, op) {
                    /// <summary>
                    /// Starts tracking the entity, this is a static method.
                    /// </summary>
                    /// <param name="result">The raw result.</param>
                    /// <param name="type">The entity type.</param>
                    /// <param name="op">Observable provider instance.</param>
                    // Crate entity tracker with this static method.
                    return new core.entityTracker(result, type, op).entity;
                };

                function initialize(entity, type, op, instance) {
                    /// <summary>
                    /// Initializes given instance.
                    /// </summary>
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
                    instance.validationErrorsChanged = new core.event('validationErrorsChanged', instance);
                    instance.entityStateChanged = new core.event('entityStateChanged', instance);
                    instance.propertyChanged = new core.event('propertyChanged', instance);
                    instance.arrayChanged = new core.event('arrayChanged', instance);
                    // get key's initial value.
                    if (type.hasMetadata)
                        instance.key = getKey(instance);
                }

                function toObservable(entity, type, tracker) {
                    /// <summary>
                    /// Converts raw entity to observable with assigning callbacks.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="type">The entity type.</param>
                    /// <param name="tracker">Entity tracker instance.</param>
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
                    /// <summary>
                    /// Called after entity started to being tracked.
                    /// </summary>
                    /// <param name="type">Type of the entity.</param>
                    /// <param name="entity">The entity.</param>
                    if (type.baseType) callIzer(type.baseType, entity);
                    if (type.initializer)
                        type.initializer.call(entity, entity);
                }

                function getKey(tracker, p, v) {
                    /// <summary>
                    /// Get the key for the tracked entity.
                    /// </summary>
                    /// <param name="tracker">The entity tracker.</param>
                    /// <param name="p">The property.</param>
                    /// <param name="v">The value.</param>
                    /// <returns type="">Comma separated keys.</returns>
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
                    /// <summary>
                    /// Creates a query to load a navigation property.
                    /// </summary>
                    /// <param name="navProp">Navigation property.</param>
                    /// <param name="navPropName">Name of the navigation property (to use in error message).</param>
                    /// <param name="resourceName">Resource (query name) for the entity type of the navigation property.</param>
                    /// <param name="tracker">Tracker instance.</param>
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
                            query = query.where(property.name, enums.filterOps.Equals, value);
                        });
                    } else { // if navigation is plural use the entity's key to load related entities via foreign key
                        var inverse = navProp.inverse;
                        if (!inverse) throw helper.createError(i18N.pluralNeedsInverse, { property: navProp });
                        helper.forEach(inverse.foreignKeys, function (fk, i) {
                            var property = fk.name;
                            var value = tracker.getValue(inverse.entityType.keys[i]);
                            query = query.where(property, enums.filterOps.Equals, value);
                        });
                    }
                    return query;
                }

                function propertyChange(entity, property, accessor, newValue) {
                    /// <summary>
                    /// Fires before property changed (for objects which do not have metadata).
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="property">The property.</param>
                    /// <param name="accessor">Property value accessor.</param>
                    /// <param name="newValue">New value.</param>
                    var tracker = entity.$tracker;
                    var oldValue = accessor();
                    if (oldValue == newValue) return;

                    if (settings.handleUnmappedProperties == true)
                        newValue = core.dataTypes.handle(newValue);

                    accessor(newValue);

                    // mark this entity as modified.
                    if (tracker.manager)
                        setModified(entity, property, oldValue, tracker);
                    tracker.propertyChanged.notify({ entity: entity, property: property, oldValue: oldValue, newValue: newValue });
                }

                function arrayChange(entity, property, items, removedItems, addedItems) {
                    /// <summary>
                    /// Fires after array changed (for objects which do not have metadata).
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="property">Data property.</param>
                    /// <param name="items">Current items.</param>
                    /// <param name="removedItems">Removed items.</param>
                    /// <param name="addedItems">Added items.</param>
                    var tracker = entity.$tracker;
                    if (tracker.manager)
                        setModified(entity, null, null, tracker);
                    tracker.arrayChanged.notify({ entity: entity, property: property, items: items, removedItems: removedItems, addedItems: addedItems });
                }

                function dataPropertyChange(entity, property, accessor, newValue) {
                    /// <summary>
                    /// Fires before data property changed.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="property">The property.</param>
                    /// <param name="accessor">Property value accessor.</param>
                    /// <param name="newValue">New value.</param>
                    var oldValue = accessor();
                    if (oldValue == newValue) return;

                    var tracker = entity.$tracker;
                    // check new value's type and convert if necessary.
                    newValue = property.handle(newValue);

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

                    // mark this entity as modified.
                    if (tracker.manager)
                        setModified(entity, property.name, property.dataType.getRawValue(oldValue), tracker);
                    else if (tracker.entityType.isComplexType)
                        helper.forEach(tracker.owners, function (owner) {
                            setModified(owner.entity, owner.property.name + '.' + property.name, newValue, owner.entity.$tracker);
                        });

                    // set new value
                    accessor(newValue);

                    // validate data property.
                    if (settings.liveValidate === true)
                        mergeErrors(property.validate(entity), tracker, property);
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
                        var autoFixScalar = settings.autoFixScalar;
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
                                    if (tracker.manager && autoFixScalar)
                                        fkEntity = tracker.manager.getEntityByKey(fk, np.entityType);

                                    if (fkEntity)
                                        tracker.setValue(np.name, fkEntity); // if found set as new value.
                                    else if (oldFkEntity)
                                        tracker.setValue(np.name, new core.valueNotifyWrapper(null)); // if not found set navigation to null but preserve foreign key.
                                } else
                                    tracker.setValue(np.name, null); // if foreign key is null set navigation to null.
                            }
                        });
                    }
                }

                function scalarNavigationPropertyChange(entity, property, accessor, newValue) {
                    /// <summary>
                    /// Fires before scalar navigation property changed.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="property">The property.</param>
                    /// <param name="accessor">Property value accessor.</param>
                    /// <param name="newValue">New value.</param>
                    var tracker = entity.$tracker;
                    var noCallback = false;
                    if (assert.isInstanceOf(newValue, core.valueNotifyWrapper)) {
                        noCallback = true;
                        newValue = newValue.value;
                    }

                    var oldValue = accessor();
                    if (oldValue == newValue) return;

                    // check if this navigation property can be set with newValue.
                    property.checkAssign(newValue);

                    accessor(newValue);

                    // validate navigation property.
                    if (settings.liveValidate === true)
                        mergeErrors(property.validate(entity), tracker, property);
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
                        if (!noCallback) {
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
                    /// <summary>
                    /// Fires after plural navigation property changed.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="property">Data property.</param>
                    /// <param name="items">Current items.</param>
                    /// <param name="removedItems">Removed items.</param>
                    /// <param name="addedItems">Added items.</param>
                    var tracker = entity.$tracker;
                    // validate navigation property.
                    if (settings.liveValidate === true)
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
                }

                function arraySet(entity, items, newItems, property) {
                    /// <summary>
                    /// Fires after setting an array property with new array.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="items">Current items.</param>
                    /// <param name="newItems">New array parameter.</param>
                    /// <param name="property">Name of the array property.</param>
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
                    if (behaviour == enums.arraySetBehaviour.Append) {
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
                    /// <summary>
                    /// Update navigations' foreign keys to match with new key.
                    /// </summary>
                    var tracker = entity.$tracker;
                    // For each navigation property.
                    helper.forEach(tracker.entityType.navigationProperties, function (np) {
                        // If property has inverse navigation defined.
                        if (np.inverse) {
                            var inverse = np.inverse;
                            if (np.isScalar) {
                                var value = tracker.getValue(np.name);
                                if (value)
                                    helper.setForeignKeys(value, inverse, entity);
                            } else {
                                // Get the current items.
                                var array = tracker.getValue(np.name);
                                if (array && array.length > 0) {
                                    // Set foreign keys to new value.
                                    helper.forEach(array, function (item) {
                                        helper.setForeignKeys(item, inverse, entity);
                                    });
                                }
                            }
                        }
                    });
                }

                function processEntity(entity, manager) {
                    /// <summary>
                    /// Attaches the entity (which is just set to a scalar or added to a plural navigation property) to entity manager if it is in detached state.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="manager">Entity manager instance.</param>
                    if (!entity || !manager) return;
                    if (entity.$tracker.entityType.isComplexType || manager.isInManager(entity)) return;
                    if (entity.$tracker.manager)
                        throw helper.createError(i18N.entityAlreadyBeingTracked, null, { entity: entity, manager: manager });
                    // add to the manager.
                    manager.addEntity(entity);
                }

                function setModified(entity, property, value, tracker) {
                    /// <summary>
                    /// Marks entity as Modified (when necessary) and sets original value (when necessary)
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="property">The modified property.</param>
                    /// <param name="value">New value.</param>
                    /// <param name="tracker">Entity tracker instance.</param>
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
                    /// <summary>
                    /// Reserve original value of the field after its changed.
                    /// </summary>
                    /// <param name="property">The property.</param>
                    /// <param name="value">The original value.</param>
                    /// <param name="originalValues">Original values array.</param>
                    /// <param name="changedValues">Changed values array.</param>
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
                    /// <summary>
                    /// Merges old and new errors and make callback.
                    /// </summary>
                    /// <param name="newErrors">New validation errors</param>
                    /// <param name="instance">Tracker instance.</param>
                    /// <param name="property">Validated property.</param>
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

                return ctor;
            })(),
            entityManager: (function () {
                // static error message.
                var ctor = function (args) {
                    /// <summary>
                    /// Entity manager class. All operations must be made using manager to properly tracked.
                    /// </summary>
                    /// <param name="args">
                    /// Possible usages:
                    ///  [Service Uri - WebApi will be used] or [Service Instance];
                    ///  (optional) [Metadata Instance] or [Metadata String] or [true - false (default) - when true no metadata will be used, no auto relation fix]
                    /// </param>
                    initialize(arguments, this);
                };
                var proto = ctor.prototype;

                proto.toString = function () {
                    /// <summary>
                    /// String representation of the object.
                    /// </summary>
                    return this.dataService.toString() + ', ' +
                        i18N.pendingChanges + ': ' + this.pendingChangeCount + ', ' +
                        i18N.validationErrors + ': ' + this.validationErrors.length;
                };

                proto.getEntityType = function (shortName) {
                    /// <summary>
                    /// Gets entity type by its short name from data service.
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    return this.dataService.getEntityType(shortName);
                };

                proto.createQuery = function (resourceName, shortName) {
                    /// <summary>
                    /// Create entity query.
                    /// </summary>
                    /// <param name="resourceName">The resource to query (service operation name, not entity type name).</param>
                    /// <param name="shortName">Entity type short name.</param>
                    return this.dataService.createQuery(resourceName, shortName, this);
                };

                proto.createEntityQuery = function (shortName, resourceName) {
                    /// <summary>
                    /// Create entity query.
                    /// </summary>
                    /// <param name="shortName">Entity type short name (mandatory).</param>
                    /// <param name="resourceName">The resource to query (service operation name, not entity type name).</param>
                    return this.dataService.createEntityQuery(shortName, resourceName, this);
                };

                proto.registerCtor = function (shortName, constructor, initializer) {
                    /// <summary>
                    /// Register constructor and initializer (optional) for given type.
                    ///  Constructor is called right after the entity object is generated.
                    ///  Initializer is called after entity started to being tracked (properties converted to observable).
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    /// <param name="constructor">Constructor function.</param>
                    /// <param name="initializer">Initializer function.</param>
                    this.dataService.registerCtor(shortName, constructor, initializer);
                };

                proto.createEntity = function (shortName, initialValues) {
                    /// <summary>
                    /// Create the entity by its type's short name.
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    var result = this.dataService.createEntity(shortName, initialValues);
                    var results = [result];
                    mergeEntities(results, null, enums.mergeStrategy.ThrowError, enums.entityStates.Added, this);
                    return result;
                };

                proto.createDetachedEntity = function (shortName, initialValues) {
                    /// <summary>
                    /// Create the entity by its type's short name but do not add to manager.
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    return this.dataService.createEntity(shortName, initialValues);
                };

                proto.createRawEntity = function (shortName, initialValues) {
                    /// <summary>
                    /// Create the entity by its type's short name but do not convert to observable and do not add to manager.
                    /// </summary>
                    /// <param name="shortName">Entity type short name.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    return this.dataService.createRawEntity(shortName, initialValues);
                };

                proto.createEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                    /// <summary>
                    /// Request server to create entity. Server should handle this.
                    /// </summary>
                    /// <param name="typeName">The entity typa name.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    /// <returns type="">Returns promise if supported.</returns>
                    return createAsync(typeName, initialValues, options, successCallback, errorCallback, this);
                };

                proto.createRawEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                    /// <summary>
                    /// Request server to create entity. Server should handle this.
                    /// </summary>
                    /// <param name="typeName">The entity typa name.</param>
                    /// <param name="initialValues">Entity initial values.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    /// <returns type="">Returns promise if supported.</returns>
                    if (!options) options = { makeObservable: false };
                    else options.makeObservable = false;
                    return createAsync(typeName, initialValues, options, successCallback, errorCallback, this);
                };

                function createAsync(typeName, initialValues, options, successCallback, errorCallback, instance) {
                    // Create promise if possible.
                    var pp = (options && options.async == false) ? null : settings.getPromiseProvider();
                    var d = null;
                    if (pp) d = pp.deferred();

                    var makeObservable = options && options.makeObservable;
                    if (makeObservable == null) makeObservable = true;
                    var retVal = null;
                    instance.dataService.createEntityAsync(
                        typeName, initialValues, options,
                        function (entity, allEntities) {
                            try {
                                var isSingle = false;
                                if (!assert.isArray(entity)) {
                                    entity = [entity];
                                    isSingle = true;
                                }
                                if (makeObservable) // Merge incoming entities.
                                    mergeEntities(entity, allEntities, enums.mergeStrategy.ThrowError, enums.entityStates.Added, instance);
                                // If only one entity returned (most likely) return it, otherwise return the array.
                                if (isSingle)
                                    entity = entity[0];
                                onSuccess(successCallback, pp, d, entity);
                                if (!pp) retVal = entity;
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

                proto.executeQuery = function (query, options, successCallback, errorCallback) {
                    /// <summary>
                    /// Execute the query.
                    /// 
                    ///  Query options;
                    ///  merge: Merge strategy
                    ///  execution: Execution strategy
                    ///  autoFixScalar: Scalar navigations will be fixed for queried entities (e.g: if OrderDetail has OrderId, Order will be searched in cache)
                    ///  autoFixPlural: Plural navigations will be fixed for queried entities (e.g: Order's OrderDetails will be searched in cache)
                    ///  varContext: Variables used in the query (e.g: manager.executeQuery(query.where(Age > @age), {varContext: {age: 20}}))
                    ///  isCaseSensitive: When true string comparisons will be case sensitive
                    ///  ignoreWhiteSpaces: When true before comparison strings will be trimmed
                    ///  handleUnmappedProperties: If a property is not found in metadata, try to convert this value (e.g: '2013-01-01 will be converted to Date')
                    ///  uri: Overrides dataService's uri.
                    ///  
                    ///  -Options will be passed to services also, so we can pass service specific options too, these are available for WebApi and Mvc services;
                    ///  useBeetleQueryStrings: Beetle query strings will be used instead of OData query strings (only WebApi)
                    ///  usePost: Post verb will be used for queries, when query string is too large we need to use this option
                    ///  dataType: We can set ajax call's dataType with this option
                    ///  contentType: We can set ajax call's contentType with this option
                    /// </summary>
                    /// <param name="query">The query.</param>
                    /// <param name="options">Query options (optional), for detail read summary.</param>
                    /// <param name="successCallback">Function to call after operation succeeded (optional).</param>
                    /// <param name="errorCallback">Function to call when operation fails (optional).</param>
                    /// <returns type="">Returns promise if supported.</returns>
                    if (query.options)
                        options = helper.combine(query.options, options);
                    var modifiedArgs = notifyExecuting(this, query, options);
                    query = modifiedArgs.query;
                    options = modifiedArgs.options;

                    // Create promise if possible.
                    var pp = (options && options.async == false) ? null : settings.getPromiseProvider();
                    var d = null;
                    if (pp) d = pp.deferred();

                    // get execute options from parameters.
                    var merge = enums.mergeStrategy.Preserve, execution = enums.executionStrategy.Server, locals = null, autoFixScalar, autoFixPlural;
                    if (assert.isEnum(options, enums.mergeStrategy)) {
                        merge = options;
                        options = { makeObservable: merge != enums.mergeStrategy.NoTrackingRaw };
                    } else if (assert.isEnum(options, enums.executionStrategy))
                        execution = options;
                    else if (options) {
                        if (options.merge) merge = options.merge;
                        if (options.execution) execution = options.execution;
                        if (options.autoFixScalar != null) autoFixScalar = options.autoFixScalar;
                        if (options.autoFixPlural != null) autoFixPlural = options.autoFixPlural;
                        options.makeObservable = merge != enums.mergeStrategy.NoTrackingRaw;
                    }

                    var noTracking = merge == enums.mergeStrategy.NoTracking || merge == enums.mergeStrategy.NoTrackingRaw;
                    if (noTracking && execution == enums.executionStrategy.Both)
                        throw helper.createError(i18N.executionBothNotAllowedForNoTracking,
                            { executionStrategy: execution, mergeStrategy: merge });

                    // execute locally if needed.
                    if (execution == enums.executionStrategy.Local || execution == enums.executionStrategy.LocalIfEmptyServer)
                        locals = this.executeQueryLocally(query, options && options.varContext);

                    var retVal = null;
                    // if there is no need for server query, return
                    if (execution == enums.executionStrategy.Local || (execution == enums.executionStrategy.LocalIfEmptyServer && locals && (locals.length == null || locals.length > 0))) {
                        locals = notifyExecuted(this, query, options, locals);
                        onSuccess(successCallback, pp, d, locals);
                    } else {
                        var that = this;
                        this.dataService.executeQuery(
                            query, options,
                            function (newEntities, allEntities, xhr) {
                                try {
                                    // merge results.
                                    var isSingle = false;
                                    // read inline count header.
                                    var inlineCount = xhr.getResponseHeader("X-InlineCount");
                                    if (inlineCount != null) inlineCount = Number(inlineCount);

                                    if (newEntities) {
                                        if (!noTracking) {
                                            // we convert result to array to get modified result (replaced with cached by manager when necessary).
                                            if (!assert.isArray(newEntities)) {
                                                newEntities = [newEntities];
                                                isSingle = true;
                                            }
                                            mergeEntities(newEntities, allEntities, merge, enums.entityStates.Unchanged, that, autoFixScalar, autoFixPlural);
                                            if (isSingle)
                                                newEntities = newEntities[0];
                                        }
                                    }
                                    // if option need local and server results both, after server query re-run same query on local.
                                    if (execution == enums.executionStrategy.Both) {
                                        newEntities = that.executeQueryLocally(query, options && options.varContext, true);
                                        if (newEntities.$inlineCountDiff != null) {
                                            if (inlineCount != null)
                                                inlineCount += newEntities.$inlineCountDiff;
                                            delete newEntities.$inlineCountDiff;
                                        }
                                    }
                                    if (newEntities && assert.isObject(newEntities)) {
                                        if (query.inlineCountEnabled && inlineCount != null)
                                            newEntities.$inlineCount = inlineCount;

                                        newEntities.$extra = { userData: xhr.getResponseHeader("X-UserData"), xhr: xhr };
                                    }
                                    newEntities = notifyExecuted(that, query, options, newEntities);
                                    onSuccess(successCallback, pp, d, newEntities);
                                    if (!pp) retVal = newEntities;
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

                proto.executeQueryLocally = function (query, varContext, calculateInlineCountDiff) {
                    /// <summary>
                    /// Execute the query against local cache.
                    /// </summary>
                    /// <param name="query">The query.</param>
                    /// <param name="varContext">Variable context for the query.</param>
                    /// <param name="calculateInlineCountDiff">When true, effect of the local entities to server entities will be calculated.</param>
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

                    if (calculateInlineCountDiff && query.getExpression(querying.expressions.groupByExp, false)) {
                        events.warning.notify({ message: i18N.countDiffCantBeCalculatedForGrouped, query: query, options: options });
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

                proto.getEntityByKey = function (key, type) {
                    /// <summary>
                    /// Gets entity by its key from entity container.
                    /// </summary>
                    /// <param name="key">Entity key as a string. When entity has more than one key, the key is keys joined with a ','.</param>
                    /// <param name="type">Entity type or type short name.</param>
                    var t = assert.isInstanceOf(type, metadata.entityType) ? type : this.getEntityType(type, true);
                    return this.entities.getEntityByKey(key, t);
                };

                proto.deleteEntity = function (entity) {
                    /// <summary>
                    /// Marks entity as deleted.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
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

                proto.addEntity = function (detachedEntity, options) {
                    /// <summary>
                    /// Adds given entity to manager's entity container.
                    /// </summary>
                    /// <param name="detachedEntity">The detached entity.</param>
                    /// <param name="options">Entity merge options (optional), possible values;
                    ///  merge: Merge strategy
                    ///  state: Entity will be merged with this state
                    ///  autoFixScalar: Scalar navigations will be fixed for queried entities (e.g: if OrderDetail has OrderId, Order will be searched in cache)
                    ///  autoFixPlural: Plural navigations will be fixed for queried entities (e.g: Order's OrderDetails will be searched in cache)
                    /// </param>
                    mergeEntity(detachedEntity, options, enums.entityStates.Added, this);
                };

                proto.attachEntity = function (detachedEntity, options) {
                    /// <summary>
                    /// Attaches given entity to manager's entity container.
                    /// </summary>
                    /// <param name="detachedEntity">The detached entity.</param>
                    /// <param name="options">Entity merge options (optional), possible values;
                    ///  merge: Merge strategy
                    ///  state: Entity will be merged with this state
                    ///  autoFixScalar: Scalar navigations will be fixed for queried entities (e.g: if OrderDetail has OrderId, Order will be searched in cache)
                    ///  autoFixPlural: Plural navigations will be fixed for queried entities (e.g: Order's OrderDetails will be searched in cache)
                    /// </param>
                    mergeEntity(detachedEntity, options, enums.entityStates.Unchanged, this);
                };

                function mergeEntity(detachedEntity, options, defaultState, instance) {
                    // get merge options
                    var merge = enums.mergeStrategy.ThrowError, state = defaultState, autoFixScalar = null, autoFixPlural = null;
                    if (options) {
                        if (options.merge != null) merge = options.merge;
                        if (options.state != null) state = options.state;
                        if (options.autoFixScalar != null) autoFixScalar = options.autoFixScalar;
                        if (options.autoFixPlural != null) autoFixPlural = options.autoFixPlural;
                    }
                    // Merge entities to cache.
                    mergeEntities([detachedEntity], null, merge, state, instance, autoFixScalar, autoFixPlural);
                }

                proto.detachEntity = function (entity) {
                    /// <summary>
                    /// Detaches entity from manager and stops tracking.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    if (entity.$tracker.entityType.isComplexType && entity.$tracker.owners.length > 0)
                        throw helper.createError(i18N.cannotDetachComplexTypeWithOwners);

                    // check if given entity is being tracked by this manager.
                    checkEntity(entity, this);
                    // Clear navigations.
                    clearNavigations(entity, true);
                    // remove subscriptions for this entity.
                    unsubscribeFromEntity(entity, this);
                    // Set entity state to detached.
                    entity.$tracker.toDetached();
                    entity.$tracker.manager = null;
                    // Remove from cache.
                    this.entities.remove(entity);
                };

                proto.createSavePackage = function (entities, options) {
                    /// <summary>
                    /// Creates save package with entity raw values and user data.
                    ///  Options,
                    ///  userData: Custom user data to post
                    ///  forceUpdate: When true, each entity will be updated -even there is no modified property
                    ///  minimizePackage: For modified entities use only modified properties, for deleted entities use only keys.
                    /// </summary>
                    var userData = (options && options.userData) || null;
                    var forceUpdate = options && options.forceUpdate;
                    if (forceUpdate == null) forceUpdate = settings.forceUpdate;
                    var data = { userData: userData, forceUpdate: forceUpdate };

                    var entityList = this.exportEntities(entities || this.getChanges(), options);
                    data.entities = entityList;
                    return data;
                };

                proto.rejectChanges = function (entity, includeRelations) {
                    /// <summary>
                    /// Undo all changes made to this entity and detach from context if its newly added.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="includeRelations">If set to true, rejectChanges will be called for all navigation properties too.</param>
                    var manager = this;
                    if (!assert.isArray(entity)) entity = [entity];
                    var rejectList = includeRelations === true ? this.flatEntities(entity) : entity;
                    helper.forEach(rejectList, function (rejected) {
                        var tracker = rejected.$tracker;
                        // if entity is in Added state, detach it
                        if (tracker.entityState == enums.entityStates.Added)
                            manager.detachEntity(rejected);
                        else if (tracker.entityState == enums.entityStates.Modified) {
                            tracker.undoChanges(); // Undo all changes.
                            tracker.toUnchanged();
                        }
                    });
                };

                proto.undoChanges = function (entity, includeRelations) {
                    /// <summary>
                    /// Undo all changes made to this entity.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="includeRelations">If set to true, undoChanges will be called for all navigation properties too.</param>
                    if (!assert.isArray(entity)) entity = [entity];
                    var undoList = includeRelations === true ? this.flatEntities(entity) : entity;
                    helper.forEach(undoList, function (toUndo) {
                        toUndo.$tracker.undoChanges(); // Undo all changes.
                    });
                };

                proto.acceptChanges = function (entity, includeRelations) {
                    /// <summary>
                    /// Accept all changes made to this entity (clear changed values).
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="includeRelations">If set to true, acceptChanges will be called for all navigation properties too.</param>
                    if (!assert.isArray(entity)) entity = [entity];
                    var acceptList = includeRelations === true ? this.flatEntities(entity) : entity;
                    helper.forEach(acceptList, function (toAccept) {
                        toAccept.$tracker.acceptChanges(); // Accept all changes.
                    });
                };

                proto.exportEntities = function (entities, options) {
                    /// <summary>
                    /// Exports entities from manager to raw list.
                    ///  Options,
                    ///  forceUpdate: When true, each entity will be updated -even there is no modified property
                    ///  minimizePackage: For modified entities use only modified properties, for deleted entities use only keys.
                    /// </summary>
                    var entityList = [];
                    entities = entities || this.entities.getEntities();
                    var forceUpdate = options && options.forceUpdate;
                    if (forceUpdate == null) forceUpdate = settings.forceUpdate;
                    var minimizePackage = options && options.minimizePackage;
                    if (minimizePackage == null) minimizePackage = settings.minimizePackage;

                    helper.forEach(entities, function (entity, id) {
                        // get entity information.
                        var tracker = entity.$tracker;
                        var type = tracker.entityType;
                        var state = tracker.entityState;
                        if (forceUpdate === false)
                            forceUpdate = tracker.forceUpdate;
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
                                } else if (forceUpdate === true)
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
                            f: forceUpdate
                        };

                        // set entity index in array to use after save.
                        e.$t = t;
                        entityList.push(e);
                    });
                    return entityList;
                };

                proto.importEntities = function (exportedEntities, merge) {
                    /// <summary>
                    /// Imports exported entities and starts tracking them.
                    /// </summary>
                    /// <param name="exportedEntities">Exported entities.</param>
                    /// <param name="merge">Merge strategy to use while adding this entities to cache.</param>
                    var that = this;
                    if (!assert.isArray(exportedEntities)) exportedEntities = [exportedEntities];
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

                proto.hasChanges = function () {
                    /// <summary>
                    /// Check if there is any pending changes.
                    /// </summary>
                    return this.pendingChangeCount > 0;
                };

                proto.getChanges = function () {
                    /// <summary>
                    /// Gets changes made in this manager's cache
                    /// </summary>
                    return this.entities.getChanges();
                };

                proto.saveChanges = function (options, successCallback, errorCallback) {
                    /// <summary>
                    /// Saves all changes made in this manager to server via Data Service instance.
                    ///  Save options,
                    ///  entities: Entities to save
                    ///  userData: Custom user data to post
                    ///  async: When false, Ajax call will be made synchronously (default: true)
                    ///  forceUpdate: When true, each entity will be updated -even there is no modified property.
                    ///  autoFixScalar: Scalar navigations will be fixed for returned entities (e.g: if OrderDetail has OrderId, Order will be searched in cache)
                    ///  autoFixPlural: Plural navigations will be fixed for returned entities (e.g: Order's OrderDetails will be searched in cache)
                    ///  minimizePackage: For modified entities use only modified properties, for deleted entities use only keys.
                    ///  uri: Overrides dataService's uri.
                    ///  saveAction: Custom save action on server side (default is SaveChanges).
                    /// </summary>
                    /// <param name="options">Save options, for details read summary.</param>
                    /// <param name="successCallback">Function to call after operation succeeded.</param>
                    /// <param name="errorCallback">Function to call when operation fails.</param>
                    /// <returns type="">Returns promise if supported.</returns>
                    var changes = (options && options.entities) || this.getChanges();
                    options = notifySaving(this, changes, options);

                    // Create promise if possible.
                    var pp = (options && options.async == false) ? null : settings.getPromiseProvider();
                    var d = null;
                    if (pp) d = pp.deferred();

                    var autoFixScalar = options && options.autoFixScalar;
                    var autoFixPlural = options && options.autoFixPlural;

                    var retVal = null;
                    if (!assert.isArray(changes)) changes = [changes];
                    if (changes && changes.length > 0) {
                        var validationErrors = [];
                        if (settings.validateOnSave === true)
                            helper.forEach(changes, function (change) {
                                if (change.$tracker.entityState != enums.entityStates.Deleted) {
                                    var result = change.$tracker.validate();
                                    if (result && result.length > 0)
                                        validationErrors.push({ entity: change, validationErrors: result });
                                }
                            });
                        if (validationErrors.length > 0) {
                            var validationError = new helper.createError(i18N.validationFailed, { entities: changes, validationErrors: validationErrors });
                            validationError.entitiesInError = validationErrors;

                            onError(errorCallback, pp, d, validationError, this);
                        } else {
                            var that = this;
                            this.dataService.saveChanges(
                                this.createSavePackage(changes, options),
                                options,
                                function (result) {
                                    try {
                                        // merge generated entities
                                        if (result.GeneratedEntities != null && result.GeneratedEntities.length > 0)
                                            mergeEntities(result.GeneratedEntities, null, enums.mergeStrategy.Preserve, enums.entityStates.Unchanged, that, autoFixScalar, autoFixPlural);

                                        // set returned generated value to existing entity.
                                        if (result.GeneratedValues) {
                                            helper.forEach(result.GeneratedValues, function (g) {
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
                                                    mergeEntities(value, null, enums.mergeStrategy.Preserve, enums.entityStates.Unchanged, that, autoFixScalar, autoFixPlural);
                                                    // with this hack, when value is entity and another entity with same key is already in cache, we get cache item
                                                    g.Value = value[0];
                                                }
                                                tracker.setValue(lastProperty, g.Value);
                                            });
                                        }

                                        // Accept all changes, means Added -> Unchanged; Modified -> Unchanged, Clear Original Values; Deleted -> Remove from cache.
                                        acceptSaves(changes, that.entities, that);
                                        notifySaved(that, changes, options);
                                        onSuccess(successCallback, pp, d, result);
                                        if (!pp) retVal = result;
                                    } catch (e) {
                                        e.changes = changes;
                                        onError(errorCallback, pp, d, e, that);
                                    }
                                },
                                function (error) {
                                    error.changes = changes;
                                    onError(errorCallback, pp, d, error, that);
                                }
                            );
                        }
                    } else
                        onSuccess(successCallback, pp, d, { AffectedCount: 0, GeneratedValues: [] });

                    if (pp) return pp.getPromise(d);
                    return retVal;
                };

                proto.toEntity = function (result, typeName) {
                    /// <summary>
                    /// Creates an entity based on metadata information.
                    /// </summary>
                    /// <param name="result">Raw result to make entity (observable).</param>
                    /// <param name="typeName">Entity type name.</param>
                    if (result.$type && !typeName)
                        typeName = result.$type;
                    return this.dataService.toEntity(result, typeName);
                };

                proto.fixNavigations = function (entity) {
                    /// <summary>
                    /// Fix scalar and plural navigations for entity from cache.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    if (!this.isInManager(entity))
                        throw helper.createError(i18N.entityNotBeingTracked, null, { entity: entity });
                    entityAttached(entity, true, true, this);
                };

                proto.isInManager = function (entity) {
                    /// <summary>
                    /// Checks if given entity is being tracked by this manager.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    return entity.$tracker.manager == this;
                };

                proto.flatEntities = function (entities) {
                    /// <summary>
                    /// Flat relation to a single array. With this we can merge entities with complex navigations.
                    /// Example:
                    ///     Lets say we have an Order with 3 OrderDetails and that OrderDetails have Supplier assigned,
                    ///     with flatting this entity, we can merge Order, OrderDetails and Suppliers with one call.
                    /// </summary>
                    /// <param name="entities">Entities to float.</param>
                    var that = this;
                    var flatList = arguments[1] || [];
                    if (!assert.isArray(entities)) entities = [entities];
                    helper.forEach(entities, function (entity) {
                        if (entity == null) return;

                        if (assert.isArray(entity)) {
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
                                            if (assert.isArray(dv))
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
                                        if (assert.isArray(nv))
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
                                        if (assert.isArray(uv))
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
                                    if (assert.isArray(v))
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

                function initialize(args, instance) {
                    /// <summary>
                    /// Initializes the instance with given arguments.
                    /// </summary>
                    /// <param name="args">
                    /// Possible usages:
                    ///  [Service Uri - WebApi will be used] or [Service Instance];
                    ///  (optional) [Metadata Instance] or [Metadata String] or [true - false (default) - when true no metadata will be used, no auto relation fix]
                    /// </param>
                    /// <param name="instance">Entity manager instance.</param>
                    // Entity manager can take 1 or 2 arguments.
                    if (args.length < 1 || args.length > 2)
                        throw helper.createError(i18N.managerInvalidArgs, { entityManager: instance });
                    var service = args[0], metadataPrm = args[1];
                    // If first parameter is data service instance use it
                    if (assert.isInstanceOf(service, baseTypes.dataServiceBase))
                        instance.dataService = service;
                        // If first parameter is string, use it as an Uri and create the default service (webApiService).
                    else if (assert.isTypeOf(service, 'string')) {
                        if (metadataPrm)
                            instance.dataService = new services.webApiService(service, metadataPrm);
                        else instance.dataService = new services.webApiService(service, false);
                    } else throw helper.createError(i18N.managerInvalidArgs, { entityManager: this });

                    // Create a integer value to hold change count. This value will be updated after every entity state change.
                    instance.pendingChangeCount = 0;
                    // Create the entity container.
                    instance.entities = new core.entityContainer();
                    instance.validationErrors = [];
                    // Events.
                    instance.entityStateChanged = new core.event('entityStateChanged', instance);
                    instance.validationErrorsChanged = new core.event('validationErrorsChanged', instance);
                    instance.hasChangesChanged = new core.event('hasChangesChanged', instance);
                    instance.queryExecuting = new core.event('queryExecuting', instance);
                    instance.queryExecuted = new core.event('queryExecuted', instance);
                    instance.saving = new core.event('saving', instance);
                    instance.saved = new core.event('saved', instance);
                }

                function mergeEntities(newEntities, flatList, merge, state, instance, autoFixScalar, autoFixPlural) {
                    /// <summary>
                    /// Merges entities to cache by given merge strategy.
                    /// </summary>
                    /// <param name="newEntities">Entities to merge.</param>
                    /// <param name="flatList">Flatten entity list, includes all related entities and their relations etc..
                    /// optional-for performance improvements: usually entities are already flattened before this call, with this parameter we re-use that list.
                    /// </param>
                    /// <param name="merge">Merge strategy.</param>
                    /// <param name="state">Change merged entities' state to this.</param>
                    /// <param name="instance">Manager instance.</param>
                    /// <param name="autoFixScalar">When true all scalar navigations will be fixed after merge (optional, default value will be read from settings).</param>
                    /// <param name="autoFixPlural">When true all plural navigations will be fixed after merge (optional, default value will be read from settings).</param>
                    if (!merge) merge = enums.mergeStrategy.Preserve;
                    if (!state || state === enums.entityStates.Detached) state = enums.entityStates.Added;
                    if (autoFixScalar == null) autoFixScalar = settings.autoFixScalar;
                    if (autoFixPlural == null) autoFixPlural = settings.autoFixPlural;
                    // Flat list, means merge navigations also.
                    flatList = flatList || instance.flatEntities(assert.isArray(newEntities) ? newEntities : [newEntities]);
                    var added = [], toOverwrite = [], toReplace = [];
                    // Get initial entity count.
                    var count = instance.entities.count();
                    var that = instance;
                    helper.forEach(flatList, function (e) {
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
                        if (count > 0 && key) existingEntity = that.entities.getEntityByKey(key, type.floorType);
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
                        if (settings.validateOnMerge === true)
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

                function checkEntity(entity, instance) {
                    /// <summary>
                    /// If given entity is not being tracked by this manager, throws an error.
                    /// </summary>
                    if (!instance.isInManager(entity))
                        throw helper.createError(i18N.entityNotBeingTracked, { entity: entity, manager: instance });
                }

                function setEntityState(entity, state) {
                    /// <summary>
                    /// Change the state of the entity for merging.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="state">New state.</param>
                    if (state === enums.entityStates.Unchanged)
                        entity.$tracker.toUnchanged();
                    else if (state === enums.entityStates.Modified)
                        entity.$tracker.toModified();
                    else if (state === enums.entityStates.Added)
                        entity.$tracker.toAdded();
                    else throw helper.createError(i18N.mergeStateError, [state], { entity: entity, state: state });
                }

                function overwriteEntity(oldEntity, newEntity) {
                    /// <summary>
                    /// Overwrite the properties of existing entity.
                    /// </summary>
                    /// <param name="oldEntity">Existing entity.</param>
                    /// <param name="newEntity">Entity to use values when overwrite.</param>
                    var tracker = newEntity.$tracker;
                    // Overwrite all properties.
                    helper.forEach(tracker.entityType.dataProperties, function (dp) {
                        oldEntity.$tracker.setValue(dp.name, tracker.getValue(dp.name));
                    });
                }

                function entityAttached(entity, autoFixScalar, autoFixPlural, instance) {
                    /// <summary>
                    /// Finds navigation and fixes navigation properties for given attached entity.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="autoFixScalar">When true all scalar navigations will be fixed.</param>
                    /// <param name="autoFixPlural">When true all plural navigations will be fixed.</param>
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
                        if (assert.isArray(value))
                            handlePlural(value, instance);
                        else
                            handleScalar(tracker, value, null, p, false, instance);
                    });
                }

                function handleScalar(tracker, value, np, npName, autoFix, instance) {
                    /// <summary>
                    /// If scalar navigation value is replaced with existing entity, fixes it
                    /// </summary>
                    if (value) {
                        if (value.$tracker && value.$tracker.manager != instance) {
                            value = instance.getEntityByKey(value.$tracker.key, value.$tracker.entityType);
                            tracker.setValue(npName, value);
                        }
                        if (np) helper.setForeignKeys(tracker.entity, np, value);
                    }
                    else if (np && autoFix)
                        fixScalar(tracker, np, instance);
                }

                function handlePlural(array, instance) {
                    /// <summary>
                    /// If plural navigation items is replaced with existing entities, fixes them
                    /// </summary>
                    for (var i = array.length - 1; i >= 0; i--) {
                        var item = array[i];
                        if (item && item.$tracker && item.$tracker.manager != instance) {
                            var newItem = instance.getEntityByKey(item.$tracker.key, item.$tracker.entityType);
                            if (!newItem) array.splice(i, 1);
                            else array.splice(i, 1, newItem);
                        }
                    }
                }

                function resultReplaced(result, existing, autoFixScalar, autoFixPlural, instance) {
                    /// <summary>
                    /// When a query result entity already exists in cache existing entity will be returned as result.
                    /// This method fixes missing navigations.
                    /// </summary>
                    /// <param name="result">Query result.</param>
                    /// <param name="existing">Cached entity.</param>
                    /// <param name="autoFixScalar">When true all scalar navigations will be fixed.</param>
                    /// <param name="autoFixPlural">When true all plural navigations will be fixed.</param>
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
                                else if (!((autoFixScalar === true && np.inverse && np.inverse.isScalar) || (autoFixPlural === true && np.inverse && !np.inverse.isScalar))) {
                                    // when auto fix is not enabled, try to get items from query result
                                    var fkr = tr.foreignKey(np);
                                    var fke = te.foreignKey(np);
                                    // copy scalar values from result to existing entity
                                    if (fkr == fke && vr != null && instance.isInManager(vr)) {
                                        var inverse = np.inverse;
                                        if (inverse) {
                                            if (inverse.isScalar)
                                                vr.$tracker.setValue(inverse.name, existing);
                                            else {
                                                var iv = vr.$tracker.getValue(inverse.name);
                                                var index = helper.indexOf(iv, result);
                                                if (index >= 0)
                                                    iv.splice(index, 1, existing);
                                            }
                                        } else te.setValue(np.name, vr);
                                    }
                                }
                            }
                        } else {
                            if (autoFixPlural)
                                fixPlural(existing, np, ve, instance);
                            else if (!(autoFixScalar === true && np.inverse)) {
                                // copy plural values from result to existing entity
                                helper.forEach(vr, function (vri) {
                                    if (instance.isInManager(vri) && !helper.findInArray(ve, vri))
                                        ve.push(vri);
                                });
                            }
                        }
                    });
                }

                function fixScalar(tracker, np, instance) {
                    /// <summary>
                    /// Fixes scalar navigation property
                    /// </summary>
                    var fk = tracker.foreignKey(np);
                    var found = instance.entities.getEntityByKey(fk, np.entityType);
                    if (found && found.$tracker.entityState == enums.entityStates.Deleted) found = null;
                    tracker.setValue(np.name, found);
                }

                function fixPlural(entity, np, array, instance) {
                    /// <summary>
                    /// Fixes plural navigation property
                    /// </summary>
                    // get related items from entity container.
                    var relations = instance.entities.getRelations(entity, np);
                    if (relations)
                        helper.forEach(relations, function (item) {
                            if (item.$tracker.entityState != enums.entityStates.Deleted && !helper.findInArray(array, item))
                                array.push(item);
                        });
                }

                function clearNavigations(entity, preserveFK) {
                    /// <summary>
                    /// Clears navigation properties of given entity.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="preserveFK">When true, we can keep beetle from emptying related foreign key properties.</param>
                    var tracker = entity.$tracker;
                    var type = tracker.entityType;
                    var nullValue = preserveFK ? new core.valueNotifyWrapper(null) : null;
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

                function acceptSaves(changes, entities, instance) {
                    /// <summary>
                    /// Accept all changes made via this entity manager, remove deleted from cache, change state of Added and Modified to Unchanged.
                    /// </summary>
                    /// <param name="changes">Changed entities.</param>
                    /// <param name="entities">Entity container.</param>
                    /// <param name="instance">Entity manager instance.</param>
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

                function mergeErrors(entity, changes, instance) {
                    /// <summary>
                    /// Merges old and new errors and make callback.
                    /// </summary>
                    /// <param name="changes">Validation error changes.</param>
                    /// <param name="instance">Entity manager instance.</param>
                    if (changes.removed.length > 0)
                        for (var i = changes.removed.length - 1; i >= 0; i--)
                            instance.validationErrors.splice(helper.indexOf(instance.validationErrors, changes.removed[i]), 1);
                    if (changes.added.length > 0)
                        instance.validationErrors.push.apply(instance.validationErrors, changes.added);
                    if (changes.removed.length > 0 || changes.added.length > 0)
                        instance.validationErrorsChanged.notify({ errors: instance.validationErrors, added: changes.added, removed: changes.removed });
                }

                function subscribeToEntity(entity, instance) {
                    /// <summary>
                    /// Subscribe to entity events.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="instance">Entity manager instance.</param>
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

                function unsubscribeFromEntity(entity, instance) {
                    /// <summary>
                    /// Unsubscribe from entity events.
                    /// </summary>
                    /// <param name="entity">The entity.</param>
                    /// <param name="instance">Entity manager instance.</param>
                    // unsubscribe from entity events.
                    entity.$tracker.entityStateChanged.unsubscribe(instance.entityStateChanged.notify);
                    entity.$tracker.validationErrorsChanged.unsubscribe(instance.validationErrorsChanged.notify);
                    // remove existing validation errors
                    var errors = helper.filterArray(instance.validationErrors, function (ve) { return ve.entity == entity; });
                    helper.removeFromArray(instance.validationErrors, entity, 'entity');
                    instance.validationErrorsChanged.notify({ errors: instance.validationErrors, removed: errors, added: [] });
                }

                function notifyExecuting(manager, query, options) {
                    /// <summary>
                    /// Notifies subscribers about executing query.
                    /// </summary>
                    var obj = { manager: manager, query: query, options: options };
                    manager.queryExecuting.notify(obj);
                    events.queryExecuting.notify(obj);
                    return obj;
                }

                function notifyExecuted(manager, query, options, result) {
                    /// <summary>
                    /// Notifies subscribers about executed query.
                    /// </summary>
                    var obj = { manager: manager, query: query, options: options, result: result };
                    manager.queryExecuted.notify(obj);
                    events.queryExecuted.notify(obj);
                    return obj.result;
                }

                function notifySaving(manager, changes, options) {
                    /// <summary>
                    /// Notifies subscribers about save operation.
                    /// </summary>
                    var obj = { manager: manager, changes: changes, options: options };
                    manager.saving.notify(obj);
                    events.saving.notify(obj);
                    return obj.options;
                }

                function notifySaved(manager, changes, options) {
                    /// <summary>
                    /// Notifies subscribers about save completion.
                    /// </summary>
                    var obj = { manager: manager, changes: changes, options: options };
                    manager.saved.notify(obj);
                    events.saved.notify(obj);
                }

                function onSuccess(successCallback, promiseProvider, deferred, data) {
                    /// <summary>
                    /// Called when a operation is completed succesfully.
                    /// </summary>
                    if (successCallback) successCallback(data);
                    if (promiseProvider) promiseProvider.resolve(deferred, data);
                }

                function onError(errorCallback, promiseProvider, deferred, error, manager) {
                    /// <summary>
                    /// Called when a operation is failed.
                    /// </summary>
                    if (errorCallback) errorCallback(error);
                    if (promiseProvider) promiseProvider.reject(deferred, error);
                    error.manager = manager;
                    if (!errorCallback && !promiseProvider)
                        throw new error;
                }

                return ctor;
            })()
        };
    })();
    var services = (function () {
        /// <summary>Data service implementations like webApiService, mvcService etc..</summary>

        var expose = {};

        expose.mvcService = (function () {
            // Dependencies are injected through constructor.
            var ctor = function (uri, metadataPrm, injections) {
                /// <summary>
                /// MVC Controller Service class.
                /// </summary>
                /// <param name="uri">Service URI.</param>
                /// <param name="metadataPrm">Metadata info, can be metadataManager instance, metadata string, true-false (true means do not use any metadata).</param>
                /// <param name="injections">
                /// Injection object to change behavior of the service, can include these properties: ajaxProvider and serializationService. 
                ///  When not given, defaults will be used.
                /// </param>
                baseTypes.dataServiceBase.call(this, uri, metadataPrm, injections);
            };
            helper.inherit(ctor, baseTypes.dataServiceBase);
            var proto = ctor.prototype;

            proto.fetchMetadata = function (options) {
                var retVal = null;
                var that = this;
                var async = (options && options.async) || false;
                var timeout = (options && options.timeout) || settings.ajaxTimeout;
                var extra = options && options.extra;
                this.ajaxProvider.doAjax(
                    this.uri + 'Metadata',
                    'GET', this.dataType, this.contentType, null, async, timeout, extra,
                    function (data) {
                        // deserialize return value to object.
                        retVal = that.serializationService.deserialize(data); // parse string
                    },
                    function (error) {
                        error.service = that;
                        throw new error;
                    }
                );
                return retVal;
            };

            proto.createEntityAsync = function (typeName, initialValues, options, successCallback, errorCallback) {
                var that = this;
                var makeObservable = options && options.makeObservable;
                if (makeObservable == null) makeObservable = true;
                var async = options && options.async;
                if (async == null) async = settings.workAsync;
                var timeout = (options && options.timeout) || settings.ajaxTimeout;
                var extra = options && options.extra;
                // if type could not be found in metadata request it from server.
                var uri = that.uri + 'CreateType?typeName=' + typeName + "&initialValues=";
                if (initialValues != null)
                    uri += that.serializationService.serialize(initialValues);
                this.ajaxProvider.doAjax(
                    uri,
                    'GET', this.dataType, this.contentType, null, async, timeout, extra,
                    function (data) {
                        // deserialize return value to object.
                        data = that.serializationService.deserialize(data);
                        // Fix the relations between object (using $ref and $id values)
                        var allEntities = that.fixResults(data, makeObservable);
                        successCallback(data, allEntities);
                    },
                    function (error) {
                        errorCallback(error);
                    }
                );
            };

            proto.executeQuery = function (query, options, successCallback, errorCallback) {
                var qp = this.toBeetleQueryParams(query, options && options.varContext);
                return this.executeQueryParams(query.resource, qp, options, successCallback, errorCallback);
            };

            proto.executeQueryParams = function (resource, queryParams, options, successCallback, errorCallback) {
                var makeObservable = (options && options.makeObservable);
                var handleUnmappedProperties = (options && options.handleUnmappedProperties);
                var usePost = (options && options.usePost) || false;
                var dataType = (options && options.dataType) || this.dataType;
                var contentType = (options && options.contentType) || this.contentType;
                var async = options && options.async;
                if (async == null) async = settings.workAsync;
                var timeout = (options && options.timeout) || settings.ajaxTimeout;
                var extra = options && options.extra;
                var type, d = null;
                var uri = (options && options.uri) || this.uri || '';
                if (uri && uri[uri.length - 1] != '/') uri += '/';
                uri = uri + resource;
                if (usePost === true) {
                    var prmsObj = {};
                    helper.forEach(queryParams, function (qp) {
                        prmsObj[qp.name] = qp.value;
                    });
                    d = this.serializationService.serialize(prmsObj);
                    type = 'POST';
                } else {
                    var prmsArr = [];
                    helper.forEach(queryParams, function (qp) {
                        prmsArr.push(qp.name + '=' + encodeURIComponent(qp.value));
                    });
                    uri += '?' + prmsArr.join('&');
                    type = 'GET';
                }
                var that = this;
                // execute query using ajax provider
                this.ajaxProvider.doAjax(
                    uri,
                    type, dataType, contentType, d, async, timeout, extra,
                    function (data, xhr) {
                        // deserialize returned data (if deserializable).
                        try {
                            data = that.serializationService.deserialize(data);
                        } catch (e) {
                        }
                        // fix relations and convert to entities.
                        var allEntities = null;
                        if (data)
                            allEntities = that.fixResults(data, makeObservable, handleUnmappedProperties);
                        successCallback(data, allEntities, xhr);
                    },
                    function (error) {
                        errorCallback(error);
                    }
                );
            };

            proto.saveChanges = function (savePackage, options, successCallback, errorCallback) {
                var that = this;
                var async = options && options.async;
                if (async == null) async = settings.workAsync;
                var timeout = (options && options.timeout) || settings.ajaxTimeout;
                var extra = options && options.extra;
                var uri = (options && options.uri) || this.uri || '';
                if (uri && uri[uri.length - 1] != '/') uri += '/';
                var saveAction = (options && options.saveAction) || 'SaveChanges';
                uri = uri + saveAction;
                this.ajaxProvider.doAjax(
                    uri,
                    'POST', this.dataType, this.contentType, this.serializationService.serialize(savePackage), async, timeout, extra,
                    function (result) {
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
                        successCallback(result);
                    },
                    function (error) {
                        errorCallback(error);
                    }
                );
            };

            proto.fixResults = function (results, makeObservable, handleUnmappedProperties) {
                /// <summary>
                /// Fix the relations between loaded raw data.
                /// </summary>
                /// <param name="results">Raw data.</param>
                /// <param name="makeObservable">When not false entities will be converted to observables.</param>
                /// <param name="handleUnmappedProperties">When null, value is read from settings. When true, all values will be handled (types changed) by their value.</param>
                var that = this;
                var flatList = arguments[3] || [];
                if (!assert.isArray(results)) results = [results];
                if (handleUnmappedProperties == null) handleUnmappedProperties = settings.handleUnmappedProperties;
                // Push results id's.
                helper.forEach(results, function (result, i) {
                    if (result == null) return;

                    if (result.$ref)
                        results[i] = flatList[result.$ref - 1];
                    else if (result.$id)
                        fixSingle(result);
                    else if (assert.isArray(result))
                        that.fixResults(result, makeObservable, handleUnmappedProperties, flatList);
                });
                return flatList;

                function fixSingle(result) {
                    /// <summary>
                    /// Create navigation fixes for single raw result.
                    /// </summary>
                    /// <param name="result">Single raw result.</param>
                    var id = result.$id;
                    delete result.$id;

                    // insert entity to it's id position, so we can get it by id later.
                    flatList[id - 1] = result;

                    for (var property in result) {
                        if (property === '$type') continue;
                        var value = result[property];

                        if (value) {
                            // if its a reference add it to fixup list.
                            if (value.$ref)
                                result[property] = flatList[value.$ref - 1];
                            else if (value.$id)
                                fixSingle(value); // if its a entity, fix it.
                            else if (assert.isArray(value))  // if its array
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

        expose.webApiService = (function () {
            // Dependencies are injected through constructor.
            var ctor = function (uri, metadataPrm, injections) {
                /// <summary>
                /// Web API Service class.
                /// </summary>
                /// <param name="uri">Service URI.</param>
                /// <param name="metadataPrm">Metadata info, can be metadataManager instance, metadata string, true-false (true means do not use any metadata).</param>
                /// <param name="injections">
                /// Injection object to change behavior of the service, can include these properties: ajaxProvider and serializationService. 
                ///  When not given, defaults will be used.
                /// </param>
                services.mvcService.call(this, uri, metadataPrm, injections);
                this.useBeetleQueryStrings = false;
            };
            helper.inherit(ctor, expose.mvcService);
            var proto = ctor.prototype;

            proto.executeQuery = function (query, options, successCallback, errorCallback) {
                var qp;
                var varContext = options && options.varContext;
                var useBeetleQueryStrings;
                if (options && options.useBeetleQueryStrings != null)
                    useBeetleQueryStrings = options.useBeetleQueryStrings;
                else useBeetleQueryStrings = this.useBeetleQueryStrings;
                if (useBeetleQueryStrings === true)
                    qp = this.toBeetleQueryParams(query, varContext);
                else if (query.isMultiTyped === true) {
                    qp = this.toBeetleQueryParams(query, varContext);
                    events.warning.notify({ message: i18N.beetleQueryChosenMultiTyped, query: query, options: options });
                } else if (options && options.usePost) {
                    qp = this.toBeetleQueryParams(query, varContext);
                    events.warning.notify({ message: i18N.beetleQueryChosenPost, query: query, options: options });
                } else
                    qp = this.toODataQueryParams(query, varContext);
                return this.executeQueryParams(query.resource, qp, options, successCallback, errorCallback);
            };

            return ctor;
        })();

        return expose;
    })();
    var enums = (function () {
        /// <summary>Beetle enums.</summary>

        return {
            /// <field>
            /// Observable providers. Possible values;
            ///  ko, prop, backbone
            /// </field>
            observableProviders: new libs.enums({
                Knockout: { code: 'ko', instance: impls.koObservableProviderInstance },
                Property: { code: 'prop', instance: impls.propertyObservableProviderInstance },
                Backbone: { code: 'backbone', instance: impls.backboneObservableProviderInstance }
            }),
            /// <field>
            /// Promise providers. Possible values;
            ///  Q, jQuery
            /// </field>
            promiseProviders: new libs.enums({
                Q: { code: 'Q', instance: impls.qPromiseProviderInstance },
                jQuery: { code: 'jQuery', instance: impls.jQueryPromiseProviderInstance }
            }),
            /// <field>
            /// Entity states. Possible values;
            ///  Detached, Unchanged, Added, Deleted, Modified
            /// </field>
            entityStates: new libs.enums('Detached', 'Unchanged', 'Added', 'Deleted', 'Modified'),
            /// <field>
            /// Language operators. Possible values;
            ///  !, - (unary), &&, ||, ==, ===, !=, !==, >, <, >=, <=, +, -, *, /, %, &, |, <<, >>
            /// </field>
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
            /// <field>
            /// Filter operations. Used in queries's where operations. Possible values;
            ///  ==, !=, >, <, >=, <=, contains, startswith, endswith
            /// </field>
            filterOps: new libs.enums({
                Equals: { oData: 'eq', code: '==' },
                NotEqual: { oData: 'ne', code: '!=' },
                Greater: { oData: 'gt', code: '>' },
                Lesser: { oData: 'lt', code: '<' },
                GreaterEqual: { oData: 'ge', code: '>=' },
                LesserEqual: { oData: 'le', code: '<=' },
                Contains: { oData: 'substringof', code: 'contains', isFunc: true },
                StartsWith: { oData: 'startswith', code: 'startswith', isFunc: true },
                EndsWith: { oData: 'endswith', code: 'endswith', isFunc: true }
            }),
            /// <field>
            /// Merge strategies. Can be passed to execute query method of entity manager. Possible values;
            ///  Preserve: Cached entities are preserved and will be returned as query result (when entity with same key found).
            ///  Overwrite: Cached entity values will be overwritten and cached entity will be returned as query result (when entity with same key found).
            ///  ThrowError: Error will be thrown (when entity with same key found).
            ///  NoTracking: Query result will not be merged into the cache.
            ///  NoTrackingRaw: Query results will not be merged into the cache and will not be converted to entities (raw objects will be returned).
            /// </field>
            mergeStrategy: new libs.enums('Preserve', 'Overwrite', 'ThrowError', 'NoTracking', 'NoTrackingRaw'),
            /// <field>
            /// Query execution strategies. Can be passed to execute query method of entity manager. Possible values;
            ///  Server: Get entities only from server.
            ///  Local: Get entities only from local cache.
            ///  Both: Get entities from local cache then from server and then mix them up.
            ///  LocalIfEmptyServer: Get entities from local cache if no result is found get them from server.
            /// </field>
            executionStrategy: new libs.enums('Server', 'Local', 'Both', 'LocalIfEmptyServer'),
            /// <field>
            /// Property value auto generation type. Possible values;
            ///  Identity: Auto-Increment identity column.
            ///  Server: Calculated column.
            /// </field>
            generationPattern: new libs.enums('Identity', 'Computed'),
            /// <field>
            /// What to do when user sets an observable array's value with a new array.
            ///  NotAllowed: An exception will be thrown.
            ///  Replace: Old items will be replaced with next array items.
            ///  Append: New array items will be appended to existing array.
            /// </field>
            arraySetBehaviour: new libs.enums('NotAllowed', 'Replace', 'Append')
        };
    })();
    var events = (function () {
        /// <summary>Manager independent static events.</summary>

        return {
            /// <field>Notifies before a query is being executed. You can modify query and options from the args.</field>
            queryExecuting: new core.event('beetleQueryExecuting', this),
            /// <field>Notifies after a query is executed. You can modify result from the args.</field>
            queryExecuted: new core.event('beetleQueryExecuted', this),
            /// <field>Notifies before save call started. You can modify options from the args.</field>
            saving: new core.event('beetleSaving', this),
            /// <field>Notifies after save call completed.</field>
            saved: new core.event('beetleSaved', this),
            /// <field>Notifies when a information level event is occurred.</field>
            info: new core.event('beetleInfo', this),
            /// <field>Notifies when a warning level event is occurred.</field>
            warning: new core.event('beetleWarning', this),
            /// <field>Notifies when a error level event is occurred.</field>
            error: new core.event('beetleError', this)
        };
    })();
    var settings = (function () {
        /// <summary>Core settings.</summary>

        // set default values backing fields
        var _observableProvider;
        if (exports.ko)
            _observableProvider = impls.koObservableProviderInstance;
        else if (exports.Backbone)
            _observableProvider = impls.backboneObservableProviderInstance;
        else
            _observableProvider = impls.propertyObservableProviderInstance;

        var _promiseProvider;
        if (exports.Q)
            _promiseProvider = impls.qPromiseProviderInstance;
        else if (exports.jQuery)
            _promiseProvider = impls.jQueryPromiseProviderInstance;

        var _arraySetBehaviour = enums.arraySetBehaviour.NotAllowed;
        var _dateConverter = impls.defaultDateConverterInstance;

        var _localizeFunction;

        var expose = {};

        // When an entity loaded into manager, navigation fixer tries to fix all navigation properties.
        // But fixing plural navigations may take time (getting cached entities by their foreign keys).
        // These are the default settings, these settings also can be given by query options,
        // example: manager.executeQuery(query, {merge: mergeStrategy.Preserve, autoFixScalar: false})
        /// <field>Auto fix scalar navigation properties (after merge and after foreign key change).</field>
        expose.autoFixScalar = true;
        /// <field>Auto fix plural navigation properties (after merge).</field>
        expose.autoFixPlural = false;
        /// <field>Validate entities before adding to manager cache.</field>
        expose.validateOnMerge = true;
        /// <field>Validate entities before saving to server.</field>
        expose.validateOnSave = true;
        /// <field>Validate entities on every property change.</field>
        expose.liveValidate = true;
        /// <field>When a value is set, try to change its type by its data property or value (for anon types).</field>
        expose.handleUnmappedProperties = true;
        /// <field>for local queries use case sensitive string comparisons.</field>
        expose.isCaseSensitive = false;
        /// <field>for local queries trim values before string comparisons.</field>
        expose.ignoreWhiteSpaces = false;
        /// <field>when true, each entity will be updated -even there is no modified property.</field>
        expose.forceUpdate = false;
        /// <field>
        /// when not equals to false all Ajax calls will be made asynchronously, 
        /// when false createEntityAsync, executeQuery, saveChanges will returns results immediately.</field>
        expose.workAsync = true;
        /// <field>
        /// default timeout for AJAX calls. this value is used when not given with options argument.</field>
        expose.ajaxTimeout = null;
        /// <field>
        /// when true, while creating raw objects for entities, for modified only changed properties, for deleted only key properties will be used.
        /// entities will be created with only sent properties filled, other properties will have default values, please use carefully.</field>
        expose.minimizePackage = false;

        expose.getObservableProvider = function () {
            /// <summary>
            /// Gets static observable provider instance.
            /// </summary>
            return _observableProvider;
        };

        expose.setObservableProvider = function (provider) {
            /// <summary>
            /// Sets static observable provider instance. All generated entities after this call will use given observable provider instance.
            /// </summary>
            /// <param name="provider">Observable provider parameter.</param>
            // if parameter is observable provider instance use it.
            if (assert.isInstanceOf(provider, baseTypes.observableProviderBase))
                _observableProvider = provider;
            else {
                // if parameter is string parse it to observable provider enum.
                if (assert.isNotEmptyString(provider)) {
                    var symbols = enums.observableProviders.symbols();
                    for (var i = 0; i < symbols.length; i++) {
                        var sym = symbols[i];
                        if (sym.name == provider || sym.code == provider) {
                            provider = sym;
                            break;
                        }
                    }
                }
                if (assert.isEnum(provider, enums.observableProviders)) _observableProvider = provider.instance;
                else throw helper.createError(i18N.couldNotLocateNavFixer, { args: arguments });
            }
        };

        expose.getPromiseProvider = function () {
            /// <summary>
            /// Gets static promise provider instance.
            /// </summary>
            return _promiseProvider;
        };

        expose.setPromiseProvider = function (provider) {
            /// <summary>
            /// Sets static promise provider instance. All async operations after this call will use given promise provider instance.
            /// </summary>
            /// <param name="provider">Promise provider parameter.</param>
            // if parameter is promise provider instance use it.
            if (provider == null || assert.isInstanceOf(provider, baseTypes.promiseProviderBase))
                _promiseProvider = provider;
            else {
                // if parameter is string parse it to provider provider enum.
                if (assert.isNotEmptyString(provider)) {
                    var symbols = enums.promiseProviders.symbols();
                    for (var i = 0; i < symbols.length; i++) {
                        var sym = symbols[i];
                        if (sym.name == provider || sym.code == provider) {
                            provider = sym;
                            break;
                        }
                    }
                }
                if (assert.isEnum(provider, enums.promiseProviders)) _promiseProvider = provider.instance;
                else throw helper.createError(i18N.couldNotLocatePromiseProvider, { args: arguments });
            }
        };

        expose.getArraySetBehaviour = function () {
            /// <summary>
            /// Gets array set behaviour.
            /// </summary>
            return _arraySetBehaviour;
        };

        expose.setArraySetBehaviour = function (behaviour) {
            /// <summary>
            /// Sets array set behaviour.
            /// </summary>
            /// <param name="provider">Array set behaviour.</param>
            // check if parameter is arraySetBehaviour.
            helper.assertPrm(behaviour, 'behaviour').isEnum(enums.arraySetBehaviour).check();
            _arraySetBehaviour = behaviour;
        };

        expose.getDateConverter = function () {
            /// <summary>
            /// Gets date converter.
            /// </summary>
            return _dateConverter;
        };

        expose.setDateConverter = function (converter) {
            /// <summary>
            /// Sets date converter.
            /// </summary>
            // check if parameter is dateConverterBase.
            helper.assertPrm(converter, 'converter').isInstanceOf(converter, baseTypes.dateConverterBase).check();
            _dateConverter = converter;
        };

        expose.getLocalizeFunction = function () {
            /// <summary>
            /// Gets localized function (used for validation).
            /// </summary>
            return _localizeFunction;
        };

        expose.setLocalizeFunction = function (func) {
            /// <summary>
            /// Sets array set behaviour.
            /// </summary>
            /// <param name="func">Localized function to be used.</param>
            // check if parameter is arraySetBehaviour.
            helper.assertPrm(func, 'func').isFunction().check();
            _localizeFunction = func;
        };

        return expose;
    })();
    var i18N = (function () {
        /// <summary>Internationalization.</summary>
        if (exports.beetleI18N == null)
            exports.beetleI18N = {
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
                managerInvalidArgs: 'Invalid arguments. Valid args are: {DataService} or {Uri, [MetadataManager]} or {Uri, [metadataString (string)]} or {Uri, [doNotUseMetadata (bool)]}.',
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
                settingArrayNotAllowed: 'Setting array property is not allowed, you may change this via beetle.settings.setArraySetBehaviour(behavior).',
                stringLengthError: '%0 property length must be between %1 and %2.',
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
        return exports.beetleI18N;
    })();

    var beetle = (function () {
        return {
            // Export types
            version: '1.0',
            i18N: i18N,

            helper: helper,
            assert: assert,
            libs: libs,

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
            MetadataManager: metadata.metadataManager,
            entityManager: core.entityManager,
            EntityManager: core.entityManager,
            WebApiService: services.webApiService,
            MvcService: services.mvcService,
            EntityStates: enums.entityStates,
            FilterOps: enums.filterOps,
            MergeStrategy: enums.mergeStrategy
        };
    })();

    helper.tryFreeze(beetle);

    exports.beetle = beetle;
    return beetle;
})(window);
