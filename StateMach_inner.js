class StateMach {
    curState = null;
    states = {};
    constructor() {
        this.curState = 'wait';
        this.states = {};
    };

    add(state, func) { 
        //this.states[state] = func;
        this.states[state] = func;
    };
    do() {
        if (!this.curState){
            return;
        }

        this.curState = this.states[this.curState]();
    };
    setState(state) {
        console.log('set state:', state);
        this.curState = state;
    };
    callFunc(funcName, args) {
        return this.states[funcName](args);
    }
};