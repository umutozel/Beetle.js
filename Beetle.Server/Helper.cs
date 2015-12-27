using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Data.Entity.Design.PluralizationServices;
using System.Globalization;
using System.Linq;
using System.Reflection;
using Beetle.Server.Meta;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Validator = System.ComponentModel.DataAnnotations.Validator;
using ValidatorType = System.ComponentModel.DataAnnotations.DataType;
using DataType = Beetle.Server.Meta.DataType;
using Beetle.Server.Properties;

namespace Beetle.Server {

	/// <summary>
	/// Common helper methods.
	/// </summary>
	public static class Helper {
		private const BindingFlags Binding = BindingFlags.Instance | BindingFlags.Public;
		private static readonly object _pluralizationServicesLocker = new object();
		private static readonly Dictionary<CultureInfo, PluralizationService> _pluralizationServices = new Dictionary<CultureInfo, PluralizationService>();

		/// <summary>
		/// Pluralizes the specified word.
		/// </summary>
		/// <param name="word">The word.</param>
		/// <param name="culture">The culture.</param>
		/// <returns></returns>
		public static string Pluralize(string word, string culture = "en-US") {
			return Pluralize(word, CultureInfo.GetCultureInfo(culture));
		}

		/// <summary>
		/// Pluralizes the specified word.
		/// </summary>
		/// <param name="word">The word.</param>
		/// <param name="culture">The culture.</param>
		/// <returns></returns>
		public static string Pluralize(string word, CultureInfo culture) {
			lock (_pluralizationServicesLocker) {
				if (!_pluralizationServices.ContainsKey(culture))
					_pluralizationServices.Add(culture, PluralizationService.CreateService(culture));
				return _pluralizationServices[culture].Pluralize(word);
			}
		}

		/// <summary>
		/// Singularizes the specified word.
		/// </summary>
		/// <param name="word">The word.</param>
		/// <param name="culture">The culture.</param>
		/// <returns></returns>
		public static string Singularize(string word, string culture = "en-US") {
			return Singularize(word, CultureInfo.GetCultureInfo(culture));
		}

		/// <summary>
		/// Singularizes the specified word.
		/// </summary>
		/// <param name="word">The word.</param>
		/// <param name="culture">The culture.</param>
		/// <returns></returns>
		public static string Singularize(string word, CultureInfo culture) {
			lock (_pluralizationServicesLocker) {
				if (!_pluralizationServices.ContainsKey(culture))
					_pluralizationServices.Add(culture, PluralizationService.CreateService(culture));
				return _pluralizationServices[culture].Singularize(word);
			}
		}

		/// <summary>
		/// Gets the type of the property.
		/// </summary>
		/// <param name="type">The type.</param>
		/// <param name="propertyName">Name of the property.</param>
		/// <returns></returns>
		/// <exception cref="System.ArgumentNullException">obj
		/// or
		/// propertyName</exception>
		/// <exception cref="BeetleException"></exception>
		public static Type GetPropertyType(Type type, string propertyName) {
			var property = type.GetProperty(propertyName, Binding);
			if (property != null) return property.PropertyType;

			var field = type.GetField(propertyName, Binding);
			if (field != null) return field.FieldType;

			return null;
		}

		/// <summary>
		/// Gets the property value.
		/// </summary>
		/// <param name="obj">The object.</param>
		/// <param name="propertyName">Name of the property.</param>
		/// <returns></returns>
		public static object GetPropertyValue(object obj, string propertyName) {
			if (obj == null) throw new ArgumentNullException("obj");
			if (string.IsNullOrWhiteSpace(propertyName)) throw new ArgumentNullException("propertyName");

			var type = obj.GetType();

			var property = type.GetProperty(propertyName, Binding);
			if (property != null) return property.GetValue(obj);

			var field = type.GetField(propertyName, Binding);
			if (field != null) return field.GetValue(obj);

			throw new BeetleException(string.Format(Resources.CannotFindPublicInstanceFieldOrProperty, propertyName));
		}

