/// <reference path="../jquery-1.8.3.min.js" />
/// <reference path="../qunit.js" />
/// <reference path="../json2.js" />
/// <reference path="../q.min.js" />
/// <reference path="../knockout-2.1.0.js" />
/// <reference path="../beetle/beetle.js" />
/// <reference path="../beetle/beetle.queryExtensions.js" />
/// <reference path="../toastr.js" />
/// <reference path="testMetadata.js" />

'use strict';

var metadata, observableProvider, service;
var basicTestViewModel = {
    metadataType: 'MM',
    observableProviderType: 'KO',
    serviceType: 'WA',
    reRun: function () {
        window.location = QUnit.url({ metadataType: this.metadataType, observableProviderType: this.observableProviderType, serviceType: this.serviceType });
    }
};

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function handleFail(error) {
    if (error.handled === true) return;
    if (error.message)
        ok(false, error.message);
    else
        ok(false, "Failed: " + error.toString());
    start();
}

function seed(serviceUri) {
    var deferred = Q.defer();

    $.post(serviceUri + '/Seed',
        function (data, textStatus, xhr) {
            deferred.resolve(
                "Seed svc returned '" + xhr.status + "' with message: " + data);
        })
        .error(function (xhr, textStatus, errorThrown) { deferred.reject(errorThrown); });

    return deferred.promise;
}

function populateVars() {
    var urlVars = getUrlVars();

    var metadataType = urlVars['metadataType'];
    if (metadataType == 'MS')
        metadata = testMetadata;
    else if (metadataType == 'SM')
        metadata = null;
    else if (metadataType == 'NM')
        metadata = false;
    else {
        metadataType = 'MM';
        metadata = new beetle.MetadataManager(testMetadata);
    }
    basicTestViewModel.metadataType = metadataType;

    var observableProviderType = urlVars['observableProviderType'];
    if (observableProviderType == 'PR')
        observableProvider = beetle.enums.observableProviders.Property;
    else {
        observableProviderType = 'KO';
        observableProvider = beetle.enums.observableProviders.Knockout;
    }
    basicTestViewModel.observableProviderType = observableProviderType;
    beetle.settings.setObservableProvider(observableProvider);

    var serviceType = urlVars['serviceType'];
    if (serviceType == 'MV')
        service = new beetle.MvcService('Home', metadata);
    else {
        serviceType = 'WA';
        service = new beetle.services.WebApiService('api/BeetleTest', metadata);
    }
    basicTestViewModel.serviceType = serviceType;
}
populateVars();

beetle.events.saving.subscribe(function (args) {
    args.options.headers = args.options.headers || {};
    args.options.headers.__RequestVerificationToken = $('input[name="__RequestVerificationToken"]').val();
});
var EntityManager = beetle.EntityManager;
var entityStates = beetle.entityStates;
var op = beetle.filterOps;
var testArray = [
    {
        Name: 'Ord1',
        Price: 400,
        Date: new Date("2013/8/6 12:34:56"),
        Customer: { Name: 'Cus4' },
        Details: [
            {
                Product: 'Prd1',
                Supplier: 'ABC',
                Count: 4
            },
            {
                Product: 'Prd5',
                Supplier: 'QWE',
                Count: 23
            }
        ]
    },
    {
        Name: 'Ord2',
        Price: 750.42,
        Date: new Date("2014/3/30 23:45:01"),
        Customer: { Name: 'Cus9' },
        Details: [
            {
                Product: 'Prd3',
                Supplier: 'FGH',
                Count: 5
            },
            {
                Product: 'Prd8',
                Supplier: 'QWE',
                Count: 1
            },
            {
                Product: 'Prd9',
                Supplier: 'QWE',
                Count: 36
            }
        ]
    },
    {
        Name: 'Ord3',
        Price: 1125,
        Date: new Date("2012/11/10 8:10:25"),
        Customer: { Name: 'Cus3' },
        Details: [
            {
                Product: 'Prd2',
                Supplier: 'FGH',
                Count: 63
            },
            {
                Product: 'Prd4',
                Supplier: 'TYU',
                Count: 5
            },
            {
                Product: 'Prd6',
                Supplier: 'FGH',
                Count: 18
            },
            {
                Product: 'Prd9',
                Supplier: 'ABC',
                Count: 22
            }
        ]
    },
    {
        Name: 'Ord4',
        Price: 231.58,
        Date: new Date("2011/5/1"),
        Customer: { Name: 'Cus1' },
        Details: [
            {
                Product: 'Prd7',
                Supplier: 'TYU',
                Count: 4
            }
        ]
    },
    {
        Name: 'Ord5',
        Price: 1125,
        Date: new Date("2010/1/28 14:42:33"),
        Customer: { Name: 'Cus3' },
        Details: [
            {
                Product: 'Prd1',
                Supplier: 'QWE',
                Count: 4
            },
            {
                Product: 'Prd5',
                Supplier: 'BNM',
                Count: 67
            },
            {
                Product: 'Prd6',
                Supplier: 'BNM  ',
                Count: 13
            },
            {
                Product: 'Prd7',
                Supplier: 'TYU',
                Count: 8
            },
            {
                Product: 'Prd8',
                Supplier: 'FGH',
                Count: 34
            },
            {
                Product: 'Prd9',
                Supplier: 'FGH',
                Count: 86
            }
        ]
    }
];

module('basic tests');

test('seed the test db', 1, function () {
    stop();
    seed(service.uri)
        .then(function (msg) {
            ok(0 < msg.indexOf('seed'), msg);
        })
        .fail(handleFail)
        .fin(start);
});

test('get all NamedEntities', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.Entities.ofType('NamedEntity');
    stop();
    manager.executeQuery(query)
        .then(firstQuerySucceeded)
        .fail(handleFail)
        .fin(start);

    function firstQuerySucceeded(data) {
        var count = data.length;
        ok(count > 0, 'loaded all NamedEntities, count: ' + count);
    }
});

test('detach an unchanged entity', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities');
    stop();
    manager.executeQuery(query)
        .then(firstQuerySucceeded)
        .fail(handleFail)
        .fin(start);

    function firstQuerySucceeded(result) {
        var ne = result[0];
        manager.detachEntity(ne);
        equal(ne.$tracker.entityState, entityStates.Detached, 'entity state is "Detached"');
    }
});

test('detach and re-attach an entity', 1, function () {
    var manager = new beetle.EntityManager(service);
    var query = manager.createQuery('NamedEntities');
    stop();
    manager.executeQuery(query)
        .then(firstQuerySucceeded)
        .fail(handleFail)
        .fin(start);

    function firstQuerySucceeded(result) {
        var ne = result[0];
        manager.detachEntity(ne);
        manager.attachEntity(ne);
        equal(ne.$tracker.entityState, entityStates.Unchanged, 'entity state is "Unchanged"');
    }
});

test('detach and add an unchanged entity', 1, function () {
    var manager = new beetle.EntityManager(service);
    var query = manager.createQuery('NamedEntities');
    stop();
    manager.executeQuery(query)
        .then(firstQuerySucceeded)
        .fail(handleFail)
        .fin(start);

    function firstQuerySucceeded(result) {
        var ne = result[0];
        manager.detachEntity(ne);
        manager.addEntity(ne);
        equal(ne.$tracker.entityState, entityStates.Added, 'entity state is "Added"');
    }
});

