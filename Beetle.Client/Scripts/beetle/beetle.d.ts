declare module beetle {

    module interfaces {
        interface Delegate {
            ();
        }

        interface Delegate1<T> {
            (t: T);
        }

        interface Delegate2<T1, T2> {
            (t1: T1, t2: T2);
        }

        interface Delegate3<T1, T2, T3> {
            (t1: T1, t2: T2, t3: T3);
        }

        interface Delegate4<T1, T2, T3, T4> {
            (t1: T1, t2: T2, t3: T3, t4: T4);
        }

        interface Delegate5<T1, T2, T3, T4, T5> {
            (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5);
        }

        interface Func<TResult> {
            (): TResult;
        }

        interface Func1<T, TResult> {
            (t: T): TResult;
        }

        interface Func2<T1, T2, TResult> {
            (t1: T1, t2: T2): TResult;
        }

        interface FuncAccessor<T, TResult> {
            (t?: T): TResult;
        }

        interface Dictionary<T> {
            [key: string]: T;
        }

        interface Grouping<T, TKey> {
            Key: TKey;
            Items: Array<T>
        }

        interface IParameterlessConstructor<T> {
            new (): T;
        }

        interface IObject {
            $type: string;
            $extra?: IQueryResultExtra;
        }

        interface IEntity {
            $tracker: Tracker;
            $extra?: IQueryResultExtra;
        }

        interface PropertyValidator {
            name: string;
            func: Delegate2<any, IEntity>;
            message: string;
            args: any;
            toString(): string;
            validate(value: any, entity: IEntity);
        }

        interface EntityValidator {
            name: string;
            func: Delegate1<IEntity>;
            message: string;
            args: any;
            toString(): string;
            validate(entity: IEntity);
        }

        interface ValidationError {
            entity: IEntity;
            message: string;
            property: string;
            value: any;
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
            displayName: string;
            toString(): string;
            validate(entity: IEntity): ValidationError[];
        }

        interface Property extends MetadataPart {
            owner: any;
            isComplex: boolean;
            validators: PropertyValidator[];
            addValidation(name: string, func: Delegate2<any, IEntity>, message: string, args: any);
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
            foreignKeys: string[];
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
            dataProperties: DataProperty[];
            navigationProperties: NavigationProperty[];
            keys: string[];
            isComplexType: boolean;
            floorType: EntityType;
            baseType: EntityType;
            validators: EntityValidator[];
            constructor: Delegate1<IObject>;
            initializer: Delegate1<IEntity>;
            getProperty(propertyPath: string): Property;
            registerCtor<T extends IEntity>(ctor?: Delegate1<IObject>, initializer?: Delegate1<T>);
            createEntity(initialValues: Object): IEntity;
            createRawEntity(initialValues: Object): IObject;
            isAssignableWith(otherType: EntityType): boolean;
            isAssignableTo(otherType: EntityType): boolean;
            hasSameBaseType(type: EntityType): boolean;
            addValidation(name: string, func: Delegate1<IEntity>, message: string, args: any);
        }

        interface IClosedQueryable<T, TOptions> {
            execute(options?: TOptions, successCallback?: Delegate1<T>, errorCallback?: Delegate1<Error>): PromiseLike<T>;
            execute<TResult>(options?: TOptions, successCallback?: Delegate1<TResult>, errorCallback?: Delegate1<Error>): PromiseLike<TResult>;
        }

        interface EntityQueryParameter {
            name: string;
            value: any;
        }

        interface InternalSet<T extends IEntity> {
            toString(): string;
            getEntity(key: string): T;
            getEntities(): T[];
        }

        interface Tracker {
            entity: IEntity;
            entityType: EntityType;
            entityState: enums.entityStates;
            forceUpdate: boolean;
            originalValues: any[];
            changedValues: any[];
            manager: core.EntityManager;
            owners: any[];
            validationErrors: ValidationError[];
            validationErrorsChanged: core.Event;
            entityStateChanged: core.Event;
            propertyChanged: core.Event;
            arrayChanged: core.Event;
            key: string;
            isChanged(): boolean;
            toAdded();
            toModified();
            toDeleted();
            toUnchanged();
            toDetached();
            undoChanges();
            acceptChanges();
            getValue(property: string);
            setValue(property: string, value: any);
            getOriginalValue(property: string): any;
            foreignKey(navProperty: NavigationProperty): string;
            createLoadQuery<T extends IEntity>(navPropName: string, resourceName: string): querying.EntityQuery<T>;
            loadNavigationProperty(navPropName: string, expands: string[], resourceName: string, options?: ManagerQueryOptions,
                successCallback?: Delegate1<any>, errorCallback?: Delegate1<Error>): PromiseLike<any>;
            validate(): ValidationError[];
            toRaw(includeNavigations?: boolean): Object;
        }

        interface ITrackInfo {
            t: string; // type
            s: string; // state
            i: number; // save index
            f?: boolean; // force update
            o?: Object[]; // original values
        }

        interface IExportEntity {
            $t: ITrackInfo;
        }

        interface IQueryResultExtra {
            userData: string;
            headerGetter: Func1<string, string>;
            xhr: Object;
        }

        interface IQueryResultArray<T> extends Array<T> {
            $extra: IQueryResultExtra;
        }

        interface SavePackage {
            entities: IExportEntity[];
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
    }

    module helper {
        function combine(obj1: Object, obj2: Object): Object;
        function extend(obj1: Object, obj2: Object): Object;
        function objEquals(obj1: Object, obj2: Object): boolean;
        function formatString(str: string, ...params: string[]): string;
        function createGuid(): string;
        function getResourceValue(resourceName: string, altValue: string): string;
        function createError(message: string, args?: Array<any>, props?: interfaces.Dictionary<any>): Error;
        function getFuncName(func: Function): string;
    }

    class Assert {
        constructor(value: any, name: string);

        errors: string[];

        hasValue(): Assert;
        isObject(): Assert;
        isFunction(): Assert;
        isNotEmptyString(): Assert;
        isTypeOf(typeName: string): Assert;
        isObject(): Assert;
        isArray(): Assert;
        isEnum(enumType: string): Assert;
        isInstanceOf(type: any): Assert;
        check();

        static hasValue(value: any): boolean;
        static isObject(value: any): boolean;
        static isFunction(value: any): boolean;
        static isNotEmptyString(value: any): boolean;
        static isTypeOf(value: any, typeName: string): boolean;
        static isObject(value: any): boolean;
        static isArray(value: any): boolean;
        static isEnum(value: any, enumType: string): boolean;
        static isInstanceOf(value: any, type: any): boolean;
    }

    module baseTypes {
        abstract class DateConverterBase {
            constructor(name: string);

            name: string;
            parse(value: string): Date;
            toISOString(value: Date): string;
        }
        abstract class ObservableProviderBase {
            constructor(name: string);

            toString(): string;
            isObservable(object: Object, property: string): boolean;
            toObservable(object: string, type: interfaces.EntityType, callbacks: ObservableProviderCallbackOptions);
            getValue<T>(object: Object, property: string): T;
            getValue(object: Object, property: string): any;
            setValue<T>(object: Object, property: string, value: T);
            setValue(object: Object, property: string, value: any);
        }
        abstract class AjaxProviderBase {
            constructor(name: string);

            toString(): string;
            doAjax(uri: string, type: string, dataType: string, contentType: string, data: any, async: boolean, timeout: number,
                extra: interfaces.Dictionary<any>, headers: interfaces.Dictionary<string>,
                successCallback: interfaces.Delegate3<any, interfaces.Func1<string, string>, Object>,
                errorCallback: interfaces.Delegate1<Error>);
        }
        abstract class SerializationServiceBase {
            constructor(name: string);

            toString(): string;
            serialize(data: any): string;
            deserialize(string: string): any;
        }
        abstract class PromiseProviderBase {
            constructor(name: string);

            toString(): string;
            deferred(): any;
            getPromise(deferred: any): PromiseLike<any>;
            resolve(deferredn: any, data: any);
            reject(deferredn: any, error: Error);
        }
        abstract class DataServiceBase {
            constructor(url: string, loadMetadata?: boolean, options?: ServiceOptions);
            constructor(url: string, metadataManager: metadata.MetadataManager, options?: ServiceOptions);
            constructor(url: string, metadata: string, options?: ServiceOptions); uri: string;

            ajaxTimeout: number;
            dataType: string;
            contentType: string;
            metadataManager: metadata.MetadataManager;
            toString(): string;
            isReady(): boolean;
            ready(callback: interfaces.Delegate);
            getEntityType(shortName: string): interfaces.EntityType;
            getEntityType<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>): interfaces.EntityType;
            createQuery<T extends interfaces.IEntity>(resourceName: string, shortName?: string, manager?: core.EntityManager): querying.EntityQuery<T>;
            createQuery(resourceName: string, shortName?: string, manager?: core.EntityManager): querying.EntityQuery<any>;
            createEntityQuery<T extends interfaces.IEntity>(shortName: string, resourceName?: string, manager?: core.EntityManager): querying.EntityQuery<T>;
            createEntityQuery<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, resourceName?: string, manager?: core.EntityManager): querying.EntityQuery<T>;
            registerCtor<T extends interfaces.IEntity>(shortName: string, ctor?: interfaces.Delegate1<interfaces.IObject>, initializer?: interfaces.Delegate1<T>);
            registerCtor<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, ctor?: interfaces.Delegate1<interfaces.IObject>, initializer?: interfaces.Delegate1<T>);

            fetchMetadata(options?: ServiceQueryOptions, successCallback?: interfaces.Delegate1<Object>, errorCallback?: interfaces.Delegate1<Error>);
            createEntityAsync<T extends interfaces.IEntity>(typeName: string, initialValues: Object, options: ServiceQueryOptions,
                successCallback: interfaces.Delegate1<T>, errorCallback: interfaces.Delegate1<Error>);
            createEntityAsync(typeName: string, initialValues: Object, options: ServiceQueryOptions,
                successCallback: interfaces.Delegate1<interfaces.IEntity>, errorCallback: interfaces.Delegate1<Error>);
            createEntityAsync<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues: Object, options: ServiceQueryOptions,
                successCallback: interfaces.Delegate1<T>, errorCallback: interfaces.Delegate1<Error>);
            executeQuery<T>(query: querying.EntityQuery<any>, options: ServiceQueryOptions, successCallback: interfaces.Delegate1<T>, errorCallback: interfaces.Delegate1<Error>);
            executeQuery(query: querying.EntityQuery<any>, options: ServiceQueryOptions, successCallback: interfaces.Delegate1<any>, errorCallback: interfaces.Delegate1<Error>);
            saveChanges(options: ServiceSaveOptions, successCallback: interfaces.Delegate1<interfaces.SaveResult>, errorCallback: interfaces.Delegate1<Error>);
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
            constructor(metadataStr: string);
            constructor(metadataObj: Object);

            types: interfaces.EntityType[];
            typesDict: interfaces.Dictionary<interfaces.EntityType>;
            enums: Object[];
            name: string;
            displayName: string;
            toString(): string;
            getEntityTypeByFullName(typeName: string, throwIfNotFound?: boolean): interfaces.EntityType;
            getEntityType(shortName: string, throwIfNotFound?: boolean): interfaces.EntityType;
            getEntityType<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, throwIfNotFound?: boolean): interfaces.EntityType;
            registerCtor<T extends interfaces.IEntity>(shortName: string, ctor?: interfaces.Delegate1<interfaces.IObject>, initializer?: interfaces.Delegate1<T>);
            registerCtor<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, ctor?: interfaces.Delegate1<interfaces.IObject>, initializer?: interfaces.Delegate1<T>);
            createEntity(shortName: string, initialValues?: Object): interfaces.IEntity;
            createEntity<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues?: Object): T;
            createRawEntity(shortName: string, initialValues?: Object): interfaces.IObject;
            createRawEntity<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues?: Object): interfaces.IObject;
            parseBeetleMetadata(metadataStr: string);
            parseBeetleMetadata(metadataObj: Object);
        }
    }

    module querying {
        class ArrayQuery<T> {
            constructor(array: T[]);

            array: Array<T>;
            options: Object;
            inlineCountEnabled: boolean;

            inlineCount(isEnabled?: boolean): beetle.querying.ArrayQuery<T>;
            ofType<TResult extends T>(type: string): beetle.querying.ArrayQuery<TResult>;
            ofType<TResult extends T>(constructor: beetle.interfaces.IParameterlessConstructor<TResult>): beetle.querying.ArrayQuery<TResult>;
            where(predicate: string, varContext?: any): beetle.querying.ArrayQuery<T>;
            where(predicate: beetle.interfaces.Func1<T, boolean>): beetle.querying.ArrayQuery<T>;
            orderBy(keySelector?: string): beetle.querying.ArrayQuery<T>;
            orderBy(comparer: beetle.interfaces.Func2<T, T, number>): beetle.querying.ArrayQuery<T>;
            orderByDesc(keySelector?: string): beetle.querying.ArrayQuery<T>;
            orderByDesc(comparer: beetle.interfaces.Func2<T, T, number>): beetle.querying.ArrayQuery<T>;
            select<TResult>(selector: string): beetle.querying.ArrayQuery<TResult>;
            select(selector: string): beetle.querying.ArrayQuery<any>;
            select<TResult>(selector: beetle.interfaces.Func1<T, TResult>): beetle.querying.ArrayQuery<TResult>;
            select(selector: beetle.interfaces.Func1<T, any>): beetle.querying.ArrayQuery<any>;
            skip(count: number): beetle.querying.ArrayQuery<T>;
            take(count: number): beetle.querying.ArrayQuery<T>;
            top(count: number): beetle.querying.ArrayQuery<T>;
            groupBy<TResult>(keySelector: string, valueSelector: string): beetle.querying.ArrayQuery<TResult>;
            groupBy(keySelector: string, valueSelector: string): beetle.querying.ArrayQuery<any>;
            groupBy<TKey, TResult>(keySelector: beetle.interfaces.Func1<T, TKey>, valueSelector: beetle.interfaces.Func1<beetle.interfaces.Grouping<T, TKey>, TResult>): beetle.querying.ArrayQuery<TResult>;
            groupBy<TResult>(keySelector: beetle.interfaces.Func1<T, any>, valueSelector: beetle.interfaces.Func1<beetle.interfaces.Grouping<T, any>, TResult>): beetle.querying.ArrayQuery<TResult>;
            groupBy(keySelector: beetle.interfaces.Func1<T, any>, valueSelector?: beetle.interfaces.Func1<beetle.interfaces.Grouping<T, any>, any>): beetle.querying.ArrayQuery<any>;
            distinct(): beetle.querying.ArrayQuery<T>;
            distinct<TResult>(selector: string): beetle.querying.ArrayQuery<TResult>;
            distinct(selector: string): beetle.querying.ArrayQuery<any>;
            distinct<TResult>(selector: beetle.interfaces.Func1<T, TResult>): beetle.querying.ArrayQuery<TResult>;
            distinct(selector: beetle.interfaces.Func1<T, any>): beetle.querying.ArrayQuery<any>;
            reverse(): beetle.querying.ArrayQuery<T>;
            selectMany<TResult>(selector: string): beetle.querying.ArrayQuery<Array<TResult>>;
            selectMany(selector: string): beetle.querying.ArrayQuery<any>;
            selectMany<TResult>(selector: beetle.interfaces.Func1<T, Array<TResult>>): beetle.querying.ArrayQuery<Array<TResult>>;
            selectMany(selector: beetle.interfaces.Func1<T, any>): beetle.querying.ArrayQuery<any>;
            skipWhile(predicate: string, varContext?: any): beetle.querying.ArrayQuery<T>;
            skipWhile(predicate: beetle.interfaces.Func1<T, boolean>): beetle.querying.ArrayQuery<T>;
            takeWhile(predicate: string, varContext?: any): beetle.querying.ArrayQuery<T>;
            takeWhile(predicate: beetle.interfaces.Func1<T, boolean>): beetle.querying.ArrayQuery<T>;
            all(predicate?: string, varContext?: any): boolean;
            all(predicate: beetle.interfaces.Func1<T, boolean>): boolean;
            any(predicate?: string, varContext?: any): boolean;
            any(predicate: beetle.interfaces.Func1<T, boolean>): boolean;
            avg(selector?: string): number;
            avg(selector: beetle.interfaces.Func1<T, number>): number;
            max(selector?: string): number;
            max(selector: beetle.interfaces.Func1<T, number>): number;
            min(selector?: string): number;
            min(selector: beetle.interfaces.Func1<T, number>): number;
            sum(selector?: string): number;
            sum(selector: beetle.interfaces.Func1<T, number>): number;
            count(predicate?: string, varContext?: any): number;
            count(predicate: beetle.interfaces.Func1<T, boolean>): number;
            first(predicate?: string, varContext?: any): T;
            first(predicate: beetle.interfaces.Func1<T, boolean>): T;
            firstOrDefault(predicate?: string, varContext?: any): T;
            firstOrDefault(predicate: beetle.interfaces.Func1<T, boolean>): T;
            single(predicate?: string, varContext?: any): T;
            single(predicate: beetle.interfaces.Func1<T, boolean>): T;
            singleOrDefault(predicate?: string, varContext?: any): T;
            singleOrDefault(predicate: beetle.interfaces.Func1<T, boolean>): T;
            last(predicate?: string, varContext?: any): T;
            last(predicate: beetle.interfaces.Func1<T, boolean>): T;
            lastOrDefault(predicate?: string, varContext?: any): T;
            lastOrDefault(predicate: beetle.interfaces.Func1<T, boolean>): T;

            execute(options?: Object): T[];
            execute<TResult>(options?: Object): TResult;
            x(options?: Object): T[];
            x<TResult>(options?: Object): TResult;
        }
        class EntityQuery<T> {
            constructor(resource: string, type: interfaces.EntityType, manager: core.EntityManager);

            resource: string;
            entityType: interfaces.EntityType;
            manager: core.EntityManager;
            parameters: interfaces.EntityQueryParameter[];
            options: ManagerQueryOptions;
            hasBeetlePrm: boolean;
            inlineCountEnabled: boolean;

            inlineCount(isEnabled?: boolean): EntityQuery<T>;
            ofType<TResult extends T>(type: string): EntityQuery<TResult>;
            ofType<TResult extends T>(constructor: interfaces.IParameterlessConstructor<TResult>): EntityQuery<TResult>;
            where(predicate: string, varContext?: any): EntityQuery<T>;
            where(predicate: interfaces.Func1<T, boolean>): EntityQuery<T>;
            orderBy(keySelector?: string): EntityQuery<T>;
            orderBy(keySelector: interfaces.Func1<T, any>): EntityQuery<T>;
            orderByDesc(keySelector?: string): EntityQuery<T>;
            orderByDesc(keySelector: interfaces.Func1<T, any>): EntityQuery<T>;
            select<TResult>(selector: string): EntityQuery<TResult>;
            select(selector: string): EntityQuery<any>;
            select<TResult>(selector: interfaces.Func1<T, TResult>): EntityQuery<TResult>;
            select(selector: interfaces.Func1<T, any>): EntityQuery<any>;
            skip(count: number): EntityQuery<T>;
            take(count: number): EntityQuery<T>;
            top(count: number): EntityQuery<T>;
            groupBy<TResult>(keySelector: string, valueSelector: string): EntityQuery<TResult>;
            groupBy(keySelector: string, valueSelector: string): EntityQuery<any>;
            groupBy<TKey, TResult>(keySelector: interfaces.Func1<T, TKey>, valueSelector: interfaces.Func1<interfaces.Grouping<T, TKey>, TResult>): EntityQuery<TResult>;
            groupBy<TResult>(keySelector: interfaces.Func1<T, any>, valueSelector: interfaces.Func1<interfaces.Grouping<T, any>, TResult>): EntityQuery<TResult>;
            groupBy(keySelector: interfaces.Func1<T, any>, valueSelector?: interfaces.Func1<interfaces.Grouping<T, any>, any>): EntityQuery<any>;
            distinct(): EntityQuery<T>;
            distinct<TResult>(selector: string): EntityQuery<TResult>;
            distinct(selector: string): EntityQuery<any>;
            distinct<TResult>(selector: interfaces.Func1<T, TResult>): EntityQuery<TResult>;
            distinct(selector: interfaces.Func1<T, any>): EntityQuery<any>;
            reverse(): EntityQuery<T>;
            selectMany<TResult>(selector: string): EntityQuery<Array<TResult>>;
            selectMany(selector: string): EntityQuery<any>;
            selectMany<TResult>(selector: interfaces.Func1<T, Array<TResult>>): EntityQuery<Array<TResult>>;
            selectMany(selector: interfaces.Func1<T, any>): EntityQuery<any>;
            skipWhile(predicate: string, varContext?: any): EntityQuery<T>;
            skipWhile(predicate: interfaces.Func1<T, boolean>): EntityQuery<T>;
            takeWhile(predicate: string, varContext?: any): EntityQuery<T>;
            takeWhile(predicate: interfaces.Func1<T, boolean>): EntityQuery<T>;
            all(predicate?: string, varContext?: any): interfaces.IClosedQueryable<boolean, ManagerQueryOptions>;
            all(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<boolean, ManagerQueryOptions>;
            any(predicate?: string, varContext?: any): interfaces.IClosedQueryable<boolean, ManagerQueryOptions>;
            any(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<boolean, ManagerQueryOptions>;
            avg(selector?: string): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            avg(selector: interfaces.Func1<T, number>): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            max(selector?: string): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            max(selector: interfaces.Func1<T, number>): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            min(selector?: string): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            min(selector: interfaces.Func1<T, number>): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            sum(selector?: string): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            sum(selector: interfaces.Func1<T, number>): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            count(predicate?: string, varContext?: any): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            count(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<number, ManagerQueryOptions>;
            first(predicate?: string, varContext?: any): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            first(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            firstOrDefault(predicate?: string, varContext?: any): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            firstOrDefault(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            single(predicate?: string, varContext?: any): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            single(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            singleOrDefault(predicate?: string, varContext?: any): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            singleOrDefault(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            last(predicate?: string, varContext?: any): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            last(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            lastOrDefault(predicate?: string, varContext?: any): interfaces.IClosedQueryable<T, ManagerQueryOptions>;
            lastOrDefault(predicate: interfaces.Func1<T, boolean>): interfaces.IClosedQueryable<T, ManagerQueryOptions>;

            execute(options?: ManagerQueryOptions, successCallback?: interfaces.Delegate1<interfaces.IQueryResultArray<T>>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<interfaces.IQueryResultArray<T>>;
            execute<TResult>(options?: ManagerQueryOptions, successCallback?: interfaces.Delegate1<TResult>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<TResult[]>;
            x(options?: ManagerQueryOptions, successCallback?: interfaces.Delegate1<interfaces.IQueryResultArray<T>>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<interfaces.IQueryResultArray<T>>;
            x<TResult>(options?: ManagerQueryOptions, successCallback?: interfaces.Delegate1<TResult>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<TResult[]>;

            expand(propertyPath: string): EntityQuery<T>;
            include(propertyPath: string): EntityQuery<T>;
            setParameter(name: string, value: any): EntityQuery<T>;
            withOptions(options: ManagerQueryOptions): EntityQuery<T>;
        }
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
        ajaxProvider: baseTypes.AjaxProviderBase;
        serializationService: baseTypes.SerializationServiceBase;
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
        promiseProvider: baseTypes.PromiseProviderBase;
    }

    interface ExportOptions {
        minimizePackage?: boolean;
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
        entities?: interfaces.IEntity[];
        forceUpdate?: boolean;
        validateOnSave?: boolean;
        autoFixScalar?: boolean;
        autoFixPlural?: boolean;
    }

    interface ObservableProviderCallbackOptions {
        propertyChange: interfaces.Delegate4<Object, string, interfaces.FuncAccessor<any, any>, any>;
        arrayChange: interfaces.Delegate5<Object, string, Array<any>, Array<any>, Array<any>>;
        dataPropertyChange: interfaces.Delegate4<Object, string, interfaces.FuncAccessor<any, any>, any>;
        scalarNavigationPropertyChange: interfaces.Delegate4<Object, string, interfaces.FuncAccessor<any, any>, any>;
        pluralNavigationPropertyChange: interfaces.Delegate5<Object, string, Array<any>, Array<any>, Array<any>>;
        arraySet: interfaces.Delegate4<Object, Array<any>, Array<any>, string>;
    }

    module core {
        class ValueNotifyWrapper {
            constructor(value: any);

            value: any;
        }
        class TrackableArray<T> extends Array<T> {
            constructor(initial: Array<T>, object: Object, property: string, after: interfaces.Delegate5<Object, string, TrackableArray<T>, Array<T>, Array<T>>)

            object: Object;
            property: string;
            after: interfaces.Delegate5<Object, string, TrackableArray<T>, T[], T[]>;
            changing: core.Event;
            changed: core.Event;

            remove(...T): T[];
            load(expands: string[], resourceName: string, options: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<T[]>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<interfaces.IQueryResultArray<T>>;
        }
        class Event {
            constructor(name: string, publisher: Object);

            name: string;
            toString(): string;
            subscribe(subscriber: interfaces.Delegate2<any, any>);
            unsubscribe(subscriber: interfaces.Delegate2<any, any>);
            notify(data: any);
        }
        class EntitySet<T extends interfaces.IEntity> extends querying.EntityQuery<T> {
            constructor(type: interfaces.EntityType, manager: core.EntityManager);

            local: interfaces.InternalSet<T>;
            toString(): string;
            create(initialValues?: Object): T;
            createDetached(): T;
            createRaw(): interfaces.IObject;
            add(T);
            attach(T);
            remove(T);
        }
        class EntityManager {
            constructor(url: string, loadMetadata?: boolean, options?: ManagerOptions);
            constructor(url: string, metadataManager: metadata.MetadataManager, options?: ManagerOptions);
            constructor(url: string, metadata: string, options?: ManagerOptions);
            constructor(service: baseTypes.DataServiceBase, options?: ManagerOptions);

            dataService: baseTypes.DataServiceBase;
            pendingChangeCount: number;
            validationErrors: interfaces.ValidationError[];
            entityStateChanged: core.Event;
            validationErrorsChanged: core.Event;
            hasChangesChanged: core.Event;
            queryExecuting: core.Event;
            queryExecuted: core.Event;
            saving: core.Event;
            saved: core.Event;

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
            ready(callback: interfaces.Delegate): PromiseLike<any>;
            getEntityType(shortName: string): interfaces.EntityType;
            getEntityType<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>): interfaces.EntityType;
            createQuery<T extends interfaces.IEntity>(resourceName: string, shortName?: string): querying.EntityQuery<T>;
            createQuery(resourceName: string, shortName?: string): querying.EntityQuery<any>;
            createEntityQuery<T extends interfaces.IEntity>(shortName: string, resourceName?: string): querying.EntityQuery<T>;
            createEntityQuery(shortName: string, resourceName?: string): querying.EntityQuery<any>;
            createEntityQuery<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, resourceName?: string): querying.EntityQuery<T>;
            registerCtor<T extends interfaces.IEntity>(shortName: string, ctor?: interfaces.Delegate1<interfaces.IObject>, initializer?: interfaces.Delegate1<T>);
            registerCtor<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, ctor?: interfaces.Delegate1<interfaces.IObject>, initializer?: interfaces.Delegate1<T>);
            createEntity<T extends interfaces.IEntity>(shortName: string, initialValues?: Object): T;
            createEntity(shortName: string, initialValues?: Object): interfaces.IEntity;
            createEntity<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues?: Object): T;
            createDetachedEntity<T extends interfaces.IEntity>(shortName: string, initialValues?: Object): T;
            createDetachedEntity(shortName: string, initialValues?: Object): interfaces.IEntity;
            createDetachedEntity<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues?: Object): T;
            createRawEntity(shortName: string, initialValues?: Object): interfaces.IObject;
            createRawEntity<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues?: Object): interfaces.IObject;
            createEntityAsync<T extends interfaces.IEntity>(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<T>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<T>;
            createEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<interfaces.IEntity>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<interfaces.IEntity>;
            createEntityAsync<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<T>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<T>;
            createDetachedEntityAsync<T extends interfaces.IEntity>(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<T>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<T>;
            createDetachedEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<interfaces.IEntity>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<interfaces.IEntity>;
            createDetachedEntityAsync<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<T>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<T>;
            createRawEntityAsync(typeName: string, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<interfaces.IObject>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<interfaces.IObject>;
            createRawEntityAsync<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>, initialValues?: Object, options?: ManagerQueryOptions,
                successCallback?: interfaces.Delegate1<interfaces.IObject>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<interfaces.IObject>;
            executeQuery<T>(query: querying.EntityQuery<any>, options?: ManagerQueryOptions, successCallback?: interfaces.Delegate1<T>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<T>;
            executeQuery(query: querying.EntityQuery<any>, options?: ManagerQueryOptions, successCallback?: interfaces.Delegate1<any>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<any>;
            executeQueryLocally<T>(query: querying.EntityQuery<T>, varContext?: any): T[];
            getEntityByKey<T extends interfaces.IEntity>(key: any, shortName: string): T;
            getEntityByKey<T extends interfaces.IEntity>(key: any, type: interfaces.EntityType): T;
            getEntityByKey<T extends interfaces.IEntity>(key: any, constructor: interfaces.IParameterlessConstructor<T>): T;
            deleteEntity(entity: interfaces.IEntity);
            addEntity(entity: interfaces.IEntity);
            attachEntity(entity: interfaces.IEntity);
            detachEntity(entity: interfaces.IEntity);
            createSavePackage(entities?: interfaces.IEntity[], options?: ExportOptions): interfaces.SavePackage;
            rejectChanges(entity: interfaces.IEntity, includeRelations: boolean);
            undoChanges(entity: interfaces.IEntity, includeRelations: boolean);
            acceptChanges(entity: interfaces.IEntity, includeRelations: boolean);
            exportEntities(entities?: interfaces.IEntity[], options?: ExportOptions): interfaces.IExportEntity[];
            importEntities(exportedEntities: interfaces.IExportEntity[], merge?: enums.mergeStrategy);
            hasChanges(): boolean;
            getChanges(): interfaces.IEntity[];
            saveChanges(options?: ManagerSaveOptions, successCallback?: interfaces.Delegate1<interfaces.SaveResult>, errorCallback?: interfaces.Delegate1<Error>): PromiseLike<interfaces.SaveResult>;
            toEntity<T extends interfaces.IEntity>(object: interfaces.IObject): T;
            toEntity(object: interfaces.IObject): interfaces.IEntity;
            fixNavigations(entity: interfaces.IEntity);
            isInManager(entity: interfaces.IEntity): boolean;
            flatEntities(entities: interfaces.IEntity[]): interfaces.IEntity[];
            entry(entity: interfaces.IEntity): interfaces.Tracker;
            createSet<T extends interfaces.IEntity>(shortName: string): core.EntitySet<T>;
            createSet(shortName: string): core.EntitySet<interfaces.IEntity>;
            createSet<T extends interfaces.IEntity>(type: interfaces.EntityType): core.EntitySet<T>;
            createSet(type: interfaces.EntityType): core.EntitySet<interfaces.IEntity>;
            createSet<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>): core.EntitySet<T>;
            set<T extends interfaces.IEntity>(shortName: string): core.EntitySet<T>;
            set(shortName: string): core.EntitySet<interfaces.IEntity>;
            set<T extends interfaces.IEntity>(constructor: interfaces.IParameterlessConstructor<T>): core.EntitySet<T>;
        }
        class EntityBase implements beetle.interfaces.IEntity {
            constructor(type: beetle.interfaces.EntityType, manager?: beetle.core.EntityManager, initialValues?: Object);

            $tracker: beetle.interfaces.Tracker;
            $extra: beetle.interfaces.IQueryResultExtra;
        }
    }

    module services {
        class MvcService extends baseTypes.DataServiceBase {
            constructor(url: string, loadMetadata?: boolean, options?: ServiceOptions);
            constructor(url: string, metadataManager: metadata.MetadataManager, options?: ServiceOptions);
            constructor(url: string, metadata: string, options?: ServiceOptions);

            executeQueryParams(resource: string, queryParams: Object, options: ServiceQueryOptions,
                successCallback: interfaces.Delegate1<interfaces.SaveResult>, errorCallback: interfaces.Delegate1<Error>);
            fixResults(objects: interfaces.IObject[], makeObservable?: boolean, handleUnmappedProperties?: boolean): interfaces.IObject[];
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
        var queryExecuting: core.Event;
        var queryExecuted: core.Event;
        var saving: core.Event;
        var saved: core.Event;
        var info: core.Event;
        var warning: core.Event;
        var error: core.Event;
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
        function setObservableProvider(type: enums.observableProviders);
        function setObservableProvider(typeName: string);
        function setObservableProvider(provider: baseTypes.ObservableProviderBase);
        function getAjaxProvider(): baseTypes.AjaxProviderBase;
        function setAjaxProvider(type: enums.ajaxProviders);
        function setAjaxProvider(typeName: string);
        function setAjaxProvider(provider: baseTypes.AjaxProviderBase);
        function getSerializationService(): baseTypes.SerializationServiceBase;
        function setSerializationService(type: enums.serializationServices);
        function setSerializationService(typeName: string);
        function setSerializationService(service: baseTypes.SerializationServiceBase);
        function getArraySetBehaviour(): enums.arraySetBehaviour;
        function setArraySetBehaviour(type: enums.arraySetBehaviour);
        function setArraySetBehaviour(typeName: string);
        function getDefaultServiceType(): enums.serviceTypes;
        function setDefaultServiceType(type: enums.serviceTypes);
        function setDefaultServiceType(typeName: string);
        function getDateConverter(): baseTypes.DateConverterBase;
        function setDateConverter(converter: baseTypes.DateConverterBase);
        function getLocalizeFunction(): interfaces.Func1<string, string>;
        function setLocalizeFunction(func: interfaces.Func1<string, string>);
    }

    class MetadataManager extends metadata.MetadataManager { }
    class EntityManager extends core.EntityManager { }
    class EntityBase extends core.EntityBase { }
    class WebApiService extends services.WebApiService { }
    class MvcService extends services.MvcService { }
    class Event extends core.Event { }
    class ValueNotifyWrapper extends core.ValueNotifyWrapper { }

    var version: string;
}

interface Array<T> {
    asQueryable(): beetle.querying.ArrayQuery<T>;
    q(): beetle.querying.ArrayQuery<T>;
}

/*

Async await

*/