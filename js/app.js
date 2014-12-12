"use strict";

//On Ready
function onReady() {
    document.getElementById("comment-form").addEventListener("submit", onSubmit);

    function onSubmit(evt) {
        evt.returnValue = validateForm(this);
        if (evt.returnValue == false && evt.preventDefault) {
            evt.preventDefault();
        }
        return evt.returnValue;
    } //onSubmit()

    function validateForm(form) {
        var requiredFields = ['name', 'title', 'comment'];
        var formValid = true;

        for(var i = 0; i < requiredFields.length; i++) {
            formValid &= validateRequiredField(form.elements[requiredFields[i]]);
        }
        return formValid;
    } //validateForm()

    function validateRequiredField(field) {
        var value = field.value.trim();
        var valid = value.length > 0;
        if(valid) {
            field.className = "form-control";
        }
        else {
            field.className = "form-control invalid-field";
        }
        return valid;
    }
}


//this is the base URL for all task objects managed by your application
//requesting this with a GET will get all tasks objects
//sending a POST to this will insert a new task object
//sending a PUT to this URL + '/' + task.objectId will update an existing task
//sending a DELETE to this URL + '/' + task.objectId will delete an existing task
var commentUrl = 'https://api.parse.com/1/classes/comments';
angular.module('CommentApp', ['ui.bootstrap'])
	.config(function($httpProvider) {
		$httpProvider.defaults.headers.common['X-Parse-Application-Id'] = '8NBsWLumxSdY1iLaGOWHw9o5oJlABSpy55ctEPYD';
		$httpProvider.defaults.headers.common['X-Parse-REST-API-Key'] = 'jnD5eTuYYBNEy4E2opqTl2wwqGZKXVH2VnRuyDiO';
	})
    .controller('CommentsController', function($scope, $http) {
        $scope.refreshComments = function() {
            $scope.loading = true;
            $http.get(commentUrl + '?order=-votes').success(function(data) {
                $scope.comments = data.results;
                if(data.results.length == 0) {
                    $scope.isEmpty = true;
                }
                else {
                    $scope.isEmpty = false;
                }
            }).error(function(err) {
                $scope.errorMessage = err;
                console.log(err);
                //notify user in some way
            }).finally(function() {
                $scope.loading = false;
            });
        };
         //call refreshComments() to get the initial set of comments on page load
        $scope.refreshComments();
        //initialize a new comment object on the scope for the new comment form
        $scope.newComments = {
            title: '',
            name: '',
            comment: '',
            ratings: null
        };

        //checks if comments are not filled; else add comment
        $scope.addComments = function() {
            document.getElementById("rating-message").style.display = "none";
            if($scope.newComments.title == '' || $scope.newComments.name == '' || $scope.newComments.comment == '' ||
                $scope.newComments.ratings == null) {
                if($scope.newComments.ratings == null) {
                    document.getElementById("rating-message").style.display = "inline";
                    document.getElementById("rating-message").style.color = "red";
                    document.getElementById("rating-message").innerHTML = "Don't forget the stars!";
                }
                return;
            }
            else {
                $http.post(commentUrl, $scope.newComments).success(function(responseData) {
                    $scope.newComments.objectId = responseData.objectId;
                    $scope.comments.push($scope.newComments);
                    $scope.isEmpty = false;
                    $scope.newComments = {
                        title: '',
                        name: '',
                        comment: '',
                        ratings: null
                    };
                }).error(function (err) {
                    $scope.errorMessage = err;
                });
            }
        };

        //deletes comment and refreshes
        $scope.deleteComment = function(comment) {
            $http.delete(commentUrl + '/' + comment.objectId).success(function() {
                $scope.refreshComments();
            }).error(function(err) {
                $scope.errorMessage = err;
            });
        };

        //incremental increase of vote; if 0 then can no longer go lower
        $scope.incrementVotes = function(comment, amount) {
            if(!(comment.votes == 0 && amount < 0)) {
            var postData = {
                votes: {
                    __op: "Increment",
                    amount: amount
                }
            };
            $scope.updating = true;
            $http.put(commentUrl + '/' + comment.objectId, postData)
                .success(function(respData) {
                    comment.votes = respData.votes;
                })
                .error(function(err) {
                    console.log(err);
                })
                .finally(function() {
                    $scope.updating = false;
                });
            }
        };
});

document.addEventListener('DOMContentLoaded', onReady);