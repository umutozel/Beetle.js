using Beetle.Server.EntityFramework.Properties;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Beetle.Server.Meta;
#if EF6
using System.Data.Entity.Core.Metadata.Edm;
using System.Data.Entity.Spatial;
using EntityType = System.Data.Entity.Core.Metadata.Edm.EntityType;
using EnumType = System.Data.Entity.Core.Metadata.Edm.EnumType;
using NavigationProperty = System.Data.Entity.Core.Metadata.Edm.NavigationProperty;
#else
using System.Data.Metadata.Edm;
using System.Data.Spatial;
using EntityType = System.Data.Metadata.Edm.EntityType;
using EnumType = System.Data.Metadata.Edm.EnumType;
using NavigationProperty = System.Data.Metadata.Edm.NavigationProperty;
#endif

namespace Beetle.Server.EntityFramework {

    /// <summary>
    /// Generates metadata using .edmx information.
    /// </summary>
    public static class MetadataGenerator {
        private const string StoreGeneratedPatternAttributeName = @"http://schemas.microsoft.com/ado/2009/02/edm/annotation:StoreGeneratedPattern";

        /// <summary>
        /// Generates metadata for given item collection.
        /// Fetches CLR models from given assembly.
        /// </summary>
        /// <param name="metadataWorkspace">The metadata workspace.</param>
        /// <param name="modelAssembly">The model assembly.</param>
        /// <param name="connectionString">The connection string.</param>
        /// <returns></returns>
        public static Metadata Generate(MetadataWorkspace metadataWorkspace, Assembly modelAssembly, string connectionString) {
            metadataWorkspace.RegisterItemCollection(new ObjectItemCollection());
            metadataWorkspace.LoadFromAssembly(modelAssembly);

            var itemCollection = metadataWorkspace.GetItemCollection(DataSpace.CSpace);
            var objectItemCollection = (ObjectItemCollection)metadataWorkspace.GetItemCollection(DataSpace.OSpace);

            return Generate(metadataWorkspace, itemCollection, objectItemCollection, modelAssembly, connectionString);
        }

