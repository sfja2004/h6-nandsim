
# Requirement specification

**NandSim** - A tool for specifying and simulating integrated circuits with logic gates.

The customer is an integrated circuit chip (ICC) manufacturer. The tool is to be designed used for software developers and as an interaction point between hardware developers and software developers. See the [case description](./case_description.md).

The solution is a visual tool, that both software and hardware developers can use to build and simulate logic circuit models. The models consist of assembled logic gates. To organize complicated logic, the gates of the circuits can be organized into reusable component. The tool can simulate the modelled circuits in an interactive live simulation. Software developers should be able to develop software targetting the modelled circuits, and further be able to execute and test code in the simulation.

The goal is a tool that enable ICC manufacturers, specifically software and hardware developers to design and develop circuit models and embedded software, as to reduce the development time for an ICC solution, by decoupling the software and hardware development processes.

## Requirements

As a developer using this solution, I should be able to:

- **★ assemble logic circuits visually by placing and wiring together primitive logic gates.** This includes a visual editor area, where logic gates and components can be inserted and dragged around, and where each gate and component can be wired together.
- **★ create circuit components build with logic gates that can be used like primitive logic gates.** To help organize and make complex circuits managable, sub sections of a circuit can be encapsulated in a component.
- **★ simulate the logic of a circuit.** A simulation conists of initializing a state according to the circuit and the inputs given. The simulation should be continous, and support simulating state dependent on a previous state.
- **★ interact visually with a simulation of a circuit.** The simulation should support updating the state according to any changes made to the circuit.
- **upload files with data input for complex circuits, including program and data files in suitable file formats such as binary or hexademical.** The purpose is to enable flashing of a simulated circuit with data and programs to be used in the simulation.
- **monitor complex circuit output in suitable formats such as base 10 displays, hexademical or ASCII text.** To be able to monitor the produced outputs of a simulated circuits, the tools should have ways to display outputs appropriately.
- **create and export component libraries.** Components created in one project should also be usable in other projects.
- **save projects in the cloud with a user account.** Projects can be stored in the cloud using user accounts. With the same user account, projects can be accessed, edited and saved on multiple computers.
- **collaborate with others using cloud projects and multiple user accounts.** Multiple people can collaborate on the same project, each using their own user account. This includes a strategy for work synchronization and work conflict resolution.

★ marked requirements demarcate the minimum viable product.

## Non-functional requirements

TBD

## Delimination

TBD

