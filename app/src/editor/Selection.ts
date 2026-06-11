import type { Component, Joint } from "./Board";
import type { V2 } from "./V2";

export class Selection {
  private selectedComponents = new Set<Component>();
  private selectedJoints = new Set<Joint>();

  addComponent(comp: Component) {
    this.selectedComponents.add(comp);
  }
  addJoint(joint: Joint) {
    this.selectedJoints.add(joint);
  }

  toggleComponent(comp: Component) {
    if (this.selectedComponents.has(comp)) {
      this.selectedComponents.delete(comp);
    } else {
      this.selectedComponents.add(comp);
    }
  }
  toggleJoint(joint: Joint) {
    if (this.selectedJoints.has(joint)) {
      this.selectedJoints.delete(joint);
    } else {
      this.selectedJoints.add(joint);
    }
  }

  isComponentSelected(comp: Component) {
    return this.selectedComponents.has(comp);
  }
  isJointSelected(joint: Joint) {
    return this.selectedJoints.has(joint);
  }

  move(deltaPos: V2) {
    for (const comp of this.selectedComponents) {
      comp.pos = comp.pos.add(deltaPos);
    }
    for (const joint of this.selectedJoints) {
      joint.pos = joint.pos.add(deltaPos);
    }
  }
}
