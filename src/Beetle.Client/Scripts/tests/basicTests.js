var service = new beetle.MvcService("Home", false);
test("get all entities", 1, function () {
    var manager = new beetle.EntityManager(service);
    var query = manager.createQuery("Entities").where(function (e) { return e.Id > 0; });
    stop();
    query.then(function (data) {
        ok(data.length > 0, "loaded all entities") && start();
    }, handleFail);
});
function handleFail(error) {
    if (error.handled === true)
        return;
    ok(false, error.message || "Failed: " + error.toString()) && start();
}
//# sourceMappingURL=basicTests.js.map