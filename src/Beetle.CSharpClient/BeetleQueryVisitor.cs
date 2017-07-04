using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace Beetle.CSharpClient {

    internal class BeetleQueryVisitor : ExpressionVisitor {
        private static readonly Dictionary<string, string> _prmMap;
        private List<string> _queryParams = new List<string>();

        static BeetleQueryVisitor() {
            _prmMap = new Dictionary<string, string> {
                ["Where"] = "filter",
                ["Select"] = "select",
                ["OrderBy"] = "orderBy",
                ["OrderByDescending"] = "orderBy"
            };
        }

        private BeetleQueryVisitor() {
        }

        internal static string GetQueryString(Expression expression) {
            var visitor = new BeetleQueryVisitor();
            visitor.Visit(expression);
            var i = 0;
            visitor._queryParams.Reverse();
            var prms = visitor._queryParams.Select(qp => $"!e{i++}={qp}");
            return string.Join("&", prms);
        }

        protected override Expression VisitMethodCall(MethodCallExpression node) {
            var methodName = node.Method.Name;
            switch (methodName) {
                case "Where":
                case "OrderBy":
                case "OrderByDescending":
                case "Select":
                    var bodyExp = BeetleLambdaVisitor.ReplaceParameter(node.Arguments[1]);
                    var body = bodyExp.ToString();
                    body = body.Substring(6);
                    if (methodName == "OrderByDescending") body += " desc";
                    if (methodName == "Select" && body.StartsWith("new ")) {
                        body = body.Substring(body.IndexOf("(") + 1);
                        body = body.Substring(0, body.Length - 1);
                        var bodyParts = body.Split(',');
                        body = string.Join(", ",
                            bodyParts.Select(bp => {
                                var assignParts = bp.Split('=');
                                if (assignParts.Length == 2)
                                    return assignParts[1] + " as " + assignParts[0];
                                return bp;
                            })
                        );
                    }
                    _queryParams.Add($"{_prmMap[methodName]}:{body}");
                    break;
            }

            return base.VisitMethodCall(node);
        }
    }

    internal class BeetleLambdaVisitor : ExpressionVisitor {
        private ParameterExpression _oldPrm;
        private ParameterExpression _newPrm;

        private BeetleLambdaVisitor() {
        }

        internal static Expression ReplaceParameter(Expression expression) {
            return new BeetleLambdaVisitor().Visit(expression);
        }

        protected override Expression VisitLambda<T>(Expression<T> node) {
            _oldPrm = node.Parameters[0];
            _newPrm = Expression.Parameter(_oldPrm.Type, "it");

            var newBody = Visit(node.Body);
            return Expression.Lambda<T>(newBody, _newPrm);
        }

        protected override Expression VisitParameter(ParameterExpression node) {
            return base.VisitParameter(node == _oldPrm ? _newPrm : node);
        }
    }
}
