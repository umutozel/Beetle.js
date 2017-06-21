using System;
using System.Collections.Generic;

namespace Beetle.Server.Meta {

    public class Validator: MetadataPart {

        private Validator(string name, string shortName, string message, string messageResourceName, List<object> arguments = null, Func<string> displayNameGetter = null)
                : base(name, displayNameGetter) {
            ShortName = shortName;
            Message = message;
            ResourceName = messageResourceName;
            Arguments = arguments;
        }
        
        public string ShortName { get; set; }
        public string Message { get; set; }
        public List<object> Arguments { get; set; } 

        public override object ToMinified() {
            return new {
                           t = ShortName,
                           l = GetDisplayName(),
                           m = Message,
                           r = ResourceName,
                           a = Arguments
                       };
        }

        public static Validator Required(string message, string messageResourceName, bool allowEmptyStrings) {
            return new Validator("Required", "re", message, messageResourceName, new List<object> {allowEmptyStrings});
        }

        public static Validator StringLength(string message, string messageResourceName, int minLength, int maxLength) {
            return new Validator("StringLength", "sl", message, messageResourceName, new List<object> { minLength, maxLength });
        }

        public static Validator MaxLength(string message, string messageResourceName, int maxLength) {
            return new Validator("MaxLength", "ma", message, messageResourceName, new List<object> { maxLength });
        }

        public static Validator MinLength(string message, string messageResourceName, int minLength) {
            return new Validator("MinLength", "mi", message, messageResourceName, new List<object> { minLength });
        }

        public static Validator Range(string message, string messageResourceName, object minimum, object maximum) {
            return new Validator("Range", "ra", message, messageResourceName, new List<object> { minimum, maximum });
        }

        public static Validator RegularExpression(string message, string messageResourceName, string pattern) {
            return new Validator("RegularExpression", "rx", message, messageResourceName, new List<object> { pattern });
        }

        public static Validator EmailAddress(string message, string messageResourceName) {
            return new Validator("EmailAddress", "ea", message, messageResourceName);
        }

        public static Validator CreditCard(string message, string messageResourceName) {
            return new Validator("CreditCard", "cc", message, messageResourceName);
        }

        public static Validator Url(string message, string messageResourceName) {
            return new Validator("Url", "ur", message, messageResourceName);
        }

        public static Validator PhoneNumber(string message, string messageResourceName) {
            return new Validator("PhoneNumber", "ph", message, messageResourceName);
        }

        public static Validator PostalCode(string message, string messageResourceName) {
            return new Validator("PostalCode", "po", message, messageResourceName);
        }

        public static Validator Time(string message, string messageResourceName) {
            return new Validator("Time", "ti", message, messageResourceName);
        }

        public static Validator Compare(string message, string messageResourceName, string otherProperty) {
            return new Validator("Compare", "co", message, messageResourceName, new List<object> { otherProperty });
        }
    }
}
