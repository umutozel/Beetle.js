import * as beetle from "beetle.js";

declare module "beetle" {

	namespace querying {

		interface ArrayQuery<T> {
            /** Automatically executed before enumeration (like LINQ). */
			length: number;

            /**
             * Applies an accumulator function over an array. The specified seed value is used as the initial accumulator value.
             * @param func A function to test each element for a condition.
             * @param seed The initial accumulator value.
             */
			aggregate<TAggregate>(func: (aggregate: TAggregate, entity: T) => TAggregate, seed?: TAggregate): beetle.querying.ArrayQuery<TAggregate>;
            /**
             * Concatenates two arrays.
             * @param other The array to concatenate to the query's array.
             */
			concat(other: Array<T>): beetle.querying.ArrayQuery<T>;
            /**
             * Determines whether a array contains a specified element.
             * @param item The value to locate in the array.
             * @returns true if the source array contains an element that has the specified value; otherwise, false.
             */
			contains(item: T): boolean;
            /**
             * Produces the set difference of two arrays.
             * @param other An array whose elements that also occur in the first array will cause those elements to be removed from the returned array.
             */
			except(other: Array<T>): beetle.querying.ArrayQuery<T>;
            /**
             * Correlates the elements of two arrays based on equality of keys and groups the results.
             * @param other The array to join to the query array.
             * @param thisKey Key selector for query's array.
             * @param otherKey Key selector for other array.
             * @param selector A function to create a result element from an element from the first array and a collection of matching elements from the other array.
             */
			groupJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: Array<TOther>) => any): beetle.querying.ArrayQuery<any>;
			groupJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: Array<TOther>) => any): beetle.querying.ArrayQuery<any>;
			groupJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
				selector: (entity: T, other: Array<TOther>) => TResult): beetle.querying.ArrayQuery<TResult>;
			groupJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: Array<TOther>) => TResult): beetle.querying.ArrayQuery<TResult>;
            /**
             * Correlates the elements of two arrays based on matching keys.
             * @param other The array to join to the query array.
             * @param thisKey Key selector for query's array.
             * @param otherKey Key selector for other array.
             * @param selector A function to create a result element from two matching elements.
             */
			join<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			join<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			join<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
			join<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
			/**
             * Correlates the elements of two arrays based on matching keys.
             * @param other The array to join to the query array.
             * @param thisKey Key selector for query's array.
             * @param otherKey Key selector for other array.
             * @param selector A function to create a result element from two matching elements.
             */
			innerJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			innerJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			innerJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
			innerJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
            /**
             * Correlates the elements of two arrays based on matching keys (query array items are taken even they do not have matching item on other array).
             * @param other The array to join to the query array.
             * @param thisKey Key selector for query's array.
             * @param otherKey Key selector for other array.
             * @param selector A function to create a result element from two matching elements.
             */
			leftJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			leftJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			leftJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
			leftJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entiy: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
            /**
             * Correlates the elements of two arrays based on matching keys (other array items are taken even they do not have matching item on query array).
             * @param other The array to join to the query array.
             * @param thisKey Key selector for query's array.
             * @param otherKey Key selector for other array.
             * @param selector A function to create a result element from two matching elements.
             */
			rightJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			rightJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			rightJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
			rightJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
            /**
             * Correlates the elements of two arrays based on matching keys (all items are taken cross-multiplied).
             * @param other The array to join to the query array.
             * @param thisKey Key selector for query's array.
             * @param otherKey Key selector for other array.
             * @param selector A function to create a result element from two matching elements.
             */
			fullJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			fullJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			fullJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
			fullJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
				selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
            /**
             * Correlates the elements of two arrays based on matching keys (all items are taken cross-multiplied).
             * @param other The array to join to the query array.
             * @param thisKey Key selector for query's array.
             * @param otherKey Key selector for other array.
             * @param selector A function to create a result element from two matching elements.
             */
			crossJoin<TOther>(other: Array<TOther>, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			crossJoin<TOther, TResult>(other: Array<TOther>, selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
            /**
             * Produces the set intersection of two arrays.
             * @param other The array whose distinct elements that also appear in the first array will be returned.
             */
			intersect(other: Array<T>): beetle.querying.ArrayQuery<T>;
            /**
             * Determines whether two arrays are equal by comparing the elements.
             * @param other An array to compare to the query array.
             */
			sequenceEqual(other: Array<T>): boolean;
            /**
             * Creates a array from query array according to specified key selector and element selector functions.
             * @param keySelector A function to extract a key from each element.
             * @param elementSelector An array to compare to the query array.
             */
			toLookup(keySelector: (entity: T) => any, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
			toLookup<TKey>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
			toLookup<TKey, TResult>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, TKey>) => any): beetle.querying.ArrayQuery<TResult>;
            /**
             * Produces the set union of two arrays' distinct elements.
             * @param other An array whose distinct elements form the second set for the union.
             */
			union(other: Array<T>): beetle.querying.ArrayQuery<T>;
            /**
             * Applies a specified function to the corresponding elements of two arrays, producing a array of the results.
             * @param other The second array to merge.
             * @param selector A function that specifies how to merge the elements from the two arrays.
             */
			zip<TOther>(other: Array<TOther>, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			zip<TOther, TResult>(other: Array<TOther>, selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;

            /** Automatically executes before enumeration. */
            forEach(callback: (item: T) => void);
		}
	}
}

