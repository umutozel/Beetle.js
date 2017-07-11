using System;

namespace Beetle.Server {

    [AttributeUsage(AttributeTargets.Method)]
    public class NonBeetleActionAttribute : Attribute {
    }
}
