using System;
using System.Web.Mvc;

namespace Beetle.Mvc {

    public class BeetleContentResult<T> : BeetleContentResult {

        public BeetleContentResult(T value): base(value) {
            Value = value;
        }

        public new T Value { get; }
    }

    public class BeetleContentResult : ActionResult {

        public BeetleContentResult(object value) {
            Value = value;
        }

        public object Value { get; }

        public override void ExecuteResult(ControllerContext context) {
            throw new NotImplementedException();
        }
    }
}
