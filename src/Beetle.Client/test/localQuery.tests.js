"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var beetle = require("../lib/beetle");
require("../lib/beetle.queryExtensions");
var models_1 = require("./models");
var orders = Array(50).map(models_1.default.Order.create);
var q = new beetle.querying.ArrayQuery(orders);
var l = q.length;
console.log(l);
//# sourceMappingURL=localQuery.tests.js.map