test('delete an unchanged entity', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities');
    stop();
    manager.executeQuery(query)
        .then(firstQuerySucceeded)
        .fail(handleFail)
        .fin(start);

    function firstQuerySucceeded(result) {
        var ne = result[0];
        manager.deleteEntity(ne);
        equal(ne.$tracker.entityState, entityStates.Deleted, 'entity state is "Deleted"');
    }
});

test('reject changes for a single entity', 3, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Addresses').top(1);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var a = data[0];
        var country = a.$tracker.getValue('Country');
        a.$tracker.setValue('Country', 'Test Name');

        equal(a.$tracker.entityState, entityStates.Modified, 'entity state is Modified');
        manager.rejectChanges(a);
        equal(a.$tracker.getValue('Country'), country, 'Country property is returned to the initial value');
        equal(a.$tracker.entityState, entityStates.Unchanged, 'entity state is Unchanged');
    }
});

test('reject changes with relations', 4, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').expand('NamedEntityType').top(2);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(neResult) {
        ok(neResult[0].$tracker.getValue('NamedEntityType'), 'NamedEntityType is loaded with NamedEntities');
        var ne = neResult[0];
        ne.$tracker.setValue('UserNameCreate', 'Tester_Name');
        var net = ne.$tracker.getValue('NamedEntityType');
        var name = net.$tracker.getValue('Name');
        net.$tracker.setValue('Name', 'Test_netName');

        equal(ne.$tracker.entityState, entityStates.Modified, 'entity state is Modified');
        manager.rejectChanges(ne, true);
        equal(net.$tracker.getValue('Name'), name, 'Name property is returned to the initial value');
        equal(ne.$tracker.entityState, entityStates.Unchanged, 'entity state is Unchanged');
    }
});

test('check if derived entity returned from base entity query', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.Entities;
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(eResult) {
        var e = eResult[0];
        notEqual(e.$tracker.entityType.shortName, 'Entity', 'derived entity returned from base entity query');
    }
});

test('test query with POST', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('TestPost').inlineCount().select('Id, Name').top(1);
    query = query.setParameter('shortId', 42);
    query = query.setParameter('person', { Name: 'Alan', Surname: 'Turing', BirthDate: new Date(Date.parse('1912-06-23')) });
    var ids = [1, 2, 3, 4, 5, 6, 7];
    query = query.setParameter('ids', ids);
    query = query.setParameter('name', "Knuth");
    stop();
    manager.executeQuery(query, { usePost: true })
        .then(firstQuerySucceeded)
        .fail(handleFail)
        .fin(start);

    function firstQuerySucceeded(data) {
        // and here is a sample how we can use queries like linq.
        var contains = data.q().where('Name == "Alan"').execute().length > 0;
        ok(!contains, 'POST query succeded.');
    }
});

module('query operator tests');

test('use equals null', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.OrderDetails.where('ProductNo', op.Equals, null);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 3, 'got all OrderDetails that does not have ProductNo');
    }
});

test('use equals', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.NamedEntityTypes.where('Name', op.Equals, 'NE_2');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 1, 'only one NamedEntityType is loaded');
    }
});

test('use not equal', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntityTypes').where('Name', op.NotEqual, 'NE_2');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 2, 'all NamedEntityTypes are loaded except the one named \'NE_2\'');
    }
});

test('use greater', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').where('TimeCreate', op.Greater, '2012/03/01');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 11, 'got all NamedEntity which has TimeCreate date greater than \'2013-04-01\'');
    }
});

test('use lesser', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').where('TimeCreate', op.Lesser, '2000-01-01');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 0, 'got all NamedEntity which has TimeCreate date lesser than \'2013-04-01\' (should be zero)');
    }
});

test('use contains', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntityTypes').where('Name', op.Contains, 'e_2');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var dName = data[0].$tracker.getValue('Name');
        equal(dName, 'NE_2', 'the NamedEntityType with the name \'Name_2\' is loaded');
    }
});

test('use startsWith', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('CompanyNo', op.StartsWith, 'C');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 5, 'got all Companies StartsWith "C"');
    }
});

test('use or', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities')
        .where('Name', op.Equals, 'Name_1').orGroup('Name', op.Equals, 'Name_2');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 2, 'got all NamedEntities named \'Name_2\' or \'Name_3\'');
    }
});

test('use and', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities')
        .where('Name', op.NotEqual, 'Name_1').andGroup('Name', op.NotEqual, 'Name_2');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 9, 'got all NamedEntities except ones named \'Name_2\' and \'Name_3\'');
    }
});

test('use complex where', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities')
        .where('Name', op.NotEqual, 'Name_1').where('IsCanceled', op.Equals, false) // second where equals to and
        .orGroup('Name', op.NotEqual, 'Name_2').and('IsCanceled', op.Equals, true);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded() {
        ok(true, 'complex query is executed');
    }
});

module('query operator string input tests');

test('use equals null', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('OrderDetails').where('ProductNo == null');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 3, 'got all OrderDetails that does not have ProductNo');
    }
});

test('use equals', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntityTypes').where('Name == \'NE_2\'');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 1, 'only one NamedEntityType is loaded');
    }
});

test('use not equal', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntityTypes').where('Name != "NE_2"');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 2, 'all NamedEntityTypes are loaded except the one named \'NE_2\'');
    }
});

test('use greater', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').where('TimeCreate > "2012/03/01"');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 11, 'got all NamedEntity which has TimeCreate date greater than \'2013-04-01\'');
    }
});

test('use lesser', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').where('TimeCreate < "2000-01-01"');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 0, 'got all NamedEntity which has TimeCreate date lesser than \'2013-04-01\' (should be zero)');
    }
});

test('use substringOf', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntityTypes').where('substringof("e_2", Name)');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var dName = data[0].$tracker.getValue('Name');
        equal(dName, 'NE_2', 'the NamedEntityType with the name \'Name_2\' is loaded');
    }
});

test('use startsWith', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('startsWith(CompanyNo, "C")');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 5, 'got all Companies StartsWith "C"');
    }
});

test('use or', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities')
        .where('Name == "Name_1" || Name == "Name_2"');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 2, 'got all NamedEntities named \'Name_2\' or \'Name_3\'');
    }
});

test('use and', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities')
        .where('Name != "Name_1" && Name != "Name_2"');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 9, 'got all NamedEntities except ones named \'Name_2\' and \'Name_3\'');
    }
});

test('use complex where', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities')
        .where('(Name != "Name_1" && IsCanceled == false) || (Name != "Name_2" && IsCanceled == true)');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded() {
        ok(true, 'complex query is executed');
    }
});

module('expression tests');

test('use ofType', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Entities').ofType('NamedEntity');
    stop();
    manager.executeQuery(query)
        .then(firstQuerySucceeded)
        .fail(handleFail)
        .fin(start);

    function firstQuerySucceeded(data) {
        var count = data.length;
        equal(count, 11, 'ofType succeeded, queried Entities, got NamedEntity.');
    }
});

test('use orderBy', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').orderBy('Name');
    stop();
    manager.executeQuery(query)
        .then(firstQuerySucceeded)
        .fail(handleFail);

    function firstQuerySucceeded(ordered) {
        manager.createQuery('NamedEntities').orderByDesc('Name')
            .execute()
            .then(secondQuerySucceeded)
            .fail(handleFail)
            .fin(start);

        function secondQuerySucceeded(descOrdered) {
            var l = ordered.length;
            ok(ordered[l - 1].$tracker.getValue('Name') == descOrdered[0].$tracker.getValue('Name')
                && ordered[1].$tracker.getValue('Name') == descOrdered[l - 2].$tracker.getValue('Name'),
                'orderBy and orderByDesc succeeded.');
        }
    }
});

