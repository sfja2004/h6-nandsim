export class Circuit {
    constructor(
        private comps: Component[],
        private inputComps: Component[],
        private pins: Pin[],
        private pinConsumers: Map<Pin, Component[]>,
        private pinInCount: number,
        private pinOutCount: number,
    ) {}

    createState(): State {
        return new State(this.pins, this.pinInCount, this.pinOutCount);
    }

    simulate(state: State) {
        const queue: Component[] = [];
        for (const comp of this.inputComps) {
            queue.push(comp);
        }

        while (queue.length) {
            const comp = queue.shift()!;
            comp.simulate(state);

            for (const pin of comp.outputs) {
                queue.push(...this.pinConsumers.get(pin)!);
            }
        }
    }
}

export class Component {
    constructor(
        public kind: ComponentKind,
        public inputs: (Pin | null)[],
        public outputs: Pin[],
    ) {}

    simulate(state: State) {
        const k = this.kind;
        switch (k.tag) {
            case "PinIn": {
                state.setPin(this.outputs[0], state.getIn(k.idx));
                break;
            }
            case "PinOut": {
                state.setOut(k.idx, state.getPin(this.inputs[0]));
                break;
            }
            case "Nand": {
                const lhs = state.getPin(this.inputs[0]);
                const rhs = state.getPin(this.inputs[1]);
                state.setPin(
                    this.outputs[0],
                    !(lhs && rhs),
                );
                break;
            }
            default:
                throw new Error(`not handled (${k})`);
        }
    }
}

export type ComponentKind =
    | { tag: "PinIn" | "PinOut"; idx: number }
    | { tag: "Nand" };

export class Pin {
    constructor() {}
}

export class State {
    private pinsHigh = new Set<Pin>();
    private pinsInHigh = new Set<number>();
    private pinsOutHigh = new Set<number>();

    constructor(
        private pins: Pin[],
        private pinInCount: number,
        private pinOutCount: number,
    ) {}

    getPin(pin: Pin | null): boolean {
        return pin !== null && this.pinsHigh.has(pin);
    }
    setPin(pin: Pin, value: boolean) {
        if (value) {
            this.pinsHigh.add(pin);
        } else {
            this.pinsHigh.delete(pin);
        }
    }

    getIn(idx: number): boolean {
        return this.pinsInHigh.has(idx);
    }
    setIn(idx: number, value: boolean) {
        if (value) {
            this.pinsInHigh.add(idx);
        } else {
            this.pinsInHigh.delete(idx);
        }
    }

    getOut(idx: number): boolean {
        return this.pinsOutHigh.has(idx);
    }
    setOut(idx: number, value: boolean) {
        if (value) {
            this.pinsOutHigh.add(idx);
        } else {
            this.pinsOutHigh.delete(idx);
        }
    }

    prettyPrint() {
        console.log(
            `inputs:  [${
                new Array(this.pinInCount)
                    .fill(0)
                    .map((_, i) => this.pinsInHigh.has(i) ? 1 : 0)
                    .map((v) => v.toString())
                    .join(", ")
            }]`,
        );
        console.log(
            `outputs: [${
                new Array(this.pinOutCount)
                    .fill(0)
                    .map((_, i) => this.pinsOutHigh.has(i) ? 1 : 0)
                    .map((v) => v.toString())
                    .join(", ")
            }]`,
        );
        console.log(
            `state:   [${
                new Array(this.pins.length)
                    .fill(0)
                    .map((_, i) => this.pinsHigh.has(this.pins[i]) ? 1 : 0)
                    .map((v) => v.toString())
                    .join(", ")
            }]`,
        );
    }
}

export class CircuitBuilder {
    private comps: Component[] = [];
    private inputComps: Component[] = [];
    private pins: Pin[] = [];
    private pinInCount = 0;
    private pinOutCount = 0;

    build(): Circuit {
        const pinConsumers = new Map<Pin, Component[]>();

        for (const pin of this.pins) {
            pinConsumers.set(pin, []);
        }
        for (const comp of this.comps) {
            for (const pin of comp.inputs) {
                if (!pin) {
                    continue;
                }
                pinConsumers.get(pin)!.push(comp);
            }
        }

        return new Circuit(
            this.comps,
            this.inputComps,
            this.pins,
            pinConsumers,
            this.pinInCount,
            this.pinOutCount,
        );
    }

    addPinIn(): Component {
        const idx = this.pinInCount;
        this.pinInCount += 1;
        const comp = this.addComponent({ tag: "PinIn", idx }, 0, 1);
        this.inputComps.push(comp);
        return comp;
    }

    addPinOut(): Component {
        const idx = this.pinOutCount;
        this.pinOutCount += 1;
        return this.addComponent({ tag: "PinOut", idx }, 1, 0);
    }

    addNand(): Component {
        return this.addComponent({ tag: "Nand" }, 2, 1);
    }

    private addComponent(
        kind: ComponentKind,
        inputCount: number,
        outputCount: number,
    ) {
        const inputs = new Array(inputCount).fill(null);
        const outputs = new Array(outputCount).fill(0).map(() => new Pin());
        const comp = new Component(kind, inputs, outputs);
        this.comps.push(comp);
        this.pins.push(...outputs);
        return comp;
    }
}
