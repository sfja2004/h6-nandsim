import type { V2 } from "./V2";

export type Event =
  | { tag: "MouseDown" | "MouseUp"; pos: V2 }
  | { tag: "MouseMove"; pos: V2; deltaPos: V2 }
  | { tag: "MouseLeave" }
  | { tag: "MouseClick" | "MouseDoubleClick"; pos: V2 }
  | {
      tag:
        | "MouseDragBegin"
        | "MouseDrag"
        | "MouseDoubleDragBegin"
        | "MouseDoubleDrag";
      pos: V2;
      deltaPos: V2;
    }
  | { tag: "KeyDown" | "KeyUp"; key: string }
  | { tag: "SelectTool" | "ShowSelectedTool"; tool: string };

export type EventOf<Tag extends Event["tag"]> = Event & { tag: Tag };

export type EventUnsub = () => void;
export type EventAction = (event: Event) => void;

export class EventBus {
  private eventActionsMap = new Map<Event["tag"], Set<EventAction>>();
  private actionEventsMap = new Map<EventAction, Event["tag"][]>();

  subscribe<Tags extends Event["tag"]>(
    tags: Tags[],
    action: (event: EventOf<Tags>) => void,
  ): EventUnsub {
    this.addSubscriber<Tags>(tags, action as EventAction);
    return () => {
      this.removeSubscriber(action as EventAction);
    };
  }

  private addSubscriber<Tags extends Event["tag"]>(
    tags: Tags[],
    action: EventAction,
  ) {
    if (this.actionEventsMap.has(action)) {
      throw new Error("action was added twice without cleanup");
    }
    this.actionEventsMap.set(action, tags);

    for (const tag of tags) {
      if (!this.eventActionsMap.has(tag)) {
        this.eventActionsMap.set(tag, new Set());
      }
      this.eventActionsMap.get(tag)!.add(action);
    }
  }

  private removeSubscriber(action: EventAction) {
    if (!this.actionEventsMap.has(action)) {
      throw new Error("action was already cleaned up");
    }
    for (const tag of this.actionEventsMap.get(action)!) {
      this.eventActionsMap.get(tag)?.delete(action);
    }
    this.actionEventsMap.delete(action);
  }

  send(event: Event) {
    const actionSet = this.eventActionsMap.get(event.tag);
    if (!actionSet) {
      return;
    }
    const actions = [...actionSet];
    for (const action of actions) {
      if (!this.actionEventsMap.has(action)) {
        // has been unsubscribed by prior action
        continue;
      }
      action(event);
    }
  }
}
