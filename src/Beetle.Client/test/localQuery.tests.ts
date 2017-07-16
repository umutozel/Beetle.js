import * as beetle from "../lib/beetle";
import "../lib/beetle.queryExtensions";
import models from "./models";

var orders = Array(50).map(models.Order.create);

it("where", () => {
    const r1 = orders.where("price > 500");
    const r2 = orders.filter(o => o.price);
    
    expect(r1.length).toEqual(r2.length);
});