using System.Data.Entity.Infrastructure;
using System.Text.RegularExpressions;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Xml;
using System.Xml.Linq;
using System.Data.Entity;
using System.Data.Entity.Core.Metadata.Edm;
using System.Data.Entity.Spatial;
using EFEntityType = System.Data.Entity.Core.Metadata.Edm.EntityType;
using EFEnumType = System.Data.Entity.Core.Metadata.Edm.EnumType;
using EFNavigationProperty = System.Data.Entity.Core.Metadata.Edm.NavigationProperty;

namespace Beetle.EntityFramework {
    using Meta;
    using Server;
    using Properties;
    using ServerHelper = Server.Helper;

    public static class MetadataGenerator {
        private const string StoreGeneratedPatternAttributeName = @"http://schemas.microsoft.com/ado/2009/02/edm/annotation:StoreGeneratedPattern";

        public static Metadata Generate(DbContext context, Assembly modelAssembly, string modelName = null) {
            var objectContext = ((IObjectContextAdapter)context).ObjectContext;
            var metadataWorkspace = objectContext.MetadataWorkspace;
            var itemCollection = objectContext.MetadataWorkspace.GetItemCollection(DataSpace.CSpace);
            var objectItemCollection = (ObjectItemCollection)objectContext.MetadataWorkspace.GetItemCollection(DataSpace.OSpace);

            return Generate(metadataWorkspace, itemCollection, objectItemCollection, modelAssembly, modelName);
        }

        public static Metadata Generate(Assembly modelAssembly, string modelName) {
            var conceptualResource = modelAssembly.GetManifestResourceStream(modelName + ".csdl");
            Debug.Assert(conceptualResource != null, "conceptualResource != null");
            var conceptualReader = XmlReader.Create(conceptualResource);
            var itemCollection = new EdmItemCollection(new[] { conceptualReader });
            var objectItemCollection = new ObjectItemCollection();
            var metadataWorkspace = new MetadataWorkspace(
                () => itemCollection,
                () => null,
                () => null,
                () => objectItemCollection
            );

            metadataWorkspace.LoadFromAssembly(modelAssembly);
            return Generate(metadataWorkspace, itemCollection, objectItemCollection, modelAssembly, modelName);
        }

