var customerViewModel = (function () {

    var vm = {
        manager: new beetle.EntityManager('svc/NorthwindService/'),
        customers: ko.observableArray(),
        pages: ko.observableArray([1]),
        currentPage: ko.observable(1),
        display: [5, 10, 20, 30, 40, 50],
        take: ko.observable(5),
        add: add,
        save: save,

        mergeStrategy: ko.observable('Preserve'),
        autoFixScalar: ko.observable(true),
        autoFixPlural: ko.observable(false),
        count: ko.observable(333),
        loadOrderDetails: loadOrderDetails
    };

    vm.currentPage.subscribe(loadCustomers);
    vm.take.subscribe(loadCustomers);

    loadCustomers();
    
    function loadCustomers() {
        var current = vm.currentPage();
        var take = vm.take();
        var skip = (current - 1) * take;
        var query = vm.manager.createQuery('Customers')
            .orderBy('CustomerID')
            .inlineCount(true)
            .skip(skip)
            .take(take);
        vm.manager.executeQuery(query, beetle.MergeStrategy.Preserve)
            .then(querySucceeded)
            .fail(opFailed);
    }

    function querySucceeded(data) {
        var pages = [];
        var pageCount = data.$inlineCount / vm.take();
        for (var i = 0; i < pageCount; i++)
            pages[i] = i+1;
        vm.pages(pages);
        vm.customers(data);
        toastr.info("Total count: " + data.length, "Customers loaded");
    }

    function opFailed(error) {
        toastr.error(error.message, "Error occurred");
    }

    function add() {
        var customer = vm.manager.createEntity('Customer');
        vm.customers.push(customer);
    }

    function save() {
        vm.manager.saveChanges()
            .then(function () {
                toastr.success("Changes saved");
            })
            .fail(opFailed);
    }
    
    function loadOrderDetails() {
        var m = new beetle.EntityManager('svc/NorthwindService/');
        var query = m.createQuery('OrderDetails').expand('Order').top(vm.count());
        var mergeStr = vm.mergeStrategy();
        var merge = beetle.MergeStrategy.symbols().q().first('name == "' + mergeStr + '"').execute();
        var dt1 = new Date().getTime();
        m.executeQuery(query, { merge: merge, autoFixScalar: vm.autoFixScalar(), autoFixPlural: vm.autoFixPlural() })
            .then(function (data) {
                var dt2 = new Date().getTime();
                toastr.info("Total time: " + ((dt2 - dt1)).toString() + " ms.", data.length + " Order Details loaded");
            })
            .fail(opFailed);
    }

    return vm;
})();

// Bind viewModel to view in index.html
ko.applyBindings(customerViewModel);