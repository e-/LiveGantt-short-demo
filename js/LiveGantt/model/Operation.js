define(function(){
  'use strict';

  function Operation(id, operationTypeId, machineId, startAt, endAt, schedule){
    this.id = id;
    this.operationTypeId = operationTypeId;
    this.machineId = machineId;
    this.startAt = startAt;
    this.endAt = endAt;
    this.startAtTime = startAt.getTime();
    this.endAtTime = endAt.getTime();
    this.isSetup = id == schedule.setupOperationId;
    this.machine = schedule.machineById[machineId];
    this.operationType = schedule.operationTypeById[operationTypeId];

    this.jobType = this.operationType.jobType;
    this.jobTypeId = this.jobType.id;
  }
  
  return Operation;
});