test('use multiple orderBy', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').orderBy('Name, Description desc');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded() {
        ok(true, 'Orderby ascending and descending is successful');
    }
});

test('use expand (include)', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').expand('NamedEntityType').top(2);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(neResult) {
        ok(neResult[0].$tracker.getValue('NamedEntityType'), 'NamedEntityType is loaded with NamedEntities');
    }
});

test('use select', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').expand('Address').select(['CompanyNo', 'Address.City']).top(1);
    stop();
    manager.executeQuery(query)
        .then(firstQuerySucceeded)
        .fail(handleFail)
        .fin(start);

    function firstQuerySucceeded(data) {
        var c = data[0];
        ok(!c.Id, 'companies projected, got only CompanyNo and City (from Address relation)');
    }
});

test('use skip', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntityTypes').inlineCount().orderBy('Id').skip(1);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        equal(count, 2, 'got all NamedEntityTypes without first');
    }
});

test('use top', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities').inlineCount().top(1);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var count = data.length;
        var firstId = data[0].$tracker.getValue('Id');
        equal(count, 1, 'got one NamedEntity with Id: ' + firstId);
    }
});

test('use groupBy', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('OrderDetails')
        .groupBy('Order', 'Key as Order, count() as DetailCount'); // like Linq we can access group key as Key
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        var s = data.length == 3
            && data[0].$tracker.getValue('DetailCount') == 2
            && data[1].$tracker.getValue('DetailCount') == 2
            && data[2].$tracker.getValue('DetailCount') == 2;
        ok(s, 'groupBy succeeded, 3 orders returned with 2 order details.');
    }
});

test('use distinct', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('OrderDetails')
        .distinct('OrderId');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data.length == 3, 'groupBy succeeded, 3 orders returned with 2 order details.');
    }
});

test('use selectMany', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .selectMany('OrderDetails');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data.length == 6, 'selectMany succeeded, 6 order details returned.');
    }
});

test('use all', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .all('Price >= 42');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(result) {
        ok(result, 'all succeeded, all prices are equal to or greater than 42.');
    }
});

test('use any', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .any('Price == 42');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(result) {
        ok(result, 'all succeeded, there is an order with price of 42.');
    }
});

test('use avg', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .avg('Price');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(result) {
        ok(Number(result), 'avg succeeded, average price is ' + result + '.');
    }
});

test('use max', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .max('Price');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(result) {
        ok(Number(result), 'max succeeded, maximum price is ' + result + '.');
    }
});

test('use min', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .min('Price');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(result) {
        ok(Number(result), 'min succeeded, minimum price is ' + result + '.');
    }
});

test('use sum', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .sum('Price');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(result) {
        ok(Number(result), 'sum succeeded, summary of prices is ' + result + '.');
    }
});

test('use count', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .count('Price > 42');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(result) {
        ok(result == 2, 'count succeeded, there are 2 orders with a price greater than 42.');
    }
});

test('use first', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .orderBy('Price')
        .first();
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data.$tracker.getValue('Price') == 42, 'first succeeded.');
    }
});

test('use firstOrDefault', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .firstOrDefault('Price < 42');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data == null, 'firstOrDefault succeeded.');
    }
});

test('use single', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .orderBy('Price')
        .single('Price == 42');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data.$tracker.getValue('Price') == 42, 'single succeeded.');
    }
});

test('use singleOrDefault', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders')
        .singleOrDefault('Price < 42');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data == null, 'singleOrDefault succeeded.');
    }
});

module('query function tests');

test('use toupper', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('toupper(CompanyNo) != ""');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'toupper succeeded.');
    }
});

test('use tolower', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('tolower(CompanyNo) != ""');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'tolower succeeded.');
    }
});

test('use substring', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('substring(CompanyNo, 0, 3) == "Com"');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'substring succeeded.');
    }
});

test('use substringof', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('substringof("Com", CompanyNo) == true');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'substringof succeeded.');
    }
});

test('use length', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('length(CompanyNo) < 20');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'length succeeded.');
    }
});

test('use trim', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('trim(CompanyNo) == CompanyNo');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'trim succeeded.');
    }
});

test('use concat', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('concat(CompanyNo, UserNameCreate) != CompanyNo');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'concat succeeded.');
    }
});

test('use replace', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('replace(CompanyNo, "Com", "Moc") != CompanyNo');
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'replace succeeded.');
    }
});

test('use startswith', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('startswith(CompanyNo, "Com")');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'startswith succeeded.');
    }
});

test('use indexof', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Companies').where('indexof(CompanyNo, "long") > 0');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'indexof succeeded.');
    }
});

test('use round', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').where('round(Price) != Price');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'round succeeded.');
    }
});

test('use ceiling', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').where('ceiling(Price) != Price');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'ceiling succeeded.');
    }
});

test('use floor', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').where('floor(Price) != Price');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'floor succeeded.');
    }
});

test('use year', 1, function () {
    var manager = new EntityManager(service);
    var year = new Date().getYear();
    var query = manager.createQuery('Companies').where('year(TimeCreate) != @0', [year]);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'year succeeded.');
    }
});

test('use month', 1, function () {
    var manager = new EntityManager(service);
    var month = new Date().getMonth();
    var query = manager.createQuery('Companies').where('month(TimeCreate) != @0', [month]);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'month succeeded.');
    }
});

test('use day', 1, function () {
    var manager = new EntityManager(service);
    var day = new Date().getDay();
    var query = manager.createQuery('Companies').where('day(TimeCreate) != @0', [day]);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'day succeeded.');
    }
});

test('use hour', 1, function () {
    var manager = new EntityManager(service);
    var hour = new Date().getHours();
    var query = manager.createQuery('Companies').where('hour(TimeCreate) != @0', [hour]);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'hour succeeded.');
    }
});

test('use minute', 1, function () {
    var manager = new EntityManager(service);
    var minute = new Date().getMinutes();
    var query = manager.createQuery('Companies').where('minute(TimeCreate) != @0', [minute]);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'minute succeeded.');
    }
});

test('use second', 1, function () {
    var manager = new EntityManager(service);
    var second = new Date().getSeconds();
    var query = manager.createQuery('Companies').where('second(TimeCreate) != @0', [second]);
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'second succeeded.');
    }
});

test('use max', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').select('OrderDetails.max(Id)'); // we can call from collection
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'max succeeded.');
    }
});

test('use min', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').select('min(OrderDetails, Id)'); // or we can pass collection as parameter
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'min succeeded.');
    }
});

test('use sum', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').select('OrderDetails.sum(Id)');
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'sum succeeded.');
    }
});

test('use count', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').select('OrderDetails.count()');
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'count succeeded.');
    }
});

test('use avg', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').select('OrderDetails.avg(Id)');
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'avg succeeded.');
    }
});

test('use any', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').where('OrderDetails.any(od => od.Id > 1)');
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'avg succeeded.');
    }
});

test('use all', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('Orders').where('OrderDetails.all(od => od.Id > 1)');
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'all succeeded.');
    }
});

test('use contains', 1, function () {
    var manager = new EntityManager(service);
    var arr = [1, 2, 3];
    var query = manager.createQuery('Orders').where('contains(@0, Id)', [arr]);
    stop();
    manager.executeQuery(query, { useBeetleQueryStrings: true })
        .then(querySucceeded)
        .fail(handleFail)
        .fin(start);

    function querySucceeded(data) {
        ok(data, 'all succeeded.');
    }
});