		/// <summary>
		/// Sets the property value.
		/// </summary>
		/// <param name="obj">The object.</param>
		/// <param name="propertyName">Name of the property.</param>
		/// <param name="value">The value.</param>
		/// <exception cref="System.ArgumentNullException">obj
		/// or
		/// propertyName</exception>
		/// <exception cref="BeetleException">
		/// </exception>
		public static void SetPropertyValue(object obj, string propertyName, object value) {
			if (obj == null) throw new ArgumentNullException("obj");
			if (string.IsNullOrWhiteSpace(propertyName)) throw new ArgumentNullException("propertyName");

			var type = obj.GetType();

			var property = type.GetProperty(propertyName, Binding);
			if (property != null) {
				if (property.SetMethod == null)
					throw new BeetleException(string.Format(Resources.CannotSetReadOnlyProperty, propertyName));

				property.SetValue(obj, value);
				return;
			}

			var field = type.GetField(propertyName, Binding);
			if (field != null)
				field.SetValue(obj, value);
			else
				throw new BeetleException(string.Format(Resources.CannotFindPublicInstanceFieldOrProperty, propertyName));
		}

		/// <summary>
		/// Gets the generated values comparing Entity-ClientEntity for each EntityBag.
		/// </summary>
		/// <param name="entityBags">The entity bags.</param>
		/// <param name="metadata">The metadata.</param>
		/// <returns>
		/// Generated-modified values for EntityBags.
		/// </returns>
		public static IEnumerable<GeneratedValue> GetGeneratedValues(IEnumerable<EntityBag> entityBags, Metadata metadata) {
			var generatedValues = new List<Tuple<GeneratedValue, bool>>();
			// populate auto-generated values
			foreach (var entityBagTmp in entityBags.Where(el => el.EntityState == EntityState.Added || el.EntityState == EntityState.Modified)) {
				var entityBag = entityBagTmp;
				var entityType = entityBag.EntityType;
				if (entityType == null) {
					if (metadata == null)
						throw new BeetleException(Resources.CannotGetGeneratedValues);

					var type = entityBag.Entity.GetType();
					var entityTypeName = string.Format("{0}, {1}", type.FullName, type.Assembly.GetName().Name);
					entityType = metadata.Entities.FirstOrDefault(e => e.Name == entityTypeName);
					if (entityType == null)
						throw new BeetleException(string.Format(Resources.CannotFindMetadata, entityTypeName));
				}

				var changedValues = GetGeneratedValues(entityBag.ClientEntity, entityBag.Entity, entityType);
				if (changedValues != null) {
					foreach (var changedValue in changedValues) {
						var isKeyPart = entityType.Keys.Contains(changedValue.Key);
						generatedValues.Add(new Tuple<GeneratedValue, bool>(new GeneratedValue(entityBag.Index, changedValue.Key, changedValue.Value), isKeyPart));
					}
				}
			}

			return generatedValues.OrderByDescending(x => x.Item2).Select(x => x.Item1);
		}

		/// <summary>
		/// Gets the changed values.
		/// </summary>
		/// <param name="clientEntity">The client entity.</param>
		/// <param name="entity">The entity.</param>
		/// <param name="entityType">Type of the entity.</param>
		/// <returns></returns>
		public static IEnumerable<KeyValuePair<string, object>> GetGeneratedValues(object clientEntity, object entity, EntityType entityType) {
			if (clientEntity == null)
				throw new ArgumentNullException("clientEntity");
			if (entity == null)
				throw new ArgumentNullException("entity");
			if (entityType == null)
				throw new ArgumentNullException("entityType");
			if (entity.GetType() != clientEntity.GetType())
				throw new BeetleException(Resources.EntityAndClientEntityMustBeSameTypeToCompare);

			var retVal = new List<KeyValuePair<string, object>>();

			// detect changed values after the client post.
			foreach (var property in entityType.AllDataProperties) {
				var oldValue = GetPropertyValue(clientEntity, property.Name);
				var newValue = GetPropertyValue(entity, property.Name);
				if (!Equals(oldValue, newValue))
					retVal.Add(new KeyValuePair<string, object>(property.Name, newValue));
			}
			foreach (var complexProperty in entityType.AllComplexProperties) {
				var oldValue = GetPropertyValue(clientEntity, complexProperty.Name);
				var newValue = GetPropertyValue(entity, complexProperty.Name);

				var generatedValues = GetGeneratedValues(oldValue, newValue, complexProperty.ComplexType);
				foreach (var generatedValue in generatedValues)
					retVal.Add(new KeyValuePair<string, object>(complexProperty.Name + "." + generatedValue.Key, generatedValue.Value));
			}

			return retVal;
		}

