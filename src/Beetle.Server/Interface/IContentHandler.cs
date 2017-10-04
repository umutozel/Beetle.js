namespace Beetle.Server.Interface {

    public interface IContentHandler<in T> {

        ProcessResult HandleContent(T value, ActionContext actionContext);
    }
}
