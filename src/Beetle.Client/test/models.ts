export module models {
    export class Order {
        no: string;
        price: number;
        date: Date;
        customer: Customer;
        details: Array<OrderDetail>;

        static create(): Order {
            const o = new Order();
            o.no = `ORD_${Math.random() * 10}`;
            o.price = Math.random() * 1000;
            o.date = new Date(2017 - Math.random() * 5, Math.random() * 12, Math.random() * 28);
            o.customer = Customer.create();
            o.details = Array(Math.random() * 10 + 1).map(OrderDetail.create);
            return o;
        }
    }

    export class OrderDetail {
        product: string;
        supplier: string;
        count: number;

        static create(): OrderDetail {
            const od = new OrderDetail();
            od.product = `PRD_${Math.random() * 50}`;
            od.supplier = `SUP_${Math.random() * 5}`;
            od.count = Math.random() * 25;
            return od;
        }
    }

    export class Customer {
        name: string;
        address: string;

        static create(): Customer {
            const c = new Customer();
            c.name = `CUS_${Math.random() * 10}`;
            c.address = `ADR_${Math.random() * 100}`;
            return c;
        }
    }
}

export default models;