        /// <summary>
        /// Resolves the entities.
        /// </summary>
        /// <param name="bundle">The bundle.</param>
        /// <param name="config">The config.</param>
        /// <param name="metadata">The metadata.</param>
        /// <param name="unknownEntities">The unknown entities.</param>
        /// <returns></returns>
        /// <exception cref="InvalidOperationException">Cannot find tracker info.</exception>
        public static IEnumerable<EntityBag> ResolveEntities(dynamic bundle, BeetleConfig config, Metadata metadata, out IEnumerable<EntityBag> unknownEntities) {
			var jsonSerializer = config.CreateSerializer();

			var dynEntities = (JArray)bundle.entities;
			var entities = new List<EntityBag>();
			var unknowns = new List<EntityBag>();
			bool forceUpdatePackage = bundle.forceUpdate ?? false;
			foreach (dynamic dynEntity in dynEntities) {
				// get entity tracking information
				var tracker = dynEntity["$t"];
				if (tracker == null) throw new InvalidOperationException(Resources.CannotFindTrackerInfo);
				// get entity type and other information
				string typeName = tracker.t.ToString();
				var type = Type.GetType(typeName);
				var state = Enum.Parse(typeof(EntityState), tracker.s.ToString());
				var originalValues = new Dictionary<string, object>();
				// entity's index in the client save array
				var index = int.Parse(tracker.i.ToString());
				// read original values
				var ovs = tracker.o != null ? tracker.o as IEnumerable : null;
				if (ovs != null) {
					foreach (JProperty ov in ovs) {
						var loopType = ov.Name.Split('.').Aggregate(type, GetPropertyType);
						if (loopType == null)
							throw new BeetleException(string.Format(Resources.OriginalValuePropertyCouldNotBeFound, ov.Name));
						var value = jsonSerializer.Deserialize(new JTokenReader(ov.Value), loopType);
						originalValues.Add(ov.Name, value);
					}
				}
				var forceUpdate = forceUpdatePackage || (bool)(tracker.f ?? false);
                // deserialize entity
			    if (type != null) {
					var clientEntity = jsonSerializer.Deserialize(new JTokenReader(dynEntity), type);
					var entity = jsonSerializer.Deserialize(new JTokenReader(dynEntity), type);
                    EntityType entityType = null;
                    if (metadata != null)
                        entityType = metadata.Entities.FirstOrDefault(e => e.Name == typeName);
                    entities.Add(new EntityBag(clientEntity, entity, state, originalValues, index, entityType, forceUpdate));
				}
				else
					unknowns.Add(new EntityBag(dynEntity, dynEntity, state, originalValues, index, forceUpdate));
			}

			unknownEntities = unknowns;
			return entities;
		}

		/// <summary>
		/// Copies the values from serialized json object.
		/// </summary>
		/// <param name="source">The source.</param>
		/// <param name="destination">The destination.</param>
		/// <param name="config">The config.</param>
		public static void CopyValuesFromJson(string source, object destination, BeetleConfig config) {
			if (string.IsNullOrEmpty(source)) return;
			var obj = JsonConvert.DeserializeObject<JObject>(source, config.JsonSerializerSettings);
			var type = destination.GetType();
			var serializer = config.CreateSerializer();
			foreach (var p in obj.Properties()) {
				var propType = GetPropertyType(type, p.Name);
				var jValue = obj[p.Name];
				var value = serializer.Deserialize(jValue.CreateReader(), propType);
				SetPropertyValue(destination, p.Name, value);
			}
		}