module('save tests');

test('update an entity', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail);

    function querySucceeded(data) {
        var ne = data[0];
        var userName = 'Test Name ' + Math.floor((Math.random() * 100) + 1);
        ne.$tracker.setValue('UserNameCreate', userName);
        manager.saveChanges({ saveAction: 'UpdateEntity' })
            .then(saveSucceeded)
            .fail(handleFail)
            .fin(start);

        function saveSucceeded() {
            equal(ne.$tracker.getValue('UserNameCreate'), userName, 'entity is successfully updated');
        }
    }
});

test('delete an entity', 1, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail);

    function querySucceeded(neResult) {
        var ne = neResult[0];
        var shortId = ne.$tracker.getValue('ShortId');
        manager.deleteEntity(ne);
        manager.saveChanges()
            .then(saveSucceeded)
            .fail(handleFail);

        function saveSucceeded() {
            manager.executeQuery(manager.createQuery('NamedEntities').where('ShortId', op.Equals, shortId))
                .then(secondQuerySucceeded)
                .fail(handleFail)
                .fin(start);

            function secondQuerySucceeded(result) {
                equal(result.length, 0, 'entity is deleted');
            }
        }
    }
});

test('can update and delete in one batch', 2, function () {
    var manager = new EntityManager(service);
    var query = manager.createQuery('NamedEntities');
    stop();
    manager.executeQuery(query)
        .then(querySucceeded)
        .fail(handleFail);

    function querySucceeded(data) {
        var ne1 = data[0];
        var ne2 = data[8];
        var count = data.length;
        ne1.$tracker.setValue('UserNameCreate', 'Tester Name');
        manager.deleteEntity(ne2);

        manager.saveChanges()
            .then(saveSucceeded)
            .fail(handleFail);

        function saveSucceeded() {
            equal(ne1.$tracker.getValue('UserNameCreate'), 'Tester Name', 'entity is updated successfully');

            manager.executeQuery(manager.createQuery('NamedEntities'))
               .then(secondQuerySucceeded)
               .fail(handleFail)
               .fin(start);

            function secondQuerySucceeded(sdata) {
                var scount = sdata.length;
                equal(count, scount + 1, 'entity is deleted successfully');
            }
        }
    }
});

