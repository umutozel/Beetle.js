/*global todomvc, angular */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
todomvc.controller('TodoCtrl', function TodoCtrl($scope, $location) {
	var manager = $scope.manager = new beetle.EntityManager(new beetle.MvcService('Home'));
	manager.ready(function () {
		$scope.newTodo = '';
		$scope.editedTodo = null;
		var todos = [];
		$scope.getTodos = function() {
			manager.createQuery('Todos')
				.then(function (result) {
					todos = $scope.todos = result;
					updateCounts();
					$scope.$apply();
				}, function (e) {
					toastr.error(e.message);
				});
		};
		$scope.getTodos();

		if ($location.path() === '')
			$location.path('/');

		$scope.location = $location;

		$scope.$watch('location.path()', function (path) {
			$scope.statusFilter = (path === '/active') ?
			{ Completed: false } : (path === '/completed') ?
			{ Completed: true } : null;
		});

		$scope.addTodo = function () {
			var newTodo = $scope.newTodo.trim();
			if (newTodo) {
				var todo = manager.createEntity('Todo');
				todo.Title = newTodo;
				$scope.todos.push(todo);
				$scope.newTodo = '';
				saveChanges();
			}
		};

		$scope.editTodo = function (todo) {
			$scope.editedTodo = todo;
		};

		$scope.doneEditing = function (todo) {
			if (!todo.Title)
				$scope.removeTodo(todo);
			$scope.editedTodo = null;
			saveChanges();
		};

		$scope.revertEditing = function (todo) {
			todo.$tracker.undoChanges();
		};

		$scope.removeTodo = function (todo) {
			manager.deleteEntity(todo);
			$scope.todos.splice($scope.todos.indexOf(todo), 1);
			saveChanges();
		};

		$scope.clearCompletedTodos = function () {
			for (var i = $scope.todos.length - 1; i >= 0; i--) {
				var todo = $scope.todos[i];
				if (todo.Completed) {
					$scope.todos.splice(i, 1);
					manager.deleteEntity(todo);
				}
			}
			saveChanges();
		};

		$scope.markAll = function (completed) {
			todos.forEach(function (todo) {
				todo.Completed = completed;
			});
			saveChanges();
		};

		function saveChanges() {
			manager.saveChanges()
				.then(function (result) {
					updateCounts();
					$scope.$apply();
					toastr.success('Affected count: ' + result.AffectedCount, 'Save succeeded.');
				}, function (e) {
					toastr.error(e.message);
					$scope.$apply();
				});
		}

		function updateCounts() {
			$scope.remainingCount = $scope.todos.count('Completed == false');
			$scope.completedCount = $scope.todos.length - $scope.remainingCount;
			$scope.allChecked = !$scope.remainingCount;
		}
	});
});
