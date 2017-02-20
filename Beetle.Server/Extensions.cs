using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;

namespace Beetle.Server {

    public static class Extensions {

        public static List<TAttribute> GetAttributes<TAttribute>(this MemberInfo member, bool checkMetadataType = false, 
                                                                 bool inherit = false) where TAttribute: Attribute {
            var retVal = member.GetCustomAttributes(inherit).OfType<TAttribute>();

            if (checkMetadataType) {
                var metadataTypeAtt = member.MemberType == MemberTypes.TypeInfo
                                          ? member.GetCustomAttribute<MetadataTypeAttribute>(inherit)
                                          : member.DeclaringType.GetCustomAttribute<MetadataTypeAttribute>(inherit);
                if (metadataTypeAtt != null) {
                    var metadataMember = metadataTypeAtt.MetadataClassType.GetMember(member.Name).FirstOrDefault();
                    if (metadataMember != null)
                        retVal = retVal.Union(metadataMember.GetCustomAttributes(inherit).OfType<TAttribute>());
                }
            }

            return retVal.ToList();
        }

        public static TAttribute GetAttribute<TAttribute>(this MemberInfo member, bool checkMetadataType = false,
                                                          bool inherit = false) where TAttribute : Attribute {
            return GetAttributes<TAttribute>(member, checkMetadataType, inherit).FirstOrDefault();
        }
    }
}