if (metadata !== false) {
    module('validation tests');

    test('check required', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('PostalCode', '');
        var err = add.$tracker.validate().q().single('(property.name == "PostalCode") && (validator.name == "Required")');
        ok(err, err.message);

        add.$tracker.setValue('PostalCode', '12345');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "PostalCode") && (validator.name == "required")');
        ok(!err, 'required validation is working');
    });

    test('check string length', 3, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('PostalCode', '1');
        var err = add.$tracker.validate().q().single('(property.name == "PostalCode") && (validator.name == "StringLength")');
        ok(err, err.message);

        add.$tracker.setValue('PostalCode', '1234567');
        err = add.$tracker.validate().q().single('(property.name == "PostalCode") && (validator.name == "StringLength")');
        ok(err, err.message);

        add.$tracker.setValue('PostalCode', '12345');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "PostalCode") && (validator.name == "StringLength")');
        ok(!err, 'string length validation is working');
    });

    test('check min length', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('City', '1');
        var err = add.$tracker.validate().q().single('(property.name == "City") && (validator.name == "MinLength")');
        ok(err, err.message);

        add.$tracker.setValue('City', '12345');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "City") && (validator.name == "MinLength")');
        ok(!err, 'min length validation is working');
    });

    test('check max length', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('City', '12345678901');
        var err = add.$tracker.validate().q().single('(property.name == "City") && (validator.name == "MaxLength")');
        ok(err, err.message);

        add.$tracker.setValue('City', '12345');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "City") && (validator.name == "MaxLength")');
        ok(!err, 'max length validation is working');
    });

    test('check range', 3, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('DoorNumber', 123);
        var err = add.$tracker.validate().q().single('(property.name == "DoorNumber") && (validator.name == "Range")');
        ok(err, err.message);

        add.$tracker.setValue('DoorNumber', 1234567);
        err = add.$tracker.validate().q().single('(property.name == "DoorNumber") && (validator.name == "Range")');
        ok(err, err.message);

        add.$tracker.setValue('DoorNumber', 12345);
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "DoorNumber") && (validator.name == "Range")');
        ok(!err, 'range validation is working');
    });

    test('check email', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('Extra', 'alan-et-turing.com');
        var err = add.$tracker.validate().q().single('(property.name == "Extra") && (validator.name == "EmailAddress")');
        ok(err, err.message);

        add.$tracker.setValue('Extra', 'alan@turing.com');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "Extra") && (validator.name == "EmailAddress")');
        ok(!err, 'email validation is working');
    });

    test('check credit card', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('Extra', '3782224631005');
        var err = add.$tracker.validate().q().single('(property.name == "Extra") && (validator.name == "CreditCard")');
        ok(err, err.message);

        add.$tracker.setValue('Extra', '5555555555554444');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "Extra") && (validator.name == "CreditCard")');
        ok(!err, 'credit card validation is working');
    });

    test('check url', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('Extra', 'beetlejs');
        var err = add.$tracker.validate().q().single('(property.name == "Extra") && (validator.name == "Url")');
        ok(err, err.message);

        add.$tracker.setValue('Extra', 'http://beetlejs.codeplex.com');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "Extra") && (validator.name == "Url")');
        ok(!err, 'url validation is working');
    });

    test('check phone', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('Extra', '55544');
        var err = add.$tracker.validate().q().single('(property.name == "Extra") && (validator.name == "Phone")');
        ok(err, err.message);

        add.$tracker.setValue('Extra', '5554443322');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "Extra") && (validator.name == "Phone")');
        ok(!err, 'phone validation is working');
    });

    test('check postal code', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('PostalCode', '123');
        var err = add.$tracker.validate().q().single('(property.name == "PostalCode") && (validator.name == "PostalCode")');
        ok(err, err.message);

        add.$tracker.setValue('PostalCode', '12345-6789');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "PostalCode") && (validator.name == "PostalCode")');
        ok(!err, 'postal code validation is working');
    });

    test('check time', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('Extra', '123');
        var err = add.$tracker.validate().q().single('(property.name == "Extra") && (validator.name == "Time")');
        ok(err, err.message);

        add.$tracker.setValue('Extra', '12:34:56');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "Extra") && (validator.name == "Time")');
        ok(!err, 'time validation is working');
    });

    test('check regular expression', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('Extra', 4);
        var err = add.$tracker.validate().q().single('(property.name == "Extra") && (validator.name == "RegularExpression")');
        ok(err, err.message);

        add.$tracker.setValue('Extra', 8);
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "Extra") && (validator.name == "RegularExpression")');
        ok(!err, 'regular expression validation is working');
    });

    test('check compare', 2, function () {
        var manager = new EntityManager(service);
        var add = new manager.Address();

        add.$tracker.setValue('Extra', 'Test');
        add.$tracker.setValue('Extra2', 'Test2');
        var err = add.$tracker.validate().q().single('(property.name == "Extra") && (validator.name == "Compare")');
        ok(err, err.message);

        add.$tracker.setValue('Extra2', 'Test');
        err = add.$tracker.validate().q().singleOrDefault('(property.name == "Extra") && (validator.name == "Compare")');
        ok(!err, 'compare validation is working');
    });

    module('metadata tests');

    test('add a new entity', 1, function () {
        var manager = new EntityManager(service);
        var name = 'Test Name';
        var id = beetle.helper.createGuid();
        var ne = new manager.NamedEntity({ Id: id, Name: name });
        ne.$tracker.setValue('Description', 'Test Description');
        ne.$tracker.setValue('UserNameCreate', 'Test User Name');
        ne.$tracker.setValue('TimeCreate', new Date());
        ne.$tracker.setValue('IsCanceled', false);

        var net = manager.createEntity('NamedEntityType');
        net.$tracker.setValue('Id', beetle.helper.createGuid());
        net.$tracker.getValue('Name', 'Test NamedEntityType');
        ne.$tracker.setValue('NamedEntityType', net);

        stop();
        manager.saveChanges()
            .then(saveSucceeded)
            .fail(handleFail);

        function saveSucceeded() {
            var query = manager.createQuery('NamedEntities').where('Id == @0', [id]);
            manager.executeQuery(query, beetle.mergeStrategy.NoTracking)
                .then(querySucceeded)
                .fail(handleFail)
                .fin(start);
        }

        function querySucceeded(neResult) {
            equal(neResult.length, 1, 'entity added succesfully');
        }
    });

    test('get Entity by Id', 1, function () {
        var manager = new EntityManager(service);
        var ne = manager.createEntity('Entity');
        var id = beetle.helper.createGuid();
        ne.$tracker.setValue('Id', id);
        ne.$tracker.setValue('UserNameCreate', 'Test User Name');
        ne.$tracker.setValue('TimeCreate', new Date());
        ne.$tracker.setValue('IsCanceled', false);

        stop();
        manager.saveChanges()
            .then(saveSucceeded)
            .fail(handleFail);

        function saveSucceeded() {
            var query = manager.createQuery('Entities').where('Id', op.Equals, id);
            manager.executeQuery(query, beetle.mergeStrategy.NoTracking)
                .then(querySucceeded)
                .fail(handleFail)
                .fin(start);
        }

        function querySucceeded(neResult) {
            var count = neResult.length;
            equal(count, 1, 'Entity is loaded succesfully');
        }
    });

    test('check if generated value populated after save', 2, function () {
        var manager = new EntityManager(service);
        var e = manager.createEntity('Entity');
        e.$tracker.setValue('Id', beetle.helper.createGuid());
        e.$tracker.setValue('UserNameCreate', 'Test User Name');
        e.$tracker.setValue('TimeCreate', new Date());
        e.$tracker.setValue('IsCanceled', false);
        ok(e.$tracker.getValue('ShortId') <= 0, 'ShortId should not have a value greater than zero');

        stop();
        manager.saveChanges()
            .then(saveSucceeded)
            .fail(handleFail)
            .fin(start);

        function saveSucceeded() {
            ok(e.$tracker.getValue('ShortId') > 0, 'ShortId value populated');
        }
    });

    test('test auto-increment keys, add two order', 1, function () {
        var manager = new EntityManager(service);
        var o1 = manager.createEntity('Order');
        o1.$tracker.setValue('OrderNo', 'O_0001');
        o1.$tracker.setValue('Price', 123.45);
        var o2 = manager.createEntity('Order');
        o2.$tracker.setValue('OrderNo', 'O_0002');
        o2.$tracker.setValue('Price', 678.09);

        var od1 = manager.createEntity('OrderDetail');
        od1.$tracker.setValue('ProductNo', 'P_0001');
        od1.$tracker.setValue('Order', o1);
        var od2 = manager.createEntity('OrderDetail');
        od2.$tracker.setValue('ProductNo', 'P_0002');
        od2.$tracker.setValue('Order', o1);
        var od3 = manager.createEntity('OrderDetail');
        od3.$tracker.setValue('ProductNo', 'P_0003');
        od3.$tracker.setValue('Order', o2);
        var od4 = manager.createEntity('OrderDetail');
        od4.$tracker.setValue('ProductNo', 'P_0004');
        od4.$tracker.setValue('Order', o2);

        stop();
        manager.saveChanges()
            .then(saveSucceeded)
            .fail(handleFail)
            .fin(start);

        function saveSucceeded() {
            ok(o1.$tracker.getValue('Id') > 0 && o1.$tracker.getValue('Id') == od2.$tracker.getValue('OrderId')
                && od1.$tracker.getValue('Id') > 0 && o2.$tracker.getValue('Id') > 0
                && o2.$tracker.getValue('Id') == od3.$tracker.getValue('OrderId') && od4.$tracker.getValue('Id') > 0,
                'Order and OrderDetail saved and generated keys are populated');
        }
    });

    test('load first NamedEntity and all NamedEntityTypes separately and check if relation is fixed', 2, function () {
        var manager = new EntityManager(service);
        var neQuery = manager.createQuery('NamedEntities').top(1);
        stop();
        manager.executeQuery(neQuery)
            .then(neQuerySucceeded)
            .fail(handleFail);

        function neQuerySucceeded(result) {
            var ne = result[0];
            equal(ne.$tracker.getValue('NamedEntityType'), null, 'NamedEntity is loaded, NamedEntityType is null');

            var netQuery = manager.createQuery('NamedEntityTypes');
            manager.executeQuery(netQuery, { autoFixPlural: true })
                .then(netQuerySucceeded)
                .fail(handleFail)
                .fin(start);

            function netQuerySucceeded() {
                notEqual(ne.$tracker.getValue('NamedEntityType'), null, 'NamedEntityTypes are loaded, NamedEntityType relation is fixed');
            }
        }
    });

    test('invalid assign to scalar navigation property', 1, function () {
        var manager = new EntityManager(service);
        var neQuery = manager.createQuery('NamedEntities');
        stop();
        manager.executeQuery(neQuery)
            .then(neQuerySucceeded)
            .fail(handleFail);

        var ne;
        function neQuerySucceeded(neResult) {
            ne = neResult[0];
            var netQuery = manager.createQuery('NamedEntityTypes');
            manager.executeQuery(netQuery)
                .then(netQuerySucceeded)
                .fail(handleFail)
                .fin(start);
        }

        function netQuerySucceeded(netResult) {
            var net = netResult[0];
            try {
                ne.$tracker.setValue('Parent', net);
                ok(false, 'setting NamedEntity typed property with NamedEntityType typed property should not be permitted');
            } catch (e) {
                ok(true, 'setting NamedEntity typed property with NamedEntityType typed property is not permitted');
            }
        }
    });

    test('invalid assign to plural navigation property', 2, function () {
        var manager = new EntityManager(service);
        var neQuery = manager.createQuery('NamedEntities');
        stop();
        manager.executeQuery(neQuery)
            .then(neQuerySucceeded)
            .fail(handleFail);

        var ne;
        function neQuerySucceeded(neResult) {
            ne = neResult[0];
            var ne1 = neResult[1];
            ne.$tracker.getValue('Children').push(ne1);
            equal(ne1.$tracker.getValue('Parent'), ne, 'can set NamedEntity to a VersionedEntity typed property');

            var netQuery = manager.createQuery('NamedEntityTypes');
            manager.executeQuery(netQuery)
                .then(netQuerySucceeded)
                .fail(handleFail)
                .fin(start);
        }

        function netQuerySucceeded(netResult) {
            var net = netResult[0];
            try {
                ne.$tracker.getValue('Children').push(net);
                ok(false, 'should not add NamedEntityType to a VersionedEntity typed property.');
            } catch (e) {
                ok(true, 'cannot add NamedEntityType to a VersionedEntity typed property.');
            }
        }
    });

    test('two-way navigation fix', 2, function () {
        var manager = new EntityManager(service);
        var net = manager.createEntity('NamedEntityType');
        var ne = manager.createEntity('NamedEntity');

        net.NamedEntities.push(ne);
        equal(ne.$tracker.getValue('NamedEntityType'), net, 'other sides scalar navigation fixed after adding to plural navigation property ');
        equal(net.$tracker.getValue('NamedEntities')[0], ne, 'other sides scalar navigation should be fixed after adding to plural navigation property');
    });

    test('foreign key related navigation fix', 1, function () {
        var manager = new EntityManager(service);
        var net = manager.createEntity('NamedEntityType');
        var ne = manager.createEntity('NamedEntity');

        var newId = beetle.helper.createGuid();
        net.$tracker.setValue('Id', newId);
        ne.$tracker.setValue('NamedEntityTypeId', newId);
        equal(ne.$tracker.getValue('NamedEntityType'), net, 'navigation fixed after setting foreign-key');
    });

    test('primary key conflict control', 1, function () {
        var manager = new EntityManager(service);
        var query = manager.createQuery('NamedEntities');
        stop();
        manager.executeQuery(query)
            .then(querySucceeded)
            .fail(handleFail)
            .fin(start);

        function querySucceeded(neResult) {
            var ne = neResult[0];
            var ne1 = neResult[1];
            try {
                ne.$tracker.setValue('Id', ne1.$tracker.getValue('Id'));
                ok(false, 'should not assign primary key');
            } catch (e) {
                ok(true, 'cannot assign primary key');
            }
        }
    });

    test('primary key change triggers foreign key updates for related entities', 1, function () {
        var manager = new EntityManager(service);
        var net = manager.createEntity('NamedEntityType');
        var ne = manager.createEntity('NamedEntity');

        net.$tracker.getValue('NamedEntities').push(ne);
        net.$tracker.setValue('Id', beetle.helper.createGuid());
        equal(ne.$tracker.getValue('NamedEntityTypeId'), net.$tracker.getValue('Id'), 'scalar navigation property fixed after setting new primary key');
    });

    test('detached entity foreign key preserve control', 1, function () {
        var manager = new EntityManager(service);
        var net = manager.createEntity('NamedEntityType');
        var ne = manager.createEntity('NamedEntity');

        ne.$tracker.setValue('Id', beetle.helper.createGuid());
        net.$tracker.setValue('Id', beetle.helper.createGuid());
        ne.$tracker.setValue('NamedEntityType', net);
        manager.detachEntity(ne);
        manager.attachEntity(ne);

        ok(ne.$tracker.getValue('NamedEntityType') == net, 'after attaching a detached entity, scalar navigation properties fixed to pre-detached state');
    });

    test('automatically add detached entities to cache when adding to a plural navigation property', 1, function () {
        var manager = new EntityManager(service);
        var net = manager.createEntity('NamedEntityType');
        var ne = manager.createEntity('NamedEntity');

        manager.detachEntity(net);
        ne.$tracker.setValue('NamedEntityType', net);
        equal(net.$tracker.entityState, entityStates.Added, 'entity state is Added');
    });

    test('automatically add detached entities to cache when setting to a scalar navigation property', 1, function () {
        var manager = new EntityManager(service);
        var net = manager.createEntity('NamedEntityType');
        var ne = manager.createEntity('NamedEntity');

        manager.detachEntity(ne);
        net.$tracker.getValue('NamedEntities').push(ne);
        equal(ne.$tracker.entityState, entityStates.Added, 'entity state is Added');
    });

    test('mergeStrategy Overwrite check', 1, function () {
        var manager = new EntityManager(service);
        var neQuery = manager.createQuery('NamedEntities');
        stop();
        manager.executeQuery(neQuery)
            .then(neQuerySucceeded)
            .fail(handleFail);

        var ne;
        function neQuerySucceeded(neResult) {
            ne = neResult[0];
            ne.$tracker.setValue('IsCanceled', true);
            var ne2Query = manager.createQuery('NamedEntities');
            manager.executeQuery(ne2Query, beetle.mergeStrategy.Overwrite)
                .then(ne2QuerySucceeded)
                .fail(handleFail)
                .fin(start);
        }

        function ne2QuerySucceeded() {
            ok(ne.$tracker.getValue('IsCanceled') === false, 'value is overwritten');
        }
    });

    test('mergeStrategy Preserve check', 2, function () {
        var manager = new EntityManager(service);
        var neQuery = manager.createQuery('NamedEntities');
        stop();
        manager.executeQuery(neQuery)
            .then(neQuerySucceeded)
            .fail(handleFail);

        var ne;
        function neQuerySucceeded(neResult) {
            ne = neResult[0];
            ne.$tracker.setValue('IsCanceled', true);
            var ne2Query = manager.createQuery('NamedEntities');
            manager.executeQuery(ne2Query, beetle.mergeStrategy.Preserve)
                .then(ne2QuerySucceeded)
                .fail(handleFail)
                .fin(start);
        }

        function ne2QuerySucceeded(neMResult) {
            var neM = neMResult[0];
            equal(ne, neM, 'entity is preserved');
            ok(ne.$tracker.getValue('IsCanceled') === true, 'value is preserved');
        }
    });

    test('mergeStrategy ThrowError check', 1, function () {
        var manager = new EntityManager(service);
        var netQuery = manager.createQuery('NamedEntityTypes');
        stop();
        manager.executeQuery(netQuery)
            .then(netQuerySucceeded)
            .fail(handleFail);

        function netQuerySucceeded() {
            var net2Query = manager.createQuery('NamedEntityTypes');
            manager.executeQuery(net2Query, beetle.mergeStrategy.ThrowError)
            .then(function () {
                ok(false, 'entity should not be overwritten');
            })
            .fail(function () {
                ok(true, 'entity cannot be overwritten');
            })
            .fin(start);
        }
    });

    test('executionStrategy Both check', 2, function () {
        var manager = new EntityManager(service);
        var oQuery = manager.createEntityQuery('Order', 'Orders').inlineCount().top(1);
        stop();
        manager.executeQuery(oQuery)
            .then(function(data) {
                var serverCount = data.$inlineCount;
                manager.deleteEntity(data[0]);
                var o1 = manager.createEntity('Order');
                manager.createEntity('Order');

                manager.executeQuery(oQuery, { execution: beetle.enums.executionStrategy.Both })
                    .then(function(bothData) {
                        equal(bothData[0], o1, 'deleted entity is skipped');
                        equal(bothData.$inlineCount, serverCount + 1, 'inlineCount is corrected');
                    })
                    .fail(handleFail)
                    .fin(start);
            })
            .fail(handleFail);
    });

    test('Setting an entity property value to itself dosen\'t trigger entityState change', 1, function () {
        var manager = new EntityManager(service);
        var ne = manager.createDetachedEntity('NamedEntity');
        ne.$tracker.setValue('Id', beetle.helper.createGuid());
        ne.$tracker.setValue('IsCanceled', true);
        manager.attachEntity(ne);
        ne.$tracker.setValue('IsCanceled', ne.$tracker.getValue('IsCanceled'));

        ok(ne.$tracker.entityState === entityStates.Unchanged, 'state is still Unchanged');
    });

    test('navigation fix after primary key changed', 1, function () {
        stop();

        var manager = new EntityManager(service);
        manager.createEntityAsync('NamedEntity')
            .then(firstQuerySucceeded)
            .fail(handleFail);

        var ne, net;
        function firstQuerySucceeded(result) {
            ne = result;
            manager.createEntityAsync('NamedEntityType')
                .then(secondQuerySucceeded)
                .fail(handleFail)
                .fin(start);
        }

        function secondQuerySucceeded(result) {
            net = result;
            net.$tracker.setValue('Id', beetle.helper.createGuid());
            ne.$tracker.setValue('NamedEntityTypeId', net.$tracker.getValue('Id'));
            equal(ne.$tracker.getValue('NamedEntityType'), net, 'navigation are fixed after pk changed');
        }
    });

    test('data property type check before setting the values', 12, function () {
        var manager = new EntityManager(service);
        var com = manager.createEntity('Company');
        var ord = manager.createEntity('Order');

        try {
            com.$tracker.setValue('TimeCreate', 'try string');
            ok(false, 'should not set date with string');
        } catch (e) {
            ok(true, 'cannot set date with string');
        }
        try {
            com.$tracker.setValue('Id', 'try string');
            ok(false, 'should not set guid with string');
        } catch (e) {
            ok(true, 'cannot set guid with string');
        }
        try {
            com.$tracker.setValue('UserNameCreate', 2);
            ok(true, 'can set string with number');
        } catch (e) {
            ok(false, 'could have set string with number');
        }
        try {
            com.$tracker.setValue('IsCanceled', 'try string');
            ok(false, 'should not set boolean with string');
        } catch (e) {
            ok(true, 'cannot set boolean with string');
        }
        try {
            com.$tracker.setValue('ShortId', 'try string');
            ok(false, 'should not set int with string');
        } catch (e) {
            ok(true, 'cannot set int with string');
        }
        try {
            com.$tracker.setValue('ShortId', 123.45);
            ok(false, 'should not set int with float');
        } catch (e) {
            ok(true, 'cannot set int with float');
        }
        try {
            ord.$tracker.setValue('Price', 'try string');
            ok(false, 'should not set number with string');
        } catch (e) {
            ok(true, 'cannot set number with string');
        }
        try {
            ord.$tracker.setValue('Price', 123);
            ok(true, 'can set number with int');
        } catch (e) {
            ok(false, 'could have set number with int');
        }
        try {
            com.$tracker.setValue('CompanyType', 'try string');
            ok(false, 'should not set enum with unknown string');
        } catch (e) {
            ok(true, 'cannot set enum with unknown string');
        }
        try {
            com.$tracker.setValue('CompanyType', 'Supplier');
            ok(true, 'can set enum with known string');
        } catch (e) {
            ok(false, 'could have set enum with known string');
        }
        try {
            com.$tracker.setValue('CompanyType', 1);
            ok(true, 'can set enum with known number');
        } catch (e) {
            ok(false, 'could have set enum with known number');
        }
        try {
            com.$tracker.setValue('CompanyType', manager.dataService.metadataManager.enums.CompanyType.Supplier);
            ok(true, 'can set enum with enum member');
        } catch (e) {
            ok(false, 'could have set enum with enum member');
        }
    });

    test('set data property without event fire', 2, function () {
        var manager = new EntityManager(service);
        var com = manager.createEntity('Company');

        var expected = true;
        com.$tracker.propertyChanged.subscribe(function() {
            ok(expected, 'data property changed event fire is expected');
        });

        com.$tracker.setValue('UserNameCreate', 'Nikola');
        expected = false;
        com.$tracker.setValue('UserNameCreate', new beetle.core.ValueNotifyWrapper('Tesla'));
        equal(com.$tracker.getValue('UserNameCreate'), 'Tesla', 'data property changed with ValueNotifyWrapper');
    });
}
else
    test('Some tests could not be run without metadata.', 0, function () {
        toastr.warning('Some tests could not be run without metadata.');
    });

