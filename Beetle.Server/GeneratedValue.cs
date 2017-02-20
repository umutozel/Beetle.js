namespace Beetle.Server {

    public class GeneratedValue {
        private readonly int _index;
        private readonly string _property;

        public GeneratedValue(int index, string property, object value) {
            _index = index;
            _property = property;
            Value = value;
        }

        public int Index {
            get { return _index; }
        }

        public string Property {
            get { return _property; }
        }

        public object Value { get; set; }
    }
}