		/// <summary>
		/// Validates the entities.
		/// </summary>
		/// <param name="entities">The entities.</param>
		/// <returns></returns>
		public static List<EntityValidationResult> ValidateEntities(IEnumerable entities) {
			var validationResults = new List<EntityValidationResult>();
			foreach (var entity in entities) {
				var results = new List<ValidationResult>();
				var context = new ValidationContext(entity, null, null);
				Validator.TryValidateObject(entity, context, results, true);
				if (results.Any())
					validationResults.Add(new EntityValidationResult(entity, results));
			}
			return validationResults;
		}

		/// <summary>
		/// Gets the beetle parameters.
		/// </summary>
		/// <param name="parameters">The parameters.</param>
		/// <returns></returns>
		public static List<KeyValuePair<string, string>> GetBeetleParameters(NameValueCollection parameters) {
			if (parameters == null) return null;

			return parameters
				.OfType<string>()
				.Where(k => !string.IsNullOrWhiteSpace(k) && k.StartsWith("!e"))
				.Select(k => {
					var v = parameters[k];
					var i = v.IndexOf(':');
					var exp = v.Substring(0, i);
					var args = v.Substring(i + 1);
					return new KeyValuePair<string, string>(exp, args);
				})
				.ToList();
		}

		/// <summary>
		/// Default implementation for request process.
		/// </summary>
		/// <param name="contentValue">The content value.</param>
		/// <param name="beetlePrms">The beetle PRMS.</param>
		/// <param name="actionContext">The action context.</param>
		/// <param name="service">The service.</param>
		/// <returns></returns>
		public static ProcessResult DefaultRequestProcessor(object contentValue, IEnumerable<KeyValuePair<string, string>> beetlePrms, ActionContext actionContext, IBeetleService service) {
			return DefaultRequestProcessor(contentValue, beetlePrms, actionContext, service, null, QueryableHandler.Instance, EnumerableHandler.Instance);
		}

		public static ProcessResult DefaultRequestProcessor(object contentValue, IEnumerable<KeyValuePair<string, string>> beetlePrms, ActionContext actionContext,
															IBeetleService service, IContextHandler contextHandler,
															IQueryHandler<IQueryable> queryableHandler, IContentHandler<IEnumerable> enumerableHandler) {
			var queryable = contentValue as IQueryable;
			if (queryable != null)
				return queryableHandler.HandleContent(queryable, beetlePrms, actionContext, service, contextHandler);

			if (!(contentValue is string)) {
				var enumerable = contentValue as IEnumerable;
				if (enumerable != null)
					return enumerableHandler.HandleContent(enumerable, beetlePrms, actionContext, service, contextHandler);
			}

			return new ProcessResult(actionContext) { Result = contentValue };
		}

