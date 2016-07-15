// Type definitions for beetle.js query extension 2.0
// Project: https://github.com/umutozel/Beetle.js
// File version: 2.0.15

declare module beetle {

    module interfaces {
        interface ClosedQueryable<T, TOptions> {
            then(successCallback: (result: T) => void, errorCallback?: (e: Error) => void, options?: TOptions): PromiseLike<T>;
        }
    }

    module querying {
        interface ArrayQuery<T> extends Array<T> {
            length: number; // also executes query (like GetEnumerator)

            forEach(callback: (item: T) => void);
        }

        interface EntityQuery<T> {
            then(callback: (result: beetle.interfaces.QueryResultArray<T>) => void, errorCallback?: (e: Error) => void,
                 options?: beetle.ManagerOptions): PromiseLike<beetle.interfaces.QueryResultArray<T>>;
        }
    }
}

interface Array<T> {
    inlineCount(isEnabled?: boolean): beetle.querying.ArrayQuery<T>;
    ofType<TResult extends T>(type: string | (new () => TResult)): beetle.querying.ArrayQuery<TResult>;
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

    aggregate<TAggregate>(func: (aggregate: TAggregate, entity: T) => TAggregate, seed?: TAggregate): beetle.querying.ArrayQuery<TAggregate>;
    concat(other: Array<T>): beetle.querying.ArrayQuery<T>;
    contains(item: T): boolean;
    except(other: Array<T>): beetle.querying.ArrayQuery<T>;
    groupJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: Array<TOther>) => any): beetle.querying.ArrayQuery<any>;
    groupJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: Array<TOther>) => any): beetle.querying.ArrayQuery<any>;
    groupJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
        selector: (entity: T, other: Array<TOther>) => TResult): beetle.querying.ArrayQuery<TResult>;
    groupJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: Array<TOther>) => TResult): beetle.querying.ArrayQuery<TResult>;
    join<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    join<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    join<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    join<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    innerJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    innerJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    innerJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    innerJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    leftJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    leftJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    leftJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    leftJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entiy: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    rightJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    rightJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    rightJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    rightJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    fullJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    fullJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    fullJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    fullJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
        selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    crossJoin<TOther>(other: Array<TOther>, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    crossJoin<TOther, TResult>(other: Array<TOther>, selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
    intersect(other: Array<T>): beetle.querying.ArrayQuery<T>;
    sequenceEqual(other: Array<T>): boolean;
    toLookup(keySelector: (entity: T) => any, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
    toLookup<TKey>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
    toLookup<TKey, TResult>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, TKey>) => any): beetle.querying.ArrayQuery<TResult>;
    union(other: Array<T>): beetle.querying.ArrayQuery<T>;
    zip<TOther>(other: Array<TOther>, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
    zip<TOther, TResult>(other: Array<TOther>, selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;

    forEach(callback: (item: T) => void);
}

interface ArrayConstructor {
    range(start: number, count: number): Array<number>;
    repeat(item: any, count: number): Array<number>;
}
