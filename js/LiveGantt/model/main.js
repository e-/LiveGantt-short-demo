define([
  'LiveGantt/model/MachineType',
  'LiveGantt/model/Machine',
  'LiveGantt/model/JobType',
  'LiveGantt/model/OperationType',
  'LiveGantt/model/Operation',
  'LiveGantt/model/Schedule'
], function(
  MachineType,
  Machine,
  JobType,
  OperationType,
  Operation,
  Schedule
) {
  'use strict';

  return {
    MachineType: MachineType,
    Machine: Machine,
    JobType: JobType,
    OperationType: OperationType,
    Operation: Operation,
    Schedule: Schedule
  }
});
