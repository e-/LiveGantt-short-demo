define([
  'LiveGantt/model/MachineType', 
  'LiveGantt/model/Machine', 
  'LiveGantt/model/Operation', 
  'LiveGantt/model/JobType', 
  'LiveGantt/model/OperationType',
  'd3', 
  'util'
  ], function(MachineType, Machine, Operation, JobType, OperationType){
  'use strict';

  var Constants = {
    jobTypeColors         : d3.scale.category20().domain(d3.range(20)),
    unitTimeInterval      : d3.util.minutes(10),
    setupJobTypeId        : -1,
    setupJobTypeColor     : d3.rgb(96, 96, 96),
    setupOperationTypeId  : -1,
    setupOperationId      : -1
  }

  function Schedule(name)
  {
    this.name = name;
    
    this.machineTypes = [];
    this.machines = [];
    this.jobTypes = [];
    this.operationTypes = [];
    this.operations = [];

    this.machineTypeById = {};
    this.machineById = {};
    this.jobTypeById = {};
    this.operationTypeById = {};
    this.operationById = {};

    this.unitTimeInterval = Constants.unitTimeInterval;
    this.setupJobTypeId = Constants.setupJobTypeId;
    this.setupJobTypeColor = Constants.setupJobTypeColor;
    this.setupOperationTypeId = Constants.setupOperationTypeId;
    this.setupOperationId = Constants.setupOperationId;
  }

  Schedule.create = function(json){
    var 
      schedule = new Schedule(json.Name),
      timeParser = d3.time.format('%Y-%m-%d %H:%M:%S'),
      jobTypeIdByOperationTypeId = {};
   
    json.MachineTypes.forEach(function(mt){
      schedule.addMachineType(new MachineType(mt.id, mt.name));
    });
    
    json.OperationTypes.forEach(function(ot){
      jobTypeIdByOperationTypeId[ot.operationTypeId] = ot.jobTypeId;
    });
    
    json.JobTypes.forEach(function(jt){
      schedule.addJobType(new JobType(jt.id, jt.name, false));
    });
    schedule.setupJobType = new JobType(schedule.setupJobTypeId, 'Ch', true);
    schedule.addJobType(schedule.setupJobType);

    json.OperationTypes.sort(function(a,b){return a.id - b.id;}).forEach(function(ot){
      schedule.addOperationType(
        new OperationType(
          ot.id,
          ot.name,
          ot.jobTypeId, 
          ot.machineTypeId, 
          ot.prevOperationTypeId || null, 
          ot.nextOperationTypeId || null,
          schedule
       ))
    });
    schedule.setupOperationType = new OperationType(schedule.setupOperationTypeId, 'Changeover', schedule.setupJobTypeId, null, null, true, schedule);
    schedule.addOperationType(schedule.setupOperationType);


    json.Machines.forEach(function(m){
      schedule.addMachine(new Machine(m.id, m.name, m.machineTypeId, m.number, schedule));
    });

    
    
    json.Operations.forEach(function(o){
      var machine = schedule.machineById[o.machineId];
      schedule.addOperation(new Operation(
        o.id,
        o.operationTypeId,
        machine.id,
        timeParser.parse(o.startAt),
        timeParser.parse(o.endAt),
        schedule
      ));
    });
    
    schedule.initialize();
    return schedule;
  }
  
  Schedule.prototype = {
    addMachineType: function(machineType){
      this.machineTypes.push(machineType);
      this.machineTypeById[machineType.id] = machineType;
    },
    addMachine: function(machine){
      this.machines.push(machine);
      this.machineById[machine.id] = machine;
     
      this.machineTypeById[machine.machineTypeId].addMachine(machine);
    },
    addJobType: function(jobType){
      this.jobTypes.push(jobType);
      this.jobTypeById[jobType.id] = jobType;
    },
    addOperationType: function(operationType){
      this.operationTypes.push(operationType);
      this.operationTypeById[operationType.id] = operationType;
      this.jobTypeById[operationType.jobTypeId].addOperationType(operationType);
    },
    addOperation: function(operation){
      this.operations.push(operation);
      this.operationById[operation.id] = operation;
      this.machineById[operation.machineId].addOperation(operation);
      this.getJobTypeById(operation.operationType.jobTypeId).addOperation(operation);
      this.operationTypeById[operation.operationTypeId].addOperation(operation);
    },
    getJobTypeById: function(id){
      return this.jobTypeById[id];
    },
    getOperationTypeById: function(id){
      return this.operationTypeById[id];
    },
    findMachineByName: function(name){
      var result = this.machines.filter(function(machine){return machine.getName() === name;});
      return result.length ? result[0] : null;
    },
    findJobTypeByName: function(name){
      var result = this.jobTypes.filter(function(jobType){return jobType.getName() === name;});
      return result.length ? result[0] : null;
    },
    findOperationType: function(jobTypeId, machineTypeId, degree){
      var result =  this.operationTypes.filter(function(operationType){
        return operationType.jobTypeId === jobTypeId && operationType.machineTypeId == machineTypeId && operationType.degree === degree;
      });
      return result.length ? result[0] : null;
    },
    initialize: function(json){
      d3.util.timer.start('initialize');
      this.initializeConstants();
      this.initializeOperationTypes();
      this.initializeJobTypeColors();
      this.initializeOperations();
      this.initializeConsOperations();
      this.maxOperationTypeNumber = d3.max(this.jobTypes.map(function(jt){return jt.operationTypes.length;}));
      this.maxMachineNameBytes = d3.max(this.machines.map(function(m){return d3.util.countBytes(m.name);}));
      d3.util.timer.end('initialize');
    },
    initializeConstants: function(){
      this.startAt = d3.min(this.operations, function(op){return op.startAt;});
      this.endAt = d3.max(this.operations, function(op){return op.endAt;});
      this.startAtTime = this.startAt.getTime();
      this.endAtTime = this.endAt.getTime();
    },
    initializeOperationTypes: function(){
      var self = this;
      this.operationTypes.forEach(function(operationType){
        if(operationType.prevOperationTypeId)
          operationType.prevOperationType = self.operationTypeById[operationType.prevOperationTypeId];
        else
          operationType.prevOperationType = undefined;

        if(operationType.nextOperationTypeId)
          operationType.nextOperationType = self.operationTypeById[operationType.nextOperationTypeId];
        else
          operationType.nextOperationType = undefined;
      });

    },
    initializeConsOperations: function(){
      var
          self = this;

      function createConsOperationFromOperation(operation, machine){
        return {
          startAtTime: operation.startAtTime,
          endAtTime: operation.endAtTime,
          jobType: operation.jobType,
          machineType: machine.machineType,
          machine: machine,
          operations: [operation]
        };
      }

      self.machines.forEach(function(machine){
        var prevOperation;
        machine.consOperations = [];
        machine.operations.forEach(function(operation){
          if(!prevOperation) 
            prevOperation = createConsOperationFromOperation(operation, machine);
          else {
            if(prevOperation.endAtTime === operation.startAtTime && prevOperation.jobType === operation.jobType){
              prevOperation.operations.push(operation);
              prevOperation.endAtTime = operation.endAtTime;              
            } else {
              machine.consOperations.push(prevOperation);
              prevOperation = createConsOperationFromOperation(operation, machine);
            }
          }
          ;
        });
        machine.consOperations.push(prevOperation);

        var prevConsOperation;
        machine.consOperations.forEach(function(consOperation){
          if(prevConsOperation) {
            prevConsOperation.next = consOperation;
            consOperation.prev = prevConsOperation;
          }
          prevConsOperation = consOperation;
        });
      });
    },
    initializeQuantities: function(){
      var self = this;
      self.json.ProductionRequirement.forEach(function(re){
        var ot = self.operationTypeById[re.operationTypeId];
        
        ot.newQuantity = ot.quantity = re.quantity;
      });

      self.json.WIP.forEach(function(re){
        var ot = self.operationTypeById[re.operationTypeId];
        
        ot.wip = re.quantity;
      });
    },
    initializeJobTypeColors: function(){
      var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf", "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94", "#f7b6d2", "#dbdb8d", "#9edae5"];
      var count = {}, arr = [], self = this;

      this.operations.forEach(function(operation){
        var jobTypeId = operation.operationType.jobTypeId;
        if(!count[jobTypeId])
          count[jobTypeId] = 0;
        count[jobTypeId]++;
      });
      Object.keys(count).forEach(function(jobTypeId){
        if(jobTypeId != self.setupJobTypeId)
          arr.push([jobTypeId, count[jobTypeId]]);
      });
      arr = arr.sort(function(a,b){return b[0] - a[0];});

      arr.forEach(function(sorted, index){
        self.jobTypeById[sorted[0]].color = colors[index % 18];
      });
      
      self.setupJobType.color = self.setupJobTypeColor;
    },
    initializeOperations: function(){
      var
          self = this,
          prevOperation;

      this.machines.forEach(function(machine){
        prevOperation = null;
        machine.operations.forEach(function(operation){
          if(prevOperation) {
            prevOperation.next = operation;
            operation.prev = prevOperation;
          }
          
          prevOperation = operation;
        });
      });
    },
    getIndex: function(time, interval){
      if(!interval)
        interval = this.unitTimeInterval;
      
      return Math.floor((time - this.startAtTime) / interval);
    },
    getTimeFromIndex: function(index, interval){
      if(!interval)
        interval = this.unitTimeInterval;
      return index * interval + this.startAtTime;
    },
    getAggrTimeInterval: function(timeInterval) {
      var i;
      for(i=0; i<this.aggrTimeIntervals.length; ++i) 
        if(timeInterval < this.aggrTimeIntervals[i][0])
          return this.aggrTimeIntervals[i][1];
    },
    getAggrTimeIndex: function(timeInterval) {
      var i;
      for(i=0; i<this.aggrTimeIntervals.length; ++i) 
        if(timeInterval < this.aggrTimeIntervals[i][0])
          return i;
    }
  };

  return Schedule;
});