module('local query tests'); // below tests use linq like approach so they need beetle array extensions

test('query operator tests', 12, function () {
    equal(testArray.where('Price == 400').length, 1, 'equals succeeded.');
    equal(testArray.where('Price != 400').length, 4, 'not equal succeeded.');
    equal(testArray.where('Price > 400').length, 3, 'greater succeeded.');
    equal(testArray.where('Price >= 400').length, 4, 'greater or equals to succeeded.');
    equal(testArray.where('Price < 400').length, 1, 'lesser succeeded.');
    equal(testArray.where('Price <= 400').length, 2, 'lesser or equals to succeeded.');
    equal(testArray.where('substringof("d1", Name)').length, 1, 'substringOf succeeded.');
    equal(testArray.where('startsWith(Name, "Ord")').length, 5, 'startsWith succeeded.');
    equal(testArray.where('endsWith(Name, "d3")').length, 1, 'endsWith succeeded.');
    equal(testArray.where('(Name == "Ord1") || (Name == "Ord2")').length, 2, 'or succeeded.');
    equal(testArray.where('(Name == "Ord1") && (Price == 400)').length, 1, 'and succeeded.');
    equal(testArray.where('(((Name == "Ord1") && (Price > 200)) || ((Name == "Ord5") && (Price < 2000)))').length, 2, 'and succeeded.');
});

