// Type definitions for beetle.js 2.0
// Project: https://github.com/umutozel/Beetle.js
// File version: 2.0.19

declare module beetle {

    module interfaces {
        interface Dictionary<T> {
            [key: string]: T;
        }

        interface Grouping<T, TKey> {
            Key: TKey;
            Items: Array<T>;
        }

        interface ArrayChangeEventArgs {
            added: Array<any>,
            removed: Array<any>
        }

        interface ValidationErrorsChangedEventArgs {
            errors: ValidationError[];
            added: ValidationError[];
            removed: ValidationError[];
        }

        interface EntityStateChangedEventArgs {
            entity: IEntity;
            oldState: enums.entityStates;
            newState: enums.entityStates;
            newChanged: boolean;
        }

        interface PropertyChangedEventArgs {
            entity: IEntity;
            property: Property;
            oldValue: any;
            newValue: any;
        }

        interface ArrayChangedEventArgs {
            entity: IEntity;
            property: Property;
            items: Array<IEntity>;
            removedItems: Array<IEntity>;
            addedItems: Array<IEntity>;
        }

        interface HasChangesChangedEventArgs {
            hasChanges: boolean;
        }

        interface QueryExecutingEventArgs {
            manager: core.EntityManager;
            query: Query<any>;
            options: ManagerQueryOptions;
        }

        interface QueryExecutedEventArgs extends QueryExecutingEventArgs {
            result: any;
        }

        interface SaveEventArgs {
            manager: core.EntityManager;
            changes: IEntity[];
            options: ManagerSaveOptions;
        }

        interface MessageEventArgs {
            message: string;
            query: Query<any>;
            options: ManagerQueryOptions;
        }

        interface TrackableArray<T> extends Array<T> {
            object: Object;
            property: string;
            after: (o: Object, s: string, a: TrackableArray<T>, removed: T[], added: T[]) => void;
            changing: Event<ArrayChangeEventArgs>;
            changed: Event<ArrayChangeEventArgs>;

            remove(...T): T[];
            load(expands: string[], resourceName: string, options: ManagerQueryOptions,
                successCallback?: (items: T[]) => void, errorCallback?: (e: Error) => void): PromiseLike<interfaces.QueryResultArray<T>>;
        }

        interface PropertyValidator {
            name: string;
            message: string;
            args?: any;

            toString(): string;
            validate(value: any, entity: IEntity): string;
        }

        interface EntityValidator {
            name: string;
            message: string;
            args?: any;

            toString(): string;
            validate(entity: IEntity): string;
        }

        interface ValidationError {
            message: string;
            entity: IEntity;
            property?: string;
            value?: any;
        }

        interface EntityValidationError {
            entity: IEntity;
            validationErrors: ValidationError[];
        }

        interface ManagerValidationError extends Error {
            entities: IEntity[];
            entitiesInError: EntityValidationError[];
            manager: core.EntityManager;
        }

        interface DataTypeBase {
            name: string;
            isComplex: boolean;

            toString(): string;
            getRawValue(value: any): string;
            isValid(value: any): boolean;
            toODataValue(value: any): string;
            toBeetleValue(value: any): string;
            defaultValue(): any;
            autoValue(): any;
            handle(value: any): any;
        }

        interface MetadataPart {
            name: string;
            displayName?: string;

            toString(): string;
            validate(entity: IEntity): ValidationError[];
        }

        interface Property extends MetadataPart {
            owner: EntityType;
            isComplex: boolean;
            validators: PropertyValidator[];

            addValidation(name: string, func: (value: any, entity: IEntity) => string, message: string, args?: any);
        }

        interface DataProperty extends Property {
            dataType: DataTypeBase;
            isNullable: boolean;
            isKeyPart: boolean;
            generationPattern: enums.generationPattern;
            defaultValue: any;
            useForConcurrency: boolean;
            relatedNavigationProperties: NavigationProperty[];
            isEnum: boolean;

            isValid(value: any): boolean;
            handle(value: any): any;
            getDefaultValue(): any;
        }

        interface NavigationProperty extends Property {
            entityTypeName: string;
            entityType: EntityType;
            isScalar: boolean;
            associationName: string;
            cascadeDelete: boolean;
            foreignKeyNames: string[];
            foreignKeys: DataProperty[];
            triggerOwnerModify: boolean;

            inverse: NavigationProperty;
            checkAssign(entity: IEntity);
        }

