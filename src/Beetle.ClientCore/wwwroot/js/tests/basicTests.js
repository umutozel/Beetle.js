var service = new beetle.MvcService("Home", false);
test("get all entities", 1, function () {
    var manager = new beetle.EntityManager(service);
    var query = manager.createQuery("Entities").where(function (e) { return e.Id > 0; });
    stop();
    query.then(function (data) {
        var entity = data.first();
        entity.IsCanceled = !entity.IsCanceled;
        manager.saveChanges()
            .then(function (sr) {
            ok(sr, "loaded all entities");
            start();
        }, handleFail);
    }, handleFail);
});
function handleFail(error) {
    if (error.handled === true)
        return;
    ok(false, error.message || "Failed: " + error.toString()) && start();
}
// ReSharper restore InconsistentNaming
//# sourceMappingURL=basicTests.js.map