		/// <summary>
		/// Gets the metadata.
		/// </summary>
		/// <param name="connection">The connection.</param>
		/// <param name="modelNamespace">The model namespace.</param>
		/// <param name="modelAssemblyName">Name of the model assembly.</param>
		/// <returns></returns>
		public static Metadata GetMetadata(IDbConnection connection, string modelNamespace = null, string modelAssemblyName = null) {
			var metadata = new Metadata(connection.Database);
			bool closeConnection;
			if (connection.State == ConnectionState.Closed) {
				connection.Open();
				closeConnection = true;
			}
			else
				closeConnection = false;

			using (var tablesCommand = connection.CreateCommand()) {
				const string schemaSql =
@"
select	distinct t.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_DEFAULT, c.IS_NULLABLE, c.DATA_TYPE, 
		c.CHARACTER_MAXIMUM_LENGTH, c.NUMERIC_PRECISION, c.NUMERIC_SCALE,
		case when COALESCE(ck.COLUMN_NAME, '') = '' then 0 else 1 end as IsKey,
		{0} as GenerationPattern
from INFORMATION_SCHEMA.TABLES t
	inner join INFORMATION_SCHEMA.COLUMNS c on t.TABLE_NAME = c.TABLE_NAME
	left join INFORMATION_SCHEMA.TABLE_CONSTRAINTS tk on t.TABLE_NAME = tk.TABLE_NAME and tk.CONSTRAINT_TYPE = 'PRIMARY KEY'
	left join INFORMATION_SCHEMA.KEY_COLUMN_USAGE ck on t.TABLE_NAME = ck.TABLE_NAME 
		and c.COLUMN_NAME = ck.COLUMN_NAME 
order by t.TABLE_NAME, c.COLUMN_NAME
";
				const string sqlServerGenerationPatternSql =
					"columnproperty(object_id(t.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity')+(2*columnproperty(object_id(t.TABLE_NAME), c.COLUMN_NAME, 'IsComputed'))";
				const string sqlCeGenerationPatternSql = "case when AUTOINC_NEXT > 0 then 1 else 0 end";
				const string mySqlGenerationPatternSql = "INSTR(EXTRA, 'auto_increment')";
				string generationPatternSql;
				// not the ideal solution but I couldn't find a better way
				var connectionType = connection.GetType().ToString();
				if (connectionType.Contains("SqlConnection"))
					generationPatternSql = sqlServerGenerationPatternSql;
				else if (connectionType.Contains("SqlCe"))
					generationPatternSql = sqlCeGenerationPatternSql;
				else if (connectionType.Contains("MySql") || connectionType.Contains("Oracle"))
					generationPatternSql = mySqlGenerationPatternSql;
				else
					generationPatternSql = "0";

				tablesCommand.CommandText = string.Format(schemaSql, generationPatternSql);
				using (var tablesReader = tablesCommand.ExecuteReader()) {
					EntityType entityType = null;
					Type clrType = null;
					while (tablesReader.Read()) {
						var tableName = tablesReader.GetString(0);
						var columnName = tablesReader.GetString(1);
						var defaultValue = tablesReader.GetValue(2);
						var isNullable = tablesReader.GetString(3) == "YES";
						var dataType = tablesReader.GetString(4);
						var maxLength = tablesReader.GetValue(5);
						var precision = tablesReader.GetValue(6);
						var scale = tablesReader.GetValue(7);
						var isKey = tablesReader.GetInt32(8) > 0;
						var generationPattern = tablesReader.GetInt32(9);

						if (entityType == null || entityType.ShortName != tableName) {
							var fullName = tableName;
							if (!string.IsNullOrEmpty(modelNamespace))
								fullName = modelNamespace + "." + fullName;
							if (!string.IsNullOrEmpty(modelAssemblyName))
								fullName += ", " + modelAssemblyName;
							// we use fullName to create instance of model class
							entityType = new EntityType(fullName, tableName) {
								QueryName = Pluralize(tableName)
							};
							clrType = Type.GetType(entityType.Name);
							entityType.ClrType = clrType;

							metadata.Entities.Add(entityType);
						}

						var dataTypeEnum = GetDataType(dataType);
						if (defaultValue != null) {
							var defaultStr = defaultValue.ToString();
							// todo: check if MySql, Oracle etc returns default value in parenthesis
							if (defaultStr.StartsWith("(("))
								defaultStr = defaultStr.Substring(2, defaultStr.Length - 4);
							else if (defaultStr.StartsWith("("))
								defaultStr = defaultStr.Substring(1, defaultStr.Length - 2);
							defaultValue = defaultStr;

							if (dataTypeEnum == DataType.Boolean)
								defaultValue = defaultStr == "1";
						}

						Func<string> displayNameGetter = null;
						string resourceName = null;
						GetDisplayInfo(clrType, columnName, ref resourceName, ref displayNameGetter);

						var dataProperty = new DataProperty(columnName, displayNameGetter) {
							ResourceName = resourceName,
							DataType = dataTypeEnum,
							DefaultValue = defaultValue == DBNull.Value ? null : defaultValue,
							EnumType = null,
							GenerationPattern = (GenerationPattern)generationPattern, // we cannot read this from INFORMATION_SCHEMA
							IsEnum = false,
							IsNullable = isNullable,
							Precision = precision == DBNull.Value ? (int?)null : Convert.ToInt32(precision),
							Scale = scale == DBNull.Value ? (int?)null : Convert.ToInt32(scale)
						};

						var iMaxLength = maxLength == DBNull.Value ? (int?)null : (int)maxLength;
						if (!isNullable)
							dataProperty.Validators.Add(Meta.Validator.Required(string.Format(Resources.RequiredError, columnName), "requiredError", false));
						if (iMaxLength.HasValue)
							dataProperty.Validators.Add(Meta.Validator.StringLength(string.Format(Resources.MaxLenError, columnName), "maxLenError", 0, iMaxLength.Value));
						if (isKey)
							entityType.Keys.Add(columnName);

						if (clrType != null)
							PopulateDataPropertyValidations(clrType, dataProperty, iMaxLength);

						entityType.DataProperties.Add(dataProperty);
					}
				}
			}

			using (var navigationCommand = connection.CreateCommand()) {
				navigationCommand.CommandText =
@"
select distinct FK.TABLE_NAME, CU.COLUMN_NAME, 
	   case when coalesce(CU2.COLUMN_NAME, '') = '' then 0 else 1 end as IsOneToOne, 
	   PK.TABLE_NAME, C.CONSTRAINT_NAME, c.DELETE_RULE
from INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS C
	inner join INFORMATION_SCHEMA.TABLE_CONSTRAINTS FK on C.CONSTRAINT_NAME = FK.CONSTRAINT_NAME
	inner join INFORMATION_SCHEMA.TABLE_CONSTRAINTS PK on C.UNIQUE_CONSTRAINT_NAME = PK.CONSTRAINT_NAME
	inner join INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU on C.CONSTRAINT_NAME = CU.CONSTRAINT_NAME
	left join INFORMATION_SCHEMA.TABLE_CONSTRAINTS FK2 on FK2.TABLE_NAME = FK.TABLE_NAME
		and FK2.CONSTRAINT_TYPE = 'PRIMARY KEY'
	left join INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU2 on FK2.CONSTRAINT_NAME = CU2.CONSTRAINT_NAME
		and CU.COLUMN_NAME = CU2.COLUMN_NAME
";
				using (var navigationReader = navigationCommand.ExecuteReader()) {
					while (navigationReader.Read()) {
						var fkTable = navigationReader.GetString(0);
						var fkColumn = navigationReader.GetString(1);
						var isOneToOne = navigationReader.GetInt32(2) > 0;
						var pkTable = navigationReader.GetString(3);
						var constraintName = navigationReader.GetString(4);
						var cascadeDelete = navigationReader.GetString(5) == "CASCADE";

						var fkEntity = metadata.Entities.First(e => e.ShortName == fkTable);
						var fkNavigation = fkEntity.NavigationProperties.FirstOrDefault(np => np.AssociationName == constraintName);
						if (fkNavigation == null) {
							Func<string> displayNameGetter = null;
							string resourceName = null;
							GetDisplayInfo(fkEntity.ClrType, fkNavigation.Name, ref resourceName, ref displayNameGetter);

							fkNavigation = new NavigationProperty(pkTable, displayNameGetter) {
								ResourceName = resourceName,
								AssociationName = constraintName,
								DoCascadeDelete = false,
								EntityTypeName = pkTable,
								IsScalar = true
							};
							fkEntity.NavigationProperties.Add(fkNavigation);
						}
						fkNavigation.ForeignKeys.Add(fkColumn);

						if (fkEntity.ClrType != null)
							PopulateNavigationPropertyValidations(fkEntity.ClrType, fkNavigation);

						var pkEntity = metadata.Entities.First(e => e.ShortName == pkTable);
						var pkNavigation = pkEntity.NavigationProperties.FirstOrDefault(np => np.AssociationName == constraintName);
						if (pkNavigation == null) {
							Func<string> displayNameGetter = null;
							string resourceName = null;
							GetDisplayInfo(pkEntity.ClrType, pkNavigation.Name, ref resourceName, ref displayNameGetter);

							var pkNavName = isOneToOne ? fkTable : Pluralize(fkTable);
							pkNavigation = new NavigationProperty(pkNavName, displayNameGetter) {
								ResourceName = resourceName,
								AssociationName = constraintName,
								DoCascadeDelete = cascadeDelete,
								EntityTypeName = fkTable,
								IsScalar = isOneToOne
							};
							pkEntity.NavigationProperties.Add(pkNavigation);
						}
						else
							pkNavigation.IsScalar &= isOneToOne;
						if (pkEntity.ClrType != null)
							PopulateNavigationPropertyValidations(pkEntity.ClrType, pkNavigation);
					}
				}
			}

			if (closeConnection)
				connection.Close();

			metadata.FixReferences();
			return metadata;
		}

