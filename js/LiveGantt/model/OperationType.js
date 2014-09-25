define(['d3'], function(){
  'use strict';

  function OperationType(id, name, jobTypeId, machineTypeId, prevOperationTypeId, nextOperationTypeId, schedule){
    this.id = id;
    this.name = name;
    this.jobTypeId = jobTypeId;
    this.machineTypeId = machineTypeId;
    this.prevOperationTypeId = prevOperationTypeId;
    this.nextOperationTypeId = nextOperationTypeId;
   
    this.jobType = schedule.jobTypeById[jobTypeId];
    this.machineType = schedule.machineTypeById[machineTypeId];

    this.operations = [];
  }

  OperationType.prototype = {
    addOperation: function(operation){
      this.operations.push(operation);
    }
  };

  return OperationType;
});
