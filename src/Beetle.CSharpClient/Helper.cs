using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Beetle.CSharpClient {

    internal class Helper {

        internal static Type GetElementType(Type seqType) {
            Type ienum = FindIEnumerable(seqType);
            if (ienum == null) return seqType;
            return ienum.GenericTypeArguments[0];
        }

        private static Type FindIEnumerable(Type seqType) {
            if (seqType == null || seqType == typeof(string))
                return null;

            if (seqType.IsArray)
                return typeof(IEnumerable<>).MakeGenericType(seqType.GetElementType());

            if (seqType.GetTypeInfo().IsGenericType) {
                foreach (Type arg in seqType.GenericTypeArguments) {
                    Type ienum = typeof(IEnumerable<>).MakeGenericType(arg);
                    if (ienum.GetTypeInfo().IsAssignableFrom(seqType.GetTypeInfo())) {
                        return ienum;
                    }
                }
            }

            var ifaces = seqType.GetTypeInfo().ImplementedInterfaces;
            if (ifaces != null && ifaces.Any()) {
                foreach (Type iface in ifaces) {
                    Type ienum = FindIEnumerable(iface);
                    if (ienum != null) return ienum;
                }
            }

            if (seqType.GetTypeInfo().BaseType != null && seqType.GetTypeInfo().BaseType != typeof(object)) {
                return FindIEnumerable(seqType.GetTypeInfo().BaseType);
            }

            return null;
        }
    }
}