		/// <summary>
		/// Gets the enum for data type.
		/// </summary>
		/// <param name="dataType">Type of the data.</param>
		/// <returns></returns>
		public static DataType GetDataType(string dataType) {
			switch (dataType) {
				case "tinyint":
					return DataType.Byte;
				case "int":
				case "bigint":
				case "smallint":
					return DataType.Int;
				case "decimal":
				case "float":
				case "money":
				case "numeric":
				case "real":
				case "smallmoney":
					return DataType.Number;
				case "char":
				case "nchar":
				case "varchar":
				case "nvarchar":
				case "text":
				case "ntext":
				case "xml":
				case "sql_variant":
					return DataType.String;
				case "bit":
					return DataType.Boolean;
				case "date":
				case "datetime":
				case "datetime2":
				case "smalldatetime":
					return DataType.Date;
				case "datetimeoffset":
					return DataType.DateTimeOffset;
				case "geography":
					return DataType.Geography;
				case "geometry":
					return DataType.Geometry;
				case "uniqueidentifier":
					return DataType.Guid;
				case "time":
					return DataType.Time;
				default:
					return DataType.Binary;
			}
		}

		/// <summary>
		/// Adds the data property validations.
		/// </summary>
		/// <param name="clrType">Type of the color.</param>
		/// <param name="dataProperty">The data property.</param>
		/// <param name="maxLen">The maximum length.</param>
		public static void PopulateDataPropertyValidations(Type clrType, DataProperty dataProperty, int? maxLen = null) {
			var clrProperty = clrType.GetMember(dataProperty.Name).FirstOrDefault();
			var clrPropertyType = GetPropertyType(clrType, dataProperty.Name);

			var displayName = dataProperty.GetDisplayName();
			var dataAnnotations = clrProperty.GetAttributes<ValidationAttribute>(true);
			foreach (var att in dataAnnotations) {
				string msg;
				var rmsg = att.ErrorMessageResourceName;
				try {
					msg = att.FormatErrorMessage(displayName);
				}
				catch {
					msg = null;
				}

				var re = att as RequiredAttribute;
				if (re != null) {
					dataProperty.Validators.Add(Meta.Validator.Required(msg, rmsg, re.AllowEmptyStrings));
					continue;
				}
				var sl = att as StringLengthAttribute;
				if (clrPropertyType == typeof(string) && sl != null) {
					var ml = maxLen.HasValue
						? (sl.MaximumLength < maxLen ? sl.MaximumLength : maxLen.Value)
						: sl.MaximumLength;
					dataProperty.Validators.Add(Meta.Validator.StringLength(msg, rmsg, sl.MinimumLength, ml));
					continue;
				}
				var mal = att as MaxLengthAttribute;
				if (clrPropertyType == typeof(string) && mal != null && mal.Length > 0) {
					dataProperty.Validators.Add(Meta.Validator.MaxLength(msg, rmsg, mal.Length));
					continue;
				}
				var mil = att as MinLengthAttribute;
				if (clrPropertyType == typeof(string) && mil != null && mil.Length > 0) {
					dataProperty.Validators.Add(Meta.Validator.MinLength(msg, rmsg, mil.Length));
					continue;
				}
				var ra = att as RangeAttribute;
				if (ra != null) {
					dataProperty.Validators.Add(Meta.Validator.Range(msg, rmsg, ra.Minimum, ra.Maximum));
					continue;
				}
				var rx = att as RegularExpressionAttribute;
				if (rx != null) {
					dataProperty.Validators.Add(Meta.Validator.RegularExpression(msg, rmsg, rx.Pattern));
					continue;
				}
				var dt = att as DataTypeAttribute;
				if (dt != null) {
					switch (dt.DataType) {
						case ValidatorType.EmailAddress:
							dataProperty.Validators.Add(Meta.Validator.EmailAddress(msg, rmsg));
							break;
						case ValidatorType.CreditCard:
							dataProperty.Validators.Add(Meta.Validator.CreditCard(msg, rmsg));
							break;
						case ValidatorType.ImageUrl:
						case ValidatorType.Url:
							dataProperty.Validators.Add(Meta.Validator.Url(msg, rmsg));
							break;
						case ValidatorType.PhoneNumber:
							dataProperty.Validators.Add(Meta.Validator.PhoneNumber(msg, rmsg));
							break;
						case ValidatorType.PostalCode:
							dataProperty.Validators.Add(Meta.Validator.PostalCode(msg, rmsg));
							break;
						case ValidatorType.Time:
							dataProperty.Validators.Add(Meta.Validator.Time(msg, rmsg));
							break;
					}
				}
				var co = att as CompareAttribute;
				if (co != null)
					dataProperty.Validators.Add(Meta.Validator.Compare(msg, rmsg, co.OtherProperty));
			}
		}

