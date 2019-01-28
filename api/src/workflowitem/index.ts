import { getAllowedIntents } from "../authz";
import { userIdentities } from "../project";
import { User } from "./User";
import {
  isWorkflowitemClosable,
  redactHistoryEvent,
  redactWorkflowitem,
  removeEventLog,
  ScrubbedWorkflowitem,
  sortWorkflowitems,
  Workflowitem,
} from "./Workflowitem";

export * from "./Workflowitem";
export * from "./User";

export type CloseNotifier = (projectId, subprojectId, workflowitemId, actingUser) => Promise<void>;
export type ListReader = () => Promise<Workflowitem[]>;
export type OrderingReader = () => Promise<string[]>;
export type Closer = (
  projectId: string,
  subprojectId: string,
  workflowitemId: string,
) => Promise<void>;

export async function getAllScrubbedItems(
  asUser: User,
  {
    getAllWorkflowitems,
    getWorkflowitemOrdering,
  }: { getAllWorkflowitems: ListReader; getWorkflowitemOrdering: OrderingReader },
): Promise<ScrubbedWorkflowitem[]> {
  const workflowitemOrdering = await getWorkflowitemOrdering();
  const workflowitems = await getAllWorkflowitems();
  const sortedWorkflowitems = await sortWorkflowitems(workflowitems, workflowitemOrdering);
  const scrubbedWorkflowitems = await sortedWorkflowitems.map(workflowitem => {
    workflowitem.log.map(historyevent =>
      redactHistoryEvent(
        historyevent,
        getAllowedIntents(userIdentities(asUser), workflowitem.permissions),
      ),
    );
    return redactWorkflowitem(workflowitem, asUser);
  });

  return scrubbedWorkflowitems.map(removeEventLog);
}

export async function close(
  closingUser: User,
  projectId: string,
  subprojectId: string,
  workflowitemId: string,
  {
    getOrdering,
    getWorkflowitems,
    closeWorkflowitem,
    notify,
  }: {
    getOrdering: OrderingReader;
    getWorkflowitems: ListReader;
    closeWorkflowitem: Closer;
    notify: CloseNotifier;
  },
): Promise<void> {
  const workflowitemOrdering = await getOrdering();
  const workflowitems = await getWorkflowitems();
  const sortedWorkflowitems = sortWorkflowitems(workflowitems, workflowitemOrdering);
  const closingWorkflowitem: Workflowitem | undefined = sortedWorkflowitems.find(
    item => item.id === workflowitemId,
  );
  isWorkflowitemClosable(workflowitemId, closingUser, sortedWorkflowitems);

  await closeWorkflowitem(projectId, subprojectId, workflowitemId);
<<<<<<< HEAD
  await notify(projectId, subprojectId, closingWorkflowitem, closingUser);
=======
  console.log("Notifying user...");
  await notify(projectId, subprojectId, closingWorkflowitem, closingUser);
  console.log("User notified");
>>>>>>> ecdf4b352f4da0f4da2fb58ab3632634134ad2a8
}
