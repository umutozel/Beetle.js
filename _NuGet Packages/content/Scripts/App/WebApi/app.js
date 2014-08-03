/*global ko Router */
(function () {
	'use strict';

	var ENTER_KEY = 13;

	// a custom binding to handle the enter key (could go in a separate library)
	ko.bindingHandlers.enterKey = {
		init: function (element, valueAccessor, allBindingsAccessor, data) {
			var wrappedHandler, newValueAccessor;

			// wrap the handler with a check for the enter key
			wrappedHandler = function (data, event) {
				if (event.keyCode === ENTER_KEY) {
					valueAccessor().call(this, data, event);
				}
			};

			// create a valueAccessor with the options that we would want to pass to the event binding
			newValueAccessor = function () {
				return {
					keyup: wrappedHandler
				};
			};

			// call the real event binding's init function
			ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data);
		}
	};

	// wrapper to hasfocus that also selects text and applies focus async
	ko.bindingHandlers.selectAndFocus = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			ko.bindingHandlers.hasfocus.init(element, valueAccessor, allBindingsAccessor);
			ko.utils.registerEventHandler(element, 'focus', function () {
				element.focus();
			});
		},
		update: function (element, valueAccessor) {
			ko.utils.unwrapObservable(valueAccessor()); // for dependency
			// ensure that element is visible before trying to focus
			setTimeout(function () {
				ko.bindingHandlers.hasfocus.update(element, valueAccessor);
			}, 0);
		}
	};

	// our main view model
	var ViewModel = function () {
	    var manager = new beetle.entityManager(new beetle.services.webApiService('beetle/TodoApi'));
	    manager.registerCtor('Todo', null, // null constructor
	        function (todo) { // we want to intercept after entity properties converted to observables
	            todo.editing = ko.observable(false);
	        }
	    );

	    var self = this;

		// map array of passed in todos to an observableArray of Todo objects
	    self.todos = ko.observableArray([]);
	    self.getTodos = function () {
	        manager.createQuery('Todos')
                .execute()
                .then(function (result) {
                    self.todos(result);
                })
                .fail(function (e) {
                    toastr.error(e.message);
                });
	    };
	    self.getTodos();

		// store the new todo value being entered
		self.current = ko.observable();

		self.showMode = ko.observable('all');

		self.filteredTodos = ko.computed(function () {
			switch (self.showMode()) {
			case 'active':
				return self.todos().where('Completed != true').x();
			case 'completed':
				return self.todos().where('Completed').x();
			default:
				return self.todos();
			}
		});

		// add a new todo, when enter key is pressed
		self.add = function () {
		    var current = self.current().trim();
		    if (current) {
		        var todo = manager.createEntity('Todo');
		        todo.Title(current);
		        self.todos.push(todo);
		        self.current('');
		        saveChanges();
		    }
		};

		// remove a single todo
		self.remove = function (todo) {
		    manager.deleteEntity(todo);
		    self.todos.remove(todo);
		    saveChanges();
		};

		// remove all completed todos
		self.removeCompleted = function () {
			for (var i = self.todos().length - 1; i >= 0; i--) {
			    var todo = self.todos()[i];
			    if (todo.Completed()) {
			        self.todos.splice(i, 1);
			        manager.deleteEntity(todo);
			    }
			}
			saveChanges();
		};

		// edit an item
		self.editItem = function (item) {
			item.editing(true);
		};

		// stop editing an item.  Remove the item, if it is now empty
		self.stopEditing = function (item) {
			item.editing(false);

			if (!item.Title().trim())
			    self.remove(item);
			saveChanges();
		};

        // save changes after item Completed changes
		self.completedChange = function () {
		    saveChanges();
		    return true;
		};
	    
		// count of all completed todos
		self.completedCount = ko.computed(function () {
			return self.todos().count('Completed');
		});

		// count of todos that are not complete
		self.remainingCount = ko.computed(function () {
			return self.todos().length - self.completedCount();
		});

		// writeable computed observable to handle marking all complete/incomplete
		self.allCompleted = ko.computed({
			//always return true/false based on the done flag of all todos
			read: function () {
				return !self.remainingCount();
			},
			// set all todos to the written value (true/false)
			write: function (newValue) {
				ko.utils.arrayForEach(self.todos(), function (todo) {
					// set even if value is the same, as subscribers are not notified in that case
					todo.Completed(newValue);
				});
				saveChanges();
			}
		});

		// helper function to keep expressions out of markup
		self.getLabel = function (count) {
			return ko.utils.unwrapObservable(count) === 1 ? 'item' : 'items';
		};

		function saveChanges() {
		    manager.saveChanges()
                .then(function (result) {
                    toastr.success('Affected count: ' + result.AffectedCount, 'Save succeeded.');
                })
                .fail(function (e) {
                    toastr.error(e.message);
                });
		}
	};

	// bind a new instance of our view model to the page
	var viewModel = new ViewModel();
	ko.applyBindings(viewModel);

	// set up filter routing
	/*jshint newcap:false */
	Router({'/:filter': viewModel.showMode}).init();
})();
