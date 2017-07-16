"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../lib/beetle.queryExtensions");
var models_1 = require("./models");
var orders = Array(50).map(models_1.default.Order.create);
it("where", function () {
    var r1 = orders.where("price > 500").x();
    var r2 = orders.filter(function (o) { return o.price; });
    expect(r1.length).toEqual(r2.length);
});
//# sourceMappingURL=localQuery.tests.js.map