Beetle.js 
=========

[![Build status](https://ci.appveyor.com/api/projects/status/chugsi3ye1ufa5n2?svg=true)](https://ci.appveyor.com/project/umutozel/beetle-js)
[![NuGet Badge](https://buildstats.info/nuget/Beetle.Server)](https://www.nuget.org/packages/Beetle.Server/)
[![npm version](https://badge.fury.io/js/beetle.js.svg)](https://badge.fury.io/js/beetle.js)
<a href="https://snyk.io/test/npm/beetle.js"><img src="https://snyk.io/test/npm/beetle.js/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/npm/beetle.js" style="max-width:100%;"></a>
[![Join the chat at https://gitter.im/umutozel/Beetle.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/umutozel/Beetle.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Beetle is a data manager for Javascript.
The goal is to be able to work with data as easy as Entity Framework and LINQ.


## Features
* Tracks objects and persists changes to server
* Can work with Knockout and ES5 properties (others can be implemented easily)
* Can work with Q, Angular, ES6 and jQuery promises
* Supports data model inheritance
* Supports aggregate functions
* Can work without metadata
* Can work with Mvc and WebApi Controllers
* Supports property, entity validations
* Can use existing data annotation validations (carries multi-language resource messages to client)
* Can query server with Http POST
* Can be extended to support almost every library (client and server side), flexible architecture
* Auto fix navigation properties (after foreign key set, entity attach etc..)
* Can check-auto convert values for its proper data types
* Can be internationalized (for internal messages, validation messages etc..)

## Current prerequisities
All dependencies have base types so custom implementations can be made easily.
* Entity Framework
* WebApi or Asp.Net Mvc project for service
* Knockout.js or EcmaScript5 Properties for providing observable properties

## Usage
* Create a Controller and inherit from BeetleApiController, generic argument tells we are using Entity Framework context handler with TestEntities context (DbContext)
```cs
public class BeetleTestController : BeetleApiController<EFContextHandler<TestEntities>> {
		
	[HttpGet]
	public IQueryable<Entity> Entities() {
		return ContextHandler.Context.Entities;
	}
}
```
* Configure routing
```cs
public static class BeetleWebApiConfig {

	public static void RegisterBeetlePreStart() {
		GlobalConfiguration.Configuration.Routes.MapHttpRoute("BeetleApi", "api/{controller}/{action}");
	}
}
```
* Create an entity manager
```javascript
var manager = new EntityManager('api/BeetleTest');
```
* Create a query
```javascript
var query = manager.createQuery('Entities').where('e => e.Name != null');
```
* Execute the query and edit the data
```javascript
manager.executeQuery(query)
	.then(function (data) {
		self.entities = data;
        data[0].UserNameCreate = 'Test Name';
    })
```
* Execute local query
```javascript
var hasCanceled = self.entities.asQueryable().any('e => e.IsCanceled == true').execute();
// q is shortcut for asQueryable, x is shortcut for execute
var hasDeleted = self.entities.q().any('e => e.IsDeleted').x();
// alias is optional
var hasDeleted = self.entities.q().any('IsDeleted').x();

// with beetle.queryExtensions.js we can write queries like these;
// this query will be executed immediately and returns true or false
var hasExpired = self.entities.any('IsExpired == true');
// below query will be executed after it's length property is accessed (like LINQ GetEnumerator)
var news = self.entities.where('IsNew');
```
* Add a new entity
```javascript
var net = manager.createEntity('EntityType', {Id: beetle.helper.createGuid()});
net.Name = 'Test EntityType';
```
* Delete an entity
```javascript
manager.deleteEntity(net);
```
* Save all changes
```javascript
manager.saveChanges()
    .then(function () {
        alert('Save succesfull');
    })
```

## Supported Data Types
string, guid, date, dateTimeOffset, time, boolean, int, number (for float, decimal, etc..), byte, enum, binary, geometry, geography (spatial types are supported partially, can be fully supported once we decide how to represent them at client side)

## Validators
required, stringLength, maximumLength, minimumLength, range, emailAddress, creditCard, url, phone, postalCode, time, regularExpression, compare

## Supported Query Expressions
ofType, where, orderBy, expand (include), select, skip, top (take), groupBy, distinct, reverse, selectMany, skipWhile, takeWhile, all, any, avg, max, min, sum, count, first, firstOrDefault, single, singleOrDefault, last, lastOrDefault

## Supported Query Functions
toupper, tolower, substring, substringof, length, trim, concat, replace, startswith, endswith, indexof, round, ceiling, floor, second, minute, hour, day, month, year, max, min, sum, count, avg, any, all, contains
(can be used in expression strings, some are not supported by OData but can be used with beetle query string format)

## License
See [License](https://github.com/umutozel/Beetle.js/blob/master/LICENSE)

Thanks to [JetBrains](http://www.jetbrains.com/) for providing us with free licenses to their great tools.
