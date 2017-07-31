var service = new beetle.BeetleService("Home", false);

test("get all entities", 1, () => {
    var manager = new beetle.EntityManager(service);
    var query = manager.createQuery<Entity>("Entities").where(e => e.Id > 0).setParameter("oha", 123);
    stop();
    query.then(data => {
        var entity = data[0];
        entity.IsCanceled = !entity.IsCanceled;
        manager.saveChanges()
            .then(sr => {
                ok(sr, "loaded all entities");
                start();
            }, handleFail);

    }, handleFail, { usePost: true });
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
