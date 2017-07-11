namespace Beetle.Meta {

    public static class Helper {

        public static int CreateQueryHash(string saltStr) {
            var hash = 0;
            var len = saltStr.Length;
            if (saltStr.Length == 0) return hash;

            for (var i = 0; i < len; i++) {
                var chr = saltStr[i];
                hash = ((hash << 5) - hash) + chr;
                hash |= 0;
            }
            return hash;
        }
    }
}