        public static Metadata Generate(MetadataWorkspace metadataWorkspace, ItemCollection itemCollection,
                                        ObjectItemCollection objectItemCollection, Assembly assembly, string modelName = null) {
            var container = itemCollection.OfType<EntityContainer>().First();

            XDocument mappingXml = null;
            XNamespace mappingNs = null;
            try {
                if (modelName == null) {
                    var schemaSource = container.MetadataProperties["SchemaSource"].Value.ToString();
                    modelName = Regex.Match(schemaSource, @"res://.*/(.*?)\.csdl").Groups[1].Value;
                }

                using (var stream = assembly.GetManifestResourceStream(modelName + ".msl")) {
                    if (stream != null) {
                        using (var reader = new StreamReader(stream)) {
                            mappingXml = XDocument.Load(reader);
                            // ReSharper disable once PossibleNullReferenceException
                            mappingNs = mappingXml.Root.GetDefaultNamespace();
                        }
                    }
                }
            }
            catch {
                mappingXml = null;
            }

            // collect necessary entity information in one collection.
            var entityResources = new List<EntityResource>();
            foreach (var entityType in itemCollection.OfType<EFEntityType>().OrderBy(et => et.Name)) {
                var et = entityType;
                var entitySet = GetEntitySet(container, et);

                IEnumerable<KeyValuePair<string, string>> propertyMappings = null;
                XElement entityMap = null;
                if (mappingXml != null) {
                    entityMap = mappingXml
                        .Descendants(mappingNs.GetName("EntitySetMapping"))
                        .First(esm => esm.Attribute("Name")?.Value == entitySet.Name)
                        .Descendants(mappingNs.GetName("EntityTypeMapping"))
                        .First(mf => {
                            var typeName = mf.Attribute("TypeName")?.Value;
                            return typeName == et.FullName || typeName == $"IsTypeOf({et.FullName})";
                        })
                        .Descendants(mappingNs.GetName("MappingFragment"))
                        .Single();

                    propertyMappings = entityMap.Descendants(mappingNs.GetName("ScalarProperty"))
                        .Select(sp => new KeyValuePair<string, string>(
                            sp.Attribute("Name")?.Value, sp.Attribute("ColumnName")?.Value)
                        );
                }

                var complexProperties = et.Properties.Where(p => p.TypeUsage.EdmType is ComplexType && p.DeclaringType == et);
                Dictionary<EdmProperty, IEnumerable<ColumnMapping>> complexMappings = null;
                if (entityMap != null) {
                    complexMappings = new Dictionary<EdmProperty, IEnumerable<ColumnMapping>>();
                    foreach (var complexProperty in complexProperties) {
                        var complexMapping = entityMap
                            .Descendants(mappingNs.GetName("ComplexProperty"))
                            .First(cp => cp.Attribute("Name")?.Value == complexProperty.Name)
                            .Descendants(mappingNs.GetName("ScalarProperty"))
                            .Select(p => new ColumnMapping(p.Attribute("Name")?.Value, p.Attribute("ColumnName")?.Value));
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
                    ClrType = objectItemCollection.GetClrType(objectItemCollection.OfType<EFEntityType>().First(x => x.Name == et.Name)),
                    TableName = entityMap?.Attribute("StoreEntitySet")?.Value ?? et.Name
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
            foreach (var enumType in itemCollection.OfType<EFEnumType>()) {
                var oSpaceEnumType = objectItemCollection.OfType<EFEnumType>().First(x => x.Name == enumType.Name);
                var enumClrType = objectItemCollection.GetClrType(oSpaceEnumType);
                enumResources.Add(new EnumResource { EnumType = enumType, ClrType = enumClrType });
            }

            return Mapping(entityResources, enumResources, itemCollection, container);
        }

        private static Metadata Mapping(IEnumerable<EntityResource> entityResources, IEnumerable<EnumResource> enumResources, IEnumerable<GlobalItem> itemCollection, EntityContainer container) {
            if (itemCollection == null)
                throw new ArgumentNullException(nameof(itemCollection));

            var globalItems = itemCollection as IList<GlobalItem> ?? itemCollection.ToList();
            var retVal = new Metadata(container.Name);

            // entity types
            foreach (var er in entityResources) {
                var fullName = $"{er.ClrType.FullName}, {er.ClrType.Assembly.GetName().Name}";
                var et = new EntityType(fullName, er.Name) { TableName = er.TableName };

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
                            ServerHelper.GetDisplayInfo(er.ClrType, p.Name, out string resourceName, out Func<string> displayNameGetter);

                            var np = new NavigationProperty(p.Name, displayNameGetter) {
                                ResourceName = resourceName,
                                EntityTypeName = ((RefType)p.ToEndMember.TypeUsage.EdmType).ElementType.Name
                            };

                            if (p.ToEndMember.RelationshipMultiplicity != RelationshipMultiplicity.Many) {
                                np.IsScalar = true;
                                np.ForeignKeys.AddRange(ass.ReferentialConstraints.SelectMany(rc => rc.ToProperties.Select(tp => tp.Name)));
                            }
                            else {
                                np.ForeignKeys.AddRange(ass.ReferentialConstraints.SelectMany(rc => rc.ToProperties.Select(tp => tp.Name)));
                            }

                            if (p.FromEndMember.DeleteBehavior == OperationAction.Cascade) {
                                np.DoCascadeDelete = true;
                            }

                            if (er.ClrType != null) {
                                ServerHelper.PopulateNavigationPropertyValidations(er.ClrType, np);
                            }

                            np.AssociationName = p.RelationshipType.Name;

                            et.NavigationProperties.Add(np);
                        }
                    }

                    // complex properties
                    if (er.ComplexProperties != null) {
                        foreach (var p in er.ComplexProperties) {
                            ServerHelper.GetDisplayInfo(er.ClrType, p.Key.Name, 
                                                        out string resourceName, 
                                                        out Func<string> displayNameGetter);

                            var cp = new ComplexProperty(p.Key.Name, displayNameGetter) {
                                TypeName = p.Key.TypeUsage.EdmType.Name,
                                ResourceName = resourceName,
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
                    ServerHelper.GetDisplayInfo(er.ClrType, p.Name, 
                                                out string resourceName, out Func<string> displayNameGetter);

                    var dp = new DataProperty(p.Name, displayNameGetter) {
                        ColumnName = sp.Key,
                        ResourceName = resourceName
                    };

                    var jsType = DataType.Binary;
                    var enumType = p.TypeUsage.EdmType as EFEnumType;
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

                    if (er.ClrType != null) {
                        ServerHelper.PopulateDataPropertyValidations(er.ClrType, dp, GetMaxStringLength(p));
                    }

                    if (p.DefaultValue != null) {
                        dp.DefaultValue = p.DefaultValue;
                    }

                    et.DataProperties.Add(dp);
                }
                retVal.Entities.Add(et);
            }

            // enum types
            foreach (var enumResource in enumResources) {
                var enumType = enumResource.EnumType;
                //var enumClrType = enumResource.ClrType;
                var et = new EnumType(enumType.Name);

                foreach (var member in enumType.Members) {
                    //todo: enum member için display
                    //ServerHelper.GetDisplayInfo(member, out string resourceName, out Func<string> displayNameGetter);
                    var em = new EnumMember(member.Name, null) {
                        Value = member.Value
                    };

                    et.Members.Add(em);
                }
                retVal.Enums.Add(et);
            }

            retVal.FixReferences();
            return retVal;
        }

        private static EntitySetBase GetEntitySet(EntityContainer container, EFEntityType entityType) {
            var baseType = entityType;
            while (baseType?.BaseType != null) {
                baseType = baseType.BaseType as EFEntityType;
            }
            return container.BaseEntitySets.First(set => set.ElementType == baseType);
        }

        private static int? GetMaxStringLength(EdmProperty edmProperty) {
            foreach (var facet in edmProperty.TypeUsage.Facets) {
                if (facet.Name == "MaxLength" && facet.Value != null && facet.IsUnbounded == false) {
                    return Convert.ToInt32(facet.Value);
                }
            }

            return null;
        }

        private static int? GetPrecision(EdmMember edmMember) {
            foreach (var facet in edmMember.TypeUsage.Facets) {
                if (facet.Name == "Precision" && facet.Value != null && facet.IsUnbounded == false) {
                    return Convert.ToInt32(facet.Value);
                }
            }

            return null;
        }

        private static int? GetScale(EdmMember edmMember) {
            foreach (var facet in edmMember.TypeUsage.Facets) {
                if (facet.Name == "Scale" && facet.Value != null && facet.IsUnbounded == false) {
                    return Convert.ToInt32(facet.Value);
                }
            }

            return null;
        }

        private static bool? IsConcurrencyProperty(EdmMember edmMember) {
            foreach (var facet in edmMember.TypeUsage.Facets) {
                if (facet.Name == "ConcurrencyMode" && facet.Value != null && facet.IsUnbounded == false) {
                    return facet.Value.ToString() == "Fixed";
                }
            }

            return null;
        }

        private static Type UnderlyingClrType(EdmType edmType) {
            if (edmType is PrimitiveType primitiveType)
                return primitiveType.ClrEquivalentType;
            return typeof(object);
        }
    }

    internal class EntityResource {
        public EFEntityType Entity { get; set; }
        public StructuralType Type { get; set; }
        public string Name { get; set; }
        public EntitySetBase EntitySet { get; set; }
        public IDictionary<string, EdmProperty> SimpleProperties { get; set; }
        public IEnumerable<EFNavigationProperty> NavigationProperties { get; set; }
        public IDictionary<EdmProperty, IEnumerable<ColumnMapping>> ComplexProperties { get; set; }
        public Type ClrType { get; set; }
        public string TableName { get; set; }
    }

    internal class EnumResource {
        public EFEnumType EnumType { get; set; }
        public Type ClrType { get; set; }
    }
}
