using System.Collections.Generic;

namespace Beetle.Server {

    public interface IContentHandler<in T> {

        ProcessResult HandleContent(T contentValue, IEnumerable<KeyValuePair<string, string>> parameters, ActionContext actionContext,
                                    IBeetleService service = null, IContextHandler contextHandler = null);
    }
}
