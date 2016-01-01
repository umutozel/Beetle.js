using System;
using System.Web.Mvc;

namespace Beetle.Server.Mvc {

    public class BeetleContentResult : ActionResult {
        private readonly object _value;

        public BeetleContentResult(object value) {
            _value = value;
        }

        public object Value { get { return _value; } }

        public override void ExecuteResult(ControllerContext context) {
            throw new NotImplementedException();
        }
    }
}
