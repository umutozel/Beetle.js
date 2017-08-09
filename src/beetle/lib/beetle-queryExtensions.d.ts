import * as beetle from "./beetle";

declare module "beetle" {

	namespace querying {

		interface ArrayQuery<T> {
            /** Automatically executed before enumeration (like LINQ). */
			length: number;

            /**
             * Applies an accumulator function over an array. The specified seed value is used as the initial accumulator value.
             * @param func - A function to test each element for a condition.
             * @param seed - The initial accumulator value.
             */
			aggregate<TAggregate>(func: (aggregate: TAggregate, entity: T) => TAggregate, seed?: TAggregate): beetle.querying.ArrayQuery<TAggregate>;
            /**
             * Concatenates two arrays.
             * @param other - The array to concatenate to the query's array.
             */
			concat(other: Array<T>): beetle.querying.ArrayQuery<T>;
            /**
             * Determines whether a array contains a specified element.
             * @param item - The value to locate in the array.
             * @returns true if the source array contains an element that has the specified value; otherwise, false.
             */
			contains(item: T): boolean;
            /**
             * Produces the set difference of two arrays.
             * @param other - An array whose elements that also occur in the first array will cause those elements to be removed from the returned array.
             */
			except(other: Array<T>): beetle.querying.ArrayQuery<T>;
            /**
             * Correlates the elements of two arrays based on equality of keys and groups the results.
             * @param other - The array to join to the query array.
             * @param thisKey - Key selector for query's array.
             * @param otherKey - Key selector for other array.
             * @param selector - A function to create a result element from an element from the first array and a collection of matching elements from the other array.
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
             * @param other - The array to join to the query array.
             * @param thisKey - Key selector for query's array.
             * @param otherKey - Key selector for other array.
             * @param selector - A function to create a result element from two matching elements.
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
             * @param other - The array to join to the query array.
             * @param thisKey - Key selector for query's array.
             * @param otherKey - Key selector for other array.
             * @param selector - A function to create a result element from two matching elements.
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
             * @param other - The array to join to the query array.
             * @param thisKey - Key selector for query's array.
             * @param otherKey - Key selector for other array.
             * @param selector - A function to create a result element from two matching elements.
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
             * @param other - The array to join to the query array.
             * @param thisKey - Key selector for query's array.
             * @param otherKey - Key selector for other array.
             * @param selector - A function to create a result element from two matching elements.
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
             * @param other - The array to join to the query array.
             * @param thisKey - Key selector for query's array.
             * @param otherKey - Key selector for other array.
             * @param selector - A function to create a result element from two matching elements.
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
             * @param other - The array to join to the query array.
             * @param thisKey - Key selector for query's array.
             * @param otherKey - Key selector for other array.
             * @param selector - A function to create a result element from two matching elements.
             */
			crossJoin<TOther>(other: Array<TOther>, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
			crossJoin<TOther, TResult>(other: Array<TOther>, selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
            /**
             * Produces the set intersection of two arrays.
             * @param other - The array whose distinct elements that also appear in the first array will be returned.
             */
			intersect(other: Array<T>): beetle.querying.ArrayQuery<T>;
            /**
             * Determines whether two arrays are equal by comparing the elements.
             * @param other - An array to compare to the query array.
             */
			sequenceEqual(other: Array<T>): boolean;
            /**
             * Creates a array from query array according to specified key selector and element selector functions.
             * @param keySelector - A function to extract a key from each element.
             * @param elementSelector - An array to compare to the query array.
             */
			toLookup(keySelector: (entity: T) => any, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
			toLookup<TKey>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
			toLookup<TKey, TResult>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, TKey>) => any): beetle.querying.ArrayQuery<TResult>;
            /**
             * Produces the set union of two arrays' distinct elements.
             * @param {any[]} other - An array whose distinct elements form the second set for the union.
             */
			union(other: Array<T>): beetle.querying.ArrayQuery<T>;
            /**
             * Applies a specified function to the corresponding elements of two arrays, producing a array of the results.
             * @param {any[]} other - The second array to merge.
             * @param {Function} selector - A function that specifies how to merge the elements from the two arrays.
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
		inlineCount(isEnabled?: boolean): beetle.querying.ArrayQuery<T>;
		ofType<TResult extends T>(type: string | (new () => TResult)): beetle.querying.ArrayQuery<TResult>;
		where(predicate: string, varContext?: any): beetle.querying.ArrayQuery<T>;
		where(predicate: (entity: T) => boolean): beetle.querying.ArrayQuery<T>;
		orderBy(keySelector: string | ((entity: T) => any) | ((entity1: T, entity2: T) => number)): beetle.querying.ArrayQuery<T>;
		orderByDesc(keySelector: string | ((entity: T) => any) | ((entity1: T, entity2: T) => number)): beetle.querying.ArrayQuery<T>;
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

		/**
         * Applies an accumulator function over an array. The specified seed value is used as the initial accumulator value.
         * @param func - A function to test each element for a condition.
         * @param seed - The initial accumulator value.
         */
	    aggregate<TAggregate>(func: (aggregate: TAggregate, entity: T) => TAggregate, seed?: TAggregate): beetle.querying.ArrayQuery<TAggregate>;
        /**
         * Concatenates two arrays.
         * @param other - The array to concatenate to the query's array.
         */
		concat(other: Array<T>): beetle.querying.ArrayQuery<T>;
        /**
         * Determines whether a array contains a specified element.
         * @param item - The value to locate in the array.
         * @returns true if the source array contains an element that has the specified value; otherwise, false.
         */
		contains(item: T): boolean;
        /**
         * Produces the set difference of two arrays.
         * @param other - An array whose elements that also occur in the first array will cause those elements to be removed from the returned array.
         */
		except(other: Array<T>): beetle.querying.ArrayQuery<T>;
        /**
         * Correlates the elements of two arrays based on equality of keys and groups the results.
         * @param other - The array to join to the query array.
         * @param thisKey - Key selector for query's array.
         * @param otherKey - Key selector for other array.
         * @param selector - A function to create a result element from an element from the first array and a collection of matching elements from the other array.
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
         * @param other - The array to join to the query array.
         * @param thisKey - Key selector for query's array.
         * @param otherKey - Key selector for other array.
         * @param selector - A function to create a result element from two matching elements.
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
         * @param other - The array to join to the query array.
         * @param thisKey - Key selector for query's array.
         * @param otherKey - Key selector for other array.
         * @param selector - A function to create a result element from two matching elements.
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
         * @param other - The array to join to the query array.
         * @param thisKey - Key selector for query's array.
         * @param otherKey - Key selector for other array.
         * @param selector - A function to create a result element from two matching elements.
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
         * @param other - The array to join to the query array.
         * @param thisKey - Key selector for query's array.
         * @param otherKey - Key selector for other array.
         * @param selector - A function to create a result element from two matching elements.
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
         * @param other - The array to join to the query array.
         * @param thisKey - Key selector for query's array.
         * @param otherKey - Key selector for other array.
         * @param selector - A function to create a result element from two matching elements.
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
         * @param other - The array to join to the query array.
         * @param thisKey - Key selector for query's array.
         * @param otherKey - Key selector for other array.
         * @param selector - A function to create a result element from two matching elements.
         */
		crossJoin<TOther>(other: Array<TOther>, selector: (entity: T, other: TOther) => any): beetle.querying.ArrayQuery<any>;
		crossJoin<TOther, TResult>(other: Array<TOther>, selector: (entity: T, other: TOther) => TResult): beetle.querying.ArrayQuery<TResult>;
        /**
         * Produces the set intersection of two arrays.
         * @param other - The array whose distinct elements that also appear in the first array will be returned.
         */
		intersect(other: Array<T>): beetle.querying.ArrayQuery<T>;
        /**
         * Determines whether two arrays are equal by comparing the elements.
         * @param other - An array to compare to the query array.
         */
		sequenceEqual(other: Array<T>): boolean;
        /**
         * Creates a array from query array according to specified key selector and element selector functions.
         * @param keySelector - A function to extract a key from each element.
         * @param elementSelector - An array to compare to the query array.
         */
		toLookup(keySelector: (entity: T) => any, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
		toLookup<TKey>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, any>) => any): beetle.querying.ArrayQuery<any>;
		toLookup<TKey, TResult>(keySelector: (entity: T) => TKey, elementSelector: (group: beetle.interfaces.Grouping<T, TKey>) => any): beetle.querying.ArrayQuery<TResult>;
        /**
         * Produces the set union of two arrays' distinct elements.
         * @param {any[]} other - An array whose distinct elements form the second set for the union.
         */
		union(other: Array<T>): beetle.querying.ArrayQuery<T>;
        /**
         * Applies a specified function to the corresponding elements of two arrays, producing a array of the results.
         * @param {any[]} other - The second array to merge.
         * @param {Function} selector - A function that specifies how to merge the elements from the two arrays.
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

export = beetle;

export as namespace beetle;
