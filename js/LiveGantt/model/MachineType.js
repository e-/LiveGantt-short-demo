define(function(){
  'use strict';

  function MachineType(id, name) {
    this.id = id;
    this.name = name;
    this.machines = [];
  }

  MachineType.prototype = {
    addMachine: function(machine){
      this.machines.push(machine);
    }
  };
  
  return MachineType;
});
