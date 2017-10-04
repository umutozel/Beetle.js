namespace Beetle.Server {

    public class GeneratedValue {

        public GeneratedValue(int index, string property, object value) {
            Index = index;
            Property = property;
            Value = value;
        }

        public int Index { get; }

        public string Property { get; }

        public object Value { get; set; }
    }
}
