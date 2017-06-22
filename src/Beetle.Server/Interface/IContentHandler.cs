using System.Collections.Generic;

namespace Beetle.Server.Interface {

    public interface IContentHandler<in T> {

        ProcessResult HandleContent(T contentValue, IEnumerable<BeetleParameter> parameters, 
                                    ActionContext actionContext, IBeetleService service = null);
    }
}
