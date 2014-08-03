using System.ComponentModel.DataAnnotations;
using Beetle.Client.Properties;

namespace Beetle.Client.Models {

    public partial class AddressMetadata {

        [Display(Name = "PostalCode", ResourceType = typeof(Resources))]
        [Required(ErrorMessage = "{0} is required, please fill.")]
        [StringLength(6, MinimumLength = 2, ErrorMessageResourceName = "StringLength", ErrorMessageResourceType = typeof(Resources))]
        [DataType(DataType.PostalCode)]
        public string PostalCode { get; set; }

        [Display(Name = "City", ResourceType = typeof(Resources))]
        [MinLength(2, ErrorMessage = "{0} length should be more than {1}.")]
        [MaxLength(10, ErrorMessage = "{0} length cannot be more than {1}.")]
        public string City { get; set; }

        [Display(Name = "DoorNumber", ResourceType = typeof(Resources))]
        [Range(1000, 100000, ErrorMessageResourceName = "Range", ErrorMessageResourceType = typeof(Resources))]
        public int DoorNumber { get; set; }

        [Display(Name = "Extra information")]
        [EmailAddress]
        [CreditCard]
        [Url]
        [Phone]
        [DataType(DataType.Time)]
        [RegularExpression("1|2|3|5|8", ErrorMessage = "{0} must be Fibonacci number.")]
        [Compare("Extra2", ErrorMessage = "{0} value must be equal to {1}.")]
        public string Extra { get; set; }

        [Display(Name = "Extra information 2")]
        public string Extra2 { get; set; }
    }
}