test('query expression tests', 38, function () {
    var orderBy = testArray.orderBy('Price').x(); // we manually trigger execution (auto execution occurs when a 'length' call is made)
    ok(orderBy[0].Price == 231.58, 'orderBy succeeded.');

    var multiOrderBy = testArray.orderBy('Price desc, Date').x();
    ok(multiOrderBy[1].Name == 'Ord3', 'multi orderBy succeeded.');

    var select = testArray.select('Name as orderName, Customer.Name as customerName').x();
    ok(select.length == 5 && select[0]['orderName'] && select[0]['customerName'], 'select succeeded.');

    equal(testArray.skip(1).length, 4, 'skip succeeded.');
    ok(testArray.top(3).length == 3 && testArray.take(3).length == 3, 'top (take) succeeded.');

    var groupBy = testArray.groupBy('Customer.Name', 'Key as Customer, sum(Details.sum(d => d.Count)) as Total').x();
    ok(groupBy[2].Customer == 'Cus3' && groupBy[2].Total == 320, 'groupBy succeeded.');

    var distinct = testArray.distinct('Customer.Name');
    ok(distinct.length == 4, 'distinct succeeded.');

    var selectMany = testArray.selectMany('Details');
    ok(selectMany.length == 16, 'selectMany succeeded.');

    var all = testArray.all('Price > 200');
    ok(all, 'all succeeded.');

    var any = testArray.any('Price < 240');
    ok(any, 'any succeeded.');

    var avg = testArray.avg('Price');
    equal(avg, 726.4, 'avg succeeded.');

    var max = testArray.max('Price');
    equal(max, 1125, 'max succeeded.');

    var min = testArray.min('Price');
    equal(min, 231.58, 'min succeeded.');

    var sum = testArray.sum('Price');
    equal(sum, 3632, 'sum succeeded.');

    var count = testArray.count('Price > 500');
    equal(count, 3, 'count succeeded.');

    var first = testArray.first('Price > 600');
    equal(first.Name, 'Ord2', 'first succeeded.');

    var firstOrDefault = testArray.firstOrDefault('Price > 2000');
    equal(firstOrDefault, null, 'firstOrDefault succeeded.');

    var single = testArray.single('Customer.Name === "Cus9"');
    equal(single.Name, 'Ord2', 'single succeeded.');

    var singleOrDefault = testArray.singleOrDefault('Price < 150');
    equal(singleOrDefault, null, 'singleOrDefault succeeded.');

    var last = testArray.last('Price > 600');
    equal(last.Name, 'Ord5', 'last succeeded.');

    var lastOrDefault = testArray.lastOrDefault('Details.all(Product != "Prd7")');
    equal(lastOrDefault.Name, 'Ord3', 'lastOrDefault succeeded.');

    var aggregate = testArray.aggregate(function (agg, item) { return agg + item.Price; }, 0);
    ok(aggregate == sum, 'aggregate succeeded.');

    var arr1 = [{ Id: 1, Name: 'Arr1-1' }, { Id: 2, Name: 'Arr1-2' }, { Id: 3, Name: 'Arr1-3' }];
    var arr2 = [{ Id: 3, Name: 'Arr1-3' }, { Id: 4, Name: 'Arr1-4' }, { Id: 5, Name: 'Arr1-5' }, { Id: 6, Name: 'Arr1-6' }];

    var concat = arr1.q().concat(arr2).x();
    ok(concat.length == arr1.length + arr2.length, 'concat succeeded.');

    var contains = arr1.contains({ Id: 2, Name: 'Arr1-2' });
    ok(contains, 'contains succeeded.');

    var except = arr1.except(arr2);
    ok(except.length == arr1.length - 1, 'except succeeded.');

    var groupJoin = arr1.groupJoin(arr2, 'Id', 'Id', function (a, b) {
        return { Id: a.Id, Count: b.length };
    }).x();
    ok(groupJoin.length == 3 && groupJoin[2].Count == 1, 'groupJoin succeeded.');

    var intersect = arr1.intersect(arr2);
    ok(intersect.length == 1, 'intersect succeeded.');

    var a1 = [{ Id: 1 }, { Id: 2 }, { Id: 3 }];
    var a2 = [{ Id: 1, MasterId: 1 }, { Id: 2, MasterId: null }, { Id: 3, MasterId: 2 }, { Id: 4, MasterId: 2 }, { Id: 5, MasterId: null }];

    var innerJoin = a1.innerJoin(a2, "Id", "MasterId").x();
    ok(innerJoin.length == 3 && innerJoin[0].MasterId == 1, 'inner join succeeded.');

    var leftJoin = a1.leftJoin(a2, "Id", "MasterId").x();
    ok(leftJoin.length == 4 && leftJoin[2].MasterId == 2, 'left join succeeded.');

    var rightJoin = a1.rightJoin(a2, "Id", "MasterId").x();
    ok(rightJoin.length == 5 && rightJoin[4].MasterId == null, 'right join succeeded.');

    var fullJoin = a1.fullJoin(a2, "Id", "MasterId").x();
    ok(fullJoin.length == 6 && fullJoin[5].MasterId == null, 'full join succeeded.');

    var crossJoin = a1.crossJoin(a2).x();
    ok(crossJoin.length == 15 && crossJoin[10].MasterId == 1, 'cross join succeeded.');

    var toLookup = testArray.toLookup('Customer.Name', function (items, key) {
        return { Customer: key, Total: items.sum('Details.sum(Count)') };
    }).x();
    var toLookupOk = toLookup.sequenceEqual(groupBy);
    ok(toLookupOk, 'sequenceEqual succeeded.');
    ok(toLookupOk, 'toLookup succeeded.');

    var union = arr1.union(arr2);
    ok(union.length == arr1.length + arr2.length - 1, 'union succeeded.');

    var zip = arr1.zip(arr2, function (a, b) {
        return { id: a.Id + b.Name[0] };
    });
    ok(zip.length == 3, 'zip succeeded.');

    var range = Array.range(40, 4);
    ok(range.length == 4 && range[1] == 41 && range[2] == 42, 'range succeeded.');

    var repeat = Array.repeat(4, 2);
    ok(repeat[0] == 4 && repeat[1] == 4, 'repeat succeeded.');
});

