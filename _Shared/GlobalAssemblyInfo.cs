using System.Reflection;
using System.Resources;
using System.Runtime.InteropServices;

[assembly: AssemblyProduct("Beetle.js")]
[assembly: AssemblyDescription("Beetle.js, Javascript ORM for Mvc and WebApi, manage your data easily.")]
[assembly: AssemblyCompany("Beetle.js")]
[assembly: AssemblyCopyright("Copyright © 2016")]
[assembly: AssemblyTrademark("Beetle.js © 2016")]

[assembly: AssemblyCulture("en-US")]
[assembly: NeutralResourcesLanguageAttribute("en-US")]

[assembly: ComVisible(false)]

#if DEBUG
[assembly: AssemblyConfiguration("Debug")]
#else
[assembly: AssemblyConfiguration("Release")]
#endif