declare global {

	interface Array<T> {
        /**
         * Indicates wheter or not include total count in result.
         * @param isEnabled When true, total count will be included in result. Default value: true.
         */
		inlineCount(isEnabled?: boolean): beetle.querying.ArrayQuery<T>;
        /**
         * If model has inheritance, when querying base type we can tell which derived type we want to load.
         * @param typeName Derived type name.
         */
		ofType<TResult extends T>(type: string | (new () => TResult)): beetle.querying.ArrayQuery<TResult>;
        /**
         * Filter query based on given expression.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        where(predicate: string | ((entity: T) => boolean), varContext?: any): beetle.querying.ArrayQuery<T>;
        /**
         * Sorts results based on given properties.
         * @param properties The properties to sort by.
         * @param isDesc Indicates if sorting will be descending. Default value is false.
         */
		orderBy(keySelector?: string | ((entity: T) => any) | ((entity1: T, entity2: T) => number)): beetle.querying.ArrayQuery<T>;
        /**
         * Sorts results based on given properties descendingly.
         * @param properties The properties to sort by.
         */
		orderByDesc(keySelector?: string | ((entity: T) => any) | ((entity1: T, entity2: T) => number)): beetle.querying.ArrayQuery<T>;
        /**
         * Selects only given properties using projection.
         * @param properties Properties or PropertyPaths to select (project).
         */
		select<TResult>(selector: string | string[] | ((entity: T) => TResult)): beetle.querying.ArrayQuery<TResult>;
		select<TResult>(...selectors: string[]): beetle.querying.ArrayQuery<TResult>;
		select(selector: string | string[] | ((entity: T) => any)): beetle.querying.ArrayQuery<any>;
		select(...selectors: string[]): beetle.querying.ArrayQuery<any>;
        /**
         * Skips given count records and start reading.
         * @paramcount The number of items to skip.
         */
		skip(count: number): beetle.querying.ArrayQuery<T>;
        /**
         * Takes only given count records.
         * @param count The number of items to take.
         */
		take(count: number): beetle.querying.ArrayQuery<T>;
        /**
         * Takes only given count records .
         * @param count The number of items to take.
         */
		top(count: number): beetle.querying.ArrayQuery<T>;
        /**
         * Groups query by given keys (projects them into a new type) and returns values (projecting into new type).
         * @param keySelector A projection to extract the key for each element.
         * @param valueSelector A projection to create a result value from each group.
         */
		groupBy<TKey, TResult>(keySelector: (entity: T) => TKey, valueSelector: (group: beetle.interfaces.Grouping<T, TKey>) => TResult): beetle.querying.ArrayQuery<TResult>;
		groupBy<TKey>(keySelector: (entity: T) => TKey): beetle.querying.ArrayQuery<beetle.interfaces.Grouped<T, TKey>>;
		groupBy<TResult>(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: beetle.interfaces.Grouping<T, any>) => TResult)): beetle.querying.ArrayQuery<TResult>;
		groupBy(keySelector: string | ((entity: T) => any)): beetle.querying.ArrayQuery<beetle.interfaces.Grouped<T, any>>;
		groupBy(keySelector: string | ((entity: T) => any), valueSelector: string | ((group: beetle.interfaces.Grouping<T, any>) => any)): beetle.querying.ArrayQuery<any>;
        /**
         * Gets only distinct items, when selector is given it will be used as comparer (project and compares projected objects).
         * @param selector A projection to extract the key for each element.
         */
		distinct(): beetle.querying.ArrayQuery<T>;
		distinct<TResult>(selector: string | ((entity: T) => TResult)): beetle.querying.ArrayQuery<TResult>;
		distinct(selector: string | ((entity: T) => any)): beetle.querying.ArrayQuery<any>;
        /** Reverse the collection. */
		reverse(): beetle.querying.ArrayQuery<T>;
        /**
         * Selects given collection property for each element and returns all in a new array.
         * @param properties Properties or PropertyPaths to select (project).
         */
		selectMany<TResult>(selector: string | ((entity: T) => Array<TResult>)): beetle.querying.ArrayQuery<TResult>;
		selectMany(selector: string | ((entity: T) => any)): beetle.querying.ArrayQuery<any>;
        /**
         * Gets all the items after first succesful predicate.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        skipWhile(predicate: string | ((entity: T) => boolean), varContext?: any): beetle.querying.ArrayQuery<T>;
        /**
         * Gets all the items before first succesful predicate.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        takeWhile(predicate: string | ((entity: T) => boolean), varContext?: any): beetle.querying.ArrayQuery<T>;

        /**
         * If all items suits given predication returns true, otherwise false.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        all(predicate?: string | ((entity: T) => boolean), varContext?: any): boolean;
        /**
         * If there is at least one item in query result (or any item suits given predication) returns true, otherwise false.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        any(predicate?: string | ((entity: T) => boolean), varContext?: any): boolean;
        /**
         * Calculates average of items of query (or from given projection result).
         * @param selector Property path to use on calculation.
         */
        avg(selector?: string | ((entity: T) => number)): number;
        /**
         * Finds maximum value from items of query (or from given projection result).
         * @param selector Property path to use on calculation.
         */
        max(selector?: string | ((entity: T) => number)): number;
        /**
         * Finds minimum value from items of query (or from given projection result).
         * @param selector Property path to use on calculation.
         */
        min(selector?: string | ((entity: T) => number)): number;
        /**
         * Finds summary value from items of query (or from given projection result).
         * @param selector Property path to use on calculation.
         */
        sum(selector?: string | ((entity: T) => number)): number;
        /**
         * Gets the count of items of query.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        count(predicate?: string | ((entity: T) => boolean), varContext?: any): number;
        /**
         * Gets the first value from items of query (or from given predication result). When there is no item, throws exception.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        first(predicate?: string | ((entity: T) => boolean), varContext?: any): T;
        /**
         * Gets the first value (or null when there is no items) from items of query (or from given predication result).
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        firstOrDefault(predicate?: string | ((entity: T) => boolean), varContext?: any): T;
        /**
         * Gets the single value from items (or from given predication result). Where zero or more than one item exists throws exception.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        single(predicate?: string | ((entity: T) => boolean), varContext?: any): T;
        /**
         * Gets the single value (or null when there is no items) from items (or from given predication result). Where more than one item exists throws exception.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        singleOrDefault(predicate?: string | ((entity: T) => boolean), varContext?: any): T;
        /**
         * Gets the last value from items of query (or from given predication result). When there is no item, throws exception.
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        last(predicate?: string | ((entity: T) => boolean), varContext?: any): T;
        /**
         * Gets the last value (or null when there is no items) from items of query (or from given predication result).
         * @param predicate A function to test each element for a condition (can be string expression).
         * @param varContext Variable context for the expression.
         */
        lastOrDefault(predicate?: string | ((entity: T) => boolean), varContext?: any): T;

		/**
         * Applies an accumulator function over an array. The specified seed value is used as the initial accumulator value.
         * @param func A function to test each element for a condition.
         * @param seed The initial accumulator value.
         */
	    aggregate<TAggregate>(func: (aggregate: TAggregate, entity: T) => TAggregate, seed?: TAggregate): beetle.querying.ArrayQuery<TAggregate>;
        /**
         * Concatenates two arrays.
         * @param other The array to concatenate to the query's array.
         */
		concat(other: Array<T>): beetle.querying.ArrayQuery<T>;
        /**
         * Determines whether a array contains a specified element.
         * @param item The value to locate in the array.
         * @returns true if the source array contains an element that has the specified value; otherwise, false.
         */
		contains(item: T): boolean;
        /**
         * Produces the set difference of two arrays.
         * @param other An array whose elements that also occur in the first array will cause those elements to be removed from the returned array.
         */
		except(other: Array<T>): beetle.querying.ArrayQuery<T>;
        /**
         * Correlates the elements of two arrays based on equality of keys and groups the results.
         * @param other The array to join to the query array.
         * @param thisKey Key selector for query's array.
         * @param otherKey Key selector for other array.
         * @param selector A function to create a result element from an element from the first array and a collection of matching elements from the other array.
         */
		groupJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: Array<TOther>) => any): beetle.querying.ArrayQuery<any>;
		groupJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: Array<TOther>) => any): beetle.querying.ArrayQuery<any>;
		groupJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
			selector: (entity: T, other: Array<TOther>) => TResult): beetle.querying.ArrayQuery<TResult>;
		groupJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: Array<TOther>) => TResult): beetle.querying.ArrayQuery<TResult>;
        /**
         * Correlates the elements of two arrays based on matching keys.
         * @param other The array to join to the query array.
         * @param thisKey Key selector for query's array.
         * @param otherKey Key selector for other array.
         * @param selector A function to create a result element from two matching elements.
         */
		join<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		join<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		join<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
		join<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
		/**
         * Correlates the elements of two arrays based on matching keys.
         * @param other The array to join to the query array.
         * @param thisKey Key selector for query's array.
         * @param otherKey Key selector for other array.
         * @param selector A function to create a result element from two matching elements.
         */
		innerJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		innerJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		innerJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
		innerJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
        /**
         * Correlates the elements of two arrays based on matching keys (query array items are taken even they do not have matching item on other array).
         * @param other The array to join to the query array.
         * @param thisKey Key selector for query's array.
         * @param otherKey Key selector for other array.
         * @param selector A function to create a result element from two matching elements.
         */
		leftJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		leftJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		leftJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
		leftJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entiy: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
        /**
         * Correlates the elements of two arrays based on matching keys (other array items are taken even they do not have matching item on query array).
         * @param other The array to join to the query array.
         * @param thisKey Key selector for query's array.
         * @param otherKey Key selector for other array.
         * @param selector A function to create a result element from two matching elements.
         */
		rightJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		rightJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		rightJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
		rightJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
        /**
         * Correlates the elements of two arrays based on matching keys (all items are taken cross-multiplied).
         * @param other The array to join to the query array.
         * @param thisKey Key selector for query's array.
         * @param otherKey Key selector for other array.
         * @param selector A function to create a result element from two matching elements.
         */
		fullJoin<TOther>(other: Array<TOther>, thisKey: string, otherKey: string, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		fullJoin<TOther, TKey>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		fullJoin<TOther, TResult>(other: Array<TOther>, thisKey: string, otherKey: string,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
		fullJoin<TOther, TKey, TResult>(other: Array<TOther>, thisKey: (entity: T) => TKey, otherKey: (entity: TOther) => TKey,
			selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
        /**
         * Correlates the elements of two arrays based on matching keys (all items are taken cross-multiplied).
         * @param other The array to join to the query array.
         * @param thisKey Key selector for query's array.
         * @param otherKey Key selector for other array.
         * @param selector A function to create a result element from two matching elements.
         */
		crossJoin<TOther>(other: Array<TOther>, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		crossJoin<TOther, TResult>(other: Array<TOther>, selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
        /**
         * Produces the set intersection of two arrays.
         * @param other The array whose distinct elements that also appear in the first array will be returned.
         */
		intersect(other: Array<T>): beetle.querying.ArrayQuery<T>;
        /**
         * Determines whether two arrays are equal by comparing the elements.
         * @param other An array to compare to the query array.
         */
		sequenceEqual(other: Array<T>): boolean;
        /**
         * Creates a array from query array according to specified key selector and element selector functions.
         * @param keySelector A function to extract a key from each element.
         * @param elementSelector An array to compare to the query array.
         */
		toLookup(keySelector: (entity: T) => any, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
		toLookup<TKey>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
		toLookup<TKey, TResult>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, TKey>) => any): beetle.querying.ArrayQuery<TResult>;
        /**
         * Produces the set union of two arrays' distinct elements.
         * @param other An array whose distinct elements form the second set for the union.
         */
		union(other: Array<T>): beetle.querying.ArrayQuery<T>;
        /**
         * Applies a specified function to the corresponding elements of two arrays, producing a array of the results.
         * @param other The second array to merge.
         * @param selector A function that specifies how to merge the elements from the two arrays.
         */
		zip<TOther>(other: Array<TOther>, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		zip<TOther, TResult>(other: Array<TOther>, selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;

        /** Register forEach method to Array */
        forEach(callback: (item: T) => void);
	}

	interface ArrayConstructor {
        /** Register static range method to Array */
		range(start: number, count: number): Array<number>;
        /** Register static repeat method to Array */
		repeat(item: any, count: number): Array<number>;
	}
}

/** Re-export all beetle module. */
export = beetle;

/** Also re-export as namespace to support UMD. */
export as namespace beetle;
