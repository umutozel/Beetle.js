var service = new beetle.MvcService("Home", false);

test("get all entities", 1, () => {
    var manager = new beetle.EntityManager(service);
    var query = manager.createQuery<Entity>("Entities").where(e => e.Id > 0);
    stop();
    query.then(data => {
        var entity = data.first();
        entity.IsCanceled = !entity.IsCanceled;
        manager.saveChanges()
            .then(sr => {
                ok(sr, "loaded all entities");
                start();
            }, handleFail);

    }, handleFail);
});

function handleFail(error: any) {
    if (error.handled === true) return;
    ok(false, error.message || "Failed: " + error.toString()) && start();
}

// ReSharper disable InconsistentNaming

interface Entity extends beetle.IEntity {
    Id: number;
    ShortId: number;
    UserNameCreate: string;
    TimeCreate: Date;
    IsCanceled: boolean;
}

// ReSharper restore InconsistentNaming
