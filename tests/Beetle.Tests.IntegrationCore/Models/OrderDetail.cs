namespace Beetle.Tests.IntegrationCore.Models {

    public partial class OrderDetail {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string ProductNo { get; set; }

        public virtual Order Order { get; set; }
    }
}
