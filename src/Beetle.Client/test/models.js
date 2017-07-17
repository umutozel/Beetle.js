"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var models;
(function (models) {
    var Order = (function () {
        function Order() {
        }
        Order.create = function () {
            var o = new Order();
            o.no = "ORD_" + Math.random() * 10;
            o.price = Math.random() * 1000;
            o.date = new Date(2017 - Math.random() * 5, Math.random() * 12, Math.random() * 28);
            o.customer = Customer.create();
            o.details = Array(Math.random() * 10 + 1).map(OrderDetail.create);
            return o;
        };
        return Order;
    }());
    models.Order = Order;
    var OrderDetail = (function () {
        function OrderDetail() {
        }
        OrderDetail.create = function () {
            var od = new OrderDetail();
            od.product = "PRD_" + Math.random() * 50;
            od.supplier = "SUP_" + Math.random() * 5;
            od.count = Math.random() * 25;
            return od;
        };
        return OrderDetail;
    }());
    models.OrderDetail = OrderDetail;
    var Customer = (function () {
        function Customer() {
        }
        Customer.create = function () {
            var c = new Customer();
            c.name = "CUS_" + Math.random() * 10;
            c.address = "ADR_" + Math.random() * 100;
            return c;
        };
        return Customer;
    }());
    models.Customer = Customer;
})(models = exports.models || (exports.models = {}));
exports.default = models;
//# sourceMappingURL=models.js.map