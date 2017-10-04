using System;
using System.Text;

namespace Beetle.Server.Interface {

    public interface ISerializer {

        string ContentType { get; }

        Encoding Encoding { get; }

        string Serialize(object obj);

        T Deserialize<T>(string str);

        object Deserialize(string str, Type type);

        dynamic DeserializeToDynamic(string str);

        object ConvertFromDynamic(dynamic value, Type type);
    }
}
