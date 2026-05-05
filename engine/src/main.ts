import { CircuitBuilder } from "./circuit.ts";

const builder = new CircuitBuilder();

const i0 = builder.addPinIn();
const i1 = builder.addPinIn();
const o0 = builder.addPinOut();

const and = builder.addNand();

and.inputs[0] = i0.outputs[0];
and.inputs[1] = i1.outputs[0];

o0.inputs[0] = and.outputs[0];

const circuit = builder.build();

const state = circuit.createState();

state.setIn(0, true);
state.setIn(1, true);

console.log("-- before --");
state.prettyPrint();

circuit.simulate(state);

console.log("-- after --");
state.prettyPrint();

