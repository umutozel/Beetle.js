/**
 * @module
 * Beetle module.
 */
declare module beetle {

    /** Promise abstraction. We can change Ajax Provider result via this type. */
	type AjaxCall<T> = PromiseLike<T>;

    /** Beetle interfaces. Some polyfill, other duck typing signatures. */
	namespace interfaces {

        /** Key-value pair collection. */
		interface Dictionary<T> {
			[key: string]: T;
		}

        /** GroupBy produces this after key selection and pass to value selection. */
		interface Grouping<T, TKey> extends Array<T> {
			Key: TKey;
		}

        /** GroupBy without value selection produces this interface as result. */
		interface Grouped<T, TKey> {
            Key: TKey;
            /** Grouped items. */
			Items: Array<T>;
		}

        /** When a trackable array change, event args has this properties. */
		interface ArrayChangeEventArgs {
			added: Array<any>;
			removed: Array<any>;
		}

        /** When a validation state change, event args has this properties. */
        interface ValidationErrorsChangedEventArgs {
            /** Current errors. */
			errors: ValidationError[];
            /** Newly added validation errors. */
            added: ValidationError[];
            /** Newly fixed validation errors. */
			removed: ValidationError[];
		}

        /** When state change for an entity, event args has this properties. */
        interface EntityStateChangedEventArgs {
			entity: IEntity;
			oldState: enums.entityStates;
            newState: enums.entityStates;
            /** Indicates if entity was in Unchanged state before. */
			newChanged: boolean;
		}

        /** When a property value change for an entity, event args has this properties. */
        interface PropertyChangedEventArgs {
			entity: IEntity;
			property: Property;
			oldValue: any;
			newValue: any;
		}

        /** When an array member of an entity is changed, event args has this properties (for internal use only). */
        interface ArrayChangedEventArgs {
			entity: IEntity;
			property: Property;
			items: Array<IEntity>;
			removedItems: Array<IEntity>;
			addedItems: Array<IEntity>;
		}

        /** When an entity state is changed or there is no more changed entity, an event is fired with this properties. */
		interface HasChangesChangedEventArgs {
            /** Indicates if entity manager has any changes. */
			hasChanges: boolean;
		}

        /** Before a query is executed, an event is fired with this properties. */
		interface QueryExecutingEventArgs {
            manager: core.EntityManager;
            /** Query can be changed by setting this value. */
			query: querying.EntityQuery<any>;
            /** Query options can be changed by setting this value. */
            options: ManagerQueryOptions;
		}

        /** After a query executed, an event is fired with this properties. */
        interface QueryExecutedEventArgs extends QueryExecutingEventArgs {
			result: any;
		}

        /** Before manager saves changes, an event is fired with this properties. */
		interface SaveEventArgs {
			manager: core.EntityManager;
			changes: IEntity[];
			options: ManagerSaveOptions;
		}

        /** This properties are used for global messages (i.e. warnings, infos). */
		interface MessageEventArgs {
			message: string;
			query: Query<any>;
			options: ManagerQueryOptions;
		}

        /** Beetle converts plural navigation properties to TrackableArrays to track changes on collections. */
		interface TrackableArray<T> extends Array<T> {
			object: any;
            property: string;
            /** Called after a change made on the array. */
			after: (o: any, s: string, a: TrackableArray<T>, removed: T[], added: T[]) => void;
			changing: Event<ArrayChangeEventArgs>;
			changed: Event<ArrayChangeEventArgs>;

            /** Adding remove capability to array. */
			remove(...T): T[];
			load(expands: string[], resourceName: string, options: ManagerQueryOptions,
				 successCallback?: (items: T[]) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<QueryResultArray<T>>;
		}

        /** All validator objects have these properties. */
		interface Validator {
            /** Validator name. */
            name: string;
            /** Validation error message. Arguments might be used when formatting the message. */
            message: string;
            /** Validation arguments. */
			args?: any;

			toString(): string;
		}

        /** Validates the value of the property. */
		interface PropertyValidator extends Validator {
			validate(value: any, entity: IEntity): string;
		}

        /** Validates all values of the entity. */
        interface EntityValidator extends Validator {
			validate(entity: IEntity): string;
		}

        /** Property validators produces error messages compatible with this interface. */
		interface ValidationError {
			message: string;
			entity: IEntity;
            /** If validation error is created for a property, this will be available. */
			property?: string;
            /** If validation error is created for a property, this will be available. */
            value?: any;
		}

        /** Entity validators produces error messages compatible with this interface. */
        interface EntityValidationError {
			entity: IEntity;
			validationErrors: ValidationError[];
		}

        /** Manager keeps tracks of all error messages using this interface. */
        interface ManagerValidationError extends Error {
			entities: IEntity[];
			entitiesInError: EntityValidationError[];
			manager: core.EntityManager;
		}

        /** All data types share this common structure. */
		interface DataTypeBase {
            name: string;
            /** Complex Type are based on Entity Framework's. */
			isComplex: boolean;

            toString(): string;
            /** Returns network transferable value for the data type. */
			getRawValue(value: any): string;
            /** Checks if given value is valid for this type. */
			isValid(value: any): boolean;
			/** Converts given value to OData format. */
			toODataValue(value: any): string;
			/** Converts given value to Beetle format. */
            toBeetleValue(value: any): string;
            /** Gets default value for type. */
            defaultValue(): any;
            /** Generates a new unique value for this type. Used for auto-incremented values. */
            autoValue(): any;
            /** Tries to convert given value to this type. */
            handle(value: any): any;
		}

        /** Base type for all metadata types. */
		interface MetadataPart {
			name: string;
			displayName?: string;

            toString(): string;
			validate(entity: IEntity): ValidationError[];
		}

        /** Shared interface for DataProperty and NavigationProperty. */
        interface Property extends MetadataPart {
			owner: EntityType;
            /** Complex Type are based on Entity Framework's. */
            isComplex: boolean;
			validators: PropertyValidator[];

            /** Adds validation for the property dynamically. */
			addValidation(name: string, func: (value: any, entity: IEntity) => string, message: string, args?: any);
		}

        /** Primitive member metadata. */
		interface DataProperty extends Property {
			dataType: DataTypeBase;
            isNullable: boolean;
            /** Indicates if this property is one of the primary keys. */
            isKeyPart: boolean;
            /** Auto generation strategy for the property (Identity, Computed, None). */
			generationPattern?: enums.generationPattern;
			defaultValue: any;
            /** When true, this property will be used together with keys for updates. */
            useForConcurrency: boolean;
            /** Navigation properties based on this property. */
            relatedNavigationProperties: NavigationProperty[];
			isEnum: boolean;

			isValid(value: any): boolean;
			handle(value: any): any;
			getDefaultValue(): any;
		}

        /** Relational member metadata. */
		interface NavigationProperty extends Property {
			entityTypeName: string;
			entityType: EntityType;
			isScalar: boolean;
            /** To be able to match two way relations. Same relations have same association name for both side. */
			associationName: string;
            /** Indicates if deleting this related entity causes cascade deletion. */
			cascadeDelete: boolean;
			foreignKeyNames: string[];
			foreignKeys: DataProperty[];
            /** After this property changed, owner will also be marked as modified. */
			triggerOwnerModify: boolean;

            /** Other side of the navigation. */
			inverse?: NavigationProperty;
            /** Checks if given value can be assigned to this property. If not throws an error. */
            checkAssign(entity: IEntity);
		}

        /** Entity type metadata. */
        interface EntityType extends MetadataPart {
            /** Entity type's short name (i.e. 'Customer'). */
			shortName: string;
			keyNames: string[];
			baseTypeName: string;
            /** Entity set name. If this Entity is derived from another, set name is the root entity's name. */
            setName: string;
            /** Entity set type name. If this Entity is derived from another, set type is the root entity's type. */
			setTypeName: string;
            metadataManager: metadata.MetadataManager;
            /** Automatically filled EntityType will be used for unknown entities. */
            hasMetadata: boolean;
            /** Properties that are not in metadata but available on the entity. */
			properties: string[];
            /** Complex Type are based on Entity Framework's. */
            isComplexType: boolean;
			dataProperties: DataProperty[];
			navigationProperties: NavigationProperty[];
			keys: DataProperty[];
            /** Lowest entity type in the inheritance hierarchy. */
			floorType: EntityType;
			baseType: EntityType;
            validators: EntityValidator[];
            /** Constructor function. Called right after the entity object is generated. */
            constructor: (entity: RawEntity) => void;
            /** Initializer function. Called after entity started to being tracked (properties converted to observable). */
			initializer: (entity: IEntity) => void;

