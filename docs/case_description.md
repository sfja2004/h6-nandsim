
# Case description

**Logic simulator for integrated circuits**

We are Kim's Chips (Intel, AMD, Atmel, ST Microcontrollers, etc.). As an integrated circuit manufacturer we develop and produce integrated circuit solutions. These solutions consist both of physical hardware in the form of silicon chips and embedded software.

Integrated circuits are electrical circuits built into silicon chips. Silicon chips use semiconductor technology and are manufactured using lithography technology. In addition to the hardware, integrated circuits are also sold with accompanying embedded software. The embedded software provides support, so that the customers can write their specific applications on top.

The development process of integrated curcuits consist there both of designing the actual hardware, but also development of the embedded software. An inefficiency arises in the development process. The issue is that development of the embedded software has to take place after both design and production of the physical hardware. This is because the software can't be run or tested without the hardware. This makes the software development process dependent on the hardware production process. Because of this, the software development process cannot be done in parallel with the hardware development or production, it has to be done afterwards. It would be beneficial, if this process could be done in parallel.

Logic circuits are circuits of logic gates. Logic circuits can be used as an abstraction of electrical circuits for integrated circuits. For complex chip designs, logic circuits are used as the primary medium for designing the chip. In addition to being used for designing the integrated circuit, a logic circuit can also be used for simulations.

Because logic circuits can be used for simulations, they can also enable testing of embedded software. If you therefore can build a chip as a logic circuit, you can simulate the chip, and run and test software on the simulated chip. Using this method, the embedded software development process can be decoupled as to be independent from the hardware development and production process.

For this purpose, we would like a software solution that enables us as chip manufacturers to design and specify logic circuits as to simulate hardware chips to run embedded software. The circuits should be specified by assembling logic gates. We would like a visual tool for assembling and organizing logic gates. The tool should be able to simulate a specified circuit. We want the simulation to be a live simulation, were we can interactively test software and interact with the circuit.



