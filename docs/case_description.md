
# Case description

**Logic simulator for integrated circuits**

We are Kim's Chips (Intel, AMD, Atmel, ST Microcontrollers, etc.). As an integrated circuit manufacturer we develop and produce integrated circuit solutions. These solutions consist both of physical hardware in the form of silicon chips and embedded software.

Integrated circuits are electrical circuits built into silicon chips. Silicon chips use semiconductor technology and are manufactured using lithography technology. In addition to the hardware, integrated circuits are also sold with accompanying embedded software. The embedded software provides support, so that the customers can write their specific applications on top.

The development process of integrated curcuits consist there both of designing the actual hardware, but also development of the embedded software. An inefficiency arises in the development process. The issue is that development of the embedded software has to take place after both design and production of the physical hardware. This is because the software can't be run or tested without the hardware. This makes the software development process dependent on the hardware production process. Because of this, the software development process cannot be done in parallel with the hardware development or production, it has to be done afterwards. It would be beneficial, if this process could be done in parallel.

Logic circuits are circuits of logic gates. Logic circuits can be used as an abstraction of electrical circuits for integrated circuits. For complex chip designs, logic circuits are used as the primary medium for designing the chip. In addition to being used for designing the integrated circuit, a logic circuit can also be used for simulations.

Because logic circuits can be used for simulations, they can also enable testing of embedded software. If you therefore can build a chip as a logic circuit, you can simulate the chip, and run and test software on the simulated chip. Using this method, the embedded software development process can be decoupled as to be independent from the hardware development and production process.

For this purpose, we would like a software solution that enables us as chip manufacturers to design and specify logic circuits as to simulate hardware chips to run embedded software. The circuits should be specified by assembling logic gates. We would like a visual tool for assembling and organizing logic gates. The tool should be able to simulate a specified circuit. We want the simulation to be a live simulation, were we can interactively test software and interact with the circuit.


## Case 1: Demonstrate the behavoir of a 4-bit full adder

Chip development involved designing the schematic of various complex logic components. One such component could be a 4-bit full adder. The simulator needs to be able to demonstrate that the behavior of a specific schematic for complex component, in this case a 4-bit full adder, is correct and will work in practice.

Given a schematic of a 4-bit full adder, the system has to provide functionality to wire together components according to the schematic. When the circuit wiring is done, the system has simulate the behavior of the component correctly and interactively. The simulator should demonstrate the the 4-bit full adder can add numbers correctly, for example that 3 + 5 = 8.

## Case 2: Demonstrate the correctness of a piece of microcode for a 7-segment display encoder

Often, a chip needs certain programs of microcode. Microcode are pieces of code or data that are used internally in chips. A schematic of a 7-segment display encoder can utilize a ROM component for the encoding itself. ROM (read-only memory) components, and memory components generally, function by associating address bits with data bits. A 7-segment display (in this instance) takes as input the state of each of the 7 segments.

Using 2 4-bit ROM components (4-bit address and value) an encoder can be made that translates the binary bit values of the integers 0 to 15 to their corrosponding 7-segment pin combinations. The system has to provide functionality for such a component to be designed so that microcode can be tested on it.