		/// <summary>
		/// Adds the navigation property validations.
		/// </summary>
		/// <param name="clrType">Type of the color.</param>
		/// <param name="navigationProperty">The navigation property.</param>
		public static void PopulateNavigationPropertyValidations(Type clrType, NavigationProperty navigationProperty) {
			var clrProperty = clrType.GetMember(navigationProperty.Name).FirstOrDefault();

			var displayName = navigationProperty.GetDisplayName();
			var dataAnnotations = clrProperty.GetAttributes<ValidationAttribute>(true);
			foreach (var att in dataAnnotations) {
				string msg;
				var rmsg = att.ErrorMessageResourceName;
				try {
					msg = att.FormatErrorMessage(displayName);
				}
				catch {
					msg = null;
				}

				var mal = att as MaxLengthAttribute;
				if (mal != null && mal.Length > 0) {
					navigationProperty.Validators.Add(Meta.Validator.MaxLength(msg, rmsg, mal.Length));
					continue;
				}
				var mil = att as MinLengthAttribute;
				if (mil != null && mil.Length > 0)
					navigationProperty.Validators.Add(Meta.Validator.MinLength(msg, rmsg, mil.Length));
			}
		}

		/// <summary>
		/// Creates the client hash for given string.
		/// </summary>
		public static void GetDisplayInfo(Type type, string memberName, ref string resourceName, ref Func<string> displayNameGetter) {
			if (type != null) {
				var propertyInfo = type.GetMember(memberName).FirstOrDefault();
				if (propertyInfo != null) {
					var displayAttribute = propertyInfo.GetAttributes<DisplayAttribute>(true).FirstOrDefault();
					if (displayAttribute != null) {
						displayNameGetter = displayAttribute.GetName;
						resourceName = displayAttribute.Name;
					}
				}
			}
		}

		/// <summary>
		/// Creates the client hash for given string.
		/// </summary>
		/// <param name="saltStr">The salt string.</param>
		/// <returns></returns>
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
