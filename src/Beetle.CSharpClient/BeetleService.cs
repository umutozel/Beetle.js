using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace Beetle.CSharpClient {

    public class BeetleService {
        private readonly string _baseUrl;

        public BeetleService(string baseUrl) {
            _baseUrl = baseUrl;
        }

        public BeetleQuery<T> Query<T>(string url) {
            var provider = new BeetleQueryProvider(this, url);
            return new BeetleQuery<T>(provider);
        }

        internal Task<JObject> ExecuteQuery(Expression expression, string url) {
            return ExecuteQueryImpl(expression, url);
        }

        internal async Task<T> ExecuteQuery<T>(Expression expression, string url) {
            var jobject = await ExecuteQueryImpl(expression, url);
            return jobject.ToObject<T>();
        }

        internal async Task<IEnumerable<TResult>> ExecuteQueryList<TResult>(Expression expression, string url) {
            var jobject = await ExecuteQueryImpl(expression, url);
            var jarray = jobject.GetValue("$d");
            return jarray.Select(o => o.ToObject<TResult>());
        }

        private async Task<JObject> ExecuteQueryImpl(Expression expression, string url) {
            var client = new HttpClient();
            var queryString = BeetleQueryVisitor.GetQueryString(expression);
            url = $"{_baseUrl}/{url}?{queryString}";
            var json = await client.GetStringAsync(url);
            return JObject.Parse(json);
        }
    }
}
