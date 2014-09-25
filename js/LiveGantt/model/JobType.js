define(function(){
  'use strict';

  function JobType(id, name, isSetup){
    this.id = id;
    this.name = name;
    this.isSetup = isSetup;

    this.operationTypes = [];
    this.operations = [];
  }

  JobType.prototype = {
    addOperationType: function(operationType){
      this.operationTypes.push(operationType);
    },
    addOperation: function(operation){
      this.operations.push(operation);
    },
    getStartAt: function(){
      return d3.min(this.operations.map(function(operation){return operation.startAt;}));
    },
    getEndAt: function(){
      return d3.max(this.operations.map(function(operation){return operation.endAt;}))
    }
  };

  return JobType;
});