        interface EntityType extends MetadataPart {
            shortName: string;
            keyNames: string[];
            baseTypeName: string;
            setName: string;
            setTypeName: string;
            metadataManager: metadata.MetadataManager;
            hasMetadata: boolean;
            properties: string[];
            isComplexType: boolean;
            dataProperties: DataProperty[];
            navigationProperties: NavigationProperty[];
            keys: DataProperty[];
            floorType: EntityType;
            baseType: EntityType;
            validators: EntityValidator[];
            constructor: (entity: RawEntity) => void;
            initializer: (entity: IEntity) => void;

            getProperty(propertyPath: string): Property;
            registerCtor(ctor?: (entity: RawEntity) => void, initializer?: (entity: IEntity) => void);
            createEntity(initialValues: Object): IEntity;
            createRawEntity(initialValues: Object): RawEntity;
            isAssignableWith(otherType: EntityType): boolean;
            isAssignableTo(otherType: EntityType): boolean;
            addValidation(name: string, func: (entity: IEntity) => string, message: string, args?: any);
        }

        interface InternalSet<T extends IEntity> {
            toString(): string;
            getEntity(key: string): T;
            getEntities(): T[];
        }

        interface Query<T> {
            inlineCount(isEnabled?: boolean): Query<T>;
            ofType<TResult extends T>(type: string | (new() => TResult)): Query<TResult>;
            where(predicate: string, varContext?: any): Query<T>;
            orderBy(keySelector?: string): Query<T>;
            orderByDesc(keySelector?: string): Query<T>;
            select<TResult>(selector: string | string[] | ((entity: T) => TResult)): Query<TResult>;
            select(selector: string | string[] | ((entity: T) => any)): Query<any>;
            select<TResult>(...selectors: string[]): Query<TResult>;
            select(...selectors: string[]): Query<any>;
            skip(count: number): Query<T>;
            take(count: number): Query<T>;
            top(count: number): Query<T>;
            groupBy<TResult>(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: Grouping<T, any>) => TResult)): Query<TResult>;
            groupBy(keySelector: string | ((entity: T) => any), valueSelector?: string | ((group: Grouping<T, any>) => any)): Query<any>;
            groupBy<TKey, TResult>(keySelector: ((entity: T) => TKey), valueSelector: ((group: Grouping<T, TKey>) => TResult)): Query<TResult>;
            distinct(): Query<T>;
            distinct<TResult>(selector: string | ((entity: T) => TResult)): Query<TResult>;
            distinct(selector: string | ((entity: T) => any)): Query<any>;
            reverse(): Query<T>;
            selectMany<TResult>(selector: string | ((entity: T) => Array<TResult>)): Query<TResult>;
            selectMany(selector: string | ((entity: T) => any)): Query<any>;
            skipWhile(predicate: string, varContext?: any): Query<T>;
            takeWhile(predicate: string, varContext?: any): Query<T>;
        }

        interface ClosedQueryable<T, TOptions> {
            execute(options?: TOptions, successCallback?: (result: T) => void, errorCallback?: (e: Error) => void): PromiseLike<T>;
            execute<TResult>(options?: TOptions, successCallback?: (result: TResult) => void, errorCallback?: (e: Error) => void): PromiseLike<TResult>;
            x(options?: TOptions, successCallback?: (result: T) => void, errorCallback?: (e: Error) => void): PromiseLike<T>;
            x<TResult>(options?: TOptions, successCallback?: (result: TResult) => void, errorCallback?: (e: Error) => void): PromiseLike<TResult>;
        }

        interface EntityQueryParameter {
            name: string;
            value: any;
        }

        interface QueryResultExtra {
            userData: string;
            headerGetter: (name: string) => string;
            xhr: Object;
        }

        interface QueryResultArray<T> extends Array<T> {
            $extra: QueryResultExtra;
            $inlineCount?: number;
        }

        interface PropertyValue {
            p: string; // property
            v: any; // value
        }

        interface OwnerValue {
            owner: IEntity;
            property: Property;
        }

        interface Tracker {
            entity: IEntity;
            entityType: EntityType;
            entityState: enums.entityStates;
            forceUpdate: boolean;
            originalValues: PropertyValue[];
            changedValues: PropertyValue[];
            manager: core.EntityManager;
            owners: OwnerValue[];
            validationErrors: ValidationError[];
            validationErrorsChanged: core.Event<ValidationErrorsChangedEventArgs>;
            entityStateChanged: core.Event<EntityStateChangedEventArgs>;
            propertyChanged: core.Event<PropertyChangedEventArgs>;
            arrayChanged: core.Event<ArrayChangedEventArgs>;
            key: string;

            toString(): string;
            isChanged(): boolean;
            delete();
            detach();
            toAdded();
            toModified();
            toDeleted();
            toUnchanged();
            toDetached();
            rejectChanges();
            undoChanges();
            acceptChanges();
            getValue(property: string);
            setValue(property: string, value: any);
            getOriginalValue(property: string): any;
            foreignKey(navProperty: NavigationProperty): string;
            createLoadQuery<T extends IEntity>(navPropName: string, resourceName: string): querying.EntityQuery<T>;
            loadNavigationProperty(navPropName: string, expands: string[], resourceName: string, options?: ManagerQueryOptions,
                successCallback?: (result: any) => void, errorCallback?: (e: Error) => void): PromiseLike<any>;
            validate(): ValidationError[];
            toRaw(includeNavigations?: boolean): Object;
        }

        interface TrackInfo {
            t: string; // type
            s: string; // state
            i: number; // save index
            f?: boolean; // force update
            o?: Object[]; // original values
        }

        interface ExportEntity {
            $t: TrackInfo;
        }

        interface SavePackage {
            entities: ExportEntity[];
            forceUpdate?: boolean;
            userData: string;
        }

        interface GeneratedValue {
            Index: number;
            Property: string;
            Value: any;
        }

        interface SaveResult {
            AffectedCount: number;
            GeneratedValues: GeneratedValue[];
            GeneratedEntities: IEntity[];
            UserData: string;
        }

        interface RawEntity {
            $type: string;
            $extra?: QueryResultExtra;
        }

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

    interface IEntity {
        $tracker: interfaces.Tracker;
        $extra?: interfaces.QueryResultExtra;
    }

    interface ServiceQueryOptions {
        handleUnmappedProperties?: boolean;
        usePost?: boolean;
        dataType?: string;
        contentType?: string;
        async?: boolean;
        timeout?: boolean;
        extra?: Object;
        uri?: string;
        headers?: Object;
        includeXhr?: boolean;
        includeHeaderGetter?: boolean;
    }

    interface ManagerQueryOptions extends ServiceQueryOptions {
        merge?: enums.mergeStrategy;
        execution?: enums.executionStrategy;
        autoFixScalar?: boolean;
        autoFixPlural?: boolean;
        varContext?: Object;
        useBeetleQueryStrings?: boolean;
    }

    interface ServiceOptions {
        ajaxTimeout?: number;
        dataType?: string;
        contentType?: string;
        registerMetadataTypes?: boolean;
        ajaxProvider?: baseTypes.AjaxProviderBase;
        serializationService?: baseTypes.SerializationServiceBase;
    }

    interface ManagerOptions extends ServiceOptions {
        autoFixScalar?: boolean;
        autoFixPlural?: boolean;
        validateOnMerge?: boolean;
        validateOnSave?: boolean;
        liveValidate?: boolean;
        handleUnmappedProperties?: boolean;
        forceUpdate?: boolean;
        workAsync?: boolean;
        minimizePackage?: boolean;
        promiseProvider?: baseTypes.PromiseProviderBase;
    }

    interface ExportOptions {
        minimizePackage?: boolean;
    }

    interface EntityOptions {
        merge?: enums.mergeStrategy;
        state?: enums.entityStates;
        autoFixScalar?: boolean;
        autoFixPlural?: boolean;
    }

    interface ServiceSaveOptions {
        async?: boolean;
        timeout?: number;
        extra?: Object;
        uri?: string;
        saveAction?: string;
        headers?: Object;
        includeXhr?: boolean;
        includeHeaderGetter?: boolean;
    }

    interface ManagerSaveOptions extends ExportOptions, ServiceSaveOptions {
        entities?: IEntity[];
        forceUpdate?: boolean;
        validateOnSave?: boolean;
        autoFixScalar?: boolean;
        autoFixPlural?: boolean;
    }

    interface ObservableProviderCallbackOptions {
        propertyChange: (entity: Object, property: string, accessor: (v?: any) => any, newValue: any) => void;
        arrayChange: (entity: Object, property: string, items: Array<any>, removed: Array<any>, added: Array<any>) => void;
        dataPropertyChange: (entity: Object, property: interfaces.DataProperty, accessor: (v?: any) => any, newValue) => void;
        scalarNavigationPropertyChange: (entity: Object, property: interfaces.NavigationProperty, accessor: (v?: any) => any, newValue: any) => void;
        pluralNavigationPropertyChange: (entity: Object, property: interfaces.NavigationProperty, items: Array<any>, removed: Array<any>, added: Array<any>) => void;
        arraySet: (entity: Object, property: string, oldArray: Array<any>, newArray: Array<any>) => void;
    }

    module helper {
        function combine(obj1: Object, obj2: Object): Object;
        function extend(obj1: Object, obj2: Object): Object;
        function objEquals(obj1: Object, obj2: Object): boolean;
        function formatString(str: string, ...params: string[]): string;
        function createGuid(): string;
        function getResourceValue(resourceName: string, altValue?: string): string;
        function createError(message: string, args?: Array<any>, props?: interfaces.Dictionary<any>): Error;
        function getFuncName(func: Function): string;
        function createTrackableArray<T>(initial: Array<T>, object: Object, property: string,
            after: (entity: Object, property: string, instance: interfaces.TrackableArray<T>, removed: Array<T>, added: Array<T>) => void): interfaces.TrackableArray<T>;
    }

    class Assert {
        constructor(value: any, name: string);

        errors: string[];

        hasValue(): Assert;
        isObject(): Assert;
        isFunction(): Assert;
        isNotEmptyString(): Assert;
        isTypeOf(typeName: string): Assert;
        isArray(): Assert;
        isEnum(enumType: string): Assert;
        isInstanceOf(type: any): Assert;
        check();

        static hasValue(value: any): boolean;
        static isObject(value: any): boolean;
        static isFunction(value: any): boolean;
        static isNotEmptyString(value: any): boolean;
        static isTypeOf(value: any, typeName: string): boolean;
        static isArray(value: any): boolean;
        static isEnum(value: any, enumType: string): boolean;
        static isInstanceOf(value: any, type: any): boolean;
    }

    module baseTypes {
        abstract class DateConverterBase {
            constructor(name: string);

            name: string;

            toString(): string;
            parse(value: string): Date;
            toISOString(value: Date): string;
        }
        abstract class ObservableProviderBase {
            constructor(name: string);

            name: string;

            toString(): string;
            isObservable(object: Object, property: string): boolean;
            toObservable(object: string, type: interfaces.EntityType, callbacks: ObservableProviderCallbackOptions);
            getValue(object: Object, property: string): any;
            setValue(object: Object, property: string, value: any);
        }
        abstract class AjaxProviderBase {
            constructor(name: string);

            name: string;

            toString(): string;
            doAjax(uri: string, type: string, dataType: string, contentType: string, data: any, async: boolean, timeout: number,
                extra: interfaces.Dictionary<any>, headers: interfaces.Dictionary<string>,
                successCallback: (data: any, headerGetter: (name: string) => string, xhr?: JQueryXHR) => void,
                errorCallback: (e: Error) => void);
        }
        abstract class SerializationServiceBase {
            constructor(name: string);

            name: string;

            toString(): string;
            serialize(data: any): string;
            deserialize(string: string): any;
        }
        abstract class PromiseProviderBase {
            constructor(name: string);

            name: string;

            toString(): string;
            deferred(): any;
            getPromise(deferred: any): PromiseLike<any>;
            resolve(deferred: any, data: any);
            reject(deferred: any, error: Error);
        }
        abstract class DataServiceBase {
            constructor(url: string, loadMetadata?: boolean, options?: ServiceOptions);
            constructor(url: string, metadataManager: metadata.MetadataManager, options?: ServiceOptions);
            constructor(url: string, metadata: Object, options?: ServiceOptions);
            constructor(url: string, metadata: string, options?: ServiceOptions);

            uri: string;
            ajaxTimeout: number;
            dataType: string;
            contentType: string;
            metadataManager: metadata.MetadataManager;

            toString(): string;
            isReady(): boolean;
            ready(callback: () => void);
            getEntityType(shortName: string): interfaces.EntityType;
            getEntityType<T extends IEntity>(constructor: new() => T): interfaces.EntityType;
            createQuery<T extends IEntity>(resourceName: string, type?: string | (new() => T), manager?: core.EntityManager): querying.EntityQuery<T>;
            createQuery(resourceName: string, shortName?: string, manager?: core.EntityManager): querying.EntityQuery<any>;
            createEntityQuery<T extends IEntity>(type: string | (new() => T), resourceName?: string, manager?: core.EntityManager): querying.EntityQuery<T>;
            registerCtor<T extends IEntity>(type: string | (new() => T), ctor?: (rawEntity: interfaces.RawEntity) => void, initializer?: (entity: T) => void);

            fetchMetadata(options?: ServiceQueryOptions, successCallback?: (data: Object) => void, errorCallback?: (e: Error) => void);
            createEntityAsync<T extends IEntity>(type: string | (new() => T), initialValues: Object, options: ServiceQueryOptions,
                successCallback: (entity: T) => void, errorCallback: (e: Error) => void);
            createEntityAsync(shortName: string, initialValues: Object, options: ServiceQueryOptions,
                successCallback: (entity: IEntity) => void, errorCallback: (e: Error) => void);
            executeQuery<T>(query: querying.EntityQuery<T>, options: ServiceQueryOptions, successCallback: (result: interfaces.QueryResultArray<T>) => void, errorCallback: (e: Error) => void);
            executeQuery<T>(query: interfaces.ClosedQueryable<T, ServiceQueryOptions>, options: ServiceQueryOptions, successCallback: (result: T) => void, errorCallback: (e: Error) => void);
            executeQuery(query: querying.EntityQuery<any>, options: ServiceQueryOptions, successCallback: (result: any) => void, errorCallback: (e: Error) => void);
            executeQuery(query: interfaces.ClosedQueryable<any, ServiceQueryOptions>, options: ServiceQueryOptions, successCallback: (result: any) => void, errorCallback: (e: Error) => void);
            saveChanges(options: ServiceSaveOptions, successCallback: (result: interfaces.SaveResult) => void, errorCallback: (e: Error) => void);
        }
    }

    module impls {
        var defaultDateConverterInstance: baseTypes.DateConverterBase;
        var koObservableProviderInstance: baseTypes.ObservableProviderBase;
        var propertyObservableProviderInstance: baseTypes.ObservableProviderBase;
        var jQueryAjaxProviderInstance: baseTypes.AjaxProviderBase;
        var angularAjaxProviderInstance: baseTypes.AjaxProviderBase;
        var jsonSerializationServiceInstance: baseTypes.SerializationServiceBase;
        var qPromiseProviderInstance: baseTypes.PromiseProviderBase;
        var angularPromiseProviderInstance: baseTypes.PromiseProviderBase;
        var jQueryPromiseProviderInstance: baseTypes.PromiseProviderBase;
    }

    module metadata {
        class MetadataManager {
            constructor();
            constructor(metadataObj: Object);
            constructor(metadataStr: string);

            types: interfaces.EntityType[];
            typesDict: interfaces.Dictionary<interfaces.EntityType>;
            enums: Object[];
            name: string;
            displayName: string;

            toString(): string;
            getEntityTypeByFullName(typeName: string, throwIfNotFound?: boolean): interfaces.EntityType;
            getEntityType(shortName: string, throwIfNotFound?: boolean): interfaces.EntityType;
            getEntityType<T extends IEntity>(constructor: new() => T, throwIfNotFound?: boolean): interfaces.EntityType;
            registerCtor<T extends IEntity>(type: string | (new() => T), ctor?: (rawEntity: interfaces.RawEntity) => void, initializer?: (entity: T) => void);
            createEntity(shortName: string, initialValues?: Object): IEntity;
            createEntity<T extends IEntity>(constructor: new() => T, initialValues?: Object): T;
            createRawEntity(shortName: string, initialValues?: Object): interfaces.RawEntity;
            createRawEntity<T extends IEntity>(constructor: new() => T, initialValues?: Object): interfaces.RawEntity;
            parseBeetleMetadata(metadata: string | Object);
        }
    }

    module querying {
        class ArrayQuery<T> implements interfaces.Query<T> {
            constructor(array: T[]);

            array: Array<T>;
            options: Object;
            inlineCountEnabled: boolean;

            // not removing redundant qualifiers so they would be same (ok to copy-paste) with array extensions
            inlineCount(isEnabled?: boolean): beetle.querying.ArrayQuery<T>;
            ofType<TResult extends T>(type: string | (new() => TResult)): beetle.querying.ArrayQuery<TResult>;
            where(predicate: string, varContext?: any): beetle.querying.ArrayQuery<T>;
            where(predicate: (entity: T) => boolean): beetle.querying.ArrayQuery<T>;
            orderBy(keySelector: string | ((entity1: T, entity2: T) => number)): beetle.querying.ArrayQuery<T>;
            orderByDesc(keySelector: string | ((entity1: T, entity2: T) => number)): beetle.querying.ArrayQuery<T>;
            select<TResult>(selector: string | string[] | ((entity: T) => TResult)): beetle.querying.ArrayQuery<TResult>;
            select<TResult>(...selectors: string[]): beetle.querying.ArrayQuery<TResult>;
            select(selector: string | string[] | ((entity: T) => any)): beetle.querying.ArrayQuery<any>;
            select(...selectors: string[]): beetle.querying.ArrayQuery<any>;
            skip(count: number): beetle.querying.ArrayQuery<T>;
            take(count: number): beetle.querying.ArrayQuery<T>;
            top(count: number): beetle.querying.ArrayQuery<T>;
            groupBy<TKey, TResult>(keySelector: (entity: T) => TKey, valueSelector: (group: beetle.interfaces.Grouping<T, TKey>) => TResult): beetle.querying.ArrayQuery<TResult>;
            groupBy<TResult>(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: beetle.interfaces.Grouping<T, any>) => TResult)): beetle.querying.ArrayQuery<TResult>;
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

            execute(options?: Object): T[];
            execute<TResult>(options?: Object): TResult;
            x(options?: Object): T[];
            x<TResult>(options?: Object): TResult;
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
            ofType<TResult extends T>(type: string | (new() => TResult)): EntityQuery<TResult>;
            where(predicate: string | ((entity: T) => boolean), varContext?: any): EntityQuery<T>;
            orderBy(keySelector: string | ((entity: T) => any)): EntityQuery<T>;
            orderByDesc(keySelector: string | ((entity: T) => any)): EntityQuery<T>;
            select<TResult>(selector: string | string[] | ((entity: T) => TResult)): EntityQuery<TResult>;
            select(selector: string | string[] | ((entity: T) => any)): EntityQuery<any>;
            select<TResult>(...selectors: string[]): EntityQuery<TResult>;
            select(...selectors: string[]): EntityQuery<any>;
            skip(count: number): EntityQuery<T>;
            take(count: number): EntityQuery<T>;
            top(count: number): EntityQuery<T>;
            groupBy<TKey, TResult>(keySelector: (entity: T) => TKey, valueSelector: (group: interfaces.Grouping<T, TKey>) => TResult): EntityQuery<TResult>;
            groupBy<TResult>(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: interfaces.Grouping<T, any>) => TResult)): EntityQuery<TResult>;
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

            execute(options?: ManagerQueryOptions, successCallback?: (result: interfaces.QueryResultArray<T>) => void, errorCallback?: (e: Error) => void): PromiseLike<interfaces.QueryResultArray<T>>;
            execute<TResult>(options?: ManagerQueryOptions, successCallback?: (result: TResult) => void, errorCallback?: (e: Error) => void): PromiseLike<TResult[]>;
            x(options?: ManagerQueryOptions, successCallback?: (result: interfaces.QueryResultArray<T>) => void, errorCallback?: (e: Error) => void): PromiseLike<interfaces.QueryResultArray<T>>;
            x<TResult>(options?: ManagerQueryOptions, successCallback?: (result: TResult) => void, errorCallback?: (e: Error) => void): PromiseLike<TResult[]>;

            expand(propertyPath: string): EntityQuery<T>;
            include(propertyPath: string): EntityQuery<T>;
            setParameter(name: string, value: any): EntityQuery<T>;
            withOptions(options: ManagerQueryOptions): EntityQuery<T>;
        }
    }

    module core {
        class ValueNotifyWrapper {
            constructor(value: any);

            value: any;
        }
        class Event<T> {
            constructor(name: string, publisher: Object);

            name: string;

            toString(): string;
            subscribe(subscriber: (args: T) => void);
            unsubscribe(subscriber: (args: T) => void);
            notify(data: any);
        }
        module dataTypes {
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

            autoFixScalar: boolean;
            autoFixPlural: boolean;
            validateOnMerge: boolean;
            validateOnSave: boolean;
            liveValidate: boolean;
            handleUnmappedProperties: boolean;
            forceUpdate: boolean;
            workAsync: boolean;
            minimizePackage: boolean;

            toString(): string;
            isReady(): boolean;
            ready(callback: () => void): PromiseLike<any>;
            getEntityType(shortName: string): interfaces.EntityType;
            getEntityType<T extends IEntity>(constructor: new() => T): interfaces.EntityType;
            createQuery<T>(resourceName: string, shortName?: string): querying.EntityQuery<T>;
            createQuery<T extends IEntity>(resourceName: string, type?: string | (new() => T)): querying.EntityQuery<T>;
            createQuery(resourceName: string, shortName?: string): querying.EntityQuery<any>;
            createEntityQuery<T extends IEntity>(type: string | (new() => T), resourceName?: string): querying.EntityQuery<T>;
            createEntityQuery(shortName: string, resourceName?: string): querying.EntityQuery<any>;
            registerCtor<T extends IEntity>(type: string | (new() => T), ctor?: (rawEntity: interfaces.RawEntity) => void, initializer?: (entity: T) => void);
            createEntity<T extends IEntity>(type: string | (new() => T), initialValues?: Object): T;
            createEntity(shortName: string, initialValues?: Object): IEntity;
            createDetachedEntity<T extends IEntity>(type: string | (new() => T), initialValues?: Object): T;
            createDetachedEntity(shortName: string, initialValues?: Object): IEntity;
            createRawEntity(shortName: string, initialValues?: Object): interfaces.RawEntity;
            createRawEntity<T extends IEntity>(type: string | (new() => T), initialValues?: Object): interfaces.RawEntity;
            createEntityAsync<T extends IEntity>(type: string | (new() => T), initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: (entity: T) => void, errorCallback?: (e: Error) => void): PromiseLike<T>;
            createEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: (entity: IEntity) => void, errorCallback?: (e: Error) => void): PromiseLike<IEntity>;
            createDetachedEntityAsync<T extends IEntity>(type: string | (new() => T), initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: (entity: T) => void, errorCallback?: (e: Error) => void): PromiseLike<T>;
            createDetachedEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: (entity: IEntity) => void, errorCallback?: (e: Error) => void): PromiseLike<IEntity>;
            createRawEntityAsync<T extends IEntity>(type: string | (new() => T), initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: (rawEntity: interfaces.RawEntity) => void, errorCallback?: (e: Error) => void): PromiseLike<interfaces.RawEntity>;
            createRawEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: (rawEntity: interfaces.RawEntity) => void, errorCallback?: (e: Error) => void): PromiseLike<interfaces.RawEntity>;
            executeQuery<T>(query: querying.EntityQuery<T>, options?: ManagerQueryOptions, successCallback?: (result: T[]) => void, errorCallback?: (e: Error) => void): PromiseLike<T[]>;
            executeQuery<T>(query: interfaces.ClosedQueryable<T, ManagerQueryOptions>, options?: ManagerQueryOptions, successCallback?: (result: T) => void, errorCallback?: (e: Error) => void): PromiseLike<T>;
            executeQuery(query: querying.EntityQuery<any>, options?: ManagerQueryOptions, successCallback?: (result: any) => void, errorCallback?: (e: Error) => void): PromiseLike<any>;
            executeQuery(query: interfaces.ClosedQueryable<any, ManagerQueryOptions>, options?: ManagerQueryOptions, successCallback?: (result: any) => void, errorCallback?: (e: Error) => void): PromiseLike<any>;
            executeQueryLocally<T>(query: querying.EntityQuery<T>, varContext?: any): T[];
            executeQueryLocally<T>(query: interfaces.ClosedQueryable<T, any>, varContext?: any): T;
            getEntityByKey<T extends IEntity>(key: any, type: string | interfaces.EntityType | (new() => T)): T;
            deleteEntity(entity: IEntity);
            addEntity(entity: IEntity | IEntity[], options?: EntityOptions);
            attachEntity(entity: IEntity | IEntity[], options?: EntityOptions);
            detachEntity(entity: IEntity | IEntity[], includeRelations?: boolean);
            rejectChanges(entity: IEntity | IEntity[], includeRelations?: boolean);
            undoChanges(entity: IEntity | IEntity[], includeRelations?: boolean);
            acceptChanges(entity: IEntity | IEntity[], includeRelations?: boolean);
            createSavePackage(entities?: IEntity[], options?: ExportOptions): interfaces.SavePackage;
            exportEntities(entities?: IEntity[], options?: ExportOptions): interfaces.ExportEntity[];
            importEntities(exportedEntities: interfaces.ExportEntity[], merge?: enums.mergeStrategy);
            hasChanges(): boolean;
            getChanges(): IEntity[];
            saveChanges(options?: ManagerSaveOptions, successCallback?: (result: interfaces.SaveResult) => void, errorCallback?: (e: Error) => void): PromiseLike<interfaces.SaveResult>;
            toEntity<T extends IEntity>(object: interfaces.RawEntity): T;
            toEntity(object: interfaces.RawEntity): IEntity;
            fixNavigations(entity: IEntity);
            isInManager(entity: IEntity): boolean;
            flatEntities(entities: IEntity[]): IEntity[];
            entry(entity: IEntity): interfaces.Tracker;
            createSet<T extends IEntity>(type: string | interfaces.EntityType | (new() => T)): EntitySet<T>;
            createSet(type: interfaces.EntityType): EntitySet<IEntity>;
            set<T extends IEntity>(constructor: new() => T): EntitySet<T>;
            set(shortName: string): EntitySet<IEntity>;
        }
        class EntityBase implements IEntity {
            constructor(type: interfaces.EntityType, manager?: EntityManager, initialValues?: Object);

            $tracker: interfaces.Tracker;
            $extra: interfaces.QueryResultExtra;
        }
    }

    module services {
        class MvcService extends baseTypes.DataServiceBase {
            constructor(url: string, loadMetadata?: boolean, options?: ServiceOptions);
            constructor(url: string, metadata: metadata.MetadataManager | Object | string, options?: ServiceOptions);

            executeQueryParams(resource: string, queryParams: Object, options: ServiceQueryOptions,
                successCallback: (result: interfaces.SaveResult) => void, errorCallback: (e: Error) => void);
            fixResults(results: any[], makeObservable?: boolean, handleUnmappedProperties?: boolean): interfaces.RawEntity[];
        }
        class WebApiService extends MvcService {
        }
    }

    module enums {
        enum observableProviders {
            Knockout, Property
        }
        enum promiseProviders {
            Q, jQuery, Angular
        }
        enum ajaxProviders {
            jQuery, Angular
        }
        enum serializationServices {
            JSON
        }
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
            WebApi, Mvc
        }
    }

    module events {
        var queryExecuting: core.Event<interfaces.QueryExecutingEventArgs>;
        var queryExecuted: core.Event<interfaces.QueryExecutedEventArgs>;
        var saving: core.Event<interfaces.SaveEventArgs>;
        var saved: core.Event<interfaces.SaveEventArgs>;
        var info: core.Event<interfaces.MessageEventArgs>;
        var warning: core.Event<interfaces.MessageEventArgs>;
        var error: core.Event<Error>;
    }

    module settings {
        var autoFixScalar: boolean;
        var autoFixPlural: boolean;
        var validateOnMerge: boolean;
        var validateOnSave: boolean;
        var liveValidate: boolean;
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
        function setObservableProvider(type: enums.observableProviders | string | baseTypes.ObservableProviderBase);
        function getAjaxProvider(): baseTypes.AjaxProviderBase;
        function setAjaxProvider(type: enums.ajaxProviders | string | baseTypes.AjaxProviderBase);
        function getSerializationService(): baseTypes.SerializationServiceBase;
        function setSerializationService(type: enums.serializationServices | string | baseTypes.SerializationServiceBase);
        function getArraySetBehaviour(): enums.arraySetBehaviour;
        function setArraySetBehaviour(type: enums.arraySetBehaviour | string);
        function getDefaultServiceType(): enums.serviceTypes;
        function setDefaultServiceType(type: enums.serviceTypes | string);
        function getDateConverter(): baseTypes.DateConverterBase;
        function setDateConverter(converter: baseTypes.DateConverterBase);
        function getLocalizeFunction(): (name: string) => string;
        function setLocalizeFunction(func: (name: string) => string);
    }

    function registerI18N(code: string, i18n: interfaces.I18N, active?: boolean);

    function setI18N(code: string);

    class MetadataManager extends metadata.MetadataManager { }
    class EntityManager extends core.EntityManager { }
    class EntityBase extends core.EntityBase { }
    class EntitySet<T extends IEntity> extends core.EntitySet<T> { }
    class WebApiService extends services.WebApiService { }
    class MvcService extends services.MvcService { }
    class Event<T> extends core.Event<T> { }
    class ValueNotifyWrapper extends core.ValueNotifyWrapper { }
    interface TrackableArray<T> extends interfaces.TrackableArray<T> { }

    var version: string;
}

interface Array<T> {
    asQueryable(): beetle.querying.ArrayQuery<T>;
    q(): beetle.querying.ArrayQuery<T>;
}

interface StringConstructor {
    substringOf(other: string): boolean;
    startsWith(other: string): boolean;
    endsWith(other: string): boolean;
}

interface NumberConstructor {
    round(): number;
    ceiling(): number;
    floor(): number;
}