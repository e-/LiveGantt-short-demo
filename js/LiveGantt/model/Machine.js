define(function(){
  'use strict';

  function Machine(id, name, machineTypeId, number, schedule) {
    this.id = id;
    this.name = name;
    this.machineTypeId = machineTypeId;
    this.number = number;
    this.machineType = schedule.machineTypeById[machineTypeId];

    this.operations = [];
    this.schedule = schedule;
  }

  Machine.prototype = {
    addOperation: function(operation){
      this.operations.push(operation);
    },
    getPrevConsOperation: function(focusAtTime){
      var
          self = this,
          i, 
          length = self.consOperations.length,
          consOperation

      for(i=length-1; i>=0; --i){
        consOperation = self.consOperations[i];
        if(focusAtTime > consOperation.endAtTime) {
          return {
            focused: false,
            finished: false,
            operation: consOperation
          };
        } else if(consOperation.startAtTime <= focusAtTime && focusAtTime < consOperation.endAtTime) {
          return {
            focused: true,
            finished: false,
            operation: consOperation
          }
        }
      }
      return {
        focused: false,
        finished: true,
        operation: null
      }
    },
    getConsOperation: function(focusAtTime){
      var
          self = this,
          i, 
          length = self.consOperations.length,
          consOperation

      for(i=0;i<length;++i){
        consOperation = self.consOperations[i];
        if(focusAtTime < consOperation.startAtTime) {
          return {
            focused: false,
            finished: false,
            operation: consOperation
          };
        } else if(consOperation.startAtTime <= focusAtTime && focusAtTime < consOperation.endAtTime) {
          return {
            focused: true,
            finished: false,
            operation: consOperation
          }
        }
      }
      return {
        focused: false,
        finished: true,
        operation: null
      }
    },
    getEndAtTime: function(){
      var len = this.operations.length;
      return this.operations[len - 1].endAtTime;
    }
  };

  return Machine;
});