test('query function tests', 27, function () {
    var toupper = testArray.where('toUpper(Name) == "ORD1"');
    equal(toupper.length, 1, 'toUpper succeeded.');

    var tolower = testArray.where('tolower(Name) == "ord1"'); // method names are case-insensitive
    equal(tolower.length, 1, 'toLower succeeded.');

    var substring = testArray.where('substring(Name, 2, 2) == "d1"');
    equal(substring.length, 1, 'substring succeeded.');

    var substringof = testArray.where('substringof(Name, "HeyOrd1Test")');
    equal(substringof.length, 1, 'substringof succeeded.');

    var length = testArray.where('Details.length == 1');
    equal(length.length, 1, 'length succeeded.');

    var trim = testArray.where('Details.any(d => d.Supplier != trim(d.Supplier))'); // we can use aliases to avoid property name collisions
    equal(trim.length, 1, 'trim succeeded.');

    var concat = testArray.select('concat(Name, "-", Customer.Name)').first();
    equal(concat, 'Ord1-Cus4', 'concat succeeded.');

    var replace = testArray.where('Name == "Ord1"').select('replace(Name, "rd", "rrdd")').first();
    equal(replace, 'Orrdd1', 'replace succeeded.');

    var startsWith = testArray.where('startsWith(Name, "Ord1")');
    equal(startsWith.length, 1, 'startsWith succeeded.');

    var indexOf = testArray.where('indexOf(Name, "d4") == 2');
    equal(indexOf.length, 1, 'indexOf succeeded.');

    var round = testArray.where('round(Price) != Price').select('round(Price)').first();
    ok(round == 750, 'round succeeded.');

    var ceiling = testArray.where('ceiling(Price) != Price').select('ceiling(Price)').first();
    ok(ceiling == 751, 'ceiling succeeded.');

    var floor = testArray.where('floor(Price) != Price').select('floor(Price)').first();
    ok(floor == 750, 'floor succeeded.');

    var year = testArray.count('year(Date) == 2013');
    equal(year, 1, 'year succeeded.');

    var month = testArray.count('month(Date) == 11');
    equal(month, 1, 'month succeeded.');

    var day = testArray.count('day(Date) == 30');
    equal(day, 1, 'day succeeded.');

    var hour = testArray.count('hour(Date) == 12');
    equal(hour, 1, 'hour succeeded.');

    var minute = testArray.count('minute(Date) == 42');
    equal(minute, 1, 'minute succeeded.');

    var second = testArray.count('second(Date) == 1');
    equal(second, 1, 'second succeeded.');

    var max = testArray.select('Details.max(Count)').orderByDesc().first();
    equal(max, 86, 'max succeeded.');

    var min = testArray.select('Details.min(Count)').orderByDesc().first();
    equal(min, 5, 'min succeeded.');

    var sum = testArray.select('Details.sum(Count)').orderByDesc().first();
    equal(sum, 212, 'sum succeeded.');

    var count = testArray.select('Details.count()').orderByDesc().first();
    equal(count, 6, 'count succeeded.');

    var avg = testArray.select('floor(Details.avg(Count))').orderByDesc().first();
    equal(avg, 35, 'avg succeeded.');

    var any = testArray.where('Details.any(Count < 4)');
    equal(any.length, 1, 'any succeeded.');

    var all = testArray.where('Details.all(Count > 4)');
    equal(all.length, 1, 'all succeeded.');

    var contains = testArray.where('@0.contains(Name)').x([['Ord2', 'Ord4']]);
    equal(contains.length, 2, 'contains succeeded.');
});
