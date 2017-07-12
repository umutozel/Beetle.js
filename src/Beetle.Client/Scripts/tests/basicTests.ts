var service = new beetle.WebApiService("api/TestApi", false);

test("get all entities", 1, () => {
    var manager = new beetle.EntityManager(service);
    var query = manager.createQuery<Entity>("Entities").where(e => e.Id > 10);
    stop();
    query.then(data => {
        ok(data.length > 0, "loaded all entities") || start();
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
