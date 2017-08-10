/**
 * Beetle query extensions. Array prototype extensions are here.
 * Using UMD pattern.
 * @module beetle
 */
(function (root, factory) {
    if (typeof exports === "object") {
        var beetle = require("./beetle.js");
        module.exports = factory(root, beetle);
        return beetle;
    }
    else if (typeof define === "function" && define.amd) {
        define(["beetle"], function (beetle) {
            factory(root, beetle || root.beetle);
        });
    }
    else {
        return factory(root, root.beetle);
    }
})(this, function (root, beetle) {
    "use strict";

    /**
     * Adds javascript arrays c# extension methods like usage.
     * Query gets executed when someone access it's length property and we can access results on the query object with indexer.
     * Most of these expressions support only javascript functions 
     *   (string expressions are not supported, because these are local only so expressions are not necessary)
     */

    if (!beetle) throw new Error("Beetle must be loaded first to register query extensions.");

    var resources = {
        indexOutOfRange: "Specified argument was out of the range of valid values. Parameter name: %1"
    };

    /**
     * Base type for array-only expressions.
     * Service related calls will throw exception.
     */
    var ArrayExpBase = (function () {
        var ctor = function (name) {
            beetle.baseTypes.ExpressionBase.call(this, name, 3, true, true);
        };
        beetle.helper.inherit(ctor, beetle.baseTypes.ExpressionBase);
        var proto = ctor.prototype;

        proto.toODataQuery = function () {
            throw beetle.helper.createError(beetle.i18N.notImplemented, [this.name, 'toODataQuery']);
        };

        proto.toBeetleQuery = function () {
            throw beetle.helper.createError(beetle.i18N.notImplemented, [this.name, 'toBeetleQuery']);
        };

        proto.execute = function (array, queryContext) {
            return ctor.execute(array, this.func, this.seed, queryContext);
        };

        return ctor;
    })();
    var arrayProto = Array.prototype;
    var arrayQueryProto = beetle.querying.ArrayQuery.prototype;
    var entityQueryProto = beetle.querying.EntityQuery.prototype;

    var aggregateExp = (function () {
        var ctor = function (func, seed) {
            if (!beetle.Assert.isFunction(func))
                throw new Error(beetle.helper.formatString(beetle.i18N.typeError, 'aggregate: func', 'function'));

            ArrayExpBase.call(this, 'aggregate');
            this.func = func;
            this.seed = seed;
            this.isExecuter = true;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.func, this.seed);
        };

        proto.execute = function (array, queryContext) {
            if (array.length == 0) return null;

            var i = 0;
            var agg = this.seed !== undefined ? this.seed : array[i++];
            if (array.length == 1) return agg;

            for (; i < array.length; i++) {
                agg = this.func.call(queryContext, agg, array[i]);
            }
            return agg;
        };

        return ctor;
    })();
    /**
     * Applies an accumulator function over an array. The specified seed value is used as the initial accumulator value.
     * @param {Function|string} func - A function to test each element for a condition.
     * @param {any} seed - The initial accumulator value.
     */
    arrayQueryProto.aggregate = function (func, seed) {
        var q = this.clone();
        return q.addExpression(new aggregateExp(func, seed));
    };

    var concatExp = (function () {
        var ctor = function (other) {
            ArrayExpBase.call(this, 'concat');
            this.other = other;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other);
        };

        proto.execute = function (array, queryContext) {
            return array.concat(this.other);
        };

        return ctor;
    })();
    /**
     * Concatenates two arrays.
     * @param {any[]} other - The array to concatenate to the query's array.
     */
    arrayQueryProto.concat = function (other) {
        var q = this.clone();
        return q.addExpression(new concatExp(other));
    };

    var containsExp = (function () {
        var ctor = function (item) {
            ArrayExpBase.call(this, 'contains');
            this.item = item;
            this.isExecuter = true;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.item);
        };

        proto.execute = function (array, queryContext) {
            for (var i = 0; i < array.length; i++) {
                if (beetle.helper.objEquals(array[i], this.item)) return true;
            }
            return false;
        };

        return ctor;
    })();
    /**
     * Determines whether a array contains a specified element.
     * @param {any} item - The value to locate in the array.
     * @returns {boolean} true if the source array contains an element that has the specified value; otherwise, false.
     */
    arrayQueryProto.contains = function (item) {
        var q = this.clone();
        return q.addExpression(new containsExp(item));
    };

    var exceptExp = (function () {
        var ctor = function (other) {
            ArrayExpBase.call(this, 'except');
            this.other = other;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            for (var i = 0; i < array.length; i++) {
                var item1 = array[i];
                var found = false;
                for (var j = 0; j < this.other.length; j++) {
                    var item2 = this.other[j];
                    found = beetle.helper.objEquals(item1, item2);
                    if (found) break;
                }
                if (!found) retVal.push(item1);
            }
            return retVal;
        };

        return ctor;
    })();
    /**
     * Produces the set difference of two arrays.
     * @param {any[]} other - An array whose elements that also occur in the first array will cause those elements to be removed from the returned array.
     */
    arrayQueryProto.except = function (other) {
        var q = this.clone();
        return q.addExpression(new exceptExp(other));
    };

    var groupJoinExp = (function () {
        var ctor = function (other, thisKey, otherKey, selector) {
            ArrayExpBase.call(this, 'groupJoin');
            this.other = other;
            this.thisKey = thisKey;
            this.otherKey = otherKey;
            this.selector = selector;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other, this.thisKey, this.otherKey, this.selector);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            var keyGetter = beetle.Assert.isFunction(this.thisKey) ? this.thisKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.thisKey), queryContext);
            var otherKeyGetter = beetle.Assert.isFunction(this.otherKey) ? this.otherKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.otherKey), queryContext);

            var that = this;
            beetle.helper.forEach(array, function (item) {
                var key = keyGetter(item);
                var items = [];
                beetle.helper.forEach(that.other, function (otherItem) {
                    var otherKey = otherKeyGetter(otherItem);
                    if (beetle.helper.objEquals(key, otherKey))
                        items.push(otherItem);
                });
                retVal.push(that.selector.call(queryContext, item, items));
            });

            return retVal;
        };

        return ctor;
    })();
    /**
     * Correlates the elements of two arrays based on equality of keys and groups the results.
     * @param {any[]} other - The array to join to the query array.
     * @param {Function} thisKey - Key selector for query's array.
     * @param {Function} otherKey - Key selector for other array.
     * @param {Function} selector - A function to create a result element from an element from the first array and a collection of matching elements from the other array.
     */
    arrayQueryProto.groupJoin = function (other, thisKey, otherKey, selector) {
        var q = this.clone();
        return q.addExpression(new groupJoinExp(other, thisKey, otherKey, selector));
    };

    var intersectExp = (function () {
        var ctor = function (other) {
            ArrayExpBase.call(this, 'intersect');
            this.other = other;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            for (var i = 0; i < array.length; i++) {
                var item1 = array[i];
                var exists = false;
                for (var j = 0; j < retVal.length; j++) {
                    if (exists = beetle.helper.objEquals(item1, retVal[j])) break;
                }
                if (exists) continue;

                var found = false;
                for (var k = 0; k < this.other.length; k++) {
                    if (found = beetle.helper.objEquals(item1, this.other[k])) break;
                }
                if (found) retVal.push(item1);
            }
            return retVal;
        };

        return ctor;
    })();
    /**
     * Produces the set intersection of two arrays.
     * @param {any[]} other - The array whose distinct elements that also appear in the first array will be returned.
     */
    arrayQueryProto.intersect = function (other) {
        var q = this.clone();
        return q.addExpression(new intersectExp(other));
    };

    var joinExp = (function () {
        var ctor = function (other, thisKey, otherKey, selector) {
            ArrayExpBase.call(this, 'join');
            this.other = other;
            this.thisKey = thisKey;
            this.otherKey = otherKey;
            this.selector = selector;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other, this.thisKey, this.otherKey, this.selector);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            var selector = this.selector || beetle.helper.combine;

            var keyGetter = beetle.Assert.isFunction(this.thisKey) ? this.thisKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.thisKey), queryContext);
            var otherKeyGetter = beetle.Assert.isFunction(this.otherKey) ? this.otherKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.otherKey), queryContext);

            var that = this;
            beetle.helper.forEach(array, function (item) {
                var key = keyGetter(item);
                var items = [];
                beetle.helper.forEach(that.other, function (otherItem) {
                    var otherKey = otherKeyGetter(otherItem);
                    if (beetle.helper.objEquals(key, otherKey))
                        items.push(otherItem);
                });
                beetle.helper.forEach(items, function (otherItem) {
                    retVal.push(selector.call(queryContext, item, otherItem));
                });
            });

            return retVal;
        };

        return ctor;
    })();
    /**
     * Correlates the elements of two arrays based on matching keys.
     * @param {any[]} other - The array to join to the query array.
     * @param {Function} thisKey - Key selector for query's array.
     * @param {Function} otherKey - Key selector for other array.
     * @param {Function} selector - A function to create a result element from two matching elements.
     */
    arrayQueryProto.join = function (other, thisKey, otherKey, selector) {
        var q = this.clone();
        return q.addExpression(new joinExp(other, thisKey, otherKey, selector));
    };
    arrayQueryProto.innerJoin = arrayQueryProto.join;

    var leftJoinExp = (function () {
        var ctor = function (other, thisKey, otherKey, selector) {
            ArrayExpBase.call(this, 'leftJoin');
            this.other = other;
            this.thisKey = thisKey;
            this.otherKey = otherKey;
            this.selector = selector;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other, this.thisKey, this.otherKey, this.selector);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            var selector = this.selector || beetle.helper.combine;

            var keyGetter = beetle.Assert.isFunction(this.thisKey) ? this.thisKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.thisKey), queryContext);
            var otherKeyGetter = beetle.Assert.isFunction(this.otherKey) ? this.otherKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.otherKey), queryContext);

            var that = this;
            beetle.helper.forEach(array, function (item) {
                var key = keyGetter(item);
                var items = [];
                beetle.helper.forEach(that.other, function (otherItem) {
                    var otherKey = otherKeyGetter(otherItem);
                    if (beetle.helper.objEquals(key, otherKey))
                        items.push(otherItem);
                });
                if (items.length == 0)
                    retVal.push(selector.call(queryContext, item, null));
                else {
                    beetle.helper.forEach(items, function (otherItem) {
                        retVal.push(selector.call(queryContext, item, otherItem));
                    });
                }
            });

            return retVal;
        };

        return ctor;
    })();
    /**
     * Correlates the elements of two arrays based on matching keys (query array items are taken even they do not have matching item on other array).
     * @param {any[]} other - The array to join to the query array.
     * @param {Function} thisKey - Key selector for query's array.
     * @param {Function} otherKey - Key selector for other array.
     * @param {Function} selector - A function to create a result element from two matching elements.
     */
    arrayQueryProto.leftJoin = function (other, thisKey, otherKey, selector) {
        var q = this.clone();
        return q.addExpression(new leftJoinExp(other, thisKey, otherKey, selector));
    };

    var rightJoinExp = (function () {
        var ctor = function (other, thisKey, otherKey, selector) {
            ArrayExpBase.call(this, 'rightJoin');
            this.other = other;
            this.thisKey = thisKey;
            this.otherKey = otherKey;
            this.selector = selector;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other, this.thisKey, this.otherKey, this.selector);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            var selector = this.selector || beetle.helper.combine;

            var keyGetter = beetle.Assert.isFunction(this.thisKey) ? this.thisKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.thisKey), queryContext);
            var otherKeyGetter = beetle.Assert.isFunction(this.otherKey) ? this.otherKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.otherKey), queryContext);

            var that = this;
            beetle.helper.forEach(this.other, function (item) {
                var key = keyGetter(item);
                var items = [];
                beetle.helper.forEach(array, function (otherItem) {
                    var otherKey = otherKeyGetter(otherItem);
                    if (beetle.helper.objEquals(key, otherKey))
                        items.push(otherItem);
                });
                if (items.length == 0)
                    retVal.push(selector.call(queryContext, null, item));
                else {
                    beetle.helper.forEach(items, function (otherItem) {
                        retVal.push(selector.call(queryContext, otherItem, item));
                    });
                }
            });

            return retVal;
        };

        return ctor;
    })();
    /**
     * Correlates the elements of two arrays based on matching keys (other array items are taken even they do not have matching item on query array).
     * @param {any[]} other - The array to join to the query array.
     * @param {Function} thisKey - Key selector for query's array.
     * @param {Function} otherKey - Key selector for other array.
     * @param {Function} selector - A function to create a result element from two matching elements.
     */
    arrayQueryProto.rightJoin = function (other, thisKey, otherKey, selector) {
        var q = this.clone();
        return q.addExpression(new rightJoinExp(other, thisKey, otherKey, selector));
    };

    var fullJoinExp = (function () {
        var ctor = function (other, thisKey, otherKey, selector) {
            ArrayExpBase.call(this, 'fullJoin');
            this.other = other;
            this.thisKey = thisKey;
            this.otherKey = otherKey;
            this.selector = selector;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other, this.thisKey, this.otherKey, this.selector);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            var selector = this.selector || beetle.helper.combine;
            var other = beetle.helper.filterArray(this.other, function () { return true; });

            var keyGetter = beetle.Assert.isFunction(this.thisKey) ? this.thisKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.thisKey), queryContext);
            var otherKeyGetter = beetle.Assert.isFunction(this.otherKey) ? this.otherKey : beetle.helper.jsepToProjector(beetle.libs.jsep(this.otherKey), queryContext);

            beetle.helper.forEach(array, function (item) {
                var key = keyGetter(item);
                var items = [];
                beetle.helper.forEach(other, function (otherItem) {
                    var otherKey = otherKeyGetter(otherItem);
                    if (beetle.helper.objEquals(key, otherKey))
                        items.push(otherItem);
                });
                if (items.length == 0)
                    retVal.push(selector.call(queryContext, item, null));
                else {
                    beetle.helper.forEach(items, function (otherItem) {
                        retVal.push(selector.call(queryContext, item, otherItem));
                        other.splice(other.indexOf(otherItem), 1);
                    });
                }
            });

            beetle.helper.forEach(other, function (otherItem) {
                retVal.push(selector.call(queryContext, null, otherItem));
            });

            return retVal;
        };

        return ctor;
    })();
    /**
     * Correlates the elements of two arrays based on matching keys (all items are taken cross-multiplied).
     * @param {any[]} other - The array to join to the query array.
     * @param {Function} thisKey - Key selector for query's array.
     * @param {Function} otherKey - Key selector for other array.
     * @param {Function} selector - A function to create a result element from two matching elements.
     */
    arrayQueryProto.fullJoin = function (other, thisKey, otherKey, selector) {
        var q = this.clone();
        return q.addExpression(new fullJoinExp(other, thisKey, otherKey, selector));
    };

    var crossJoinExp = (function () {
        var ctor = function (other, selector) {
            ArrayExpBase.call(this, 'crossJoin');
            this.other = other;
            this.selector = selector;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other, this.selector);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            var selector = this.selector || beetle.helper.combine;

            var that = this;
            beetle.helper.forEach(array, function (item) {
                beetle.helper.forEach(that.other, function (otherItem) {
                    retVal.push(selector.call(queryContext, item, otherItem));
                });
            });

            return retVal;
        };

        return ctor;
    })();
    /**
     * Correlates the elements of two arrays based on matching keys (all items are taken cross-multiplied).
     * @param {any[]} other - The array to join to the query array.
     * @param {Function} thisKey - Key selector for query's array.
     * @param {Function} otherKey - Key selector for other array.
     * @param {Function} selector - A function to create a result element from two matching elements.
     */
    arrayQueryProto.crossJoin = function (other, selector) {
        var q = this.clone();
        return q.addExpression(new crossJoinExp(other, selector));
    };

    var sequenceEqualExp = (function () {
        var ctor = function (other) {
            ArrayExpBase.call(this, 'sequenceEqual');
            this.other = other;
            this.isExecuter = true;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other);
        };

        proto.execute = function (array, queryContext) {
            if (array.length != this.other.length) return false;
            for (var i = 0; i < array.length; i++) {
                if (!beetle.helper.objEquals(array[i], this.other[i])) return false;
            }
            return true;
        };

        return ctor;
    })();
    /**
     * Determines whether two arrays are equal by comparing the elements.
     * @param {any[]} other - An array to compare to the query array.
     */
    arrayQueryProto.sequenceEqual = function (other) {
        var q = this.clone();
        return q.addExpression(new sequenceEqualExp(other));
    };

    var toLookupExp = (function () {
        var ctor = function (keySelector, elementSelector) {
            ArrayExpBase.call(this, 'toLookup', 3, true, true);
            this.keySelector = keySelector;
            this.elementSelector = elementSelector;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.keySelector, this.elementSelector);
        };

        proto.execute = function (array, queryContext) {
            var groups = [];
            // project keys
            if (this.keySelector) {
                var keys = beetle.Assert.isFunction(this.keySelector) ? this.keySelector(array) : beetle.helper.runSelectExp(array, this.keySelector, queryContext);
                for (var i = 0; i < keys.length; i++) {
                    var keyGroup = null;
                    var key = keys[i];
                    for (var j = 0; j < groups.length; j++) {
                        // find if there is already a key with same values
                        var group = groups[j];
                        if (beetle.helper.objEquals(group.Key, key)) {
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
                var es = beetle.Assert.isFunction(this.elementSelector) ? this.elementSelector : beetle.helper.jsepToFunction(beetle.libs.jsep(this.elementSelector), queryContext);
                beetle.helper.forEach(groups, function (g, k) {
                    var items = g.Items;
                    items.Key = g.Key;
                    var result = es.call(queryContext, g.Items, g.Key);
                    groups[k] = result;
                });
            }

            return groups;
        };

        return ctor;
    })();
    /**
     * Creates a array from query array according to specified key selector and element selector functions.
     * @param {Function} keySelector - A function to extract a key from each element.
     * @param {Function} elementSelector - An array to compare to the query array.
     */
    arrayQueryProto.toLookup = function (keySelector, elementSelector) {
        var q = this.clone();
        return q.addExpression(new toLookupExp(keySelector, elementSelector));
    };

    var unionExp = (function () {
        var ctor = function (other) {
            ArrayExpBase.call(this, 'union');
            this.other = other;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            addDistinctItems(array, retVal);
            addDistinctItems(this.other, retVal);
            return retVal;
        };

        function addDistinctItems(from, to) {
            if (from == null) return;
            for (var i = 0; i < from.length; i++) {
                var item = from[i];
                var found = false;
                for (var j = 0; j < to.length; j++) {
                    if (beetle.helper.objEquals(item, to[j])) {
                        found = true;
                        break;
                    }
                }
                if (!found) to.push(item);
            }
        }

        return ctor;
    })();
    /**
     * Produces the set union of two arrays' distinct elements.
     * @param {any[]} other - An array whose distinct elements form the second set for the union.
     */
    arrayQueryProto.union = function (other) {
        var q = this.clone();
        return q.addExpression(new unionExp(other));
    };

    var zipExp = (function () {
        var ctor = function (other, selector) {
            ArrayExpBase.call(this, 'zip');
            this.other = other;
            this.selector = selector;
        };
        beetle.helper.inherit(ctor, ArrayExpBase);
        var proto = ctor.prototype;

        proto.clone = function () {
            return new ctor(this.other, this.selector);
        };

        proto.execute = function (array, queryContext) {
            var retVal = [];
            var selector = this.selector || beetle.helper.combine;

            var len = Math.min(array.length, this.other.length);
            for (var i = 0; i < len; i++) {
                retVal.push(selector.call(queryContext, array[i], this.other[i]));
            }

            return retVal;
        };

        return ctor;
    })();
    /**
     * Applies a specified function to the corresponding elements of two arrays, producing a array of the results.
     * @param {any[]} other - The second array to merge.
     * @param {Function} selector - A function that specifies how to merge the elements from the two arrays.
     */
    arrayQueryProto.zip = function (other, selector) {
        var q = this.clone();
        return q.addExpression(new zipExp(other, selector));
    };

    /** Extend Array prototype with beetle query methods. */
    function extend(methodName) {
        arrayProto[methodName] = function () {
            var query = this.asQueryable();
            return query[methodName].apply(query, arguments);
        };
    }

    extend("inlineCount");
    extend("ofType");
    extend("where");
    extend("orderBy");
    extend("orderByDesc");
    extend("select");
    extend("skip");
    extend("take");
    extend("top");
    extend("groupBy");
    extend("distinct");
    extend("selectMany");
    extend("skipWhile");
    extend("takeWhile");
    extend("all");
    extend("any");
    extend("avg");
    extend("max");
    extend("min");
    extend("sum");
    extend("count");
    extend("first");
    extend("firstOrDefault");
    extend("single");
    extend("singleOrDefault");
    extend("last");
    extend("lastOrDefault");
    // after this point expressions are only for arrays (cannot be used for server queries)
    extend("aggregate");
    extend("contains");
    extend("except");
    extend("groupJoin");
    extend("intersect");
    extend("innerJoin");
    extend("leftJoin");
    extend("rightJoin");
    extend("fullJoin");
    extend("crossJoin");
    extend("sequenceEqual");
    extend("toLookup");
    extend("union");
    extend("zip");

    /** Register static range method to Array */
    if (!Array.hasOwnProperty("range")) {
        Array.range = function (start, count) {
            if (arguments.length == 0) return [];
            if (arguments.length == 1) {
                count = start;
                start = 0;
            }
            if (count < 0)
                throw beetle.helper.createError(resources.indexOutOfRange, ['count']);

            var retVal = [];
            for (var i = 0; i < count; i++)
                retVal[i] = start + i;
            return retVal;
        };
    }

    /** Register static repeat method to Array */
    if (!Array.hasOwnProperty("repeat")) {
        Array.repeat = function (item, count) {
            if (arguments.length == 0) return [];
            if (arguments.length == 1) {
                count = item;
                item = null;
            }
            if (count < 0)
                throw beetle.helper.createError(resources.indexOutOfRange, ['count']);

            var retVal = [];
            for (var i = 0; i < count; i++)
                retVal.push(item);
            return retVal;
        };
    }

    /** Register forEach method to Array */
    if (!arrayProto.hasOwnProperty("forEach")) {
        arrayProto.forEach = function (callback) {
            beetle.helper.forEach(this, callback);
        };
    }

    /** Register forEach method to ArrayQuery */
    if (!arrayQueryProto.hasOwnProperty("forEach")) {
        arrayQueryProto.forEach = function (callback) {
            beetle.helper.forEach(this, callback);
        };
    }

    if (!entityQueryProto.hasOwnProperty("forEach")) {
        entityQueryProto.forEach = function (callback) {
            this.execute(null, function (items) {
                if (beetle.Assert.isArray(items))
                    items.forEach(callback);
                else
                    callback.call(items, items);
            });
        };
    }

    /** Create a length property for query so it can be automatically executed before enumeration (like LINQ). */
    if (Object.hasOwnProperty("defineProperty")) {
        arrayQueryProto.length = Object.defineProperty(arrayQueryProto, "length", {
            get: function () {
                var result = this.execute();
                if (!(result instanceof Array))
                    result = [result];

                var i = result.length;
                while (this[i] !== undefined)
                    delete this[i++];

                for (i = 0; i < result.length; i++)
                    this[i] = result[i];

                return result.length;
            },
            set: function () {
            },
            enumerable: true,
            configurable: true
        });
    }

    return beetle;
});