        /// <summary>
        /// Generates metadata for given item collection.
        /// Fetches CLR models from object item collection.
        /// </summary>
        /// <param name="metadataWorkspace">The metadata workspace.</param>
        /// <param name="itemCollection">The item collection.</param>
        /// <param name="objectItemCollection">The object item collection.</param>
        /// <param name="assembly">The assembly.</param>
        /// <param name="connectionString">The connection string.</param>
        /// <returns></returns>
        /// <exception cref="BeetleException">Cannot load mapping information.</exception>
        public static Metadata Generate(MetadataWorkspace metadataWorkspace, ItemCollection itemCollection,
                                        ObjectItemCollection objectItemCollection, Assembly assembly, string connectionString) {
            XDocument mappingXml = null;
            XNamespace mappingNs = null;
            try {
                var csResourceMatch = Regex.Match(connectionString, @"res:*/(.*?\.msl)");
                if (csResourceMatch.Success) {
                    var csResourceIndex = csResourceMatch.Value.LastIndexOf('/');
                    if (csResourceIndex >= 0) {
                        var csResource = csResourceMatch.Value.Substring(csResourceIndex + 1);
                        if (!string.IsNullOrEmpty(csResource)) {
                            using (var stream = assembly.GetManifestResourceStream(csResource)) {
                                if (stream != null) {
                                    using (var reader = new StreamReader(stream)) {
                                        mappingXml = XDocument.Load(reader);
                                        // ReSharper disable once PossibleNullReferenceException
                                        mappingNs = mappingXml.Root.GetDefaultNamespace();
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch {
                mappingXml = null;
            }

            var container = itemCollection.OfType<EntityContainer>().FirstOrDefault();
            // collect necessary entity information in one collection.
            var entityResources = new List<EntityResource>();
            foreach (var entityType in itemCollection.OfType<EntityType>().OrderBy(et => et.Name)) {
                var et = entityType;
                var entitySet = GetEntitySet(container, et);

                IEnumerable<KeyValuePair<string, string>> propertyMappings = null;
                XElement entityMap = null;
                if (mappingXml != null) {
                    entityMap = mappingXml
                        .Descendants(mappingNs.GetName("EntitySetMapping"))
                        .First(esm => esm.Attribute("Name").Value == entitySet.Name)
                        .Descendants(mappingNs.GetName("EntityTypeMapping"))
                        .First(mf => {
                            var typeName = mf.Attribute("TypeName").Value;
                            return typeName == et.FullName || typeName == string.Format("IsTypeOf({0})", et.FullName);
                        })
                        .Descendants(mappingNs.GetName("MappingFragment"))
                        .Single();
                    propertyMappings = entityMap.Descendants(mappingNs.GetName("ScalarProperty"))
                        .Select(sp => new KeyValuePair<string, string>(sp.Attribute("Name").Value, sp.Attribute("ColumnName").Value));
                }

                var complexProperties = et.Properties.Where(p => p.TypeUsage.EdmType is ComplexType && p.DeclaringType == et);
                Dictionary<EdmProperty, IEnumerable<ColumnMapping>> complexMappings = null;
                if (entityMap != null) {
                    complexMappings = new Dictionary<EdmProperty, IEnumerable<ColumnMapping>>();
                    foreach (var complexProperty in complexProperties) {
                        var complexMapping = entityMap
                            .Descendants(mappingNs.GetName("ComplexProperty"))
                            .First(cp => cp.Attribute("Name").Value == complexProperty.Name)
                            .Descendants(mappingNs.GetName("ScalarProperty"))
                            .Select(p => new ColumnMapping(p.Attribute("Name").Value, p.Attribute("ColumnName").Value));
                        complexMappings.Add(complexProperty, complexMapping);
                    }
                }

                var entityResource = new EntityResource {
                    Entity = et,
                    Type = et,
                    Name = et.Name,
                    EntitySet = entitySet,
                    SimpleProperties = et.Properties
                        .Where(p => p.TypeUsage.EdmType is SimpleType && p.DeclaringType == et)
                        .ToDictionary(p => propertyMappings == null ? p.Name : propertyMappings.First(pm => pm.Key == p.Name).Value, p => p),
                    NavigationProperties = et.NavigationProperties.Where(np => np.DeclaringType == et),
                    ComplexProperties = complexMappings,
                    ClrType = objectItemCollection.GetClrType(objectItemCollection.OfType<EntityType>().First(x => x.Name == et.Name)),
                    TableName = entityMap == null ? et.Name : entityMap.Attribute("StoreEntitySet").Value
                };

                entityResources.Add(entityResource);
            }

            foreach (var complexType in itemCollection.OfType<ComplexType>().OrderBy(i => i.Name)) {
                var ct = complexType;
                var simpleProperties = ct.Properties
                    .Where(p => p.TypeUsage.EdmType is SimpleType && p.DeclaringType == ct)
                    .ToDictionary(p => p.Name, p => p);
                var entityResource = new EntityResource {
                    Type = ct,
                    Name = ct.Name,
                    SimpleProperties = simpleProperties,
                    ClrType = objectItemCollection.GetClrType(objectItemCollection.OfType<ComplexType>().First(x => x.Name == ct.Name))
                };

                entityResources.Add(entityResource);
            }

            var enumResources = new List<EnumResource>();
            foreach (var enumType in itemCollection.OfType<EnumType>()) {
                var oSpaceEnumType = objectItemCollection.OfType<EnumType>().First(x => x.Name == enumType.Name);
                var enumClrType = objectItemCollection.GetClrType(oSpaceEnumType);
                enumResources.Add(new EnumResource { EnumType = enumType, ClrType = enumClrType });
            }

            return Mapping(entityResources, enumResources, itemCollection, container);
        }

        /// <summary>
        /// Generates mappings.
        /// </summary>
        /// <param name="entityResources">The entity resources.</param>
        /// <param name="enumResources">The enum resources.</param>
        /// <param name="itemCollection">The item collection.</param>
        /// <param name="container">The entity container.</param>
        /// <returns></returns>
        /// <exception cref="System.ArgumentNullException">itemCollection</exception>
        /// <exception cref="System.Exception">Unknown data type:  + p.TypeUsage.EdmType.Name</exception>
        private static Metadata Mapping(IEnumerable<EntityResource> entityResources, IEnumerable<EnumResource> enumResources, IEnumerable<GlobalItem> itemCollection, EntityContainer container) {
            if (itemCollection == null)
                throw new ArgumentNullException("itemCollection");

            var globalItems = itemCollection as IList<GlobalItem> ?? itemCollection.ToList();
            var retVal = new Metadata(container.Name);

            // entity types
            foreach (var er in entityResources) {
                var fullName = string.Format("{0}, {1}", er.ClrType.FullName, er.ClrType.Assembly.GetName().Name);
                var et = new Meta.EntityType(fullName, er.Name) {TableName = er.TableName};

                // entity informations
                if (er.Entity != null) {
                    et.QueryName = er.EntitySet.Name;
                    if (er.EntitySet.ElementType.Name != er.Name)
                        et.QueryType = er.EntitySet.ElementType.Name;
                    et.Keys.AddRange(er.Entity.KeyMembers.Select(k => k.Name));
                    // if entity has base type, set the base type's name
                    if (er.Entity.BaseType != null)
                        et.BaseTypeName = er.Entity.BaseType.Name;
                    if (er.ClrType != null)
                        et.ClrType = er.ClrType;

                    // navigation properties
                    if (er.NavigationProperties != null) {
                        foreach (var p in er.NavigationProperties) {
                            var ass = globalItems.OfType<AssociationType>().First(a => a.Name == p.RelationshipType.Name);
                            Func<string> displayNameGetter = null;
                            if (er.ClrType != null) {
                                var propertyInfo = er.ClrType.GetMember(p.Name).FirstOrDefault();
                                if (propertyInfo != null)
                                    displayNameGetter = Helper.GetDisplayNameGetter(propertyInfo);
                            }

                            var np = new Meta.NavigationProperty(p.Name, displayNameGetter);
                            np.EntityTypeName = (((RefType)p.ToEndMember.TypeUsage.EdmType).ElementType).Name;

                            var isScalar = p.ToEndMember.RelationshipMultiplicity != RelationshipMultiplicity.Many;
                            if (isScalar) {
                                np.IsScalar = true;
                                np.ForeignKeys.AddRange(ass.ReferentialConstraints.SelectMany(rc => rc.ToProperties.Select(tp => tp.Name)));
                            }

                            if (p.FromEndMember.DeleteBehavior == OperationAction.Cascade)
                                np.DoCascadeDelete = true;

                            if (er.ClrType != null)
                                Helper.PopulateNavigationPropertyValidations(er.ClrType, np);

                            np.AssociationName = p.RelationshipType.Name;

                            et.NavigationProperties.Add(np);
                        }
                    }

                    // complex properties
                    if (er.ComplexProperties != null) {
                        foreach (var p in er.ComplexProperties) {
                            Func<string> displayNameGetter = null;
                            if (er.ClrType != null) {
                                var propertyInfo = er.ClrType.GetMember(p.Key.Name).FirstOrDefault();
                                if (propertyInfo != null)
                                    displayNameGetter = Helper.GetDisplayNameGetter(propertyInfo);
                            }

                            var cp = new ComplexProperty(p.Key.Name, displayNameGetter) {
                                TypeName = p.Key.TypeUsage.EdmType.Name,
                                Mappings = p.Value
                            };

                            et.ComplexProperties.Add(cp);
                        }
                    }
                }
                else
                    et.IsComplexType = true; // this is a complex type

                // data properties
                foreach (var sp in er.SimpleProperties) {
                    var p = sp.Value;
                    var clrType = UnderlyingClrType(p.TypeUsage.EdmType);
                    Func<string> displayNameGetter = null;
                    if (er.ClrType != null) {
                        var propertyInfo = clrType.GetMember(p.Name).FirstOrDefault();
                        if (propertyInfo != null)
                            displayNameGetter = Helper.GetDisplayNameGetter(propertyInfo);
                    }

                    var dp = new DataProperty(p.Name, displayNameGetter) { ColumnName = sp.Key };

                    var jsType = DataType.Binary;
                    var enumType = p.TypeUsage.EdmType as EnumType;
                    if (enumType != null) {
                        dp.IsEnum = true;
                        dp.EnumType = enumType.Name;
                    }
                    else {
                        // convert CLR type to javascript type
                        if (clrType == typeof(string))
                            jsType = DataType.String;
                        else if (clrType == typeof(Guid))
                            jsType = DataType.Guid;
                        else if (clrType == typeof(DateTime))
                            jsType = DataType.Date;
                        else if (clrType == typeof(DateTimeOffset))
                            jsType = DataType.DateTimeOffset;
                        else if (clrType == typeof(TimeSpan))
                            jsType = DataType.Time;
                        else if (clrType == typeof(bool))
                            jsType = DataType.Boolean;
                        else if (clrType == typeof(Int16) || clrType == typeof(Int64) || clrType == typeof(Int32))
                            jsType = DataType.Int;
                        else if (clrType == typeof(Single) || clrType == typeof(double) || clrType == typeof(decimal))
                            jsType = DataType.Number;
                        else if (clrType == typeof(byte))
                            jsType = DataType.Byte;
                        else if (clrType == typeof(DbGeography))
                            jsType = DataType.Geography;
                        else if (clrType == typeof(DbGeometry))
                            jsType = DataType.Geometry;
                        else if (clrType == typeof(byte[]))
                            jsType = DataType.Binary;
                        else throw new BeetleException(Resources.UnknownDataType + p.TypeUsage.EdmType.Name);
                    }
                    dp.DataType = jsType;
                    var generated = p.MetadataProperties.FirstOrDefault(m => m.Name == StoreGeneratedPatternAttributeName);
                    if (generated == null)
                        dp.GenerationPattern = GenerationPattern.None;
                    else if (generated.Value.ToString().StartsWith("I"))
                        dp.GenerationPattern = GenerationPattern.Identity;
                    else
                        dp.GenerationPattern = GenerationPattern.Computed;
                    dp.UseForConcurrency = IsConcurrencyProperty(p);
                    if (p.Nullable)
                        dp.IsNullable = true;
                    if (jsType == DataType.Number) {
                        var precision = GetPrecision(p);
                        var scale = GetScale(p);
                        if (precision.HasValue)
                            dp.Precision = precision;
                        if (scale.HasValue)
                            dp.Scale = scale;
                    }

                    if (er.ClrType != null)
                        Helper.PopulateDataPropertyValidations(er.ClrType, dp, GetMaxStringLength(p));
                    if (p.DefaultValue != null)
                        dp.DefaultValue = p.DefaultValue;

                    et.DataProperties.Add(dp);
                }
                retVal.Entities.Add(et);
            }

            // enum types
            foreach (var enumResource in enumResources) {
                var enumType = enumResource.EnumType;
                //var enumClrType = enumResource.ClrType;
                var et = new Meta.EnumType(enumType.Name);

                foreach (var member in enumType.Members) {
                    //todo: enum member için display
                    var em = new Meta.EnumMember(member.Name, null) {Value = member.Value};

                    et.Members.Add(em);
                }
                retVal.Enums.Add(et);
            }

            retVal.FixReferences();
            return retVal;
        }

        /// <summary>
        /// Gets the entity set.
        /// </summary>
        /// <param name="container">The entity container.</param>
        /// <param name="entityType">Type of the entity.</param>
        /// <returns></returns>
        private static EntitySetBase GetEntitySet(EntityContainer container, EntityType entityType) {
            var baseType = entityType;
            while (baseType != null && baseType.BaseType != null) {
                baseType = baseType.BaseType as EntityType;
            }
            return container.BaseEntitySets.First(set => set.ElementType == baseType);
        }

        /// <summary>
        /// Gets the length of the max string.
        /// </summary>
        /// <param name="edmProperty">The EDM property.</param>
        /// <returns></returns>
        private static int? GetMaxStringLength(EdmProperty edmProperty) {
            foreach (var facet in edmProperty.TypeUsage.Facets)
                if (facet.Name == "MaxLength" && facet.Value != null && facet.IsUnbounded == false)
                    return Convert.ToInt32(facet.Value);
            return null;
        }

        /// <summary>
        /// Gets the precision.
        /// </summary>
        /// <param name="edmProperty">The EDM property.</param>
        /// <returns></returns>
        private static int? GetPrecision(EdmProperty edmProperty) {
            foreach (var facet in edmProperty.TypeUsage.Facets)
                if (facet.Name == "Precision" && facet.Value != null && facet.IsUnbounded == false)
                    return Convert.ToInt32(facet.Value);
            return null;
        }

        /// <summary>
        /// Gets the scale.
        /// </summary>
        /// <param name="edmProperty">The EDM property.</param>
        /// <returns></returns>
        private static int? GetScale(EdmProperty edmProperty) {
            foreach (var facet in edmProperty.TypeUsage.Facets)
                if (facet.Name == "Scale" && facet.Value != null && facet.IsUnbounded == false)
                    return Convert.ToInt32(facet.Value);
            return null;
        }

        /// <summary>
        /// Determines whether given property is concurrency check property.
        /// </summary>
        /// <param name="edmProperty">The edm property.</param>
        /// <returns></returns>
        private static bool? IsConcurrencyProperty(EdmProperty edmProperty) {
            foreach (var facet in edmProperty.TypeUsage.Facets)
                if (facet.Name == "ConcurrencyMode" && facet.Value != null && facet.IsUnbounded == false)
                    return facet.Value.ToString() == "Fixed";
            return null;
        }

        /// <summary>
        /// Gets the CLR type for given EDM type.
        /// </summary>
        /// <param name="edmType">Type of the EDM.</param>
        /// <returns></returns>
        private static Type UnderlyingClrType(EdmType edmType) {
            var primitiveType = edmType as PrimitiveType;
            if (primitiveType != null)
                return primitiveType.ClrEquivalentType;
            return typeof(object);
        }
    }

    // to hold required entity information
    internal class EntityResource {
        public EntityType Entity { get; set; }
        public StructuralType Type { get; set; }
        public string Name { get; set; }
        public EntitySetBase EntitySet { get; set; }
        public IDictionary<string, EdmProperty> SimpleProperties { get; set; }
        public IEnumerable<NavigationProperty> NavigationProperties { get; set; }
        public IDictionary<EdmProperty, IEnumerable<ColumnMapping>> ComplexProperties { get; set; }
        public Type ClrType { get; set; }
        public string TableName { get; set; }
    }

    internal class EnumResource {
        public EnumType EnumType { get; set; }
        public Type ClrType { get; set; }
    }
}
