declare module 'circomlibjs' {
    interface Poseidon {
      (inputs: any[]): any;
      F: {
        toObject(value: any): any;
      };
    }
    
    function buildPoseidon(): Promise<Poseidon>;
    export { buildPoseidon };
  }