            /** Parses given string and finds property, looks recursively to navigation properties when needed. */
			getProperty(propertyPath: string): Property;
            /**
             * Register constructor and initializer (optional) for the type.
             * @param constructor Constructor function. Called right after the entity object is generated.
             * @param initializer Initializer function. Called after entity started to being tracked (properties converted to observable).
             */
			registerCtor(ctor?: (entity: RawEntity) => void, initializer?: (entity: IEntity) => void);
			createEntity(initialValues: Object): IEntity;
            createRawEntity(initialValues: Object): RawEntity;
            /** Checks if this type can be set with given type. */
			isAssignableWith(otherType: EntityType): boolean;
            /** Checks if this type can be set to given type. */
            isAssignableTo(otherType: EntityType): boolean;
            /** Add new validation method to entity type. */
			addValidation(name: string, func: (entity: IEntity) => string, message: string, args?: any);
		}

        /** Beetle uses this interface internally. */
		interface InternalSet<T extends IEntity> {
			toString(): string;
			getEntity(key: string): T;
			getEntities(): T[];
		}

        /** Server and array query shared interface */
		interface Query<T> {
            /**
             * Indicates wheter or not include total count in result.
             * @param isEnabled When true, total count will be included in result. Default value: true.
             */
			inlineCount(isEnabled?: boolean): Query<T>;
            /**
             * If model has inheritance, when querying base type we can tell which derived type we want to load.
             * @param typeName Derived type name.
             */
			ofType<TResult extends T>(type: string | (new () => TResult)): Query<TResult>;
            /**
             * Filter query based on given expression.
             * @param predicate A function to test each element for a condition (can be string expression).
             * @param varContext Variable context for the expression.
             */
			where(predicate: string, varContext?: any): Query<T>;
            /**
             * Sorts results based on given properties.
             * @param properties The properties to sort by.
             * @param isDesc Indicates if sorting will be descending. Default value is false.
             */
            orderBy(keySelector?: string | ((o: T) => any)): Query<T>;
            /**
             * Sorts results based on given properties descendingly.
             * @param properties The properties to sort by.
             */
            orderByDesc(keySelector?: string | ((o: T) => any)): Query<T>;
            /**
             * Selects only given properties using projection.
             * @param properties Properties or PropertyPaths to select (project).
             */
			select<TResult>(selector: string | string[] | ((entity: T) => TResult)): Query<TResult>;
			select<TResult>(...selectors: string[]): Query<TResult>;
			select(selector: string | string[] | ((entity: T) => any)): Query<any>;
			select(...selectors: string[]): Query<any>;
            /**
             * Skips given count records and start reading.
             * @param count The number of items to skip.
             */
			skip(count: number): Query<T>;
            /**
             * Takes only given count records.
             * @param count The number of items to take.
             */
			take(count: number): Query<T>;
            /**
             * Takes only given count records .
             * @param count The number of items to take.
             */
			top(count: number): Query<T>;
            /**
             * Groups query by given keys (projects them into a new type) and returns values (projecting into new type).
             * @param keySelector A projection to extract the key for each element.
             * @param valueSelector A projection to create a result value from each group.
             */
			groupBy<TKey, TResult>(keySelector: ((entity: T) => TKey), valueSelector: ((group: Grouping<T, TKey>) => TResult)): Query<TResult>;
			groupBy<TKey>(keySelector: ((entity: T) => TKey)): Query<Grouped<T, TKey>>;
			groupBy<TResult>(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: Grouping<T, any>) => TResult)): Query<TResult>;
			groupBy(keySelector: string | ((entity: T) => any)): Query<Grouped<T, any>>;
			groupBy(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: Grouping<T, any>) => any)): Query<any>;
            /**
             * Gets only distinct items, when selector is given it will be used as comparer (project and compares projected objects).
             * @param selector A projection to extract the key for each element.
             */
			distinct(): Query<T>;
			distinct<TResult>(selector: string | ((entity: T) => TResult)): Query<TResult>;
			distinct(selector: string | ((entity: T) => any)): Query<any>;
            /** Reverse the collection. */
			reverse(): Query<T>;
            /**
             * Selects given collection property for each element and returns all in a new array.
             * @param properties Properties or PropertyPaths to select (project).
             */
			selectMany<TResult>(selector: string | ((entity: T) => Array<TResult>)): Query<TResult>;
			selectMany(selector: string | ((entity: T) => any)): Query<any>;
            /**
             * Gets all the items after first succesful predicate.
             * @param predicate A function to test each element for a condition (can be string expression).
             * @param varContext Variable context for the expression.
             */
			skipWhile(predicate: string, varContext?: any): Query<T>;
            /**
             * Gets all the items before first succesful predicate.
             * @param predicate A function to test each element for a condition (can be string expression).
             * @param varContext Variable context for the expression.
             */
			takeWhile(predicate: string, varContext?: any): Query<T>;
		}

        /** After an executer function called on a server query, this interface is returned. */
		interface ClosedQueryable<T, TOptions> {
            /** Executes this query using related entity manager. */
			execute(options?: TOptions, successCallback?: (result: T) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<T>;
            /** Executes this query using related entity manager. */
            execute<TResult>(options?: TOptions, successCallback?: (result: TResult) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<TResult>;
            /** Executes this query using related entity manager. Shortcut for 'execute'. */
            x(options?: TOptions, successCallback?: (result: T) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<T>;
            /** Executes this query using related entity manager. Shortcut for 'execute'. */
            x<TResult>(options?: TOptions, successCallback?: (result: TResult) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<TResult>;
            /** Executes this query using related entity manager. Shortcut for 'execute(...).then'. */
            then(successCallback: (result: T) => void, errorCallback?: (e: AjaxError) => void, options?: TOptions): AjaxCall<T>;
		}

        /** Server query parameters are kept with this structure. */
		interface EntityQueryParameter {
			name: string;
			value: any;
		}

        /** When enabled these extra information will be attached to server results. */
        interface QueryResultExtra {
            /** Server can send custom data using this property (carried using a http header). */
			userData: string;
            /** Http header getter function. */
			headerGetter: (name: string) => string;
            /** When ajax provider exposes xhr, this property will be available. */
            xhr: any;
		}

        /** Server array results have these extra properties (when enabled). */
        interface QueryResultArray<T> extends Array<T> {
            /** Extra information about query (when enabled). */
            $extra: QueryResultExtra;
            /** Inline count (calculated excluding skip-take from query).  */
			$inlineCount?: number;
		}

        /** Beetle uses some minified objects to reduce package size. */
		interface PropertyValue {
            /** Property name. */
			p: string;
            /** Property value. */
			v: any;
		}

        /** This interface is used to track complex types' owners. */
		interface OwnerValue {
			owner: IEntity;
			property: Property;
		}

        /** Entity tracker interface. Change tracking is made using this structure. */
		interface Tracker {
			entity: IEntity;
			entityType: EntityType;
			entityState: enums.entityStates;
            /** When true, entity will be updated -even there is no modified property. */
            forceUpdate: boolean;
            /** Initial values of changed properties. */
			originalValues: PropertyValue[];
            /** Previously accepted values of changed properties. */
			changedValues: PropertyValue[];
			manager: core.EntityManager;
			owners: OwnerValue[];
            /** Validation errors for the entity. */
			validationErrors: ValidationError[];
			validationErrorsChanged: core.Event<ValidationErrorsChangedEventArgs>;
			entityStateChanged: core.Event<EntityStateChangedEventArgs>;
			propertyChanged: core.Event<PropertyChangedEventArgs>;
            arrayChanged: core.Event<ArrayChangedEventArgs>;
            /** Entity's primary key value (multiple keys will be joined with '-'). */
			key: string;

			toString(): string;
			isChanged(): boolean;
            /** Clears all navigations and marks entity as Deleted. */
            delete();
            /** Clears all navigations and detached entity from its manager. */
            detach();
			toAdded();
			toModified();
            /** Marks entity as Deleted. */
            toDeleted();
			toUnchanged();
			toDetached();
            /** Resets all changes to initial values. */
            rejectChanges();
            /** Resets all changes to last accepted values. */
            undoChanges();
            /** Accept all changes. */
            acceptChanges();
            /** Gets internal value of the property from observable entity. */
            getValue(property: string);
            /** Sets internal value of the property of observable entity. */
			setValue(property: string, value: any);
            /** Gets original value for property. */
			getOriginalValue(property: string): any;
            /** 
             * Get foreign key value for this navigation property.
             * @returns Comma separated foreign keys.
             */
			foreignKey(navProperty: NavigationProperty): string;
            /** Creates a query that can load this navigation property. */
			createLoadQuery<T extends IEntity>(navPropName: string, resourceName: string): querying.EntityQuery<T>;
			loadNavigationProperty(navPropName: string, expands: string[], resourceName: string, options?: ManagerQueryOptions,
				                   successCallback?: (result: any) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<any>;
			validate(): ValidationError[];
            /** 
             * Creates a raw javascript object representing this entity.
             * @param includeNavigations When true, all navigation values will be included (recursively, so be careful it can cause stack overflow).
             */
            toRaw(includeNavigations?: boolean): any;
		}

        /** Beetle uses some minified objects to reduce package size. */
        interface TrackInfo {
            /** Type name. */
			t: string;
            /** Entity state name. */
            s: string;
            /** Save index in the save array. */
			i: number;
            /** When true, entity will be updated -even there is no modified property. */
            f?: boolean;
            /** Original values object. */
			o?: any;
		}

        /** Exported entity tracking information are kept with this structure. It's like basic version of EntityTracker. */
        interface ExportEntity {
            /** Entity tracking information. */
			$t: TrackInfo;
		}

        /** Changes are merged in a package to use in server request. */
		interface SavePackage {
            /** These entities will be sent to server for persistence. */
			entities: ExportEntity[];
            /** when true, each entity will be updated -even there is no modified property. */
			forceUpdate?: boolean;
            /** We can send custom data to server using this property (carried using a http header). */
            userData: string;
		}

        /** 
         * Server side generated value is carried back to client in this structure. 
         * Index is the entity's index in the save package.
         */
		interface GeneratedValue {
            /** Entity's save index in the save array. */
            Index: number;
            /** Server side changed property name. */
            Property: string;
            /** Server side assigned value. */
			Value: any;
		}

        /** Server sends back this structure after a succesful save. */
		interface SaveResult {
            /** Affected record count after the save. */
            AffectedCount: number;
            /** Server side generated changes on existing entities. */
            GeneratedValues: GeneratedValue[];
            /** Server side generated entities, will be merged to local cache. */
            GeneratedEntities: IEntity[];
            /** Server can send custom data using this property (carried using a http header). */
			UserData: string;
		}

        /** Entities read from Beetle server has these properties (before converting to observables). */
		interface RawEntity {
            /** Entity type's full name (i.e. 'Package.Model.Customer'). */
			$type: string;
            /** Extra information about query (when enabled). */
            $extra?: QueryResultExtra;
		}

        /** Internationalization members. */
		interface I18N {
			argCountMismatch: string;
			arrayEmpty: string;
			arrayNotSingle: string;
			arrayNotSingleOrEmpty: string;
			assignError: string;
			assignErrorNotEntity: string;
			autoGeneratedCannotBeModified: string;
			beetleQueryChosenMultiTyped: string;
			beetleQueryChosenPost: string;
			beetleQueryNotSupported: string;
			cannotBeEmptyString: string;
			cannotCheckInstanceOnNull: string;
			cannotDetachComplexTypeWithOwners: string;
			compareError: string;
			complexCannotBeNull: string;
			couldNotLoadMetadata: string;
			couldNotLocateNavFixer: string;
			couldNotLocatePromiseProvider: string;
			couldNotParseToken: string;
			countDiffCantBeCalculatedForGrouped: string;
			dataPropertyAlreadyExists: string;
			entityAlreadyBeingTracked: string;
			entityNotBeingTracked: string;
			executionBothNotAllowedForNoTracking: string;
			expressionCouldNotBeFound: string;
			functionNeedsAlias: string;
			functionNotSupportedForOData: string;
			instanceError: string;
			invalidArguments: string;
			invalidDefaultValue: string;
			invalidEnumValue: string;
			invalidExpression: string;
			invalidPropertyAlias: string;
			invalidStatement: string;
			invalidValue: string;
			managerInvalidArgs: string;
			maxLenError: string;
			maxPrecisionError: string;
			mergeStateError: string;
			minLenError: string;
			noMetadataEntityQuery: string;
			noMetadataRegisterCtor: string;
			noOpenGroup: string;
			notFoundInMetadata: string;
			notImplemented: string;
			notNullable: string;
			oDataNotSupportMultiTyped: string;
			onlyManagerCreatedCanBeExecuted: string;
			onlyManagerCreatedCanAcceptEntityShortName: string;
			pendingChanges: string;
			pluralNeedsInverse: string;
			projectionsMustHaveAlias: string;
			propertyNotFound: string;
			queryClosed: string;
			rangeError: string;
			requiredError: string;
			sameKeyExists: string;
			sameKeyOnDifferentTypesError: string;
			settingArrayNotAllowed: string;
			stringLengthError: string;
			syncNotSupported: string;
			twoEndCascadeDeleteNotAllowed: string;
			typeError: string;
			typeMismatch: string;
			typeRequiredForLocalQueries: string;
			unclosedQuote: string;
			unclosedToken: string;
			unexpectedProperty: string;
			unexpectedToken: string;
			unknownDataType: string;
			unknownExpression: string;
			unknownFunction: string;
			unknownParameter: string;
			unknownValidator: string;
			unsoppertedState: string;
			validationErrors: string;
			validationFailed: string;
			valueCannotBeNull: string;
			operatorNotSupportedForOData: string;
		}
	}

    /** Beetle entities have these properties (after converting to observables). */
    interface IEntity {
		$tracker: interfaces.Tracker;
        /** Extra information about query (when enabled). */
        $extra?: interfaces.QueryResultExtra;
	}

    /** Entity related options. */
	interface EntityOptions {
		merge?: enums.mergeStrategy;
		state?: enums.entityStates;
        /** Automatically fix scalar navigations using foreign keys (fast). */
		autoFixScalar?: boolean;
        /** Automatically fix plural navigations looking for foreign references (slow). */
		autoFixPlural?: boolean;
	}

    /** Data service query options. */
    interface ServiceQueryOptions {
        /** When true, all values will be handled by their value (i.e. some type changes, string->Date). */
        handleUnmappedProperties?: boolean;
        /** Use POST method when making request. Useful for large queries (some web servers can't process very large query strings). */
		usePost?: boolean;
        /** Web method to use (i.e. PUT, POST, GET etc..). */
		method?: string;
        /** The type of data that you're expecting back from the server. */
		dataType?: string;
        /** Type of data you're sending. */
        contentType?: string;
        /** Use async for ajax operation. Default is true. Be careful, some AjaxProviders does not support sync. */
		async?: boolean;
        /** Ajax request timeout. */
        timeout?: boolean;
        /** AjaxProvider extra settings. These will be mixed to ajax options. */
        extra?: any;
        /** Server uri to join with base address. To override existing resource address. */
        uri?: string;
        /** Request headers. */
		headers?: any;
        /** When enabled, if AjaxProvider exposes xhr, this will be attached to the results (via $extra). */
        includeXhr?: boolean;
        /** When enabled, response header getter function will be attached to the results (via $extra). */ 
		includeHeaderGetter?: boolean;
	}

    /** Entity manager query options. */
    interface ManagerQueryOptions extends ServiceQueryOptions {
		merge?: enums.mergeStrategy;
		execution?: enums.executionStrategy;
        /** Automatically fix scalar navigations using foreign keys (fast). */
		autoFixScalar?: boolean;
        /** Automatically fix plural navigations looking for foreign references (slow). */
		autoFixPlural?: boolean;
        /** Variable context for the query. */
		varContext?: any;
        /** Even service supports another query format (like OData), use Beetle format instead for this query. */
		useBeetleQueryStrings?: boolean;
	}

    /** Data service constructor options. */
	interface ServiceOptions {
        /** Ajax request timeout. */
        ajaxTimeout?: number;
        /** The type of data that you're expecting back from the server. */
        dataType?: string;
        /** Type of data you're sending. */
        contentType?: string;
        /** Creates properties for entity sets on the manager. */
		registerMetadataTypes?: boolean;
		ajaxProvider?: baseTypes.AjaxProviderBase;
		serializationService?: baseTypes.SerializationServiceBase;
	}

    /** Entity manager constructor options. */
	interface ManagerOptions extends ServiceOptions {
        /** Automatically fix scalar navigations using foreign keys (fast). */
		autoFixScalar?: boolean;
        /** Automatically fix plural navigations looking for foreign references (slow). */
        autoFixPlural?: boolean;
        /** Every merged entity will be validated. */
		validateOnMerge?: boolean;
        /** Validates entities before save. */
        validateOnSave?: boolean;
        /** Every change triggers a re-validation. Effects can be seen on EntityManager's validationErrors property. */
		liveValidate?: boolean;
        /** When true, all values will be handled by their value (i.e. some type changes, string->Date). */
		handleUnmappedProperties?: boolean;
        /** When true, entity will be updated -even there is no modified property. */
        forceUpdate?: boolean;
        /** Use async for ajax operation. Default is true. Be careful, some AjaxProviders does not support sync. */
		workAsync?: boolean;
		/** When true, while creating save package; for modified only changed and key properties, for deleted only key properties will be used. */
        minimizePackage?: boolean;
		promiseProvider?: baseTypes.PromiseProviderBase;
	}

    /** 
     * Entity exporting options.
     * Beetle can exclude unchanged properties for modified entities to reduce package size (server side needs to support this).
     */
	interface ExportOptions {
        /* When true, while creating save package, for modified only changed and key properties, for deleted only key properties will be used. */
		minimizePackage?: boolean;
	}

    /** Options used when creating a save package. */
	interface PackageOptions extends ExportOptions {
        /** Validates entities before save. */
		validateOnSave?: boolean;
        /** We can send custom data to server using this property (carried using a http header). */
        userData?: string;
        /** when true, each entity will be updated -even there is no modified property. */
        forceUpdate?: boolean;
	}

    /** Data service options for save operation. */
	interface ServiceSaveOptions {
        /** Use async for ajax operation. Default is true. Be careful, some AjaxProviders does not support sync. */
        async?: boolean;
        /** Ajax request timeout. */
		timeout?: number;
        /** AjaxProvider extra settings. These will be mixed to ajax options. */
		extra?: any;
        /** Server uri to join with base address. To override existing resource address. */
		uri?: string;
        /** To override existing save address (default is 'SaveChanges'). */
        saveAction?: string;
        /** Request headers. */
		headers?: any;
        /** When enabled, if AjaxProvider exposes xhr, this will be attached to the results (via $extra). */
		includeXhr?: boolean;
        /** When enabled, response header getter function will be attached to the results (via $extra). */ 
		includeHeaderGetter?: boolean;
	}

    /** 
     * General save options.
     * When extra entities are returned from save operation (via GeneratedEntities property), this options are used for merging with local cache.
     */
    interface PackageSaveOptions extends PackageOptions, ServiceSaveOptions {
        /** Automatically fix scalar navigations using foreign keys (fast). */
		autoFixScalar?: boolean;
        /** Automatically fix plural navigations looking for foreign references (slow). */
        autoFixPlural?: boolean;
	}

    /** Entity manager save options, all save options are together. */
	interface ManagerSaveOptions extends PackageSaveOptions {
		entities?: IEntity[];
	}

    /** Beetle passes this interface to ObservableProviders for them to make entity observable. For advanced use only. */
	interface ObservableProviderCallbackOptions {
		propertyChange: (entity: any, property: string, accessor: (v?: any) => any, newValue: any) => void;
		arrayChange: (entity: any, property: string, items: Array<any>, removed: Array<any>, added: Array<any>) => void;
		dataPropertyChange: (entity: any, property: interfaces.DataProperty, accessor: (v?: any) => any, newValue) => void;
		scalarNavigationPropertyChange: (entity: any, property: interfaces.NavigationProperty, accessor: (v?: any) => any, newValue: any) => void;
		pluralNavigationPropertyChange: (entity: any, property: interfaces.NavigationProperty, items: Array<any>, removed: Array<any>, added: Array<any>) => void;
		arraySet: (entity: any, property: string, oldArray: Array<any>, newArray: Array<any>) => void;
	}

    /**
     * Ajax operation error structure.
     * Some properties are not available for some libraries (like angular).
     * Error callback objects might contain library dependent members.
     */
	interface AjaxError extends Error {
        /** Error status code (i.e. 400, 500). */
        status: number;
        /** Ajax provider specific extra information about error. */
		detail: any;
		manager: core.EntityManager;
		query: querying.EntityQuery<any>;
        /** Ajax provider's error object (when available). */
		error?: any;
        /** Xhr object used in the request (available only if AjaxProvider exposes xhr). */
        xhr?: XMLHttpRequest;
	}

	/** Helper functions. We are trying not to use ECMA 5, so we polyfill some methods. */
    namespace helper {
		/**
         * Creates an assert instance to work with, a shortcut.
         * @example
         * helper.assertPrm(prm, 'prm').isArray().check()
         * @param value The value of parameter.
         * @param name The name of the parameter.
         */
        function assertPrm(obj1: any, name: string): Assert;
		/**
         * Combines first object's properties with second object's properties on a new object.
         * @param obj1 The first object.
         * @param obj2 The second object.
         * @returns New object containing all properties from both objects.
         */
        function combine(obj1: Object, obj2: Object): any;
		/**
         * Extends obj1 with obj2's properties.
         * @param obj1 The main object.
         * @param obj2 Object to extend with.
         * @returns obj1 is returned.
         */
        function extend(obj1: Object, obj2: Object): any;
        /**
         * Checks if the given two are equal. if parameters are both objects, recursively controls their properties too.
         * @param obj1 The first object.
         * @param obj2 The second object.
         * @returns True when two objects are equal, otherwise false.
         */
		function objEquals(obj1: Object, obj2: Object): boolean;
		/**
         * Format string using given arguments. %1 and {1} format can be used for placeholders.
         * @param string String to format.
         * @param params Values to replace.
         */
        function formatString(str: string, ...params: string[]): string;
        /**
         * Finds the index of the given item in the array.
         * @param array Array to search.
         * @param item Item to find.
         * @param index Start index.
         * @returns Found index. If the item could not be found returns '-1'.
         */
		function indexOf(array: any[], item, start?: number): number;
        /**
         * Calls given callback with item and current index parameters for each item in the array.
         * @param array Array to iterate.
         * @param callback Method to call for each item.
         */
		function forEach(array: any[], callback: (item, idx) => void);
        /**
         * Iterate objects properties and skips ones starting with '$'.
         * @param object Object to iterate.
         * @param callback Method to call for each property.
         */
		function forEachProperty(object: any, callback: (propName: string, value: any) => void);
        /**
         * Finds given item in the array.
         * When property is given, looks item's property value, otherwise compares item's itself.
         * @param array Array to search.
         * @param value Value to find.
         * @param property Property to look for the value.
         * @returns When value is found; if property is provided, the array item containing the given value, otherwise value itself. When not found, null.
         */
		function findInArray(array: any[], value, property?: string);
		/**
         * Copies array items that match the given conditions to another array and returns the new array.
         * @param array The array to filter.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @returns New array with filtered items.
         */
        function filterArray<T>(array: T[], predicate: (item: T) => boolean): T[];
		/**
         * Removes the item from given array.
         * @param array The array to remove item from.
         * @param item Item to remove.
         * @param property Property to look for the value.
         * @returns Removed item indexes.
         */
        function removeFromArray(array: any[], item, property?: string): number;
		/**
         * Creates a new array with the results of calling the provided function on every element in the given array.
         * @param array The array to map.
         * @param callback Function that produces new element.
         * @returns New array with mapped values.
         */
        function mapArray<T>(array: any[], callback: (item, index) => T): T[];
		/**
         * Creates a GUID string with "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" format.
         * @returns Newly generated GUID.
         */
        function createGuid(): string;
		/**
         * Creates string representation of given function with arrow syntax.
         * @param func The function.
         * @returns Arrow style code for given function.
         */
        function funcToLambda(func: Function): string;
		/**
         * Finds and returns function name. Works for ES6 classes too.
         * @param func The function (or class).
         * @returns Name of the given function.
         */
        function getFuncName(func: Function): string;
		/**
         * Reads property of value, used when we are not sure if property is observable.
         * @param object Deriving type.
         * @param property Property path. Can be a chain like "address.city.name".
         * @returns Value of property (undefined when a property cannot be found).
         */
        function getValue(object, propertyPath: string);
		/**
         * Gets localized value for given name using "settings.localizeFunc" function.
         * @param resourceName Resource name.
         * @param altValue Alternative value to use when resource cannot be found.
         * @returns Value for the given resource name.
         */
        function getResourceValue(resourceName: string, altValue?: string): string;
		/**
         * Creates validation error object using given parameters.
         * @param entity Entity containing invalid value.
         * @param value Invalid value itself.
         * @param property Property containing invalid value.
         * @param message Validation message.
         * @param validator Validator instance.
         * @returns Validation error object.
         */
        function createValidationError(entity, value, property: string, message: string, validator: interfaces.Validator);
		/**
         * Creates error object by formatting provided message and populates with given object's values.
         * @param message Error message.
         * @param arg1 Message format arguments.
         * @param arg2 Extra informations, properties will be attached to error object.
         * @returns Error object.
         */
        function createError(message: string, args?: Array<any>, props?: interfaces.Dictionary<any>): Error;
        /**
         * Updates foreign keys of given navigation property with new values.
         * @param entity The entity.
         * @param navProperty The navigation property.
         * @param newValue Value of the navigation property.
         */
        function setForeignKeys(entity: IEntity, navProperty: interfaces.NavigationProperty, newValue);
        /**
         * Creates an array and overrides methods to provide callbacks on array changes.
         * @param initial Initial values for the array.
         * @param object Owner object of the array.
         * @param property Navigation property metadata.
         * @param after Array change callback.
         * @returns Trackable array, an array with change events.
         */
        function createTrackableArray<T>(initial: Array<T>, object: Object, property: interfaces.NavigationProperty,
			after: (entity: any, property: string, instance: interfaces.TrackableArray<T>, removed: Array<T>, added: Array<T>) => void): interfaces.TrackableArray<T>;
	}

	/**
     * Assertion methods. Two different usage possible, static methods and instance methods.
     * Static methods returns true or false. Instance methods can be chained and they collect errors in an array.
     * Check method throws error if there are any.
     */
    class Assert {
		constructor(value: any, name: string);

		errors: string[];

        /** Checks if value is not null or undefined. */
		hasValue(): Assert;
        /** Checks if value is object. */
        isObject(): Assert;
        /** Checks if value is function. */
		isFunction(): Assert;
        /** Checks if value is a non-empty string. */
		isNotEmptyString(): Assert;
        /** 
         * Checks if value is an object of given type.
         * @param typeName - Name of the javascript type.
         */
		isTypeOf(typeName: string): Assert;
        /** Checks if value is array. */
		isArray(): Assert;
		/** 
         * Checks if value is an symbol of given enum.
         * @param enumType - Type of the enum.
         */
        isEnum(enumType: string): Assert;
		/** 
         * Checks if value is an instance of given type.
         * @param type - Javascript function or class to check.
         */
        isInstanceOf(type: any): Assert;
        /** If previous checks created any error, joins them with a new line and throws an Error. */
        check();

        /** Checks if value is not null or undefined. */
        static hasValue(value: any): boolean;
        /** Checks if value is object. */
        static isObject(value: any): boolean;
        /** Checks if value is function. */
        static isFunction(value: any): boolean;
        /** Checks if value is a non-empty string. */
        static isNotEmptyString(value: any): boolean;
		/** 
         * Checks if value is an object of given type.
         * @param value - The value to check.
         * @param typeName - Name of the javascript type.
         */
		static isTypeOf(value: any, typeName: string): boolean;
        /** Checks if value is array. */
        static isArray(value: any): boolean;
		/** 
         * Checks if value is an symbol of given enum.
         * @param value - The value to check.
         * @param enumType - Type of the enum.
         */
        static isEnum(value: any, enumType: string): boolean;
		/** 
         * Checks if value is an instance of given type.
         * @param value - The value to check.
         * @param type - Javascript function or class to check.
         */
        static isInstanceOf(value: any, type: any): boolean;
	}

	/**
     * Base types, can be considered as abstract classes.
     * This classes can be overwritten outside of the project, and later can be injected through constructors to change behaviours of core classes.
     */
    namespace baseTypes {
		/** 
         * Data conversion base type (interface). With this we can abstract date conversion and users can choose (or write) their implementation.
         */
        abstract class DateConverterBase {
			protected constructor(name: string);

			name: string;

			toString(): string;
			parse(value: string): Date;
			toISOString(value: Date): string;
		}
		abstract class ObservableProviderBase {
			protected constructor(name: string);

			name: string;

			toString(): string;
			isObservable(object: Object, property: string): boolean;
			toObservable(object: string, type: interfaces.EntityType, callbacks: ObservableProviderCallbackOptions);
			getValue(object: Object, property: string): any;
			setValue(object: Object, property: string, value: any);
		}
		abstract class AjaxProviderBase {
			protected constructor(name: string);

			name: string;

			toString(): string;
			doAjax(uri: string, method: string, dataType: string, contentType: string, data: any, async: boolean, timeout: number,
				extra: interfaces.Dictionary<any>, headers: interfaces.Dictionary<string>,
				successCallback: (data: any, headerGetter: (name: string) => string, xhr?: XMLHttpRequest) => void,
				errorCallback: (e: AjaxError) => void);
		}
		abstract class SerializationServiceBase {
			protected constructor(name: string);

			name: string;

			toString(): string;
			serialize(data: any): string;
			deserialize(string: string): any;
		}
		abstract class PromiseProviderBase {
			protected constructor(name: string);

			name: string;

			toString(): string;
			deferred(): any;
			getPromise(deferred: any): AjaxCall<any>;
			resolve(deferred: any, data: any);
			reject(deferred: any, error: AjaxError);
		}
		abstract class DataServiceBase {
			protected constructor(url: string, loadMetadata?: boolean, options?: ServiceOptions);
			protected constructor(url: string, metadataManager: metadata.MetadataManager, options?: ServiceOptions);
			protected constructor(url: string, metadata: Object, options?: ServiceOptions);
            protected constructor(url: string, metadata: string, options?: ServiceOptions);

			uri: string;
			ajaxTimeout: number;
			dataType: string;
			contentType: string;
			metadataManager: metadata.MetadataManager;

			toString(): string;
			isReady(): boolean;
			ready(callback: () => void);
			getEntityType(shortName: string): interfaces.EntityType;
			getEntityType<T extends IEntity>(constructor: new () => T): interfaces.EntityType;
			createQuery<T extends IEntity>(resourceName: string, type?: string | (new () => T), manager?: core.EntityManager): querying.EntityQuery<T>;
			createQuery(resourceName: string, shortName?: string, manager?: core.EntityManager): querying.EntityQuery<any>;
			createEntityQuery<T extends IEntity>(type: string | (new () => T), resourceName?: string, manager?: core.EntityManager): querying.EntityQuery<T>;
			registerCtor<T extends IEntity>(type: string | (new () => T), ctor?: (rawEntity: interfaces.RawEntity) => void, initializer?: (entity: T) => void);

			fetchMetadata(options?: ServiceQueryOptions, successCallback?: (data: any) => void, errorCallback?: (e: AjaxError) => void);
			createEntityAsync<T extends IEntity>(type: string | (new () => T), initialValues: Object, options: ServiceQueryOptions,
				successCallback: (entity: T) => void, errorCallback: (e: AjaxError) => void);
			createEntityAsync(shortName: string, initialValues: Object, options: ServiceQueryOptions,
				successCallback: (entity: IEntity) => void, errorCallback: (e: AjaxError) => void);
			executeQuery<T>(query: querying.EntityQuery<T>, options: ServiceQueryOptions, successCallback: (result: interfaces.QueryResultArray<T>) => void, errorCallback: (e: AjaxError) => void);
			executeQuery<T>(query: interfaces.ClosedQueryable<T, ServiceQueryOptions>, options: ServiceQueryOptions, successCallback: (result: T) => void, errorCallback: (e: AjaxError) => void);
			executeQuery(query: querying.EntityQuery<any>, options: ServiceQueryOptions, successCallback: (result: any) => void, errorCallback: (e: AjaxError) => void);
			executeQuery(query: interfaces.ClosedQueryable<any, ServiceQueryOptions>, options: ServiceQueryOptions, successCallback: (result: any) => void, errorCallback: (e: AjaxError) => void);
			saveChanges(options: ServiceSaveOptions, successCallback: (result: interfaces.SaveResult) => void, errorCallback: (e: AjaxError) => void);
		}
	}

	namespace impls {
		class DefaultDateConverter extends baseTypes.DateConverterBase {
			constructor();
		}

		class KoObservableProvider extends baseTypes.ObservableProviderBase {
			constructor(ko);
		}

		class PropertyObservableProvider extends baseTypes.ObservableProviderBase {
			constructor();
		}

		class JQueryAjaxProvider extends baseTypes.AjaxProviderBase {
			constructor($);
		}

		class AngularjsAjaxProvider extends baseTypes.AjaxProviderBase {
			constructor(angularjs);
		}

		class AngularAjaxProvider extends baseTypes.AjaxProviderBase {
			constructor(http, RequestConstructor, HeadersConstructor);
		}

		class VanillajsAjaxProviderInstance extends baseTypes.AjaxProviderBase {
			constructor();
		}

		class NodejsAjaxProviderInstance extends baseTypes.AjaxProviderBase {
			constructor(http, https);
		}

		class JsonSerializationService extends baseTypes.SerializationServiceBase {
			constructor();
		}

		class QPromiseProvider extends baseTypes.PromiseProviderBase {
			constructor(Q);
		}

		class AngularjsPromiseProvider extends baseTypes.PromiseProviderBase {
			constructor(angularjs);
		}

		class JQueryPromiseProvider extends baseTypes.PromiseProviderBase {
			constructor($);
		}

		class Es6PromiseProviderInstance extends baseTypes.PromiseProviderBase {
			constructor();
		}
	}

	namespace metadata {
		class MetadataManager {
			constructor();
			constructor(metadataObj: Object);
			constructor(metadataStr: string);

			types: interfaces.EntityType[];
			typesDict: interfaces.Dictionary<interfaces.EntityType>;
			enums: any[];
			name: string;
			displayName: string;

			toString(): string;
			getEntityTypeByFullName(typeName: string, throwIfNotFound?: boolean): interfaces.EntityType;
			getEntityType(shortName: string, throwIfNotFound?: boolean): interfaces.EntityType;
			getEntityType<T extends IEntity>(constructor: new () => T, throwIfNotFound?: boolean): interfaces.EntityType;
			registerCtor<T extends IEntity>(type: string | (new () => T), ctor?: (rawEntity: interfaces.RawEntity) => void, initializer?: (entity: T) => void);
			createEntity(shortName: string, initialValues?: Object): IEntity;
			createEntity<T extends IEntity>(constructor: new () => T, initialValues?: Object): T;
			createRawEntity(shortName: string, initialValues?: Object): interfaces.RawEntity;
			createRawEntity<T extends IEntity>(constructor: new () => T, initialValues?: Object): interfaces.RawEntity;
			parseBeetleMetadata(metadata: string | Object);
		}
	}

	namespace querying {
		class ArrayQuery<T> implements interfaces.Query<T> {
			constructor(array: T[]);

			array: Array<T>;
			options: any;
			inlineCountEnabled: boolean;

			// not removing redundant qualifiers so they would be same (ok to copy-paste) with array extensions
// ReSharper disable RedundantQualifier
			inlineCount(isEnabled?: boolean): beetle.querying.ArrayQuery<T>;
			ofType<TResult extends T>(type: string | (new () => TResult)): beetle.querying.ArrayQuery<TResult>;
			where(predicate: string, varContext?: any): beetle.querying.ArrayQuery<T>;
			where(predicate: (entity: T) => boolean): beetle.querying.ArrayQuery<T>;
			orderBy(keySelector?: string | ((entity: T) => any) | ((entity1: T, entity2: T) => number)): beetle.querying.ArrayQuery<T>;
			orderByDesc(keySelector?: string | ((entity: T) => any) | ((entity1: T, entity2: T) => number)): beetle.querying.ArrayQuery<T>;
			select<TResult>(selector: string | string[] | ((entity: T) => TResult)): beetle.querying.ArrayQuery<TResult>;
			select<TResult>(...selectors: string[]): beetle.querying.ArrayQuery<TResult>;
			select(selector: string | string[] | ((entity: T) => any)): beetle.querying.ArrayQuery<any>;
			select(...selectors: string[]): beetle.querying.ArrayQuery<any>;
			skip(count: number): beetle.querying.ArrayQuery<T>;
			take(count: number): beetle.querying.ArrayQuery<T>;
			top(count: number): beetle.querying.ArrayQuery<T>;
			groupBy<TKey, TResult>(keySelector: (entity: T) => TKey, valueSelector: (group: beetle.interfaces.Grouping<T, TKey>) => TResult): beetle.querying.ArrayQuery<TResult>;
			groupBy<TKey>(keySelector: (entity: T) => TKey): beetle.querying.ArrayQuery<beetle.interfaces.Grouped<T, TKey>>;
			groupBy<TResult>(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: beetle.interfaces.Grouping<T, any>) => TResult)): beetle.querying.ArrayQuery<TResult>;
			groupBy(keySelector: string | ((entity: T) => any)): beetle.querying.ArrayQuery<beetle.interfaces.Grouped<T, any>>;
			groupBy(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: beetle.interfaces.Grouping<T, any>) => any)): beetle.querying.ArrayQuery<any>;
			distinct(): beetle.querying.ArrayQuery<T>;
			distinct<TResult>(selector: string | ((entity: T) => TResult)): beetle.querying.ArrayQuery<TResult>;
			distinct(selector: string | ((entity: T) => any)): beetle.querying.ArrayQuery<any>;
			reverse(): beetle.querying.ArrayQuery<T>;
			selectMany<TResult>(selector: string | ((entity: T) => Array<TResult>)): beetle.querying.ArrayQuery<TResult>;
			selectMany(selector: string | ((entity: T) => any)): beetle.querying.ArrayQuery<any>;
			skipWhile(predicate: string, varContext?: any): beetle.querying.ArrayQuery<T>;
			skipWhile(predicate: (entity: T) => boolean): beetle.querying.ArrayQuery<T>;
			takeWhile(predicate: string, varContext?: any): beetle.querying.ArrayQuery<T>;
			takeWhile(predicate: (entity: T) => boolean): beetle.querying.ArrayQuery<T>;
// ReSharper restore RedundantQualifier
            all(predicate?: string, varContext?: any): boolean;
			all(predicate: (entity: T) => boolean): boolean;
			any(predicate?: string, varContext?: any): boolean;
			any(predicate: (entity: T) => boolean): boolean;
			avg(selector?: string | ((entity: T) => number)): number;
			max(selector?: string | ((entity: T) => number)): number;
			min(selector?: string | ((entity: T) => number)): number;
			sum(selector?: string | ((entity: T) => number)): number;
			count(predicate?: string, varContext?: any): number;
			count(predicate: (entity: T) => boolean): number;
			first(predicate?: string, varContext?: any): T;
			first(predicate: (entiyt: T) => boolean): T;
			firstOrDefault(predicate?: string, varContext?: any): T;
			firstOrDefault(predicate: (entity: T) => boolean): T;
			single(predicate?: string, varContext?: any): T;
			single(predicate: (entity: T) => boolean): T;
			singleOrDefault(predicate?: string, varContext?: any): T;
			singleOrDefault(predicate: (entity: T) => boolean): T;
			last(predicate?: string, varContext?: any): T;
			last(predicate: (entity: T) => boolean): T;
			lastOrDefault(predicate?: string, varContext?: any): T;
			lastOrDefault(predicate: (entity: T) => boolean): T;

			execute(options?: any): T[];
			execute<TResult>(options?: any): TResult;
			x(options?: any): T[];
			x<TResult>(options?: any): TResult;
		}
		class EntityQuery<T> implements interfaces.Query<T> {
			constructor(resource: string, type: interfaces.EntityType, manager: core.EntityManager);

			resource: string;
			entityType: interfaces.EntityType;
			manager: core.EntityManager;
			parameters: interfaces.EntityQueryParameter[];
			options: ManagerQueryOptions;
			hasBeetlePrm: boolean;
			inlineCountEnabled: boolean;

			inlineCount(isEnabled?: boolean): EntityQuery<T>;
			ofType<TResult extends T>(type: string | (new () => TResult)): EntityQuery<TResult>;
			where(predicate: string | ((entity: T) => boolean), varContext?: any): EntityQuery<T>;
			orderBy(keySelector: string | ((entity: T) => any)): EntityQuery<T>;
			orderByDesc(keySelector: string | ((entity: T) => any)): EntityQuery<T>;
			select<TResult>(selector: string | string[] | ((entity: T) => TResult)): EntityQuery<TResult>;
			select<TResult>(...selectors: string[]): EntityQuery<TResult>;
			select(selector: string | string[] | ((entity: T) => any)): EntityQuery<any>;
			select(...selectors: string[]): EntityQuery<any>;
			skip(count: number): EntityQuery<T>;
			take(count: number): EntityQuery<T>;
			top(count: number): EntityQuery<T>;
			groupBy<TKey, TResult>(keySelector: (entity: T) => TKey, valueSelector: (group: interfaces.Grouping<T, TKey>) => TResult): EntityQuery<TResult>;
			groupBy<TKey>(keySelector: (entity: T) => TKey): EntityQuery<interfaces.Grouped<T, TKey>>;
			groupBy<TResult>(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: interfaces.Grouping<T, any>) => TResult)): EntityQuery<TResult>;
			groupBy(keySelector: string | ((entity: T) => any)): EntityQuery<interfaces.Grouped<T, any>>;
			groupBy(keySelector: string | ((entity: T) => any), valueSelector?: string | ((group: interfaces.Grouping<T, any>) => any)): EntityQuery<any>;
			distinct(): EntityQuery<T>;
			distinct<TResult>(selector: string | ((entity: T) => TResult)): EntityQuery<TResult>;
			distinct(selector: string | ((entity: T) => any)): EntityQuery<any>;
			reverse(): EntityQuery<T>;
			selectMany<TResult>(selector: string | ((array: T) => Array<TResult>)): EntityQuery<TResult>;
			selectMany(selector: string | ((entity: T) => any)): EntityQuery<any>;
			skipWhile(predicate: string | ((entity: T) => boolean), varContext?: any): EntityQuery<T>;
			takeWhile(predicate: string | ((entity: T) => boolean), varContext?: any): EntityQuery<T>;
			all(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<boolean, ManagerQueryOptions>;
			any(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<boolean, ManagerQueryOptions>;
			avg(selector?: string | ((entity: T) => number)): interfaces.ClosedQueryable<number, ManagerQueryOptions>;
			max(selector?: string | ((entity: T) => number)): interfaces.ClosedQueryable<number, ManagerQueryOptions>;
			min(selector?: string | ((entity: T) => number)): interfaces.ClosedQueryable<number, ManagerQueryOptions>;
			sum(selector?: string | ((entity: T) => number)): interfaces.ClosedQueryable<number, ManagerQueryOptions>;
			count(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<number, ManagerQueryOptions>;
			first(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<T, ManagerQueryOptions>;
			firstOrDefault(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<T, ManagerQueryOptions>;
			single(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<T, ManagerQueryOptions>;
			singleOrDefault(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<T, ManagerQueryOptions>;
			last(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<T, ManagerQueryOptions>;
			lastOrDefault(predicate?: string | ((entity: T) => boolean), varContext?: any): interfaces.ClosedQueryable<T, ManagerQueryOptions>;

			execute(options?: ManagerQueryOptions, successCallback?: (result: interfaces.QueryResultArray<T>) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<interfaces.QueryResultArray<T>>;
			execute<TResult>(options?: ManagerQueryOptions, successCallback?: (result: TResult) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<TResult[]>;
			x(options?: ManagerQueryOptions, successCallback?: (result: interfaces.QueryResultArray<T>) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<interfaces.QueryResultArray<T>>;
			x<TResult>(options?: ManagerQueryOptions, successCallback?: (result: TResult) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<TResult[]>;
			then(callback: (result: interfaces.QueryResultArray<T>) => void, errorCallback?: (e: AjaxError) => void,
				options?: ManagerQueryOptions): AjaxCall<interfaces.QueryResultArray<T>>;

			expand(propertyPath: string): EntityQuery<T>;
			include(propertyPath: string): EntityQuery<T>;
			setParameter(name: string, value: any): EntityQuery<T>;
			withOptions(options: ManagerQueryOptions): EntityQuery<T>;
		}
	}

	namespace core {
		class ValueNotifyWrapper {
			constructor(value: any);

			value: any;
		}
		class Event<T> {
			constructor(name: string, publisher: any);

			name: string;

			toString(): string;
			subscribe(subscriber: (args: T) => void);
			unsubscribe(subscriber: (args: T) => void);
			notify(data: any);
		}
		namespace dataTypes {
			var object: interfaces.DataTypeBase;
			var array: interfaces.DataTypeBase;
			var func: interfaces.DataTypeBase;
			var string: interfaces.DataTypeBase;
			var guid: interfaces.DataTypeBase;
			var date: interfaces.DataTypeBase;
			var dateTimeOffset: interfaces.DataTypeBase;
			var time: interfaces.DataTypeBase;
			var boolean: interfaces.DataTypeBase;
			var int: interfaces.DataTypeBase;
			var number: interfaces.DataTypeBase;
			var byte: interfaces.DataTypeBase;
			var binary: interfaces.DataTypeBase;
			var enumeration: interfaces.DataTypeBase; // enum
			var geometry: interfaces.DataTypeBase;
			var geography: interfaces.DataTypeBase;
		}
		class EntityContainer {
			constructor();

			toString(): string;
			push(entity: IEntity);
			remove(entity: IEntity);
			getEntities(): IEntity[];
			getEntityByKey(key: string, type: interfaces.EntityType): IEntity;
			getRelations(entity: IEntity, navProperty: interfaces.NavigationProperty): IEntity[];
			relocateKey(entity: IEntity, oldKey: string, newKey: string);
			getChanges(): IEntity[];
			count(): number;
			findEntitySet(type: interfaces.EntityType): EntitySet<IEntity>;
			getEntitySet(type: interfaces.EntityType): EntitySet<IEntity>;
		}
		class EntitySet<T extends IEntity> extends querying.EntityQuery<T> {
			constructor(type: interfaces.EntityType, manager: EntityManager);

			local: interfaces.InternalSet<T>;

			toString(): string;
			create(initialValues?: Object): T;
			createDetached(): T;
			createRaw(): interfaces.RawEntity;
			add(T);
			attach(T);
			remove(T);
		}
		class EntityManager {
			constructor(url: string, loadMetadata?: boolean, options?: ManagerOptions);
			constructor(url: string, metadataManager: metadata.MetadataManager, options?: ManagerOptions);
			constructor(url: string, metadata: string, options?: ManagerOptions);
			constructor(url: string, metadata: Object, options?: ManagerOptions);
			constructor(service: baseTypes.DataServiceBase, options?: ManagerOptions);

			dataService: baseTypes.DataServiceBase;
			entities: EntityContainer;
			pendingChangeCount: number;
			validationErrors: interfaces.ValidationError[];
			entityStateChanged: Event<interfaces.EntityStateChangedEventArgs>;
			validationErrorsChanged: Event<interfaces.ValidationErrorsChangedEventArgs>;
			hasChangesChanged: Event<interfaces.HasChangesChangedEventArgs>;
			queryExecuting: Event<interfaces.QueryExecutingEventArgs>;
			queryExecuted: Event<interfaces.QueryExecutedEventArgs>;
			saving: Event<interfaces.SaveEventArgs>;
			saved: Event<interfaces.SaveEventArgs>;

            /** Automatically fix scalar navigations using foreign keys (fast). */
			autoFixScalar: boolean;
            /** Automatically fix plural navigations looking for foreign references (slow). */
            autoFixPlural: boolean;
			validateOnMerge: boolean;
			validateOnSave: boolean;
			liveValidate: boolean;
            /** When true, all values will be handled by their value (i.e. some type changes, string->Date). */
			handleUnmappedProperties: boolean;
			forceUpdate: boolean;
			workAsync: boolean;
			minimizePackage: boolean;

			toString(): string;
			isReady(): boolean;
			ready(callback: () => void): AjaxCall<any>;
			getEntityType(shortName: string): interfaces.EntityType;
			getEntityType<T extends IEntity>(constructor: new () => T): interfaces.EntityType;
			createQuery<T>(resourceName: string, shortName?: string): querying.EntityQuery<T>;
			createQuery<T extends IEntity>(resourceName: string, type?: string | (new () => T)): querying.EntityQuery<T>;
			createQuery(resourceName: string, shortName?: string): querying.EntityQuery<any>;
			createEntityQuery<T extends IEntity>(type: string | (new () => T), resourceName?: string): querying.EntityQuery<T>;
			createEntityQuery(shortName: string, resourceName?: string): querying.EntityQuery<IEntity>;
			registerCtor<T extends IEntity>(type: string | (new () => T), ctor?: (rawEntity: interfaces.RawEntity) => void, initializer?: (entity: T) => void);
			createEntity<T extends IEntity>(type: string | (new () => T), initialValues?: Object): T;
			createEntity(shortName: string, initialValues?: Object): IEntity;
			createDetachedEntity<T extends IEntity>(type: string | (new () => T), initialValues?: Object): T;
			createDetachedEntity(shortName: string, initialValues?: Object): IEntity;
			createRawEntity(shortName: string, initialValues?: Object): interfaces.RawEntity;
			createRawEntity<T extends IEntity>(type: string | (new () => T), initialValues?: Object): interfaces.RawEntity;
			createEntityAsync<T extends IEntity>(type: string | (new () => T), initialValues?: Object, options?: ManagerQueryOptions,
				successCallback?: (entity: T) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<T>;
			createEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
				successCallback?: (entity: IEntity) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<IEntity>;
			createDetachedEntityAsync<T extends IEntity>(type: string | (new () => T), initialValues?: Object, options?: ManagerQueryOptions,
				successCallback?: (entity: T) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<T>;
			createDetachedEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
				successCallback?: (entity: IEntity) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<IEntity>;
			createRawEntityAsync<T extends IEntity>(type: string | (new () => T), initialValues?: Object, options?: ManagerQueryOptions,
				successCallback?: (rawEntity: interfaces.RawEntity) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<interfaces.RawEntity>;
			createRawEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
				successCallback?: (rawEntity: interfaces.RawEntity) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<interfaces.RawEntity>;
			executeQuery<T>(query: querying.EntityQuery<T>, options?: ManagerQueryOptions, successCallback?: (result: T[]) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<T[]>;
			executeQuery<T>(query: interfaces.ClosedQueryable<T, ManagerQueryOptions>, options?: ManagerQueryOptions, successCallback?: (result: T) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<T>;
			executeQuery(query: querying.EntityQuery<any>, options?: ManagerQueryOptions, successCallback?: (result: any) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<any>;
			executeQuery(query: interfaces.ClosedQueryable<any, ManagerQueryOptions>, options?: ManagerQueryOptions, successCallback?: (result: any) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<any>;
			executeQueryLocally<T>(query: querying.EntityQuery<T>, varContext?: any): T[];
			executeQueryLocally<T>(query: interfaces.ClosedQueryable<T, any>, varContext?: any): T;
			getEntityByKey<T extends IEntity>(key: any, type: string | interfaces.EntityType | (new () => T)): T;
			deleteEntity(entity: IEntity);
			addEntity(entity: IEntity | IEntity[], options?: EntityOptions);
			attachEntity(entity: IEntity | IEntity[], options?: EntityOptions);
			detachEntity(entity: IEntity | IEntity[], includeRelations?: boolean);
			rejectChanges(entity: IEntity | IEntity[], includeRelations?: boolean);
			undoChanges(entity: IEntity | IEntity[], includeRelations?: boolean);
			acceptChanges(entity: IEntity | IEntity[], includeRelations?: boolean);
			createSavePackage(entities?: IEntity[], options?: PackageOptions): interfaces.SavePackage;
			exportEntities(entities?: IEntity[], options?: ExportOptions): interfaces.ExportEntity[];
			importEntities(exportedEntities: interfaces.ExportEntity[], merge?: enums.mergeStrategy);
			hasChanges(): boolean;
			getChanges(): IEntity[];
			saveChanges(options?: ManagerSaveOptions, successCallback?: (result: interfaces.SaveResult) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<interfaces.SaveResult>;
			savePackage(savePackage: interfaces.SavePackage, options?: PackageSaveOptions, successCallback?: (result: interfaces.SaveResult) => void, errorCallback?: (e: AjaxError) => void): AjaxCall<interfaces.SaveResult>;
			toEntity<T extends IEntity>(object: interfaces.RawEntity): T;
			toEntity(object: interfaces.RawEntity): IEntity;
			fixNavigations(entity: IEntity);
			isInManager(entity: IEntity): boolean;
			flatEntities(entities: IEntity[]): IEntity[];
			entry(entity: IEntity): interfaces.Tracker;
			createSet<T extends IEntity>(type: string | interfaces.EntityType | (new () => T)): EntitySet<T>;
			createSet(type: interfaces.EntityType): EntitySet<IEntity>;
			set<T extends IEntity>(constructor: new () => T): EntitySet<T>;
			set(shortName: string): EntitySet<IEntity>;
			clear();
		}
		class EntityBase implements IEntity {
			constructor(type: interfaces.EntityType, manager?: EntityManager, initialValues?: Object);

			$tracker: interfaces.Tracker;
			$extra: interfaces.QueryResultExtra;
		}
	}

	namespace services {
		class BeetleService extends baseTypes.DataServiceBase {
			constructor(url: string, loadMetadata?: boolean, options?: ServiceOptions);
			constructor(url: string, metadata: metadata.MetadataManager | Object | string, options?: ServiceOptions);

			executeQueryParams(resource: string, queryParams: any, options: ServiceQueryOptions,
				successCallback: (result: interfaces.SaveResult) => void, errorCallback: (e: AjaxError) => void);
			fixResults(results: any[], makeObservable?: boolean, handleUnmappedProperties?: boolean): interfaces.RawEntity[];
		}
		class ODataService extends BeetleService {
		}
	}

	namespace enums {
		enum entityStates {
			Detached, Unchanged, Added, Deleted, Modified
		}
		enum mergeStrategy {
			Preserve, Overwrite, ThrowError, NoTracking, NoTrackingRaw
		}
		enum executionStrategy {
			Server, Local, Both, LocalIfEmptyServer
		}
		enum generationPattern {
			Identity, Computed
		}
		enum arraySetBehaviour {
			NotAllowed, Replace, Append
		}
		enum serviceTypes {
			OData, Beetle
		}
	}

	namespace events {
		var queryExecuting: core.Event<interfaces.QueryExecutingEventArgs>;
		var queryExecuted: core.Event<interfaces.QueryExecutedEventArgs>;
		var saving: core.Event<interfaces.SaveEventArgs>;
		var saved: core.Event<interfaces.SaveEventArgs>;
		var info: core.Event<interfaces.MessageEventArgs>;
		var warning: core.Event<interfaces.MessageEventArgs>;
		var error: core.Event<Error>;
	}

	namespace settings {
        /** Automatically fix scalar navigations using foreign keys (fast). */
        var autoFixScalar: boolean;
        /** Automatically fix plural navigations looking for foreign references (slow). */
        var autoFixPlural: boolean;
		var validateOnMerge: boolean;
		var validateOnSave: boolean;
		var liveValidate: boolean;
        /** When true, all values will be handled by their value (i.e. some type changes, string->Date). */
        var handleUnmappedProperties: boolean;
		var isCaseSensitive: boolean;
		var ignoreWhiteSpaces: boolean;
		var forceUpdate: boolean;
		var cacheMetadata: boolean;
		var registerMetadataTypes: boolean;
		var workAsync: boolean;
		var ajaxTimeout: number;
		var minimizePackage: boolean;

		function getObservableProvider(): baseTypes.ObservableProviderBase;
		function setObservableProvider(value: baseTypes.ObservableProviderBase);
		function getPromiseProvider(): baseTypes.PromiseProviderBase;
		function setPromiseProvider(value: baseTypes.PromiseProviderBase);
		function getAjaxProvider(): baseTypes.AjaxProviderBase;
		function setAjaxProvider(value: baseTypes.AjaxProviderBase);
		function getSerializationService(): baseTypes.SerializationServiceBase;
		function setSerializationService(value: baseTypes.SerializationServiceBase);
		function getArraySetBehaviour(): enums.arraySetBehaviour;
		function setArraySetBehaviour(value: enums.arraySetBehaviour | string);
		function getDefaultServiceType(): enums.serviceTypes;
		function setDefaultServiceType(value: enums.serviceTypes | string);
		function getDateConverter(): baseTypes.DateConverterBase;
		function setDateConverter(value: baseTypes.DateConverterBase);
		function getLocalizeFunction(): (name: string) => string;
		function setLocalizeFunction(func: (name: string) => string);
	}

	function registerI18N(code: string, i18n: interfaces.I18N, active?: boolean);

	function setI18N(code: string);

	class MetadataManager extends metadata.MetadataManager { }
	class EntityManager extends core.EntityManager { }
	class EntityBase extends core.EntityBase { }
	class EntitySet<T extends IEntity> extends core.EntitySet<T> { }
	class ODataService extends services.ODataService { }
	class BeetleService extends services.BeetleService { }
	class Event<T> extends core.Event<T> { }
	class ValueNotifyWrapper extends core.ValueNotifyWrapper { }
	interface TrackableArray<T> extends interfaces.TrackableArray<T> { }

	const version: string;
}

declare global {

	interface Array<T> {
		asQueryable(): beetle.querying.ArrayQuery<T>;
		q(): beetle.querying.ArrayQuery<T>;
	}

	interface String {
		substringOf(other: string): boolean;
		startsWith(other: string): boolean;
		endsWith(other: string): boolean;
	}

	interface Number {
		round(): number;
		ceiling(): number;
		floor(): number;
	}
}

export = beetle;

export as namespace beetle;
