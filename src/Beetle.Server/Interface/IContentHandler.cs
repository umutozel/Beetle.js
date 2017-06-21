using System.Collections.Generic;

namespace Beetle.Server.Interface {

    public interface IContentHandler<in T> {

        ProcessResult HandleContent(T contentValue, IDictionary<string, string> parameters, 
                                    ActionContext actionContext, IBeetleService service = null);
    }
}
